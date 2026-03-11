import { useState, useRef, useEffect } from "react";
import type { Board, Column } from "../../domain/schema";

interface BoardHeaderProps {
    board: Board;
    columns: Column[];
    selectedColumnIds: number[];
    setSelectedColumnIds: (ids: number[]) => void;
    viewMode: "kanban" | "matrix";
    setViewMode: (mode: "kanban" | "matrix") => void;
    onUpdateTitle: (newTitle: string) => Promise<void>;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

export function BoardHeader({
    board,
    columns,
    selectedColumnIds,
    setSelectedColumnIds,
    viewMode,
    setViewMode,
    onUpdateTitle,
    searchQuery,
    setSearchQuery,
}: BoardHeaderProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState(board.title);
    const [isColumnFilterOpen, setIsColumnFilterOpen] = useState(false);
    const columnFilterRef = useRef<HTMLDivElement>(null);

    // Initialize title when board changes
    useEffect(() => {
        if (!isEditingTitle) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTitle(board.title);
        }
    }, [board.title, isEditingTitle]);

    // Close column filter dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (columnFilterRef.current && !columnFilterRef.current.contains(event.target as Node)) {
                setIsColumnFilterOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleTitleSave = async () => {
        const newTitle = title.trim() || "New Board";
        if (newTitle !== board.title) {
            await onUpdateTitle(newTitle);
        }
        setTitle(newTitle);
        setIsEditingTitle(false);
    };

    return (
        <div className="h-16 border-b border-zinc-800/50 bg-zinc-900/80 backdrop-blur-md flex items-center justify-between px-6 flex-shrink-0 z-20">
            {/* Title Area */}
            <div className="flex items-center flex-1">
                {isEditingTitle ? (
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
                        className="text-2xl font-bold text-zinc-100 bg-transparent border-b-2 border-indigo-500 outline-none placeholder-zinc-600"
                        autoFocus
                    />
                ) : (
                    <h2
                        onClick={() => {
                            setTitle(board.title);
                            setIsEditingTitle(true);
                        }}
                        className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent cursor-pointer hover:opacity-80 px-2 rounded transition-all"
                    >
                        {board.title}
                    </h2>
                )}
            </div>

            {/* Center Area: Search & Filters */}
            <div className="flex-1 flex justify-center items-center gap-4">
                {/* Search Input */}
                <div className="relative w-64 max-w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-800/50 border border-zinc-700/50 text-zinc-200 text-sm rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 block pl-10 p-2 outline-none transition-colors placeholder-zinc-500"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Column Filter - Center (only visible in Matrix view) */}
                {viewMode === "matrix" && (
                    <div className="relative" ref={columnFilterRef}>
                        <button
                            onClick={() => setIsColumnFilterOpen(!isColumnFilterOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Columns
                            <span className="px-1.5 py-0.5 bg-zinc-900 rounded text-xs text-zinc-400">
                                {selectedColumnIds.length}/{columns.length}
                            </span>
                            <svg className={`w-4 h-4 transition-transform ${isColumnFilterOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isColumnFilterOpen && (
                            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-zinc-900 rounded-xl shadow-xl border border-zinc-800 z-50 py-2 overflow-hidden">
                                {/* Select/Deselect All */}
                                <div className="px-3 pb-2 mb-2 border-b border-zinc-800 flex gap-2">
                                    <button
                                        onClick={() => setSelectedColumnIds(columns.map(c => c.id))}
                                        disabled={columns.length > 0 && selectedColumnIds.length === columns.length}
                                        className="flex-1 px-2 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Select All
                                    </button>
                                    <button
                                        onClick={() => setSelectedColumnIds([])}
                                        disabled={selectedColumnIds.length === 0}
                                        className="flex-1 px-2 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Deselect All
                                    </button>
                                </div>

                                {/* Column List */}
                                <div className="max-h-60 overflow-y-auto">
                                    {columns.map(column => (
                                        <button
                                            key={column.id}
                                            onClick={() => {
                                                if (selectedColumnIds.includes(column.id)) {
                                                    setSelectedColumnIds(selectedColumnIds.filter(id => id !== column.id));
                                                } else {
                                                    setSelectedColumnIds([...selectedColumnIds, column.id]);
                                                }
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedColumnIds.includes(column.id)
                                                ? "bg-indigo-500 border-indigo-500"
                                                : "border-zinc-600 bg-transparent"
                                                }`}>
                                                {selectedColumnIds.includes(column.id) && (
                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className="truncate">{column.title}</span>
                                        </button>
                                    ))}
                                    {columns.length === 0 && (
                                        <div className="px-3 py-2 text-sm text-zinc-500 italic">No columns</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* View Toggle - Right */}
            <div className="flex-1 flex justify-end">
                <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                    <button
                        onClick={() => setViewMode("kanban")}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "kanban"
                            ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm"
                            : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                            }`}
                    >
                        Kanban View
                    </button>
                    <button
                        onClick={() => setViewMode("matrix")}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "matrix"
                            ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm"
                            : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                            }`}
                    >
                        Matrix View
                    </button>
                </div>
            </div>
        </div>
    );
}
