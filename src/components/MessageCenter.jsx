import { useEffect, useMemo, useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Send, MessageCircle, ImagePlus, X, ZoomIn } from 'lucide-react'
import { api, authFetch } from '../lib/api'
import { fileToBase64, getFileExtension } from '../lib/files.js'
import { EmptyState, SectionCard, TextInput, StatusPill } from './dashboard-ui'
import { AuthButtonSkeleton, MessageCenterSkeleton } from './skeletons.jsx'

export default function MessageCenter({ token, currentUserId, compact = false }) {
  const qc = useQueryClient()
  const [activeConversation, setActiveConversation] = useState(null)
  const [message, setMessage] = useState('')
  const [imagePreview, setImagePreview] = useState(null)
  const [viewImage, setViewImage] = useState(null)
  const fileInputRef = useRef(null)
  const chatEndRef = useRef(null)

  const conversationsQuery = useQuery({
    queryKey: ['conversations', currentUserId],
    queryFn: () => authFetch(api.conversations(), token),
    enabled: !!token && !!currentUserId,
  })

  const conversations = conversationsQuery.data?.conversations || []

  useEffect(() => {
    if (!activeConversation && conversations.length > 0) {
      setActiveConversation(conversations[0])
    }
  }, [conversations, activeConversation])

  const messagesQuery = useQuery({
    queryKey: ['conversation', activeConversation?.otherUserId],
    queryFn: () => authFetch(api.conversation(activeConversation.otherUserId), token),
    enabled: !!token && !!activeConversation?.otherUserId,
  })

  const messages = messagesQuery.data?.messages || []

  const sendMessage = useMutation({
    mutationFn: (payload) => authFetch(api.sendMessage(), token, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    onSuccess: async () => {
      setMessage('')
      setImagePreview(null)
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['conversations', currentUserId] }),
        qc.invalidateQueries({ queryKey: ['conversation', activeConversation?.otherUserId] }),
      ])
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    },
  })

  // Auto scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const conversationLabel = useMemo(() => {
    if (!activeConversation?.otherUser) return 'Conversation'
    return activeConversation.otherUser.full_name || 'Conversation'
  }, [activeConversation])

  const handleSubmit = (e) => {
    e.preventDefault()
    if ((!message.trim() && !imagePreview) || !activeConversation?.otherUserId) return
    if (imagePreview) {
      sendMessage.mutate({ receiver_id: activeConversation.otherUserId, content: message.trim() || 'Sent an image', message_type: 'image', image: imagePreview.base64, fileExtension: imagePreview.ext })
    } else {
      sendMessage.mutate({ receiver_id: activeConversation.otherUserId, content: message.trim(), message_type: 'text' })
    }
  }

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert('Image must be under 10MB'); return }
    const base64 = await fileToBase64(file)
    const ext = getFileExtension(file.name)
    setImagePreview({ url: URL.createObjectURL(file), base64, ext })
  }

  return (
    <SectionCard
      title="Messages"
      subtitle="Send and receive messages with teachers, students, and parents."
      className={compact ? '' : 'overflow-hidden'}
    >
      {conversationsQuery.isLoading ? (
        <MessageCenterSkeleton />
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No conversations yet"
          text="Once you chat with a teacher, parent, or student, your conversations will appear here."
        />
      ) : (
        <div className={`grid gap-5 ${compact ? '' : 'lg:grid-cols-[280px_minmax(0,1fr)]'}`}>
          <div className="space-y-3">
            {conversations.map((conversation) => {
              const selected = conversation.id === activeConversation?.id
              return (
                <button
                  key={conversation.id}
                  onClick={() => setActiveConversation(conversation)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all ${selected ? 'border-emerald bg-emerald/6' : 'border-parchment/50 bg-ivory/60 hover:border-emerald/20'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-ink">{conversation.otherUser?.full_name || 'Conversation'}</div>
                      <div className="mt-1 truncate text-xs text-bark">{conversation.last_message_preview || 'No messages yet'}</div>
                    </div>
                    {conversation.unreadCount ? <StatusPill tone="emerald">{conversation.unreadCount}</StatusPill> : null}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="rounded-[24px] border border-parchment/50 bg-ivory/55 p-4">
            <div className="mb-4 border-b border-parchment/40 pb-4">
              <div className="font-display text-xl font-bold text-ink">{conversationLabel}</div>
              <div className="text-sm text-bark">Secure in-app messaging</div>
            </div>

            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {messagesQuery.isLoading ? (
                <MessageCenterSkeleton />
              ) : messages.length === 0 ? (
                <div className="py-12 text-center text-sm text-bark">Start the conversation.</div>
              ) : messages.map((item) => {
                const mine = item.sender_id === currentUserId
                const isImage = item.message_type === 'image' || item.image_url
                return (
                  <div key={item.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${mine ? 'bg-emerald text-white' : 'bg-white text-ink border border-parchment/50'}`}>
                      {isImage && item.image_url && (
                        <button onClick={() => setViewImage(item.image_url)} className="mb-2 block overflow-hidden rounded-xl">
                          <img src={item.image_url} alt="Shared" className="max-h-48 max-w-full rounded-xl object-cover hover:opacity-90 transition" />
                        </button>
                      )}
                      {item.content && !isImage && <div>{item.content}</div>}
                      {item.content && isImage && item.content !== 'Sent an image' && <div className="mt-1">{item.content}</div>}
                      <div className={`mt-2 text-[11px] ${mine ? 'text-white/70' : 'text-bark'}`}>{new Date(item.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                )
              })}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="mt-4">
              {imagePreview && (
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-parchment/50 bg-ivory/60 p-2">
                  <img src={imagePreview.url} alt="Preview" className="h-16 w-16 rounded-lg object-cover" />
                  <span className="flex-1 text-xs text-bark">Image ready to send</span>
                  <button type="button" onClick={() => setImagePreview(null)} className="rounded-lg p-1 text-bark hover:bg-rose/10 hover:text-rose"><X size={14} /></button>
                </div>
              )}
              <div className="flex gap-3">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl border border-parchment/50 text-bark hover:border-emerald/30 hover:text-emerald transition">
                  <ImagePlus size={18} />
                </button>
                <TextInput label="" placeholder="Type your message" value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-[52px] flex-1" />
                <button type="submit" disabled={sendMessage.isPending || !activeConversation?.otherUserId} className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-emerald text-white shadow-lg shadow-emerald/20 transition disabled:opacity-50">
                  {sendMessage.isPending ? <AuthButtonSkeleton /> : <Send size={18} />}
                </button>
              </div>
            </form>

            {viewImage && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setViewImage(null)}>
                <button className="absolute right-4 top-4 rounded-xl bg-white/10 p-2 text-white hover:bg-white/20"><X size={20} /></button>
                <img src={viewImage} alt="Full" className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain" />
              </div>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  )
}
