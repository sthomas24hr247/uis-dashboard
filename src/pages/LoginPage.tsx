import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2, Shield, Zap, BarChart3 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      await login(email, password);
      navigate('/schedule');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-uis-600 via-uis-700 to-uis-900 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-uis-400 rounded-full blur-3xl" />
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-white">U</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">UIS</h1>
              <p className="text-uis-200 text-sm">Unified Intelligence System</p>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              One platform.<br />
              Every insight.<br />
              Zero complexity.
            </h2>
            <p className="text-uis-200 text-lg max-w-md">
              The operating system for modern dental practices. Unify your PMS, AI tools, and analytics in one intelligent dashboard.
            </p>
          </div>
          
          {/* Feature highlights */}
          <div className="grid grid-cols-3 gap-4 pt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <Shield className="w-8 h-8 text-uis-300 mb-2" />
              <p className="text-white font-medium text-sm">HIPAA Compliant</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <Zap className="w-8 h-8 text-uis-300 mb-2" />
              <p className="text-white font-medium text-sm">Real-time Sync</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <BarChart3 className="w-8 h-8 text-uis-300 mb-2" />
              <p className="text-white font-medium text-sm">AI Analytics</p>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 text-uis-300 text-sm">
          © 2024 UIS · Powered by Orchestrate AI & Dentamind
        </div>
      </div>
      
      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-uis-600 rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-white">U</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">UIS</h1>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome back</h2>
              <p className="text-slate-500">Sign in to your practice dashboard</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-in">
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@practice.com"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-12"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-uis-600 focus:ring-uis-500"
                  />
                  <span className="text-sm text-slate-600">Remember me</span>
                </label>
                <a href="#" className="text-sm text-uis-600 hover:text-uis-700 font-medium">
                  Forgot password?
                </a>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
            
            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">
                Don't have an account?{' '}
                <a href="#" className="text-uis-600 hover:text-uis-700 font-medium">
                  Request access
                </a>
              </p>
            </div>
          </div>
          
          {/* Demo hint */}
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
            <p className="text-amber-800">
              <strong>Demo Mode:</strong> Enter any email and password to explore the dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
