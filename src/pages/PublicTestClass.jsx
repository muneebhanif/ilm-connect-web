import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, Send, MessageCircle, X, Sparkles, ArrowLeftRight } from 'lucide-react'
import { api, apiFetch } from '../lib/api.js'

const TEST_CHANNEL = 'ilmconnect-web-test-room'

function slugify(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function PublicTestClass() {
  const [name, setName] = useState('')
  const [role, setRole] = useState('STUDENT')
  const [joined, setJoined] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(true)
  const [chatOpen, setChatOpen] = useState(true)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [remoteUids, setRemoteUids] = useState([])

  const clientRef = useRef(null)
  const localTracksRef = useRef({})
  const dataStreamRef = useRef(null)
  const joinedRef = useRef(false)

  useEffect(() => {
    const savedName = window.localStorage.getItem('ilm_test_class_name')
    const savedRole = window.localStorage.getItem('ilm_test_class_role')
    if (savedName) setName(savedName)
    if (savedRole === 'HOST' || savedRole === 'STUDENT') setRole(savedRole)
  }, [])

  useEffect(() => {
    if (!name.trim()) return
    window.localStorage.setItem('ilm_test_class_name', name.trim())
  }, [name])

  useEffect(() => {
    window.localStorage.setItem('ilm_test_class_role', role)
  }, [role])

  const participantLabel = useMemo(() => role === 'HOST' ? 'Teacher Tester' : 'Student Tester', [role])

  const addRemote = useCallback((uid) => {
    setRemoteUids((prev) => prev.includes(uid) ? prev : [...prev, uid])
  }, [])

  const removeRemote = useCallback((uid) => {
    setRemoteUids((prev) => prev.filter((item) => item !== uid))
  }, [])

  const cleanup = useCallback(async () => {
    joinedRef.current = false
    try {
      if (localTracksRef.current.audioTrack) {
        localTracksRef.current.audioTrack.stop()
        localTracksRef.current.audioTrack.close()
      }
      if (localTracksRef.current.videoTrack) {
        localTracksRef.current.videoTrack.stop()
        localTracksRef.current.videoTrack.close()
      }
      localTracksRef.current = {}
      if (clientRef.current) {
        clientRef.current.removeAllListeners?.()
        await clientRef.current.leave()
      }
    } catch {}
    clientRef.current = null
    dataStreamRef.current = null
    setJoined(false)
    setRemoteUids([])
  }, [])

  useEffect(() => () => { void cleanup() }, [cleanup])

  useEffect(() => {
    if (!joined) return
    const timer = setTimeout(() => {
      const track = localTracksRef.current.videoTrack
      const element = document.getElementById('test-local-player')
      if (track && element) track.play(element)
    }, 100)
    return () => clearTimeout(timer)
  }, [joined])

  useEffect(() => {
    if (!joined || !remoteUids.length) return
    const timer = setTimeout(() => {
      remoteUids.forEach((uid) => {
        const remoteUser = clientRef.current?.remoteUsers?.find((item) => String(item.uid) === String(uid))
        if (remoteUser?.videoTrack) {
          const element = document.getElementById(`test-remote-player-${uid}`)
          if (element) remoteUser.videoTrack.play(element)
        }
      })
    }, 100)
    return () => clearTimeout(timer)
  }, [joined, remoteUids])

  const joinTestClass = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Enter a display name first.')
      return
    }

    setJoining(true)
    setError('')

    try {
      const uid = `${slugify(trimmedName) || 'guest'}-${Date.now()}`
      const tokenData = await apiFetch(api.agoraTestToken(uid, role, TEST_CHANNEL))
      if (!tokenData?.token) throw new Error('Failed to create test class token.')

      const AgoraModule = await import('agora-rtc-sdk-ng')
      const AgoraRTC = AgoraModule.default || AgoraModule
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      clientRef.current = client

      await client.join(tokenData.appId, String(tokenData.channel), tokenData.token, uid)

      const handlePublished = async (remoteUser, mediaType) => {
        if (!joinedRef.current) return
        try {
          await client.subscribe(remoteUser, mediaType)
          if (mediaType === 'audio') remoteUser.audioTrack?.play()
          if (mediaType === 'video') addRemote(String(remoteUser.uid))
        } catch {}
      }

      client.on('user-published', handlePublished)
      client.on('user-unpublished', (remoteUser, mediaType) => {
        if (mediaType === 'video') removeRemote(String(remoteUser.uid))
      })
      client.on('user-left', (remoteUser) => removeRemote(String(remoteUser.uid)))
      client.on('stream-message', (_uid, data) => {
        try {
          const decoded = typeof data === 'string'
            ? data
            : new TextDecoder().decode(data instanceof Uint8Array ? data : new Uint8Array(data))
          const message = JSON.parse(decoded)
          if (message.type === 'chat') {
            setChatMessages((prev) => [...prev, { ...message, id: Date.now() + Math.random(), mine: false }])
          }
        } catch {}
      })

      for (const remoteUser of client.remoteUsers || []) {
        if (remoteUser.hasVideo) await handlePublished(remoteUser, 'video')
        if (remoteUser.hasAudio) await handlePublished(remoteUser, 'audio')
      }

      try {
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
        localTracksRef.current = { audioTrack, videoTrack }
        await client.publish([audioTrack, videoTrack])
        setMicOn(true)
        setCameraOn(true)
      } catch {
        setMicOn(false)
        setCameraOn(false)
      }

      try {
        dataStreamRef.current = await client.createDataStream({ ordered: true, reliable: true })
      } catch {}

      joinedRef.current = true
      setJoined(true)
      setChatMessages((prev) => ([
        ...prev,
        {
          id: Date.now() + Math.random(),
          senderName: 'IlmConnect',
          text: `${trimmedName} joined as ${role === 'HOST' ? 'teacher' : 'student'}. Share this page in another tab/device to test both sides.`,
          at: new Date().toISOString(),
          mine: false,
        },
      ]))
    } catch (joinError) {
      setError(joinError?.message || 'Unable to join the web test class.')
      await cleanup()
    } finally {
      setJoining(false)
    }
  }

  const toggleMic = async () => {
    const track = localTracksRef.current.audioTrack
    if (!track) return
    await track.setEnabled(!micOn)
    setMicOn((prev) => !prev)
  }

  const toggleCamera = async () => {
    const track = localTracksRef.current.videoTrack
    if (!track) return
    await track.setEnabled(!cameraOn)
    setCameraOn((prev) => !prev)
  }

  const sendChat = async () => {
    const text = chatInput.trim()
    if (!text) return
    const payload = {
      type: 'chat',
      senderName: name.trim() || participantLabel,
      text,
      at: new Date().toISOString(),
    }
    setChatMessages((prev) => [...prev, { ...payload, id: Date.now() + Math.random(), mine: true }])
    setChatInput('')
    if (clientRef.current && dataStreamRef.current !== null) {
      try {
        await clientRef.current.sendStreamMessage(dataStreamRef.current, new TextEncoder().encode(JSON.stringify(payload)))
      } catch {}
    }
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      {!joined ? (
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-24 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald/20 bg-emerald/10 px-4 py-2 text-sm font-semibold text-emerald">
                <Sparkles size={16} /> Always-on web test room
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">Test student and teacher live class flow anytime</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">
                This temporary room stays available for quick browser testing. Open it in two tabs or two devices, join once as a teacher and once as a student, then test camera, mic, and chat.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="text-sm font-semibold text-emerald">Channel</div>
                  <div className="mt-2 text-lg font-bold">{TEST_CHANNEL}</div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="text-sm font-semibold text-emerald">Access</div>
                  <div className="mt-2 text-lg font-bold">Public for testing</div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="text-sm font-semibold text-emerald">Best check</div>
                  <div className="mt-2 text-lg font-bold">Two browsers/devices</div>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald">Join the room</div>
                  <div className="mt-1 text-2xl font-black">Web test class</div>
                </div>
                <Link to="/" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10">
                  <ArrowLeftRight size={16} /> Back to site
                </Link>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white/70">Display name</label>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Amina Teacher or Yusuf Student"
                    className="w-full rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-emerald/40 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-white/70">Test as</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setRole('HOST')} className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${role === 'HOST' ? 'border-emerald bg-emerald/15 text-emerald' : 'border-white/10 bg-[#111827] text-white/75 hover:border-emerald/30'}`}>
                      Teacher
                    </button>
                    <button type="button" onClick={() => setRole('STUDENT')} className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${role === 'STUDENT' ? 'border-emerald bg-emerald/15 text-emerald' : 'border-white/10 bg-[#111827] text-white/75 hover:border-emerald/30'}`}>
                      Student
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#111827] p-4 text-sm text-white/70">
                  Join as <span className="font-bold text-white">{participantLabel}</span>. The room is shared, so another browser can join right away with the other role.
                </div>

                {error && <div className="rounded-2xl border border-rose/20 bg-rose/10 px-4 py-3 text-sm text-rose-200">{error}</div>}

                <button onClick={joinTestClass} disabled={joining} className="w-full rounded-2xl bg-gradient-to-r from-emerald to-teal px-6 py-4 text-base font-black text-white shadow-lg shadow-emerald/30 transition hover:brightness-110 disabled:opacity-60">
                  {joining ? 'Connecting…' : 'Join Test Class'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-screen flex-col">
          <div className="flex items-center justify-between border-b border-white/5 bg-[#0B1120]/95 px-4 py-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald">Temporary testing room</div>
              <div className="text-sm text-white/70">{name || participantLabel} • {role === 'HOST' ? 'Teacher' : 'Student'}</div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-white/70">
              <Users size={14} /> {1 + remoteUids.length} connected
            </div>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center bg-[#0B1120]">
              {remoteUids.length === 0 ? (
                <div className="text-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-emerald/20 bg-emerald/10 text-4xl">👤</div>
                  <p className="mt-5 text-sm text-white/40">Waiting for another tester to join…</p>
                </div>
              ) : (
                remoteUids.map((uid) => (
                  <div key={uid} id={`test-remote-player-${uid}`} className="absolute inset-0 bg-[#111827]" />
                ))
              )}
            </div>

            <div id="test-local-player" className="absolute bottom-24 right-4 z-20 h-40 w-28 overflow-hidden rounded-2xl border-2 border-emerald/40 bg-[#0F172A] shadow-xl" />

            {chatOpen && (
              <div className="absolute right-0 top-0 bottom-0 z-30 flex w-80 max-w-full flex-col border-l border-white/5 bg-[#0F172A]/98">
                <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                  <span className="font-semibold text-white">Test chat</span>
                  <button onClick={() => setChatOpen(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto p-3">
                  {chatMessages.length === 0 && <p className="py-10 text-center text-xs text-white/20">No messages yet</p>}
                  {chatMessages.map((message) => (
                    <div key={message.id} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${message.mine ? 'ml-auto bg-emerald text-white' : 'bg-white/8 text-white/80'}`}>
                      {!message.mine && <p className="mb-0.5 text-[10px] font-bold text-emerald/80">{message.senderName}</p>}
                      <p>{message.text}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 border-t border-white/5 p-3">
                  <input
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && sendChat()}
                    placeholder="Type a message…"
                    className="flex-1 rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-emerald/30 focus:outline-none"
                  />
                  <button onClick={sendChat} className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald text-white"><Send size={14} /></button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 border-t border-white/5 bg-[#0F172A]/95 px-4 py-4">
            <button onClick={toggleMic} className={`flex h-12 w-12 items-center justify-center rounded-full transition ${micOn ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-rose/20 text-rose'}`}>
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button onClick={toggleCamera} className={`flex h-12 w-12 items-center justify-center rounded-full transition ${cameraOn ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-rose/20 text-rose'}`}>
              {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            <button onClick={() => setChatOpen((prev) => !prev)} className={`flex h-12 w-12 items-center justify-center rounded-full transition ${chatOpen ? 'bg-emerald/20 text-emerald' : 'bg-white/10 text-white hover:bg-white/15'}`}>
              <MessageCircle size={20} />
            </button>
            <button onClick={() => cleanup()} className="flex h-14 w-14 items-center justify-center rounded-full bg-rose text-white shadow-lg shadow-rose/30 hover:brightness-110">
              <PhoneOff size={22} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}