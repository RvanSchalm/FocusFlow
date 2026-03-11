import { useState, useEffect } from "react";
import type { Task } from "../../domain/schema";
import { useStore } from "../../store/useStore";
import { RichTextEditor } from "../RichTextEditor";

interface TaskDescriptionProps {
    taskId: number;
}

export function TaskDescription({ taskId }: TaskDescriptionProps) {
    const task = useStore(state => state.tasks.find(t => t.id === taskId));
    const updateTask = useStore(state => state.updateTask);

    const [description, setDescription] = useState("");

    useEffect(() => {
        if (task) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDescription(task.description);
        }
    }, [task]);

    if (!task) return null;

    const handleSave = async (updates: Partial<Task>) => {
        try {
            updateTask(taskId, updates);
        } catch (error) {
            console.error("Failed to save task:", error);
        }
    };

    return (
        <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2 tracking-wider">Description</label>
            <div className="space-y-3">
                <RichTextEditor
                    value={description}
                    onChange={(val) => setDescription(val)}
                    placeholder="Add a more detailed description..."
                />

                {description !== task.description && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleSave({ description })}
                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => {
                                setDescription(task.description);
                            }}
                            className="px-4 py-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-sm font-medium rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
