
import React, { useState, useRef, useEffect } from 'react';
import { OverlayPage, Settings, SpeechState } from '../../types';
import { MoonIcon, QuestionIcon } from '../../icons';
import { ChatInputBar } from '../chat/ChatInputBar';
import { HelpDropdown } from '../ui/Dropdown';
import { UserProfileMenu } from '../ui/UserProfileMenu';
import { useAuth } from '../../contexts/AuthContext';

export const LandingPage: React.FC<{
    onLaunch: (initialQuery: string) => void;
    onLaunchWithFiles: (files: File[]) => void;
    onShowPage: (page: OverlayPage) => void;
    onOpenAuthModal: (mode: 'login' | 'signup') => void;
    onOpenSettings: () => void;
}> = ({ onLaunch, onLaunchWithFiles, onShowPage, onOpenAuthModal, onOpenSettings }) => {
    const { user } = useAuth();
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [speechState, setSpeechState] = useState<SpeechState>('idle');
    const speechRecognitionRef = useRef<any>(null);
    const preDictationInputRef = useRef('');

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);
    
    useEffect(() => {
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
        };
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

    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (input.trim()) {
            onLaunch(input.trim());
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onLaunchWithFiles(Array.from(e.target.files));
        }
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onLaunchWithFiles(Array.from(e.dataTransfer.files));
        }
    };

    return (
        <div
            className="w-full h-full flex flex-col items-center justify-center p-4 animated-background relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {isDragging && <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center text-white text-xl font-bold backdrop-blur-sm">Drop files to launch Privatas</div>}
            
            <header className="absolute top-0 right-0 p-4 sm:p-6 flex items-center gap-2 sm:gap-4 z-10">
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
                    <>
                        <button onClick={() => onOpenAuthModal('login')} className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors">Log in</button>
                        <button onClick={() => onOpenAuthModal('signup')} className="text-sm font-semibold bg-white text-black px-3 sm:px-4 py-2 rounded-md hover:opacity-90 transition-opacity">Sign up for free</button>
                        <div className="relative">
                            <button onClick={() => setIsHelpOpen(o => !o)} title="Help" className="p-1 rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)] transition-colors">
                                <QuestionIcon className="h-6 w-6" />
                            </button>
                            <HelpDropdown isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} onShowPage={onShowPage} />
                        </div>
                    </>
                )}
            </header>
            
            <div className="flex flex-col items-center text-center w-full max-w-md lg:max-w-3xl px-4">
                <div className="mb-4 text-[var(--accent)] floating-icon">
                    <MoonIcon className="h-16 w-16 sm:h-20 sm:w-20" />
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold mb-2 text-[var(--text-primary)]">Privatas</h1>
                <p className="text-lg sm:text-xl text-[var(--text-secondary)] mb-10">
                    AI, reimagined for privacy.
                </p>
                 <div className="w-full">
                     <ChatInputBar
                        input={input}
                        setInput={setInput}
                        onSendMessage={handleSendMessage}
                        onFileChange={handleFileChange}
                        onToggleDictation={handleToggleDictation}
                        isLoading={false}
                        onStop={() => {}}
                        settings={{enterToSend: true} as Settings}
                        speechState={speechState}
                        fileInputRef={fileInputRef}
                        textareaRef={textareaRef}
                        attachedFileCount={0}
                        onPaste={() => {}}
                        isLanding={true}
                    />
                </div>
            </div>

            <footer className="absolute bottom-0 p-4 text-center text-xs text-[var(--text-secondary)]">
                By messaging Privatas, you agree to our{' '}
                <button onClick={() => onShowPage('terms')} className="underline hover:text-[var(--text-primary)]">Terms</button>{' '}
                and have read our{' '}
                <button onClick={() => onShowPage('terms')} className="underline hover:text-[var(--text-primary)]">Privacy Policy</button>.
            </footer>
        </div>
    );
};
