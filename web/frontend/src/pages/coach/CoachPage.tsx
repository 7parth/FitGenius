import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Bot, User, Plus, Trash2, Settings2 } from 'lucide-react'
import { VoiceButton } from '@/components/ui/VoiceButton'
import { useVoice } from '@/hooks/useVoice'
import { api, getErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface Message {
  role: 'user' | 'assistant'
  content: string
  ts: string
}

export default function CoachPage() {
  const qc = useQueryClient()
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { isListening, isSupported, isSpeaking, transcript, interimTranscript,
    toggleListening, speak, cancelSpeech } = useVoice({
    onResult: (text, isFinal) => {
      if (isFinal) setInput(prev => prev + text)
    },
  })

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get('/coach/conversations').then(r => r.data),
  })

  const { data: convDetail } = useQuery({
    queryKey: ['conversation', activeConvId],
    queryFn: () => api.get(`/coach/conversations/${activeConvId}`).then(r => r.data),
    enabled: !!activeConvId,
  })

  useEffect(() => {
    if (convDetail?.messages) setMessages(convDetail.messages)
  }, [convDetail])

  // Auto-send when voice transcript is finalised and listening stops
  useEffect(() => {
    if (!isListening && transcript && voiceEnabled) {
      setInput(transcript)
    }
  }, [isListening, transcript, voiceEnabled])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      api.post('/coach/message', { content, conversation_id: activeConvId }).then(r => r.data),
    onMutate: (content) => {
      const userMsg: Message = { role: 'user', content, ts: new Date().toISOString() }
      setMessages(prev => [...prev, userMsg])
      setIsStreaming(true)
    },
    onSuccess: (data) => {
      const assistantMsg: Message = { role: 'assistant', content: data.reply, ts: new Date().toISOString() }
      setMessages(prev => [...prev, assistantMsg])
      if (!activeConvId) setActiveConvId(data.conversation_id)
      qc.invalidateQueries({ queryKey: ['conversations'] })
      // Speak the reply if voice mode is active
      if (voiceEnabled) speak(data.reply, { rate: 1.0 })
    },
    onError: () => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        ts: new Date().toISOString(),
      }])
    },
    onSettled: () => setIsStreaming(false),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/coach/conversations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      if (activeConvId) { setActiveConvId(null); setMessages([]) }
    },
  })

  const handleSend = () => {
    const content = input.trim()
    if (!content || sendMutation.isPending) return
    setInput('')
    sendMutation.mutate(content)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const startNew = () => {
    setActiveConvId(null)
    setMessages([])
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 gap-2" aria-label="Conversations">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">Conversations</h2>
          <button onClick={startNew} className="btn-ghost p-1.5" aria-label="New conversation">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1">
          {conversations.map((conv: any) => (
            <div
              key={conv.id}
              className={cn(
                'flex items-center justify-between rounded-xl px-3 py-2 cursor-pointer group transition-colors',
                conv.id === activeConvId ? 'bg-primary-500/10 text-primary-300' : 'hover:bg-surface-700 text-gray-400'
              )}
            >
              <button
                className="flex-1 text-left truncate text-sm"
                onClick={() => setActiveConvId(conv.id)}
                aria-current={conv.id === activeConvId ? 'true' : undefined}
              >
                {conv.title}
              </button>
              <button
                onClick={() => deleteMutation.mutate(conv.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition"
                aria-label={`Delete conversation: ${conv.title}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Chat */}
      <div className="flex flex-col flex-1 min-w-0 card overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" aria-live="polite" aria-label="Chat messages">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
              <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center">
                <Bot className="w-8 h-8 text-primary-400" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">FitGenius AI Coach</h3>
                <p className="text-sm text-gray-400 max-w-xs">
                  Ask me anything about workouts, form, nutrition, or recovery.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm mt-2">
                {[
                  'How do I improve my squat form?',
                  'What should I eat before a workout?',
                  'Help me plan a recovery week',
                  'What is progressive overload?',
                ].map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => { setInput(prompt); }}
                    className="text-xs text-left p-3 rounded-xl bg-surface-700 hover:bg-surface-600 text-gray-400 hover:text-white transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn('flex gap-3 max-w-[85%]', msg.role === 'user' ? 'ml-auto flex-row-reverse' : '')}
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                msg.role === 'user' ? 'bg-primary-500/20' : 'bg-surface-600'
              )} aria-hidden="true">
                {msg.role === 'user'
                  ? <User className="w-4 h-4 text-primary-400" />
                  : <Bot className="w-4 h-4 text-gray-300" />
                }
              </div>
              <div className={cn(
                'rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                msg.role === 'user'
                  ? 'bg-primary-500/20 text-white rounded-tr-sm'
                  : 'bg-surface-700 text-gray-200 rounded-tl-sm'
              )}>
                {msg.content}
              </div>
            </div>
          ))}

          {isStreaming && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-surface-600 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <Bot className="w-4 h-4 text-gray-300" />
              </div>
              <div className="bg-surface-700 rounded-2xl rounded-tl-sm px-4 py-3" aria-label="AI is typing">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-surface-700 p-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                value={input + (isListening ? interimTranscript : '')}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? 'Listening…' : 'Ask your AI coach…'}
                rows={1}
                className="input w-full resize-none min-h-[42px] max-h-32 overflow-y-auto pr-10"
                aria-label="Message to AI coach"
                disabled={sendMutation.isPending || isListening}
              />
              {isListening && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
              )}
            </div>
            {isSupported && (
              <VoiceButton
                isListening={isListening}
                isSupported={isSupported}
                isSpeaking={isSpeaking}
                onToggle={() => { setVoiceEnabled(true); toggleListening() }}
                onCancelSpeech={cancelSpeech}
                aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
              />
            )}
            <button
              onClick={handleSend}
              disabled={!input.trim() || sendMutation.isPending}
              className="btn-primary p-2.5 flex-shrink-0 disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-600">AI responses are for general guidance only — not medical advice.</p>
            {isSupported && (
              <button
                onClick={() => setVoiceEnabled(v => !v)}
                className={cn('text-xs flex items-center gap-1 transition-colors', voiceEnabled ? 'text-primary-400' : 'text-gray-600 hover:text-gray-400')}
                aria-pressed={voiceEnabled}
              >
                <Settings2 className="w-3 h-3" aria-hidden="true" />
                {voiceEnabled ? 'Voice replies on' : 'Voice replies off'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
