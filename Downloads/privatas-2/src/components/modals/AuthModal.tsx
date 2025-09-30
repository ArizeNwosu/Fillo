
import React, { useState, useEffect } from 'react';
import { CloseIcon, GoogleIcon } from '../../icons';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../../lib/authService';

export const AuthModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    initialMode: 'login' | 'signup';
}> = ({ isOpen, onClose, initialMode }) => {
    const [mode, setMode] = useState(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setMode(initialMode);
        setError(null);
        setEmail('');
        setPassword('');
    }, [initialMode, isOpen]);
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        const { user, error } = await signInWithGoogle();
        setLoading(false);

        if (error) {
            setError(error);
        } else if (user) {
            onClose();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { user, error } = mode === 'login'
            ? await signInWithEmail(email, password)
            : await signUpWithEmail(email, password);

        setLoading(false);

        if (error) {
            setError(error);
        } else if (user) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-[var(--background)] p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md border border-[var(--surface-border)] flex flex-col gap-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold">{mode === 'login' ? 'Welcome back' : 'Create an account'}</h2>
                    <button type="button" onClick={onClose} aria-label="Close" title="Close" className="p-1 rounded-full hover:bg-[var(--surface-1)]"><CloseIcon className="h-6 w-6" /></button>
                </div>
                
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-[var(--surface-border)] rounded-md hover:bg-[var(--surface-1)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <GoogleIcon />
                        <span className="text-sm font-semibold">
                            {loading ? 'Signing in...' : 'Continue with Google'}
                        </span>
                    </button>
                    <div className="flex items-center">
                        <div className="flex-grow h-px bg-[var(--surface-border)]"></div>
                        <span className="mx-4 text-xs text-[var(--text-secondary)]">OR</span>
                        <div className="flex-grow h-px bg-[var(--surface-border)]"></div>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="font-semibold text-sm mb-1.5 block">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                                className="w-full bg-[var(--surface-1)] p-2 rounded-md border border-[var(--surface-border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm disabled:opacity-50"
                            />
                        </div>
                         <div>
                            <label className="font-semibold text-sm mb-1.5 block">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                className="w-full bg-[var(--surface-1)] p-2 rounded-md border border-[var(--surface-border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm disabled:opacity-50"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 px-4 py-2.5 text-sm font-semibold bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           {loading ? 'Processing...' : (mode === 'login' ? 'Log in' : 'Sign up')}
                        </button>
                    </form>
                </div>
                
                <p className="text-center text-sm text-[var(--text-secondary)]">
                    {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="font-semibold text-[var(--accent)] hover:underline">
                        {mode === 'login' ? 'Sign up' : 'Log in'}
                    </button>
                </p>
            </div>
        </div>
    );
};
