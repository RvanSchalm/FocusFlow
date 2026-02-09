import { Draggable } from "@hello-pangea/dnd";
import type { Task } from "../services/dataService";
import { getLabels, deleteTask } from "../services/dataService";
import { useData } from "../services/useData";

interface TaskCardProps {
    task: Task;
    index: number;
    onClick: () => void;
}

export function TaskCard({ task, index, onClick }: TaskCardProps) {
    const labels = useData(() => getLabels(), []);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await deleteTask(task.id);
        } catch (error) {
            console.error("Failed to delete task:", error);
        }
    };

    const handleCardClick = () => {
        onClick();
    };

    const taskLabels = labels?.filter((l) => (task.labelIds || []).includes(l.id!)) || [];

    return (
        <Draggable draggableId={task.id.toString()} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="mb-3" // Add margin bottom here for spacing between cards
                    style={provided.draggableProps.style} // Important: Pass styles here
                >
                    <div
                        onClick={handleCardClick}
                        className={`group relative bg-zinc-800 p-4 rounded-lg shadow-sm border border-zinc-700/50 hover:border-indigo-500/50 hover:shadow-md transition-all cursor-pointer ${snapshot.isDragging ? "shadow-xl ring-2 ring-indigo-500 rotate-2" : ""
                            }`}
                    >
                        {/* Labels */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {taskLabels?.map((label) => (
                                <span
                                    key={label.id}
                                    className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shadow-sm"
                                    style={{
                                        backgroundColor: label.color + "20", // 20% opacity
                                        color: label.color,
                                        border: `1px solid ${label.color}40`,
                                    }}
                                >
                                    {label.name}
                                </span>
                            ))}
                        </div>

                        <h4 className="text-sm font-medium text-zinc-200 leading-snug break-words pr-6">
                            {task.title}
                        </h4>

                        {/* Footer Info */}
                        {(task.checklist?.length > 0 || (task.attachments?.length || 0) > 0) && (
                            <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
                                {task.checklist?.length > 0 && (
                                    <div className="flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                        </svg>
                                        <span>
                                            {task.checklist.filter((i) => i.done).length}/{task.checklist.length}
                                        </span>
                                    </div>
                                )}
                                {(task.attachments?.length || 0) > 0 && (
                                    <div className="flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                        <span>{task.attachments.length}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={handleDelete}
                            className="absolute top-3 right-3 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-zinc-700/50 rounded"
                            title="Delete Task"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </Draggable>
    );
}
