import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useStore } from "../store/useStore";
import { Column } from "./Column";
import { MatrixView } from "./MatrixView";
import { Modal } from "./Modal";
import { TaskModal } from "./TaskModal";
import { useBoardDnD } from "./BoardView/useBoardDnD";
import { BoardHeader } from "./BoardView/BoardHeader";

export function BoardView() {
    const { boardId } = useParams();
    const id = parseInt(boardId || "0", 10);

    const board = useStore(state => state.boards.find(b => b.id === id));

    // Grab all entities and filter locally to avoid re-render loops with inline filter()
    const allColumns = useStore(state => state.columns);
    const columns = allColumns.filter(c => c.boardId === id).sort((a, b) => a.order - b.order);

    const allTasks = useStore(state => state.tasks);
    const rawTasks = allTasks.filter(t => t.boardId === id);

    const labels = useStore(state => state.labels);

    const updateBoard = useStore(state => state.updateBoard);
    const addColumnToDb = useStore(state => state.addColumn);

    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<"kanban" | "matrix">("kanban");
    const [selectedColumnIds, setSelectedColumnIds] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const columnsInitialized = useRef(false);

    // Apply search filter locally
    const tasks = rawTasks.filter(t => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            t.title.toLowerCase().includes(q) ||
            (t.description || "").toLowerCase().includes(q)
        );
    });

    const { onDragEnd } = useBoardDnD(columns, rawTasks); // Pass rawTasks to DnD so drag reordering uses actual db orders 

    // Initialize selected columns when columns load (select all by default)
    useEffect(() => {
        if (columns && columns.length > 0 && !columnsInitialized.current) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedColumnIds(columns.map(c => c.id));
            columnsInitialized.current = true;
        }
    }, [columns]);

    // Reset initialization flag when board changes
    useEffect(() => {
        columnsInitialized.current = false;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedColumnIds([]);
    }, [id]);

    const handleUpdateTitle = async (newTitle: string) => {
        await updateBoard(id, { title: newTitle });
    };

    const addColumn = async () => {
        try {
            const order = columns ? columns.length : 0;
            await addColumnToDb({
                boardId: id,
                title: "New Column",
                order,
            });
        } catch (error) {
            console.error("Failed to add column:", error);
        }
    };

    // Show loading state while data is being fetched
    if (!board || columns === undefined || tasks === undefined) {
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
            <BoardHeader
                board={board}
                columns={columns}
                selectedColumnIds={selectedColumnIds}
                setSelectedColumnIds={setSelectedColumnIds}
                viewMode={viewMode}
                setViewMode={setViewMode}
                onUpdateTitle={handleUpdateTitle}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />

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
                                            tasks={(tasks?.filter((t) => t.columnId === column.id) || []).sort((a, b) => a.order - b.order)}
                                            index={index}
                                            onTaskClick={setSelectedTaskId}
                                            isDragDisabled={!!searchQuery.trim()}
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
