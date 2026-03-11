export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

export function validateFocusFlowData(data: unknown): ValidationResult {
    if (!data || typeof data !== 'object') {
        return { isValid: false, error: 'Data is not an object' };
    }
    const d = data as Record<string, unknown>;

    if (!Array.isArray(d.boards)) return { isValid: false, error: 'Missing or invalid boards array' };
    if (!Array.isArray(d.columns)) return { isValid: false, error: 'Missing or invalid columns array' };
    if (!Array.isArray(d.tasks)) return { isValid: false, error: 'Missing or invalid tasks array' };
    if (!Array.isArray(d.labels)) return { isValid: false, error: 'Missing or invalid labels array' };

    // Basic structure validation, ensuring IDs are numbers, etc.
    for (const board of d.boards) {
        if (typeof board.id !== 'number' || typeof board.title !== 'string') {
            return { isValid: false, error: `Invalid board format: ${JSON.stringify(board)}` };
        }
    }

    for (const task of d.tasks) {
        if (typeof task.id !== 'number' || typeof task.boardId !== 'number' || typeof task.columnId !== 'number') {
            return { isValid: false, error: `Invalid task format: ${JSON.stringify(task)}` };
        }
    }

    return { isValid: true };
}

export function validateFocusFlowSettings(settings: unknown): ValidationResult {
    if (!settings || typeof settings !== 'object') {
        return { isValid: false, error: 'Settings is not an object' };
    }

    const s = settings as { windowBounds?: { width?: number } };

    if (!s.windowBounds || typeof s.windowBounds.width !== 'number') {
        return { isValid: false, error: 'Invalid settings format: missing windowBounds' };
    }

    return { isValid: true };
}
