
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Chat } from '../../types';
import { ChevronDownIcon, CloseIcon, EditIcon, FileCodeIcon, FileTextIcon, GhostIcon, TrashIcon } from '../../icons';
import { AnimatedDots } from '../ui/AnimatedDots';
import { ConfirmModal } from '../modals/ConfirmModal';
import { RenameModal } from '../modals/RenameModal';

export const ChatManager: React.FC<{
    chats: Chat[];
    activeChatId: string | null;
    isOffTheRecord: boolean;
    onSetOffTheRecord: (isOff: boolean) => void;
    onSwitch: (id: string) => void;
    onNew: () => void;
    onRename: (id: string, newName: string) => void;
    onDelete: (id: string) => void;
    onExport: (id: string, format: 'pdf' | 'txt') => void;
    onGenerateSummary: (id: string) => void;
    chatSummaries: Record<string, { summary: string; isLoading: boolean; }>;
}> = ({ chats, activeChatId, onSwitch, onNew, onRename, onDelete, isOffTheRecord, onSetOffTheRecord, onExport, onGenerateSummary, chatSummaries }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const activeChat = chats.find(c => c.id === activeChatId);
    const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const savedChats = useMemo(() => chats.filter(c => !c.isEphemeral), [chats]);

    const filteredChats = useMemo(() => {
        if (!searchQuery.trim()) {
            return savedChats;
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        return savedChats.filter(chat => {
            const nameMatch = chat.name.toLowerCase().includes(lowercasedQuery);
            if (nameMatch) return true;

            const messageMatch = chat.messages.some(message =>
                (message.content && message.content.toLowerCase().includes(lowercasedQuery)) ||
                (message.fileContents && message.fileContents.toLowerCase().includes(lowercasedQuery))
            );
            return messageMatch;
        });
    }, [savedChats, searchQuery]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleRename = () => {
        if (!activeChat) return;
        setIsOpen(false);
        setShowRenameModal(true);
    };
    
    const handleDelete = () => {
        if (!activeChat) return;
        setIsOpen(false);
        setShowDeleteConfirm(true);
    };

    const handleMouseEnter = (chatId: string) => {
        setHoveredChatId(chatId);
        // Only generate summary if it doesn't exist and isn't already loading
        if (!chatSummaries[chatId]) {
            onGenerateSummary(chatId);
        }
    };
    
    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors bg-[var(--surface-1)] text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
                {activeChat?.isEphemeral && <GhostIcon />}
                <span className="font-semibold truncate max-w-[120px] sm:max-w-xs">{activeChat?.name || 'No Active Chat'}</span>
                <ChevronDownIcon />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-[var(--background)] border border-[var(--surface-border)] rounded-lg shadow-xl z-20">
                    <div className="p-2 border-b border-[var(--surface-border)]">
                        <div className="relative">
                            <input
                                type="search"
                                placeholder="Search chats..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onClick={e => e.stopPropagation()}
                                className="w-full bg-[var(--surface-1)] px-2 py-1.5 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] pr-8"
                            />
                             {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 flex items-center pr-2 text-[var(--accent)] hover:opacity-80" aria-label="Clear search">
                                    <CloseIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="p-2 border-b border-[var(--surface-border)]">
                        <button onClick={() => { onNew(); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-[var(--surface-1)]">Start New Chat</button>
                        <label className="flex items-center justify-between gap-3 cursor-pointer text-sm px-3 py-2">
                             <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                                <GhostIcon /> <span>Off-the-Record</span>
                            </div>
                            <input type="checkbox" checked={isOffTheRecord} onChange={e => onSetOffTheRecord(e.target.checked)} className="sr-only peer" />
                            <div className="relative w-9 h-5 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                        </label>
                    </div>
                    {filteredChats.length > 0 && (
                        <div className="p-2 max-h-60 overflow-y-auto custom-scrollbar">
                            <p className="px-3 py-1 text-xs text-[var(--text-secondary)] font-semibold">Switch Chat</p>
                            {filteredChats.map(s => (
                                <div key={s.id} onMouseEnter={() => handleMouseEnter(s.id)} onMouseLeave={() => setHoveredChatId(null)} className="group relative">
                                    <button onClick={() => { onSwitch(s.id); setIsOpen(false); }} className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-[var(--surface-1)] ${s.id === activeChatId ? 'font-bold text-[var(--accent)]' : ''}`}>
                                        {s.name}
                                    </button>
                                    {hoveredChatId === s.id && chatSummaries[s.id] && (
                                         <div className="absolute left-full top-0 ml-2 w-64 p-2 bg-[var(--surface-2)] text-xs text-white rounded-md shadow-lg z-30 pointer-events-none">
                                            <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-[var(--surface-2)]"></div>
                                            {chatSummaries[s.id].isLoading ? <AnimatedDots className="bg-white"/> : chatSummaries[s.id].summary}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                     {activeChat && !activeChat.isEphemeral && (
                        <div className="p-2 border-t border-[var(--surface-border)] flex items-center justify-end gap-1">
                             <button onClick={() => onExport(activeChat.id, 'txt')} title="Export as TXT" aria-label="Export as TXT" className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><FileTextIcon /></button>
                             <button onClick={() => onExport(activeChat.id, 'pdf')} title="Export as PDF" aria-label="Export as PDF" className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><FileCodeIcon /></button>
                             <button onClick={handleRename} title="Rename chat" aria-label="Rename chat" className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><EditIcon /></button>
                             <button onClick={handleDelete} title="Delete chat" aria-label="Delete chat" className="p-2 text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors"><TrashIcon /></button>
                        </div>
                    )}
                </div>
            )}

            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={() => {
                    if (activeChat) {
                        onDelete(activeChat.id);
                    }
                    setShowDeleteConfirm(false);
                }}
                title="Delete Chat"
                message={`Are you sure you want to delete the chat: "${activeChat?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                isDangerous={true}
            />

            {activeChat && (
                <RenameModal
                    isOpen={showRenameModal}
                    onClose={() => setShowRenameModal(false)}
                    onRename={(newName) => {
                        onRename(activeChat.id, newName);
                        setShowRenameModal(false);
                    }}
                    currentName={activeChat.name}
                    title="Rename Chat"
                    label="Chat name"
                />
            )}
        </div>
    );
};
