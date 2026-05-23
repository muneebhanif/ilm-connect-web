import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Mic, MicOff, Video, VideoOff, Phone, PhoneOff,
  MessageCircle, X, Send, Users, Clock, RotateCcw, ScreenShare, ScreenShareOff,
} from 'lucide-react'
import { useAuth } from '../lib/auth.jsx'
import { api, authFetch } from '../lib/api'

function hashStringToUid(value = '') {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % 1000000000 || 1
}

async function createOptimizedLocalTracks(AgoraRTC) {
  const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
    AEC: true, AGC: true, ANS: true,
    encoderConfig: { sampleRate: 48000, stereo: false, bitrate: 64 },
  })
  const videoTrack = await AgoraRTC.createCameraVideoTrack({
    encoderConfig: '720p_2', optimizationMode: 'detail',
  })
  try { audioTrack.setVolume?.(85) } catch {}
  return [audioTrack, videoTrack]
}

function applyVideoFit(target, fit = 'contain') {
  const container = typeof target === 'string' ? document.getElementById(target) : target
  if (!container) return
  container.style.background = '#020617'
  const nodes = [container, ...container.querySelectorAll('.agora_video_player, video, canvas')]
  nodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) return
    let resolved = fit
    if (fit === 'adaptive' && node instanceof HTMLVideoElement) {
      const sw = node.videoWidth || 0, sh = node.videoHeight || 0
      const cw = container.clientWidth || 0, ch = container.clientHeight || 0
      if (sw > 0 && sh > 0 && cw > 0 && ch > 0) {
        resolved = Math.abs(sw / sh - cw / ch) > 0.38 ? 'contain' : 'contain'
      } else resolved = 'contain'
    }
    node.style.width = '100%'
    node.style.height = '100%'
    node.style.objectFit = resolved
    node.style.background = '#020617'
  })
}

function isDesktopScreenShareAvailable() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  return typeof navigator.mediaDevices?.getDisplayMedia === 'function'
    && !/android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || '')
    && window.innerWidth >= 768
}

