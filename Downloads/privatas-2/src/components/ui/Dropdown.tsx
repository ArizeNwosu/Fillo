
import React, { useEffect, useRef } from 'react';
import { OverlayPage } from '../../types';
import { QuestionIcon, ReleaseNotesIcon, StarIcon, TermsPoliciesIcon } from '../../icons';

const DropdownItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void;}> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-[var(--surface-1)] text-[var(--text-primary)] no-underline">
        {icon}
        <span className="text-sm">{label}</span>
    </button>
);

export const HelpDropdown: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onShowPage: (page: OverlayPage) => void;
}> = ({ isOpen, onClose, onShowPage }) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleItemClick = (page: OverlayPage) => {
        onShowPage(page);
        onClose();
    };

    return (
        <div ref={dropdownRef} className="absolute top-full right-0 mt-2 w-60 bg-[var(--background)] border border-[var(--surface-border)] rounded-lg shadow-xl z-20 p-2">
            <DropdownItem icon={<StarIcon />} label="See plans and pricing" onClick={() => handleItemClick('plans')} />
            <DropdownItem icon={<QuestionIcon className="h-5 w-5" />} label="FAQ" onClick={() => handleItemClick('faq')} />
            <div className="h-px bg-[var(--surface-border)] my-2"></div>
            <DropdownItem icon={<QuestionIcon className="h-5 w-5" />} label="Help center" onClick={() => handleItemClick('help')} />
            <DropdownItem icon={<ReleaseNotesIcon />} label="Release notes" onClick={() => handleItemClick('releases')} />
            <DropdownItem icon={<TermsPoliciesIcon />} label="Terms & policies" onClick={() => handleItemClick('terms')} />
        </div>
    );
};
