import { useState, useRef, useEffect } from "react";
import type { Task } from "../../domain/schema";
import { useStore } from "../../store/useStore";

interface TaskHeaderProps {
    taskId: number;
}

export function TaskHeader({ taskId }: TaskHeaderProps) {
    const task = useStore(state => state.tasks.find(t => t.id === taskId));
    const labels = useStore(state => state.labels);
    const updateTask = useStore(state => state.updateTask);

    const [title, setTitle] = useState("");
    const [urgency, setUrgency] = useState(5);
    const [importance, setImportance] = useState(5);
    const [isLabelDropdownOpen, setIsLabelDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (task) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTitle(task.title);
            setUrgency(task.urgency);
            setImportance(task.importance);
        }
    }, [task]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsLabelDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!task) return null;

    const handleSave = async (updates: Partial<Task>) => {
        try {
            updateTask(taskId, updates);
        } catch (error) {
            console.error("Failed to save task:", error);
        }
    };

    const toggleLabel = async (labelId: number) => {
        const currentLabels = task.labelIds || [];
        const newLabels = currentLabels.includes(labelId)
            ? currentLabels.filter((id) => id !== labelId)
            : [...currentLabels, labelId];
        await handleSave({ labelIds: newLabels });
    };

    return (
        <div className="space-y-6">
            {/* Title */}
            <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 tracking-wider">Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => handleSave({ title })}
                    className="w-full text-2xl font-bold text-zinc-100 bg-transparent border-b-2 border-transparent focus:border-indigo-500 focus:outline-none pb-2 transition-colors placeholder-zinc-700"
                    placeholder="Task Title"
                />
            </div>

            {/* Labels */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Labels</label>
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsLabelDropdownOpen(!isLabelDropdownOpen)}
                            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                        >
                            + Add Label
                        </button>

                        {isLabelDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsLabelDropdownOpen(false)}
                                />
                                <div className="absolute right-0 mt-2 w-48 bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 z-20 py-1 max-h-60 overflow-y-auto">
                                    {labels?.map(label => (
                                        <button
                                            key={label.id}
                                            onClick={() => {
                                                toggleLabel(label.id!);
                                                setIsLabelDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 flex items-center gap-2"
                                        >
                                            <span
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: label.color }}
                                            />
                                            {label.name}
                                            {(task.labelIds || []).includes(label.id!) && (
                                                <span className="ml-auto text-indigo-400">✓</span>
                                            )}
                                        </button>
                                    ))}
                                    {labels?.length === 0 && (
                                        <div className="px-4 py-2 text-xs text-zinc-500 italic">No labels found</div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[32px]">
                    {labels?.filter(l => (task.labelIds || []).includes(l.id!)).map((label) => (
                        <button
                            key={label.id}
                            onClick={() => toggleLabel(label.id!)}
                            className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide transition-all hover:opacity-80 flex items-center gap-1.5"
                            style={{
                                backgroundColor: label.color + "20",
                                color: label.color,
                                border: `1px solid ${label.color}40`,
                            }}
                        >
                            {label.name}
                            <span className="opacity-50 hover:opacity-100">×</span>
                        </button>
                    ))}
                    {(task.labelIds || []).length === 0 && (
                        <span className="text-sm text-zinc-600 italic">No labels assigned.</span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
                {/* Urgency Slider */}
                <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-800">
                    <div className="flex justify-between mb-4">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Urgency</label>
                        <span className="text-sm font-bold text-indigo-400">{urgency}/10</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="10"
                        value={urgency}
                        onChange={(e) => setUrgency(parseInt(e.target.value, 10))}
                        onMouseUp={() => handleSave({ urgency })}
                        onTouchEnd={() => handleSave({ urgency })}
                        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 text-indigo-400"
                    />
                </div>

                {/* Importance Slider */}
                <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-800">
                    <div className="flex justify-between mb-4">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Importance</label>
                        <span className="text-sm font-bold text-purple-400">{importance}/10</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="10"
                        value={importance}
                        onChange={(e) => setImportance(parseInt(e.target.value, 10))}
                        onMouseUp={() => handleSave({ importance })}
                        onTouchEnd={() => handleSave({ importance })}
                        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500 text-purple-400"
                    />
                </div>
            </div>
        </div>
    );
}
