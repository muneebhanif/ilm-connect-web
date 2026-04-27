import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Mic, MicOff, Video, VideoOff, Phone, PhoneOff,
  MessageCircle, X, Send, Users, Clock, RotateCcw, ScreenShare, ScreenShareOff,
} from 'lucide-react'
import { useAuth } from '../lib/auth.jsx'
import { api, authFetch } from '../lib/api'
import './ClassRoom.css'

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

function applyVideoFit(target, fit = 'cover') {
  const container = typeof target === 'string' ? document.getElementById(target) : target
  if (!container) return
  container.style.background = '#0d1120'
  const nodes = [container, ...container.querySelectorAll('.agora_video_player, video, canvas')]
  nodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) return
    let resolved = fit
    if (fit === 'adaptive' && node instanceof HTMLVideoElement) {
      const sw = node.videoWidth || 0, sh = node.videoHeight || 0
      const cw = container.clientWidth || 0, ch = container.clientHeight || 0
      if (sw > 0 && sh > 0 && cw > 0 && ch > 0) {
        resolved = Math.abs(sw / sh - cw / ch) > 0.38 ? 'contain' : 'cover'
      } else resolved = 'cover'
    }
    node.style.width = '100%'
    node.style.height = '100%'
    node.style.objectFit = resolved
    node.style.background = '#0d1120'
  })
}

function isDesktopScreenShareAvailable() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  return typeof navigator.mediaDevices?.getDisplayMedia === 'function'
    && !/android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || '')
    && window.innerWidth >= 768
}

