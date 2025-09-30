import React, { useEffect, useRef } from 'react';
import { OverlayPage } from '../../types';
import { QuestionIcon, ReleaseNotesIcon, StarIcon, TermsPoliciesIcon, SettingsIcon, LogoutIcon } from '../../icons';
import { User } from 'firebase/auth';
import { logout } from '../../lib/authService';

const DropdownItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void;}> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-[var(--surface-1)] text-[var(--text-primary)] no-underline">
        {icon}
        <span className="text-sm">{label}</span>
    </button>
);

const getInitials = (name: string | null, email: string | null): string => {
    if (name) {
        return name.charAt(0).toUpperCase();
    }
    if (email) {
        return email.charAt(0).toUpperCase();
    }
    return 'U';
};

const getFirstName = (name: string | null, email: string | null): string => {
    if (name) {
        const firstName = name.split(' ')[0];
        return firstName;
    }
    if (email) {
        return email.split('@')[0];
    }
    return 'User';
};

export const UserProfileMenu: React.FC<{
    user: User;
    isOpen: boolean;
    onClose: () => void;
    onShowPage: (page: OverlayPage) => void;
    onOpenSettings: () => void;
    onToggle: () => void;
}> = ({ user, isOpen, onClose, onShowPage, onOpenSettings, onToggle }) => {
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

    const handleItemClick = (page: OverlayPage) => {
        onShowPage(page);
        onClose();
    };

    const handleSettingsClick = () => {
        onOpenSettings();
        onClose();
    };

    const handleLogout = async () => {
        await logout();
        onClose();
    };

    const initials = getInitials(user.displayName, user.email);
    const firstName = getFirstName(user.displayName, user.email);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={onToggle}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-[var(--surface-1)] transition-colors"
                title={`${firstName}'s profile`}
                aria-label="User profile menu"
            >
                <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center font-semibold text-sm">
                    {initials}
                </div>
                <span className="text-sm font-semibold text-[var(--text-primary)] hidden sm:inline">
                    {firstName}
                </span>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-60 bg-[var(--background)] border border-[var(--surface-border)] rounded-lg shadow-xl z-20 p-2">
                    <div className="px-2 py-3 border-b border-[var(--surface-border)] mb-2">
                        <p className="text-sm text-[var(--text-secondary)] truncate">
                            {user.email}
                        </p>
                    </div>

                    <DropdownItem icon={<StarIcon />} label="Upgrade plan" onClick={() => handleItemClick('plans')} />
                    <DropdownItem icon={<QuestionIcon className="h-5 w-5" />} label="FAQ" onClick={() => handleItemClick('faq')} />

                    <div className="h-px bg-[var(--surface-border)] my-2"></div>

                    <DropdownItem icon={<QuestionIcon className="h-5 w-5" />} label="Help center" onClick={() => handleItemClick('help')} />
                    <DropdownItem icon={<ReleaseNotesIcon />} label="Release notes" onClick={() => handleItemClick('releases')} />
                    <DropdownItem icon={<TermsPoliciesIcon />} label="Terms & policies" onClick={() => handleItemClick('terms')} />

                    <div className="h-px bg-[var(--surface-border)] my-2"></div>

                    <DropdownItem icon={<SettingsIcon />} label="Settings" onClick={handleSettingsClick} />
                    <DropdownItem icon={<LogoutIcon />} label="Logout" onClick={handleLogout} />
                </div>
            )}
        </div>
    );
};