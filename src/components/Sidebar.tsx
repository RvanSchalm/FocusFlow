import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import {
    exportAllData,
    importAllData
} from "../services/dataService";
import { useStore } from "../store/useStore";
import { useConfirm } from "./ConfirmDialog";
import { LabelManager } from "./LabelManager";
import { Modal } from "./Modal";
import { toast } from "sonner";

export function Sidebar() {
    const boards = useStore(state => state.boards);
    const labels = useStore(state => state.labels);
    const isSaving = useStore(state => state.isSaving);
    const addBoard = useStore(state => state.addBoard);
    const deleteBoardFromDb = useStore(state => state.deleteBoard);
    const bulkUpdateBoards = useStore(state => state.bulkUpdateBoards);
    const bulkUpdateLabels = useStore(state => state.bulkUpdateLabels);
    const initialize = useStore(state => state.initialize);
    const restoreBoard = useStore(state => state.restoreBoard);
    const navigate = useNavigate();
    const location = useLocation();
    const confirm = useConfirm(); // Still needed for import Data
    const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);

    const sortedBoards = [...(boards || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
    const sortedLabels = [...(labels || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

    const createBoard = async () => {
        try {
            const id = await addBoard({
                title: "New Board",
                createdAt: new Date(),
                order: sortedBoards.length
            });
            navigate(`/board/${id}`);
        } catch (error) {
            console.error("Failed to create board:", error);
        }
    };

    const deleteBoard = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();

        const state = useStore.getState();
        const boardToRestore = state.boards.find(b => b.id === id);
        const columnsToRestore = state.columns.filter(c => c.boardId === id);
        const tasksToRestore = state.tasks.filter(t => t.boardId === id);

        if (!boardToRestore) return;

        try {
            await deleteBoardFromDb(id);
            if (location.pathname === `/board/${id}`) {
                navigate("/");
            }
            toast("Board deleted", {
                action: {
                    label: "Undo",
                    onClick: () => {
                        restoreBoard(boardToRestore, columnsToRestore, tasksToRestore);
                        // Don't auto-navigate back, it's safer
                    }
                }
            });
        } catch (error) {
            console.error("Failed to delete board:", error);
        }
    };

    const onBoardDragEnd = async (result: DropResult) => {
        if (!result.destination) return;
        const newBoards = Array.from(sortedBoards);
        const [removed] = newBoards.splice(result.source.index, 1);
        newBoards.splice(result.destination.index, 0, removed);
        await bulkUpdateBoards(newBoards.map((b, index) => ({ id: b.id, changes: { order: index } })));
    };

    const onLabelDragEnd = async (result: DropResult) => {
        if (!result.destination) return;
        const newLabels = Array.from(sortedLabels);
        const [removed] = newLabels.splice(result.source.index, 1);
        newLabels.splice(result.destination.index, 0, removed);
        await bulkUpdateLabels(newLabels.map((l, index) => ({ id: l.id!, changes: { order: index } })));
    };

    const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = event.target?.result as string;
                const data = JSON.parse(json);

                if (typeof data !== 'object' || data === null) {
                    throw new Error('Invalid data format: expected an object');
                }

                const boardsCount = data.boards?.length || 0;
                const tasksCount = data.tasks?.length || 0;
                const labelsCount = data.labels?.length || 0;

                const confirmed = await confirm({
                    title: "Import Preview",
                    message: `Found ${boardsCount} boards, ${tasksCount} tasks, and ${labelsCount} labels in this file. This will overwrite existing data. Continue?`,
                    confirmText: "Import",
                    variant: "warning",
                });

                if (!confirmed) {
                    e.target.value = "";
                    return;
                }

                const result = await importAllData(data);

                if (result.success) {
                    alert("Import successful!");
                    await initialize(); // Reload Zustand state
                } else {
                    throw new Error(result.error || 'Import failed');
                }
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
            const exportedData = await exportAllData();

            const json = JSON.stringify(exportedData, null, 2);
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
            <div className="p-6 border-b border-zinc-800/50 flex items-center justify-between">
                <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
                    FocusFlow
                </h1>
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500">
                    {isSaving ? (
                        <>
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>Saving</span>
                        </>
                    ) : (
                        <>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Saved</span>
                        </>
                    )}
                </div>
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
                    <DragDropContext onDragEnd={onBoardDragEnd}>
                        <Droppable droppableId="sidebar-boards" type="board">
                            {(provided) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1 min-h-[50px]">
                                    {sortedBoards.map((board, index) => (
                                        <Draggable key={board.id} draggableId={`board-${board.id}`} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={`group relative flex items-center gap-1 ${snapshot.isDragging ? "z-50 cursor-grabbing" : ""}`}
                                                    style={provided.draggableProps.style}
                                                >
                                                    <div className="flex-1 relative cursor-pointer">
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
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                    {sortedBoards.length === 0 && (
                                        <div className="px-3 text-sm text-zinc-600 italic">No boards yet.</div>
                                    )}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>

                {/* Labels Section */}
                <div>
                    <div className="px-3 mb-2">
                        <h2 className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Labels
                        </h2>
                    </div>
                    <DragDropContext onDragEnd={onLabelDragEnd}>
                        <Droppable droppableId="sidebar-labels" type="label">
                            {(provided) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1 min-h-[30px]">
                                    {sortedLabels.map((label, index) => (
                                        <Draggable key={label.id} draggableId={`label-${label.id}`} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={`group relative flex items-center gap-1 ${snapshot.isDragging ? "z-50 cursor-grabbing" : ""}`}
                                                    style={provided.draggableProps.style}
                                                >
                                                    <div
                                                        onClick={() => setIsLabelModalOpen(true)}
                                                        className="flex-1 px-3 py-1.5 flex items-center gap-3 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 cursor-pointer transition-colors"
                                                    >
                                                        <span
                                                            className="w-2.5 h-2.5 rounded-full shadow-sm ring-1 ring-white/10"
                                                            style={{ backgroundColor: label.color }}
                                                        />
                                                        <span className="truncate">{label.name}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                    <button
                                        onClick={() => setIsLabelModalOpen(true)}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:bg-zinc-800 hover:text-indigo-400 transition-colors mt-2"
                                    >
                                        <span className="text-lg leading-none opacity-50">🏷️</span> Manage Labels
                                    </button>
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
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
