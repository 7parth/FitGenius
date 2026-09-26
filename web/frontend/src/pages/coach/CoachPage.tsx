import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useVoice } from '@/hooks/useVoice'
import { toast } from '@/components/ui/Toast'

type Message = { role: 'user' | 'assistant'; content: string; ts: string; localId: string }
type ConversationSummary = { id: string; title: string; message_count: number; last_message_at: string | null; created_at: string }
type Telemetry = { source: string; recorded_at: string; resting_heart_rate?: number | null; avg_heart_rate?: number | null; hrv_ms?: number | null; sleep_hours?: number | null; sleep_quality_score?: number | null; recovery_score?: number | null; fatigue_level?: string }
const quickPrompts = [
  { label: 'Adjust for knee pain', prompt: 'I have knee discomfort. How can I adapt my workout safely?' },
  { label: 'Post-workout meal ideas', prompt: 'Suggest a post-workout meal that supports recovery.' },
  { label: 'Analyze weekly progress', prompt: 'Review my recent workouts and suggest one practical progression.' },
  { label: 'Warm-up sequence', prompt: 'Give me a short warm-up for my next workout.' },
]
const nowLabel = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

export default function CoachPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [voiceReplies, setVoiceReplies] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [telemetryOpen, setTelemetryOpen] = useState(false)
  const [selectingConversation, setSelectingConversation] = useState(false)
  const [attachedName, setAttachedName] = useState('')
  const [lastReplyProvider, setLastReplyProvider] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const engine = useQuery({ queryKey: ['coach-engine'], queryFn: () => api.get('/coach/engine').then(response => response.data) })
  const conversations = useQuery<ConversationSummary[]>({ queryKey: ['coach-conversations'], queryFn: () => api.get('/coach/conversations').then(response => response.data) })
  const profile = useQuery({ queryKey: ['profile-me'], queryFn: () => api.get('/profile/me').then(response => response.data) })
  const wearable = useQuery<Telemetry | null>({ queryKey: ['coach-wearable'], queryFn: () => api.get('/wearables/data?page=1&page_size=1').then(response => response.data[0] ?? null) })
  const fatigue = useQuery({ queryKey: ['wearable-fatigue'], queryFn: () => api.get('/wearables/fatigue').then(response => response.data) })
  const workoutHistory = useQuery({ queryKey: ['coach-workout-history'], queryFn: () => api.get('/workouts/history?page=1&page_size=3').then(response => response.data.items) })

  const voice = useVoice({ onResult: (transcript, isFinal) => { if (isFinal) setInput(current => `${current}${current ? ' ' : ''}${transcript}`) } })

  const sendMessage = useMutation({
    mutationFn: ({ content, localId: _localId }: { content: string; localId: string }) => api.post('/coach/message', { content, conversation_id: conversationId }).then(response => response.data),
    onMutate: ({ content, localId }) => setMessages(current => [...current, { role: 'user', content, ts: nowLabel(), localId }]),
    onSuccess: response => {
      setConversationId(response.conversation_id)
      setLastReplyProvider(response.engine ?? null)
      setMessages(current => [...current, { role: 'assistant', content: response.reply, ts: nowLabel(), localId: crypto.randomUUID() }])
      void queryClient.invalidateQueries({ queryKey: ['coach-conversations'] })
      void queryClient.invalidateQueries({ queryKey: ['coach-conversation', response.conversation_id] })
      if (voiceReplies) voice.speak(response.reply)
    },
    onError: (error, variables) => {
      setMessages(current => current.filter(message => message.localId !== variables.localId))
      setInput(current => current || variables.content)
      toast.error(getErrorMessage(error))
    },
  })

  const deleteConversation = useMutation({
    mutationFn: (id: string) => api.delete(`/coach/conversations/${id}`),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: ['coach-conversations'] })
      if (conversationId === id) startNewConversation()
      toast.info('Conversation deleted.')
    },
    onError: error => toast.error(getErrorMessage(error)),
  })

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, sendMessage.isPending])

  const startNewConversation = () => {
    setConversationId(null)
    setMessages([])
    setInput('')
    setHistoryOpen(false)
    setAttachedName('')
  }

  const selectConversation = async (item: ConversationSummary) => {
    setSelectingConversation(true)
    try {
      const { data } = await api.get(`/coach/conversations/${item.id}`)
      setConversationId(item.id)
      setMessages(data.messages.map((message: { role: 'user' | 'assistant'; content: string; ts: string }, index: number) => ({ ...message, localId: `${item.id}-${index}` })))
      setHistoryOpen(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSelectingConversation(false)
    }
  }

  const submitMessage = (content = input) => {
    const trimmed = content.trim()
    if (!trimmed || sendMessage.isPending) return
    sendMessage.mutate({ content: trimmed, localId: crypto.randomUUID() })
    setInput('')
    setAttachedName('')
  }

  const recalibrate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['coach-engine'] }),
      queryClient.invalidateQueries({ queryKey: ['coach-conversations'] }),
      queryClient.invalidateQueries({ queryKey: ['profile-me'] }),
      queryClient.invalidateQueries({ queryKey: ['coach-wearable'] }),
      queryClient.invalidateQueries({ queryKey: ['wearable-fatigue'] }),
      queryClient.invalidateQueries({ queryKey: ['coach-workout-history'] }),
    ])
    toast.success('Coach context refreshed from your latest profile and wearable data.')
  }

  const attachTextFile = async (file?: File) => {
    if (!file) return
    if (!/\.(txt|csv|json)$/i.test(file.name)) return toast.error('Attach a .txt, .csv, or .json telemetry export.')
    if (file.size > 50_000) return toast.error('File is larger than 50 KB. Attach a smaller export.')
    try {
      const text = await file.text()
      setInput(current => `${current}${current ? '\n\n' : ''}[Attached ${file.name}]\n${text.slice(0, 3500)}`.slice(0, 4000))
      setAttachedName(file.name)
      toast.success('File contents added to your draft. Review it before sending.')
    } catch {
      toast.error('Could not read that file.')
    }
  }

  const latestWorkout = workoutHistory.data?.[0]
  const displayFatigue = fatigue.data?.fatigue_level
  const engineLabel = lastReplyProvider
    ? `Last reply · ${lastReplyProvider}`
    : engine.data?.active
      ? `${engine.data.provider} · ${engine.data.model}`
      : 'Offline response mode'
  const syncedAt = wearable.data?.recorded_at ? new Date(wearable.data.recorded_at).toLocaleString() : null

  return <main className="grid w-full grid-cols-12 items-start gap-5 pb-8">
    <section className="relative col-span-12 flex h-[calc(100vh-6rem)] min-h-[560px] flex-col overflow-hidden rounded-2xl bg-surface-container-low shadow-[0_4px_30px_rgba(0,0,0,0.6)] xl:col-span-8">
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-tertiary-container/10 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 h-96 w-96 rounded-full bg-primary-container/10 blur-[120px]" />
      <header className="z-10 flex items-center justify-between gap-3 border-b border-surface-container-high/40 bg-surface-container/90 px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="flex min-w-0 items-center gap-3"><div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-tertiary-container/20 text-tertiary"><span className="material-symbols-outlined text-2xl">psychology</span><span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ${engine.data?.active ? 'bg-secondary' : 'bg-tertiary-fixed-dim'}`} /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="font-bold text-on-surface">Coach FitGenius</h1><span className="rounded-full bg-tertiary-container/20 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-tertiary">BIO-AI</span></div><p className="truncate text-xs text-on-surface-variant">{engine.isLoading ? 'Checking coach engine…' : engineLabel}</p></div></div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={() => setTelemetryOpen(true)} aria-label="Session telemetry log" title="Session telemetry log" className="rounded-lg bg-surface-container-high p-2 text-on-surface-variant hover:text-on-surface"><span className="material-symbols-outlined">timeline</span></button>
          <button type="button" onClick={() => setHistoryOpen(true)} aria-label="Conversation history" title="Conversation history" className="rounded-lg bg-surface-container-high p-2 text-on-surface-variant hover:text-on-surface"><span className="material-symbols-outlined">forum</span></button>
          <button type="button" onClick={() => { setVoiceReplies(current => !current); if (voiceReplies) voice.cancelSpeech() }} aria-pressed={voiceReplies} aria-label={voiceReplies ? 'Mute coach voice replies' : 'Enable coach voice replies'} title="Voice replies" className={`rounded-lg p-2 ${voiceReplies ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant'}`}><span className="material-symbols-outlined">{voiceReplies ? 'volume_up' : 'volume_off'}</span></button>
          <button type="button" onClick={() => void recalibrate()} disabled={engine.isFetching || wearable.isFetching} className="flex items-center gap-1.5 rounded-lg bg-surface-container-high px-3 py-2 text-sm text-on-surface disabled:opacity-50"><span className="material-symbols-outlined text-base">refresh</span><span className="hidden sm:inline">Refresh data</span></button>
          <button type="button" onClick={startNewConversation} className="rounded-lg bg-primary-container px-3 py-2 text-sm font-bold text-on-primary-container">New chat</button>
        </div>
      </header>

      <div className="z-10 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="flex justify-center"><span className="rounded-full bg-surface-container px-3 py-1 text-center text-xs text-on-surface-variant">{conversationId ? 'Conversation restored' : `New session · ${nowLabel()}`} · {syncedAt ? `Telemetry synced ${syncedAt}` : 'No wearable telemetry connected'}</span></div>
        {!messages.length && <div className="mx-auto mt-10 max-w-xl rounded-2xl bg-surface-container p-6 text-center"><span className="material-symbols-outlined text-4xl text-tertiary">neurology</span><h2 className="mt-3 text-xl font-semibold text-on-surface">How can I help with your training?</h2><p className="mt-2 text-sm text-on-surface-variant">Ask about workout planning, exercise technique, recovery, or nutrition. Your profile and latest wearable readings are included when available.</p></div>}
        {messages.map(message => <MessageBubble key={message.localId} message={message} userName={user?.display_name || 'You'} onOpenPlanner={() => navigate('/workout/recommend')} onCustomizeRoutine={routine => submitMessage(`Please customize this routine for me:\n${routine}`)} />)}
        {sendMessage.isPending && <div className="flex items-center gap-3 text-sm text-on-surface-variant" role="status"><span className="h-2 w-2 animate-pulse rounded-full bg-tertiary" />Coach is thinking…</div>}
        <div ref={bottomRef} />
      </div>

      <footer className="z-10 flex flex-col gap-3 border-t border-surface-container-high/40 bg-surface-container/95 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-2 overflow-x-auto pb-1"><span className="shrink-0 text-xs uppercase tracking-wider text-on-surface-variant">Quick prompts:</span>{quickPrompts.map(item => <button key={item.label} type="button" disabled={sendMessage.isPending} onClick={() => submitMessage(item.prompt)} className="shrink-0 rounded-full bg-surface-container-high px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container-highest disabled:opacity-50">{item.label}</button>)}</div>
        {attachedName && <div className="flex items-center justify-between rounded-lg bg-surface-container-high px-3 py-2 text-xs text-on-surface-variant"><span>Draft attachment: {attachedName}</span><button type="button" onClick={() => { setAttachedName(''); setInput(current => current.replace(/\n?\[Attached [^\]]+\]\n[\s\S]*$/, '')) }} aria-label="Remove attachment" className="text-error">Remove</button></div>}
        <form className="flex items-center gap-2" onSubmit={event => { event.preventDefault(); submitMessage() }}>
          <div className="relative flex min-w-0 flex-1 items-center"><input ref={fileInputRef} type="file" accept=".txt,.csv,.json,text/plain,text/csv,application/json" className="hidden" onChange={event => { void attachTextFile(event.target.files?.[0]); event.currentTarget.value = '' }} /><button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Attach telemetry text or CSV" title="Attach text, CSV, or JSON telemetry" className="absolute left-2 rounded-lg p-1.5 text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined">attach_file</span></button><input value={input} onChange={event => setInput(event.target.value)} aria-label="Message Coach FitGenius" placeholder="Ask Coach FitGenius anything…" maxLength={4000} className="w-full rounded-xl bg-surface-container-high py-3 pl-11 pr-12 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary-container" /><button type="button" disabled={!voice.isSupported} onClick={voice.toggleListening} aria-label={voice.isListening ? 'Stop voice input' : 'Use voice input'} aria-pressed={voice.isListening} title={voice.isSupported ? voice.isListening ? 'Stop voice input' : 'Voice input' : 'Voice input is not supported in this browser'} className={`absolute right-2 rounded-lg p-1.5 ${voice.isListening ? 'animate-pulse text-error' : 'text-on-surface-variant hover:text-tertiary'} disabled:opacity-40`}><span className="material-symbols-outlined">{voice.isListening ? 'mic_off' : 'mic'}</span></button></div>
          <button type="submit" disabled={!input.trim() || sendMessage.isPending} aria-label="Send message" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-container text-on-primary-container shadow-[0_0_20px_rgba(0,240,255,0.3)] disabled:cursor-not-allowed disabled:opacity-40"><span className="material-symbols-outlined text-2xl">arrow_upward</span></button>
        </form>
        <p className="text-[11px] text-on-surface-variant">Wellness coaching only — not medical advice. For pain, injury, or medical concerns, consult a qualified health professional.</p>
      </footer>
    </section>

    <aside className="col-span-12 flex flex-col gap-4 xl:col-span-4">
      <section className="rounded-2xl bg-surface-container-low p-5 shadow-lg">
        <div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-on-surface">{user?.display_name || 'Athlete'}</h2><p className="text-sm capitalize text-on-surface-variant">{profile.data?.fitness_level ?? 'Fitness profile'} · {(profile.data?.primary_goal ?? 'goal not set').replace(/_/g, ' ')}</p></div><span className="material-symbols-outlined text-secondary">account_circle</span></div>
        <div className="mt-4 grid grid-cols-3 gap-2">{[["Age", profile.data?.age ? `${profile.data.age}` : '—'], ['Weight', profile.data?.weight_kg ? `${profile.data.weight_kg} kg` : '—'], ['Height', profile.data?.height_cm ? `${profile.data.height_cm} cm` : '—']].map(([label, value]) => <div key={label} className="rounded-xl bg-surface-container p-3"><p className="text-[10px] uppercase text-on-surface-variant">{label}</p><p className="mt-1 text-sm font-semibold text-on-surface">{value}</p></div>)}</div>
        <p className="mt-3 text-xs text-on-surface-variant">{profile.data?.preferred_duration_minutes ? `${profile.data.preferred_duration_minutes} min preferred sessions` : 'Complete your fitness profile for more tailored coaching.'}</p>
      </section>

      <section className="rounded-2xl bg-surface-container-low p-5 shadow-lg">
        <div className="flex items-center justify-between"><h2 className="font-semibold uppercase tracking-wide text-on-surface">Recovery & strain</h2><span className={`text-xs font-semibold ${displayFatigue === 'RECOVERY' ? 'text-error' : displayFatigue === 'REDUCED' ? 'text-tertiary-fixed-dim' : 'text-secondary'}`}>{displayFatigue ?? 'NO DATA'}</span></div>
        {fatigue.data?.recommendation_note ? <p className="mt-3 text-sm text-on-surface-variant">{fatigue.data.recommendation_note}</p> : <p className="mt-3 text-sm text-on-surface-variant">No recovery assessment yet. Add a wearable reading to personalize training suggestions.</p>}
        {fatigue.data?.disclaimer && <p className="mt-2 text-xs text-on-surface-variant">{fatigue.data.disclaimer}</p>}
        {fatigue.data?.fatigue_confidence != null && <div className="mt-4"><div className="flex justify-between text-xs text-on-surface-variant"><span>Assessment confidence</span><span>{Math.round(fatigue.data.fatigue_confidence * 100)}%</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-container-high"><div className="h-full rounded-full bg-secondary" style={{ width: `${Math.max(0, Math.min(100, fatigue.data.fatigue_confidence * 100))}%` }} /></div></div>}
      </section>

      <section className="rounded-2xl bg-surface-container-low p-5 shadow-lg"><div className="flex items-center justify-between"><h2 className="font-semibold uppercase tracking-wide text-on-surface">Wearable vitals</h2><span className={`h-2 w-2 rounded-full ${wearable.data ? 'bg-secondary' : 'bg-on-surface-variant'}`} /></div>{wearable.data ? <div className="mt-3 grid grid-cols-2 gap-3"><Vital label="Resting HR" value={wearable.data.resting_heart_rate} unit="bpm" icon="favorite" /><Vital label="HRV" value={wearable.data.hrv_ms} unit="ms" icon="ecg_heart" /><Vital label="Sleep" value={wearable.data.sleep_hours} unit="h" icon="bedtime" /><Vital label="Recovery" value={wearable.data.recovery_score} unit="/100" icon="monitor_heart" /></div> : <p className="mt-3 text-sm text-on-surface-variant">No wearable data is connected. The coach will use your profile and workout history instead.</p>}{syncedAt && <p className="mt-3 text-xs text-on-surface-variant">Latest reading: {syncedAt} · {wearable.data?.source}</p>}</section>

      <section className="rounded-2xl bg-surface-container-low p-5 shadow-lg"><div className="flex items-center justify-between"><h2 className="font-semibold uppercase tracking-wide text-on-surface">Recent training</h2><span className="text-xs text-on-surface-variant">Last 3 sessions</span></div>{workoutHistory.isLoading ? <p className="mt-3 text-sm text-on-surface-variant">Loading workout history…</p> : workoutHistory.data?.length ? <ul className="mt-3 divide-y divide-outline-variant/30">{workoutHistory.data.map((workout: { id: string; name: string; completed_at?: string | null; duration_seconds?: number | null; total_volume_kg: number }) => <li key={workout.id} className="py-3"><p className="font-medium text-on-surface">{workout.name}</p><p className="mt-1 text-xs text-on-surface-variant">{workout.completed_at ? new Date(workout.completed_at).toLocaleDateString() : 'In progress'} · {workout.duration_seconds ? `${Math.round(workout.duration_seconds / 60)} min` : 'duration unavailable'} · {Math.round(workout.total_volume_kg)} kg volume</p></li>)}</ul> : <p className="mt-3 text-sm text-on-surface-variant">Completed sessions will appear here to inform your coaching.</p>}</section>

      <section className="rounded-2xl bg-surface-container-low p-5 shadow-lg"><div className="flex items-center justify-between"><h2 className="font-semibold uppercase tracking-wide text-on-surface">Coach engine</h2><span className="rounded-full bg-surface-container-high px-2 py-1 text-xs text-primary">{engine.data?.status ?? 'checking'}</span></div><p className="mt-2 text-sm text-on-surface-variant">{engine.data?.description ?? (engine.isError ? 'Engine status unavailable.' : 'Checking configured provider…')}</p><button type="button" onClick={() => void queryClient.invalidateQueries({ queryKey: ['coach-engine'] })} className="mt-3 text-xs font-semibold text-primary underline">Check engine status</button></section>
    </aside>

    {historyOpen && <div className="fixed inset-0 z-50 flex justify-end bg-background/70" onMouseDown={event => { if (event.target === event.currentTarget) setHistoryOpen(false) }}><section role="dialog" aria-modal="true" aria-label="Conversation history" className="flex h-full w-full max-w-md flex-col bg-surface-container-low p-5 shadow-2xl"><header className="flex items-center justify-between"><div><h2 className="text-xl font-bold text-on-surface">Conversation history</h2><p className="text-sm text-on-surface-variant">Your saved coaching chats</p></div><button type="button" aria-label="Close history" onClick={() => setHistoryOpen(false)} className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-high"><span className="material-symbols-outlined">close</span></button></header><button type="button" onClick={startNewConversation} className="mt-5 rounded-lg bg-primary-container px-4 py-3 font-bold text-on-primary-container">Start a new chat</button><div className="mt-4 flex-1 overflow-y-auto">{conversations.isLoading ? <p className="text-sm text-on-surface-variant">Loading conversations…</p> : conversations.data?.length ? conversations.data.map(item => <div key={item.id} className={`mb-2 flex items-center gap-2 rounded-xl p-3 ${conversationId === item.id ? 'bg-primary-container/10' : 'bg-surface-container'}`}><button type="button" disabled={selectingConversation} onClick={() => void selectConversation(item)} className="min-w-0 flex-1 text-left disabled:opacity-50"><p className="truncate font-medium text-on-surface">{item.title}</p><p className="mt-1 text-xs text-on-surface-variant">{item.message_count} messages · {item.last_message_at ? new Date(item.last_message_at).toLocaleDateString() : 'Not sent'}</p></button><button type="button" disabled={deleteConversation.isPending} aria-label={`Delete conversation ${item.title}`} onClick={() => deleteConversation.mutate(item.id)} className="rounded-lg p-2 text-on-surface-variant hover:bg-error-container/20 hover:text-error"><span className="material-symbols-outlined text-lg">delete</span></button></div>) : <p className="mt-5 text-sm text-on-surface-variant">No saved conversations yet.</p>}</div></section></div>}

    {telemetryOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4" onMouseDown={event => { if (event.target === event.currentTarget) setTelemetryOpen(false) }}><section role="dialog" aria-modal="true" aria-label="Session telemetry" className="w-full max-w-lg rounded-2xl bg-surface-container-low p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-xl font-bold text-on-surface">Session telemetry</h2><button type="button" aria-label="Close telemetry" onClick={() => setTelemetryOpen(false)} className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-high"><span className="material-symbols-outlined">close</span></button></div><p className="mt-1 text-sm text-on-surface-variant">Most recent values available to Coach FitGenius.</p>{wearable.data ? <dl className="mt-4 grid grid-cols-2 gap-3">{[['Source', wearable.data.source], ['Recorded', syncedAt ?? '—'], ['Resting heart rate', wearable.data.resting_heart_rate != null ? `${wearable.data.resting_heart_rate} bpm` : '—'], ['HRV', wearable.data.hrv_ms != null ? `${wearable.data.hrv_ms} ms` : '—'], ['Sleep', wearable.data.sleep_hours != null ? `${wearable.data.sleep_hours} hours` : '—'], ['Recovery', wearable.data.recovery_score != null ? `${wearable.data.recovery_score}/100` : '—'], ['Fatigue', fatigue.data?.fatigue_level ?? '—'], ['Recent workout', latestWorkout?.name ?? 'None recorded']].map(([label, value]) => <div key={label} className="rounded-lg bg-surface-container p-3"><dt className="text-xs text-on-surface-variant">{label}</dt><dd className="mt-1 text-sm font-semibold text-on-surface">{value}</dd></div>)}</dl> : <p className="mt-4 rounded-lg bg-surface-container p-4 text-sm text-on-surface-variant">No wearable telemetry is available yet. Connect or manually add data in Wearables.</p>}<button type="button" onClick={() => { setTelemetryOpen(false); navigate('/wearables') }} className="mt-4 rounded-lg bg-surface-container-high px-4 py-2 font-semibold text-on-surface">Open wearable settings</button></section></div>}
  </main>
}

function MessageBubble({ message, userName, onOpenPlanner, onCustomizeRoutine }: { message: Message; userName: string; onOpenPlanner: () => void; onCustomizeRoutine: (routine: string) => void }) {
  if (message.role === 'user') return <div className="flex justify-end gap-3 pl-8 sm:pl-12"><div className="flex max-w-xl flex-col items-end gap-1.5"><div className="flex items-baseline gap-2"><span className="text-xs text-on-surface-variant">{message.ts}</span><span className="text-sm font-semibold text-primary">{userName}</span></div><div className="whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-surface-container-high p-4 text-on-surface shadow">{message.content}</div></div><div aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-container/15 text-xs font-bold text-primary">{userName.slice(0, 1).toUpperCase()}</div></div>
  const routineLines = message.content.split('\n').filter(line => /\b\d+\s*(?:sets?\s*[×x]\s*\d+|sets?\s*(?:of\s*)?\d+\s*reps?)\b/i.test(line))
  return <div className="flex max-w-3xl items-start gap-3.5"><div aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-tertiary-container/20 text-tertiary"><span className="material-symbols-outlined text-base">neurology</span></div><div className="w-full"><div className="mb-1.5 flex items-baseline gap-2"><span className="text-sm font-semibold text-tertiary">FitGenius Bio-Core</span><span className="text-xs text-on-surface-variant">{message.ts}</span></div><div className="rounded-2xl rounded-tl-sm bg-surface-container p-4 text-on-surface shadow"><div className="prose-coach"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>, strong: ({ children }) => <strong className="font-semibold text-on-surface">{children}</strong>, h2: ({ children }) => <h2 className="mb-1 mt-3 text-lg font-semibold text-on-surface">{children}</h2>, h3: ({ children }) => <h3 className="mb-1 mt-2 font-semibold text-on-surface">{children}</h3>, ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>, ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>, li: ({ children }) => <li className="leading-relaxed">{children}</li>, blockquote: ({ children }) => <blockquote className="my-2 border-l-2 border-primary-container pl-3 italic text-on-surface-variant">{children}</blockquote>, code: ({ children }) => <code className="rounded bg-surface-container-high px-1.5 py-0.5 text-primary">{children}</code> }}>{message.content}</ReactMarkdown></div></div>{routineLines.length > 0 ? <div className="mt-3 rounded-xl bg-surface-container-high p-4"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary">healing</span><h3 className="font-semibold text-on-surface">Routine from this coaching reply</h3></div><ul className="mt-2 space-y-2">{routineLines.map((line, index) => <li key={`${index}-${line}`} className="rounded-lg bg-surface-container/70 p-3 text-sm text-on-surface">{line.replace(/^\s*(?:[-*]|\d+[.)])\s*/, '').replace(/\*\*/g, '')}</li>)}</ul><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => onCustomizeRoutine(routineLines.join('\n'))} className="rounded-lg bg-surface-container px-3 py-2 text-sm font-semibold text-on-surface">Customize with Coach</button><button type="button" onClick={onOpenPlanner} className="rounded-lg bg-primary-container px-3 py-2 text-sm font-bold text-on-primary-container">Open workout planner</button></div></div> : null}</div></div>
}

function Vital({ label, value, unit, icon }: { label: string; value?: number | null; unit: string; icon: string }) {
  return <div className="rounded-xl bg-surface-container p-3"><div className="flex items-center justify-between text-on-surface-variant"><span className="text-[10px] uppercase">{label}</span><span className="material-symbols-outlined text-base">{icon}</span></div><p className="mt-2 text-xl font-bold text-on-surface">{value == null ? '—' : Number.isInteger(value) ? value : value.toFixed(1)}<span className="ml-1 text-xs font-normal text-on-surface-variant">{unit}</span></p></div>
}
