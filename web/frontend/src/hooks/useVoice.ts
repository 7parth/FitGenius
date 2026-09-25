/**
 * useVoice — Web Speech API hook for voice input and text-to-speech output.
 * Gracefully falls back when the API is unavailable (Firefox, Safari partial).
 */
import { useState, useCallback, useRef, useEffect } from 'react'

// ── Browser type shims ────────────────────────────────────────────────────────
interface SpeechRecognitionResult {
  isFinal: boolean
  0: { transcript: string }
}

interface SpeechRecognitionEvent {
  resultIndex: number
  results: SpeechRecognitionResult[] & { length: number }
}

interface SpeechRecognitionErrorEvent {
  error: string
}

interface SpeechRecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognitionInstance
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface UseVoiceOptions {
  lang?: string
  continuous?: boolean
  interimResults?: boolean
  onResult?: (transcript: string, isFinal: boolean) => void
  onError?: (error: string) => void
}

export interface UseVoiceReturn {
  isListening: boolean
  isSupported: boolean
  isSpeaking: boolean
  transcript: string
  interimTranscript: string
  startListening: () => void
  stopListening: () => void
  speak: (text: string, opts?: { rate?: number; pitch?: number; volume?: number }) => void
  cancelSpeech: () => void
  toggleListening: () => void
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useVoice(options: UseVoiceOptions = {}): UseVoiceReturn {
  const {
    lang = 'en-US',
    continuous = false,
    interimResults = true,
    onResult,
    onError,
  } = options

  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  const isSupported =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition ?? window.webkitSpeechRecognition)

  const startListening = useCallback(() => {
    if (!isSupported) {
      onError?.('Speech recognition is not supported in this browser.')
      return
    }
    if (isListening) return

    const Constructor = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Constructor) return

    const rec = new Constructor()
    rec.lang = lang
    rec.continuous = continuous
    rec.interimResults = interimResults
    rec.maxAlternatives = 1
    recognitionRef.current = rec

    rec.onstart = () => {
      setIsListening(true)
      setTranscript('')
      setInterimTranscript('')
    }

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let final = ''
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      if (final) {
        setTranscript(prev => prev + final)
        setInterimTranscript('')
        onResult?.(final, true)
      } else {
        setInterimTranscript(interim)
        onResult?.(interim, false)
      }
    }

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      const msgs: Record<string, string> = {
        'not-allowed': 'Microphone access denied. Please allow microphone permissions.',
        'no-speech': 'No speech detected. Please try again.',
        'network': 'Network error during speech recognition.',
        'aborted': 'Recognition was aborted.',
        'audio-capture': 'No microphone found or microphone is unavailable.',
      }
      onError?.(msgs[event.error] ?? `Recognition error: ${event.error}`)
      setIsListening(false)
    }

    rec.onend = () => {
      setIsListening(false)
      setInterimTranscript('')
    }

    try { rec.start() } catch { setIsListening(false) }
  }, [isSupported, isListening, lang, continuous, interimResults, onResult, onError])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const toggleListening = useCallback(() => {
    if (isListening) stopListening()
    else startListening()
  }, [isListening, startListening, stopListening])

  const speak = useCallback((text: string, opts: { rate?: number; pitch?: number; volume?: number } = {}) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = opts.rate ?? 1.0
    utterance.pitch = opts.pitch ?? 1.0
    utterance.volume = opts.volume ?? 1.0
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }, [lang])

  const cancelSpeech = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [])

  return {
    isListening, isSupported, isSpeaking, transcript, interimTranscript,
    startListening, stopListening, speak, cancelSpeech, toggleListening,
  }
}
