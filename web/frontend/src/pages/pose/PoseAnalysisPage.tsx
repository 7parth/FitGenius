import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

const POSE_EXERCISES = [
  { key: 'squat', label: 'Barbell Back Squat', target: 'Below Parallel (110°)', tempo: '3-1-X-0 (Optimal)', velocity: '0.68 m/s' },
  { key: 'deadlift', label: 'Conventional Deadlift', target: 'Neutral Spine (180°)', tempo: '2-1-X-0 (Strict)', velocity: '0.52 m/s' },
  { key: 'bench_press', label: 'Barbell Bench Press', target: 'Chest Touch (90°)', tempo: '3-0-1-0 (Explosive)', velocity: '0.74 m/s' },
  { key: 'overhead_press', label: 'Standing Overhead Press', target: 'Lockout Overhead', tempo: '2-0-1-0 (Direct)', velocity: '0.48 m/s' },
]

export default function PoseAnalysisPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [voiceCoachActive, setVoiceCoachActive] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [currentSet, setCurrentSet] = useState(2)
  const [reps, setReps] = useState(8)
  const [targetReps] = useState(12)
  const [formScore, setFormScore] = useState(92)
  const [selectedExercise, setSelectedExercise] = useState(POSE_EXERCISES[0])
  const [completedNotification, setCompletedNotification] = useState<string | null>(null)

  // Fetch recent pose sessions
  const { data: history = [] } = useQuery({
    queryKey: ['pose-history'],
    queryFn: () => api.get('/pose/sessions/history').then(r => r.data).catch(() => []),
  })

  // Start / Stop camera
  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera access denied. Operating in synthetic simulation mode.')
      } else {
        setCameraError('Hardware camera unavailable. Displaying neural simulation stream.')
      }
      setCameraActive(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraActive(false)
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  // Simulated Rep Counter & Telemetry Fluctuations
  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(() => {
      // Micro variations in form score and reps
      setFormScore(prev => Math.min(98, Math.max(88, prev + (Math.random() > 0.5 ? 1 : -1))))
    }, 3000)
    return () => clearInterval(interval)
  }, [isPaused])

  const handleCompleteSet = () => {
    setCompletedNotification(`Set ${currentSet} Logged! Rest Triggered`)
    setTimeout(() => {
      setCurrentSet(prev => Math.min(4, prev + 1))
      setReps(0)
      setCompletedNotification(null)
    }, 2000)
  }

  const repPercent = Math.min(100, Math.round((reps / targetReps) * 100))

  return (
    <div className="flex flex-col w-full pb-10">
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* LEFT / MAIN STUDIO VIEWPORT (70%) */}
        <div className="flex-1 w-full lg:w-[70%] flex flex-col gap-4">
          {/* Video Viewport Container */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-surface-container-lowest shadow-[0_8px_32px_rgba(0,0,0,0.8)] select-none">
            {/* Live Camera Stream if active */}
            {cameraActive ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover -scale-x-100"
                muted
                playsInline
                autoPlay
              />
            ) : (
              /* Live Video Mock Background */
              <div
                className="absolute inset-0 bg-cover bg-center w-full h-full"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBVPrTvmO8xY9rP79kzZJNhTWlfbaNUpvgPhb1gKQQf17tiokUwGz0CGhZ04xzhfsLlCgzTkVZIiVKwJ4SqDcB1J-It7U4_xZanfmvKrcoEOHZFczQepD27zLWhuGOaolz9iDRkRauMYM9ylkHMMNVYv-28jjtCbQG2zmv8YXTLql9PY6iHvZesPUfh7khwSoPlG2-VC8bC4kmQEUHkKvhZiYANSEfmNtUDciuEchW2oxlZ4gKrQVabeA')`,
                }}
              />
            )}

            {/* Subtle Vignette & Scanline Shimmer Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/90 via-transparent to-surface-container-lowest/60 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(10,14,22,0.85)_100%)] pointer-events-none" />

            {/* SKELETAL POSE TRACKING (MediaPipe Simulation SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" fill="none" viewBox="0 0 1280 720">
              <defs>
                <filter id="cyanGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="emeraldGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="laserPlane" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00f0ff" stopOpacity="0" />
                  <stop offset="25%" stopColor="#00f0ff" stopOpacity="0.8" />
                  <stop offset="75%" stopColor="#4edea3" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Computer Vision Grid Reticle */}
              <g opacity="0.35" stroke="#3b494b" strokeWidth="0.75" strokeDasharray="4 6">
                <line x1="640" y1="60" x2="640" y2="660" />
                <line x1="280" y1="360" x2="1000" y2="360" />
              </g>

              {/* Parallel Target Squat Depth Plane Marker */}
              <line
                x1="320"
                y1="480"
                x2="960"
                y2="480"
                stroke="url(#laserPlane)"
                strokeWidth="2"
                strokeDasharray="8 6"
                filter="url(#cyanGlow)"
              />
              <rect x="965" y="470" width="130" height="20" rx="4" fill="#181c24" opacity="0.9" />
              <text x="975" y="484" fill="#00f0ff" fontFamily="Inter" fontSize="10" fontWeight="700" letterSpacing="1.2">
                110° DEPTH PLANE
              </text>

              {/* Kinetic Skeleton Lines (Cyan Glowing) */}
              <line x1="640" y1="210" x2="590" y2="250" stroke="#00f0ff" strokeWidth="3" filter="url(#cyanGlow)" />
              <line x1="640" y1="210" x2="690" y2="250" stroke="#00f0ff" strokeWidth="3" filter="url(#cyanGlow)" />
              <line x1="590" y1="250" x2="690" y2="250" stroke="#00f0ff" strokeWidth="3.5" filter="url(#cyanGlow)" />

              {/* Torso */}
              <line x1="640" y1="250" x2="640" y2="390" stroke="#00f0ff" strokeWidth="3" strokeDasharray="6 3" filter="url(#cyanGlow)" />
              <line x1="590" y1="250" x2="615" y2="400" stroke="#00f0ff" strokeWidth="3" filter="url(#cyanGlow)" />
              <line x1="690" y1="250" x2="665" y2="400" stroke="#00f0ff" strokeWidth="3" filter="url(#cyanGlow)" />

              {/* Arms */}
              <line x1="590" y1="250" x2="540" y2="240" stroke="#00f0ff" strokeWidth="2.5" opacity="0.9" />
              <line x1="540" y1="240" x2="520" y2="200" stroke="#00f0ff" strokeWidth="2.5" opacity="0.9" />
              <line x1="690" y1="250" x2="740" y2="240" stroke="#00f0ff" strokeWidth="2.5" opacity="0.9" />
              <line x1="740" y1="240" x2="760" y2="200" stroke="#00f0ff" strokeWidth="2.5" opacity="0.9" />

              {/* Pelvis */}
              <line x1="615" y1="400" x2="665" y2="400" stroke="#4edea3" strokeWidth="3.5" filter="url(#emeraldGlow)" />

              {/* Left Leg System */}
              <line x1="615" y1="400" x2="540" y2="475" stroke="#00f0ff" strokeWidth="3.5" filter="url(#cyanGlow)" />
              <line x1="540" y1="475" x2="550" y2="600" stroke="#00f0ff" strokeWidth="3.5" filter="url(#cyanGlow)" />
              <line x1="550" y1="600" x2="505" y2="615" stroke="#00f0ff" strokeWidth="2.5" />

              {/* Right Leg System */}
              <line x1="665" y1="400" x2="740" y2="475" stroke="#00f0ff" strokeWidth="3.5" filter="url(#cyanGlow)" />
              <line x1="740" y1="475" x2="730" y2="600" stroke="#00f0ff" strokeWidth="3.5" filter="url(#cyanGlow)" />
              <line x1="730" y1="600" x2="775" y2="615" stroke="#00f0ff" strokeWidth="2.5" />

              {/* Joint Landmark Nodes */}
              <circle cx="640" cy="210" r="5" fill="#faf3ff" stroke="#00f0ff" strokeWidth="2" />
              <circle cx="590" cy="250" r="6" fill="#00f0ff" filter="url(#cyanGlow)" />
              <circle cx="690" cy="250" r="6" fill="#00f0ff" filter="url(#cyanGlow)" />
              <circle cx="540" cy="240" r="5" fill="#00f0ff" />
              <circle cx="740" cy="240" r="5" fill="#00f0ff" />
              <circle cx="615" cy="400" r="6" fill="#4edea3" filter="url(#emeraldGlow)" />
              <circle cx="665" cy="400" r="6" fill="#4edea3" filter="url(#emeraldGlow)" />

              {/* Knee Joint Target Rings (Active Angle Telemetry) */}
              <circle cx="540" cy="475" r="9" fill="#0a0e16" stroke="#4edea3" strokeWidth="3" filter="url(#emeraldGlow)" />
              <circle cx="540" cy="475" r="3" fill="#4edea3" />
              <circle cx="740" cy="475" r="9" fill="#0a0e16" stroke="#4edea3" strokeWidth="3" filter="url(#emeraldGlow)" />
              <circle cx="740" cy="475" r="3" fill="#4edea3" />

              {/* Ankle Nodes */}
              <circle cx="550" cy="600" r="5" fill="#00f0ff" />
              <circle cx="730" cy="600" r="5" fill="#00f0ff" />

              {/* Real-Time Arc Telemetry on Left Knee Angle */}
              <path d="M 525 455 A 25 25 0 0 1 555 490" fill="none" stroke="#4edea3" strokeWidth="2" strokeLinecap="round" />

              {/* Annotation Badge pinned to Left Knee */}
              <rect x="420" y="460" width="105" height="26" rx="6" fill="#0f131c" fillOpacity="0.9" />
              <text x="430" y="477" fill="#4edea3" fontFamily="Outfit" fontSize="12" fontWeight="700">
                112° Flexion
              </text>
            </svg>

            {/* TOP HUD LAYER */}
            <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none">
              {/* Top Left: Live Form Score Gauge Badge */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface-container-low/85 backdrop-blur-md shadow-[0_0_20px_rgba(78,222,163,0.3)] pointer-events-auto">
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-surface-container-highest"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                    />
                    <path
                      className="text-secondary"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray={`${formScore}, 100`}
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-headline-sm text-secondary font-bold">{formScore}</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.9)] animate-pulse" />
                    <span className="font-label-md text-label-md text-secondary tracking-wide uppercase">{formScore}% FORM</span>
                  </div>
                  <span className="font-code-stat text-code-stat text-on-surface-variant">Excellent Depth Achieved</span>
                </div>
              </div>

              {/* Top Right: Real-time Corrective Guidance Pill */}
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-surface-container-high/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)] pointer-events-auto">
                <span className="material-symbols-outlined text-primary-container text-lg animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
                  insights
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-label-md text-label-md text-on-surface">Keep chest high</span>
                  <span className="text-on-surface-variant font-bold">•</span>
                  <span className="font-label-md text-label-md text-primary">Knees aligned with toes</span>
                </div>
              </div>
            </div>

            {/* CENTER BOTTOM REP HUD */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-full max-w-md px-4 pointer-events-none">
              <div className="flex flex-col items-center">
                <div className="flex items-baseline gap-2 bg-surface-container-lowest/80 px-6 py-1.5 rounded-2xl backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.9)]">
                  <span className="font-display-lg text-display-lg text-primary leading-none tracking-tight font-extrabold drop-shadow-[0_0_20px_rgba(0,240,255,0.6)]">
                    {reps}
                  </span>
                  <span className="font-headline-lg text-headline-lg text-on-surface-variant leading-none font-semibold">
                    / {targetReps}
                  </span>
                  <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest pl-2">Reps</span>
                </div>
                {/* Glowing Progress Bar under Rep Counter */}
                <div className="w-48 h-1.5 bg-surface-container-highest rounded-full mt-2 overflow-hidden shadow-[0_0_12px_rgba(0,240,255,0.4)]">
                  <div
                    className="h-full bg-primary-container rounded-full shadow-[0_0_10px_#00f0ff] transition-all duration-300"
                    style={{ width: `${repPercent}%` }}
                  />
                </div>
              </div>

              {/* Real-Time Audio Waveform Coach Pill */}
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-surface-container-low/95 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.6)] pointer-events-auto">
                <div className="flex items-center gap-0.5 h-4">
                  <span className="w-1 bg-secondary rounded-full h-2 animate-[bounce_0.6s_ease-in-out_infinite]" />
                  <span className="w-1 bg-secondary rounded-full h-4 animate-[bounce_0.8s_ease-in-out_infinite_0.1s]" />
                  <span className="w-1 bg-secondary rounded-full h-3 animate-[bounce_0.5s_ease-in-out_infinite_0.2s]" />
                  <span className="w-1 bg-secondary rounded-full h-4 animate-[bounce_0.9s_ease-in-out_infinite_0.15s]" />
                  <span className="w-1 bg-secondary rounded-full h-1.5 animate-[bounce_0.7s_ease-in-out_infinite_0.3s]" />
                </div>
                <span className="font-body-sm text-body-sm text-on-surface font-medium truncate">
                  <span className="text-secondary font-semibold">Audio Coach:</span> “Great depth, drive through heels!”
                </span>
              </div>
            </div>

            {/* Latency / Inference Corner Pill */}
            <div className="absolute bottom-3 right-4 px-2.5 py-1 rounded bg-surface-container-lowest/80 text-on-surface-variant font-code-stat text-code-stat pointer-events-none flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              <span>FPS: 60 • CV Latency: 14ms</span>
            </div>
          </div>

          {/* BOTTOM VIDEO CONTROL BAR */}
          <div className="flex items-center justify-between px-5 py-3 rounded-xl bg-surface-container-low shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPaused(p => !p)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors font-label-md text-label-md"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">{isPaused ? 'play_arrow' : 'pause'}</span>
                <span>{isPaused ? 'Resume Tracking' : 'Pause Tracking'}</span>
              </button>

              <button
                onClick={cameraActive ? stopCamera : startCamera}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors font-label-md text-label-md"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">{cameraActive ? 'videocam_off' : 'videocam'}</span>
                <span className="hidden sm:inline">{cameraActive ? 'Switch to Sim' : 'Live Camera'}</span>
              </button>

              <button
                onClick={() => setVoiceCoachActive(v => !v)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors font-label-md text-label-md ${
                  voiceCoachActive
                    ? 'bg-secondary-container/20 text-secondary hover:bg-secondary-container/30'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: voiceCoachActive ? "'FILL' 1" : undefined }}>
                  {voiceCoachActive ? 'volume_up' : 'volume_off'}
                </span>
                <span>Voice Coach: {voiceCoachActive ? 'Active' : 'Muted'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                title="Calibration Matrix"
                type="button"
              >
                <span className="material-symbols-outlined text-xl">tune</span>
              </button>
              <button
                onClick={() => {
                  stopCamera()
                  setReps(0)
                  setCurrentSet(1)
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-error-container text-on-error-container hover:bg-error-container/80 transition-colors font-label-md text-label-md font-bold"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">stop</span>
                <span>End Session</span>
              </button>
            </div>
          </div>

          {/* Quick Guidance & Metric Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-surface-container flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary-container/15 flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined text-2xl">straighten</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Target Squat Depth</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">{selectedExercise.target}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-container flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-2xl">timer</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Tempo Pacing</span>
                <span className="font-headline-sm text-headline-sm text-secondary">{selectedExercise.tempo}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-container flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-tertiary-container/15 flex items-center justify-center text-tertiary-container">
                <span className="material-symbols-outlined text-2xl">speed</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Concentric Velocity</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">{selectedExercise.velocity}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR / TELEMETRY PANEL (30%) */}
        <div className="w-full lg:w-[30%] flex flex-col gap-4">
          {/* ACTIVE EXERCISE CARD */}
          <div className="p-5 rounded-xl bg-surface-container-low flex flex-col gap-3 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-primary-container/20 text-primary-container font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                In Progress
              </span>
              <span className="font-code-stat text-code-stat text-on-surface-variant">Set {currentSet} of 4</span>
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface">{selectedExercise.label}</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Primary Quadricep & Posterior Chain Compound</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-surface-container flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Target Load</span>
                <span className="font-stat-xl text-stat-xl text-primary font-bold mt-0.5">
                  80.0 <span className="text-headline-sm text-on-surface-variant font-normal">kg</span>
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Previous Best</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-1">12 @ 75kg</span>
                <span className="font-code-stat text-code-stat text-secondary mt-auto">+5kg Progressive Overload</span>
              </div>
            </div>
          </div>

          {/* SET HISTORY & TRACKER */}
          <div className="p-5 rounded-xl bg-surface-container-low flex flex-col gap-3 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between pb-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Protocol Sequence</span>
              <span className="font-code-stat text-code-stat text-primary">HYPERTROPHY PHASE</span>
            </div>
            <div className="flex flex-col gap-2">
              {/* Set 1 */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container/60 hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center font-code-stat text-code-stat font-bold">
                    ✓
                  </span>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface">Set 1: 12 reps @ 75kg</span>
                    <span className="font-body-sm text-body-sm text-secondary">95% Form Accuracy • Symmetrical</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-label-sm text-label-sm font-semibold">Done</span>
              </div>

              {/* Set 2 */}
              <div className={`flex items-center justify-between p-3 rounded-lg bg-surface-container ${currentSet === 2 ? 'shadow-[0_0_16px_rgba(0,240,255,0.15)]' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-code-stat text-code-stat font-bold animate-pulse">
                    2
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-primary font-bold">Set 2: 12 reps @ 80kg</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Live Tracking: Rep {reps} executing</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm font-bold shadow-[0_0_12px_rgba(0,240,255,0.5)]">
                  ACTIVE
                </span>
              </div>

              {/* Set 3 */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container/40 opacity-70">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-code-stat text-code-stat">
                    3
                  </span>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface">Set 3: 10 reps @ 80kg</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Rest interval: 90s target</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm">Upcoming</span>
              </div>

              {/* Set 4 */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container/40 opacity-60">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-code-stat text-code-stat">
                    4
                  </span>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface">Set 4: Drop set @ 60kg</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Max muscular exhaustion</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm">Upcoming</span>
              </div>
            </div>
          </div>

          {/* BIOMECHANICAL SYMMETRY & JOINT LOAD ANALYSIS */}
          <div className="p-5 rounded-xl bg-surface-container-low flex flex-col gap-4 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-lg">balance</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">Kinematic Symmetry</span>
              </div>
              <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase">Balanced</span>
            </div>

            {/* Left Knee vs Right Knee Balance */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                <span>Left Knee: 50%</span>
                <span>Force Distribution</span>
                <span>Right Knee: 50%</span>
              </div>
              <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden flex">
                <div className="h-full bg-primary-container w-1/2" />
                <div className="h-full bg-secondary w-1/2" />
              </div>
              <span className="font-code-stat text-code-stat text-on-surface-variant text-center">Zero Lateral Pelvis Shift Detected</span>
            </div>

            {/* Joint Torque Telemetry */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center justify-between text-body-sm font-body-sm">
                <span className="text-on-surface-variant">Lumbar Shear Stress</span>
                <span className="text-secondary font-semibold font-code-stat">LOW (0.24 kN)</span>
              </div>
              <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-secondary rounded-full w-[25%]" />
              </div>
              <div className="flex items-center justify-between text-body-sm font-body-sm pt-1">
                <span className="text-on-surface-variant">Patellar Tendon Stress</span>
                <span className="text-primary font-semibold font-code-stat">MODERATE (OPTIMAL)</span>
              </div>
              <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary-container rounded-full w-[54%]" />
              </div>
            </div>
          </div>

          {/* REST TIMER & NEXT SET WIDGET */}
          <div className="p-5 rounded-xl bg-surface-container-low flex flex-col items-center gap-4 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between w-full">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Rest Optimization Gauge</span>
              <span className="material-symbols-outlined text-on-surface-variant text-base">nest_clock_farsight_analog</span>
            </div>
            <div className="flex items-center gap-5 w-full">
              {/* Circular Countdown Gauge */}
              <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="18" fill="none" stroke="#262a33" strokeWidth="3.5" />
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    stroke="#00f0ff"
                    strokeWidth="3.5"
                    strokeDasharray="113"
                    strokeDashoffset="40"
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="font-headline-sm text-headline-sm text-primary font-bold leading-none">00:48</span>
                  <span className="font-label-sm text-[9px] text-on-surface-variant uppercase">Target</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <span className="font-label-md text-label-md text-on-surface font-semibold">Recommended Rest</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-tight">Calculated based on ATP replenishment cycle & bar velocity drop.</p>
                <button
                  onClick={() => setReps(r => Math.min(targetReps, r + 1))}
                  className="mt-1 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-sm text-label-sm font-semibold transition-colors flex items-center justify-center gap-1.5 w-full"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span>+1 Rep (Simulate Rep)</span>
                </button>
              </div>
            </div>
          </div>

          {/* BIG GLOWING PRIMARY ACTION BUTTON */}
          <button
            onClick={handleCompleteSet}
            className={`w-full py-4 px-6 rounded-xl font-headline-sm text-headline-sm font-bold flex items-center justify-center gap-2 transition-all ${
              completedNotification
                ? 'bg-secondary text-on-secondary shadow-[0_0_36px_rgba(78,222,163,0.6)]'
                : 'bg-primary-container text-on-primary-container shadow-[0_0_28px_rgba(0,240,255,0.4)] hover:shadow-[0_0_36px_rgba(0,240,255,0.6)] hover:brightness-105 active:scale-[0.99]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-2xl font-bold">
              {completedNotification ? 'task_alt' : 'check_circle'}
            </span>
            <span>{completedNotification ? completedNotification : `Complete Set ${currentSet}`}</span>
          </button>

          {/* Biometric Device Link Footer Status */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container text-on-surface-variant text-body-sm font-body-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_6px_rgba(78,222,163,0.8)]" />
              <span>Apple Watch Ultra linked</span>
            </div>
            <span className="font-code-stat text-code-stat text-on-surface font-medium">142 BPM • 98% SpO2</span>
          </div>
        </div>
      </div>
    </div>
  )
}
