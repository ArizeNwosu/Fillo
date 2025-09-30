import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon } from '../../icons';

export const RenameModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onRename: (newName: string) => void;
    currentName: string;
    title?: string;
    label?: string;
}> = ({
    isOpen,
    onClose,
    onRename,
    currentName,
    title = 'Rename',
    label = 'New name'
}) => {
    const [newName, setNewName] = useState(currentName);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setNewName(currentName);
            // Focus and select the input after a brief delay to ensure modal is rendered
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 50);
        }
    }, [isOpen, currentName]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = newName.trim();
        if (trimmedName && trimmedName !== currentName) {
            onRename(trimmedName);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-[var(--background)] p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md border border-[var(--surface-border)] flex flex-col gap-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h2 className="text-xl sm:text-2xl font-serif font-bold">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        title="Close"
                        className="p-1 rounded-full hover:bg-[var(--surface-1)] transition-colors"
                    >
                        <CloseIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="font-semibold text-sm mb-1.5 block">{label}</label>
                        <input
                            ref={inputRef}
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full bg-[var(--surface-1)] p-2.5 rounded-md border border-[var(--surface-border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
                            placeholder="Enter new name"
                            required
                        />
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-sm font-semibold border border-[var(--surface-border)] rounded-md hover:bg-[var(--surface-1)] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2.5 text-sm font-semibold bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] rounded-md transition-colors"
                        >
                            Rename
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};