
import React, { useState, useEffect } from 'react';
import { CloseIcon } from '../../icons';

export const ContactFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
}> = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert(`Thank you, ${name}. We will be in touch shortly.`);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-[var(--background)] p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-md border border-[var(--surface-border)] flex flex-col gap-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h2 className="text-xl sm:text-2xl font-serif font-bold">Contact Us for Concierge Service</h2>
                    <button type="button" onClick={onClose} aria-label="Close" title="Close" className="p-1 rounded-full hover:bg-[var(--surface-1)]"><CloseIcon className="h-6 w-6" /></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="font-semibold text-sm mb-1 block">Full Name</label>
                        <input value={name} onChange={e => setName(e.target.value)} type="text" required className="w-full bg-[var(--surface-1)] p-2 rounded-md border border-[var(--surface-border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm" />
                    </div>
                     <div>
                        <label className="font-semibold text-sm mb-1 block">Phone Number</label>
                        <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" required className="w-full bg-[var(--surface-1)] p-2 rounded-md border border-[var(--surface-border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm" />
                    </div>
                    <div>
                        <label className="font-semibold text-sm mb-1 block">Email Address</label>
                        <input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="w-full bg-[var(--surface-1)] p-2 rounded-md border border-[var(--surface-border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm" />
                    </div>
                </div>
                
                <div className="mt-2 flex justify-end">
                    <button type="submit" className="px-4 py-2 text-sm bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] rounded-md transition-colors">
                        Submit
                    </button>
                </div>
            </form>
        </div>
    );
};
