import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { Sparkles, X, AlertTriangle } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      // Sign in with Google Popup
      await signInWithPopup(auth, googleProvider);
      onLoginSuccess();
      onClose();
    } catch (err: any) {
      console.error("Google login failed:", err);
      // Don't show error if user closed the popup manually
      if (err.code !== "auth/popup-closed-by-user") {
        setError(`로그인 실패: [${err.code}] ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col gap-6 max-w-sm w-full relative mx-4">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer transition-colors disabled:opacity-30"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Brand Icon and Header */}
        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/5">
            <Sparkles className="h-8 w-8 text-indigo-400 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-lg font-black text-slate-100 tracking-tight">SlidePen Pro 프리미엄 AI 연동</h2>
            <p className="text-xs text-slate-400 leading-relaxed px-2">
              실시간 AI 스케치 효과 및 커스텀 에셋 변환은 유료 프리미엄 기능입니다. 구글 로그인 후 **체험 크레딧**을 이용해 보세요!
            </p>
          </div>
        </div>

        {/* Warning Callout for Enterprise PC */}
        <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-3 flex gap-2.5 text-left">
          <AlertTriangle className="h-4.5 w-4.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-[10px] text-slate-400 leading-relaxed">
            <span className="text-amber-500 font-bold">참고:</span> 사내 보안망이나 방화벽에 의해 로그인 팝업 창이 차단될 수 있습니다. 팝업이 뜨지 않을 시 브라우저 차단 설정을 해제해 주세요.
          </div>
        </div>

        {/* Login Action Button */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex items-center justify-center gap-3 w-full py-3 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-97 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.99 5.99 0 0 1 7.99 12.5a5.99 5.99 0 0 1 6.002-6.015c1.378 0 2.637.47 3.639 1.42l3.208-3.21A10.74 10.74 0 0 0 14.002 1.5C8.2 1.5 3.5 6.2 3.5 12s4.7 10.5 10.5 10.5c6.286 0 10.5-4.42 10.5-10.5 0-.712-.081-1.22-.244-1.715H12.24Z"
                  />
                </svg>
                <span>Google 계정으로 로그인</span>
              </>
            )}
          </button>

          {error && (
            <div className="text-[10px] text-rose-400 font-semibold text-center leading-relaxed">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
