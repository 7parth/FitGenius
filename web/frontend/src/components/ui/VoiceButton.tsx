import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoiceButtonProps {
  isListening: boolean
  isSupported: boolean
  isSpeaking?: boolean
  onToggle: () => void
  onCancelSpeech?: () => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
  'aria-label'?: string
}

const sizeMap = {
  sm: { btn: 'w-8 h-8', icon: 'w-3.5 h-3.5' },
  md: { btn: 'w-10 h-10', icon: 'w-4 h-4' },
  lg: { btn: 'w-12 h-12', icon: 'w-5 h-5' },
}

export function VoiceButton({
  isListening,
  isSupported,
  isSpeaking = false,
  onToggle,
  onCancelSpeech,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: VoiceButtonProps) {
  const { btn, icon } = sizeMap[size]

  if (!isSupported) {
    return (
      <button
        disabled
        className={cn('rounded-full flex items-center justify-center opacity-30 cursor-not-allowed bg-surface-700', btn, className)}
        title="Voice not supported in this browser"
        aria-label="Voice input not available"
      >
        <MicOff className={icon} />
      </button>
    )
  }

  if (isSpeaking) {
    return (
      <button
        onClick={onCancelSpeech}
        className={cn('rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-400 hover:bg-red-500/20 hover:text-red-400 transition-colors', btn, className)}
        aria-label="Stop speaking"
        title="Stop speaking"
      >
        <Volume2 className={cn(icon, 'animate-pulse')} />
      </button>
    )
  }

  return (
    <button
      onClick={onToggle}
      className={cn(
        'rounded-full flex items-center justify-center transition-all duration-200',
        isListening
          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-2 ring-red-500/50 animate-pulse'
          : 'bg-surface-700 text-gray-400 hover:bg-primary-500/20 hover:text-primary-400',
        btn,
        className,
      )}
      aria-label={ariaLabel ?? (isListening ? 'Stop listening' : 'Start voice input')}
      aria-pressed={isListening}
    >
      {isListening
        ? <MicOff className={icon} />
        : <Mic className={icon} />
      }
    </button>
  )
}
