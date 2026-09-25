import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useVoice } from '@/hooks/useVoice'
import { toast } from '@/components/ui/Toast'

interface Message {
  role: 'user' | 'assistant'
  content: string
  ts: string
  hasRoutine?: boolean
}

export default function CoachPage() {
  const qc = useQueryClient()
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [voiceActive, setVoiceActive] = useState(false)
  const [acceptedRoutine, setAcceptedRoutine] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Good morning Alex. Synced with your smart band telemetry: resting heart rate is steady at 54 bpm, but recovery markers indicate localized spinal tension from yesterday's heavy squats.",
      ts: '10:11 AM',
    },
    {
      role: 'user',
      content: 'I have lower back soreness today. How should I adjust my leg workout?',
      ts: '10:14 AM',
    },
    {
      role: 'assistant',
      content:
        "I've detected your fatigue notes from yesterday's squats and wearable telemetry. Let's swap heavy Barbell Deadlifts for Glute Bridges and Seated Leg Curls to decompress your lumbar spine while maintaining posterior chain hypertrophy.",
      ts: '10:14 AM',
      hasRoutine: true,
    },
  ])

  const { isListening, transcript, toggleListening, speak } = useVoice({
    onResult: (text, isFinal) => {
      if (isFinal) setInput(prev => prev + (prev ? ' ' : '') + text)
    },
  })

  // Auto-send when voice finishes
  useEffect(() => {
    if (!isListening && transcript && voiceActive) {
      handleSend(transcript)
    }
  }, [isListening, transcript, voiceActive])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      api.post('/coach/message', { content, conversation_id: activeConvId }).then(r => r.data),
    onMutate: (content) => {
      const userMsg: Message = {
        role: 'user',
        content,
        ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages(prev => [...prev, userMsg])
    },
    onSuccess: (data) => {
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.reply,
        ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages(prev => [...prev, assistantMsg])
      if (!activeConvId && data.conversation_id) setActiveConvId(data.conversation_id)
      if (voiceActive) speak(data.reply)
    },
    onError: () => {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Biometric telemetry stream re-aligning. Please retry prompt.',
          ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    },
  })

  const handleSend = (textToSend?: string) => {
    const content = (textToSend || input).trim()
    if (!content || sendMutation.isPending) return
    setInput('')
    sendMutation.mutate(content)
  }

  const handlePromptClick = (prompt: string) => {
    handleSend(prompt)
  }

  return (
    <div className="flex flex-col w-full pb-8">
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* MAIN COACH CHAT STUDIO (Left 8 Cols) */}
        <section className="col-span-12 xl:col-span-8 flex flex-col h-[calc(100vh-6rem)] bg-surface-container-low rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.6)] overflow-hidden relative">
          {/* Ambient Glow Orbs */}
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-tertiary-container/10 blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-24 right-1/4 w-96 h-96 rounded-full bg-primary-container/10 blur-[120px] pointer-events-none" />

          {/* Coach Studio Header */}
          <header className="px-6 py-4 bg-surface-container/90 backdrop-blur-xl flex items-center justify-between z-10 border-b border-surface-container-high/40">
            <div className="flex items-center gap-3.5">
              <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-tertiary-container/30 to-on-tertiary-container/40 shadow-[0_0_20px_rgba(139,92,246,0.35)]">
                <span className="material-symbols-outlined text-tertiary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  psychology
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-secondary rounded-full shadow-[0_0_8px_rgba(78,222,163,0.9)]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Coach FitGenius v4.2</h1>
                  <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-tertiary-container/20 text-tertiary tracking-wider font-semibold">
                    NEURAL BIO-AI
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse shadow-[0_0_6px_rgba(0,240,255,0.8)]" />
                  <p className="font-code-stat text-code-stat text-on-surface-variant">Biometric Session Active • Real-time Telemetry Stream</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toast.info('Telemetry Log: All 14 biometric sensors calibrated & streaming.')}
                className="p-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors"
                title="Session Telemetry Log"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">timeline</span>
              </button>
              <button
                onClick={() => {
                  setVoiceActive(v => !v)
                  toast.info(voiceActive ? 'Voice Synth deactivated' : 'Voice Synth activated')
                }}
                className={`p-2 rounded-lg transition-colors ${
                  voiceActive
                    ? 'bg-primary-container text-on-primary-container shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                    : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
                }`}
                title="Voice Response Synth"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">volume_up</span>
              </button>
              <button
                onClick={() => toast.success('Neural weights recalibrated with today\'s wearable baseline!')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                <span>Recalibrate</span>
              </button>
            </div>
          </header>

          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 z-10 scrollbar-none">
            {/* Session Initiated Pill */}
            <div className="flex justify-center">
              <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                Session Initiated • 10:10 AM • Connected Wearable: Ring Gen3 + Strap V2
              </span>
            </div>

            {/* Message Map */}
            {messages.map((msg, idx) => {
              if (msg.role === 'assistant') {
                return (
                  <div key={idx} className="flex items-start gap-3.5 max-w-3xl">
                    <div className="w-8 h-8 rounded-lg bg-tertiary-container/20 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(139,92,246,0.25)]">
                      <span className="material-symbols-outlined text-tertiary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                        neurology
                      </span>
                    </div>
                    <div className="flex flex-col gap-3 w-full">
                      <div className="flex items-baseline gap-2">
                        <span className="font-label-md text-label-md text-tertiary font-semibold">FitGenius Bio-Core</span>
                        <span className="font-code-stat text-code-stat text-on-surface-variant">{msg.ts}</span>
                      </div>
                      <div className="p-4 rounded-2xl rounded-tl-sm bg-surface-container text-on-surface shadow-[0_2px_12px_rgba(0,0,0,0.3)] leading-relaxed">
                        {msg.content}
                      </div>

                      {/* Interactive Routine Card (if present on assistant message) */}
                      {msg.hasRoutine && (
                        <div className="rounded-2xl bg-surface-container-high p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] flex flex-col gap-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-secondary text-lg">healing</span>
                                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                                  Modified Routine: Low-Impact Lower Body
                                </h2>
                              </div>
                              <p className="font-body-sm text-body-sm text-on-surface-variant">
                                Biomechanically optimized to suppress vertical spine compressive loads
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 justify-end">
                              <span className="px-2.5 py-1 rounded-full bg-secondary-container/20 text-secondary font-label-sm text-label-sm font-semibold">
                                Lumbar Protection
                              </span>
                              <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-medium">
                                35 min
                              </span>
                              <span className="px-2.5 py-1 rounded-full bg-surface-container text-primary font-code-stat text-code-stat">
                                Axial Load 1/5
                              </span>
                            </div>
                          </div>

                          {/* Exercise List */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container/70 hover:bg-surface-container transition-colors">
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-md bg-secondary/10 text-secondary flex items-center justify-center font-code-stat text-code-stat font-bold">
                                  1
                                </span>
                                <div>
                                  <p className="font-label-md text-label-md text-on-surface font-semibold">Glute Bridges</p>
                                  <p className="font-body-sm text-body-sm text-on-surface-variant">Target: Gluteus Maximus</p>
                                </div>
                              </div>
                              <span className="font-code-stat text-code-stat text-primary font-semibold bg-surface-container-low px-2 py-1 rounded">
                                4 × 12 reps
                              </span>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container/70 hover:bg-surface-container transition-colors">
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-md bg-secondary/10 text-secondary flex items-center justify-center font-code-stat text-code-stat font-bold">
                                  2
                                </span>
                                <div>
                                  <p className="font-label-md text-label-md text-on-surface font-semibold">Seated Leg Curls</p>
                                  <p className="font-body-sm text-body-sm text-on-surface-variant">Target: Biceps Femoris</p>
                                </div>
                              </div>
                              <span className="font-code-stat text-code-stat text-primary font-semibold bg-surface-container-low px-2 py-1 rounded">
                                3 × 15 reps
                              </span>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container/70 hover:bg-surface-container transition-colors">
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-md bg-secondary/10 text-secondary flex items-center justify-center font-code-stat text-code-stat font-bold">
                                  3
                                </span>
                                <div>
                                  <p className="font-label-md text-label-md text-on-surface font-semibold">Goblet Squats</p>
                                  <p className="font-body-sm text-body-sm text-on-surface-variant">Upright posture • Low stress</p>
                                </div>
                              </div>
                              <span className="font-code-stat text-code-stat text-primary font-semibold bg-surface-container-low px-2 py-1 rounded">
                                3 × 10 reps
                              </span>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container/70 hover:bg-surface-container transition-colors">
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-md bg-secondary/10 text-secondary flex items-center justify-center font-code-stat text-code-stat font-bold">
                                  4
                                </span>
                                <div>
                                  <p className="font-label-md text-label-md text-on-surface font-semibold">Hanging Knee Raises</p>
                                  <p className="font-body-sm text-body-sm text-on-surface-variant">Lumbar traction & core</p>
                                </div>
                              </div>
                              <span className="font-code-stat text-code-stat text-primary font-semibold bg-surface-container-low px-2 py-1 rounded">
                                3 × 12 reps
                              </span>
                            </div>
                          </div>

                          {/* Routine Actions */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                            <div className="flex items-center gap-2 text-on-surface-variant font-code-stat text-code-stat">
                              <span className="material-symbols-outlined text-sm text-primary">sync_alt</span>
                              <span>Estimated Volume: 5,420 kg</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <button
                                onClick={() => toast.info('Routine customization panel open.')}
                                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-highest text-on-surface font-label-md text-label-md font-semibold transition-all"
                                type="button"
                              >
                                Customize
                              </button>
                              <button
                                onClick={() => {
                                  setAcceptedRoutine(true)
                                  toast.success('Routine loaded into Live Session Engine!')
                                }}
                                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-label-md text-label-md font-bold transition-all ${
                                  acceptedRoutine
                                    ? 'bg-secondary text-on-secondary shadow-[0_0_20px_rgba(78,222,163,0.5)]'
                                    : 'bg-primary-container text-on-primary-container shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:shadow-[0_0_28px_rgba(0,240,255,0.55)]'
                                }`}
                                type="button"
                              >
                                <span className="material-symbols-outlined text-base">
                                  {acceptedRoutine ? 'task_alt' : 'check_circle'}
                                </span>
                                <span>{acceptedRoutine ? 'Routine Loaded!' : 'Accept & Load Routine'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {msg.hasRoutine && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-container/15 text-secondary self-start">
                          <span className="material-symbols-outlined text-sm">verified</span>
                          <span className="font-label-sm text-label-sm">Spine biomechanics adjusted • Estimated recovery: 18 hours</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              } else {
                return (
                  <div key={idx} className="flex items-start justify-end gap-3.5 pl-12">
                    <div className="flex flex-col items-end gap-1.5 max-w-xl">
                      <div className="flex items-baseline gap-2">
                        <span className="font-code-stat text-code-stat text-on-surface-variant">{msg.ts}</span>
                        <span className="font-label-md text-label-md text-primary font-semibold">Alex Rivera</span>
                      </div>
                      <div className="p-4 rounded-2xl rounded-tr-sm bg-surface-container-high text-on-surface shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
                        {msg.content}
                      </div>
                    </div>
                    <img
                      alt="Alex Rivera Portrait"
                      className="w-8 h-8 rounded-lg object-cover ring-2 ring-primary-container/40 shrink-0 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                      src="https://lh3.googleusercontent.com/aida/AEtjO1WdHxtPl2ltuT3ijOLJ7NbbfLGLxlCkaSOV6kPocKKr5pQ218Vaec6V3CVrc_-2uaDxSk5Jdjvpgj_383_-uGvw_fDfPUtRJnaVlkz_iRK07sRaJOyQLlbhL0jiv8UVhEfCrXnmIGJDaFS1it0FMczItWtAbMq1sKf-c-Z_OLEziw9yw7lYAhKg34L6-VizfZxdHrhQEZMHRc36Xheh0CeyT8uKKCEEUCvlza-a3_fL9W83aswqK6gpusk"
                    />
                  </div>
                )
              }
            })}

            <div ref={bottomRef} />
          </div>

          {/* Coach Input & Prompt Bar */}
          <footer className="p-4 bg-surface-container/95 backdrop-blur-xl flex flex-col gap-3 z-10 border-t border-surface-container-high/40">
            {/* Prompt Quick Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider shrink-0 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-tertiary">bolt</span> Prompts:
              </span>
              <button
                onClick={() => handlePromptClick('Adjust for knee pain during squatting')}
                className="px-3 py-1 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-sm text-label-sm whitespace-nowrap transition-colors"
                type="button"
              >
                Adjust for knee pain
              </button>
              <button
                onClick={() => handlePromptClick('Post-workout high protein meal ideas with 40g+ protein')}
                className="px-3 py-1 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-sm text-label-sm whitespace-nowrap transition-colors"
                type="button"
              >
                Post-workout meal ideas
              </button>
              <button
                onClick={() => handlePromptClick('Analyze my weekly volume and progressive overload progression')}
                className="px-3 py-1 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-sm text-label-sm whitespace-nowrap transition-colors"
                type="button"
              >
                Analyze my weekly progress
              </button>
              <button
                onClick={() => handlePromptClick('Generate a dynamic 5-minute warm-up sequence for squats')}
                className="px-3 py-1 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-sm text-label-sm whitespace-nowrap transition-colors"
                type="button"
              >
                Warm-up sequence
              </button>
            </div>

            {/* Input Form */}
            <form
              className="flex items-center gap-2"
              onSubmit={e => {
                e.preventDefault()
                handleSend()
              }}
            >
              <div className="relative flex-1 flex items-center">
                <button
                  onClick={() => toast.info('File attachment: upload workout video or wearable CSV')}
                  className="absolute left-3.5 p-1 rounded-lg text-on-surface-variant hover:text-primary transition-colors"
                  title="Attach Telemetry Log or Video"
                  type="button"
                >
                  <span className="material-symbols-outlined text-xl">attach_file</span>
                </button>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 rounded-xl bg-surface-container-high text-on-surface placeholder:text-on-surface-variant font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary-container focus:shadow-[0_0_16px_rgba(0,240,255,0.25)] transition-all"
                  placeholder="Ask Coach FitGenius anything..."
                  type="text"
                />
                <button
                  onClick={toggleListening}
                  className={`absolute right-3.5 p-1 rounded-lg transition-colors ${
                    isListening ? 'text-primary animate-pulse' : 'text-on-surface-variant hover:text-tertiary'
                  }`}
                  title={isListening ? 'Listening...' : 'Voice Input'}
                  type="button"
                >
                  <span className="material-symbols-outlined text-xl">mic</span>
                </button>
              </div>

              <button
                className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-container text-on-primary-container shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_28px_rgba(0,240,255,0.6)] transition-all shrink-0"
                type="submit"
                disabled={sendMutation.isPending}
              >
                <span className="material-symbols-outlined text-2xl font-bold">arrow_upward</span>
              </button>
            </form>
          </footer>
        </section>

        {/* RIGHT ASIDE: BIOMETRIC TELEMETRY & STRAIN (Right 4 Cols) */}
        <aside className="col-span-12 xl:col-span-4 flex flex-col gap-4">
          {/* Athlete Profile Card */}
          <div className="bg-surface-container-low p-5 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.5)] flex flex-col gap-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    alt="Alex Rivera"
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-secondary/50 shadow-[0_0_12px_rgba(78,222,163,0.3)]"
                    src="https://lh3.googleusercontent.com/aida/AEtjO1WdHxtPl2ltuT3ijOLJ7NbbfLGLxlCkaSOV6kPocKKr5pQ218Vaec6V3CVrc_-2uaDxSk5Jdjvpgj_383_-uGvw_fDfPUtRJnaVlkz_iRK07sRaJOyQLlbhL0jiv8UVhEfCrXnmIGJDaFS1it0FMczItWtAbMq1sKf-c-Z_OLEziw9yw7lYAhKg34L6-VizfZxdHrhQEZMHRc36Xheh0CeyT8uKKCEEUCvlza-a3_fL9W83aswqK6gpusk"
                  />
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-secondary rounded-full ring-2 ring-surface-container-low" />
                </div>
                <div className="flex flex-col">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold leading-tight">Alex Rivera</h2>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Tier: Intermediate • Age 28</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-primary-container/15 text-primary font-code-stat text-code-stat font-semibold">
                HYPERTROPHY
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="bg-surface-container p-2.5 rounded-xl flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Body Fat</span>
                <span className="font-stat-xl text-headline-sm text-on-surface font-bold mt-0.5">13.2%</span>
              </div>
              <div className="bg-surface-container p-2.5 rounded-xl flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Skeletal</span>
                <span className="font-stat-xl text-headline-sm text-on-surface font-bold mt-0.5">37.8 kg</span>
              </div>
              <div className="bg-surface-container p-2.5 rounded-xl flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Readiness</span>
                <span className="font-stat-xl text-headline-sm text-secondary font-bold mt-0.5">88/100</span>
              </div>
            </div>
          </div>

          {/* Physiological Strain Card */}
          <div className="bg-surface-container-low p-5 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.5)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">biotech</span>
                <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider font-semibold">
                  Physiological Strain
                </h3>
              </div>
              <span className="font-code-stat text-code-stat text-secondary font-semibold">SENSORS ONLINE</span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="font-body-md text-body-md text-on-surface font-medium">Mild Lumbar Fatigue</span>
                <span className="font-stat-xl text-headline-sm text-primary font-bold">
                  68% <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">Load</span>
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-secondary via-primary-container to-error"
                  style={{ width: '68%' }}
                />
              </div>
              <div className="flex justify-between font-code-stat text-code-stat text-on-surface-variant">
                <span>Optimal (0-40%)</span>
                <span>Target Zone (41-75%)</span>
                <span>Critical (&gt;75%)</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-error-container/20 flex items-start gap-3">
              <span className="material-symbols-outlined text-error text-xl shrink-0 mt-0.5">warning</span>
              <div className="flex flex-col gap-0.5">
                <p className="font-label-md text-label-md text-error font-semibold">Strain Concentration Warning</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Fatigue detected in erector spinae. Axial decompression suggested before compound overhead press.
                </p>
              </div>
            </div>
          </div>

          {/* Live Smart Watch Vitals */}
          <div className="bg-surface-container-low p-5 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.5)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">watch</span>
                <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider font-semibold">
                  Live Smart Watch Vitals
                </h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-surface-container flex flex-col gap-1">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-sm text-label-sm uppercase">Resting HR</span>
                  <span className="material-symbols-outlined text-error text-base">favorite</span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-stat-xl text-stat-xl text-on-surface font-bold leading-none">54</span>
                  <span className="font-code-stat text-code-stat text-on-surface-variant">BPM</span>
                </div>
                <span className="font-label-sm text-label-sm text-secondary mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">trending_down</span> -3 bpm vs avg
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container flex flex-col gap-1">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-sm text-label-sm uppercase">HRV Status</span>
                  <span className="material-symbols-outlined text-secondary text-base">ecg_heart</span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-stat-xl text-stat-xl text-on-surface font-bold leading-none">72</span>
                  <span className="font-code-stat text-code-stat text-on-surface-variant">ms</span>
                </div>
                <span className="font-label-sm text-label-sm text-secondary mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">check</span> Optimal Parasym
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container flex flex-col gap-1">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-sm text-label-sm uppercase">Skin Temp</span>
                  <span className="material-symbols-outlined text-primary text-base">thermostat</span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-stat-xl text-stat-xl text-on-surface font-bold leading-none">97.8</span>
                  <span className="font-code-stat text-code-stat text-on-surface-variant">°F</span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">Baseline: ±0.1°</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container flex flex-col gap-1">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-sm text-label-sm uppercase">Sleep Score</span>
                  <span className="material-symbols-outlined text-tertiary text-base">bedtime</span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-stat-xl text-stat-xl text-on-surface font-bold leading-none">89</span>
                  <span className="font-code-stat text-code-stat text-on-surface-variant">/100</span>
                </div>
                <span className="font-label-sm text-label-sm text-tertiary mt-1">2h 14m Deep Rest</span>
              </div>
            </div>
          </div>

          {/* AI Adaptive History */}
          <div className="bg-surface-container-low p-5 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.5)] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-xl">auto_fix_high</span>
                <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider font-semibold">
                  AI Adaptive History
                </h3>
              </div>
              <span className="font-code-stat text-code-stat text-on-surface-variant">Last 7 Days</span>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="p-3 rounded-xl bg-surface-container flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary-container mt-1.5 shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between w-full">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">Volume Auto-Deload</span>
                    <span className="font-code-stat text-code-stat text-on-surface-variant">Yesterday</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Reduced working squat sets from 5 to 3 due to barbell velocity degradation.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-secondary mt-1.5 shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between w-full">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">Rotator Cuff Micro-Protocol</span>
                    <span className="font-code-stat text-code-stat text-on-surface-variant">3 days ago</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Injected face-pulls &amp; Y-raises into Push B session following mild shoulder impingement signals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
