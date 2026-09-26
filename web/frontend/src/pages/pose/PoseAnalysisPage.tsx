import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { POSE_CONNECTIONS, POSE_LANDMARKS, Pose, type Results } from '@mediapipe/pose'
import { api } from '@/lib/api'

const EXERCISES = [
  { key: 'squat', label: 'Squat', joints: [POSE_LANDMARKS.LEFT_HIP, 25, 27], down: 100, up: 155 },
  { key: 'push_up', label: 'Push-up', joints: [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST], down: 100, up: 155 },
  { key: 'bicep_curl', label: 'Bicep curl', joints: [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST], down: 55, up: 145 },
  { key: 'shoulder_press', label: 'Shoulder press', joints: [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST], down: 150, up: 95 },
  { key: 'lunge', label: 'Lunge', joints: [POSE_LANDMARKS.LEFT_HIP, 25, 27], down: 100, up: 155 },
]

function angle(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) {
  const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
  const deg = Math.abs((rad * 180) / Math.PI) % 360
  return Math.round(deg > 180 ? 360 - deg : deg)
}

export default function PoseAnalysisPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const poseRef = useRef<Pose | null>(null)
  const frameRef = useRef<number | null>(null)
  const sessionExerciseRef = useRef<string | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const phaseRef = useRef<'up' | 'down'>('up')
  const queryClient = useQueryClient()
  const [exerciseKey, setExerciseKey] = useState('squat')
  const exercise = EXERCISES.find(item => item.key === exerciseKey) ?? EXERCISES[0]
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [paused, setPaused] = useState(false)
  const [voiceActive, setVoiceActive] = useState(false)
  const [reps, setReps] = useState(0)
  const [setNumber, setSetNumber] = useState(1)
  const [score, setScore] = useState(0)
  const [jointAngle, setJointAngle] = useState<number | null>(null)
  const [cue, setCue] = useState('Start camera and show your full body')
  const [rest, setRest] = useState(0)
  const [saved, setSaved] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)

  const { data: history = [] } = useQuery({
    queryKey: ['pose-history'],
    queryFn: () => api.get('/pose/sessions/history').then(response => response.data).catch(() => []),
  })

  const analyze = useCallback((results: Results) => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    const points = results.poseLandmarks
    if (!canvas || !context || !points?.length) {
      setCue('Body not detected — step back until your full body is visible')
      setScore(0)
      setJointAngle(null)
      return
    }
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (canvas.width !== width * devicePixelRatio || canvas.height !== height * devicePixelRatio) {
      canvas.width = width * devicePixelRatio
      canvas.height = height * devicePixelRatio
    }
    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    context.clearRect(0, 0, width, height)
    context.strokeStyle = '#00f0ff'
    context.lineWidth = 3
    context.shadowColor = '#00f0ff'
    context.shadowBlur = 9
    POSE_CONNECTIONS.forEach(([from, to]) => {
      const a = points[from], b = points[to]
      if ((a.visibility ?? 0) < 0.45 || (b.visibility ?? 0) < 0.45) return
      context.beginPath()
      context.moveTo((1 - a.x) * width, a.y * height)
      context.lineTo((1 - b.x) * width, b.y * height)
      context.stroke()
    })
    context.shadowBlur = 0
    context.fillStyle = '#4edea3'
    points.forEach(point => {
      if ((point.visibility ?? 0) < 0.45) return
      context.beginPath()
      context.arc((1 - point.x) * width, point.y * height, 4, 0, Math.PI * 2)
      context.fill()
    })

    const [a, b, c] = exercise.joints.map(index => points[index])
    if (!a || !b || !c || [a, b, c].some(point => (point.visibility ?? 0) < 0.45)) {
      setCue('Turn sideways and keep the tracked joint visible')
      return
    }
    const measured = angle(a, b, c)
    setJointAngle(measured)
    const visibility = points.filter(point => (point.visibility ?? 0) > 0.5).length / points.length
    const formScore = Math.round(Math.max(45, Math.min(100, visibility * 100)))
    setScore(formScore)
    const isDown = exercise.key === 'shoulder_press' ? measured > exercise.down : measured < exercise.down
    const isUp = exercise.key === 'shoulder_press' ? measured < exercise.up : measured > exercise.up
    if (phaseRef.current === 'up' && isDown) {
      phaseRef.current = 'down'
      setCue(formScore > 80 ? 'Good control — return to the start position' : 'Keep your body aligned through the movement')
    } else if (phaseRef.current === 'down' && isUp) {
      phaseRef.current = 'up'
      setReps(value => value + 1)
      setCue(formScore > 80 ? 'Rep counted — great form' : 'Rep counted — focus on alignment')
    }
  }, [exercise])

  const saveSet = useMutation({
    mutationFn: async () => {
      const response = await api.post('/pose/sessions/record', {
        session_exercise_id: sessionExerciseRef.current,
        exercise_key: exerciseKey,
        set_number: setNumber,
        pose_score: score,
        reps_completed: reps,
        feedback: cue,
      })
      sessionExerciseRef.current = response.data.session_exercise_id
      sessionIdRef.current = response.data.session_id
      return response.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pose-history'] }),
  })

  const startCamera = async () => {
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720, facingMode: 'user' } })
      streamRef.current = stream
      if (!videoRef.current) throw new Error('Video preview is unavailable')
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      const pose = new Pose({ locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` })
      pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.55, minTrackingConfidence: 0.55 })
      pose.onResults(analyze)
      await pose.initialize()
      poseRef.current = pose
      setCameraActive(true)
    } catch (error) {
      streamRef.current?.getTracks().forEach(track => track.stop())
      streamRef.current = null
      setCameraError(error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'Camera permission denied. Allow camera access in your browser settings.'
        : 'Unable to start pose tracking. Check camera access and your network connection.')
    }
  }

  const stopCamera = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    void poseRef.current?.close()
    poseRef.current = null
    setCameraActive(false)
  }, [])

  useEffect(() => {
    if (!cameraActive || paused || !poseRef.current || !videoRef.current) return
    let active = true
    const loop = async () => {
      if (!active || !poseRef.current || !videoRef.current) return
      if (videoRef.current.readyState >= 2) await poseRef.current.send({ image: videoRef.current }).catch(() => undefined)
      frameRef.current = requestAnimationFrame(loop)
    }
    frameRef.current = requestAnimationFrame(loop)
    return () => { active = false; if (frameRef.current !== null) cancelAnimationFrame(frameRef.current); frameRef.current = null }
  }, [cameraActive, paused])

  useEffect(() => {
    if (!rest || paused) return
    const timer = window.setInterval(() => setRest(value => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [rest, paused])

  useEffect(() => {
    if (voiceActive && cameraActive && cue && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(cue))
    }
  }, [cue, voiceActive, cameraActive])

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(track => track.stop())
    void poseRef.current?.close()
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  }, [])

  const completeSet = async () => {
    if (!reps || !score || saveSet.isPending) return
    await saveSet.mutateAsync()
    setSaved(true)
    setRest(90)
  }

  const endSession = async () => {
    stopCamera()
    if (sessionIdRef.current) await api.post(`/workouts/sessions/${sessionIdRef.current}/complete`).catch(() => undefined)
    setSessionEnded(true)
  }

  const changeExercise = (key: string) => {
    setExerciseKey(key)
    setReps(0)
    setScore(0)
    setJointAngle(null)
    setSetNumber(1)
    setSaved(false)
    setSessionEnded(false)
    sessionExerciseRef.current = null
    sessionIdRef.current = null
    phaseRef.current = 'up'
  }

  return <div className="flex flex-col gap-6 pb-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-primary font-label-sm uppercase tracking-widest">Computer vision studio</p><h1 className="text-3xl font-bold text-on-surface">Pose Tracker</h1><p className="mt-1 text-on-surface-variant">Live form cues, automatic rep counting, and saved set scores. Camera frames are processed in your browser.</p></div>
      <label className="text-sm text-on-surface-variant">Exercise<select aria-label="Select exercise" value={exerciseKey} onChange={event => changeExercise(event.target.value)} className="ml-3 rounded-lg bg-surface-container-high px-3 py-2 text-on-surface">{EXERCISES.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
    </header>

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
      <section className="flex flex-col gap-4">
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-surface-container-lowest">
          <video ref={videoRef} muted playsInline className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
          {!cameraActive && <div className="absolute inset-0 grid place-content-center gap-2 bg-surface-container-lowest/80 text-center"><span className="material-symbols-outlined text-5xl text-primary">videocam</span><p className="text-on-surface">Camera is off</p></div>}
          <div className="absolute left-4 top-4 rounded-xl bg-surface-container-low/90 px-4 py-3"><strong className="text-secondary">{score ? `${score}% POSE CONFIDENCE` : 'WAITING FOR POSE'}</strong><p className="max-w-sm text-sm text-on-surface">{cue}</p></div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-xl bg-surface-container-lowest/90 px-6 py-2 text-center"><strong className="text-4xl text-primary">{reps}</strong><span className="ml-2 text-on-surface-variant">reps • Set {setNumber}</span></div>
          {cameraError && <p role="alert" className="absolute bottom-4 left-4 right-4 rounded bg-error-container p-2 text-sm text-on-error-container">{cameraError}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-container-low p-4">
          <button type="button" onClick={() => cameraActive ? stopCamera() : void startCamera()} className="rounded-lg bg-primary-container px-4 py-2 font-semibold text-on-primary-container">{cameraActive ? 'Stop camera' : 'Start camera'}</button>
          <button type="button" disabled={!cameraActive} onClick={() => setPaused(value => !value)} className="rounded-lg bg-surface-container-high px-4 py-2 text-on-surface disabled:opacity-40">{paused ? 'Resume tracking' : 'Pause tracking'}</button>
          <button type="button" onClick={() => setVoiceActive(value => !value)} className="rounded-lg bg-surface-container-high px-4 py-2 text-on-surface">Voice cues: {voiceActive ? 'On' : 'Off'}</button>
          <button type="button" onClick={() => { setReps(0); setScore(0); phaseRef.current = 'up'; setCue('Counter reset — begin when ready') }} className="rounded-lg bg-surface-container-high px-4 py-2 text-on-surface">Reset reps</button>
          <button type="button" onClick={() => void endSession()} className="ml-auto rounded-lg bg-error-container px-4 py-2 text-on-error-container">End session</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Tracked joint" value={jointAngle === null ? '—' : `${jointAngle}°`} />
          <Metric label="Target range" value={exercise.key === 'bicep_curl' ? '< 55° curl' : exercise.key === 'shoulder_press' ? 'Overhead press' : '< 100° depth'} />
          <Metric label="Tracking status" value={cameraActive ? paused ? 'Paused' : 'Live' : 'Camera off'} />
        </div>
        <p className="rounded-lg border border-outline-variant/30 p-3 text-sm text-on-surface-variant">Form feedback is an exercise aid, not a medical assessment. Stop if you experience pain or feel unwell.</p>
      </section>

      <aside className="flex flex-col gap-4">
        <section className="rounded-xl bg-surface-container-low p-5"><div className="flex items-center justify-between"><h2 className="font-semibold text-on-surface">Session set</h2><span className="text-sm text-primary">{exercise.label}</span></div><p className="mt-2 text-sm text-on-surface-variant">{reps} reps recorded in current set</p>
          <button type="button" disabled={!reps || !score || saveSet.isPending || saved || sessionEnded} onClick={() => void completeSet()} className="mt-4 w-full rounded-lg bg-primary-container px-4 py-3 font-bold text-on-primary-container disabled:cursor-not-allowed disabled:opacity-40">{saveSet.isPending ? 'Saving…' : saved ? 'Set saved' : sessionEnded ? 'Session ended' : `Save Set ${setNumber}`}</button>
          {saveSet.isError && <p role="alert" className="mt-2 text-sm text-error">Could not save the set. Please retry.</p>}
          {saved && <button type="button" onClick={() => { setSetNumber(value => value + 1); setReps(0); setScore(0); setSaved(false); setRest(90); phaseRef.current = 'up' }} className="mt-2 w-full rounded-lg bg-surface-container-high px-4 py-2 text-on-surface">Start next set</button>}
          {rest > 0 && <p aria-live="polite" className="mt-3 text-center text-primary">Rest: {String(Math.floor(rest / 60)).padStart(2, '0')}:{String(rest % 60).padStart(2, '0')} <button type="button" onClick={() => setRest(value => value + 15)} className="ml-2 text-sm underline">+15s</button></p>}
        </section>
        <section className="rounded-xl bg-surface-container-low p-5"><h2 className="font-semibold text-on-surface">Recent pose sets</h2>{history.length ? <ul className="mt-3 divide-y divide-outline-variant/30">{history.slice(0, 6).map((item: { session_exercise_id: string; exercise_name: string; set_number: number; pose_score: number; recorded_at: string }) => <li key={`${item.session_exercise_id}-${item.set_number}`} className="flex justify-between gap-3 py-3 text-sm"><span className="text-on-surface">{item.exercise_name} · Set {item.set_number}<small className="block text-on-surface-variant">{item.recorded_at ? new Date(item.recorded_at).toLocaleDateString() : ''}</small></span><strong className="text-secondary">{Math.round(item.pose_score)}%</strong></li>)}</ul> : <p className="mt-3 text-sm text-on-surface-variant">Saved sets will appear here.</p>}</section>
        <section className="rounded-xl bg-surface-container-low p-5"><h2 className="font-semibold text-on-surface">Tracking tips</h2><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-on-surface-variant"><li>Place the camera far enough away to show your full body.</li><li>Use a well-lit space and keep the camera steady.</li><li>Turn sideways for joint-angle exercises.</li></ul></section>
      </aside>
    </div>
  </div>
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-surface-container p-4"><p className="text-xs uppercase text-on-surface-variant">{label}</p><p className="mt-1 font-semibold text-on-surface">{value}</p></div>
}
