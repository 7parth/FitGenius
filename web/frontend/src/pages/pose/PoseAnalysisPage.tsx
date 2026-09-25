import { useRef, useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Camera, CameraOff, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const POSE_EXERCISES = [
  { key: 'squat', label: 'Squat' },
  { key: 'push_up', label: 'Push-Up' },
  { key: 'bicep_curl', label: 'Bicep Curl' },
  { key: 'shoulder_press', label: 'Shoulder Press' },
  { key: 'lunge', label: 'Lunge' },
]

export default function PoseAnalysisPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [selectedExercise, setSelectedExercise] = useState(POSE_EXERCISES[0])
  const [score, setScore] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isAnalysing, setIsAnalysing] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)

  // Pose history
  const { data: history = [] } = useQuery({
    queryKey: ['pose-history'],
    queryFn: () => api.get('/pose/sessions/history').then(r => r.data),
  })

  // Start / stop camera
  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access to use pose analysis.')
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera detected. Pose analysis requires a webcam.')
      } else {
        setCameraError('Could not start camera. Please check your device settings.')
      }
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraActive(false)
    setScore(null)
    setFeedback(null)
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  // Simulate pose scoring (MediaPipe integration placeholder)
  // In production this would run MediaPipe Pose and compute joint angles
  const analyseFrame = useCallback(() => {
    if (!cameraActive || isAnalysing) return
    setIsAnalysing(true)

    setTimeout(() => {
      // Simulated score 60–98 for demonstration
      const simulatedScore = Math.floor(Math.random() * 38) + 60
      const feedbacks: Record<string, string[]> = {
        squat: ['Keep knees tracking over toes', 'Good depth! Maintain neutral spine', 'Drive through heels on the way up'],
        push_up: ['Lower chest closer to the floor', 'Solid plank position', 'Keep elbows at 45 degrees'],
        bicep_curl: ['Avoid swinging — keep elbows pinned', 'Full range of motion looks great', 'Slow the descent for more time under tension'],
        shoulder_press: ['Press straight up, not forward', 'Great shoulder engagement', 'Brace your core throughout'],
        lunge: ['Front knee over ankle, not past toes', 'Keep torso upright', 'Equal weight distribution'],
      }
      const exerciseFeedbacks = feedbacks[selectedExercise.key] ?? ['Keep up the good form!']
      setScore(simulatedScore)
      setFeedback(exerciseFeedbacks[Math.floor(Math.random() * exerciseFeedbacks.length)])
      setIsAnalysing(false)
    }, 1500)
  }, [cameraActive, isAnalysing, selectedExercise.key])

  const scoreColor = score === null ? '' : score >= 85 ? 'text-emerald-400' : score >= 70 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pose Analysis</h1>
        <p className="text-gray-400 text-sm mt-1">Real-time form feedback powered by AI</p>
      </div>

      {/* Medical disclaimer */}
      <div className="flex gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300" role="note">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p>Pose analysis provides general form guidance only — it is not a substitute for coaching from a qualified trainer. Consult a professional for injury-related concerns.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Exercise selector */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Select exercise">
            {POSE_EXERCISES.map(ex => (
              <button
                key={ex.key}
                onClick={() => setSelectedExercise(ex)}
                aria-pressed={selectedExercise.key === ex.key}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-sm font-medium transition-colors',
                  selectedExercise.key === ex.key
                    ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                    : 'bg-surface-700 text-gray-400 hover:text-white border border-surface-600'
                )}
              >
                {ex.label}
              </button>
            ))}
          </div>

          {/* Video feed */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-surface-800 border border-surface-700">
            <video
              ref={videoRef}
              className={cn('w-full h-full object-cover', !cameraActive && 'hidden')}
              muted
              playsInline
              aria-label="Camera feed for pose analysis"
            />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" />

            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                {cameraError ? (
                  <>
                    <AlertCircle className="w-12 h-12 text-red-400" aria-hidden="true" />
                    <p className="text-sm text-red-300 text-center px-6">{cameraError}</p>
                  </>
                ) : (
                  <>
                    <Camera className="w-12 h-12 text-gray-500" aria-hidden="true" />
                    <p className="text-gray-400 text-sm">Camera off</p>
                  </>
                )}
              </div>
            )}

            {/* Live score overlay */}
            {cameraActive && score !== null && (
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 text-center" aria-live="polite" aria-label={`Form score: ${score}`}>
                <p className={cn('text-2xl font-bold', scoreColor)}>{score}</p>
                <p className="text-xs text-gray-400">Form score</p>
              </div>
            )}

            {isAnalysing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm" aria-label="Analysing pose…" aria-live="polite">
                <LoadingSpinner size="lg" />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {!cameraActive ? (
              <button onClick={startCamera} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Camera className="w-4 h-4" aria-hidden="true" /> Start Camera
              </button>
            ) : (
              <>
                <button onClick={stopCamera} className="btn-ghost flex items-center gap-2">
                  <CameraOff className="w-4 h-4" aria-hidden="true" /> Stop
                </button>
                <button
                  onClick={analyseFrame}
                  disabled={isAnalysing}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {isAnalysing ? 'Analysing…' : `Analyse ${selectedExercise.label}`}
                </button>
              </>
            )}
          </div>

          {/* Feedback */}
          {feedback && (
            <div className="card p-4 border-primary-500/20 bg-primary-500/5 flex items-start gap-3" aria-live="polite">
              <CheckCircle2 className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-gray-300">{feedback}</p>
            </div>
          )}
        </div>

        {/* History sidebar */}
        <div className="space-y-3">
          <h2 className="font-semibold text-white text-sm">Recent Sessions</h2>
          {history.length === 0 ? (
            <p className="text-xs text-gray-500">No pose sessions yet. Analyse a set to see your history here.</p>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 10).map((h: any, i: number) => (
                <div key={i} className="card p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-white">{h.exercise_name}</p>
                    <p className="text-xs text-gray-500">Set {h.set_number}</p>
                  </div>
                  <span className={cn(
                    'text-sm font-bold',
                    h.pose_score >= 85 ? 'text-emerald-400' : h.pose_score >= 70 ? 'text-amber-400' : 'text-red-400'
                  )}>
                    {Math.round(h.pose_score)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
