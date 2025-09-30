

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { GoogleGenAI } from "@google/genai";
import {
    SanitizationMode, Settings, Module, ModuleState, Chat, Message, SanitizedFile, HistoryItem,
    DraftFile, ActiveSelection, OverlayPage, SpeechState
} from './types';
import { sanitizeText } from './lib/sanitization';
import { getInitialModuleState, MODULES } from './constants/modules';
import { LandingPage } from './components/layout/LandingPage';
import { ModuleSidebar } from './components/layout/ModuleSidebar';
import { ChatManager } from './components/chat/ChatManager';
import { ChatMessage } from './components/chat/ChatMessage';
import { ChatInputBar } from './components/chat/ChatInputBar';
import { RightSidebar } from './components/layout/RightSidebar';
import { SettingsModal } from './components/modals/SettingsModal';
import { ModuleLibraryModal } from './components/modals/ModuleLibraryModal';
import { CustomModuleCreatorModal } from './components/modals/CustomModuleCreatorModal';
import { PastePromptModal } from './components/modals/PastePromptModal';
import { ContactFormModal } from './components/modals/ContactFormModal';
import { AuthModal } from './components/modals/AuthModal';
import { ConfirmModal } from './components/modals/ConfirmModal';
import { MenuIcon, PanelRightIcon, ResetIcon } from './icons';
import { escapeHtml, parseMarkdownToHtmlForPdf } from './lib/utils';
import { GeneralIcon } from './icons';
import { useAuth } from './contexts/AuthContext';
import { AnimatedDots } from './components/ui/AnimatedDots';
import { validateFile } from './lib/fileValidation';
import { validateSvgContent, extractSvgFromResponse } from './lib/svgValidation';
import { ErrorBoundary, FileProcessingErrorBoundary, AIErrorBoundary } from './components/ErrorBoundary';

// Lazy load overlay pages for better performance
const PlansPage = lazy(() => import('./components/pages/PlansPage').then(m => ({ default: m.PlansPage })));
const HelpCenterPage = lazy(() => import('./components/pages/HelpCenterPage').then(m => ({ default: m.HelpCenterPage })));
const ReleaseNotesPage = lazy(() => import('./components/pages/ReleaseNotesPage').then(m => ({ default: m.ReleaseNotesPage })));
const TermsPage = lazy(() => import('./components/pages/TermsPage').then(m => ({ default: m.TermsPage })));
const FAQPage = lazy(() => import('./components/pages/FAQPage').then(m => ({ default: m.FAQPage })));


// --- Third-party library declarations ---
declare const pdfjsLib: any;
declare const mammoth: any;
declare const Tesseract: any;
declare const jspdf: any;
declare const html2canvas: any;


