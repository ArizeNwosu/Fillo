
import React, { useEffect } from 'react';
import { Module } from '../../types';
import { CloseIcon, CustomIcon, PlusIcon, TrashIcon } from '../../icons';

export const ModuleLibraryModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onAddModule: (moduleId: string) => void; 
    onRemoveModule: (moduleId: string) => void; 
    onDeleteCustomModule: (moduleId: string) => void;
    activeModuleIds: string[]; 
    availableModules: Record<string, Module>; 
    onOpenCreator: () => void; 
    onOpenContactForm: () => void;
}> = ({ isOpen, onClose, onAddModule, onRemoveModule, onDeleteCustomModule, activeModuleIds, availableModules, onOpenCreator, onOpenContactForm }) => {
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
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-[var(--background)] p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-4xl border border-[var(--surface-border)] max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-serif font-bold">Module Library</h2>
                    <button onClick={onClose} aria-label="Close module library" title="Close module library" className="p-1 rounded-full hover:bg-[var(--surface-1)]"><CloseIcon className="h-6 w-6" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar">
                    {/* Fix: Explicitly type 'module' as 'Module' to resolve property access errors. */}
                    {Object.values(availableModules).map((module: Module) => {
                        const isAdded = activeModuleIds.includes(module.id);
                        const isGeneral = module.id === 'general';
                        const isConcierge = module.id === 'concierge';
                        
                        const getButton = () => {
                            if (isConcierge) {
                                return <button onClick={onOpenContactForm} className="mt-auto w-full px-4 py-2 text-sm rounded-md transition-colors bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)]">Contact Us</button>;
                            }
                            if (isAdded) {
                                if (isGeneral) return <button disabled className="mt-auto w-full px-4 py-2 text-sm rounded-md transition-colors disabled:bg-[var(--surface-2)]/60 disabled:text-[var(--text-secondary)] disabled:cursor-not-allowed">Default Module</button>;
                                return <button onClick={() => onRemoveModule(module.id)} className="mt-auto w-full px-4 py-2 text-sm text-white rounded-md transition-colors bg-[var(--danger)] hover:bg-[var(--danger-hover)]">Remove from Sidebar</button>;
                            }
                            return <button onClick={() => onAddModule(module.id)} className="mt-auto w-full px-4 py-2 text-sm rounded-md transition-colors bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)]">Add to Sidebar</button>;
                        }
                        return (
                            <div key={module.id} className="bg-[var(--surface-1)] p-4 rounded-lg flex flex-col">
                                <div className="flex items-center justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-3">
                                        {module.isCustom && module.svgIconContent ? <CustomIcon svgContent={module.svgIconContent} /> : <module.Icon />}
                                        <h3 className="font-semibold text-lg">{module.name}</h3>
                                    </div>
                                    {module.isCustom && (
                                        <button onClick={() => onDeleteCustomModule(module.id)} title="Delete Module" aria-label="Delete Module" className="p-1 text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors">
                                            <TrashIcon />
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm text-[var(--text-secondary)] flex-grow mb-4">{module.description}</p>
                                {getButton()}
                            </div>
                        );
                    })}
                     <div onClick={onOpenCreator} title="Create Custom Module" className="cursor-pointer bg-[var(--surface-1)] p-4 rounded-lg flex flex-col border-2 border-dashed border-[var(--surface-border)] items-center justify-center text-center hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
                        <PlusIcon />
                        <h3 className="font-semibold mt-2">Create Custom Module</h3>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">Build a specialized assistant for your unique needs.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};