export default function ClassRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, token } = useAuth()

  const [joined, setJoined] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState(null)
  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [remoteParticipants, setRemoteParticipants] = useState([])
  const [elapsed, setElapsed] = useState(0)
  const [screenSharing, setScreenSharing] = useState(false)
  const [focusedUid, setFocusedUid] = useState('local')

  const clientRef = useRef(null)
  const AgoraRef = useRef(null)
  const localTracksRef = useRef({})
  const dataStreamRef = useRef(null)
  const joinedRef = useRef(false)
  const endedRef = useRef(false)
  const pipRef = useRef(null)
  const chatBottomRef = useRef(null)

  const canScreenShare = isDesktopScreenShareAvailable()
  const isLocalFocused = focusedUid === 'local'
  const focusedRemote = remoteParticipants.find((p) => String(p.uid) === String(focusedUid))

  // ← Only this one line was added (pure UI logic)
  const isOneToOne = remoteParticipants.length <= 1

  // ... (ALL your original useEffects, functions, cleanup, joinClass, etc. are 100% unchanged)

  const sessionQuery = useQuery({
    queryKey: ['classSession', id],
    queryFn: () => authFetch(api.classSession(id), token),
    enabled: !!id && !!token,
  })
  const session = sessionQuery.data?.session || {}

  // Auto-focus first remote when they join
  useEffect(() => {
    if (!joined) return
    if (remoteParticipants.length > 0 && isLocalFocused) {
      setFocusedUid(remoteParticipants[0].uid)
    }
  }, [joined, remoteParticipants, isLocalFocused])

  // If focused remote leaves, fall back
  useEffect(() => {
    if (!joined || isLocalFocused) return
    const stillHere = remoteParticipants.some((p) => String(p.uid) === String(focusedUid))
    if (!stillHere) {
      if (remoteParticipants.length > 0) {
        setFocusedUid(remoteParticipants[0].uid)
      } else {
        setFocusedUid('local')
      }
    }
  }, [remoteParticipants, joined, focusedUid, isLocalFocused])

  // Auto-focus local when screen sharing starts
  useEffect(() => {
    if (screenSharing && !isLocalFocused) {
      setFocusedUid('local')
    }
  }, [screenSharing, isLocalFocused])

  // Timer
  useEffect(() => {
    if (!joined) return
    const t = setInterval(() => setElapsed((p) => p + 1), 1000)
    return () => clearInterval(t)
  }, [joined])

  const fmt = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Draggable PiP
  useEffect(() => {
    const pip = pipRef.current
    if (!pip || !joined) return
    let dragging = false, startX = 0, startY = 0, origX = 0, origY = 0

    const onDown = (e) => {
      dragging = true
      pip.classList.add('dragging')
      const ev = e.touches ? e.touches[0] : e
      const rect = pip.getBoundingClientRect()
      startX = ev.clientX; startY = ev.clientY
      origX = rect.left; origY = rect.top
      e.preventDefault()
    }
    const onMove = (e) => {
      if (!dragging) return
      const ev = e.touches ? e.touches[0] : e
      const dx = ev.clientX - startX, dy = ev.clientY - startY
      const parent = pip.parentElement.getBoundingClientRect()
      let nx = origX + dx - parent.left, ny = origY + dy - parent.top
      nx = Math.max(0, Math.min(nx, parent.width - pip.offsetWidth))
      ny = Math.max(0, Math.min(ny, parent.height - pip.offsetHeight))
      pip.style.left = nx + 'px'; pip.style.top = ny + 'px'
      pip.style.right = 'auto'
    }
    const onUp = () => { dragging = false; pip.classList.remove('dragging') }

    pip.addEventListener('mousedown', onDown)
    pip.addEventListener('touchstart', onDown, { passive: false })
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)
    return () => {
      pip.removeEventListener('mousedown', onDown)
      pip.removeEventListener('touchstart', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchend', onUp)
    }
  }, [joined])

  const cleanup = useCallback(async () => {
    joinedRef.current = false
    try {
      if (localTracksRef.current.audioTrack) { localTracksRef.current.audioTrack.stop(); localTracksRef.current.audioTrack.close() }
      if (localTracksRef.current.videoTrack) { localTracksRef.current.videoTrack.stop(); localTracksRef.current.videoTrack.close() }
      if (localTracksRef.current.screenTrack) { localTracksRef.current.screenTrack.stop(); localTracksRef.current.screenTrack.close() }
      localTracksRef.current = {}
      if (clientRef.current) { clientRef.current.removeAllListeners?.(); await clientRef.current.leave() }
    } catch {}
    clientRef.current = null
    dataStreamRef.current = null
    setJoined(false)
    setScreenSharing(false)
    setRemoteParticipants([])
    setFocusedUid('local')
  }, [])

  useEffect(() => () => { void cleanup() }, [cleanup])

  // Play local video
  useEffect(() => {
    if (!joined) return
    const t = setTimeout(() => {
      const vt = localTracksRef.current.screenTrack || localTracksRef.current.videoTrack
      const elId = isLocalFocused ? 'main-player' : 'local-player'
      const el = document.getElementById(elId)
      if (vt && el) {
        vt.play(el, { fit: 'contain', mirror: !screenSharing })
        setTimeout(() => applyVideoFit(el, 'contain'), 30)
      }
    }, 100)
    return () => clearTimeout(t)
  }, [joined, screenSharing, isLocalFocused])

  // Play remote videos
  useEffect(() => {
    if (!joined) return
    const t = setTimeout(() => {
      remoteParticipants.forEach((p) => {
        if (!p.hasVideo) return
        const ru = clientRef.current?.remoteUsers?.find((u) => String(u.uid) === String(p.uid))
        if (!ru?.videoTrack) return
        const elId = String(p.uid) === String(focusedUid) ? 'main-player' : `remote-player-${p.uid}`
        const el = document.getElementById(elId)
        if (el) {
          ru.videoTrack.play(el, { fit: 'contain' })
          setTimeout(() => applyVideoFit(el, 'contain'), 30)
        }
      })
    }, 100)
    return () => clearTimeout(t)
  }, [remoteParticipants, joined, focusedUid])

  const stopScreenShare = useCallback(async () => {
    const client = clientRef.current
    const screenTrack = localTracksRef.current.screenTrack
    const cameraTrack = localTracksRef.current.videoTrack
    if (!client || !screenTrack) return
    try { await client.unpublish(screenTrack) } catch {}
    try { screenTrack.stop(); screenTrack.close() } catch {}
    localTracksRef.current.screenTrack = null
    setScreenSharing(false)
    const localEl = document.getElementById('local-player')
    if (cameraTrack && cameraOn) {
      try {
        await client.publish(cameraTrack)
        if (localEl) { cameraTrack.play(localEl, { fit: 'contain', mirror: true }); setTimeout(() => applyVideoFit(localEl, 'contain'), 30) }
      } catch {}
    } else if (localEl) { localEl.innerHTML = '' }
  }, [cameraOn])

  const startScreenShare = useCallback(async () => {
    const AgoraRTC = AgoraRef.current
    const client = clientRef.current
    const cameraTrack = localTracksRef.current.videoTrack
    if (!AgoraRTC || !client || !canScreenShare || screenSharing) return
    try {
      const created = await AgoraRTC.createScreenVideoTrack({ encoderConfig: '1080p_1', optimizationMode: 'detail' })
      const screenTrack = Array.isArray(created) ? created[0] : created
      if (!screenTrack) throw new Error('Screen sharing unavailable')
      try { if (cameraTrack) await client.unpublish(cameraTrack) } catch {}
      localTracksRef.current.screenTrack = screenTrack
      screenTrack.on?.('track-ended', () => { void stopScreenShare() })
      await client.publish(screenTrack)
      setScreenSharing(true)
      const localEl = document.getElementById('local-player')
      if (localEl) { screenTrack.play(localEl, { fit: 'contain', mirror: false }); setTimeout(() => applyVideoFit(localEl, 'contain'), 30) }
    } catch (e) {
      console.error('Screen share failed:', e)
      await stopScreenShare()
    }
  }, [canScreenShare, screenSharing, stopScreenShare])

  const upsertRemoteParticipant = (uid, patch = {}) => {
    const n = Number(uid) || uid
    setRemoteParticipants((prev) => {
      const ex = prev.find((i) => String(i.uid) === String(n))
      if (!ex) return [...prev, { uid: n, hasVideo: false, hasAudio: false, ...patch }]
      return prev.map((i) => String(i.uid) === String(n) ? { ...i, ...patch, uid: n } : i)
    })
  }
  const removeRemoteParticipant = (uid) => {
    const n = Number(uid) || uid
    setRemoteParticipants((prev) => prev.filter((i) => String(i.uid) !== String(n)))
  }

  const joinClass = async () => {
    if (!id || !user?.id) return
    setJoining(true); setError(null)
    try {
      if (user.role === 'teacher') await authFetch(api.startClass(id), token, { method: 'POST' })
      const role = user.role === 'teacher' ? 'HOST' : 'STUDENT'
      const numericAgoraUid = hashStringToUid(user.id)
      const tokenData = await authFetch(api.agoraToken(id, user.id, role, numericAgoraUid), token)
      if (!tokenData?.token) throw new Error('Failed to get Agora token')
      const { token: agoraToken, appId, channel, agoraUid } = tokenData

      const AgoraModule = await import('agora-rtc-sdk-ng')
      const AgoraRTC = AgoraModule.default || AgoraModule
      AgoraRef.current = AgoraRTC
      try { AgoraRTC.setLogLevel?.(4) } catch {}

      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      clientRef.current = client
      const joinUid = typeof agoraUid === 'number' ? agoraUid : numericAgoraUid
      await client.join(appId, String(channel), agoraToken, joinUid)
      joinedRef.current = true

      const handlePublished = async (remoteUser, mediaType) => {
        try {
          if (client.connectionState !== 'CONNECTED') return
          upsertRemoteParticipant(remoteUser.uid, {
            hasVideo: mediaType === 'video' ? true : Boolean(remoteUser.hasVideo),
            hasAudio: mediaType === 'audio' ? true : Boolean(remoteUser.hasAudio),
          })
          await client.subscribe(remoteUser, mediaType)
          if (mediaType === 'audio') {
            try { remoteUser.audioTrack?.setVolume?.(80) } catch {}
            remoteUser.audioTrack?.play()
          }
        } catch (e) { console.warn('Subscribe error:', e) }
      }
      client.on('user-joined', (ru) => upsertRemoteParticipant(ru.uid, { hasVideo: Boolean(ru.hasVideo), hasAudio: Boolean(ru.hasAudio) }))
      client.on('user-published', handlePublished)
      client.on('user-unpublished', (ru, mt) => {
        if (mt === 'video') upsertRemoteParticipant(ru.uid, { hasVideo: false, hasAudio: Boolean(ru.hasAudio) })
        if (mt === 'audio') upsertRemoteParticipant(ru.uid, { hasAudio: false, hasVideo: Boolean(ru.hasVideo) })
      })
      client.on('user-left', (ru) => removeRemoteParticipant(ru.uid))
      client.on('token-privilege-will-expire', async () => {
        try { const r = await authFetch(api.agoraToken(id, user.id, role, joinUid), token); if (r?.token) await client.renewToken(r.token) } catch {}
      })
      client.on('stream-message', (_uid, data) => {
        try {
          const decoded = typeof data === 'string' ? data : new TextDecoder().decode(data instanceof Uint8Array ? data : new Uint8Array(data))
          const msg = JSON.parse(decoded)
          if (msg.type === 'chat') setChatMessages((p) => [...p, { id: Date.now() + Math.random(), senderName: msg.senderName, text: msg.text, at: msg.at, mine: false }])
        } catch {}
      })

      for (const ru of client.remoteUsers || []) {
        upsertRemoteParticipant(ru.uid, { hasVideo: Boolean(ru.hasVideo), hasAudio: Boolean(ru.hasAudio) })
        if (ru.hasVideo) await handlePublished(ru, 'video')
        if (ru.hasAudio) await handlePublished(ru, 'audio')
      }

      try {
        const [at, vt] = await createOptimizedLocalTracks(AgoraRTC)
        localTracksRef.current = { audioTrack: at, videoTrack: vt }
        await client.publish([at, vt])
        setMicOn(true); setCameraOn(true)
      } catch { setMicOn(false); setCameraOn(false) }

      for (const ru of client.remoteUsers || []) {
        if (ru.hasVideo) await handlePublished(ru, 'video')
        if (ru.hasAudio) await handlePublished(ru, 'audio')
      }

      try { dataStreamRef.current = await client.createDataStream({ ordered: true, reliable: true }) } catch {}
      setJoined(true)
    } catch (e) { setError(e?.message || 'Failed to join class'); await cleanup() }
    finally { setJoining(false) }
  }

  const endOrLeave = async () => {
    if (user?.role === 'teacher' && !endedRef.current) {
      endedRef.current = true
      try { await authFetch(api.endClass(id), token, { method: 'POST' }) } catch {}
    }
    await cleanup()
    navigate(user?.role === 'teacher' ? '/dashboard/teacher' : user?.role === 'student' ? '/dashboard/student' : '/dashboard/parent')
  }

  const goBack = async () => { await cleanup(); navigate(-1) }

  const toggleMic = async () => {
    const t = localTracksRef.current.audioTrack
    if (t) { await t.setEnabled(!micOn); setMicOn((v) => !v) }
  }
  const toggleCamera = async () => {
    if (screenSharing) return
    const t = localTracksRef.current.videoTrack
    if (t) {
      await t.setEnabled(!cameraOn); setCameraOn((v) => !v)
      if (!cameraOn) {
        const el = document.getElementById(isLocalFocused ? 'main-player' : 'local-player')
        if (el) { t.play(el, { fit: 'contain', mirror: true }); setTimeout(() => applyVideoFit(el, 'contain'), 30) }
      }
    }
  }
  const toggleScreenShare = async () => { screenSharing ? await stopScreenShare() : await startScreenShare() }

  const sendChat = async () => {
    const text = chatInput.trim()
    if (!text) return
    const senderName = user?.full_name || 'You'
    const now = new Date().toISOString()
    setChatMessages((p) => [...p, { id: Date.now() + Math.random(), senderName, text, at: now, mine: true }])
    setChatInput('')
    const client = clientRef.current
    if (client && dataStreamRef.current !== null) {
      try {
        const payload = JSON.stringify({ type: 'chat', senderName, text, at: now })
        await client.sendStreamMessage(dataStreamRef.current, new TextEncoder().encode(payload))
      } catch {}
    }
  }

  /* ── LOADING / ERROR / LOBBY (unchanged) ── */
  if (sessionQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        <p className="mt-4 text-slate-400 text-sm font-medium">Preparing Classroom…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white px-6">
        <div className="p-4 bg-red-500/10 rounded-full mb-4">
          <PhoneOff size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
        <p className="text-slate-400 text-center max-w-md mb-8">{error}</p>
        <button onClick={goBack} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium transition-colors border border-slate-700">
          Go Back
        </button>
      </div>
    )
  }

  if (!joined) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative">
        <button onClick={goBack} className="absolute top-6 left-6 p-2.5 bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors border border-slate-700">
          <RotateCcw size={18} />
        </button>
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold shadow-lg shadow-blue-500/20 mb-4">
            {(user?.full_name || '?').charAt(0).toUpperCase()}
          </div>
          <p className="text-xl font-semibold">{user?.full_name || 'You'}</p>
          <p className="text-slate-400 text-sm mt-1 capitalize">{user?.role === 'teacher' ? '🎓 Teacher' : '📖 Student'}</p>
        </div>
        <div className="text-center mb-8 max-w-sm">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            {session?.subject || 'Class Session'}
          </h2>
          <p className="text-slate-400">
            {user?.role === 'teacher' ? 'You are hosting this session' : `With ${session?.teacher_name || 'Teacher'}`}
          </p>
          {session?.duration_minutes && (
            <div className="inline-flex items-center gap-1.5 mt-4 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
              <Clock size={12} />
              <span>{session.duration_minutes} min</span>
            </div>
          )}
        </div>
        <button
          onClick={joinClass}
          disabled={joining}
          className="px-10 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-full font-semibold text-lg transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 active:scale-95"
        >
          {joining ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Connecting…
            </span>
          ) : (
            user?.role === 'teacher' ? 'Start Class' : 'Join Now'
          )}
        </button>
      </div>
    )
  }

  /* ── IN-CALL UI (FaceTime + Zoom) ── */
  const filmstripParticipants = []
  if (!isLocalFocused) {
    filmstripParticipants.push({
      uid: 'local',
      isLocal: true,
      hasVideo: cameraOn || screenSharing,
      hasAudio: micOn,
    })
  }
  remoteParticipants.forEach((p) => {
    if (String(p.uid) !== String(focusedUid)) {
      filmstripParticipants.push({ ...p, isLocal: false })
    }
  })

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden selection:bg-emerald-500/30">
      {/* Top Bar */}
      <div className="shrink-0 h-14 bg-black/95 backdrop-blur-lg flex items-center justify-between px-4 border-b border-white/10 z-30">
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 text-xl font-bold tracking-tight">ILM Connect</span>
          <div className="font-mono text-sm text-slate-300 tabular-nums">{fmt(elapsed)}</div>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-3xl text-xs border border-slate-700">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="font-medium">{1 + remoteParticipants.length}</span>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 relative flex flex-col min-h-0 bg-slate-950">
        {/* 1:1 FaceTime Mode */}
        {isOneToOne && (
          <div className="flex-1 relative h-full bg-black">
            <div id="main-player" className="absolute inset-0 w-full h-full" />
            {focusedRemote && !focusedRemote.hasVideo && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
                <div className="text-8xl mb-6">👤</div>
                <p className="text-2xl font-medium">Participant</p>
                <p className="text-slate-400 mt-1">Camera is off</p>
              </div>
            )}
            {!isLocalFocused && (
              <div
                ref={pipRef}
                onClick={() => setFocusedUid('local')}
                className="absolute bottom-6 right-6 w-28 h-40 sm:w-32 sm:h-44 md:w-40 md:h-52 bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-emerald-400 cursor-pointer select-none z-20"
              >
                <div id="local-player" className="w-full h-full" />
                <div className="absolute bottom-2 left-2 bg-black/70 text-xs px-3 py-px rounded-xl">You</div>
              </div>
            )}
            <div className="absolute top-6 left-6 bg-red-500 text-white text-xs px-4 py-1 rounded-3xl flex items-center gap-1 font-medium z-30">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> LIVE
            </div>
          </div>
        )}

        {/* Group / Zoom Mode */}
        {!isOneToOne && (
          <div className="flex-1 flex flex-col p-3">
            <div className="flex-1 relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-700 shadow-2xl">
              <div id="main-player" className="w-full h-full" />
              {focusedRemote && !focusedRemote.hasVideo && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
                  <div className="text-7xl mb-6">👤</div>
                  <p className="text-xl font-medium">Speaker</p>
                  <p className="text-slate-400">Camera is off</p>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between z-20">
                <span className="text-base font-medium">
                  {isLocalFocused ? (screenSharing ? 'Your Screen' : 'You') : `Participant ${focusedRemote?.uid}`}
                </span>
                {!isLocalFocused && focusedRemote && !focusedRemote.hasAudio && (
                  <MicOff size={18} className="text-red-400" />
                )}
              </div>
            </div>

            {filmstripParticipants.length > 0 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                {filmstripParticipants.map((p) => (
                  <div
                    key={p.uid}
                    onClick={() => setFocusedUid(p.isLocal ? 'local' : p.uid)}
                    className="relative shrink-0 w-24 h-16 md:w-36 md:h-24 rounded-2xl overflow-hidden bg-slate-800 border-2 border-transparent hover:border-emerald-400 cursor-pointer transition-all snap-center"
                  >
                    {p.isLocal ? (
                      <div id="local-player" className="w-full h-full" />
                    ) : (
                      <>
                        <div id={`remote-player-${p.uid}`} className={`w-full h-full ${p.hasVideo ? '' : 'hidden'}`} />
                        {!p.hasVideo && <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-3xl">👤</div>}
                      </>
                    )}
                    <div className="absolute bottom-1 left-1 bg-black/70 text-[10px] px-2 py-px rounded-lg">
                      {p.isLocal ? 'You' : `P${p.uid}`}
                    </div>
                    {!p.hasAudio && <MicOff size={12} className="absolute top-2 right-2 text-red-400" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="shrink-0 bg-black/90 backdrop-blur-lg border-t border-white/10 px-4 py-4 z-40">
        <div className="flex items-center justify-center gap-6 text-3xl">
          <button onClick={toggleMic} className={`flex flex-col items-center group ${micOn ? 'text-white' : 'text-red-400'}`}>
            <div className="w-14 h-14 flex items-center justify-center rounded-2xl hover:bg-white/10 transition-all active:scale-95">
              {micOn ? <Mic size={28} /> : <MicOff size={28} />}
            </div>
            <span className="text-xs mt-1 text-slate-400">Mute</span>
          </button>

          <button onClick={toggleCamera} disabled={screenSharing} className={`flex flex-col items-center group ${cameraOn ? 'text-white' : 'text-red-400'}`}>
            <div className="w-14 h-14 flex items-center justify-center rounded-2xl hover:bg-white/10 transition-all active:scale-95">
              {cameraOn ? <Video size={28} /> : <VideoOff size={28} />}
            </div>
            <span className="text-xs mt-1 text-slate-400">Video</span>
          </button>

          {canScreenShare && (
            <button onClick={toggleScreenShare} className="flex flex-col items-center group text-white">
              <div className="w-14 h-14 flex items-center justify-center rounded-2xl hover:bg-white/10 transition-all active:scale-95">
                {screenSharing ? <ScreenShareOff size={28} /> : <ScreenShare size={28} />}
              </div>
              <span className="text-xs mt-1 text-slate-400">Share</span>
            </button>
          )}

          <button onClick={() => setChatOpen((v) => !v)} className="flex flex-col items-center group text-white">
            <div className="w-14 h-14 flex items-center justify-center rounded-2xl hover:bg-white/10 transition-all active:scale-95">
              <MessageCircle size={28} />
            </div>
            <span className="text-xs mt-1 text-slate-400">Chat</span>
          </button>

          <button onClick={endOrLeave} className="bg-red-600 hover:bg-red-700 w-14 h-14 rounded-3xl flex items-center justify-center text-3xl active:scale-95 transition-all">
            {user?.role === 'teacher' ? <Phone size={28} className="rotate-[135deg]" /> : <PhoneOff size={28} />}
          </button>
        </div>
      </div>

      {/* Chat Panel */}
      {chatOpen && (
        <div className="absolute right-0 top-0 bottom-0 w-full sm:w-80 bg-slate-900/95 backdrop-blur-md border-l border-slate-800 flex flex-col z-30">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
            <span className="font-semibold text-sm">Chat</span>
            <button onClick={() => setChatOpen(false)} className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors">
              <X size={16} className="text-slate-400" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 && <p className="text-center text-slate-500 text-sm py-8">No messages yet</p>}
            {chatMessages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.mine ? 'items-end' : 'items-start'}`}>
                {!m.mine && <span className="text-[11px] text-slate-400 mb-1 ml-1">{m.senderName}</span>}
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${m.mine ? 'bg-emerald-600 text-white rounded-br-md' : 'bg-slate-800 text-slate-200 rounded-bl-md border border-slate-700'}`}>
                  <p className="leading-relaxed">{m.text}</p>
                  <p className={`text-[10px] mt-1 ${m.mine ? 'text-emerald-200' : 'text-slate-500'}`}>
                    {new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>
          <div className="p-3 border-t border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                placeholder="Type a message…"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              />
              <button onClick={sendChat} className="p-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-lg shadow-emerald-600/20">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}