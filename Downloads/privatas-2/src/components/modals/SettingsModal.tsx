
import React, { useState, useEffect } from 'react';
import { Settings, SanitizationMode } from '../../types';
import { CloseIcon } from '../../icons';
import { ConfirmModal } from './ConfirmModal';

const SettingRow: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="flex flex-col gap-2">
        <label className="font-semibold text-sm">{title}</label>
        {children}
    </div>
);

const OptionButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button onClick={onClick} className={`w-full p-2 rounded-md border-2 text-sm transition-colors ${active ? 'border-[var(--accent)]' : 'border-[var(--surface-1)] hover:border-[var(--surface-2)]'}`}>
        {children}
    </button>
);

export const SettingsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    settings: Settings;
    onSettingsChange: (newSettings: Partial<Settings>) => void;
    onClearAllData: () => void;
    onExportHistory: () => void;
}> = ({ isOpen, onClose, settings, onSettingsChange, onClearAllData, onExportHistory }) => {
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleClearData = () => {
        setShowConfirm(true);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={onClose}>
                <div className="bg-[var(--background)] p-6 rounded-lg shadow-xl w-full max-w-lg border border-[var(--surface-border)] flex flex-col gap-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-serif font-bold">Settings</h2>
                        <button onClick={onClose} aria-label="Close settings" title="Close settings" className="p-1 rounded-full hover:bg-[var(--surface-1)]"><CloseIcon className="h-6 w-6" /></button>
                    </div>
                
                <SettingRow title="Color Scheme">
                    <div className="flex gap-2">
                        <OptionButton active={settings.theme === 'eclipse'} onClick={() => onSettingsChange({ theme: 'eclipse' })}>Eclipse</OptionButton>
                        <OptionButton active={settings.theme === 'starlight'} onClick={() => onSettingsChange({ theme: 'starlight' })}>Starlight</OptionButton>
                    </div>
                </SettingRow>

                <SettingRow title="Font Size">
                    <div className="flex gap-2">
                        <OptionButton active={settings.fontSize === 'sm'} onClick={() => onSettingsChange({ fontSize: 'sm' })}>Small</OptionButton>
                        <OptionButton active={settings.fontSize === 'md'} onClick={() => onSettingsChange({ fontSize: 'md' })}>Medium</OptionButton>
                        <OptionButton active={settings.fontSize === 'lg'} onClick={() => onSettingsChange({ fontSize: 'lg' })}>Large</OptionButton>
                    </div>
                </SettingRow>

                <SettingRow title="Interface Density">
                    <div className="flex gap-2">
                        <OptionButton active={settings.density === 'comfortable'} onClick={() => onSettingsChange({ density: 'comfortable' })}>Comfortable</OptionButton>
                        <OptionButton active={settings.density === 'compact'} onClick={() => onSettingsChange({ density: 'compact' })}>Compact</OptionButton>
                    </div>
                </SettingRow>

                <SettingRow title="Default Sanitization Mode">
                    <select
                        value={settings.defaultSanitizationMode}
                        onChange={e => onSettingsChange({ defaultSanitizationMode: e.target.value as SanitizationMode })}
                        className="w-full bg-[var(--surface-1)] p-2 rounded-md border border-[var(--surface-border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
                    >
                        <option value="tokenize">Tokenize</option>
                        <option value="redact">Redact</option>
                        <option value="delete">Delete</option>
                        <option value="none">None (Off)</option>
                    </select>
                </SettingRow>
                
                 <SettingRow title="Chat Behavior">
                    <div className="flex flex-col gap-2">
                         <label className="flex items-center gap-3 cursor-pointer text-sm">
                            <input type="checkbox" checked={settings.enterToSend} onChange={e => onSettingsChange({ enterToSend: e.target.checked })} className="sr-only peer" />
                            <div className="relative w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                            <span>'Enter' to send message</span>
                        </label>
                         <label className="flex items-center gap-3 cursor-pointer text-sm">
                            <input type="checkbox" checked={settings.showWelcome} onChange={e => onSettingsChange({ showWelcome: e.target.checked })} className="sr-only peer" />
                            <div className="relative w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                            <span>Show tips in new chats</span>
                        </label>
                    </div>
                </SettingRow>

                <SettingRow title="Enhanced Voice Mode">
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-3 cursor-pointer text-sm">
                            <input type="checkbox" checked={settings.enhancedVoiceMode} onChange={e => onSettingsChange({ enhancedVoiceMode: e.target.checked })} className="sr-only peer" />
                            <div className="relative w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                            <span>Use cloud voices (higher quality)</span>
                        </label>
                        <p className="text-xs text-[var(--text-secondary)] -mt-1">Provides more natural-sounding voices using Google Cloud. May incur API usage costs.</p>
                    </div>
                </SettingRow>

                <div className="border-t border-[var(--surface-border)] pt-4 space-y-3">
                    <button onClick={onExportHistory} className="w-full px-4 py-2 text-sm rounded-md transition-colors bg-[var(--surface-2)] hover:brightness-110">
                        Export Chat History for This Module
                    </button>
                    <button onClick={handleClearData} className="w-full px-4 py-2 text-sm rounded-md transition-colors bg-[var(--danger)] hover:bg-[var(--danger-hover)]">
                        Clear All Data
                    </button>
                </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={() => {
                    onClearAllData();
                    setShowConfirm(false);
                    onClose();
                }}
                title="Clear All Data"
                message="Are you sure you want to clear all data? This will delete all module configurations, chat histories, and settings. This action cannot be undone."
                confirmText="Clear All Data"
                isDangerous={true}
            />
        </>
    );
};
