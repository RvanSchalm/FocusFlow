import { describe, it, expect } from 'vitest';
import { validateFocusFlowData, validateFocusFlowSettings } from './validation';

describe('Data Validation', () => {
    it('should pass valid FocusFlow data', () => {
        const validData = {
            boards: [{ id: 1, title: 'Board 1', createdAt: new Date().toISOString() }],
            columns: [{ id: 1, boardId: 1, title: 'To Do', order: 0 }],
            tasks: [{
                id: 1, boardId: 1, columnId: 1, title: 'Task 1', description: '',
                urgency: 5, importance: 5, labelIds: [], checklist: [], comments: [], attachments: [], order: 0
            }],
            labels: [],
            version: 1,
            lastModified: new Date().toISOString()
        };

        const result = validateFocusFlowData(validData);
        expect(result.isValid).toBe(true);
    });

    it('should reject data without required arrays', () => {
        const result = validateFocusFlowData({ boards: [] }); // missing columns, tasks, labels
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Missing or invalid');
    });

    it('should reject malformed board objects', () => {
        const data = {
            boards: [{ id: 'not-a-number', title: 'Board 1' }],
            columns: [], tasks: [], labels: []
        };
        const result = validateFocusFlowData(data);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Invalid board format');
    });

    it('should reject malformed task objects', () => {
        const data = {
            boards: [], columns: [], labels: [],
            tasks: [{ id: 1, boardId: 'string-instead-of-number', columnId: 1 }]
        };
        const result = validateFocusFlowData(data);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Invalid task format');
    });
});

describe('Settings Validation', () => {
    it('should pass valid settings', () => {
        const result = validateFocusFlowSettings({
            windowBounds: { width: 800, height: 600 },
            lastOpenedBoardId: null,
            theme: 'dark'
        });
        expect(result.isValid).toBe(true);
    });

    it('should reject settings without windowBounds', () => {
        const result = validateFocusFlowSettings({ theme: 'light' });
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('missing windowBounds');
    });
});
