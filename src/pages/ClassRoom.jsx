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

function getGridClass(count) {
  if (count <= 1) return 'grid-cols-1'
  if (count === 2) return 'grid-cols-1 md:grid-cols-2'
  if (count <= 4) return 'grid-cols-2'
  if (count <= 6) return 'grid-cols-2 md:grid-cols-3'
  return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
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

  const clientRef = useRef(null)
  const AgoraRef = useRef(null)
  const localTracksRef = useRef({})
  const dataStreamRef = useRef(null)
  const joinedRef = useRef(false)
  const endedRef = useRef(false)
  const pipRef = useRef(null)
  const chatBottomRef = useRef(null)

  const canScreenShare = isDesktopScreenShareAvailable()

  const sessionQuery = useQuery({
    queryKey: ['classSession', id],
    queryFn: () => authFetch(api.classSession(id), token),
    enabled: !!id && !!token,
  })
  const session = sessionQuery.data?.session || {}

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
  }, [])

  useEffect(() => () => { void cleanup() }, [cleanup])

  // Play local video
  useEffect(() => {
    if (!joined) return
    const t = setTimeout(() => {
      const vt = localTracksRef.current.screenTrack || localTracksRef.current.videoTrack
      const el = document.getElementById('local-player')
      if (vt && el) {
        vt.play(el, { fit: 'contain', mirror: !screenSharing })
        setTimeout(() => applyVideoFit(el, 'contain'), 30)
      }
    }, 100)
    return () => clearTimeout(t)
  }, [joined, screenSharing])

  // Play remote videos
  useEffect(() => {
    const vp = remoteParticipants.filter((p) => p.hasVideo)
    if (!joined || !vp.length) return
    const t = setTimeout(() => {
      vp.forEach(({ uid }) => {
        const ru = clientRef.current?.remoteUsers?.find((u) => String(u.uid) === String(uid))
        if (ru?.videoTrack) {
          const el = document.getElementById(`remote-player-${uid}`)
          if (el) {
            ru.videoTrack.play(el, { fit: 'contain' })
            setTimeout(() => applyVideoFit(el, 'contain'), 30)
          }
        }
      })
    }, 100)
    return () => clearTimeout(t)
  }, [remoteParticipants, joined])

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
        const el = document.getElementById('local-player')
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

  /* ── LOADING ── */
  if (sessionQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        <p className="mt-4 text-slate-400 text-sm font-medium">Preparing Classroom…</p>
      </div>
    )
  }

  /* ── ERROR ── */
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

  /* ── LOBBY ── */
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

  /* ── IN-CALL ── */
  const allTiles = remoteParticipants
  const tileCount = allTiles.length || 1

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden selection:bg-blue-500/30">
      {/* Top bar */}
      <div className="shrink-0 h-14 md:h-16 flex items-center justify-between px-4 md:px-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-[11px] font-bold tracking-wider">LIVE</span>
          </div>
          <span className="font-mono text-sm text-slate-300 tabular-nums">{fmt(elapsed)}</span>
        </div>

        <span className="hidden sm:block font-medium text-sm text-slate-200 truncate max-w-[200px] md:max-w-md">
          {session?.subject || 'Live Class'}
        </span>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
            <Users size={13} />
            <span className="font-medium">{1 + remoteParticipants.length}</span>
          </div>
        </div>
      </div>

      {/* Video stage */}
      <div className="flex-1 relative bg-slate-950">
        <div className="absolute inset-0 flex items-center justify-center p-2 md:p-4">
          {allTiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-slate-500">
              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-4xl mb-4 border border-slate-700">
                👤
              </div>
              <p className="text-lg font-medium text-slate-400 mb-1">Waiting for participant…</p>
              <div className="flex items-center gap-2 text-sm text-emerald-400 mt-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span>Connected</span>
              </div>
            </div>
          ) : (
            <div className={`w-full h-full grid gap-2 md:gap-4 ${getGridClass(tileCount)}`}>
              {allTiles.map((p) => (
                <div
                  key={p.uid}
                  className={`relative bg-slate-800 rounded-2xl overflow-hidden shadow-xl border border-slate-700/50 ${tileCount === 1 ? 'max-w-5xl max-h-full aspect-video mx-auto' : 'w-full h-full min-h-[180px]'}`}
                >
                  <div id={`remote-player-${p.uid}`} className={`absolute inset-0 ${p.hasVideo ? '' : 'hidden'}`} />
                  {!p.hasVideo && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold text-slate-300 mb-3">
                        {String(p.uid).charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-slate-300 font-medium">Participant</span>
                      <span className="text-xs text-slate-500 mt-1">Camera off</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between">
                    <span className="text-xs text-white/90 font-medium">Participant {p.uid}</span>
                    {!p.hasAudio && <MicOff size={14} className="text-red-400 shrink-0" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Local PiP */}
        <div
          ref={pipRef}
          className="absolute bottom-20 right-2 md:bottom-24 md:right-5 w-28 h-20 sm:w-36 sm:h-24 md:w-44 md:h-32 bg-slate-800 rounded-xl overflow-hidden shadow-2xl border-2 border-slate-600/50 z-20 cursor-move select-none touch-none"
        >
          <div id="local-player" className="w-full h-full" />
          <span className="absolute bottom-1.5 left-1.5 text-[10px] font-medium bg-black/60 text-white/90 px-1.5 py-0.5 rounded">
            You
          </span>
        </div>

        {/* Chat panel */}
        {chatOpen && (
          <div className="absolute right-0 top-0 bottom-20 w-full sm:w-80 bg-slate-900/95 backdrop-blur-md border-l border-slate-800 flex flex-col z-30 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
              <span className="font-semibold text-sm">Chat</span>
              <button
                onClick={() => setChatOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={16} className="text-slate-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 && (
                <p className="text-center text-slate-500 text-sm py-8">No messages yet</p>
              )}
              {chatMessages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.mine ? 'items-end' : 'items-start'}`}>
                  {!m.mine && (
                    <span className="text-[11px] text-slate-400 mb-1 ml-1">{m.senderName}</span>
                  )}
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${m.mine ? 'bg-blue-600 text-white rounded-br-md' : 'bg-slate-800 text-slate-200 rounded-bl-md border border-slate-700'}`}>
                    <p className="leading-relaxed">{m.text}</p>
                    <p className={`text-[10px] mt-1 ${m.mine ? 'text-blue-200' : 'text-slate-500'}`}>
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
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
                <button
                  onClick={sendChat}
                  className="p-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-lg shadow-blue-600/20"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="shrink-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 px-4 py-2.5 md:py-3 z-40">
        <div className="flex items-center justify-center gap-2 md:gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMic}
              className={`group relative p-3 md:p-3.5 rounded-full transition-all active:scale-95 ${micOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20'}`}
            >
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[11px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {micOn ? 'Mute' : 'Unmute'}
              </span>
            </button>

            <button
              onClick={toggleCamera}
              disabled={screenSharing}
              className={`group relative p-3 md:p-3.5 rounded-full transition-all active:scale-95 ${screenSharing ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500' : cameraOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20'}`}
            >
              {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[11px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {cameraOn ? 'Stop Video' : 'Start Video'}
              </span>
            </button>
          </div>

          <div className="w-px h-8 bg-slate-700 mx-1" />

          <div className="flex items-center gap-2">
            {canScreenShare && (
              <button
                onClick={toggleScreenShare}
                className={`group relative p-3 md:p-3.5 rounded-full transition-all active:scale-95 ${screenSharing ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
              >
                {screenSharing ? <ScreenShareOff size={20} /> : <ScreenShare size={20} />}
                <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[11px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {screenSharing ? 'Stop Sharing' : 'Share Screen'}
                </span>
              </button>
            )}

            <button
              onClick={() => setChatOpen((v) => !v)}
              className={`group relative p-3 md:p-3.5 rounded-full transition-all active:scale-95 ${chatOpen ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
            >
              <MessageCircle size={20} />
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[11px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Chat
              </span>
            </button>
          </div>

          <div className="w-px h-8 bg-slate-700 mx-1" />

          <button
            onClick={endOrLeave}
            className="group relative p-3 md:p-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white transition-all active:scale-95 shadow-lg shadow-red-600/20"
          >
            {user?.role === 'teacher' ? <Phone size={20} className="rotate-[135deg]" /> : <PhoneOff size={20} />}
            <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[11px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              {user?.role === 'teacher' ? 'End Class' : 'Leave'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}