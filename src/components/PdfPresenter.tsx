import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Set CDN worker source to bypass Vite worker bundling issues safely
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

interface PdfPresenterProps {
  pdfFileUrl: string | null; // Object URL of the uploaded PDF file
  currentPage: number;
  onDocumentLoaded: (numPages: number) => void;
  zoomLevel: number;
  zoomOffset: { x: number; y: number };
}

export const PdfPresenter: React.FC<PdfPresenterProps> = ({
  pdfFileUrl,
  currentPage,
  onDocumentLoaded,
  zoomLevel,
  zoomOffset
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const renderTaskRef = useRef<any>(null);

  // 1. Load PDF Document when file URL changes
  useEffect(() => {
    if (!pdfFileUrl) {
      setPdfDoc(null);
      return;
    }

    setLoading(true);
    setError(null);

    const loadingTask = pdfjsLib.getDocument(pdfFileUrl);
    loadingTask.promise
      .then((pdf) => {
        setPdfDoc(pdf);
        onDocumentLoaded(pdf.numPages);
        setLoading(false);
      })
      .catch((err) => {
        console.error("PDF loading error:", err);
        setError("PDF 문서를 불러오는 데 실패했습니다. 파일 형식을 확인해 주세요.");
        setLoading(false);
      });

    return () => {
      loadingTask.destroy();
    };
  }, [pdfFileUrl]);

  // 2. Render Page when page number or PDF document changes
  useEffect(() => {
    if (!pdfDoc) return;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Cancel previous render task if active
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        // Get viewport size. Scale 2.0 for high definition (Retina/UHD support)
        const dpr = window.devicePixelRatio || 1;
        const baseScale = 1.5;
        const viewport = page.getViewport({ scale: baseScale * dpr });

        // Set backing store dimensions
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Style dimensions (responsive bounding box fit)
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.objectFit = "contain";

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        renderTaskRef.current = null;
      } catch (err: any) {
        if (err.name !== "RenderingCancelledException") {
          console.error("PDF page render error:", err);
        }
      }
    };

    renderPage();
  }, [pdfDoc, currentPage]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full bg-slate-950 overflow-hidden"
    >
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-20 gap-3 text-slate-300">
          <div className="h-8 w-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-xs font-semibold tracking-wider">PDF 슬라이드 해석 중...</span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-rose-400 bg-slate-950/90 z-20 gap-2">
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {!pdfFileUrl && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-4 bg-slate-950/40">
          <div className="h-16 w-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg shadow-black/20">
            <svg className="h-8 w-8 text-indigo-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="max-w-md">
            <p className="text-sm font-bold text-slate-300 mb-1">발표용 PDF 파일을 여기에 드래그 앤 드롭해 주세요</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              파워포인트(PPT)에서 <strong className="text-indigo-400">PDF로 저장</strong>하신 후 파일을 통째로 끌어다 놓으시면, 회사 보안망 리스크 없이 초고화질 슬라이드 쇼 및 판서가 활성화됩니다.
            </p>
          </div>
        </div>
      )}

      {pdfFileUrl && (
        <div
          className="absolute inset-0 flex items-center justify-center select-none pointer-events-none"
          style={{
            transform: `translate(${zoomOffset.x}px, ${zoomOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: "0 0",
            transition: "transform 0.05s ease-out"
          }}
        >
          <canvas ref={canvasRef} className="max-w-full max-h-full object-contain shadow-2xl border border-slate-900 bg-white" />
        </div>
      )}
    </div>
  );
};
