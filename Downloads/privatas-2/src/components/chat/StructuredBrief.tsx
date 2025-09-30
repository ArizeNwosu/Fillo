
import React from 'react';
import { parseMarkdownToHtml, sanitizeHtml } from '../../lib/utils';
import { DownloadIcon } from '../../icons';

export const StructuredBrief: React.FC<{ content: string; onExport: () => void; }> = ({ content, onExport }) => {
    const briefContent = content.replace(/^# Executive Brief\s*/, '');
    const htmlContent = parseMarkdownToHtml(briefContent);
    const sanitizedHtml = sanitizeHtml(htmlContent);

    return (
        <div className="p-4 bg-[var(--surface-1)] rounded-lg border border-[var(--surface-border)]">
             <div className="flex justify-between items-center mb-4 border-b border-[var(--surface-border)] pb-2">
                <h2 className="text-xl font-serif font-bold">Executive Brief</h2>
                <button onClick={onExport} title="Export brief as PDF" aria-label="Export brief as PDF" className="p-1.5 text-[var(--text-secondary)] rounded-md hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]">
                    <DownloadIcon className="h-5 w-5" />
                </button>
             </div>
             <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizedHtml }}></div>
        </div>
    );
};
