import { useState } from "react";
import type { Task } from "../../domain/schema";
import { useStore } from "../../store/useStore";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

interface TaskChecklistProps {
    taskId: number;
}

export function TaskChecklist({ taskId }: TaskChecklistProps) {
    const task = useStore(state => state.tasks.find(t => t.id === taskId));
    const updateTask = useStore(state => state.updateTask);

    const [newChecklistItem, setNewChecklistItem] = useState("");

    if (!task) return null;

    const handleSave = async (updates: Partial<Task>) => {
        try {
            updateTask(taskId, updates);
        } catch (error) {
            console.error("Failed to save task checklist:", error);
        }
    };

    const addChecklistItem = async () => {
        if (!newChecklistItem.trim()) return;
        const newItem = {
            id: crypto.randomUUID(),
            text: newChecklistItem.trim(),
            done: false,
        };
        const newChecklist = [...(task.checklist || []), newItem];
        await handleSave({ checklist: newChecklist });
        setNewChecklistItem("");
    };

    const toggleChecklistItem = async (itemId: string) => {
        const newChecklist = (task.checklist || []).map((item) =>
            item.id === itemId ? { ...item, done: !item.done } : item
        );
        await handleSave({ checklist: newChecklist });
    };

    const updateChecklistItem = async (itemId: string, text: string) => {
        const newChecklist = (task.checklist || []).map((item) =>
            item.id === itemId ? { ...item, text } : item
        );
        await handleSave({ checklist: newChecklist });
    };

    const deleteChecklistItem = async (itemId: string) => {
        const newChecklist = (task.checklist || []).filter((item) => item.id !== itemId);
        await handleSave({ checklist: newChecklist });
    };

    const onChecklistDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const newChecklist = Array.from(task.checklist || []);
        const [reorderedItem] = newChecklist.splice(result.source.index, 1);
        newChecklist.splice(result.destination.index, 0, reorderedItem);

        await handleSave({ checklist: newChecklist });
    };

    return (
        <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-3 tracking-wider">Checklist</label>

            {/* Progress Bar */}
            {(task.checklist || []).length > 0 && (
                <div className="w-full bg-zinc-700 rounded-full h-2 mb-4">
                    <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{
                            width: `${Math.round(
                                ((task.checklist || []).filter((i) => i.done).length /
                                    (task.checklist || []).length) *
                                100
                            ) || 0
                                }%`,
                        }}
                    />
                </div>
            )}

            <div className="space-y-3 mb-4">
                <DragDropContext onDragEnd={onChecklistDragEnd}>
                    <Droppable droppableId="checklist">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="space-y-3"
                            >
                                {(task.checklist || []).map((item, index) => (
                                    <Draggable key={item.id} draggableId={item.id} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className="flex items-start gap-3 group"
                                            >
                                                <div
                                                    {...provided.dragHandleProps}
                                                    className="mt-1 text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 18l-4 4-4-4M16 6L12 2 8 6M5 10h14M5 14h14" />
                                                    </svg>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={item.done}
                                                    onChange={() => toggleChecklistItem(item.id)}
                                                    className="mt-1 w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500/50 focus:ring-offset-0 cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={item.text}
                                                    onChange={(e) => updateChecklistItem(item.id, e.target.value)}
                                                    className={`flex-1 bg-transparent border-none p-0 text-sm focus:ring-0 ${item.done ? "text-zinc-500 line-through" : "text-zinc-200"
                                                        }`}
                                                />
                                                <button
                                                    onClick={() => deleteChecklistItem(item.id)}
                                                    className="text-zinc-600 hover:text-red-400 transition-colors"
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addChecklistItem()}
                    placeholder="Add an item..."
                    className="flex-1 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none placeholder-zinc-700 transition-colors"
                />
                <button
                    onClick={addChecklistItem}
                    className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-700 hover:text-white transition-colors border border-zinc-700"
                >
                    Add
                </button>
            </div>
        </div>
    );
}
