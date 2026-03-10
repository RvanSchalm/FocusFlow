---
name: import-export
description: Rules for handling data migrations and maintaining schema compatibility when users import/export their boards. Use when modifying `dataService.ts` logic for parsing/saving files.
---

# Import/Export Data Rules

FocusFlow allows users to import and export `.json` and legacy formats.

## Schema Compatibility

1. **Never Break Importers**: When you change the domain logic (e.g., adding a new field to `Board`), you MUST ensure that older imported formats either still load correctly or are gracefully upgraded during import.
2. **Data Checking**: You must validate imported data using `src/domain/schema.ts` validators. The user might upload arbitrary corrupted JSON. If it fails validation, cleanly show an error UI—do not crash.

## Handlers

- The UI layer calls `exportData()` or `importData()`.
- The UI layer should handle Base64 decoding of attachments if relevant to the export format. 
- The `exportData` function should serialize the entire `ApplicationState` (or specifically the Board/Task data subset) and trigger the browser/Electron download prompt.
