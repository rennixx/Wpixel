"use client";

import { useState } from "react";
import { Sparkles, X, Wand2, Loader2 } from "lucide-react";
import type { EnhanceStyle } from "@/lib/types/drawing";

interface AIEnhanceButtonProps {
  originalImage: Blob;
  onEnhanced: (enhancedBlob: Blob) => void;
  onSkip: () => void;
  onClose: () => void;
}

const enhanceStyles: EnhanceStyle[] = [
  {
    id: "neon",
    name: "Neon Glow",
    prompt: "vibrant neon colors with glowing edges",
    icon: "✨",
  },
  {
    id: "oil",
    name: "Oil Painting",
    prompt: "thick brushstrokes, impressionist style",
    icon: "🎨",
  },
  {
    id: "pixel",
    name: "Pixel Art",
    prompt: "8-bit retro pixel art style",
    icon: "👾",
  },
  {
    id: "sketch",
    name: "Sketch",
    prompt: "pencil sketch with shading",
    icon: "✏️",
  },
];

export function AIEnhanceButton({
  originalImage,
  onEnhanced,
  onSkip,
  onClose,
}: AIEnhanceButtonProps) {
  const [selectedStyle, setSelectedStyle] = useState<EnhanceStyle | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedPreview, setEnhancedPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remainingUses, setRemainingUses] = useState(getRemainingUses());

  // Get original image as data URL for preview
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  if (!originalPreview) {
    const reader = new FileReader();
    reader.onload = () => setOriginalPreview(reader.result as string);
    reader.readAsDataURL(originalImage);
  }

  const handleEnhance = async () => {
    if (!selectedStyle && !customPrompt) {
      setError("Please select a style or enter a custom prompt");
      return;
    }

    if (remainingUses <= 0) {
      setError("Daily enhancement limit reached. Try again tomorrow!");
      return;
    }

    setIsEnhancing(true);
    setError(null);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(originalImage);
      });

      const response = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          style: customPrompt || selectedStyle?.prompt,
        }),
      });

      const data = await response.json();

      if (data.success && data.enhancedImage) {
        setEnhancedPreview(data.enhancedImage);
        decrementRemainingUses();
        setRemainingUses(getRemainingUses());
      } else {
        setError(data.error || "Enhancement failed. Please try again.");
      }
    } catch (err) {
      setError("Failed to connect to AI service. Using original image.");
      console.error("Enhancement error:", err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAcceptEnhanced = async () => {
    if (enhancedPreview) {
      // Convert base64 to blob
      const response = await fetch(enhancedPreview);
      const blob = await response.blob();
      onEnhanced(blob);
    }
  };

  const handleRevert = () => {
    setEnhancedPreview(null);
    setSelectedStyle(null);
    setCustomPrompt("");
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 animate-fade-in">
      <div className="relative glass rounded-2xl p-6 max-w-2xl w-full mx-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-purple-500/20">
            <Wand2 className="text-purple-400" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Enhancement</h2>
            <p className="text-sm text-white/60">
              Transform your drawing with AI ({remainingUses} uses remaining today)
            </p>
          </div>
        </div>

        {/* Preview area */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Original */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm text-white/60">Original</span>
            <div className="w-full aspect-square bg-white/5 rounded-xl overflow-hidden">
              {originalPreview && (
                <img
                  src={originalPreview}
                  alt="Original drawing"
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </div>

          {/* Enhanced */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm text-white/60">Enhanced</span>
            <div className="w-full aspect-square bg-white/5 rounded-xl overflow-hidden flex items-center justify-center">
              {isEnhancing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin text-purple-400" size={32} />
                  <span className="text-sm text-white/60">Enhancing...</span>
                </div>
              ) : enhancedPreview ? (
                <img
                  src={enhancedPreview}
                  alt="Enhanced drawing"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-white/30 text-sm">Select a style</span>
              )}
            </div>
          </div>
        </div>

        {/* Style selection */}
        {!enhancedPreview && (
          <>
            <div className="mb-4">
              <label className="text-sm text-white/60 mb-2 block">Choose a style:</label>
              <div className="grid grid-cols-4 gap-2">
                {enhanceStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => {
                      setSelectedStyle(style);
                      setCustomPrompt("");
                    }}
                    className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      selectedStyle?.id === style.id
                        ? "bg-purple-500/30 neon-glow"
                        : "bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <span className="text-2xl">{style.icon}</span>
                    <span className="text-xs">{style.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom prompt */}
            <div className="mb-4">
              <label className="text-sm text-white/60 mb-2 block">Or custom style:</label>
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => {
                  setCustomPrompt(e.target.value);
                  setSelectedStyle(null);
                }}
                placeholder="e.g., watercolor, cyberpunk, anime..."
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 focus:border-purple-400 outline-none"
              />
            </div>
          </>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {enhancedPreview ? (
            <>
              <button
                onClick={handleRevert}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 btn-hover"
              >
                Try Another Style
              </button>
              <button
                onClick={handleAcceptEnhanced}
                className="flex-1 py-3 rounded-xl bg-purple-500/30 hover:bg-purple-500/50 btn-hover flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                Use Enhanced
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onSkip}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 btn-hover"
              >
                Skip Enhancement
              </button>
              <button
                onClick={handleEnhance}
                disabled={isEnhancing || (!selectedStyle && !customPrompt)}
                className="flex-1 py-3 rounded-xl bg-purple-500/30 hover:bg-purple-500/50 btn-hover flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEnhancing ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Wand2 size={18} />
                )}
                Enhance
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions for usage limits
function getRemainingUses(): number {
  if (typeof window === "undefined") return 3;
  
  const stored = localStorage.getItem("planetcanvas_ai_uses");
  if (!stored) return 3;

  const { date, count } = JSON.parse(stored);
  const today = new Date().toDateString();

  if (date !== today) {
    // Reset for new day
    localStorage.setItem(
      "planetcanvas_ai_uses",
      JSON.stringify({ date: today, count: 0 })
    );
    return 3;
  }

  return Math.max(0, 3 - count);
}

function decrementRemainingUses(): void {
  if (typeof window === "undefined") return;
  
  const today = new Date().toDateString();
  const stored = localStorage.getItem("planetcanvas_ai_uses");
  
  let count = 0;
  if (stored) {
    const data = JSON.parse(stored);
    if (data.date === today) {
      count = data.count;
    }
  }

  localStorage.setItem(
    "planetcanvas_ai_uses",
    JSON.stringify({ date: today, count: count + 1 })
  );
}
