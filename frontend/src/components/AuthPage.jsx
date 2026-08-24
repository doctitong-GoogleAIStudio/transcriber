import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthPage = () => {
  const { login, register, forgotPassword, resetPassword } = useAuth();
  const [mode, setMode] = useState('login'); // login | register | forgot | reset
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const clearForm = () => {
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
    setResetCode('');
    setNewPassword('');
    setGeneratedCode('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username, password, rememberMe);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await register(username, password, fullName);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      const data = await forgotPassword(username);
      setGeneratedCode(data.reset_code);
      setSuccess('Reset code generated! Use the code below to reset your password.');
      setMode('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const data = await resetPassword(username, resetCode, newPassword);
      setSuccess(data.message);
      setTimeout(() => {
        clearForm();
        setMode('login');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 text-slate-900 dark:text-slate-200 bg-[var(--bg)]" style={{ fontFamily: "'Figtree', sans-serif" }}>
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-800 dark:text-emerald-400" style={{ fontFamily: "'Manrope', sans-serif" }}>
            DDH Transcriber
          </h1>
          <p className="text-base font-medium text-slate-500 dark:text-slate-400 mt-1">
            AI Audio Transcriber
          </p>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden">

          {/* Tab Navigation - visible on login and register modes */}
          {(mode === 'login' || mode === 'register') && (
            <div className="flex border-b border-slate-200 dark:border-slate-700" data-testid="auth-tabs">
              <button
                type="button"
                onClick={() => { clearForm(); setMode('login'); }}
                data-testid="tab-signin"
                className={`flex-1 py-3.5 text-center font-semibold text-sm transition-all ${
                  mode === 'login'
                    ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-700 dark:border-emerald-400 bg-white/30 dark:bg-slate-700/30'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/20'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { clearForm(); setMode('register'); }}
                data-testid="tab-signup"
                className={`flex-1 py-3.5 text-center font-semibold text-sm transition-all ${
                  mode === 'register'
                    ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-700 dark:border-emerald-400 bg-white/30 dark:bg-slate-700/30'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/20'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          <div className="p-6 md:p-8">

          {/* LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">

              {error && (
                <div className="bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-2.5 rounded-lg text-sm" data-testid="auth-error">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
                <input
                  data-testid="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <input
                  data-testid="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    data-testid="login-remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-500 dark:text-slate-400">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => { clearForm(); setMode('forgot'); }}
                  className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline"
                  data-testid="forgot-password-link"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                data-testid="login-submit-btn"
                className="w-full bg-emerald-800 text-white font-semibold py-2.5 rounded-xl hover:bg-emerald-700 disabled:bg-emerald-900/50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-5">

              {error && (
                <div className="bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-2.5 rounded-lg text-sm" data-testid="auth-error">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name (optional)</label>
                <input
                  data-testid="register-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
                <input
                  data-testid="register-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  placeholder="Choose a username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <input
                  data-testid="register-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  placeholder="Min. 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
                <input
                  data-testid="register-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  placeholder="Re-enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                data-testid="register-submit-btn"
                className="w-full bg-emerald-800 text-white font-semibold py-2.5 rounded-xl hover:bg-emerald-700 disabled:bg-emerald-900/50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 text-center" data-testid="auth-title">
                Forgot Password
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                Enter your username and we'll generate a reset code.
              </p>

              {error && (
                <div className="bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-2.5 rounded-lg text-sm" data-testid="auth-error">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
                <input
                  data-testid="forgot-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  placeholder="Enter your username"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                data-testid="forgot-submit-btn"
                className="w-full bg-emerald-800 text-white font-semibold py-2.5 rounded-xl hover:bg-emerald-700 disabled:bg-emerald-900/50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? 'Generating code...' : 'Get Reset Code'}
              </button>

              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                <button
                  type="button"
                  onClick={() => { clearForm(); setMode('login'); }}
                  className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold hover:underline"
                  data-testid="back-to-login"
                >
                  Back to Sign In
                </button>
              </p>
            </form>
          )}

          {/* RESET PASSWORD */}
          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 text-center" data-testid="auth-title">
                Reset Password
              </h2>

              {generatedCode && (
                <div className="bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-lg text-center" data-testid="reset-code-display">
                  <p className="text-sm mb-1">Your reset code:</p>
                  <p className="text-2xl font-mono font-bold tracking-widest">{generatedCode}</p>
                  <p className="text-xs mt-1 opacity-70">Code expires in 15 minutes</p>
                </div>
              )}

              {error && (
                <div className="bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-2.5 rounded-lg text-sm" data-testid="auth-error">
                  {error}
                </div>
              )}
              {success && !generatedCode && (
                <div className="bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-2.5 rounded-lg text-sm" data-testid="auth-success">
                  {success}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reset Code</label>
                <input
                  data-testid="reset-code-input"
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition text-center tracking-widest font-mono text-lg"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                <input
                  data-testid="reset-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  placeholder="Min. 6 characters"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                data-testid="reset-submit-btn"
                className="w-full bg-emerald-800 text-white font-semibold py-2.5 rounded-xl hover:bg-emerald-700 disabled:bg-emerald-900/50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>

              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                <button
                  type="button"
                  onClick={() => { clearForm(); setMode('login'); }}
                  className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold hover:underline"
                  data-testid="back-to-login-from-reset"
                >
                  Back to Sign In
                </button>
              </p>
            </form>
          )}
          </div>
        </div>

        <footer className="text-center mt-6">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Digos Doctors Hospital AI Audio Transcriber
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AuthPage;
