import { create } from 'zustand';
import type { Board, Column, Task, Label, FocusFlowSettings } from '../domain/schema';
import { initializeData, getSettings, saveDataDebounced, saveSettingsDebounced } from '../services/dataService';

export interface AppState {
    boards: Board[];
    columns: Column[];
    tasks: Task[];
    labels: Label[];
    settings: FocusFlowSettings;
    isLoading: boolean;
    error: string | null;

    initialize: () => Promise<void>;

    // Boards
    addBoard: (board: Omit<Board, 'id'>) => Promise<number>;
    updateBoard: (id: number, updates: Partial<Board>) => void;
    deleteBoard: (id: number) => void;
    bulkUpdateBoards: (updates: { id: number; changes: Partial<Board> }[]) => void;
    restoreBoard: (board: Board, columns: Column[], tasks: Task[]) => void;

    // Columns
    addColumn: (column: Omit<Column, 'id'>) => Promise<number>;
    updateColumn: (id: number, updates: Partial<Column>) => void;
    deleteColumn: (id: number) => void;
    bulkUpdateColumns: (updates: { id: number; changes: Partial<Column> }[]) => void;
    restoreColumn: (column: Column, tasks: Task[]) => void;

    // Tasks
    addTask: (task: Omit<Task, 'id'>) => Promise<number>;
    updateTask: (id: number, updates: Partial<Task>) => void;
    deleteTask: (id: number) => void;
    bulkUpdateTasks: (updates: { id: number; changes: Partial<Task> }[]) => void;
    restoreTask: (task: Task) => void;

    // Labels
    addLabel: (label: Omit<Label, 'id'>) => Promise<number>;
    updateLabel: (id: number, updates: Partial<Label>) => void;
    deleteLabel: (id: number) => void;
    bulkUpdateLabels: (updates: { id: number; changes: Partial<Label> }[]) => void;
    restoreLabel: (label: Label, affectedTasks: Task[]) => void;

    // Settings
    updateSettings: (updates: Partial<FocusFlowSettings>) => void;
}

const getNextId = (items: { id: number }[]): number => {
    if (items.length === 0) return 1;
    return Math.max(...items.map(item => item.id)) + 1;
};

export const useStore = create<AppState>()((set) => ({
    boards: [],
    columns: [],
    tasks: [],
    labels: [],
    settings: { windowBounds: { width: 1200, height: 800 }, lastOpenedBoardId: null, theme: 'dark' },
    isLoading: true,
    error: null,

    initialize: async () => {
        try {
            const data = await initializeData();
            const settings = await getSettings();
            set({
                boards: data.boards,
                columns: data.columns,
                tasks: data.tasks,
                labels: data.labels,
                settings,
                isLoading: false
            });
        } catch (error) {
            set({ error: String(error), isLoading: false });
        }
    },

    // ==================== BOARDS ====================
    addBoard: async (board) => {
        let newId = 0;
        set(state => {
            newId = getNextId(state.boards);
            return { boards: [...state.boards, { ...board, id: newId }] };
        });
        return newId;
    },
    updateBoard: (id, updates) => set(state => ({
        boards: state.boards.map(b => b.id === id ? { ...b, ...updates } : b)
    })),
    deleteBoard: (id) => set(state => ({
        boards: state.boards.filter(b => b.id !== id),
        columns: state.columns.filter(c => c.boardId !== id),
        tasks: state.tasks.filter(t => t.boardId !== id)
    })),
    bulkUpdateBoards: (updates) => set(state => ({
        boards: state.boards.map(b => {
            const update = updates.find(u => u.id === b.id);
            return update ? { ...b, ...update.changes } : b;
        })
    })),
    restoreBoard: (board, restoredColumns, restoredTasks) => set(state => ({
        boards: [...state.boards, board],
        columns: [...state.columns, ...restoredColumns],
        tasks: [...state.tasks, ...restoredTasks]
    })),

    // ==================== COLUMNS ====================
    addColumn: async (column) => {
        let newId = 0;
        set(state => {
            newId = getNextId(state.columns);
            return { columns: [...state.columns, { ...column, id: newId }] };
        });
        return newId;
    },
    updateColumn: (id, updates) => set(state => ({
        columns: state.columns.map(c => c.id === id ? { ...c, ...updates } : c)
    })),
    deleteColumn: (id) => set(state => ({
        columns: state.columns.filter(c => c.id !== id),
        tasks: state.tasks.filter(t => t.columnId !== id)
    })),
    bulkUpdateColumns: (updates) => set(state => ({
        columns: state.columns.map(c => {
            const update = updates.find(u => u.id === c.id);
            return update ? { ...c, ...update.changes } : c;
        })
    })),
    restoreColumn: (column, restoredTasks) => set(state => ({
        columns: [...state.columns, column],
        tasks: [...state.tasks, ...restoredTasks]
    })),

    // ==================== TASKS ====================
    addTask: async (task) => {
        let newId = 0;
        set(state => {
            newId = getNextId(state.tasks);
            return { tasks: [...state.tasks, { ...task, id: newId }] };
        });
        return newId;
    },
    updateTask: (id, updates) => set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
    })),
    deleteTask: (id) => set(state => ({
        tasks: state.tasks.filter(t => t.id !== id)
    })),
    bulkUpdateTasks: (updates) => set(state => ({
        tasks: state.tasks.map(t => {
            const update = updates.find(u => u.id === t.id);
            return update ? { ...t, ...update.changes } : t;
        })
    })),
    restoreTask: (task) => set(state => ({
        tasks: [...state.tasks, task]
    })),

    // ==================== LABELS ====================
    addLabel: async (label) => {
        let newId = 0;
        set(state => {
            newId = getNextId(state.labels);
            return { labels: [...state.labels, { ...label, id: newId }] };
        });
        return newId;
    },
    updateLabel: (id, updates) => set(state => ({
        labels: state.labels.map(l => l.id === id ? { ...l, ...updates } : l)
    })),
    deleteLabel: (id) => set(state => ({
        labels: state.labels.filter(l => l.id !== id),
        tasks: state.tasks.map(t => ({
            ...t,
            labelIds: t.labelIds.filter(lid => lid !== id)
        }))
    })),
    bulkUpdateLabels: (updates) => set(state => ({
        labels: state.labels.map(l => {
            const update = updates.find(u => u.id === l.id);
            return update ? { ...l, ...update.changes } : l;
        })
    })),
    restoreLabel: (label, affectedTasks) => set(state => {
        const affectedIds = new Set(affectedTasks.map(t => t.id));
        return {
            labels: [...state.labels, label],
            tasks: state.tasks.map(t => affectedIds.has(t.id) ? affectedTasks.find(at => at.id === t.id)! : t)
        };
    }),

    // ==================== SETTINGS ====================
    updateSettings: (updates) => set(state => ({
        settings: { ...state.settings, ...updates }
    }))
}));

// Auto-save subscription
useStore.subscribe((state, prevState) => {
    // Check if data changed
    if (
        state.boards !== prevState.boards ||
        state.columns !== prevState.columns ||
        state.tasks !== prevState.tasks ||
        state.labels !== prevState.labels
    ) {
        saveDataDebounced({
            boards: state.boards,
            columns: state.columns,
            tasks: state.tasks,
            labels: state.labels,
            version: 1,
            lastModified: new Date().toISOString()
        });
    }

    // Check if settings changed
    if (state.settings !== prevState.settings) {
        saveSettingsDebounced(state.settings);
    }
});
