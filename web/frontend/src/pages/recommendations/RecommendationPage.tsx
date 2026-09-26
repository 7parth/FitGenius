import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function RecommendationPage() {
  const navigate = useNavigate()
  const [goal, setGoal] = useState<'Hypertrophy' | 'Max Strength' | 'Powerbuilding' | 'Bio-Resilience'>('Hypertrophy')
  const [split, setSplit] = useState('Upper / Lower')
  const [duration, setDuration] = useState(45)
  const [fitnessLevel, setFitnessLevel] = useState('Intermediate / Adv')
  const [equipment, setEquipment] = useState({ barbell: true, dumbbells: true, cables: true, bodyweight: false })
  const [selectedMuscles, setSelectedMuscles] = useState(['Pectorals (Chest)', 'Triceps Brachii', 'Anterior Deltoids', 'Rectus Abdominis'])
  const [feedbackGiven, setFeedbackGiven] = useState<'liked' | 'disliked' | null>(null)

  const { data: recommendation, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['recommendation', goal, split, duration],
    queryFn: () => api.post('/recommendations/generate', {
      target_duration_minutes: duration,
      preferences: { goal, split, fitnessLevel }
    }).then(r => r.data),
    staleTime: 0,
  })

  const feedbackMutation = useMutation({
    mutationFn: ({ is_accepted, rating }: { is_accepted: boolean; rating?: string }) =>
      api.post('/recommendations/feedback', {
        recommendation_id: recommendation?.id,
        is_accepted,
        rating,
      }),
    onSuccess: (_, vars) => {
      setFeedbackGiven(vars.is_accepted ? 'liked' : 'disliked')
    }
  })

  const startMutation = useMutation({
    mutationFn: () => api.post('/workouts/sessions/start', {
      name: `Autonomous AI Protocol — ${goal} (${split})`,
    }).then(r => r.data),
    onSuccess: (session) => {
      feedbackMutation.mutate({ is_accepted: true, rating: 'just_right' })
      navigate(`/workout/session/${session.id}`)
    },
  })

  const exercises: any[] = recommendation?.payload?.exercises?.length
    ? recommendation.payload.exercises
    : [
        {
          exercise_id: 'ex-1',
          name: 'Incline Barbell Bench Press',
          target: 'Upper Clavicular Chest',
          tag: 'Primary Compound',
          sets: 4,
          reps: 8,
          load: '77.5% (85kg)',
          rpe: '8.5 RPE',
          tempo: '3-1-1-0',
          rest_seconds: 120,
          cv_monitored: true,
          angle: 'Peak Angle: 30°',
        },
        {
          exercise_id: 'ex-2',
          name: 'Neutral Grip DB Flat Bench',
          target: 'Sternal Pectoralis Major',
          tag: 'Joint-Friendly',
          sets: 4,
          reps: 10,
          load: '72.5% (34kg/ea)',
          rpe: '8.0 RPE',
          tempo: '3-1-1-0',
          rest_seconds: 90,
          cv_monitored: true,
          angle: 'Deep Stretch Focus',
        },
        {
          exercise_id: 'ex-3',
          name: 'Standing Dual Cable Flyes',
          target: 'Lower Chest & Peak Contraction',
          tag: 'Continuous Tension',
          sets: 3,
          reps: 12,
          load: '65.0% (18kg/side)',
          rpe: '8.5 RPE',
          tempo: '2-1-2-1',
          rest_seconds: 75,
          cv_monitored: true,
          angle: 'Scapular Plane 30°',
        },
        {
          exercise_id: 'ex-4',
          name: 'Overhead Cable Triceps Extension',
          target: 'Long Head Triceps Brachii',
          tag: 'High Tension Stretch',
          sets: 4,
          reps: 12,
          load: '68.0% (24kg)',
          rpe: '8.5 RPE',
          tempo: '3-1-1-0',
          rest_seconds: 75,
          cv_monitored: true,
          angle: 'Elbow-Safe Profile',
        },
        {
          exercise_id: 'ex-5',
          name: 'Weighted Chest Dips',
          target: 'Pectoralis Major & Anterior Deltoid',
          tag: 'Compound Finisher',
          sets: 3,
          reps: 10,
          load: '+15kg Chain',
          rpe: '9.0 RPE',
          tempo: '3-1-1-0',
          rest_seconds: 90,
          cv_monitored: false,
          angle: 'Torso 30° Forward Tilt',
        },
        {
          exercise_id: 'ex-6',
          name: 'Hanging Straight Leg Core Compression',
          target: 'Rectus Abdominis & Deep Core',
          tag: 'Spinal Decompression',
          sets: 3,
          reps: 12,
          load: 'Bodyweight',
          rpe: '8.0 RPE',
          tempo: '2-1-2-0',
          rest_seconds: 60,
          cv_monitored: true,
          angle: 'Posterior Pelvic Tilt',
        },
      ]

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-16 text-on-surface">
      {/* Left Configurator Panel */}
      <section className="w-full lg:w-[400px] 2xl:w-[440px] bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 lg:p-6 shrink-0 flex flex-col gap-6 shadow-xl">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono tracking-widest uppercase text-primary-container font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-ping"></span>
              Autonomous Generator
            </span>
            <span className="text-[11px] font-mono text-on-surface-variant">v4.8 Periodization</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-black text-on-surface tracking-tight">AI Workout Generator</h1>
          <p className="text-xs text-on-surface-variant mt-1">Configure telemetry constraints for real-time motor unit recruitment synthesis.</p>
        </div>

        {/* Goal Selection */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-semibold text-on-surface flex items-center justify-between">
            <span>Primary Training Goal</span>
            <span className="text-[11px] text-primary-container">Neural Target</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'Hypertrophy', fit: '94% Fit' },
              { id: 'Max Strength', fit: '1RM Surge' },
              { id: 'Powerbuilding', fit: 'Hybrid' },
              { id: 'Bio-Resilience', fit: 'CNS Deload' },
            ].map(g => (
              <button
                key={g.id}
                onClick={() => setGoal(g.id as any)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-bold transition ${
                  goal === g.id
                    ? 'bg-primary-container/15 border-primary-container text-on-surface shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                    : 'bg-surface-container hover:bg-surface-container-high border-outline-variant/30 text-on-surface-variant'
                }`}
                type="button"
              >
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${goal === g.id ? 'bg-primary-container' : 'bg-surface-container-highest'}`}></span>
                  {g.id}
                </span>
                <span className="text-[10px] font-mono text-primary-container">{g.fit}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Fitness Level & Strain Tolerance */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-semibold text-on-surface">Fitness Level</label>
            <div className="relative">
              <select
                value={fitnessLevel}
                onChange={e => setFitnessLevel(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/40 text-xs text-on-surface rounded-xl px-3 py-2.5 appearance-none focus:outline-none focus:border-primary-container font-medium"
              >
                <option value="Intermediate / Adv">Intermediate / Adv</option>
                <option value="Elite Lifter">Elite Lifter</option>
                <option value="Novice Bio-Trainee">Novice Bio-Trainee</option>
              </select>
              <div className="absolute right-3 top-3 pointer-events-none text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-semibold text-on-surface flex justify-between">
              <span>Strain Limit</span>
              <span className="text-secondary font-bold">8.5 / 10</span>
            </label>
            <div className="h-10 bg-surface-container border border-outline-variant/40 rounded-xl px-3 flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface">Aggressive Overload</span>
              <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.8)]"></span>
            </div>
          </div>
        </div>

        {/* Target Muscle Focus (Neural Anatomy Wireframe) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-semibold text-on-surface">Target Muscle Focus</label>
            <span className="text-[11px] font-mono text-primary-container">{selectedMuscles.length} Active</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/30 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="text-on-surface-variant font-mono text-[11px]">Interactive Neural Body Map</span>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="flex items-center gap-1 text-primary-container"><span className="w-2 h-2 rounded-full bg-primary-container inline-block"></span> Primary</span>
                <span className="flex items-center gap-1 text-secondary"><span className="w-2 h-2 rounded-full bg-secondary inline-block"></span> Secondary</span>
              </div>
            </div>

            {/* SVG Anatomy Map Wireframe */}
            <div className="flex items-center justify-center py-2 relative">
              <svg className="w-48 h-36" viewBox="0 0 200 160" fill="none">
                <circle cx="100" cy="22" r="12" stroke="#475569" strokeWidth="1.5" fill="#181c24" />
                <path d="M100 34 L100 85" stroke="#475569" strokeWidth="1.8" strokeDasharray="2 2" />
                <path d="M85 45 C85 40, 115 40, 115 45 L120 70 L80 70 Z" fill="rgba(0, 240, 255, 0.25)" stroke="#00f0ff" strokeWidth="1.5" />
                <circle cx="75" cy="46" r="7" fill="rgba(78, 222, 163, 0.25)" stroke="#4edea3" strokeWidth="1.5" />
                <circle cx="125" cy="46" r="7" fill="rgba(78, 222, 163, 0.25)" stroke="#4edea3" strokeWidth="1.5" />
                <line x1="72" y1="52" x2="60" y2="78" stroke="#00f0ff" strokeWidth="3" strokeLinecap="round" />
                <line x1="128" y1="52" x2="140" y2="78" stroke="#00f0ff" strokeWidth="3" strokeLinecap="round" />
                <line x1="60" y1="78" x2="52" y2="105" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
                <line x1="140" y1="78" x2="148" y2="105" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
                <path d="M82 72 L118 72 L112 95 L88 95 Z" fill="rgba(225, 210, 255, 0.15)" stroke="#e1d2ff" strokeWidth="1.5" />
                <line x1="88" y1="96" x2="84" y2="135" stroke="#4edea3" strokeWidth="3.5" strokeLinecap="round" />
                <line x1="112" y1="96" x2="116" y2="135" stroke="#4edea3" strokeWidth="3.5" strokeLinecap="round" />
                <line x1="84" y1="135" x2="82" y2="155" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="116" y1="135" x2="118" y2="155" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="100" cy="55" r="3" fill="#00f0ff" className="animate-ping" />
                <circle cx="100" cy="55" r="2.5" fill="#00f0ff" />
                <circle cx="75" cy="46" r="2.5" fill="#4edea3" />
                <circle cx="125" cy="46" r="2.5" fill="#4edea3" />
              </svg>
            </div>

            {/* Muscle Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedMuscles.map(m => (
                <span
                  key={m}
                  onClick={() => setSelectedMuscles(selectedMuscles.filter(x => x !== m))}
                  className="px-2.5 py-1 rounded-lg bg-primary-container/15 border border-primary-container/40 text-primary-container text-xs font-semibold flex items-center gap-1 cursor-pointer hover:bg-primary-container/25"
                >
                  {m} <span className="text-[10px]">✕</span>
                </span>
              ))}
              <button
                onClick={() => {
                  if (!selectedMuscles.includes('Latissimus Dorsi')) {
                    setSelectedMuscles([...selectedMuscles, 'Latissimus Dorsi'])
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-on-surface-variant text-xs font-medium transition"
                type="button"
              >
                + Add Muscle
              </button>
            </div>
          </div>
        </div>

        {/* Periodized Training Split */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-semibold text-on-surface">Periodized Training Split</label>
          <div className="grid grid-cols-2 gap-2">
            {['Upper / Lower', 'Push / Pull / Legs (PPL)', 'Full Body Synergy', 'Conjugate / Westside'].map(s => (
              <button
                key={s}
                onClick={() => setSplit(s)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition ${
                  split === s
                    ? 'bg-primary-container/15 border-primary-container text-primary-container font-bold shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                    : 'bg-surface-container hover:bg-surface-container-high border-outline-variant/30 text-on-surface-variant'
                }`}
                type="button"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Available Equipment Matrix */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-semibold text-on-surface">Available Equipment Matrix</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'barbell', label: 'Barbell' },
              { id: 'dumbbells', label: 'Dumbbells' },
              { id: 'cables', label: 'Cables' },
              { id: 'bodyweight', label: 'Bodyweight' },
            ].map(eq => (
              <label
                key={eq.id}
                className="flex items-center gap-2 p-2 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface font-medium cursor-pointer hover:border-primary-container/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={(equipment as any)[eq.id]}
                  onChange={e => setEquipment({ ...equipment, [eq.id]: e.target.checked })}
                  className="accent-primary-container rounded"
                />
                <span>{eq.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Target Session Duration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono font-semibold text-on-surface">Target Session Duration</span>
            <span className="font-mono text-primary-container font-bold px-2 py-0.5 rounded bg-primary-container/10 border border-primary-container/30">
              {duration} Minutes
            </span>
          </div>
          <input
            type="range"
            min="20"
            max="90"
            step="5"
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            className="w-full h-1.5 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary-container"
          />
          <div className="flex justify-between text-[10px] font-mono text-on-surface-variant">
            <span>20m (Express)</span>
            <span>45m (Optimal Density)</span>
            <span>90m (Volume Overload)</span>
          </div>
        </div>

        {/* Regenerate Button */}
        <div className="pt-1">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-primary-container to-[#0284c7] text-[#0b0f17] font-extrabold text-sm tracking-wide flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(0,240,255,0.3)] hover:brightness-110 active:scale-[0.99] transition disabled:opacity-60"
            type="button"
          >
            <span className={`material-symbols-outlined text-lg ${isFetching ? 'animate-spin' : ''}`}>sync</span>
            {isFetching ? 'SYNTHESIZING PROTOCOL…' : 'REGENERATE AI PROTOCOL (SYNAPSE 4.8)'}
          </button>
        </div>
      </section>

      {/* Right Main Telemetry Area */}
      <section className="flex-1 flex flex-col gap-6">
        {/* Top Recommended Protocol Banner */}
        <article className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant/30 relative overflow-hidden shadow-2xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-secondary-container/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-primary-container/15 text-primary-container border border-primary-container/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
                  AI Prescribed Protocol
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-tertiary-container bg-tertiary-container/10 border border-tertiary-container/30">
                  {goal} Focus
                </span>
                <span className="text-xs font-mono text-on-surface-variant">Calibration ID: #SYN-9942</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                Hypertrophic Motor Unit Reconstitution
              </h2>
              <div className="flex items-center gap-3 text-sm font-mono text-on-surface-variant flex-wrap">
                <span className="text-primary-container font-bold">Microcycle 4, Day 2</span>
                <span>•</span>
                <span>{split}</span>
                <span>•</span>
                <span className="text-secondary font-semibold">Ready for Maximal Tension</span>
              </div>
            </div>

            {/* Action Button: Start Autonomous Session */}
            <div className="shrink-0 flex items-center gap-3">
              <button
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
                className="px-6 py-4 rounded-2xl bg-primary-container hover:bg-[#38f4ff] text-on-primary-container font-extrabold text-sm tracking-wide transition shadow-[0_0_24px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2.5 disabled:opacity-60"
                type="button"
              >
                <span className="material-symbols-outlined text-xl">play_circle</span>
                {startMutation.isPending ? 'LAUNCHING ENGINE…' : 'START AUTONOMOUS SESSION'}
              </button>
            </div>
          </div>

          {/* Telemetry Badges & Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-outline-variant/30">
            <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/20">
              <div className="text-[11px] font-mono text-on-surface-variant">Bio-Strain Index</div>
              <div className="text-2xl font-black text-on-surface mt-1 flex items-baseline gap-1">
                8.4 <span className="text-xs font-mono text-secondary font-normal">/ 10 (Target Hit)</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-secondary h-full w-[84%]"></div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/20">
              <div className="text-[11px] font-mono text-on-surface-variant">Estimated Volume Load</div>
              <div className="text-2xl font-black text-primary-container mt-1 flex items-baseline gap-1">
                18,400 <span className="text-xs font-mono text-on-surface-variant font-normal">kg</span>
              </div>
              <p className="text-[10px] font-mono text-primary-container/80 mt-1.5">+6.2% vs Last Microcycle</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/20">
              <div className="text-[11px] font-mono text-on-surface-variant">Estimated Density</div>
              <div className="text-2xl font-black text-tertiary-container mt-1 flex items-baseline gap-1">
                {duration} <span className="text-xs font-mono text-on-surface-variant font-normal">min ({exercises.length} Exercises)</span>
              </div>
              <p className="text-[10px] font-mono text-tertiary-container/80 mt-1.5">Intra-set rest: 75-120s</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/20">
              <div className="text-[11px] font-mono text-on-surface-variant">CNS Readiness Alignment</div>
              <div className="text-2xl font-black text-secondary mt-1 flex items-baseline gap-1">
                94% <span className="text-xs font-mono text-on-surface-variant font-normal">Autonomic</span>
              </div>
              <p className="text-[10px] font-mono text-secondary/80 mt-1.5">Zero lumbar restriction</p>
            </div>
          </div>

          {/* Coach Genesis Reasoning Callout */}
          <div className="mt-4 p-4 rounded-2xl bg-tertiary-container/10 border border-tertiary-container/30 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-tertiary-container/20 border border-tertiary-container/30 flex items-center justify-center shrink-0 text-tertiary-container mt-0.5">
              <span className="material-symbols-outlined text-lg">psychology</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-tertiary-container font-mono">COACH GENESIS REASONING SYNTHESIS</span>
                <span className="text-[10px] text-on-surface-variant font-mono">• Biometric Telemetry Live</span>
              </div>
              <p className="text-on-surface leading-relaxed">
                {recommendation?.payload?.rationale ||
                  `"Parth, based on your 94% autonomic readiness and verified low lumbar shear strain from yesterday's deload, we have loaded an assertive 18,400 kg compound hypertrophic protocol. Today focuses on horizontal press recruitment and mechanical tension across the clavicular pectorals with deliberate 3-1-1-0 tempos."`}
              </p>
            </div>
          </div>
        </article>

        {/* Exercise Sequence Header & AI Feedback Tuning */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
              Periodized Exercise Sequence
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-surface-container-high text-on-surface-variant">
                {exercises.length} Movements
              </span>
            </h3>
            <p className="text-xs text-on-surface-variant font-mono">Biomechanical order calibrated for post-activation potentiation &amp; tension curve</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant font-mono">AI Calibration:</span>
            <button
              onClick={() => feedbackMutation.mutate({ is_accepted: true, rating: 'challenging' })}
              className={`p-2 rounded-xl border transition flex items-center gap-1 text-xs ${
                feedbackGiven === 'liked' ? 'bg-secondary/20 text-secondary border-secondary/40' : 'bg-surface-container text-on-surface-variant border-outline-variant/30 hover:text-on-surface'
              }`}
              title="Calibrate: Great workout recommendation"
            >
              <span className="material-symbols-outlined text-sm">thumb_up</span>
            </button>
            <button
              onClick={() => feedbackMutation.mutate({ is_accepted: false, rating: 'too_hard' })}
              className={`p-2 rounded-xl border transition flex items-center gap-1 text-xs ${
                feedbackGiven === 'disliked' ? 'bg-error-container/30 text-error border-error/40' : 'bg-surface-container text-on-surface-variant border-outline-variant/30 hover:text-on-surface'
              }`}
              title="Calibrate: Too heavy / adjust"
            >
              <span className="material-symbols-outlined text-sm">thumb_down</span>
            </button>
          </div>
        </div>

        {/* Exercise Cards Bento Grid */}
        {isLoading ? (
          <div className="p-12 flex justify-center"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exercises.map((ex: any, idx: number) => (
              <div
                key={ex.exercise_id || idx}
                className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 hover:border-primary-container/50 transition-all space-y-4 relative group shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-primary-container/15 text-primary-container border border-primary-container/30 flex items-center justify-center font-mono font-bold text-xs">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h4 className="font-bold text-on-surface text-base group-hover:text-primary-container transition">
                        {ex.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant font-mono">
                        <span>{ex.target || 'Primary Target'}</span>
                        <span>•</span>
                        <span className="text-secondary">{ex.tag || 'Calibrated'}</span>
                      </div>
                    </div>
                  </div>
                  {ex.cv_monitored !== false && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary-container/10 text-primary-container border border-primary-container/30">
                      CV Pose Monitored
                    </span>
                  )}
                </div>

                {/* Parameters Grid */}
                <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs">
                  <div className="p-2 rounded-xl bg-surface-container border border-outline-variant/20">
                    <span className="text-[10px] text-on-surface-variant block">SETS &amp; REPS</span>
                    <span className="font-bold text-on-surface">
                      {ex.sets} × {ex.reps ? ex.reps : `${ex.duration_seconds || 30}s`}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-surface-container border border-outline-variant/20">
                    <span className="text-[10px] text-on-surface-variant block">LOAD % 1RM</span>
                    <span className="font-bold text-primary-container">{ex.load || '75.0%'}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-surface-container border border-outline-variant/20">
                    <span className="text-[10px] text-on-surface-variant block">TARGET RPE</span>
                    <span className="font-bold text-secondary">{ex.rpe || '8.5 RPE'}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-surface-container border border-outline-variant/20">
                    <span className="text-[10px] text-on-surface-variant block">TEMPO</span>
                    <span className="font-bold text-tertiary-container">{ex.tempo || '3-1-1-0'}</span>
                  </div>
                </div>

                {/* Rest & Telemetry Note */}
                <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant pt-1 border-t border-outline-variant/20">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary-container">timer</span>
                    Rest: {ex.rest_seconds || 90}s (Phosphagen Refill)
                  </span>
                  <span className="text-secondary">{ex.angle || 'Depth Tracked'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
