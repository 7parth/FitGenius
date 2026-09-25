import { Outlet } from 'react-router-dom'
import { ToastContainer } from '@/components/ui/Toast'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface text-on-surface flex relative overflow-hidden">
      {/* Background glow effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-secondary-container/15 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface-container-lowest border-r border-outline-variant/30 flex-col items-center justify-center p-12 relative overflow-hidden shadow-2xl" aria-hidden="true">
        <div className="relative z-10 text-center max-w-lg">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img
              src="https://lh3.googleusercontent.com/aida/AEtjO1WLAmfYZGiITIf3SUcBhpHZOTvK4WAULGQEwR6s_ILrWtEIHxPk2zA_b-dIg-6xf3qNfJp1MsNib78j__LMmYMt-3_Pz0TYtx-qLjP9wD_0f5hEuDqYWMpBwuDq7qYtUySXBgqeBlHVreDH2HyFTyxhAigmeC0CvnuyjJ63MZrCpD8HBzooG5fVVR681Mr8YaQeNiduDyXvv2usAoUpcTiW8_bIPXxWUS-uRchnKPKz__1VDko-bUtbT99-"
              alt="FitGenius Logo"
              className="w-12 h-12 rounded-xl object-contain shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            />
            <div className="text-left">
              <span className="text-3xl font-extrabold tracking-wider text-primary font-headline-lg">FitGenius</span>
              <span className="block text-[10px] font-mono tracking-widest text-primary-container uppercase">PRECISION BIO-AI</span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-on-surface tracking-tight font-headline-lg mb-3">
            Autonomous Biometric Intelligence &amp; Computer Vision
          </h1>
          <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
            Adaptive periodization, sub-millisecond pose tracking at 60 FPS, and multi-sensor CNS recovery telemetry.
          </p>

          <div className="grid grid-cols-2 gap-3 text-left">
            {[
              { icon: 'psychology', title: 'Synapse 4.8 Bio-AI', desc: 'Predictive motor unit recruitment' },
              { icon: 'videocam', title: 'Pose Studio 60 FPS', desc: '33-keypoint kinetic form tracking' },
              { icon: 'vital_signs', title: 'Autonomic Telemetry', desc: 'Continuous multi-sensor recovery' },
              { icon: 'emoji_events', title: 'Bio-Compete League', desc: 'Decentralized fitness leaderboards' },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl bg-surface-container border border-outline-variant/30 p-4 shadow-md flex flex-col gap-1">
                <span className="material-symbols-outlined text-primary-container text-2xl mb-1">{f.icon}</span>
                <div className="text-xs font-bold text-on-surface font-mono">{f.title}</div>
                <div className="text-[11px] text-on-surface-variant">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10">
        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <img
            src="https://lh3.googleusercontent.com/aida/AEtjO1WLAmfYZGiITIf3SUcBhpHZOTvK4WAULGQEwR6s_ILrWtEIHxPk2zA_b-dIg-6xf3qNfJp1MsNib78j__LMmYMt-3_Pz0TYtx-qLjP9wD_0f5hEuDqYWMpBwuDq7qYtUySXBgqeBlHVreDH2HyFTyxhAigmeC0CvnuyjJ63MZrCpD8HBzooG5fVVR681Mr8YaQeNiduDyXvv2usAoUpcTiW8_bIPXxWUS-uRchnKPKz__1VDko-bUtbT99-"
            alt="FitGenius Logo"
            className="w-10 h-10 rounded-xl object-contain shadow-[0_0_16px_rgba(0,240,255,0.4)]"
          />
          <div>
            <span className="text-2xl font-extrabold text-primary font-headline-lg">FitGenius</span>
            <span className="block text-[9px] font-mono tracking-widest text-primary-container uppercase">PRECISION BIO-AI</span>
          </div>
        </div>

        <div className="w-full max-w-md bg-surface-container-low border border-outline-variant/40 rounded-3xl p-8 shadow-2xl">
          <main id="main-content">
            <Outlet />
          </main>
        </div>
      </div>

      <ToastContainer />
    </div>
  )
}
