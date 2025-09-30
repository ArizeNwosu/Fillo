import React, { useEffect } from 'react';
import { CloseIcon } from '../../icons';

export const ConfirmModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
}> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDangerous = false
}) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
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

                <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                    {message}
                </p>

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 text-sm font-semibold border border-[var(--surface-border)] rounded-md hover:bg-[var(--surface-1)] transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`px-4 py-2.5 text-sm font-semibold rounded-md transition-colors ${
                            isDangerous
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)]'
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};