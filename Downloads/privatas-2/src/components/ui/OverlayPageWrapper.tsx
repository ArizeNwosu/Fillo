
import React from 'react';
import { CloseIcon } from '../../icons';

export const OverlayPageWrapper: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; }> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 bg-[var(--background)] z-50 flex flex-col p-4 sm:p-6 md:p-8" >
        <header className="flex justify-between items-center mb-6 flex-shrink-0">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold">{title}</h1>
            <button onClick={onClose} aria-label="Close" title="Close" className="p-2 rounded-full hover:bg-[var(--surface-1)]">
                <CloseIcon className="h-6 w-6" />
            </button>
        </header>
        <div className="flex-1 overflow-y-auto custom-scrollbar -mr-4 pr-4">
            {children}
        </div>
    </div>
);
