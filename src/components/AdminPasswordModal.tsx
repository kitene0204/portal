import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, KeyRound, Eye, EyeOff, X, ShieldCheck, AlertCircle } from 'lucide-react';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expectedPassword?: string;
  title?: string;
  description?: string;
}

export default function AdminPasswordModal({
  isOpen,
  onClose,
  onSuccess,
  expectedPassword = '1234',
  title = '관리자 인증이 필요합니다',
  description = '포털 정보 및 웹앱 세부사항 수정을 위해 관리자 비밀번호를 입력해 주세요.'
}: AdminPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = password.trim();
    const targetPassword = (expectedPassword || '1234').trim();

    if (cleanInput === targetPassword) {
      if (rememberMe) {
        localStorage.setItem('vibe_portal_admin_auth', 'true');
        sessionStorage.setItem('vibe_portal_admin_auth', 'true');
      } else {
        sessionStorage.setItem('vibe_portal_admin_auth', 'true');
        localStorage.removeItem('vibe_portal_admin_auth');
      }
      setError(null);
      onSuccess();
    } else {
      setError('비밀번호가 일치하지 않습니다.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      inputRef.current?.select();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            x: isShaking ? [0, -10, 10, -8, 8, -4, 4, 0] : 0
          }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-2xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header Accent Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500" />

          <div className="p-6">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon & Title */}
            <div className="flex items-start gap-3.5 mb-5">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 flex-shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-100">{title}</h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  관리자 비밀번호 (PIN)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    ref={inputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="비밀번호 입력 (기본: 1234)"
                    className={`w-full pl-9 pr-10 py-2.5 bg-neutral-950 border rounded-xl text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none transition-colors ${
                      error
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : 'border-neutral-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 mt-2 text-rose-400 text-xs font-medium"
                  >
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </div>

              {/* Remember Me Option */}
              <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-neutral-700 bg-neutral-950 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                  <span>이 브라우저에서 로그인 상태 유지</span>
                </label>
              </div>

              {/* Info Note */}
              <div className="p-3 bg-neutral-950/70 border border-neutral-800/80 rounded-xl text-[11px] text-neutral-400 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  초기 기본 비밀번호는 <strong className="text-amber-400 font-mono">1234</strong> 입니다. 포털 관리자 패널의 <strong>[일반 설정 &gt; 관리자 보안 설정]</strong>에서 언제든 변경할 수 있습니다.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-lg shadow-indigo-950/40"
                >
                  확인 및 수정 시작
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
