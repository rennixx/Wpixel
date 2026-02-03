'use client'

/**
 * DrawingTools - Drawing tools interface component
 * Provides tool selection, color picker, and brush size controls
 */

import type { DrawingState } from '@/types/drawing'

interface DrawingToolsProps {
  currentTool: DrawingState['tool']
  currentColor: string
  brushSize: number
  onToolChange: (tool: DrawingState['tool']) => void
  onColorChange: (color: string) => void
  onBrushSizeChange: (size: number) => void
  onClear: () => void
  disabled?: boolean
}

export default function DrawingTools({
  currentTool,
  currentColor,
  brushSize,
  onToolChange,
  onColorChange,
  onBrushSizeChange,
  onClear,
  disabled = false,
}: DrawingToolsProps) {
  const tools: Array<{
    id: DrawingState['tool']
    icon: string
    label: string
    description: string
  }> = [
    { id: 'pencil', icon: '✏️', label: 'Pencil', description: 'Thin precise lines' },
    { id: 'brush', icon: '🖌️', label: 'Brush', description: 'Thicker artistic strokes' },
    { id: 'eraser', icon: '🧹', label: 'Eraser', description: 'Remove mistakes' },
  ]

  const colors = [
    { value: '#000000', label: 'Black' },
    { value: '#FFFFFF', label: 'White' },
    { value: '#FF0000', label: 'Red' },
    { value: '#00FF00', label: 'Green' },
    { value: '#0000FF', label: 'Blue' },
    { value: '#FFFF00', label: 'Yellow' },
    { value: '#FF00FF', label: 'Magenta' },
    { value: '#00FFFF', label: 'Cyan' },
  ]

  return (
    <div
      className={`glass rounded-xl p-4 space-y-4 ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {/* Tool Selection */}
      <div className="space-y-2">
        <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
          Tools
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${
                currentTool === tool.id
                  ? 'bg-neon-cyan text-black neon-glow'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              title={tool.description}
            >
              <span className="text-2xl">{tool.icon}</span>
              <span className="text-xs font-medium">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color Picker */}
      <div className="space-y-2">
        <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
          Color
        </h3>
        <div className="space-y-2">
          {/* Current color display with picker */}
          <div className="flex items-center gap-2">
            <div className="relative w-full">
              <input
                type="color"
                value={currentColor}
                onChange={(e) => onColorChange(e.target.value)}
                className="w-full h-10 rounded-lg cursor-pointer border-2 border-gray-600"
              />
            </div>
            <div
              className="w-10 h-10 rounded-lg border-2 border-gray-600"
              style={{ backgroundColor: currentColor }}
            />
          </div>

          {/* Color presets */}
          <div className="grid grid-cols-4 gap-1">
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => onColorChange(color.value)}
                className="w-full aspect-square rounded border-2 border-gray-600 hover:scale-110 hover:border-neon-cyan transition-all"
                style={{ backgroundColor: color.value }}
                title={color.label}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Brush Size */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
            Brush Size
          </h3>
          <span className="text-neon-cyan font-bold">{brushSize}px</span>
        </div>
        <input
          type="range"
          min="1"
          max="50"
          value={brushSize}
          onChange={(e) => onBrushSizeChange(Number(e.target.value))}
          className="w-full accent-neon-cyan"
        />
        {/* Brush preview */}
        <div className="flex items-center justify-center h-12 bg-gray-800 rounded-lg">
          <div
            className="rounded-full"
            style={{
              width: `${Math.min(brushSize, 48)}px`,
              height: `${Math.min(brushSize, 48)}px`,
              backgroundColor: currentTool === 'eraser' ? '#ffffff' : currentColor,
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2 border-t border-gray-700">
        <button
          onClick={onClear}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>🗑️</span>
          <span>Clear Canvas</span>
        </button>
      </div>
    </div>
  )
}
