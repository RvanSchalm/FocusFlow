import type { Label, Task } from "../db";

interface MatrixViewProps {
    tasks: Task[];
    labels: Label[];
    onTaskClick: (taskId: number) => void;
}

export function MatrixView({ tasks, labels, onTaskClick }: MatrixViewProps) {
    return (
        <div className="flex-1 p-6 h-full flex flex-col">
            <div className="flex-1 bg-zinc-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-zinc-800/50 relative overflow-hidden">
                {/* Quadrant Backgrounds & Large Labels */}
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
                    {/* Q1: Urgent & Important (Top Left) - Do */}
                    <div className="bg-red-500/5 relative flex items-center justify-center border-r border-b border-zinc-800/50">
                        <span className="text-8xl font-black text-red-500/10 uppercase select-none tracking-widest">Do</span>
                    </div>
                    {/* Q2: Not Urgent & Important (Top Right) - Plan */}
                    <div className="bg-yellow-500/5 relative flex items-center justify-center border-b border-zinc-800/50">
                        <span className="text-8xl font-black text-yellow-500/10 uppercase select-none tracking-widest">Plan</span>
                    </div>
                    {/* Q3: Urgent & Not Important (Bottom Left) - Delegate */}
                    <div className="bg-green-500/5 relative flex items-center justify-center border-r border-zinc-800/50">
                        <span className="text-8xl font-black text-green-500/10 uppercase select-none tracking-widest">Delegate</span>
                    </div>
                    {/* Q4: Not Urgent & Not Important (Bottom Right) - Delete */}
                    <div className="bg-blue-500/5 relative flex items-center justify-center">
                        <span className="text-8xl font-black text-blue-500/10 uppercase select-none tracking-widest">Delete</span>
                    </div>
                </div>

                {/* Axis Labels */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] bg-zinc-900/90 px-3 py-1 rounded-full border border-zinc-800 z-10 shadow-sm">
                    Important
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] bg-zinc-900/90 px-3 py-1 rounded-full border border-zinc-800 z-10 shadow-sm">
                    Not Important
                </div>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] bg-zinc-900/90 px-3 py-1 rounded-full border border-zinc-800 z-10 origin-center shadow-sm">
                    Urgent
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] bg-zinc-900/90 px-3 py-1 rounded-full border border-zinc-800 z-10 origin-center shadow-sm">
                    Not Urgent
                </div>

                {/* Grid Lines */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-px bg-zinc-800" /> {/* Horizontal Axis */}
                    <div className="h-full w-px bg-zinc-800 absolute" /> {/* Vertical Axis */}
                </div>

                {/* Tasks Scatter Plot */}
                <div className="absolute inset-16"> {/* Increased inset for larger dots */}
                    {tasks.map((task) => {
                        // Calculate Position
                        // X-Axis: Left (0%) = Urgent (10), Right (100%) = Not Urgent (0)
                        let x = ((10 - task.urgency) / 10) * 100;

                        // Y-Axis: Top (0%) = Important (10), Bottom (100%) = Not Important (0)
                        let y = ((10 - task.importance) / 10) * 100;

                        // Add deterministic jitter to prevent overlap
                        // Use task ID to generate a stable pseudo-random offset
                        // We use a simple sin-based hash to get "random-looking" numbers that are consistent for the same task ID
                        const seed = task.id;

                        // Random 1 (0-1)
                        const rand1 = Math.sin(seed * 12.9898) * 43758.5453;
                        const r1 = rand1 - Math.floor(rand1);

                        // Random 2 (0-1)
                        const rand2 = Math.sin(seed * 78.233) * 43758.5453;
                        const r2 = rand2 - Math.floor(rand2);

                        // Jitter magnitude between 0% and 4%
                        const minJitter = 0;
                        const maxJitter = 4;
                        const jitterMagnitude = minJitter + (r2 * (maxJitter - minJitter));

                        // Random direction
                        const angle = r1 * 2 * Math.PI;

                        x += Math.cos(angle) * jitterMagnitude;
                        y += Math.sin(angle) * jitterMagnitude;

                        // Clamp values to keep within bounds (0-100)
                        x = Math.max(0, Math.min(100, x));
                        y = Math.max(0, Math.min(100, y));

                        // Determine Color
                        const firstLabelId = task.labelIds?.[0];
                        const label = labels.find((l) => l.id === firstLabelId);
                        const color = label ? label.color : "#18181b"; // Default zinc-900

                        return (
                            <div
                                key={task.id}
                                onClick={() => onTaskClick(task.id)}
                                className="absolute w-8 h-8 rounded-full border-2 border-zinc-300 shadow-[0_0_15px_rgba(0,0,0,0.3)] cursor-pointer hover:scale-125 transition-all duration-300 group z-20 flex items-center justify-center"
                                style={{
                                    left: `${x}%`,
                                    top: `${y}%`,
                                    backgroundColor: color,
                                    transform: "translate(-50%, -50%)", // Center the dot on the coordinate
                                    boxShadow: `0 0 20px ${color}60` // Glow effect
                                }}
                                title={`${task.title} (U:${task.urgency}, I:${task.importance})`}
                            >
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-all duration-200 z-30 shadow-xl translate-y-2 group-hover:translate-y-0">
                                    {task.title}
                                    <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-800 border-r border-b border-zinc-700 rotate-45"></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
