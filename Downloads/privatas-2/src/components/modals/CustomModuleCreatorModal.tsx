
import React, { useState, useEffect } from 'react';
import { CloseIcon } from '../../icons';
import { AnimatedDots } from '../ui/AnimatedDots';

export const CustomModuleCreatorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, goal: string) => void;
    isCreating: boolean;
}> = ({ isOpen, onClose, onCreate, isCreating }) => {
    const [name, setName] = useState('');
    const [goal, setGoal] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!name.trim() || !goal.trim()) {
            setError('Both module name and goal are required.');
            return;
        }
        setError('');
        onCreate(name.trim(), goal.trim());
        setName('');
        setGoal('');
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-[var(--background)] p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-2xl border border-[var(--surface-border)] flex flex-col gap-6 max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h2 className="text-xl sm:text-2xl font-serif font-bold">Create Custom Module</h2>
                    <button onClick={onClose} aria-label="Close" title="Close" className="p-1 rounded-full hover:bg-[var(--surface-1)] disabled:opacity-50" disabled={isCreating}><CloseIcon className="h-6 w-6" /></button>
                </div>
                
                <div className="overflow-y-auto pr-2 pl-1 pb-4 space-y-4">
                    <div>
                        <label className="font-semibold text-sm mb-1 block">Module Name</label>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Art Collection Analyst" className="w-full bg-[var(--surface-1)] p-2 rounded-md border border-[var(--surface-border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm" disabled={isCreating} />
                    </div>
                     <div className="pb-1">
                        <label className="font-semibold text-sm mb-1 block">Module Goal</label>
                        <p className="text-xs text-[var(--text-secondary)] mb-2">Describe what this module should do. The AI will generate the appropriate questions and analysis steps based on this goal.</p>
                        <textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g., Analyze art auction catalogs to identify undervalued pieces from the Impressionist period." rows={4} className="w-full bg-[var(--surface-1)] p-2 rounded-md border border-[var(--surface-border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm resize-y" disabled={isCreating} />
                    </div>
                    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                </div>
                
                <div className="mt-auto flex justify-end">
                    <button onClick={handleSubmit} disabled={isCreating} className="px-4 py-2 text-sm bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] rounded-md transition-colors disabled:bg-[var(--surface-2)] disabled:cursor-wait flex items-center gap-2">
                        {isCreating && <AnimatedDots className="bg-white" />}
                        {isCreating ? 'Creating...' : 'Create Module'}
                    </button>
                </div>
            </div>
        </div>
    );
};
