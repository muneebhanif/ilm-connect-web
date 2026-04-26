import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Mic, MicOff, Video, VideoOff, Phone, PhoneOff,
  MessageCircle, X, Send, Users, Clock, RotateCcw,
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

  const clientRef = useRef(null)
  const AgoraRef = useRef(null)
  const localTracksRef = useRef({})
  const dataStreamRef = useRef(null)
  const joinedRef = useRef(false)
  const endedRef = useRef(false)

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

  const cleanup = useCallback(async () => {
    joinedRef.current = false
    try {
      if (localTracksRef.current.audioTrack) { localTracksRef.current.audioTrack.stop(); localTracksRef.current.audioTrack.close() }
      if (localTracksRef.current.videoTrack) { localTracksRef.current.videoTrack.stop(); localTracksRef.current.videoTrack.close() }
      localTracksRef.current = {}
      if (clientRef.current) {
        clientRef.current.removeAllListeners?.()
        await clientRef.current.leave()
      }
    } catch {}
    clientRef.current = null
    dataStreamRef.current = null
    setJoined(false)
    setRemoteParticipants([])
  }, [])

  useEffect(() => () => { void cleanup() }, [cleanup])

  // Play local video
  useEffect(() => {
    if (!joined) return
    const t = setTimeout(() => {
      const vt = localTracksRef.current.videoTrack
      const el = document.getElementById('local-player')
      if (vt && el) vt.play(el)
    }, 100)
    return () => clearTimeout(t)
  }, [joined])

  // Play remote videos
  useEffect(() => {
    const videoParticipants = remoteParticipants.filter((participant) => participant.hasVideo)
    if (!joined || !videoParticipants.length) return
    const t = setTimeout(() => {
      videoParticipants.forEach(({ uid }) => {
        const ru = clientRef.current?.remoteUsers?.find((u) => String(u.uid) === String(uid))
        if (ru?.videoTrack) {
          const el = document.getElementById(`remote-player-${uid}`)
          if (el) ru.videoTrack.play(el)
        }
      })
    }, 100)
    return () => clearTimeout(t)
  }, [remoteParticipants, joined])

  const upsertRemoteParticipant = (uid, patch = {}) => {
    const normalizedUid = Number(uid) || uid
    setRemoteParticipants((previous) => {
      const existing = previous.find((item) => String(item.uid) === String(normalizedUid))
      if (!existing) {
        return [...previous, { uid: normalizedUid, hasVideo: false, hasAudio: false, ...patch }]
      }
      return previous.map((item) => (
        String(item.uid) === String(normalizedUid)
          ? { ...item, ...patch, uid: normalizedUid }
          : item
      ))
    })
  }

  const removeRemoteParticipant = (uid) => {
    const normalizedUid = Number(uid) || uid
    setRemoteParticipants((previous) => previous.filter((item) => String(item.uid) !== String(normalizedUid)))
  }

  const joinClass = async () => {
    if (!id || !user?.id) return
    setJoining(true)
    setError(null)
    try {
      // Teacher starts class
      if (user.role === 'teacher') {
        await authFetch(api.startClass(id), token, { method: 'POST' })
      }

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

      // Remote user handlers
      const handlePublished = async (remoteUser, mediaType) => {
        try {
          if (client.connectionState !== 'CONNECTED') return
          upsertRemoteParticipant(remoteUser.uid, {
            hasVideo: mediaType === 'video' ? true : Boolean(remoteUser.hasVideo),
            hasAudio: mediaType === 'audio' ? true : Boolean(remoteUser.hasAudio),
          })
          await client.subscribe(remoteUser, mediaType)
          if (mediaType === 'audio') remoteUser.audioTrack?.play()
        } catch (e) { console.warn('Subscribe error:', e) }
      }
      client.on('user-joined', (remoteUser) => {
        upsertRemoteParticipant(remoteUser.uid, {
          hasVideo: Boolean(remoteUser.hasVideo),
          hasAudio: Boolean(remoteUser.hasAudio),
        })
      })
      client.on('user-published', handlePublished)
      client.on('user-unpublished', (ru, mt) => {
        if (mt === 'video') {
          upsertRemoteParticipant(ru.uid, { hasVideo: false, hasAudio: Boolean(ru.hasAudio) })
        }
        if (mt === 'audio') {
          upsertRemoteParticipant(ru.uid, { hasAudio: false, hasVideo: Boolean(ru.hasVideo) })
        }
      })
      client.on('user-left', (ru) => removeRemoteParticipant(ru.uid))
      client.on('token-privilege-will-expire', async () => {
        try {
          const r = await authFetch(api.agoraToken(id, user.id, role, joinUid), token)
          if (r?.token) await client.renewToken(r.token)
        } catch {}
      })

      // Data stream for chat
      client.on('stream-message', (_uid, data) => {
        try {
          const decoded = typeof data === 'string' ? data : new TextDecoder().decode(data instanceof Uint8Array ? data : new Uint8Array(data))
          const msg = JSON.parse(decoded)
          if (msg.type === 'chat') {
            setChatMessages((p) => [...p, { id: Date.now() + Math.random(), senderName: msg.senderName, text: msg.text, at: msg.at, mine: false }])
          }
        } catch {}
      })

      // Subscribe existing users
      for (const ru of client.remoteUsers || []) {
        upsertRemoteParticipant(ru.uid, {
          hasVideo: Boolean(ru.hasVideo),
          hasAudio: Boolean(ru.hasAudio),
        })
        if (ru.hasVideo) await handlePublished(ru, 'video')
        if (ru.hasAudio) await handlePublished(ru, 'audio')
      }

      // Local tracks
      try {
        const [at, vt] = await AgoraRTC.createMicrophoneAndCameraTracks()
        localTracksRef.current = { audioTrack: at, videoTrack: vt }
        await client.publish([at, vt])
        setMicOn(true)
        setCameraOn(true)
      } catch {
        setMicOn(false)
        setCameraOn(false)
      }

      for (const ru of client.remoteUsers || []) {
        if (ru.hasVideo) await handlePublished(ru, 'video')
        if (ru.hasAudio) await handlePublished(ru, 'audio')
      }

      // Data stream
      try {
        dataStreamRef.current = await client.createDataStream({ ordered: true, reliable: true })
      } catch {}

      setJoined(true)
    } catch (e) {
      setError(e?.message || 'Failed to join class')
      await cleanup()
    } finally {
      setJoining(false)
    }
  }

  const endOrLeave = async () => {
    if (user?.role === 'teacher' && !endedRef.current) {
      endedRef.current = true
      try { await authFetch(api.endClass(id), token, { method: 'POST' }) } catch {}
    }
    await cleanup()
    navigate(user?.role === 'teacher' ? '/dashboard/teacher' : user?.role === 'student' ? '/dashboard/student' : '/dashboard/parent')
  }

  const goBack = async () => {
    await cleanup()
    navigate(-1)
  }

  const toggleMic = async () => {
    const t = localTracksRef.current.audioTrack
    if (t) { await t.setEnabled(!micOn); setMicOn((v) => !v) }
  }
  const toggleCamera = async () => {
    const t = localTracksRef.current.videoTrack
    if (t) { await t.setEnabled(!cameraOn); setCameraOn((v) => !v) }
  }

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

  // ── LOADING ──
  if (sessionQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1120]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-emerald/30 border-t-emerald" />
          <p className="text-lg font-semibold text-white/80">Preparing Classroom…</p>
        </div>
      </div>
    )
  }

  // ── ERROR ──
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1120] px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose/10 text-rose"><PhoneOff size={28} /></div>
          <h2 className="text-xl font-bold text-white">Something went wrong</h2>
          <p className="mt-2 text-sm text-white/50">{error}</p>
          <button onClick={goBack} className="mt-6 rounded-2xl bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20">Go Back</button>
        </div>
      </div>
    )
  }

  // ── LOBBY ──
  if (!joined) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B1120] px-4">
        <button onClick={goBack} className="absolute left-6 top-6 rounded-xl bg-white/8 p-2.5 text-white/70 hover:bg-white/15">
          <RotateCcw size={18} />
        </button>
        <div className="mb-8 flex h-52 w-52 flex-col items-center justify-center rounded-3xl bg-gradient-to-b from-[#1E293B] to-[#0F172A] border border-white/5">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald/10 border border-emerald/20">
            <span className="text-2xl font-bold text-emerald">{(user?.full_name || '?').charAt(0).toUpperCase()}</span>
          </div>
          <p className="font-semibold text-white/90">{user?.full_name || 'You'}</p>
          <p className="text-xs text-white/40">{user?.role === 'teacher' ? '🎓 Teacher' : '📖 Student'}</p>
        </div>
        <h2 className="text-xl font-bold text-white">{session?.subject || 'Class Session'}</h2>
        <p className="mt-1 text-sm text-white/40">{user?.role === 'teacher' ? 'You are hosting' : `With ${session?.teacher_name || 'Teacher'}`}</p>
        {session?.duration_minutes && (
          <div className="mt-3 flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-white/40">
            <Clock size={12} /> {session.duration_minutes} min
          </div>
        )}
        <button
          onClick={joinClass}
          disabled={joining}
          className="mt-8 rounded-2xl bg-gradient-to-r from-emerald to-teal px-10 py-4 text-lg font-bold text-white shadow-lg shadow-emerald/30 transition hover:brightness-110 disabled:opacity-50"
        >
          {joining ? 'Connecting…' : user?.role === 'teacher' ? 'Start Class' : 'Join Now'}
        </button>
      </div>
    )
  }

  // ── IN-CALL ──
  return (
    <div className="flex h-screen flex-col bg-[#0B1120]">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/5 bg-[#0B1120]/95 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-md bg-rose/15 px-2 py-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose" />
            <span className="text-[10px] font-bold tracking-wider text-rose/80">LIVE</span>
          </div>
          <span className="font-mono text-sm text-white/40">{fmt(elapsed)}</span>
        </div>
        <h3 className="max-w-xs truncate text-sm font-semibold text-white/80">{session?.subject || 'Live Class'}</h3>
        <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1">
          <Users size={13} className="text-white/40" />
          <span className="text-xs font-semibold text-white/50">{1 + remoteParticipants.length}</span>
        </div>
      </div>

      {/* Video area */}
      <div className="relative flex-1">
        {/* Remote videos */}
        <div className="absolute inset-0 bg-[#0B1120] p-4 md:p-6">
          {remoteParticipants.length === 0 ? (
            <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5 border border-white/8">
                <span className="text-3xl">👤</span>
              </div>
              <p className="text-sm text-white/30">Waiting for participant…</p>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald/8 border border-emerald/15 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
                <span className="text-xs font-semibold text-emerald">Connected</span>
              </div>
            </div>
            </div>
          ) : (
            <div className={`grid h-full gap-4 ${remoteParticipants.length === 1 ? 'grid-cols-1' : remoteParticipants.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
              {remoteParticipants.map((participant) => (
                <div key={participant.uid} className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[#111827] shadow-xl">
                  <div id={`remote-player-${participant.uid}`} className={`absolute inset-0 ${participant.hasVideo ? '' : 'hidden'}`} style={{ background: '#111827' }} />
                  {!participant.hasVideo && (
                    <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#111827] to-[#0F172A] text-white/80">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl font-bold">
                        {String(participant.uid).charAt(0).toUpperCase()}
                      </div>
                      <div className="text-sm font-semibold">Participant connected</div>
                      <div className="text-xs text-white/40">Camera is off or still connecting</div>
                    </div>
                  )}
                  <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur">
                    Participant {participant.uid}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Local PiP */}
        <div id="local-player" className="absolute bottom-24 right-4 z-20 h-40 w-28 overflow-hidden rounded-2xl border-2 border-emerald/40 bg-[#0F172A] shadow-xl" />

        {/* Chat panel */}
        {chatOpen && (
          <div className="absolute right-0 top-0 bottom-0 z-30 flex w-80 flex-col border-l border-white/5 bg-[#0F172A]/98">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <span className="font-semibold text-white">Chat</span>
              <button onClick={() => setChatOpen(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {chatMessages.length === 0 && <p className="py-10 text-center text-xs text-white/20">No messages yet</p>}
              {chatMessages.map((m) => (
                <div key={m.id} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.mine ? 'ml-auto bg-emerald text-white' : 'bg-white/8 text-white/80'}`}>
                  {!m.mine && <p className="mb-0.5 text-[10px] font-bold text-emerald/80">{m.senderName}</p>}
                  <p>{m.text}</p>
                  <p className={`mt-1 text-[10px] ${m.mine ? 'text-white/50' : 'text-white/30'}`}>{new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t border-white/5 p-3">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                placeholder="Type a message…"
                className="flex-1 rounded-xl bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 border border-white/5 focus:outline-none focus:border-emerald/30"
              />
              <button onClick={sendChat} className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald text-white"><Send size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-4 border-t border-white/5 bg-[#0F172A]/95 px-4 py-4">
        <button onClick={toggleMic} className={`flex h-12 w-12 items-center justify-center rounded-full transition ${micOn ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-rose/20 text-rose'}`}>
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        <button onClick={toggleCamera} className={`flex h-12 w-12 items-center justify-center rounded-full transition ${cameraOn ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-rose/20 text-rose'}`}>
          {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
        <button onClick={() => setChatOpen((v) => !v)} className={`flex h-12 w-12 items-center justify-center rounded-full transition ${chatOpen ? 'bg-emerald/20 text-emerald' : 'bg-white/10 text-white hover:bg-white/15'}`}>
          <MessageCircle size={20} />
        </button>
        <button onClick={endOrLeave} className="flex h-14 w-14 items-center justify-center rounded-full bg-rose text-white shadow-lg shadow-rose/30 hover:brightness-110">
          {user?.role === 'teacher' ? <Phone size={22} className="rotate-[135deg]" /> : <PhoneOff size={22} />}
        </button>
      </div>
    </div>
  )
}
