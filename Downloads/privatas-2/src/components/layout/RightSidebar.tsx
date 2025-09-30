
import React, { useState } from 'react';
import { DraftFile, HistoryItem, ActiveSelection, OverlayPage, SanitizationMode } from '../../types';
import { QuestionIcon, FileIcon, DownloadIcon } from '../../icons';
import { HelpDropdown } from '../ui/Dropdown';
import { UserProfileMenu } from '../ui/UserProfileMenu';
import { useAuth } from '../../contexts/AuthContext';
import { DraftsPanel } from './DraftsPanel';
import { formatBytes } from '../../lib/utils';

export const RightSidebar: React.FC<{
    onOpenSettings: () => void;
    onShowPage: (page: OverlayPage) => void;
    drafts: DraftFile[];
    onRemoveDraft: (id: string) => void;
    onSanitizeDraft: (id: string, mode: SanitizationMode) => void;
    onDraftContentChange: (id: string, content: string) => void;
    onTextareaMouseUp: (e: React.MouseEvent<HTMLTextAreaElement>, draftId: string) => void;
    activeSelection: ActiveSelection | null;
    sanitizationHistory: HistoryItem[];
    onDownloadHistoryItem: (item: HistoryItem) => void;
    onClearSanitizationHistory: () => void;
}> = ({
    onOpenSettings, onShowPage, drafts, onRemoveDraft, onSanitizeDraft,
    onDraftContentChange, onTextareaMouseUp, activeSelection,
    sanitizationHistory, onDownloadHistoryItem, onClearSanitizationHistory
}) => {
    const { user } = useAuth();
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    return (
        <aside className="w-full h-full bg-[var(--background)] p-4 flex flex-col gap-4 border-l border-[var(--surface-border)]">
            <section className="flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center h-10">
                    <h2 className="text-lg font-bold">Current Draft</h2>
                    <div className="flex items-center gap-2">
                        {user ? (
                            <UserProfileMenu
                                user={user}
                                isOpen={isUserMenuOpen}
                                onClose={() => setIsUserMenuOpen(false)}
                                onToggle={() => setIsUserMenuOpen(prev => !prev)}
                                onShowPage={onShowPage}
                                onOpenSettings={onOpenSettings}
                            />
                        ) : (
                            <div className="relative">
                                <button onClick={() => setIsHelpOpen(o => !o)} title="Help" aria-label="Open Help Menu" className="p-1.5 rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]">
                                    <QuestionIcon className="h-5 w-5" />
                                </button>
                                <HelpDropdown isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} onShowPage={onShowPage} />
                            </div>
                        )}
                    </div>
                </div>
                {drafts.length > 0 ? (
                    <DraftsPanel
                        drafts={drafts}
                        onRemove={onRemoveDraft}
                        onSanitize={onSanitizeDraft}
                        onDisplayContentChange={onDraftContentChange}
                        onTextareaMouseUp={onTextareaMouseUp}
                        activeSelection={activeSelection}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-[var(--surface-1)] rounded-lg text-sm text-[var(--text-secondary)]">
                        <FileIcon />
                        <p className="mt-2 font-semibold">No files attached</p>
                        <p>Attach files to start sanitizing.</p>
                    </div>
                )}
            </section>
            <section className="flex-1 flex flex-col min-h-0">
                 <div className="flex justify-between items-center h-10">
                    <h2 className="text-lg font-bold">Sanitization History</h2>
                    {sanitizationHistory.length > 0 && (
                        <button onClick={onClearSanitizationHistory} className="text-sm font-semibold text-[var(--accent)] hover:underline">
                            Clear
                        </button>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
                    {sanitizationHistory.length > 0 ? (
                        <ul className="history-list">
                            {sanitizationHistory.map(item => (
                                <li key={item.id} className="bg-[var(--surface-1)] rounded-md text-xs history-item">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold truncate pr-2">{item.fileName}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[var(--text-secondary)]">{formatBytes(item.fileSize)}</p>
                                            <button onClick={() => onDownloadHistoryItem(item)} title="Download sanitized text" aria-label="Download sanitized text" className="text-[var(--text-secondary)] hover:text-[var(--accent)]"><DownloadIcon /></button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-[var(--surface-1)] rounded-lg text-sm text-[var(--text-secondary)] h-full">
                            <p>No history yet.</p>
                        </div>
                    )}
                </div>
            </section>
        </aside>
    );
};
