// File validation utilities using magic bytes (file signatures)

interface FileSignature {
    mimeType: string;
    extensions: string[];
    signature: number[][];
    description: string;
}

// Common file signatures (magic bytes)
const FILE_SIGNATURES: FileSignature[] = [
    {
        mimeType: 'application/pdf',
        extensions: ['pdf'],
        signature: [[0x25, 0x50, 0x44, 0x46]], // %PDF
        description: 'PDF document'
    },
    {
        mimeType: 'image/png',
        extensions: ['png'],
        signature: [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]], // PNG signature
        description: 'PNG image'
    },
    {
        mimeType: 'image/jpeg',
        extensions: ['jpg', 'jpeg'],
        signature: [
            [0xFF, 0xD8, 0xFF, 0xE0], // JPEG (JFIF)
            [0xFF, 0xD8, 0xFF, 0xE1], // JPEG (Exif)
            [0xFF, 0xD8, 0xFF, 0xE2], // JPEG (Canon)
        ],
        description: 'JPEG image'
    },
    {
        mimeType: 'image/gif',
        extensions: ['gif'],
        signature: [
            [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
            [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]  // GIF89a
        ],
        description: 'GIF image'
    },
    {
        mimeType: 'image/webp',
        extensions: ['webp'],
        signature: [[0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50]], // RIFF....WEBP
        description: 'WebP image'
    },
    {
        mimeType: 'text/plain',
        extensions: ['txt'],
        signature: [], // Text files don't have a reliable signature
        description: 'Plain text'
    },
    {
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extensions: ['docx'],
        signature: [[0x50, 0x4B, 0x03, 0x04]], // ZIP signature (DOCX is a ZIP file)
        description: 'Microsoft Word document'
    }
];

/**
 * Check if bytes match a signature pattern
 * null in pattern means "any byte" (wildcard)
 */
function matchesSignature(bytes: Uint8Array, signature: number[]): boolean {
    if (signature.length > bytes.length) return false;

    for (let i = 0; i < signature.length; i++) {
        if (signature[i] !== null && bytes[i] !== signature[i]) {
            return false;
        }
    }
    return true;
}

/**
 * Validate file type using magic bytes
 */
export async function validateFileType(file: File): Promise<{
    isValid: boolean;
    detectedType?: string;
    expectedType: string;
    message: string;
}> {
    // Get the first 16 bytes (enough for most signatures)
    const buffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Find matching signature
    const matchingSignature = FILE_SIGNATURES.find(sig => {
        // Check if MIME type matches
        if (sig.mimeType !== file.type && file.type !== '') {
            return false;
        }

        // Text files and empty signatures
        if (sig.signature.length === 0) {
            return sig.mimeType === file.type;
        }

        // Check all possible signatures for this file type
        return sig.signature.some(pattern => matchesSignature(bytes, pattern));
    });

    if (matchingSignature) {
        return {
            isValid: true,
            detectedType: matchingSignature.description,
            expectedType: file.type,
            message: `Valid ${matchingSignature.description}`
        };
    }

    // If no exact match, check if bytes match ANY known signature
    const detectedType = FILE_SIGNATURES.find(sig =>
        sig.signature.length > 0 &&
        sig.signature.some(pattern => matchesSignature(bytes, pattern))
    );

    if (detectedType) {
        return {
            isValid: false,
            detectedType: detectedType.description,
            expectedType: file.type,
            message: `File type mismatch: Expected ${file.type}, but detected ${detectedType.description}`
        };
    }

    // Unknown file type
    return {
        isValid: false,
        expectedType: file.type,
        message: `Unknown or unsupported file type: ${file.type}`
    };
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeBytes: number = 100 * 1024 * 1024): {
    isValid: boolean;
    message: string;
} {
    if (file.size > maxSizeBytes) {
        const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(0);
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        return {
            isValid: false,
            message: `File too large: ${fileSizeMB}MB (max: ${maxSizeMB}MB)`
        };
    }

    return {
        isValid: true,
        message: 'File size valid'
    };
}

/**
 * Validate file name for security issues
 */
export function validateFileName(fileName: string): {
    isValid: boolean;
    message: string;
} {
    // Check for path traversal attempts
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
        return {
            isValid: false,
            message: 'File name contains invalid characters (path traversal attempt)'
        };
    }

    // Check for null bytes
    if (fileName.includes('\0')) {
        return {
            isValid: false,
            message: 'File name contains null bytes'
        };
    }

    // Check length
    if (fileName.length > 255) {
        return {
            isValid: false,
            message: 'File name too long (max 255 characters)'
        };
    }

    // Check for empty name
    if (!fileName.trim()) {
        return {
            isValid: false,
            message: 'File name is empty'
        };
    }

    return {
        isValid: true,
        message: 'File name valid'
    };
}

/**
 * Comprehensive file validation
 */
export async function validateFile(file: File, maxSizeBytes?: number): Promise<{
    isValid: boolean;
    errors: string[];
}> {
    const errors: string[] = [];

    // Validate file name
    const nameValidation = validateFileName(file.name);
    if (!nameValidation.isValid) {
        errors.push(nameValidation.message);
    }

    // Validate file size
    const sizeValidation = validateFileSize(file, maxSizeBytes);
    if (!sizeValidation.isValid) {
        errors.push(sizeValidation.message);
    }

    // Validate file type
    try {
        const typeValidation = await validateFileType(file);
        if (!typeValidation.isValid) {
            errors.push(typeValidation.message);
        }
    } catch (error) {
        errors.push('Failed to validate file type');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}