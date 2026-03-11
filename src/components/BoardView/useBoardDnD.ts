import type { DropResult } from "@hello-pangea/dnd";
import { useStore } from "../../store/useStore";

export function useBoardDnD(boardId: number) {
    const columns = useStore(state => state.columns.filter(c => c.boardId === boardId).sort((a, b) => a.order - b.order));
    const tasks = useStore(state => state.tasks.filter(t => t.boardId === boardId));
    const bulkUpdateColumns = useStore(state => state.bulkUpdateColumns);
    const bulkUpdateTasks = useStore(state => state.bulkUpdateTasks);

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
                await bulkUpdateColumns(
                    newColumns.map((col, index) => ({
                        id: col.id,
                        changes: { order: index }
                    }))
                );
                return;
            }

            // Task Reordering
            const taskId = parseInt(draggableId.replace("task-", ""), 10);
            const sourceColId = parseInt(source.droppableId.replace("col-", ""), 10);
            const destColId = parseInt(destination.droppableId.replace("col-", ""), 10);

            const sourceTasks = (tasks?.filter((t) => t.columnId === sourceColId) || []).sort((a, b) => a.order - b.order);
            const destTasks =
                sourceColId === destColId
                    ? sourceTasks
                    : (tasks?.filter((t) => t.columnId === destColId) || []).sort((a, b) => a.order - b.order);

            if (sourceColId === destColId) {
                // Reordering within same column
                const newTasks = Array.from(sourceTasks);
                const [removed] = newTasks.splice(source.index, 1);
                newTasks.splice(destination.index, 0, removed);

                await bulkUpdateTasks(
                    newTasks.map((t, index) => ({
                        id: t.id,
                        changes: { order: index }
                    }))
                );
            } else {
                // Moving to different column
                const newSourceTasks = Array.from(sourceTasks);
                newSourceTasks.splice(source.index, 1);

                const newDestTasks = Array.from(destTasks);
                const taskToMove = tasks?.find((t) => t.id === taskId);
                if (taskToMove) {
                    newDestTasks.splice(destination.index, 0, { ...taskToMove, columnId: destColId });
                }

                // Update source column orders
                const sourceUpdates = newSourceTasks.map((t, index) => ({
                    id: t.id,
                    changes: { order: index }
                }));

                // Update dest column orders and move task
                const destUpdates = newDestTasks.map((t, index) => ({
                    id: t.id,
                    changes: { columnId: destColId, order: index }
                }));

                await bulkUpdateTasks([...sourceUpdates, ...destUpdates]);
            }
        } catch (error) {
            console.error("Failed to reorder:", error);
        }
    };

    return { onDragEnd };
}
