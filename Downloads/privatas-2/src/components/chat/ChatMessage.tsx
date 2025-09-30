
import React from 'react';
import { Message } from '../../types';
import { formatBytes } from '../../lib/utils';
import { SpeakerIcon, StopIcon } from '../../icons';
import { AnimatedDots } from '../ui/AnimatedDots';
import { StructuredBrief } from './StructuredBrief';

export const ChatMessage: React.FC<{ message: Message; onReadAloud: (text: string, messageId: string) => void; isSpeaking: boolean; onExportBrief: (markdownContent: string) => void; }> = ({ message, onReadAloud, isSpeaking, onExportBrief }) => {
    const isUser = message.role === 'user';
    const alignClass = isUser ? 'items-end' : 'items-start';
    const bubbleColor = isUser ? 'bg-[var(--surface-2)] text-[var(--text-primary)]' : 'bg-transparent';
    const textAlign = isUser ? 'text-right' : 'text-left';
    const isBrief = message.role === 'model' && message.content.trim().startsWith('# Executive Brief');
    const hasTextContent = message.content && message.content.trim().length > 0;
    
    return (
        <div className={`flex flex-col ${alignClass} group`}>
            {(hasTextContent || message.role === 'model') && (
                <div className={`max-w-full sm:max-w-xl w-fit rounded-lg whitespace-pre-wrap ${!isBrief ? `p-3 ${bubbleColor}` : 'w-full'}`}>
                     {message.id === 'loading' ? <AnimatedDots /> : 
                        isBrief ? <StructuredBrief content={message.content} onExport={() => onExportBrief(message.content)} /> : <p>{message.content}</p>
                     }
                </div>
            )}
            {message.role === 'model' && message.content && message.id !== 'loading' && (
                 <button onClick={() => onReadAloud(message.content, message.id)} title={isSpeaking ? "Stop reading" : "Read aloud"} aria-label={isSpeaking ? "Stop reading" : "Read aloud"}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-75 p-1 rounded-full hover:bg-[var(--surface-1)] text-[var(--text-secondary)] mt-1">
                    {isSpeaking ? <StopIcon/> : <SpeakerIcon />}
                 </button>
            )}
             {message.files && message.files.length > 0 && (
                <div className={`mt-2 space-y-2 ${textAlign}`}>
                    {message.files.map((file, index) => (
                        <div key={index} className="max-w-xs w-fit bg-[var(--surface-1)] p-2 rounded-md text-xs text-[var(--text-secondary)]">
                            {file.name} &middot; {formatBytes(file.size)}
                        </div>
                    ))}
                </div>
            )}
            {message.sources && message.sources.length > 0 && (
                <div className="mt-2 max-w-full sm:max-w-xl w-full">
                    <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-1 border-t border-[var(--surface-border)] pt-2">Sources</h4>
                    <ul className="list-none space-y-1">
                        {message.sources.map((source, index) => (
                            <li key={index} className="text-xs text-[var(--text-secondary)]">
                                <a href={source.uri} target="_blank" rel="noopener noreferrer"
                                   className="text-[var(--accent)] hover:underline truncate block">
                                    {index + 1}. {source.title || source.uri}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
