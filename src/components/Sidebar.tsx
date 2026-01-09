import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { db } from "../db";
import { useConfirm } from "./ConfirmDialog";
import { LabelManager } from "./LabelManager";
import { Modal } from "./Modal";

export function Sidebar() {
    const boards = useLiveQuery(() => db.boards.toArray());
    const labels = useLiveQuery(() => db.labels.toArray());
    const navigate = useNavigate();
    const location = useLocation();
    const confirm = useConfirm();
    const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);

    const createBoard = async () => {
        try {
            const id = await db.boards.add({
                title: "New Board",
                createdAt: new Date(),
            });
            navigate(`/board/${id}`);
        } catch (error) {
            console.error("Failed to create board:", error);
        }
    };

    const deleteBoard = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        const confirmed = await confirm({
            title: "Delete Board",
            message: "Are you sure you want to delete this board and all its columns/tasks? This action cannot be undone.",
            confirmText: "Delete",
            variant: "danger",
        });
        if (confirmed) {
            try {
                await db.transaction("rw", db.boards, db.columns, db.tasks, async () => {
                    // Delete all tasks in this board
                    await db.tasks.where("boardId").equals(id).delete();
                    // Delete all columns in this board
                    await db.columns.where("boardId").equals(id).delete();
                    // Delete the board itself
                    await db.boards.delete(id);
                });
                if (location.pathname === `/board/${id}`) {
                    navigate("/");
                }
            } catch (error) {
                console.error("Failed to delete board:", error);
            }
        }
    };

    const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const confirmed = await confirm({
            title: "Import Data",
            message: "This will overwrite all existing data/boards. Are you sure you want to continue?",
            confirmText: "Import",
            variant: "warning",
        });
        if (!confirmed) {
            e.target.value = ""; // Reset input
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = event.target?.result as string;
                const data = JSON.parse(json);

                // Validate imported data structure
                if (typeof data !== 'object' || data === null) {
                    throw new Error('Invalid data format: expected an object');
                }

                // Validate arrays if they exist
                if (data.boards && !Array.isArray(data.boards)) {
                    throw new Error('Invalid data format: boards must be an array');
                }
                if (data.columns && !Array.isArray(data.columns)) {
                    throw new Error('Invalid data format: columns must be an array');
                }
                if (data.tasks && !Array.isArray(data.tasks)) {
                    throw new Error('Invalid data format: tasks must be an array');
                }
                if (data.labels && !Array.isArray(data.labels)) {
                    throw new Error('Invalid data format: labels must be an array');
                }

                // Convert Base64 attachments back to Blobs
                if (data.tasks) {
                    for (const task of data.tasks) {
                        if (task.attachments) {
                            for (const attachment of task.attachments) {
                                if (typeof attachment.data === 'string') {
                                    const response = await fetch(attachment.data);
                                    const blob = await response.blob();
                                    attachment.data = blob;
                                }
                            }
                        }
                    }
                }

                await db.transaction("rw", db.boards, db.columns, db.tasks, db.labels, async () => {
                    await db.boards.clear();
                    await db.columns.clear();
                    await db.tasks.clear();
                    await db.labels.clear();

                    if (data.boards?.length) await db.boards.bulkAdd(data.boards);
                    if (data.columns?.length) await db.columns.bulkAdd(data.columns);
                    if (data.labels?.length) await db.labels.bulkAdd(data.labels);
                    if (data.tasks?.length) await db.tasks.bulkAdd(data.tasks);
                });

                alert("Import successful!");
                window.location.reload();
            } catch (err) {
                console.error("Import failed:", err);
                alert("Failed to import data. Check console for details.");
            }
        };
        reader.readAsText(file);
        e.target.value = ""; // Reset input
    };

    const exportData = async () => {
        try {
            const allBoards = await db.boards.toArray();
            const allColumns = await db.columns.toArray();
            const allTasks = await db.tasks.toArray();
            const allLabels = await db.labels.toArray();

            // Process tasks to convert Blobs to Base64
            const tasksWithBase64 = await Promise.all(allTasks.map(async (task) => {
                const attachments = await Promise.all((task.attachments || []).map(async (attachment) => {
                    if (attachment.data instanceof Blob) {
                        return new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                resolve({
                                    ...attachment,
                                    data: reader.result // This is a Data URL (Base64)
                                });
                            };
                            reader.onerror = reject;
                            reader.readAsDataURL(attachment.data);
                        });
                    }
                    return attachment;
                }));
                return { ...task, attachments };
            }));

            const data = {
                boards: allBoards,
                columns: allColumns,
                labels: allLabels,
                tasks: tasksWithBase64,
                exportDate: new Date().toISOString(),
                version: 1
            };

            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `focusflow_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export failed:", err);
            alert("Export failed. Check console for details.");
        }
    };

    return (
        <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen shadow-xl z-20">
            <div className="p-6 border-b border-zinc-800/50">
                <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
                    FocusFlow
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-8">
                {/* Boards Section */}
                <div>
                    <div className="px-3 mb-2 flex items-center justify-between group">
                        <h2 className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Boards
                        </h2>
                        <button
                            onClick={createBoard}
                            className="text-zinc-500 hover:text-indigo-400 transition-colors p-1 rounded hover:bg-zinc-800"
                            title="Create Board"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                    <div className="space-y-1">
                        {boards?.map((board) => (
                            <div key={board.id} className="group relative">
                                <Link
                                    to={`/board/${board.id}`}
                                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${location.pathname === `/board/${board.id}`
                                        ? "bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700"
                                        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                                        }`}
                                >
                                    {board.title}
                                </Link>
                                {board.id !== undefined && (
                                    <button
                                        onClick={(e) => deleteBoard(e, board.id)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded hover:bg-zinc-700"
                                        title="Delete Board"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                                )}
                            </div>
                        ))}
                        {boards?.length === 0 && (
                            <div className="px-3 text-sm text-zinc-600 italic">No boards yet.</div>
                        )}
                    </div>
                </div>

                {/* Labels Section */}
                <div>
                    <div className="px-3 mb-2">
                        <h2 className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Labels
                        </h2>
                    </div>
                    <div className="space-y-1">
                        {labels?.map((label) => (
                            <div
                                key={label.id}
                                onClick={() => setIsLabelModalOpen(true)}
                                className="px-3 py-1.5 flex items-center gap-3 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 cursor-pointer transition-colors group"
                            >
                                <span
                                    className="w-2.5 h-2.5 rounded-full shadow-sm ring-1 ring-white/10"
                                    style={{ backgroundColor: label.color }}
                                />
                                <span className="truncate">{label.name}</span>
                            </div>
                        ))}
                        <button
                            onClick={() => setIsLabelModalOpen(true)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:bg-zinc-800 hover:text-indigo-400 transition-colors mt-2"
                        >
                            <span className="text-lg leading-none opacity-50">🏷️</span> Manage Labels
                        </button>
                    </div>
                </div>
            </div>

            {/* Data Management Footer */}
            <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/50 mt-auto">
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={exportData}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white rounded-lg text-sm font-medium transition-all"
                        title="Export Data"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export
                    </button>
                    <label className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white rounded-lg text-sm font-medium transition-all cursor-pointer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12V4m0 0l-4 4m4-4l4 4" />
                        </svg>
                        Import
                        <input type="file" onChange={importData} accept=".json" className="hidden" />
                    </label>
                </div>
            </div>

            <Modal
                isOpen={isLabelModalOpen}
                onClose={() => setIsLabelModalOpen(false)}
                title="Manage Labels"
            >
                <LabelManager />
            </Modal>
        </div>
    );
}
