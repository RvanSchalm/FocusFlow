import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { db } from "../db";
import type { Label } from "../db";
import { ColorPicker } from "./ColorPicker";

export function LabelManager() {
    const labels = useLiveQuery(() => db.labels.toArray());

    // State for form
    const [name, setName] = useState("");
    const [color, setColor] = useState("#3B82F6");
    const [editingId, setEditingId] = useState<number | null>(null);

    const handleSubmit = async () => {
        if (!name.trim()) return;

        try {
            if (editingId) {
                await db.labels.update(editingId, { name: name.trim(), color });
                setEditingId(null);
            } else {
                await db.labels.add({ name: name.trim(), color });
            }
            setName("");
            setColor("#3B82F6");
        } catch (error) {
            console.error("Failed to save label:", error);
        }
    };

    const startEditing = (label: Label) => {
        setEditingId(label.id);
        setName(label.name);
        setColor(label.color);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setName("");
        setColor("#3B82F6");
    };

    const deleteLabel = async (id: number) => {
        if (confirm("Delete this label?")) {
            try {
                await db.labels.delete(id);
                if (editingId === id) {
                    cancelEditing();
                }
            } catch (error) {
                console.error("Failed to delete label:", error);
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Form (Create or Edit) */}
            <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                        {editingId ? "Edit Label" : "Create New Label"}
                    </h3>
                    {editingId && (
                        <button
                            onClick={cancelEditing}
                            className="text-xs text-zinc-500 hover:text-zinc-300 underline"
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Label Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Urgent, Design, Marketing"
                            className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 focus:border-indigo-500 focus:outline-none placeholder-zinc-600 transition-colors"
                            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-2">Color</label>
                        <ColorPicker color={color} onChange={setColor} />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleSubmit}
                            disabled={!name.trim()}
                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                        >
                            {editingId ? "Update Label" : "Create Label"}
                        </button>
                        {editingId && (
                            <button
                                onClick={cancelEditing}
                                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Existing Labels */}
            <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Existing Labels</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {labels?.map((label) => (
                        <div
                            key={label.id}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all group ${editingId === label.id
                                    ? "bg-indigo-500/10 border-indigo-500/50"
                                    : "bg-zinc-800/30 border-zinc-800 hover:border-zinc-700"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-4 h-4 rounded-full shadow-sm ring-1 ring-white/10"
                                    style={{ backgroundColor: label.color }}
                                />
                                <span className={`font-medium ${editingId === label.id ? "text-indigo-200" : "text-zinc-300"}`}>
                                    {label.name}
                                </span>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => startEditing(label)}
                                    className="p-1.5 text-zinc-500 hover:text-indigo-400 hover:bg-zinc-800 rounded transition-colors"
                                    title="Edit"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => deleteLabel(label.id!)}
                                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                                    title="Delete"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                    {labels?.length === 0 && (
                        <div className="text-center py-8 text-zinc-600 italic">
                            No labels created yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
