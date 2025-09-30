

// Fix: Import React to make React.FC available.
import React from 'react';

export type SanitizationMode = 'tokenize' | 'redact' | 'delete' | 'none';
export type Theme = 'eclipse' | 'starlight';
export type FontSize = 'sm' | 'md' | 'lg';
export type Density = 'comfortable' | 'compact';
export type OverlayPage = 'plans' | 'help' | 'releases' | 'terms' | 'faq' | null;

export type Source = {
    uri: string;
    title: string;
};
export type Message = {
    id: string;
    role: 'user' | 'model';
    content: string;
    sanitizedContent?: string;
    files?: SanitizedFile[];
    fileContents?: string; // Content from attached files
    sources?: Source[];
};
export type Chat = {
    id: string;
    name: string;
    messages: Message[];
    isEphemeral?: boolean;
};
export type SanitizedFile = {
    name: string;
    size: number;
    type: string;
};
export type HistoryItem = {
    id: string;
    timestamp: string;
    fileName: string;
    fileSize: number;
    sanitizedFileName: string;
    sanitizedContent?: string;
    originalFileType: string;
};
export type DraftFileStatus = 'pending' | 'processing' | 'completed' | 'error';
export type DraftFile = {
    id: string;
    file: File;
    status: DraftFileStatus;
    sanitizationMode: SanitizationMode;
    originalContent?: string; // Raw text extracted from file
    displayContent?: string;  // Text shown in textarea, can be edited
    originalImage?: string;
    error?: string;
    manuallyEdited?: boolean; // Flag to track manual changes
    progress?: { processed: number; total: number; };
};
export type ActiveSelection = {
    draftId: string;
    start: number;
    end: number;
};
export type Module = {
    id: string;
    name: string;
    Icon: React.FC<any>;
    systemPrompt: string;
    description: string;
    isCustom?: boolean;
    svgIconContent?: string;
};
export type ModuleState = {
    chats: Chat[];
    activeChatId: string | null;
    attachedFiles: DraftFile[];
    sanitizationHistory: HistoryItem[];
    messages?: Message[]; // Deprecated for migration
    chatHistory?: any[]; // Deprecated for migration
};
export type Settings = {
    theme: Theme;
    defaultSanitizationMode: SanitizationMode;
    fontSize: FontSize;
    density: Density;
    enterToSend: boolean;
    showWelcome: boolean;
    enhancedVoiceMode: boolean;
}
export type SpeechState = 'idle' | 'listening' | 'speaking' | 'error';