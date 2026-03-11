import { useState, useEffect } from "react";

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

    // Autosave effect with debounce
    useEffect(() => {
        if (!task || description === task.description) return;

        const timeoutId = setTimeout(() => {
            try {
                updateTask(taskId, { description });
            } catch (error) {
                console.error("Failed to autosave task description:", error);
            }
        }, 1000); // 1-second debounce

        return () => clearTimeout(timeoutId);
    }, [description, task, taskId, updateTask]);

    if (!task) return null;

    return (
        <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2 tracking-wider">Description</label>
            <div className="space-y-3 relative">
                <RichTextEditor
                    value={description}
                    onChange={(val) => setDescription(val)}
                    placeholder="Add a more detailed description..."
                />
                {description !== task.description && (
                    <div className="absolute top-2 right-2 text-xs font-medium text-zinc-500 bg-zinc-900/80 px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
                        Saving...
                    </div>
                )}
            </div>
        </div>
    );
}