// --- MAIN APP COMPONENT ---
const App = () => {
    const { user } = useAuth();
    const [settings, setSettings] = useState<Settings>({ 
        theme: 'eclipse', 
        defaultSanitizationMode: 'redact',
        fontSize: 'md',
        density: 'comfortable',
        enterToSend: true,
        showWelcome: true,
        enhancedVoiceMode: false,
    });
    const [activeModule, setActiveModule] = useState<string>('general');
    const [modulesData, setModulesData] = useState<Record<string, ModuleState>>({});
    const [customModules, setCustomModules] = useState<Record<string, Module>>({});
    const [activeModuleIds, setActiveModuleIds] = useState<string[]>(['general']);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCreateModuleOpen, setIsCreateModuleOpen] = useState(false);
    const [isCreatingModule, setIsCreatingModule] = useState(false);
    const [isContactFormOpen, setIsContactFormOpen] = useState(false);
    const [appLaunched, setAppLaunched] = useState(false);
    const [initialQuery, setInitialQuery] = useState<string | null>(null);
    const [initialFiles, setInitialFiles] = useState<File[] | null>(null);
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
    const [activeOverlayPage, setActiveOverlayPage] = useState<OverlayPage>(null);
    const [authModalState, setAuthModalState] = useState({ isOpen: false, mode: 'login' as 'login' | 'signup' });
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmText?: string;
        isDangerous?: boolean;
        onConfirm: () => void;
    } | null>(null);

    const availableModules = useMemo(() => ({ ...MODULES, ...customModules }), [customModules]);
    const { chats, activeChatId, attachedFiles, sanitizationHistory } = modulesData[activeModule] || getInitialModuleState();
    const activeChat = useMemo(() => chats.find(c => c.id === activeChatId), [chats, activeChatId]);
    const messages = activeChat?.messages || [];

    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [activeSelection, setActiveSelection] = useState<ActiveSelection | null>(null);
    const [pastePrompt, setPastePrompt] = useState<{ visible: boolean; text: string; }>({ visible: false, text: '' });
    const [isOffTheRecord, setIsOffTheRecord] = useState(false);
    const [chatSummaries, setChatSummaries] = useState<Record<string, { summary: string, isLoading: boolean }>>({});
    const [speechState, setSpeechState] = useState<SpeechState>('idle');
    const [currentlySpeakingMsgId, setCurrentlySpeakingMsgId] = useState<string | null>(null);
    const [preferredVoice, setPreferredVoice] = useState<SpeechSynthesisVoice | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const speechRecognitionRef = useRef<any>(null);
    const preDictationInputRef = useRef('');
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const ai = useRef(new GoogleGenAI({ apiKey: process.env.API_KEY })).current;

    const handleSettingsChange = useCallback((newSettings: Partial<Settings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    }, []);

    const closeSettingsModal = useCallback(() => {
        setIsSettingsOpen(false);
    }, []);

    const openAuthModal = (mode: 'login' | 'signup') => setAuthModalState({ isOpen: true, mode });
    const closeAuthModal = () => setAuthModalState({ isOpen: false, mode: 'login' });

    // --- State Update Helpers ---
     const updateCurrentModuleState = useCallback((updater: (prevState: ModuleState) => ModuleState) => {
        setModulesData(prevData => ({
            ...prevData,
            [activeModule]: updater(prevData[activeModule] || getInitialModuleState())
        }));
    }, [activeModule]);

    // Load state from localStorage ONCE on initial mount
    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem('Privatas-settings');
            if (savedSettings) { 
                const parsedSettings = JSON.parse(savedSettings);
                if (!parsedSettings.defaultSanitizationMode || parsedSettings.defaultSanitizationMode === 'mask') {
                    parsedSettings.defaultSanitizationMode = 'redact';
                }
                setSettings(prev => ({...prev, ...parsedSettings})); 
            }
            
            const savedActiveModules = localStorage.getItem('Privatas-activeModules');
            if (savedActiveModules) {
                const parsedModules = JSON.parse(savedActiveModules);
                if (!parsedModules.includes('general')) { parsedModules.unshift('general'); }
                setActiveModuleIds(parsedModules);
            }
            
            const savedCustomModules = localStorage.getItem('Privatas-customModules');
            let parsedCustomModules: Record<string, Module> = {};
            if (savedCustomModules) {
                parsedCustomModules = JSON.parse(savedCustomModules);
                Object.keys(parsedCustomModules).forEach(id => {
                    (parsedCustomModules[id] as any).Icon = GeneralIcon;
                });
                setCustomModules(parsedCustomModules);
            }

            const allKnownModuleIds = [...new Set([...Object.keys(MODULES), ...(savedActiveModules ? JSON.parse(savedActiveModules) : []), ...Object.keys(parsedCustomModules)])];
            const allModuleData: Record<string, ModuleState> = {};
            
            allKnownModuleIds.forEach(id => {
                const savedData = localStorage.getItem(`Privatas-module-${id}`);
                if (!savedData) {
                    allModuleData[id] = getInitialModuleState();
                    return;
                }

                let moduleState: ModuleState = JSON.parse(savedData);

                // --- DATA MIGRATION LOGIC ---
                // Check for legacy format (has 'messages' property but no 'chats' array) and migrate.
                if (moduleState.messages && !moduleState.chats) {
                    console.warn(`Migrating legacy data format for module: ${id}`);
                    const legacyMessages = moduleState.messages;
                    const newChatId = `chat-${Date.now()}`;
                    const migratedChat: Chat = {
                        id: newChatId,
                        name: 'Imported Chat',
                        messages: legacyMessages,
                    };
                    
                    moduleState = {
                        ...moduleState,
                        chats: [migratedChat],
                        activeChatId: newChatId,
                    };
                    // Clean up deprecated properties from the object
                    delete (moduleState as any).messages;
                    delete (moduleState as any).chatHistory;
                }

                // --- SANITY CHECKS for potentially corrupted state ---
                // Ensure chats array is not empty
                if (!moduleState.chats || moduleState.chats.length === 0) {
                    const newChatId = `chat-${Date.now()}`;
                    moduleState.chats = [{ id: newChatId, name: 'New Chat 1', messages: [] }];
                    moduleState.activeChatId = newChatId;
                }

                // Ensure activeChatId is valid and points to an existing chat
                if (!moduleState.activeChatId || !moduleState.chats.find(c => c.id === moduleState.activeChatId)) {
                    const lastSavedChat = moduleState.chats.filter(c => !c.isEphemeral).pop();
                    moduleState.activeChatId = lastSavedChat?.id || moduleState.chats[0]?.id || null;
                }

                allModuleData[id] = moduleState;
            });

            setModulesData(allModuleData);
        } catch (error) {
            console.error("Failed to load or migrate data from localStorage", error);
            // Optionally clear storage if it's fundamentally broken
            // localStorage.clear();
        }
    }, []);


    // --- Save state to localStorage ---
    useEffect(() => { 
        localStorage.setItem('Privatas-settings', JSON.stringify(settings)); 
        document.documentElement.setAttribute('data-theme', settings.theme);
        document.documentElement.setAttribute('data-font-size', settings.fontSize);
        document.documentElement.setAttribute('data-density', settings.density);
    }, [settings]);
    useEffect(() => { localStorage.setItem('Privatas-activeModules', JSON.stringify(activeModuleIds)); }, [activeModuleIds]);
    useEffect(() => {
        const customModulesToSave = { ...customModules };
        Object.keys(customModulesToSave).forEach(id => {
            // Icon is a function, don't save it directly
            (customModulesToSave[id] as any).Icon = 'GeneralIcon';
        });
        localStorage.setItem('Privatas-customModules', JSON.stringify(customModulesToSave));
    }, [customModules]);
    useEffect(() => {
        // Only save data for modules that actually have state
        if (modulesData[activeModule]) {
            const dataToSave = { ...modulesData[activeModule] };
            dataToSave.chats = dataToSave.chats.filter(c => !c.isEphemeral);
            // Don't save if the only chat is empty (prevents saving initial state)
            if (dataToSave.chats.length === 1 && dataToSave.chats[0].messages.length === 0 && dataToSave.attachedFiles.length === 0) {
                // If it's a new module, don't write an empty state to storage yet
                if (!localStorage.getItem(`Privatas-module-${activeModule}`)) return;
            }
            localStorage.setItem(`Privatas-module-${activeModule}`, JSON.stringify(dataToSave));
        }
    }, [modulesData, activeModule]);
    
    // --- Speech API ---
    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                const qualityVoices = voices.filter(v => 
                    (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Apple') || v.name.includes('Zira') || v.name.includes('David'))
                    && v.localService
                );
                setPreferredVoice(qualityVoices[0] || voices.find(v => v.localService) || voices[0]);
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
        
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech Recognition not supported in this browser.");
            return;
        }
        speechRecognitionRef.current = new SpeechRecognition();
        speechRecognitionRef.current.continuous = true;
        speechRecognitionRef.current.interimResults = true;
        
        speechRecognitionRef.current.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            setInput(preDictationInputRef.current + finalTranscript + interimTranscript);
        };
        speechRecognitionRef.current.onend = () => setSpeechState('idle');
        speechRecognitionRef.current.onerror = () => setSpeechState('error');

        return () => {
            // Cleanup speech synthesis
            window.speechSynthesis.onvoiceschanged = null;
            window.speechSynthesis.cancel();

            // Cleanup speech recognition
            if (speechRecognitionRef.current) {
                try {
                    speechRecognitionRef.current.stop();
                } catch (e) {
                    // Ignore errors if already stopped
                }
                speechRecognitionRef.current.onresult = null;
                speechRecognitionRef.current.onend = null;
                speechRecognitionRef.current.onerror = null;
            }

            // Cleanup audio context
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }

            // Cleanup audio source
            if (audioSourceRef.current) {
                try {
                    audioSourceRef.current.stop();
                } catch (e) {
                    // Ignore errors if already stopped
                }
                audioSourceRef.current = null;
            }

            // Cleanup abort controller
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        }
    }, []);

    const handleToggleDictation = () => {
        if (speechState === 'listening') {
            speechRecognitionRef.current?.stop();
        } else {
            preDictationInputRef.current = input;
            speechRecognitionRef.current?.start();
            setSpeechState('listening');
        }
    };

    const handleReadAloud = useCallback(async (text: string, messageId: string) => {
        // Stop currently playing audio if the same button is clicked again
        if (speechState === 'speaking' && currentlySpeakingMsgId === messageId) {
            window.speechSynthesis.cancel();
            if (audioSourceRef.current) {
                audioSourceRef.current.stop();
                audioSourceRef.current = null;
            }
            setSpeechState('idle');
            setCurrentlySpeakingMsgId(null);
            return;
        }

        // Stop any previously playing audio before starting a new one
        if (speechState === 'speaking') {
            window.speechSynthesis.cancel();
            if (audioSourceRef.current) {
                audioSourceRef.current.stop();
                audioSourceRef.current = null;
            }
        }

        const handleSynthesisError = (event: SpeechSynthesisErrorEvent) => {
            console.error("Speech synthesis error:", event);
            let errorMessage = "An unknown error occurred while trying to read the text aloud.";
            if (event.error) {
                // Fix: Cast event.error to string to handle non-standard error codes and avoid type errors.
                const errorType = event.error as string;
                switch (errorType) {
                    case 'synthesis-failed':
                        errorMessage = "The speech synthesis engine failed to process the text.";
                        break;
                    case 'language-unavailable':
                        errorMessage = "The selected language for speech synthesis is not available on your device.";
                        break;
                    case 'voice-unavailable':
                        errorMessage = "The selected voice for speech synthesis is not available.";
                        break;
                    case 'interrupted':
                        // This can happen normally, so we don't treat it as a hard error.
                        break;
                    case 'canceled':
                        // Don't show an error if we canceled it intentionally
                        return;
                    default:
                        errorMessage = `A speech synthesis error occurred: ${errorType}`;
                }
                 if (errorType !== 'interrupted' && errorType !== 'canceled') {
                    alert(`Speech synthesis error: ${errorMessage}`);
                }
            }
            setSpeechState('idle');
            setCurrentlySpeakingMsgId(null);
        };

        if (settings.enhancedVoiceMode) {
            setSpeechState('speaking');
            setCurrentlySpeakingMsgId(messageId);
            try {
                const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        input: { text },
                        voice: { languageCode: 'en-US', name: 'en-US-Neural2-D' },
                        audioConfig: { audioEncoding: 'MP3' }
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    let userMessage = errorData.error.message || 'TTS API request failed';
                    // Check for common permission-related errors from Google Cloud
                    if (userMessage.toLowerCase().includes('api has not been used') || userMessage.toLowerCase().includes('permission denied') || response.status === 403) {
                        userMessage = "Enhanced Voice feature failed. This is likely because the API key is not configured for the Google Cloud Text-to-Speech API. Please enable it in your Google Cloud project. Falling back to the standard voice.";
                        // Automatically disable the feature for this session to avoid repeated errors.
                        handleSettingsChange({ enhancedVoiceMode: false }); 
                    }
                    throw new Error(userMessage);
                }

                const data = await response.json();
                
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                }
                const audioContext = audioContextRef.current;
                
                const binaryString = window.atob(data.audioContent);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                audioContext.decodeAudioData(bytes.buffer, (buffer) => {
                    if (!audioContextRef.current) return;
                    const source = audioContextRef.current.createBufferSource();
                    source.buffer = buffer;
                    source.connect(audioContextRef.current.destination);
                    source.onended = () => {
                        if (currentlySpeakingMsgId === messageId) {
                            setSpeechState('idle');
                            setCurrentlySpeakingMsgId(null);
                        }
                        audioSourceRef.current = null;
                    };
                    source.start(0);
                    audioSourceRef.current = source;
                }, (error) => {
                    console.error('Error decoding audio data:', error);
                    alert('Failed to play enhanced voice audio due to a decoding error.');
                    setSpeechState('idle');
                    setCurrentlySpeakingMsgId(null);
                });

            } catch (error: unknown) {
                console.error('Error with Enhanced Voice Mode:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                alert(`Could not use enhanced voice: ${errorMessage}`);
                
                // Fallback to standard voice
                setSpeechState('speaking');
                setCurrentlySpeakingMsgId(messageId);
                const utterance = new SpeechSynthesisUtterance(text);
                if (preferredVoice) utterance.voice = preferredVoice;
                utterance.onend = () => { setSpeechState('idle'); setCurrentlySpeakingMsgId(null); };
                utterance.onerror = handleSynthesisError;
                window.speechSynthesis.speak(utterance);
            }
        } else {
            const utterance = new SpeechSynthesisUtterance(text);
            if (preferredVoice) utterance.voice = preferredVoice;
            utterance.onstart = () => { setSpeechState('speaking'); setCurrentlySpeakingMsgId(messageId); };
            utterance.onend = () => { setSpeechState('idle'); setCurrentlySpeakingMsgId(null); };
            utterance.onerror = handleSynthesisError;
            window.speechSynthesis.speak(utterance);
        }
    }, [speechState, currentlySpeakingMsgId, settings.enhancedVoiceMode, preferredVoice, handleSettingsChange]);

    // --- Chat & AI ---
    const handleSendMessage = useCallback(async (event?: React.FormEvent, options?: { isInitiation?: boolean; overrideContent?: { text: string; files: SanitizedFile[] } }) => {
        event?.preventDefault();

        const contentToSubmit = options?.overrideContent?.text ?? input.trim();
        const readyFiles = options?.overrideContent ? [] : attachedFiles.filter(f => f.status === 'completed');
        const filesToSubmit = options?.overrideContent?.files ?? readyFiles.map(f => ({ name: f.file.name, size: f.file.size, type: f.file.type }));
        
        if ((!contentToSubmit && filesToSubmit.length === 0 && !options?.isInitiation) || isLoading || !activeChat) return;

        const currentChatMessages = activeChat.messages;
    
        const newHistoryItems: HistoryItem[] = readyFiles.map(draftFile => ({
            id: `hist-${Date.now()}-${draftFile.file.name}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            fileName: draftFile.file.name,
            fileSize: draftFile.file.size,
            sanitizedFileName: draftFile.file.name,
            sanitizedContent: draftFile.displayContent || '',
            originalFileType: draftFile.file.type,
        }));
        
        let messagesWithUserUpdate = [...currentChatMessages];
        let userMessage: Message | null = null;
        if (!options?.isInitiation) {
            const fileContents = readyFiles.map(f => `\n\n--- Start of ${f.file.name} ---\n${f.displayContent || ''}\n--- End of ${f.file.name} ---`).join('');
            
            userMessage = { 
                id: `user-${Date.now()}`, 
                role: 'user', 
                content: contentToSubmit, 
                files: filesToSubmit.length > 0 ? filesToSubmit : undefined,
                fileContents: fileContents || undefined
            };
            messagesWithUserUpdate.push(userMessage);
        }
        
        if (!options?.overrideContent) {
            setInput('');
            updateCurrentModuleState(prev => ({
                ...prev,
                attachedFiles: [],
                sanitizationHistory: [...newHistoryItems, ...prev.sanitizationHistory]
            }));
        }
        setIsLoading(true);

        const modelMessage: Message = { id: `loading`, role: 'model', content: '' };
        
        updateCurrentModuleState(prev => ({
            ...prev,
            chats: prev.chats.map(c => c.id === activeChatId ? { ...c, messages: [...messagesWithUserUpdate, modelMessage] } : c)
        }));
    
        abortControllerRef.current = new AbortController();
    
        try {
            const systemInstruction = availableModules[activeModule]?.systemPrompt || MODULES.general.systemPrompt;
            const config: { systemInstruction: string; tools?: Array<{ googleSearch: Record<string, never> }> } = { systemInstruction };

            if (activeModule !== 'general') {
                config.tools = [{googleSearch: {}}];
            }
            
            const historyForSession = currentChatMessages
                .map(m => ({ 
                    role: m.role, 
                    parts: [{ text: (m.sanitizedContent || m.content) + (m.fileContents || '') }]
                }));

            const currentGenAIChat = ai.chats.create({ 
                model: 'gemini-2.5-flash', 
                config: config, 
                history: historyForSession 
            });

            const messageToSend = options?.isInitiation ? "Begin the intake process." : (userMessage?.content || '') + (userMessage?.fileContents || '');

            const stream = await currentGenAIChat.sendMessageStream({ message: messageToSend });
            
            let accumulatedText = '';
            let lastChunk: { text?: string; candidates?: Array<{ groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }> } }> } | null = null;
            const finalMessageId = `model-${Date.now()}`;

            updateCurrentModuleState(prev => ({
                ...prev,
                chats: prev.chats.map(c => c.id === activeChatId ? { ...c, messages: c.messages.map(m => m.id === 'loading' ? { ...m, id: finalMessageId } : m) } : c)
            }));

            // --- Throttling logic for smoother UI updates ---
            let throttleTimeout: NodeJS.Timeout | null = null;
            const THROTTLE_INTERVAL_MS = 100; // Update UI at most ~10 times per second

            for await (const chunk of stream) {
                if (abortControllerRef.current?.signal.aborted) {
                    if (throttleTimeout) clearTimeout(throttleTimeout);
                    const abortError = new Error("Request aborted by user.");
                    abortError.name = "AbortError";
                    throw abortError;
                }
                
                const text = chunk.text;
                if (typeof text === 'string') {
                    accumulatedText += text;
                }
                lastChunk = chunk;

                if (!throttleTimeout) {
                    throttleTimeout = setTimeout(() => {
                        updateCurrentModuleState(prev => ({
                            ...prev,
                            chats: prev.chats.map(c => c.id === activeChatId ? { ...c, messages: c.messages.map(m => m.id === finalMessageId ? { ...m, content: accumulatedText } : m) } : c)
                        }));
                        throttleTimeout = null;
                    }, THROTTLE_INTERVAL_MS);
                }
            }
            
            // Perform a final update to ensure the last chunk is rendered.
            if (throttleTimeout) clearTimeout(throttleTimeout);
             updateCurrentModuleState(prev => ({
                ...prev,
                chats: prev.chats.map(c => c.id === activeChatId ? { ...c, messages: c.messages.map(m => m.id === finalMessageId ? { ...m, content: accumulatedText } : m) } : c)
            }));

            if (lastChunk) {
                const groundingMetadata = lastChunk.candidates?.[0]?.groundingMetadata;
                const sources = groundingMetadata?.groundingChunks
                    ?.map((chunk) => ({
                        uri: chunk.web?.uri || '',
                        title: chunk.web?.title || 'Untitled Source'
                    }))
                    .filter((source) => source.uri);

                if (sources && sources.length > 0) {
                    updateCurrentModuleState(prev => ({
                        ...prev,
                        chats: prev.chats.map(c => c.id === activeChatId ? { ...c, messages: c.messages.map(m => m.id === finalMessageId ? { ...m, sources } : m) } : c)
                    }));
                }
            }

        } catch (error: unknown) {
            const finalMessageId = `model-${Date.now()}`;
            const errorName = error instanceof Error && 'name' in error ? (error as any).name : undefined;
            const errorMessage = error instanceof Error ? error.message : undefined;
             if (errorName !== 'AbortError') {
                console.error("Error during sendMessage:", error);
                let displayMessage = "Sorry, I encountered an error. Please try again.";
                // Improved error parsing
                if (errorMessage) {
                    try {
                        // Check for JSON error response from the API
                        const errorJson = JSON.parse(errorMessage);
                        if (errorJson.error) {
                            const { status, message } = errorJson.error;
                            if (status === 'RESOURCE_EXHAUSTED' || errorJson.error.code === 429) {
                                displayMessage = "API quota exceeded. Please check your plan and billing details.";
                            } else if (message) {
                                if (message.includes('400') && (message.includes('candidate') || message.includes('request payload'))) {
                                    displayMessage = "The provided documents may be too large or contain unsupported content. Please try again with smaller or different files.";
                                } else if (message.includes('API key not valid')) {
                                    displayMessage = "The API key is invalid. Please check your configuration.";
                                } else {
                                    displayMessage = `An API error occurred: ${status || 'Unknown'}`;
                                }
                            }
                        }
                    } catch (e) {
                        // Fallback for non-JSON errors
                         const errorString = errorMessage.toLowerCase();
                         if (errorString.includes('quota')) {
                             displayMessage = "API quota exceeded. Please check your plan and billing details.";
                         } else if (errorString.includes('api key')) {
                             displayMessage = "The API key is invalid. Please check your configuration.";
                         }
                    }
                }

                 updateCurrentModuleState(prev => ({
                    ...prev,
                    chats: prev.chats.map(c => c.id === activeChatId ? { ...c, messages: c.messages.map(m => m.id === 'loading' ? { ...m, id: finalMessageId, content: displayMessage } : m) } : c)
                }));
            } else {
                 updateCurrentModuleState(prev => ({
                    ...prev,
                    chats: prev.chats.map(c => c.id === activeChatId ? { ...c, messages: c.messages.filter(m => m.id !== 'loading') } : c)
                }));
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [input, attachedFiles, isLoading, activeModule, ai, updateCurrentModuleState, activeChat, activeChatId, availableModules]);
    
    const handleGenerateSummary = useCallback(async (chatId: string) => {
        const currentModuleState = modulesData[activeModule];
        if (!currentModuleState) return;
    
        const chat = currentModuleState.chats.find(c => c.id === chatId);
        if (!chat || chat.messages.length < 2 || (chatSummaries[chatId] && chatSummaries[chatId].summary)) return;

        setChatSummaries(prev => ({ ...prev, [chatId]: { summary: '', isLoading: true }}));

        try {
            const conversationHistory = chat.messages
                .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
                .join('\n');
            const prompt = `Summarize the following conversation in a single, concise sentence:\n\n${conversationHistory}`;
            
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
            });

            setChatSummaries(prev => ({ ...prev, [chatId]: { summary: response.text, isLoading: false }}));
        } catch (error: unknown) {
            console.error("Error generating summary:", error);
            let errorMessage = "Could not generate summary.";
            const apiError = error instanceof Error ? error.message : String(error);
            try {
                const parsedError = JSON.parse(apiError);
                if (parsedError?.error?.status === 'RESOURCE_EXHAUSTED' || parsedError?.error?.code === 429) {
                    errorMessage = "API quota exceeded.";
                }
            } catch (e) {
                 const errorString = apiError.toLowerCase();
                if (errorString.includes('429') || errorString.includes('resource_exhausted')) {
                    errorMessage = "API quota exceeded.";
                }
            }
            setChatSummaries(prev => ({ ...prev, [chatId]: { summary: errorMessage, isLoading: false }}));
        }
    }, [modulesData, activeModule, ai, chatSummaries]);


    // Auto-start conversation in a new chat
    useEffect(() => {
        if (activeModule !== 'general' && activeChat && activeChat.messages.length === 0 && !isLoading && settings.showWelcome) {
            handleSendMessage(undefined, { isInitiation: true }); // Send an empty message to trigger the AI's first question
        }
    }, [activeChat, activeModule, isLoading, settings.showWelcome, handleSendMessage]);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    const handleStartNewChat = () => {
        updateCurrentModuleState(prev => {
            const newChatId = `chat-${Date.now()}`;
            const newChat: Chat = {
                id: newChatId,
                name: isOffTheRecord ? 'Off-the-Record Chat' : `New Chat ${prev.chats.filter(c => !c.isEphemeral).length + 1}`,
                messages: [],
                isEphemeral: isOffTheRecord,
            };
            return {
                ...prev,
                chats: [...prev.chats, newChat],
                activeChatId: newChatId
            };
        });
    };
    
    const handleSwitchChat = (id: string) => {
        updateCurrentModuleState(prev => ({ ...prev, activeChatId: id }));
    };

    const handleRenameChat = useCallback((id: string, newName: string) => {
        updateCurrentModuleState(prev => {
            try {
                return {
                    ...prev,
                    chats: prev.chats.map(c => (c.id === id ? { ...c, name: newName } : c))
                };
            } catch(e) {
                console.error("Failed to rename chat:", e);
                return prev;
            }
        });
    }, [updateCurrentModuleState]);
    
    const handleDeleteChat = useCallback((id: string) => {
        updateCurrentModuleState(prev => {
            try {
                const remainingChats = prev.chats.filter(c => c.id !== id);
                let newActiveId = prev.activeChatId;
        
                if (prev.activeChatId === id) {
                    const savedChats = remainingChats.filter(c => !c.isEphemeral);
                    const lastSavedChat = savedChats[savedChats.length - 1];
                    newActiveId = lastSavedChat?.id || null;
                }
        
                if (remainingChats.filter(c => !c.isEphemeral).length === 0) {
                    const newChatId = `chat-${Date.now()}`;
                    const newChat = { id: newChatId, name: 'New Chat 1', messages: [] };
                    return { ...prev, chats: [newChat], activeChatId: newChatId };
                }
        
                return { ...prev, chats: remainingChats, activeChatId: newActiveId };
            } catch(e) {
                console.error("Failed to delete chat:", e);
                return prev;
            }
        });
    }, [updateCurrentModuleState]);
    
    const handleResetChat = useCallback(() => {
        const chatToReset = chats.find(c => c.id === activeChatId);
        if (chatToReset) {
            setConfirmModal({
                isOpen: true,
                title: 'Reset Chat',
                message: `Are you sure you want to reset "${chatToReset.name}"? All messages in this chat will be permanently deleted.`,
                confirmText: 'Reset',
                isDangerous: true,
                onConfirm: () => {
                    updateCurrentModuleState(prev => {
                        try {
                            return {
                                ...prev,
                                chats: prev.chats.map(c =>
                                    c.id === prev.activeChatId ? { ...c, messages: [] } : c
                                )
                            };
                        } catch(e) {
                            console.error("Failed to reset chat:", e);
                            return prev;
                        }
                    });
                    setConfirmModal(null);
                }
            });
        }
    }, [chats, activeChatId, updateCurrentModuleState]);
    
    const handleClearAllData = () => {
        localStorage.clear();
        window.location.reload();
    };

    const handleExportHistory = useCallback(() => {
        const currentModuleData = modulesData[activeModule];
        if (!currentModuleData) return;
        const chatsToExport = currentModuleData.chats.filter(c => !c.isEphemeral);
        const blob = new Blob([JSON.stringify(chatsToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Privatas_${activeModule}_chats_${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [modulesData, activeModule]);

    const exportToPdf = useCallback(async (elementToRender: HTMLElement, fileName: string) => {
        const renderContainer = document.createElement('div');
        renderContainer.style.position = 'fixed';
        renderContainer.style.left = '0';
        renderContainer.style.top = '0';
        renderContainer.style.zIndex = '-1';
        renderContainer.style.opacity = '0';
        renderContainer.appendChild(elementToRender);
        document.body.appendChild(renderContainer);

        try {
            const canvas = await html2canvas(elementToRender, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const { jsPDF } = jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4'
            });

            const marginTop = 50;
            const marginBottom = 50;
            const marginLeft = 40;
            const marginRight = 40;
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const contentWidth = pdfWidth - marginLeft - marginRight;
            const contentHeight = pdfHeight - marginTop - marginBottom;

            // Calculate dimensions
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const scaledWidth = contentWidth;
            const scaledHeight = (canvasHeight * contentWidth) / canvasWidth;

            // Create a temporary canvas for slicing
            const sliceCanvas = document.createElement('canvas');
            const sliceCtx = sliceCanvas.getContext('2d');
            if (!sliceCtx) throw new Error('Could not get canvas context');

            sliceCanvas.width = canvasWidth;

            // Reduce effective page height to prevent text cutoff (leave buffer at bottom)
            // Buffer should be at least 2-3 lines of text height (~60-80pt with line-height)
            const pageHeightBuffer = 80; // pixels to prevent cutting through text
            const effectiveContentHeight = contentHeight - pageHeightBuffer;

            // Calculate how many pages we need based on effective height
            const totalPages = Math.ceil(scaledHeight / effectiveContentHeight);

            for (let pageNum = 0; pageNum < totalPages; pageNum++) {
                if (pageNum > 0) {
                    pdf.addPage();
                }

                // Calculate the slice of the original canvas to use
                const sourceY = (pageNum * effectiveContentHeight * canvasHeight) / scaledHeight;
                const sourceHeight = Math.min(
                    (effectiveContentHeight * canvasHeight) / scaledHeight,
                    canvasHeight - sourceY
                );

                // Set slice canvas height for this page
                sliceCanvas.height = sourceHeight;

                // Draw the slice
                sliceCtx.clearRect(0, 0, sliceCanvas.width, sliceCanvas.height);
                sliceCtx.drawImage(
                    canvas,
                    0, sourceY,           // source x, y
                    canvasWidth, sourceHeight,  // source width, height
                    0, 0,                 // dest x, y
                    canvasWidth, sourceHeight   // dest width, height
                );

                // Convert slice to image and add to PDF
                const sliceImgData = sliceCanvas.toDataURL('image/png');
                const sliceScaledHeight = (sourceHeight * contentWidth) / canvasWidth;

                pdf.addImage(
                    sliceImgData,
                    'PNG',
                    marginLeft,
                    marginTop,
                    contentWidth,
                    sliceScaledHeight
                );
            }

            pdf.save(fileName);
        } catch (e) {
            console.error("PDF export failed", e);
            alert("Sorry, there was an error exporting the PDF.");
        } finally {
            if (document.body.contains(renderContainer)) {
                document.body.removeChild(renderContainer);
            }
        }
    }, []);

    const handleExportChat = useCallback(async (chatId: string, format: 'pdf' | 'txt') => {
        const chat = chats.find(c => c.id === chatId);
        if (!chat) return;

        if (format === 'txt') {
            const content = chat.messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}:\n${m.content}\n\n`).join('');
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${chat.name}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        } else if (format === 'pdf') {
            const renderContent = document.createElement('div');
            renderContent.style.width = '515px'; // A4 width minus margins (595 - 80)
            renderContent.style.color = 'black';
            renderContent.style.background = 'white';
            renderContent.style.padding = '20px';
            renderContent.style.boxSizing = 'border-box';

            const content = chat.messages.map(m => {
                const align = m.role === 'user' ? 'right' : 'left';
                const role = m.role.charAt(0).toUpperCase() + m.role.slice(1);
                return `<div style="text-align: ${align}; margin-bottom: 20px; font-family: Inter, sans-serif; font-size: 11pt; line-height: 1.6; page-break-inside: avoid;">
                    <strong style="font-weight: 600; display: block; margin-bottom: 6px;">${role}</strong>
                    <p style="white-space: pre-wrap; word-wrap: break-word; margin: 0; line-height: 1.7;">${escapeHtml(m.content)}</p>
                </div>`;
            }).join('');

            renderContent.innerHTML = content;
            await exportToPdf(renderContent, `${chat.name}.pdf`);
        }
    }, [chats, exportToPdf]);

    const handleExportBrief = useCallback(async (briefMarkdown: string) => {
        if (!activeChat) return;
        const briefContent = briefMarkdown.replace(/^# Executive Brief\s*/, '');
        const htmlContent = parseMarkdownToHtmlForPdf(briefContent);

        const briefContainer = document.createElement('div');
        briefContainer.style.width = '515px'; // A4 width minus margins
        briefContainer.style.fontFamily = 'Times, "Times New Roman", serif';
        briefContainer.style.color = 'black';
        briefContainer.style.background = 'white';
        briefContainer.style.fontSize = '12pt';
        briefContainer.style.lineHeight = '1.6';
        briefContainer.style.padding = '20px';
        briefContainer.style.boxSizing = 'border-box';

        briefContainer.innerHTML = `
            <div style="font-family: 'Playfair Display', serif; font-size: 24pt; font-weight: bold; margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px; line-height: 1.3;">Executive Brief</div>
            <div style="line-height: 1.7;">${htmlContent}</div>
        `;

        await exportToPdf(briefContainer, `Executive Brief - ${activeChat.name}.pdf`);
    }, [activeChat, exportToPdf]);

    const handleStop = useCallback(() => { abortControllerRef.current?.abort(); }, []);
    
    const processFiles = useCallback(async (files: DraftFile[]) => {
        for (const draftFile of files) {
            const SIZE_LIMIT_MB = 10;
            const SIZE_LIMIT_BYTES = SIZE_LIMIT_MB * 1024 * 1024;
            if (draftFile.file.size > SIZE_LIMIT_BYTES) {
                updateCurrentModuleState(prev => ({
                    ...prev,
                    attachedFiles: prev.attachedFiles.map(f =>
                        f.id === draftFile.id
                            ? { ...f, status: 'error', error: `File exceeds ${SIZE_LIMIT_MB}MB limit. Please use a smaller file.` }
                            : f
                    )
                }));
                continue; 
            }
             try {
                const { file } = draftFile;
                const { type } = file;
                let textContent = `File type ${type} is not previewable. It will be sanitized upon sending.`;
                let imageUrl: string | undefined = undefined;

                if (type === 'application/pdf') {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                    const numPages = pdf.numPages;

                    updateCurrentModuleState(prev => ({
                        ...prev,
                        attachedFiles: prev.attachedFiles.map(f =>
                            f.id === draftFile.id ? { ...f, progress: { processed: 0, total: numPages } } : f
                        )
                    }));
                    
                    let fullText = '';
                    const PAGE_LIMIT = 50; // Set a reasonable limit to prevent browser crashes
                    const pagesToProcess = Math.min(numPages, PAGE_LIMIT);

                    for (let i = 1; i <= pagesToProcess; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        fullText += content.items.map((item: { str: string }) => item.str).join(' ') + '\n';
                        
                        // Throttle state updates to avoid overwhelming React
                        if (i % 5 === 0 || i === pagesToProcess) {
                            updateCurrentModuleState(prev => ({
                                ...prev,
                                attachedFiles: prev.attachedFiles.map(f =>
                                    f.id === draftFile.id ? { ...f, progress: { processed: i, total: pagesToProcess } } : f
                                )
                            }));
                        }
                    }

                    if (numPages > PAGE_LIMIT) {
                        fullText += `\n\n--- [DOCUMENT TRUNCATED] ---\nOnly the first ${PAGE_LIMIT} pages of this ${numPages}-page document were processed to ensure browser stability.`;
                    }
                    textContent = fullText;
                } else if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                    const arrayBuffer = await file.arrayBuffer();
                    const result = await mammoth.extractRawText({ arrayBuffer });
                    textContent = result.value;
                } else if (type.startsWith('image/')) {
                    imageUrl = URL.createObjectURL(file);
                    const { data: { text } } = await Tesseract.recognize(file, 'eng');
                    textContent = text;
                } else if (type.startsWith('text/')) {
                    textContent = await file.text();
                }

                const attemptedTextExtraction = type === 'application/pdf' ||
                    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                    type.startsWith('image/') ||
                    type.startsWith('text/');

                if (attemptedTextExtraction && (!textContent || !textContent.trim())) {
                    throw new Error("No text could be extracted from this file.");
                }
                
                const initialDisplayContent = sanitizeText(textContent, settings.defaultSanitizationMode);

                updateCurrentModuleState(prev => ({
                    ...prev,
                    attachedFiles: prev.attachedFiles.map(f =>
                        f.id === draftFile.id
                            ? {
                                ...f,
                                status: 'completed',
                                originalContent: textContent,
                                displayContent: initialDisplayContent,
                                originalImage: imageUrl,
                                progress: undefined, // Clear progress
                            }
                            : f
                )}));

            } catch (error: unknown) {
                console.error(`Error processing file ${draftFile.file.name}:`, error);
                const errorMsg = error instanceof Error ? error.message : 'Failed to process file';
                updateCurrentModuleState(prev => ({
                    ...prev,
                    attachedFiles: prev.attachedFiles.map(f =>
                        f.id === draftFile.id
                            ? { ...f, status: 'error', error: errorMsg, progress: undefined }
                            : f
                )}));
            }
        }
    }, [settings.defaultSanitizationMode, updateCurrentModuleState]);

    const addFilesToDraft = useCallback(async (files: File[]) => {
        const validatedFiles: DraftFile[] = [];
        const rejectedFiles: { name: string; errors: string[] }[] = [];

        // Validate each file before adding
        for (const file of files) {
            const validation = await validateFile(file);

            if (validation.isValid) {
                validatedFiles.push({
                    id: `draft-${Date.now()}-${Math.random()}`,
                    file,
                    status: 'processing',
                    sanitizationMode: settings.defaultSanitizationMode,
                });
            } else {
                rejectedFiles.push({
                    name: file.name,
                    errors: validation.errors
                });
            }
        }

        // Show errors for rejected files
        if (rejectedFiles.length > 0) {
            const errorMessage = rejectedFiles
                .map(f => `${f.name}:\n${f.errors.join('\n')}`)
                .join('\n\n');

            alert(`⚠️ File Validation Failed\n\n${errorMessage}`);
        }

        // Only add valid files
        if (validatedFiles.length > 0) {
            updateCurrentModuleState(prev => ({...prev, attachedFiles: [...validatedFiles, ...prev.attachedFiles]}));
            processFiles(validatedFiles);
        }
    }, [settings.defaultSanitizationMode, updateCurrentModuleState, processFiles]);


    const removeDraftFile = useCallback((id: string) => {
        updateCurrentModuleState(prev => {
            const fileToRemove = prev.attachedFiles.find(f => f.id === id);
            if (fileToRemove?.originalImage) {
                URL.revokeObjectURL(fileToRemove.originalImage);
            }
            return {...prev, attachedFiles: prev.attachedFiles.filter(f => f.id !== id)};
        })
    }, [updateCurrentModuleState]);
    
     const handleSanitizationAction = useCallback((id: string, mode: SanitizationMode) => {
        const currentFiles = attachedFiles;
        const targetFile = currentFiles.find(f => f.id === id);
        if (!targetFile) return;

        // Handle selection-based sanitization
        if (activeSelection && activeSelection.draftId === id) {
            const { start, end } = activeSelection;
            const currentText = targetFile.displayContent || '';
            const selectedText = currentText.substring(start, end);

            if (mode === 'none') {
                setActiveSelection(null);
                return;
            }

            let replacement = '';
            if (mode === 'tokenize') {
                const piiType = 'REDACTED';
                replacement = `[${piiType}_MANUAL]`;
            } else if (mode === 'redact') {
                replacement = '█'.repeat(selectedText.length);
            } else if (mode === 'delete') {
                replacement = '';
            }

            const newDisplayContent = currentText.substring(0, start) + replacement + currentText.substring(end);
            setActiveSelection(null);

            updateCurrentModuleState(prev => ({
                ...prev,
                attachedFiles: prev.attachedFiles.map(f => f.id === id ? { ...f, displayContent: newDisplayContent, manuallyEdited: true } : f)
            }));
            return;
        }

        // Handle document-wide sanitization with confirmation if manually edited
        const applySanitization = () => {
            updateCurrentModuleState(prev => {
                const newFiles = prev.attachedFiles.map(f => {
                    if (f.id === id && typeof f.originalContent === 'string') {
                        const newDisplayContent = sanitizeText(f.originalContent, mode);
                        return { ...f, sanitizationMode: mode, displayContent: newDisplayContent, manuallyEdited: mode === 'none' ? false : f.manuallyEdited };
                    }
                    return f;
                });
                return {...prev, attachedFiles: newFiles };
            });
        };

        if (targetFile.manuallyEdited) {
            const confirmMessage = mode === 'none'
                ? "This will revert the document to its original state, removing all sanitization and manual edits. Are you sure?"
                : "Applying a new document-wide mode will overwrite your manual edits. Are you sure you want to proceed?";

            setConfirmModal({
                isOpen: true,
                title: 'Overwrite Manual Edits',
                message: confirmMessage,
                confirmText: mode === 'none' ? 'Revert' : 'Apply',
                isDangerous: true,
                onConfirm: () => {
                    applySanitization();
                    setConfirmModal(null);
                }
            });
        } else {
            applySanitization();
        }
    }, [attachedFiles, activeSelection, updateCurrentModuleState]);

    const handleDraftDisplayContentChange = (id: string, newContent: string) => {
        updateCurrentModuleState(prev => ({...prev, attachedFiles: prev.attachedFiles.map(f => f.id === id ? { ...f, displayContent: newContent, manuallyEdited: true } : f)}));
    };

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) { addFilesToDraft(Array.from(e.target.files)); } }, [addFilesToDraft]);
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) { addFilesToDraft(Array.from(e.dataTransfer.files)); } }, [addFilesToDraft]);
    
    const handleTextareaMouseUp = useCallback((e: React.MouseEvent<HTMLTextAreaElement>, draftId: string) => {
        e.stopPropagation();
        const textarea = e.currentTarget;
        if (textarea.selectionStart !== textarea.selectionEnd) {
            setActiveSelection({ draftId, start: textarea.selectionStart, end: textarea.selectionEnd });
        } else {
            setActiveSelection(null);
        }
    }, []);

    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => { const pastedText = e.clipboardData.getData('text'); if (pastedText.length > 250) { e.preventDefault(); setPastePrompt({ visible: true, text: pastedText }); } }, []);
    
    const handleDownloadSanitizedFile = useCallback((item: HistoryItem) => {
        const blob = new Blob([item.sanitizedContent || ''], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `sanitized-${item.fileName.split('.').slice(0, -1).join('.')}.txt`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    }, []);

    const handleClearSanitizationHistory = useCallback(() => {
        setConfirmModal({
            isOpen: true,
            title: 'Clear Sanitization History',
            message: "Are you sure you want to clear the sanitization history for this module? This action cannot be undone.",
            confirmText: 'Clear',
            isDangerous: true,
            onConfirm: () => {
                updateCurrentModuleState(prev => ({ ...prev, sanitizationHistory: [] }));
                setConfirmModal(null);
            }
        });
    }, [updateCurrentModuleState]);
    
    const handleSelectModule = (moduleId: string) => { 
        setActiveModule(moduleId); 
        setIsLeftSidebarOpen(false);
    };
    
    const handleAddModule = (moduleId: string) => {
        if (!activeModuleIds.includes(moduleId)) {
            setActiveModuleIds(prev => [...prev, moduleId]);
            setModulesData(prevData => {
                if (prevData[moduleId]) return prevData;
                const newModuleState = getInitialModuleState();
                const newChat: Chat = {
                    id: `chat-${Date.now()}`,
                    name: `New Chat 1`,
                    messages: [],
                };
                 newModuleState.chats = [newChat];
                 newModuleState.activeChatId = newChat.id;
                return { ...prevData, [moduleId]: newModuleState };
            });
        }
    };
    
    const handleRemoveModule = (moduleId: string) => { 
        if (moduleId === 'general') return; 
        setActiveModuleIds(prev => prev.filter(id => id !== moduleId)); 
        if (activeModule === moduleId) { 
            setActiveModule('general'); 
        } 
    };
    
    const handleDeleteCustomModule = useCallback((moduleId: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Custom Module',
            message: "Are you sure you want to permanently delete this custom module? This action cannot be undone.",
            confirmText: 'Delete',
            isDangerous: true,
            onConfirm: () => {
                if (activeModule === moduleId) {
                    setActiveModule('general');
                }
                setActiveModuleIds(prev => prev.filter(id => id !== moduleId));
                setCustomModules(prev => {
                    const newCustom = { ...prev };
                    delete newCustom[moduleId];
                    return newCustom;
                });
                setModulesData(prev => {
                    const newData = { ...prev };
                    delete newData[moduleId];
                    return newData;
                });
                localStorage.removeItem(`Privatas-module-${moduleId}`);
                setConfirmModal(null);
            }
        });
    }, [activeModule]);

    const handleCreateCustomModule = async (name: string, goal: string) => {
        setIsCreatingModule(true);
        try {
            const metaPrompt = `You are an AI assistant that designs system prompts for other AI assistants. Your task is to generate a comprehensive system prompt based on a user-provided module name and goal.

The generated system prompt MUST follow a strict state machine workflow. It must also intelligently determine if asking for file uploads (e.g., documents, images for text extraction) would be beneficial for the given goal, and if so, include appropriate questions in the intake phase.

**IMPORTANT CONSTRAINTS:** 
- The AI's conversational responses (confirmations, etc.) MUST NOT use Markdown formatting like asterisks.
- Your response must contain ONLY the question text. Do NOT add any other text, characters, or commentary.
- NEVER ask for video files. Only ask for image files if the goal is to extract text from them.

The output MUST be a valid JSON object with two keys: "description" (a concise, one-sentence description of the module) and "systemPrompt" (the full system prompt).

Here is the template for the system prompt you must generate. You need to fill in the placeholders [MODULE_NAME], [QUESTIONS_LIST], and [BRIEF_SECTIONS].

--- PROMPT TEMPLATE START ---
You are a world-class expert assistant called [MODULE_NAME].

**Your Workflow is a State Machine. Follow it precisely.**

**FORMATTING RULES:** During the INTRODUCTION, INTAKE, and CONFIRMATION states, you MUST use plain text only. Do NOT use markdown formatting (e.g., no asterisks).

**STATE: INTRODUCTION**
Introduce yourself as the [MODULE_NAME] module. Explain that you will ask a series of questions to gather necessary information. Then, you MUST ask the user: "Are you ready to begin?".

**STATE: INTAKE - CORE QUESTIONS**
ONLY after the user confirms, begin the intake. Ask the following questions IN ORDER, ONE question per turn.

**RESPONSE LOGIC:**
- **If the user answers your question:** Your response MUST follow this exact format:
    1. A single line with the EXACT prefix "Confirmation: " followed by a corrected and concisely rephased summary of the user's answer. Fix any typos or grammatical errors.
    2. A single, empty line.
    3. The single, next question from the list. Your response must contain ONLY the question text. Do NOT add any other text, characters, or commentary.
- **If the user asks a question instead of answering:** You MUST first answer their question helpfully and conversationally. Then, you MUST re-ask your original, unanswered question to get the intake process back on track. For example: "That's a great question. [Provide a helpful answer]. To continue, [Re-ask your original question]."

**IMPORTANT DOCUMENT UPLOAD FLOW:**
1. If a question asks about providing or uploading a document and the user's response is affirmative (e.g., "yes", "I can"), your response MUST be ONLY the following text: "Please upload the document now. You can drag and drop the file into the application window or use the 'Attach Files' button. Remember to review and redact any sensitive information before sending." Do not proceed to the next question.
2. After you have sent the upload prompt, the user's next message will contain the file content, framed by "--- Start of [FILENAME] ---". When you receive this, your response MUST be in this exact format: "Confirmation: [FILENAME] received", followed by a blank line, and then the next question from your list. Do not confirm the content of the file.

The questions are:
[QUESTIONS_LIST]

After the last question from the list above has been answered, you MUST ask the following question as the final step of the core intake process: "To provide the most accurate analysis, are there any additional documents you would like to provide for more context? Please remember to sanitize any sensitive information before uploading." This question should also trigger the Document Upload Flow if the user responds affirmatively.

**STATE: INTAKE - ADAPTIVE PROBING**
Once ALL core questions are answered, you may ask UP TO TWO relevant adaptive follow-up questions, one at a time, following the same strict response format as a normal answer.

**STATE: CONFIRMATION**
After intake is complete, you MUST ask for confirmation with this EXACT phrase: "I have the initial details needed. Shall I proceed with generating your executive brief?"

**STATE: BRIEFING**
ONLY after the user confirms, your SOLE task is to generate the "Executive Brief". You MUST use Google Search grounding extensively to provide a detailed, data-driven analysis. The brief MUST be comprehensive and actionable, and it MUST start with "# Executive Brief". Your response MUST be limited to the brief itself. Do NOT include any conversational text or explanations before or after the brief.
Your brief MUST include:
- A Header with Chat Name, Date, Confidence Score, and Data Completeness.
- An Executive Summary (≤5 bullets).
[BRIEF_SECTIONS]
- A "What We Still Need" section.
- A "Sources" section. You MUST NOT list the URLs here. Simply write "The following sources were consulted for this brief and are listed below."

**STATE: FOLLOW-UP**
After the brief, handle follow-up questions conversationally.
--- PROMPT TEMPLATE END ---

Now, based on the following user input, generate the JSON object:

Module Name: "${name}"
Module Goal: "${goal}"`;
            
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: metaPrompt,
                config: {
                    responseMimeType: "application/json",
                },
            });
            const text = response.text;
            const resultJson = JSON.parse(text);
            const { systemPrompt, description } = resultJson;

            if (!systemPrompt || !description) {
                throw new Error("Invalid response from model for system prompt.");
            }
            
            const iconMetaPrompt = `You are a minimalist SVG icon designer. Based on the following module name and goal, create the inner content for a 24x24 SVG icon.

**RULES:**
1.  The output MUST be ONLY the SVG path(s) and shape(s) (e.g., <path ... />, <circle ... />).
2.  Do NOT include the opening or closing <svg> tags.
3.  The icon should be a simple, single-color line drawing.
4.  Use stroke="currentColor", stroke-width="2", stroke-linecap="round", and stroke-linejoin="round" for all elements. Do NOT use fill attributes.
5.  The design must fit within a 24x24 viewBox.
6.  The design should be abstract but thematically related to the module's goal.

**Module Name:** "${name}"
**Module Goal:** "${goal}"

**Example for "Private Aviation":**
<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>

**Generate the SVG content now:**`;
            
            const iconResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: iconMetaPrompt,
            });

            // Extract and validate SVG content
            const rawSvgContent = extractSvgFromResponse(iconResponse.text);

            // Wrap in svg tag for validation (AI returns only inner content)
            const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">${rawSvgContent}</svg>`;

            const svgValidation = validateSvgContent(fullSvg);

            if (!svgValidation.isValid) {
                console.error('SVG validation failed:', svgValidation.errors);
                throw new Error(`Invalid or dangerous SVG content: ${svgValidation.errors.join(', ')}`);
            }

            // Use the sanitized SVG content (extract inner content again)
            const sanitizedSvgDoc = new DOMParser().parseFromString(svgValidation.sanitizedSvg || fullSvg, 'image/svg+xml');
            const svgElement = sanitizedSvgDoc.documentElement;
            const svgIconContent = Array.from(svgElement.children)
                .map(child => new XMLSerializer().serializeToString(child))
                .join('');

            const id = `custom-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
            const newModule: Module = {
                id,
                name,
                Icon: GeneralIcon, // Fallback icon
                systemPrompt,
                description,
                isCustom: true,
                svgIconContent,
            };
            setCustomModules(prev => ({ ...prev, [id]: newModule }));
            handleAddModule(id); // Use handleAddModule to ensure state is initialized correctly
            setActiveModule(id);
            setIsCreateModuleOpen(false);

        } catch (error) {
            console.error("Failed to create custom module:", error);
            alert("Sorry, there was an error creating the module. The AI may have returned an invalid format. Please try again.");
        } finally {
            setIsCreatingModule(false);
        }
    };
    
    const handleLaunch = useCallback((query: string) => {
        setAppLaunched(true);
        setInitialQuery(query);
    }, []);

    const handleLaunchWithFiles = useCallback((files: File[]) => {
        setAppLaunched(true);
        setInitialFiles(files);
    }, []);

    useEffect(() => {
        if (initialFiles && appLaunched) {
            addFilesToDraft(initialFiles);
            setInitialFiles(null);
        }
    }, [initialFiles, appLaunched, addFilesToDraft]);

    useEffect(() => {
        if (initialQuery && appLaunched && !isLoading) {
            const processInitialQuery = () => {
                handleSendMessage(undefined, { 
                    overrideContent: { text: initialQuery, files: [] } 
                });
                setInitialQuery(null);
            };
            if (activeModule !== 'general') {
                setActiveModule('general');
            } else {
                processInitialQuery();
            }
        }
    }, [initialQuery, appLaunched, isLoading, activeModule, handleSendMessage]);

    useEffect(() => {
        if (initialQuery && appLaunched && !isLoading && activeModule === 'general') {
             handleSendMessage(undefined, { 
                overrideContent: { text: initialQuery, files: [] } 
            });
            setInitialQuery(null);
        }
    }, [activeModule, initialQuery, appLaunched, isLoading, handleSendMessage]);
    

    return (
        <>
            {appLaunched ? (
                <div className="w-full h-screen flex" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                    {isDragging && <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center text-white text-xl font-bold backdrop-blur-sm">Drop files anywhere to attach</div>}
                    
                    {isLeftSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsLeftSidebarOpen(false)}></div>}
                    
                    <div className={`fixed lg:relative top-0 left-0 h-full w-24 bg-[var(--background)] z-40 transition-transform ${isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                        <ModuleSidebar 
                            activeModule={activeModule} 
                            onSelectModule={handleSelectModule}
                            activeModuleIds={activeModuleIds}
                            onOpenLibrary={() => setIsLibraryOpen(true)}
                            availableModules={availableModules}
                        />
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center p-2 sm:p-4 max-w-full overflow-hidden">
                        <header className="w-full max-w-4xl flex justify-between items-center pb-4 border-b border-[var(--surface-border)] flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setIsLeftSidebarOpen(true)} className="lg:hidden p-2 rounded-md hover:bg-[var(--surface-1)]"><MenuIcon /></button>
                                <ChatManager 
                                    chats={chats} 
                                    activeChatId={activeChatId}
                                    onSwitch={handleSwitchChat}
                                    onNew={handleStartNewChat}
                                    onRename={handleRenameChat}
                                    onDelete={handleDeleteChat}
                                    isOffTheRecord={isOffTheRecord}
                                    onSetOffTheRecord={setIsOffTheRecord}
                                    onExport={handleExportChat}
                                    onGenerateSummary={handleGenerateSummary}
                                    chatSummaries={chatSummaries}
                                />
                                <button onClick={handleResetChat} title="Reset chat" aria-label="Reset Chat" className="p-1.5 rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--danger)]">
                                    <ResetIcon />
                                </button>
                            </div>
                             <div className="flex items-center gap-2">
                                <button onClick={() => setIsRightSidebarOpen(true)} className="lg:hidden p-2 rounded-md hover:bg-[var(--surface-1)]"><PanelRightIcon /></button>
                             </div>
                        </header>
                        
                        <main className="w-full max-w-4xl flex-1 overflow-y-auto chat-scroll-area custom-scrollbar pr-2 -mr-2 pt-4">
                            <div className="pb-4 chat-message-spacing">
                                {messages.map(msg => (
                                   <AIErrorBoundary key={msg.id}>
                                       <ChatMessage message={msg} onReadAloud={handleReadAloud} isSpeaking={currentlySpeakingMsgId === msg.id} onExportBrief={handleExportBrief} />
                                   </AIErrorBoundary>
                                ))}
                                 {isLoading && !messages.find(m => m.id === 'loading') && (
                                    <AIErrorBoundary key="loading">
                                        <ChatMessage message={{id: 'loading', role: 'model', content: ''}} onReadAloud={() => {}} isSpeaking={false} onExportBrief={() => {}} />
                                    </AIErrorBoundary>
                                )}
                                <div ref={chatEndRef} />
                            </div>
                        </main>
                        
                        <footer className="w-full max-w-4xl pt-4">
                            <ChatInputBar
                                input={input}
                                setInput={setInput}
                                onSendMessage={handleSendMessage}
                                onFileChange={handleFileChange}
                                onToggleDictation={handleToggleDictation}
                                isLoading={isLoading}
                                onStop={handleStop}
                                settings={settings}
                                speechState={speechState}
                                fileInputRef={fileInputRef}
                                textareaRef={textareaRef}
                                attachedFileCount={attachedFiles.length}
                                onPaste={handlePaste}
                            />
                        </footer>
                    </div>

                     {isRightSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsRightSidebarOpen(false)}></div>}
                    
                     <div className={`fixed lg:relative top-0 right-0 h-full w-full max-w-sm lg:w-[450px] bg-[var(--background)] z-40 transition-transform ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0`}>
                        <FileProcessingErrorBoundary>
                            <RightSidebar
                                onOpenSettings={() => setIsSettingsOpen(true)}
                                onShowPage={setActiveOverlayPage}
                                drafts={attachedFiles}
                                onRemoveDraft={removeDraftFile}
                                onSanitizeDraft={handleSanitizationAction}
                                onDraftContentChange={handleDraftDisplayContentChange}
                                onTextareaMouseUp={handleTextareaMouseUp}
                                activeSelection={activeSelection}
                                sanitizationHistory={sanitizationHistory}
                                onDownloadHistoryItem={handleDownloadSanitizedFile}
                                onClearSanitizationHistory={handleClearSanitizationHistory}
                            />
                        </FileProcessingErrorBoundary>
                     </div>

                     <SettingsModal 
                        isOpen={isSettingsOpen} 
                        onClose={closeSettingsModal}
                        settings={settings}
                        onSettingsChange={handleSettingsChange}
                        onClearAllData={handleClearAllData}
                        onExportHistory={handleExportHistory}
                     />
                     <ModuleLibraryModal 
                        isOpen={isLibraryOpen}
                        onClose={() => setIsLibraryOpen(false)}
                        activeModuleIds={activeModuleIds}
                        onAddModule={handleAddModule}
                        onRemoveModule={handleRemoveModule}
                        onDeleteCustomModule={handleDeleteCustomModule}
                        availableModules={availableModules}
                        onOpenCreator={() => { setIsLibraryOpen(false); setIsCreateModuleOpen(true); }}
                        onOpenContactForm={() => { setIsLibraryOpen(false); setIsContactFormOpen(true); }}
                     />
                      <CustomModuleCreatorModal
                        isOpen={isCreateModuleOpen}
                        onClose={() => setIsCreateModuleOpen(false)}
                        onCreate={handleCreateCustomModule}
                        isCreating={isCreatingModule}
                    />
                     {pastePrompt.visible && <PastePromptModal 
                        onTokenize={() => {
                            const newDraftFile: DraftFile = {
                                id: `draft-paste-${Date.now()}`,
                                file: new File([pastePrompt.text], 'pasted_text.txt', { type: 'text/plain' }),
                                status: 'completed',
                                sanitizationMode: settings.defaultSanitizationMode,
                                originalContent: pastePrompt.text,
                                displayContent: sanitizeText(pastePrompt.text, settings.defaultSanitizationMode)
                            };
                            updateCurrentModuleState(prev => ({...prev, attachedFiles: [newDraftFile, ...prev.attachedFiles]}));
                            setPastePrompt({ visible: false, text: '' });
                        }}
                        onPasteAsIs={() => {
                            setInput(prev => prev + pastePrompt.text);
                            setPastePrompt({ visible: false, text: '' });
                        }}
                     />}
                     <ContactFormModal isOpen={isContactFormOpen} onClose={() => setIsContactFormOpen(false)} />
                </div>
            ) : (
                <LandingPage onLaunch={handleLaunch} onLaunchWithFiles={handleLaunchWithFiles} onShowPage={setActiveOverlayPage} onOpenAuthModal={openAuthModal} onOpenSettings={() => setIsSettingsOpen(true)} />
            )}

            {activeOverlayPage && (
                <Suspense fallback={
                    <div className="fixed inset-0 bg-[var(--background)] z-50 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <AnimatedDots className="bg-[var(--accent)]" />
                            <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
                        </div>
                    </div>
                }>
                    {activeOverlayPage === 'plans' && <PlansPage onClose={() => setActiveOverlayPage(null)} />}
                    {activeOverlayPage === 'help' && <HelpCenterPage onClose={() => setActiveOverlayPage(null)} />}
                    {activeOverlayPage === 'releases' && <ReleaseNotesPage onClose={() => setActiveOverlayPage(null)} />}
                    {activeOverlayPage === 'terms' && <TermsPage onClose={() => setActiveOverlayPage(null)} />}
                    {activeOverlayPage === 'faq' && <FAQPage onClose={() => setActiveOverlayPage(null)} />}
                </Suspense>
            )}
            
            <AuthModal
                isOpen={authModalState.isOpen}
                onClose={closeAuthModal}
                initialMode={authModalState.mode}
            />

            {confirmModal && (
                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal(null)}
                    onConfirm={confirmModal.onConfirm}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    confirmText={confirmModal.confirmText}
                    isDangerous={confirmModal.isDangerous}
                />
            )}
        </>
    );
};

export default App;