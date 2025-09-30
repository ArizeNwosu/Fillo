
import React from 'react';

export const PastePromptModal: React.FC<{ onTokenize: () => void; onPasteAsIs: () => void; }> = ({ onTokenize, onPasteAsIs }) => {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-[var(--surface-1)] p-6 rounded-lg shadow-xl max-w-md w-full border border-[var(--surface-border)]">
                <h3 className="text-lg mb-4 font-serif font-bold">Large Text Detected</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-6">Large text may contain sensitive information. For your privacy, we recommend sanitizing it before sending.</p>
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <button onClick={onPasteAsIs} className="px-4 py-2 text-sm bg-[var(--surface-2)] hover:brightness-110 rounded-md transition-colors">Paste As-Is</button>
                    <button onClick={onTokenize} className="px-4 py-2 text-sm bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] rounded-md transition-colors">Tokenize in Draft</button>
                </div>
            </div>
        </div>
    );
};
