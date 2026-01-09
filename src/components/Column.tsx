import { Draggable, Droppable } from "@hello-pangea/dnd";
import { useState } from "react";
import { db } from "../db";
import type { Column as ColumnType, Task } from "../db";
import { TaskCard } from "./TaskCard";

interface ColumnProps {
    column: ColumnType;
    tasks: Task[];
    index: number;
    onTaskClick: (taskId: number) => void;
}

export function Column({ column, tasks, index, onTaskClick }: ColumnProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState(column.title);

    const handleTitleSave = async () => {
        if (title.trim() !== column.title) {
            await db.columns.update(column.id, { title });
        }
        setIsEditingTitle(false);
    };

    const addTask = async () => {
        const order = tasks.length;
        await db.tasks.add({
            boardId: column.boardId,
            columnId: column.id,
            title: "New Task",
            description: "",
            urgency: 0,
            importance: 0,
            labelIds: [],
            checklist: [],
            comments: [],
            attachments: [],
            order,
        });
    };

    const deleteColumn = async (id: number) => {
        if (confirm("Delete this column and all its tasks?")) {
            await db.transaction("rw", db.columns, db.tasks, async () => {
                await db.columns.delete(id);
                await db.tasks.where("columnId").equals(id).delete();
            });
        }
    };

    return (
        <Draggable draggableId={column.id.toString()} index={index}>
            {(provided) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="w-80 flex-shrink-0 rounded-xl flex flex-col max-h-full relative group/column"
                >
                    {/* Background Layer (Fixes backdrop-filter containing block issue) */}
                    <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl -z-10" />

                    <div
                        {...provided.dragHandleProps}
                        className="p-4 flex items-center justify-between group border-b border-zinc-800/50"
                    >
                        {isEditingTitle ? (
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleTitleSave}
                                onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
                                className="font-bold text-zinc-100 bg-transparent border-b border-indigo-500 outline-none w-full"
                                autoFocus
                            />
                        ) : (
                            <h3
                                onClick={() => setIsEditingTitle(true)}
                                className="font-bold text-zinc-100 cursor-pointer hover:text-indigo-400 transition-colors"
                            >
                                {column.title}
                            </h3>
                        )}
                        <button
                            onClick={() => deleteColumn(column.id)}
                            className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-zinc-800 rounded"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>

                    <Droppable droppableId={column.id.toString()} type="task">
                        {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`flex-1 overflow-y-auto p-3 space-y-3 min-h-[100px] transition-colors ${snapshot.isDraggingOver ? "bg-zinc-800/30" : ""
                                    }`}
                            >
                                {tasks.map((task, index) => (
                                    <TaskCard key={task.id} task={task} index={index} onClick={() => onTaskClick(task.id)} />
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>

                    <div className="p-3 border-t border-zinc-800/50">
                        <button
                            onClick={addTask}
                            className="w-full py-2 px-3 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 group"
                        >
                            <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                                +
                            </span>
                            Add Task
                        </button>
                    </div>
                </div>
            )}
        </Draggable>
    );
}
