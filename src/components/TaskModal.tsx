import { useLiveQuery } from "dexie-react-hooks";
import { useState, useEffect, useRef } from "react";
import { db } from "../db";
import type { Task } from "../db";
import { useConfirm } from "./ConfirmDialog";
import { RichTextEditor } from "./RichTextEditor";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

import { Modal } from "./Modal";

interface TaskModalProps {
    taskId: number;
}

export function TaskModal({ taskId }: TaskModalProps) {
    const task = useLiveQuery(() => db.tasks.get(taskId), [taskId]);
    const labels = useLiveQuery(() => db.labels.toArray());
    const confirm = useConfirm();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [urgency, setUrgency] = useState(5);
    const [importance, setImportance] = useState(5);
    const [newChecklistItem, setNewChecklistItem] = useState("");
    const [isLabelDropdownOpen, setIsLabelDropdownOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description);
            setUrgency(task.urgency);
            setImportance(task.importance);
        }
    }, [task]);

    // Cleanup previewImage Blob URL when it changes or component unmounts
    useEffect(() => {
        return () => {
            if (previewImage) {
                URL.revokeObjectURL(previewImage);
            }
        };
    }, [previewImage]);

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
            await db.tasks.update(taskId, updates);
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

            {/* Labels (Moved Here) */}
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

            {/* Description */}
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
                                    // Also force reset the editor logic if needed, but the useEffect in editor handles prop updates
                                }}
                                className="px-4 py-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-sm font-medium rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Checklist */}
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

            {/* Documents */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Documents</label>
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={async (e) => {
                            if (!e.target.files || e.target.files.length === 0) return;
                            const file = e.target.files[0];

                            const newAttachment = {
                                id: crypto.randomUUID(),
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                uploadedAt: new Date(),
                                data: new Blob([file], { type: file.type })
                            };

                            const newAttachments = [...(task.attachments || []), newAttachment];
                            await handleSave({ attachments: newAttachments });
                            e.target.value = ''; // Reset input
                        }}
                    />
                    <label
                        htmlFor="file-upload"
                        className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                        + Upload File
                    </label>
                </div>

                <div className="space-y-2">
                    {(task.attachments || []).map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors group">
                            <div
                                className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer"
                                onClick={() => {
                                    const blob = attachment.data;
                                    const url = URL.createObjectURL(blob);

                                    if (attachment.type.startsWith('image/')) {
                                        // Revoke previous preview URL if exists
                                        if (previewImage) {
                                            URL.revokeObjectURL(previewImage);
                                        }
                                        setPreviewImage(url);
                                    } else if (attachment.type === 'application/pdf') {
                                        window.open(url, '_blank');
                                        // Revoke after a delay to allow the new tab to load the PDF
                                        setTimeout(() => URL.revokeObjectURL(url), 60000);
                                    } else {
                                        // Default download behavior
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = attachment.name;
                                        a.click();
                                        URL.revokeObjectURL(url);
                                    }
                                }}
                            >
                                <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-zinc-500 flex-shrink-0">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-medium text-zinc-200 truncate group-hover:text-indigo-400 transition-colors">
                                        {attachment.name}
                                    </h4>
                                    <p className="text-xs text-zinc-500">
                                        {new Date(attachment.uploadedAt).toLocaleString()} • {Math.round(attachment.size / 1024)} KB
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const url = URL.createObjectURL(attachment.data);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = attachment.name;
                                        a.click();
                                        URL.revokeObjectURL(url);
                                    }}
                                    className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 rounded transition-colors"
                                    title="Download"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                </button>

                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        const confirmed = await confirm({
                                            title: "Delete Attachment",
                                            message: `Are you sure you want to delete "${attachment.name}"?`,
                                            confirmText: "Delete",
                                            variant: "danger",
                                        });
                                        if (confirmed) {
                                            const newAttachments = (task.attachments || []).filter(a => a.id !== attachment.id);
                                            await handleSave({ attachments: newAttachments });
                                        }
                                    }}
                                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                                    title="Delete"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                    {(task.attachments || []).length === 0 && (
                        <div className="text-center py-6 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-600 text-sm">
                            No documents attached
                        </div>
                    )}
                </div>
            </div>

            {/* Image Preview Modal */}
            <Modal
                isOpen={!!previewImage}
                onClose={() => setPreviewImage(null)}
                className="max-w-5xl bg-zinc-950/90 border-none shadow-none"
            >
                <div className="flex items-center justify-center min-h-[50vh]">
                    {previewImage && (
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    )}
                </div>
            </Modal>
        </div>
    );
}
