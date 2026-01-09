import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { useLiveQuery } from "dexie-react-hooks";
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { db } from "../db";
import { Column } from "./Column";
import { MatrixView } from "./MatrixView";
import { Modal } from "./Modal";
import { TaskModal } from "./TaskModal";

export function BoardView() {
    const { boardId } = useParams();
    const id = parseInt(boardId || "0", 10);

    const board = useLiveQuery(() => db.boards.get(id), [id]);
    const columns = useLiveQuery(
        () => db.columns.where("boardId").equals(id).sortBy("order"),
        [id]
    );
    const tasks = useLiveQuery(
        () => db.tasks.where("boardId").equals(id).sortBy("order"),
        [id]
    );
    const labels = useLiveQuery(() => db.labels.toArray());

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState("");
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<"kanban" | "matrix">("kanban");
    const [selectedColumnIds, setSelectedColumnIds] = useState<number[]>([]);
    const [isColumnFilterOpen, setIsColumnFilterOpen] = useState(false);
    const columnsInitialized = useRef(false);
    const columnFilterRef = useRef<HTMLDivElement>(null);

    // Close column filter dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (columnFilterRef.current && !columnFilterRef.current.contains(event.target as Node)) {
                setIsColumnFilterOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Initialize title when board loads
    useEffect(() => {
        if (board && !isEditingTitle) {
            setTitle(board.title);
        }
    }, [board, isEditingTitle]);

    // Initialize selected columns when columns load (select all by default)
    useEffect(() => {
        if (columns && columns.length > 0 && !columnsInitialized.current) {
            setSelectedColumnIds(columns.map(c => c.id));
            columnsInitialized.current = true;
        }
    }, [columns]);

    // Reset initialization flag when board changes
    useEffect(() => {
        columnsInitialized.current = false;
        setSelectedColumnIds([]);
    }, [id]);

    const handleTitleSave = async () => {
        try {
            const newTitle = title.trim() || "New Board";
            if (newTitle !== board?.title) {
                await db.boards.update(id, { title: newTitle });
            }
            setTitle(newTitle);
        } catch (error) {
            console.error("Failed to save board title:", error);
        }
        setIsEditingTitle(false);
    };

    const addColumn = async () => {
        try {
            const order = columns ? columns.length : 0;
            await db.columns.add({
                boardId: id,
                title: "New Column",
                order,
            });
        } catch (error) {
            console.error("Failed to add column:", error);
        }
    };

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId, type } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        try {
            // Column Reordering
            if (type === "column") {
                const newColumns = Array.from(columns || []);
                const [removed] = newColumns.splice(source.index, 1);
                newColumns.splice(destination.index, 0, removed);

                // Update order in DB atomically
                await db.transaction("rw", db.columns, async () => {
                    await Promise.all(
                        newColumns.map((col, index) =>
                            db.columns.update(col.id, { order: index })
                        )
                    );
                });
                return;
            }

            // Task Reordering
            const taskId = parseInt(draggableId, 10);
            const sourceColId = parseInt(source.droppableId, 10);
            const destColId = parseInt(destination.droppableId, 10);

            const sourceTasks = tasks?.filter((t) => t.columnId === sourceColId) || [];
            const destTasks =
                sourceColId === destColId
                    ? sourceTasks
                    : tasks?.filter((t) => t.columnId === destColId) || [];

            if (sourceColId === destColId) {
                // Reordering within same column
                const newTasks = Array.from(sourceTasks);
                const [removed] = newTasks.splice(source.index, 1);
                newTasks.splice(destination.index, 0, removed);

                await db.transaction("rw", db.tasks, async () => {
                    await Promise.all(
                        newTasks.map((t, index) => db.tasks.update(t.id, { order: index }))
                    );
                });
            } else {
                // Moving to different column
                const newSourceTasks = Array.from(sourceTasks);
                newSourceTasks.splice(source.index, 1);

                const newDestTasks = Array.from(destTasks);
                const taskToMove = tasks?.find((t) => t.id === taskId);
                if (taskToMove) {
                    newDestTasks.splice(destination.index, 0, { ...taskToMove, columnId: destColId });
                }

                await db.transaction("rw", db.tasks, async () => {
                    // Update source column orders
                    await Promise.all(
                        newSourceTasks.map((t, index) => db.tasks.update(t.id, { order: index }))
                    );
                    // Update dest column orders and move task
                    await Promise.all(
                        newDestTasks.map((t, index) =>
                            db.tasks.update(t.id, { columnId: destColId, order: index })
                        )
                    );
                });
            }
        } catch (error) {
            console.error("Failed to reorder:", error);
        }
    };

    // Show loading state while data is being fetched
    if (board === undefined || columns === undefined || tasks === undefined) {
        return (
            <div className="flex-1 flex items-center justify-center h-screen bg-zinc-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-400 text-sm">Loading board...</p>
                </div>
            </div>
        );
    }

    // Board not found (invalid ID)
    if (board === null) {
        return (
            <div className="flex-1 flex items-center justify-center h-screen bg-zinc-950">
                <div className="flex flex-col items-center gap-4">
                    <h1 className="text-2xl font-bold text-zinc-400">Board not found</h1>
                    <p className="text-zinc-500">This board may have been deleted.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-screen bg-zinc-950 overflow-hidden relative">
            {/* Background Gradient Mesh (Subtle) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px]" />
            </div>

            {/* Header */}
            <div className="h-16 border-b border-zinc-800/50 bg-zinc-900/80 backdrop-blur-md flex items-center justify-between px-6 flex-shrink-0 z-20">
                <div className="flex items-center flex-1">
                    {isEditingTitle ? (
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
                            className="text-2xl font-bold text-zinc-100 bg-transparent border-b-2 border-indigo-500 outline-none placeholder-zinc-600"
                            autoFocus
                        />
                    ) : (
                        <h2
                            onClick={() => {
                                setTitle(board.title);
                                setIsEditingTitle(true);
                            }}
                            className="text-2xl font-bold text-zinc-100 cursor-pointer hover:bg-zinc-800/50 px-2 rounded transition-colors"
                        >
                            {board.title}
                        </h2>
                    )}
                </div>

                {/* Column Filter - Center (only visible in Matrix view) */}
                <div className="flex-1 flex justify-center">
                    {viewMode === "matrix" && (
                        <div className="relative" ref={columnFilterRef}>
                            <button
                                onClick={() => setIsColumnFilterOpen(!isColumnFilterOpen)}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                Columns
                                <span className="px-1.5 py-0.5 bg-zinc-900 rounded text-xs text-zinc-400">
                                    {selectedColumnIds.length}/{columns.length}
                                </span>
                                <svg className={`w-4 h-4 transition-transform ${isColumnFilterOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {isColumnFilterOpen && (
                                <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-zinc-900 rounded-xl shadow-xl border border-zinc-800 z-50 py-2 overflow-hidden">
                                    {/* Select/Deselect All */}
                                    <div className="px-3 pb-2 mb-2 border-b border-zinc-800 flex gap-2">
                                        <button
                                            onClick={() => setSelectedColumnIds(columns.map(c => c.id))}
                                            disabled={columns.length > 0 && selectedColumnIds.length === columns.length}
                                            className="flex-1 px-2 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Select All
                                        </button>
                                        <button
                                            onClick={() => setSelectedColumnIds([])}
                                            disabled={selectedColumnIds.length === 0}
                                            className="flex-1 px-2 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Deselect All
                                        </button>
                                    </div>

                                    {/* Column List */}
                                    <div className="max-h-60 overflow-y-auto">
                                        {columns.map(column => (
                                            <button
                                                key={column.id}
                                                onClick={() => {
                                                    if (selectedColumnIds.includes(column.id)) {
                                                        setSelectedColumnIds(selectedColumnIds.filter(id => id !== column.id));
                                                    } else {
                                                        setSelectedColumnIds([...selectedColumnIds, column.id]);
                                                    }
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                                    selectedColumnIds.includes(column.id)
                                                        ? "bg-indigo-500 border-indigo-500"
                                                        : "border-zinc-600 bg-transparent"
                                                }`}>
                                                    {selectedColumnIds.includes(column.id) && (
                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <span className="truncate">{column.title}</span>
                                            </button>
                                        ))}
                                        {columns.length === 0 && (
                                            <div className="px-3 py-2 text-sm text-zinc-500 italic">No columns</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* View Toggle - Right */}
                <div className="flex-1 flex justify-end">
                    <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                        <button
                            onClick={() => setViewMode("kanban")}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "kanban"
                                ? "bg-zinc-800 text-zinc-100 shadow-sm ring-1 ring-zinc-700"
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                                }`}
                        >
                            Kanban View
                        </button>
                        <button
                            onClick={() => setViewMode("matrix")}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "matrix"
                                ? "bg-zinc-800 text-zinc-100 shadow-sm ring-1 ring-zinc-700"
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                                }`}
                        >
                            Matrix View
                        </button>
                    </div>
                </div>
            </div>

            {/* Board Content */}
            {viewMode === "kanban" ? (
                <div className="flex-1 overflow-x-auto px-6 pb-6 pt-6 z-10">
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="all-columns" direction="horizontal" type="column">
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="flex h-full items-start space-x-6"
                                >
                                    {columns?.map((column, index) => (
                                        <Column
                                            key={column.id}
                                            column={column}
                                            tasks={tasks?.filter((t) => t.columnId === column.id) || []}
                                            index={index}
                                            onTaskClick={setSelectedTaskId}
                                        />
                                    ))}
                                    {provided.placeholder}

                                    <button
                                        onClick={addColumn}
                                        className="w-80 flex-shrink-0 h-14 rounded-xl border-2 border-dashed border-zinc-800 text-zinc-500 hover:border-indigo-500/50 hover:text-indigo-400 hover:bg-zinc-900/50 flex items-center justify-center font-medium transition-all duration-200"
                                    >
                                        + Add Column
                                    </button>
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>
            ) : (
                <div className="flex-1 h-full">
                    <MatrixView
                        tasks={(tasks || []).filter(t => selectedColumnIds.includes(t.columnId))}
                        labels={labels || []}
                        onTaskClick={setSelectedTaskId}
                    />
                </div>
            )}

            <Modal
                isOpen={!!selectedTaskId}
                onClose={() => setSelectedTaskId(null)}
            >
                {selectedTaskId && (
                    <TaskModal taskId={selectedTaskId} />
                )}
            </Modal>
        </div>
    );
}
