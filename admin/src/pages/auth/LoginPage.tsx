import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { loginAdmin, clearError } from '../../redux/slices/authSlice'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isLoading, error, isAuthenticated } = useAppSelector(s => s.auth)

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
    return () => { dispatch(clearError()) }
  }, [isAuthenticated, navigate, dispatch])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(loginAdmin({ email, password }))
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative" style={{ background: 'linear-gradient(135deg, #1a1d2e 0%, #2d3154 50%, #1a1d2e 100%)' }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center text-white font-bold text-2xl mb-6 shadow-2xl shadow-primary-600/30">
            HC
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">HandiCraft Admin</h1>
          <p className="text-gray-400 text-lg mb-8">Enterprise e-commerce management platform</p>
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {[
              { label: 'Products', val: '1,200+' },
              { label: 'Orders', val: '3,247' },
              { label: 'Revenue', val: '₹24.5L' },
              { label: 'Users', val: '12,849' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-4 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-2xl font-bold text-white">{s.val}</p>
                <p className="text-gray-400 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="card p-8">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6 lg:hidden">
                <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold">HC</div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">HandiCraft Admin</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Sign in to your admin account</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@handicraft.com"
                  className="input-field"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center py-2.5 mt-2">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1.5">Demo Credentials</p>
              <div className="space-y-1 text-xs text-blue-600 dark:text-blue-300">
                <p>Admin: <span className="font-mono">admin@handicraft.com</span> / <span className="font-mono">admin123</span></p>
                <p>Manager: <span className="font-mono">manager@handicraft.com</span> / <span className="font-mono">manager123</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
