import React from "react";
import { Keyboard, HelpCircle } from "lucide-react";

interface ShortcutHUDProps {
  isVisible: boolean;
  mode: "biz" | "fun";
}

export const ShortcutHUD: React.FC<ShortcutHUDProps> = ({ isVisible, mode }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-28 left-1/2 z-50 -translate-x-1/2 animate-slide-up">
      <div className="glass-panel rounded-xl px-5 py-3 text-slate-200 shadow-2xl flex flex-col gap-2 max-w-lg border border-violet-500/20">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5">
          <Keyboard className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-semibold text-slate-300 tracking-wider">
            SlidePro 단축키 퀵 가이드 ({mode === "biz" ? "Biz 모드" : "Fun 모드"})
          </span>
          <span className="ml-auto text-[9px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-full font-mono uppercase animate-pulse">
            Active
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-2 py-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] text-slate-400">무중단 스마트 줌</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-violet-300 shadow">
              Ctrl + 휠 스크롤
            </kbd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] text-slate-400">모드 쾌속 토글</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-violet-300 shadow">
              Tab Key
            </kbd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] text-slate-400">판서 펜 On/Off</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-violet-300 shadow">
              ` (Backquote)
            </kbd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] text-slate-400">판서 전체 삭제</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-violet-300 shadow">
              Ctrl + Del
            </kbd>
          </div>

          {mode === "biz" ? (
            <>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] text-slate-400">스포트라이트</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-violet-300 shadow">
                  F5 Key
                </kbd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] text-slate-400">스마트 스냅</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-violet-300 shadow">
                  자동 보정 On
                </kbd>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] text-slate-400">종이가루 폭죽</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-pink-300 shadow">
                  F5 Key
                </kbd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] text-slate-400">스탬프 리워드</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-pink-300 shadow">
                  1 ~ 4 숫자키
                </kbd>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 border-t border-slate-800/40 pt-1.5 text-[9px] text-slate-500">
          <HelpCircle className="h-3 w-3" />
          <span>팁: 줌 상태에서 마우스 오른쪽 버튼을 누른 채 드래그하면 화면 이동(Pan)이 가능합니다.</span>
        </div>
      </div>
    </div>
  );
};
