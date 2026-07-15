import React, { useState } from "react";
import { User } from "firebase/auth";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import { X, Sparkles, Zap, Award, CreditCard } from "lucide-react";

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  credits: number;
  description: string;
  badge?: string;
  colorClass: string;
  icon: React.ReactNode;
}

export const CreditPurchaseModal: React.FC<CreditPurchaseModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const plans: Plan[] = [
    {
      id: "light",
      name: "Starter Pack",
      price: "$0.99 (약 1,300원)",
      credits: 10,
      description: "발표 1~2회 맛보기 소액 충전",
      colorClass: "from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-400",
      icon: <Zap className="h-6 w-6 text-blue-450" />
    },
    {
      id: "power",
      name: "Normal Pack",
      price: "$1.99 (약 2,600원)",
      credits: 30,
      description: "발표 3~4회 동안 넉넉하게 사용",
      badge: "추천 플랜",
      colorClass: "from-pink-500/10 to-purple-500/10 border-pink-500/35 text-pink-400 animate-pulse-slow",
      icon: <Sparkles className="h-6 w-6 text-pink-450" />
    },
    {
      id: "pro",
      name: "Student Pro (월간)",
      price: "$4.99/월 (약 6,500원)",
      credits: 100,
      description: "매월 자동 적립 및 무제한 저장",
      badge: "구독형",
      colorClass: "from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-400",
      icon: <Award className="h-6 w-6 text-amber-450" />
    }
  ];

  const handlePurchase = async (plan: Plan) => {
    if (!currentUser) {
      alert("로그인이 필요합니다.");
      return;
    }

    setLoadingPlanId(plan.id);
    try {
      // Simulate PG payment delay (1.2s)
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Update Firestore user document credits using atomic increment
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        credits: increment(plan.credits)
      });

      setSuccessMessage(`${plan.name} 구매 완료! ${plan.credits} 크레딧이 실시간 적립되었습니다.`);
      
      // Auto close success message after 2.5s
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2500);

    } catch (err: any) {
      console.error("Credit purchase failed:", err);
      alert(`구매 실패: ${err.message || err}`);
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col gap-6 max-w-lg w-full relative mx-4">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          disabled={!!loadingPlanId || !!successMessage}
          className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer transition-colors disabled:opacity-30"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-14 w-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shadow-lg shadow-pink-500/5">
            <CreditCard className="h-7 w-7 text-pink-400" />
          </div>
          <h2 className="text-lg font-black text-slate-100 tracking-tight mt-2">프리미엄 AI 크레딧 충전</h2>
          <p className="text-xs text-slate-400 max-w-sm">
            AI 효과 변환에는 서버 GPU 가속(Imagen 4.0) 리소스가 사용됩니다. 필요에 맞게 크레딧 팩을 충전해 보세요!
          </p>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative bg-gradient-to-br rounded-2xl p-4 border flex flex-col items-center justify-between text-center gap-3 transition-all ${plan.colorClass}`}
            >
              {/* Badge */}
              {plan.badge && (
                <span className="absolute -top-2.5 bg-pink-600 text-white font-black text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {plan.badge}
                </span>
              )}

              {/* Icon & Plan Info */}
              <div className="flex flex-col items-center gap-1.5 mt-1">
                {plan.icon}
                <span className="text-xs font-black text-slate-200">{plan.name}</span>
                <span className="text-[10px] text-slate-500 leading-tight">{plan.description}</span>
              </div>

              {/* Price & Credits & Buy Button */}
              <div className="w-full space-y-3 mt-1">
                <div className="flex flex-col">
                  <span className="text-lg font-black text-slate-100">{plan.price}</span>
                  <span className="text-[10px] text-pink-400 font-bold">+{plan.credits} 크레딧</span>
                </div>

                <button
                  disabled={!!loadingPlanId || !!successMessage}
                  onClick={() => handlePurchase(plan)}
                  className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border border-slate-850 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingPlanId === plan.id ? "결제 처리중..." : "충전하기"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Success Overlay Modal inside */}
        {successMessage && (
          <div className="absolute inset-0 bg-slate-900/95 rounded-3xl flex flex-col items-center justify-center p-6 text-center gap-3 animate-fade-in z-20">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-550/20 flex items-center justify-center animate-bounce">
              <span className="text-2xl">🎉</span>
            </div>
            <h3 className="text-base font-black text-emerald-400">결제 및 충전 성공!</h3>
            <p className="text-xs text-slate-350 leading-relaxed max-w-xs">{successMessage}</p>
          </div>
        )}

        {/* Sandbox Note */}
        <div className="text-[10px] text-slate-500 text-center border-t border-slate-850/80 pt-4 leading-relaxed">
          <span className="text-indigo-400 font-semibold">개발 테스트 알림:</span> 현재 모드는 가상 테스트 모드입니다. 충전하기 버튼을 누르시면 카드 실제 결제 없이 **즉시 파이어베이스에 크레딧이 충전**되어 실시간으로 반영됩니다!
        </div>
      </div>
    </div>
  );
};
