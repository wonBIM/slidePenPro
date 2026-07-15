import React, { useRef, useState, useEffect } from "react";
import { Monitor, VideoOff, RefreshCw } from "lucide-react";

interface ScreenSharePresenterProps {
  zoomLevel: number;
  zoomOffset: { x: number; y: number };
  onStreamStatusChange: (isActive: boolean) => void;
  onCancel?: () => void;
}

export const ScreenSharePresenter: React.FC<ScreenSharePresenterProps> = ({
  zoomLevel,
  zoomOffset,
  onStreamStatusChange,
  onCancel
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startScreenShare = async () => {
    setLoading(true);
    setError(null);

    try {
      // Prompt user to select window (specifically Powerpoint presentation window)
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 60 } // high framerate for smooth video/animations
        },
        audio: false
      });

      setStream(mediaStream);
      onStreamStatusChange(true);

      // Track if user clicks native browser "Stop Sharing" button
      mediaStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err: any) {
      console.error("Screen sharing initialization failed:", err);
      setError(`화면 공유 실패: [${err.name}] ${err.message || err}`);
      onStreamStatusChange(false);
    } finally {
      setLoading(false);
    }
  };

  const stopScreenShare = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    onStreamStatusChange(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Bind media stream to video element once it is mounted in the DOM
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    console.log("[ScreenSharePresenter] Binding stream to video element via useEffect");
    video.srcObject = stream;
    video.play().catch((playErr) => {
      console.error("[ScreenSharePresenter] Failed to play video stream inside useEffect:", playErr);
    });

    return () => {
      if (video) {
        video.srcObject = null;
      }
    };
  }, [stream]);

  // Heartbeat check & Cleanup on unmount
  useEffect(() => {
    if (!stream) return;

    // WebView2 onended event bypass safeguard:
    // Periodically check if the screenshare track has been closed/ended by OS/browser
    const interval = setInterval(() => {
      const track = stream.getVideoTracks()[0];
      if (!track || track.readyState === "ended" || !track.enabled) {
        console.log("[ScreenSharePresenter] Detected ended track via heartbeat. Cleaning up...");
        stopScreenShare();
      }
    }, 1200);

    return () => {
      clearInterval(interval);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="relative h-full w-full bg-slate-950 flex items-center justify-center overflow-hidden">
      
      {/* 1. Inactive State: Share Prompt */}
      {!stream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-4 bg-slate-950/40 z-20">
          <div className="h-16 w-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/5">
            <Monitor className="h-8 w-8 text-indigo-400 animate-pulse" />
          </div>
          
          <div className="max-w-md space-y-2">
            <h2 className="text-base font-bold text-slate-200">파워포인트 화면을 공유해 주세요</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              아래 버튼을 누른 후, 공유 대상으로 <strong className="text-indigo-400">"전체 화면" (또는 모니터 화면)</strong>을 선택해 주세요.
            </p>
            <p className="text-[11px] text-slate-500 leading-normal max-w-sm">
              * 특정 '창'을 선택할 경우 PPT의 하드웨어 가속으로 인해 검은 화면으로 나올 수 있습니다. <br />
              * <strong>검은 화면 해결:</strong> 전체 화면으로 공유하시거나, PPT 옵션 ➔ 고급 ➔ 표시 ➔ '슬라이드 쇼 하드웨어 그래픽 가속 비활성화'를 체크해 주세요.
            </p>
          </div>

          <button
            onClick={startScreenShare}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>공유 설정 중...</span>
              </>
            ) : (
              <>
                <Monitor className="h-4 w-4" />
                <span>PPT 슬라이드 화면 공유 시작</span>
              </>
            )}
          </button>

          {onCancel && (
            <button
              onClick={onCancel}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold active:scale-95 transition-all cursor-pointer"
            >
              이전으로 돌아가기 (취소)
            </button>
          )}

          {error && (
            <div className="mt-2 text-xs text-rose-400 font-medium">
              {error}
            </div>
          )}
        </div>
      )}

      {/* 2. Active State: Real-time Video Stream with Matrix Zoom */}
      {stream && (
        <div className="absolute inset-0 h-full w-full overflow-hidden">
          <div
            className="absolute inset-0 flex items-center justify-center select-none pointer-events-none"
            style={{
              transform: `translate(${zoomOffset.x}px, ${zoomOffset.y}px) scale(${zoomLevel})`,
              transformOrigin: "0 0",
              transition: "transform 0.05s ease-out"
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="max-w-full max-h-full object-contain pointer-events-none select-none bg-slate-950"
            />
          </div>

          {/* Quick stop overlay trigger on hover or corner */}
          <button
            onClick={stopScreenShare}
            className="absolute top-14 right-4 z-30 p-2 bg-rose-950/65 border border-rose-900/40 rounded-lg text-rose-400 hover:bg-rose-900/80 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg"
            title="화면 공유 중지"
          >
            <VideoOff className="h-3.5 w-3.5" />
            <span>공유 중지</span>
          </button>
        </div>
      )}
    </div>
  );
};
