
import React from 'react';
import { AttachIcon, MicrophoneIcon, SendIcon, StopIcon } from '../../icons';
import { Settings, SpeechState } from '../../types';

export const ChatInputBar: React.FC<{
    input: string;
    setInput: (value: string) => void;
    onSendMessage: (e?: React.FormEvent) => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onToggleDictation: () => void;
    isLoading: boolean;
    onStop: () => void;
    settings: Settings;
    speechState: SpeechState;
    fileInputRef: React.RefObject<HTMLInputElement>;
    textareaRef: React.RefObject<HTMLTextAreaElement>;
    attachedFileCount: number;
    onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
    isLanding?: boolean;
}> = ({ input, setInput, onSendMessage, onFileChange, onToggleDictation, isLoading, onStop, settings, speechState, fileInputRef, textareaRef, attachedFileCount, onPaste, isLanding = false }) => {
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (settings.enterToSend && !isLanding) {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSendMessage(); }
        } else {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSendMessage(); }
            else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onSendMessage(); }
        }
    };

    return (
        <form onSubmit={onSendMessage} className="w-full">
            <div className={`relative flex items-center gap-2 bg-[var(--surface-1)] rounded-xl p-2 ring-1 ring-[var(--surface-border)] focus-within:ring-2 focus-within:ring-[var(--accent)] transition-shadow`}>
                <textarea 
                    ref={textareaRef} 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    onKeyDown={handleKeyDown}
                    onPaste={onPaste} 
                    placeholder="Type your message or attach a file..." 
                    rows={1} 
                    className="flex-1 w-full bg-transparent px-2 py-1.5 resize-none focus:outline-none max-h-48 custom-scrollbar text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
                />
                <input type="file" ref={fileInputRef} onChange={onFileChange} multiple className="hidden" />
                
                <button type="button" onClick={() => fileInputRef.current?.click()} title="Attach files" aria-label="Attach files" className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors relative">
                    <AttachIcon />
                    {attachedFileCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] text-white">{attachedFileCount}</span>}
                </button>
                <button type="button" onClick={onToggleDictation} title="Start dictation" aria-label="Start dictation" className={`p-2 rounded-lg transition-colors ${speechState === 'listening' ? 'bg-[var(--danger)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'}`}>
                    <MicrophoneIcon />
                </button>
                
                {isLoading ? (
                    <button type="button" onClick={onStop} title="Stop generation" aria-label="Stop generation" className="p-2 bg-[var(--danger)] hover:bg-[var(--danger-hover)] text-white rounded-lg transition-colors">
                        <StopIcon />
                    </button>
                ) : (
                    <button 
                        type="submit"
                        disabled={!input.trim() && attachedFileCount === 0} 
                        className="p-2 bg-[var(--accent)] text-[var(--accent-text)] rounded-lg transition-colors hover:bg-[var(--accent-hover)] disabled:bg-[var(--surface-2)]/80 disabled:text-[var(--text-secondary)] disabled:cursor-not-allowed"
                        title="Send message"
                        aria-label="Send message"
                    >
                        <SendIcon />
                    </button>
                )}
            </div>
            {!isLanding && (
                <p className="text-center text-xs text-[var(--text-secondary)] mt-2">Privatas can make mistakes. Check important info.</p>
            )}
        </form>
    );
};
