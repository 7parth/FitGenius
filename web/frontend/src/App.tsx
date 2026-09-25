import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Suspense, lazy } from 'react'
import { useAuthStore } from '@/store/authStore'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'

// Lazy-loaded pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const OnboardingPage = lazy(() => import('@/pages/onboarding/OnboardingPage'))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const ExercisesPage = lazy(() => import('@/pages/exercises/ExercisesPage'))
const ExerciseDetailPage = lazy(() => import('@/pages/exercises/ExerciseDetailPage'))
const RecommendationPage = lazy(() => import('@/pages/recommendations/RecommendationPage'))
const WorkoutPlayerPage = lazy(() => import('@/pages/workout/WorkoutPlayerPage'))
const WorkoutSummaryPage = lazy(() => import('@/pages/workout/WorkoutSummaryPage'))
const PoseAnalysisPage = lazy(() => import('@/pages/pose/PoseAnalysisPage'))
const CoachPage = lazy(() => import('@/pages/coach/CoachPage'))
const ProgressPage = lazy(() => import('@/pages/progress/ProgressPage'))
const AchievementsPage = lazy(() => import('@/pages/gamification/AchievementsPage'))
const LeaderboardPage = lazy(() => import('@/pages/gamification/LeaderboardPage'))
const ChallengesPage = lazy(() => import('@/pages/gamification/ChallengesPage'))
const AccessibilitySettingsPage = lazy(() => import('@/pages/settings/AccessibilitySettingsPage'))
const ProfilePage = lazy(() => import('@/pages/settings/ProfilePage'))
const NutritionPage = lazy(() => import('@/pages/nutrition/NutritionPage'))
const WearablePage = lazy(() => import('@/pages/wearables/WearablePage'))
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const UsersAdminPage = lazy(() => import('@/pages/admin/UsersPage'))
const ExercisesAdminPage = lazy(() => import('@/pages/admin/ExercisesAdminPage'))
const ChallengesAdminPage = lazy(() => import('@/pages/admin/ChallengesAdminPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    }
  }
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-surface-900" role="status" aria-label="Loading page">
    <LoadingSpinner size="lg" />
  </div>
)

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
              <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
            </Route>

            {/* Onboarding (protected but no sidebar) */}
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

            {/* Main app routes */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/nutrition" element={<NutritionPage />} />
              <Route path="/exercises" element={<ExercisesPage />} />
              <Route path="/exercises/:id" element={<ExerciseDetailPage />} />
              <Route path="/workout/recommend" element={<RecommendationPage />} />
              <Route path="/workout/session/:sessionId" element={<WorkoutPlayerPage />} />
              <Route path="/workout/summary/:sessionId" element={<WorkoutSummaryPage />} />
              <Route path="/workout/pose" element={<PoseAnalysisPage />} />
              <Route path="/coach" element={<CoachPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/challenges" element={<ChallengesPage />} />
              <Route path="/wearables" element={<WearablePage />} />
              <Route path="/settings/accessibility" element={<AccessibilitySettingsPage />} />
              <Route path="/settings/profile" element={<ProfilePage />} />
            </Route>

            {/* Admin routes */}
            <Route element={<ProtectedRoute><AdminRoute><AppLayout /></AdminRoute></ProtectedRoute>}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<UsersAdminPage />} />
              <Route path="/admin/exercises" element={<ExercisesAdminPage />} />
              <Route path="/admin/challenges" element={<ChallengesAdminPage />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
