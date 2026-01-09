import React, { useEffect, useState } from "react";

interface ColorPickerProps {
    color: string;
    onChange: (color: string) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
    const [hex, setHex] = useState(color);

    // Initialize internal state from props
    useEffect(() => {
        setHex(color);
    }, [color]);

    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setHex(val);
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
            onChange(val);
        }
    };

    const PRESET_COLORS = [
        "#EF4444", // Red
        "#F97316", // Orange
        "#F59E0B", // Amber
        "#84CC16", // Lime
        "#10B981", // Emerald
        "#06B6D4", // Cyan
        "#3B82F6", // Blue
        "#6366F1", // Indigo
        "#8B5CF6", // Violet
        "#EC4899", // Pink
        "#64748B", // Slate
        "#71717A", // Zinc
    ];

    return (
        <div className="space-y-4">
            {/* Color Wheel / Palette */}
            <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((presetColor) => (
                    <button
                        key={presetColor}
                        onClick={() => onChange(presetColor)}
                        className={`w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-indigo-500 ${color === presetColor ? "ring-2 ring-offset-2 ring-offset-zinc-900 ring-white scale-110" : ""
                            }`}
                        style={{ backgroundColor: presetColor }}
                        title={presetColor}
                    />
                ))}
            </div>

            {/* Custom Input */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <div
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-zinc-600"
                        style={{ backgroundColor: color }}
                    />
                    <input
                        type="text"
                        value={hex}
                        onChange={handleHexChange}
                        className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm font-mono text-zinc-300 focus:border-indigo-500 focus:outline-none uppercase"
                        placeholder="#000000"
                    />
                </div>
                <input
                    type="color"
                    value={color}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                />
            </div>
        </div>
    );
}
