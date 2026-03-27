import { useRef, useState, useEffect, useCallback } from "react";

interface SignaturePadProps {
  onSignatureChange: (data: string | null) => void;
}

export const SignaturePad = ({ onSignatureChange }: SignaturePadProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = "#0D7377";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
    return ctx;
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setHasSignature(true);
    const data = canvasRef.current?.toDataURL("image/png") || null;
    onSignatureChange(data);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSignatureChange(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Set internal resolution
    canvas.width = 1000;
    canvas.height = 240;
  }, []);

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="text-sm font-bold text-foreground mb-1">Provider Signature</h3>
      <p className="text-[11px] text-muted-foreground mb-3">
        Draw with mouse, trackpad, or touchscreen. Sign once — applied to all approved addendums.
      </p>
      <div className="bg-white rounded-xl overflow-hidden mb-3 border border-border">
        <canvas
          ref={canvasRef}
          className="w-full h-[120px] cursor-crosshair touch-none"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <button
        onClick={clear}
        className="px-4 py-1.5 bg-surface-2 hover:bg-surface-3 text-muted-foreground text-[10px] font-bold rounded-lg transition-all"
      >
        Clear
      </button>
    </div>
  );
};
