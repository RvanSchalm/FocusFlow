import { useState, useEffect } from "react";
import type { Task } from "../../domain/schema";
import { useStore } from "../../store/useStore";
import { useConfirm } from "../ConfirmDialog";
import { Modal } from "../Modal";

interface TaskAttachmentsProps {
    taskId: number;
}

export function TaskAttachments({ taskId }: TaskAttachmentsProps) {
    const task = useStore(state => state.tasks.find(t => t.id === taskId));
    const updateTask = useStore(state => state.updateTask);
    const confirm = useConfirm();

    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Cleanup previewImage Blob URL when it changes or component unmounts
    useEffect(() => {
        return () => {
            if (previewImage) {
                URL.revokeObjectURL(previewImage);
            }
        };
    }, [previewImage]);

    if (!task) return null;

    const handleSave = async (updates: Partial<Task>) => {
        try {
            updateTask(taskId, updates);
        } catch (error) {
            console.error("Failed to save task attachments:", error);
        }
    };

    return (
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

                        // Convert file to Base64
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                            const newAttachment = {
                                id: crypto.randomUUID(),
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                uploadedAt: new Date().toISOString(),
                                data: reader.result as string // Base64 data URL
                            };

                            const newAttachments = [...(task.attachments || []), newAttachment];
                            await handleSave({ attachments: newAttachments });
                        };
                        reader.readAsDataURL(file);
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
                                // attachment.data is now a Base64 data URL string
                                const url = attachment.data;

                                if (attachment.type.startsWith('image/')) {
                                    // Revoke previous preview URL if exists
                                    if (previewImage) {
                                        URL.revokeObjectURL(previewImage);
                                    }
                                    setPreviewImage(url);
                                } else if (attachment.type === 'application/pdf') {
                                    window.open(url, '_blank');
                                } else {
                                    // Default download behavior - data is already a data URL
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = attachment.name;
                                    a.click();
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
                                    // attachment.data is a Base64 data URL
                                    const a = document.createElement('a');
                                    a.href = attachment.data;
                                    a.download = attachment.name;
                                    a.click();
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
