
import React from 'react';
import { Module } from '../../types';
import { CustomIcon, PlusIcon } from '../../icons';

export const ModuleSidebar: React.FC<{ 
    activeModule: string; 
    onSelectModule: (moduleId: string) => void; 
    activeModuleIds: string[]; 
    onOpenLibrary: () => void; 
    availableModules: Record<string, Module> 
}> = ({ activeModule, onSelectModule, activeModuleIds, onOpenLibrary, availableModules }) => {
    return (
        <nav className="flex flex-col items-center gap-2 p-2 bg-[var(--background)] border-r border-[var(--surface-border)] h-full overflow-y-auto">
            <div className="flex-grow space-y-2 overflow-y-auto custom-scrollbar w-full">
                {activeModuleIds.map(id => {
                    const module = availableModules[id];
                    if (!module) return null;
                    return (
                        <button key={id} onClick={() => onSelectModule(id)}
                            className={`flex flex-col items-center justify-center w-full rounded-lg transition-colors module-sidebar-button ${activeModule === id ? 'bg-[var(--surface-1)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]'}`}
                            title={module.name} aria-label={`Switch to ${module.name} module`} >
                            {module.isCustom && module.svgIconContent ? <CustomIcon svgContent={module.svgIconContent} /> : <module.Icon />}
                            <span className="mt-1 text-xs text-center">{module.name}</span>
                        </button>
                    );
                })}
            </div>
            <button onClick={onOpenLibrary} className="flex flex-col items-center justify-center w-full h-20 p-2 mt-2 rounded-lg transition-colors text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)] border-2 border-dashed border-[var(--surface-border)]" title="Add Module" aria-label="Open Module Library">
                <PlusIcon /> <span className="mt-1 text-xs text-center">Add</span>
            </button>
        </nav>
    );
};
