import React, { useRef, useState, useEffect } from "react";
import { Monitor, VideoOff, RefreshCw } from "lucide-react";

interface ScreenSharePresenterProps {
  zoomLevel: number;
  zoomOffset: { x: number; y: number };
  onStreamStatusChange: (isActive: boolean) => void;
}

export const ScreenSharePresenter: React.FC<ScreenSharePresenterProps> = ({
  zoomLevel,
  zoomOffset,
  onStreamStatusChange
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

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Track if user clicks native browser "Stop Sharing" button
      mediaStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err: any) {
      console.error("Screen sharing initialization failed:", err);
      if (err.name !== "NotAllowedError") {
        setError("화면 공유를 시작할 수 없습니다. 권한 설정을 확인하세요.");
      }
      onStreamStatusChange(false);
    } finally {
      setLoading(false);
    }
  };

  const stopScreenShare = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      onStreamStatusChange(false);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
              아래 버튼을 눌러 발표할 <strong className="text-indigo-400">파워포인트 슬라이드 쇼 창</strong>을 선택해 주시면, 회사 보안망 차단 제약 없이 동영상과 애니메이션이 100% 정상 작동하는 실시간 캔버스가 활성화됩니다.
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
