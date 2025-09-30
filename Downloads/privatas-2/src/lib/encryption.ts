// Web Crypto API encryption/decryption utilities for securing localStorage data

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

/**
 * Generate a cryptographic key from a password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: ALGORITHM, length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt data using AES-GCM
 */
export async function encryptData(data: string, password: string): Promise<string> {
    try {
        const encoder = new TextEncoder();
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
        const salt = crypto.getRandomValues(new Uint8Array(16));

        const key = await deriveKey(password, salt);
        const encoded = encoder.encode(data);

        const encrypted = await crypto.subtle.encrypt(
            { name: ALGORITHM, iv },
            key,
            encoded
        );

        // Combine salt + iv + encrypted data
        const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(encrypted), salt.length + iv.length);

        // Convert to base64 for storage
        return btoa(String.fromCharCode(...combined));
    } catch (error) {
        console.error('Encryption failed:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypt data using AES-GCM
 */
export async function decryptData(encryptedData: string, password: string): Promise<string> {
    try {
        // Decode from base64
        const combined = new Uint8Array(
            atob(encryptedData).split('').map(c => c.charCodeAt(0))
        );

        // Extract salt, iv, and encrypted data
        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 16 + IV_LENGTH);
        const encrypted = combined.slice(16 + IV_LENGTH);

        const key = await deriveKey(password, salt);

        const decrypted = await crypto.subtle.decrypt(
            { name: ALGORITHM, iv },
            key,
            encrypted
        );

        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Failed to decrypt data');
    }
}

/**
 * Generate a secure password from user session
 * This derives a consistent password from the user's Firebase UID
 */
export function derivePasswordFromSession(userId: string): string {
    // In production, this should be more sophisticated
    // For now, use a combination of UID and a constant
    return `privatas_${userId}_encryption_key`;
}

/**
 * Secure localStorage wrapper with automatic encryption/decryption
 */
export class SecureStorage {
    private password: string | null = null;
    private enabled: boolean = true;

    constructor(password?: string) {
        this.password = password || null;

        // Check if Web Crypto API is available
        if (!crypto.subtle) {
            console.warn('Web Crypto API not available, encryption disabled');
            this.enabled = false;
        }
    }

    setPassword(password: string) {
        this.password = password;
    }

    async setItem(key: string, value: string): Promise<void> {
        try {
            if (this.enabled && this.password) {
                const encrypted = await encryptData(value, this.password);
                localStorage.setItem(key, encrypted);
            } else {
                // Fallback to unencrypted if encryption is disabled
                localStorage.setItem(key, value);
            }
        } catch (error) {
            // Handle quota exceeded error
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                throw new Error('Storage quota exceeded. Please export your data and clear some history.');
            }
            throw error;
        }
    }

    async getItem(key: string): Promise<string | null> {
        try {
            const stored = localStorage.getItem(key);
            if (!stored) return null;

            if (this.enabled && this.password) {
                try {
                    return await decryptData(stored, this.password);
                } catch {
                    // If decryption fails, data might be unencrypted (migration case)
                    // Return the raw data and log a warning
                    console.warn(`Failed to decrypt ${key}, returning raw data`);
                    return stored;
                }
            }

            return stored;
        } catch (error) {
            console.error(`Failed to get item ${key}:`, error);
            return null;
        }
    }

    removeItem(key: string): void {
        localStorage.removeItem(key);
    }

    clear(): void {
        localStorage.clear();
    }

    /**
     * Get all keys with a specific prefix
     */
    getKeys(prefix: string): string[] {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                keys.push(key);
            }
        }
        return keys;
    }
}