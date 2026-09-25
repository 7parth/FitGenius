import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8" role="alert">
          <div className="rounded-2xl bg-red-900/20 p-5">
            <AlertTriangle className="h-10 w-10 text-red-400" aria-hidden="true" />
          </div>
          <div className="text-center">
            <h3 className="text-base font-semibold text-gray-100 mb-2">Something went wrong</h3>
            <p className="text-sm text-gray-400">{this.state.error?.message || 'An unexpected error occurred'}</p>
          </div>
          <button
            className="btn-secondary flex items-center gap-2"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
