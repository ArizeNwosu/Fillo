
import DOMPurify from 'dompurify';

export const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const escapeHtml = (unsafe: string): string => {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// Sanitize HTML with DOMPurify to prevent XSS attacks
export const sanitizeHtml = (dirty: string, options?: DOMPurify.Config): string => {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['p', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'span'],
        ALLOWED_ATTR: ['class', 'style'],
        ALLOW_DATA_ATTR: false,
        ...options
    });
};

export const parseMarkdownToHtml = (text: string): string => {
    const lines = text.split('\n');
    let html = '';
    let inList = false;

    const processLine = (line: string) => {
        const escaped = escapeHtml(line);
        return escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    };

    lines.forEach(line => {
        if (line.trim().startsWith('#')) {
            if (inList) { html += '</ul>'; inList = false; }
            const level = line.match(/^#+/)?.[0].length || 1;
            const text = line.replace(/^#+\s*/, '');
            html += `<h${level + 2} class="font-serif font-bold mt-4 mb-2">${processLine(text)}</h${level + 2}>`;
        } else if (line.trim().startsWith('- ')) {
            if (!inList) { html += '<ul class="list-disc pl-5 space-y-1">'; inList = true; }
            html += `<li>${processLine(line.replace(/^- \s*/, ''))}</li>`;
        } else if (line.trim() === '') {
            if (inList) { html += '</ul>'; inList = false; }
             html += '<br />';
        } else {
            if (inList) { html += '</ul>'; inList = false; }
            html += `<p>${processLine(line)}</p>`;
        }
    });

    if (inList) { html += '</ul>'; }
    return html;
};

export const parseMarkdownToHtmlForPdf = (text: string): string => {
    const lines = text.split('\n');
    let html = '';
    let inList = false;

    const processLine = (line: string) => {
        const escaped = escapeHtml(line);
        return escaped.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: bold;">$1</strong>');
    };

    lines.forEach(line => {
        if (line.trim().startsWith('#')) {
            if (inList) { html += '</ul>'; inList = false; }
            const level = line.match(/^#+/)?.[0].length || 1;
            const text = line.replace(/^#+\s*/, '');
            const fontSize = 24 - (level * 2); // e.g., h1 -> 22pt, h2 -> 20pt
            html += `<h${level + 1} style="font-family: 'Playfair Display', serif; font-weight: bold; margin-top: 16px; margin-bottom: 8px; font-size: ${fontSize}pt;">${processLine(text)}</h${level + 1}>`;
        } else if (line.trim().startsWith('- ')) {
            if (!inList) { html += '<ul style="list-style-type: disc; padding-left: 20px; margin-bottom: 8px;">'; inList = true; }
            html += `<li style="margin-bottom: 4px;">${processLine(line.replace(/^- \s*/, ''))}</li>`;
        } else if (line.trim() === '') {
            if (inList) { html += '</ul>'; inList = false; }
             html += '<br />';
        } else {
            if (inList) { html += '</ul>'; inList = false; }
            html += `<p style="margin-bottom: 8px;">${processLine(line)}</p>`;
        }
    });

    if (inList) { html += '</ul>'; }
    return html;
};

// Input sanitization utilities
export const sanitizeUserInput = (input: string, maxLength: number = 50000): string => {
    if (!input || typeof input !== 'string') return '';

    // Trim and limit length
    let sanitized = input.trim().slice(0, maxLength);

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Normalize unicode
    sanitized = sanitized.normalize('NFKC');

    return sanitized;
};

export const validateApiKey = (key: string): boolean => {
    if (!key || typeof key !== 'string') return false;
    if (key === 'your_actual_api_key_here' || key === 'PLACEHOLDER_API_KEY') return false;
    if (key.length < 20) return false;
    return true;
};