function getGridClass(count) {
  if (count <= 1) return 'cr-grid-1'
  if (count === 2) return 'cr-grid-2'
  if (count === 3) return 'cr-grid-3'
  if (count === 4) return 'cr-grid-4'
  if (count <= 6) return 'cr-grid-6'
  return 'cr-grid-many'
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
        vt.play(el, { fit: screenSharing ? 'contain' : 'cover', mirror: !screenSharing })
        setTimeout(() => applyVideoFit(el, screenSharing ? 'contain' : 'cover'), 30)
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
            ru.videoTrack.play(el, { fit: 'cover' })
            setTimeout(() => applyVideoFit(el, 'adaptive'), 30)
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
        if (localEl) { cameraTrack.play(localEl, { fit: 'cover', mirror: true }); setTimeout(() => applyVideoFit(localEl, 'cover'), 30) }
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
        if (el) { t.play(el, { fit: 'cover', mirror: true }); setTimeout(() => applyVideoFit(el, 'cover'), 30) }
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
      <div className="cr-fullscreen">
        <div className="cr-spinner" />
        <p className="cr-loading-text">Preparing Classroom…</p>
      </div>
    )
  }

  /* ── ERROR ── */
  if (error) {
    return (
      <div className="cr-fullscreen">
        <div className="cr-error-icon"><PhoneOff size={28} /></div>
        <h2 className="cr-error-title">Something went wrong</h2>
        <p className="cr-error-msg">{error}</p>
        <button onClick={goBack} className="cr-error-back">Go Back</button>
      </div>
    )
  }

  /* ── LOBBY ── */
  if (!joined) {
    return (
      <div className="cr-lobby">
        <button onClick={goBack} className="cr-lobby-back"><RotateCcw size={18} /></button>
        <div className="cr-lobby-card">
          <div className="cr-lobby-avatar">{(user?.full_name || '?').charAt(0).toUpperCase()}</div>
          <p className="cr-lobby-name">{user?.full_name || 'You'}</p>
          <p className="cr-lobby-role">{user?.role === 'teacher' ? '🎓 Teacher' : '📖 Student'}</p>
        </div>
        <h2 className="cr-lobby-subject">{session?.subject || 'Class Session'}</h2>
        <p className="cr-lobby-host">{user?.role === 'teacher' ? 'You are hosting' : `With ${session?.teacher_name || 'Teacher'}`}</p>
        {session?.duration_minutes && (
          <div className="cr-lobby-duration"><Clock size={12} /> {session.duration_minutes} min</div>
        )}
        <button onClick={joinClass} disabled={joining} className="cr-lobby-join">
          {joining ? 'Connecting…' : user?.role === 'teacher' ? 'Start Class' : 'Join Now'}
        </button>
      </div>
    )
  }

  /* ── IN-CALL ── */
  const allTiles = remoteParticipants
  const tileCount = allTiles.length || 1

  return (
    <div className="cr-root">
      {/* Top bar */}
      <div className="cr-topbar">
        <div className="cr-topbar-left">
          <div className="cr-live-badge">
            <span className="cr-live-dot" />
            <span className="cr-live-text">LIVE</span>
          </div>
          <span className="cr-timer">{fmt(elapsed)}</span>
        </div>
        <span className="cr-topbar-center">{session?.subject || 'Live Class'}</span>
        <div className="cr-topbar-right">
          <div className="cr-participants-badge">
            <Users size={13} />
            <span>{1 + remoteParticipants.length}</span>
          </div>
        </div>
      </div>

      {/* Video stage */}
      <div className="cr-stage">
        <div className="cr-grid-wrapper">
          {allTiles.length === 0 ? (
            <div className="cr-waiting">
              <div className="cr-waiting-avatar">👤</div>
              <p className="cr-waiting-text">Waiting for participant…</p>
              <div className="cr-waiting-status">
                <span className="cr-waiting-status-dot" />
                <span className="cr-waiting-status-text">Connected</span>
              </div>
            </div>
          ) : (
            <div className={`cr-video-grid ${getGridClass(tileCount)}`}>
              {allTiles.map((p) => (
                <div key={p.uid} className={`cr-tile ${tileCount === 1 ? 'cr-tile-solo' : ''}`}>
                  <div id={`remote-player-${p.uid}`} className={`cr-tile-video ${p.hasVideo ? '' : 'hidden'}`} />
                  {!p.hasVideo && (
                    <div className="cr-tile-avatar">
                      <div className="cr-avatar-circle">{String(p.uid).charAt(0).toUpperCase()}</div>
                      <span className="cr-avatar-name">Participant</span>
                      <span className="cr-avatar-sub">Camera off</span>
                    </div>
                  )}
                  <div className="cr-tile-label">
                    <span className="cr-tile-label-text">Participant {p.uid}</span>
                    {!p.hasAudio && <MicOff size={12} className="cr-tile-mic-icon muted" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Local PiP */}
        <div ref={pipRef} className="cr-pip">
          <div id="local-player" style={{ width: '100%', height: '100%' }} />
          <span className="cr-pip-label">You</span>
        </div>

        {/* Chat panel */}
        {chatOpen && (
          <div className="cr-chat">
            <div className="cr-chat-header">
              <span className="cr-chat-title">Chat</span>
              <button onClick={() => setChatOpen(false)} className="cr-chat-close"><X size={16} /></button>
            </div>
            <div className="cr-chat-messages">
              {chatMessages.length === 0 && <p className="cr-chat-empty">No messages yet</p>}
              {chatMessages.map((m) => (
                <div key={m.id} className={`cr-msg ${m.mine ? 'mine' : 'theirs'}`}>
                  {!m.mine && <p className="cr-msg-sender">{m.senderName}</p>}
                  <p>{m.text}</p>
                  <p className="cr-msg-time">{new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>
            <div className="cr-chat-input-wrap">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                placeholder="Type a message…"
                className="cr-chat-input"
              />
              <button onClick={sendChat} className="cr-chat-send"><Send size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="cr-controls">
        <div className="cr-ctrl-group">
          <button onClick={toggleMic} className={`cr-ctrl-btn ${micOn ? '' : 'off'}`}>
            {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            <span className="cr-tooltip">{micOn ? 'Mute' : 'Unmute'}</span>
          </button>
          <button onClick={toggleCamera} disabled={screenSharing} className={`cr-ctrl-btn ${cameraOn ? '' : 'off'} ${screenSharing ? '' : ''}`}>
            {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
            <span className="cr-tooltip">{cameraOn ? 'Stop Video' : 'Start Video'}</span>
          </button>
        </div>

        <div className="cr-ctrl-divider" />

        <div className="cr-ctrl-group">
          {canScreenShare && (
            <button onClick={toggleScreenShare} className={`cr-ctrl-btn ${screenSharing ? 'screen-active' : ''}`}>
              {screenSharing ? <ScreenShareOff size={20} /> : <ScreenShare size={20} />}
              <span className="cr-tooltip">{screenSharing ? 'Stop Sharing' : 'Share Screen'}</span>
            </button>
          )}
          <button onClick={() => setChatOpen((v) => !v)} className={`cr-ctrl-btn ${chatOpen ? 'active' : ''}`}>
            <MessageCircle size={20} />
            <span className="cr-tooltip">Chat</span>
          </button>
        </div>

        <div className="cr-ctrl-divider" />

        <button onClick={endOrLeave} className="cr-end-btn">
          {user?.role === 'teacher' ? <Phone size={20} className="rotate-[135deg]" /> : <PhoneOff size={20} />}
          <span className="cr-tooltip">{user?.role === 'teacher' ? 'End Class' : 'Leave'}</span>
        </button>
      </div>
    </div>
  )
}
