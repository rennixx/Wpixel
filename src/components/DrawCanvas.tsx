"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Brush, Eraser, Trash2, X, Check, Palette } from "lucide-react";
import type { Region, DrawingTool } from "@/lib/types/drawing";

interface DrawCanvasProps {
  isVisible: boolean;
  region: Region;
  onComplete: (imageBlob: Blob) => void;
  onCancel: () => void;
}

export function DrawCanvas({ isVisible, region, onComplete, onCancel }: DrawCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<DrawingTool>({
    type: "brush",
    size: 10,
    color: "#00f0ff",
  });
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size (1024x1024 as specified)
    canvas.width = 1024;
    canvas.height = 1024;

    // Fill with white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Configure context
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  // Update tool settings
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = tool.type === "eraser" ? "#ffffff" : tool.color;
    ctx.lineWidth = tool.size;
  }, [tool]);

  // Drawing functions
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const point = getPointerPosition(e, canvasRef.current!);
    setLastPoint(point);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPoint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentPoint = getPointerPosition(e, canvas);

    // Draw smooth line using quadratic curves
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);

    // Calculate control point for smooth curve
    const midX = (lastPoint.x + currentPoint.x) / 2;
    const midY = (lastPoint.y + currentPoint.y) / 2;

    ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midX, midY);
    ctx.stroke();

    setLastPoint(currentPoint);
  }, [isDrawing, lastPoint]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    setLastPoint(null);
  }, []);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setShowClearConfirm(false);
  }, []);

  // Export canvas as blob
  const handleComplete = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        onComplete(blob);
      }
    }, "image/png");
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0" onClick={onCancel} />

      {/* Canvas container */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* Coordinates display */}
        <div className="glass rounded-lg px-4 py-2 text-sm text-white/80">
          <span className="text-neon-blue">📍</span> Drawing at {region.lat.toFixed(2)}°, {region.long.toFixed(2)}°
        </div>

        {/* Canvas */}
        <div className="relative rounded-lg overflow-hidden neon-glow">
          <canvas
            ref={canvasRef}
            className="canvas-grid cursor-crosshair"
            style={{ width: 512, height: 512 }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        {/* Toolbar */}
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          {/* Tool selection */}
          <div className="flex gap-2">
            <button
              onClick={() => setTool({ ...tool, type: "brush" })}
              className={`p-3 rounded-lg btn-hover ${
                tool.type === "brush" ? "bg-neon-blue/30 neon-glow" : "bg-white/10"
              }`}
              aria-label="Brush tool"
            >
              <Brush size={20} />
            </button>
            <button
              onClick={() => setTool({ ...tool, type: "eraser" })}
              className={`p-3 rounded-lg btn-hover ${
                tool.type === "eraser" ? "bg-neon-blue/30 neon-glow" : "bg-white/10"
              }`}
              aria-label="Eraser tool"
            >
              <Eraser size={20} />
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-white/20" />

          {/* Color picker */}
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-white/60" />
            <input
              type="color"
              value={tool.color}
              onChange={(e) => setTool({ ...tool, color: e.target.value })}
              className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white/20"
              aria-label="Color picker"
            />
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-white/20" />

          {/* Brush size */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/60">Size:</span>
            <input
              type="range"
              min="2"
              max="50"
              value={tool.size}
              onChange={(e) => setTool({ ...tool, size: parseInt(e.target.value) })}
              className="w-24 accent-neon-blue"
              aria-label="Brush size"
            />
            <span className="text-sm text-white/60 w-8">{tool.size}px</span>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-white/20" />

          {/* Clear button */}
          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="p-3 rounded-lg bg-red-500/20 hover:bg-red-500/40 btn-hover"
              aria-label="Clear canvas"
            >
              <Trash2 size={20} className="text-red-400" />
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={clearCanvas}
                className="p-2 rounded-lg bg-red-500/40 hover:bg-red-500/60"
                aria-label="Confirm clear"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
                aria-label="Cancel clear"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 btn-hover flex items-center gap-2"
          >
            <X size={20} />
            Cancel
          </button>
          <button
            onClick={handleComplete}
            className="px-6 py-3 rounded-xl bg-neon-blue/30 hover:bg-neon-blue/50 neon-glow btn-hover flex items-center gap-2"
          >
            <Check size={20} />
            Stamp to Globe
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to get pointer position
function getPointerPosition(
  e: React.MouseEvent | React.TouchEvent,
  canvas: HTMLCanvasElement
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  let clientX: number, clientY: number;

  if ("touches" in e) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}
