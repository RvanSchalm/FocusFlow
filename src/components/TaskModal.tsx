import { useStore } from "../store/useStore";
import { TaskHeader } from "./TaskModal/TaskHeader";
import { TaskDescription } from "./TaskModal/TaskDescription";
import { TaskChecklist } from "./TaskModal/TaskChecklist";
import { TaskAttachments } from "./TaskModal/TaskAttachments";

interface TaskModalProps {
    taskId: number;
}

export function TaskModal({ taskId }: TaskModalProps) {
    const task = useStore(state => state.tasks.find(t => t.id === taskId));

    if (!task) return null;

    return (
        <div className="space-y-6">
            <TaskHeader taskId={taskId} />
            <TaskDescription taskId={taskId} />
            <TaskChecklist taskId={taskId} />
            <TaskAttachments taskId={taskId} />
        </div>
    );
}
