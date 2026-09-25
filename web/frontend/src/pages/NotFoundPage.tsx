import { Link } from 'react-router-dom'
import { Home, AlertCircle } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-3xl bg-red-900/20 p-6">
            <AlertCircle className="h-16 w-16 text-red-400" aria-hidden="true" />
          </div>
        </div>
        <h1 className="text-6xl font-black text-gray-600 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-white mb-2">Page not found</h2>
        <p className="text-gray-400 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/dashboard" className="btn-primary btn-lg">
          <Home className="h-4 w-4" aria-hidden="true" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
