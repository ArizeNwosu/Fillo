import React, { useState, useEffect } from 'react';
import { DraftFile, SanitizationMode, ActiveSelection } from '../../types';
import { AnimatedDots } from '../ui/AnimatedDots';
import { CloseIcon } from '../../icons';

export const DraftsPanel: React.FC<{
    drafts: DraftFile[];
    onRemove: (id: string) => void;
    onSanitize: (id: string, mode: SanitizationMode) => void;
    onDisplayContentChange: (id: string, content: string) => void;
    onTextareaMouseUp: (e: React.MouseEvent<HTMLTextAreaElement>, draftId: string) => void;
    activeSelection: ActiveSelection | null;
}> = ({ drafts, onRemove, onSanitize, onDisplayContentChange, onTextareaMouseUp, activeSelection }) => {
    const [activeDraft, setActiveDraft] = useState<string | null>(null);

    useEffect(() => {
        // When the list of drafts changes (e.g., a new file is added or one is removed),
        // this ensures the view switches to the newest file (which is always at the start of the array).
        const latestDraftId = drafts[0]?.id || null;
        
        // This respects a user's manual selection of an older tab until the drafts array changes again.
        if (activeDraft !== latestDraftId) {
            setActiveDraft(latestDraftId);
        }
    }, [drafts]);

    const currentDraft = drafts.find(d => d.id === activeDraft);

    return (
        <div className="flex-1 flex flex-col bg-[var(--surface-1)] rounded-lg min-h-0">
            <div className="flex border-b border-[var(--surface-border)] overflow-x-auto">
                {drafts.map(d => (
                    <button key={d.id} onClick={() => setActiveDraft(d.id)}
                        className={`px-3 py-2 text-xs border-b-2 whitespace-nowrap ${d.id === activeDraft ? 'border-[var(--accent)] font-semibold' : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'}`}>
                        {d.file.name}
                    </button>
                ))}
            </div>
            {currentDraft && (
                <div key={currentDraft.id} className="p-2 flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                            {currentDraft.status === 'completed' && (['Tokenize', 'Redact', 'Delete', 'None']).map(mode => (
                                <button key={mode} onClick={() => onSanitize(currentDraft.id, mode.toLowerCase() as SanitizationMode)} title={mode}
                                    className={`px-3 py-0.5 text-xs rounded-md ${currentDraft.sanitizationMode === mode.toLowerCase() && !activeSelection ? 'bg-[var(--accent)]' : 'bg-[var(--surface-2)] hover:bg-[var(--accent)]'}`}>
                                    {mode}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => onRemove(currentDraft.id)} title="Remove file" aria-label="Remove file" className="p-1 text-[var(--text-secondary)] hover:text-[var(--danger)]"><CloseIcon className="h-4 w-4" /></button>
                    </div>

                    {currentDraft.status === 'processing' && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-sm text-[var(--text-secondary)]">
                            <AnimatedDots />
                            <p className="mt-2">
                                {currentDraft.progress
                                    ? `Processing page ${currentDraft.progress.processed} of ${currentDraft.progress.total}...`
                                    : 'Preparing file...'}
                            </p>
                        </div>
                    )}
                    {currentDraft.status === 'error' && <div className="flex-1 flex items-center justify-center text-red-400 text-xs text-center p-2">{currentDraft.error}</div>}
                    {currentDraft.status === 'completed' && (
                        <div className="flex-1 relative min-h-0">
                            <textarea
                                value={currentDraft.displayContent || ''}
                                onChange={(e) => onDisplayContentChange(currentDraft.id, e.target.value)}
                                onMouseUp={(e) => onTextareaMouseUp(e, currentDraft.id)}
                                onBlur={() => setTimeout(() => activeSelection && onSanitize(activeSelection.draftId, 'none'), 200)}
                                className="w-full h-full bg-[var(--background)] p-2 rounded-md resize-none text-xs custom-scrollbar border border-transparent focus:border-[var(--accent)]"
                            />
                            {activeSelection && activeSelection.draftId === currentDraft.id && (
                                <div className="absolute top-0 right-2 flex gap-1 bg-[var(--surface-2)] p-1 rounded-md">
                                    {(['tokenize', 'redact', 'delete'] as SanitizationMode[]).map(mode => (
                                        <button key={mode} onMouseDown={() => onSanitize(currentDraft.id, mode)}
                                            className="px-1.5 py-0.5 text-xs rounded-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)]">
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}