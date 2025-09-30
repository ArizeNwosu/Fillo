
import { SanitizationMode } from '../types';

const PII_PATTERNS = {
    EMAIL: { regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, label: 'EMAIL' },
    PHONE: { regex: /\b(?:\+?1[ -.]?)?(?:\(?\d{3}\)?|\d{3})[ -.]?\d{3}[ -.]?\d{4}\b/g, label: 'PHONE' },
    ADDRESS: { regex: /\b\d{1,6}\s(?:[A-Z][a-zA-Z-]+\s?){1,5}(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Boulevard|Ct|Court|Pkwy|Parkway|Cir|Circle|Pl|Place)\b(?:(?:,\s*|\s+)(?:Apt|Suite|Unit|#)\s*\w{1,5})?/gi, label: 'ADDRESS' },
    SSN: { regex: /\b\d{3}-\d{2}-\d{4}\b/g, label: 'SSN' },
    CREDIT_CARD: { regex: /\b(?:\d{4}[- ]){3}\d{4}|\d{16}\b/g, label: 'PAN' },
    IP_ADDRESS: { regex: /\b((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g, label: 'IP' },
    DOB: { regex: /\b(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20)\d{2}\b/g, label: 'DOB' }
};

const LABEL_PATTERNS = [
    { regex: /(name|full name|first name|last name|surname|given name)[\s:]+([^\n\r]+)/gi, label: 'NAME' },
    { regex: /(address|street)[\s:]+([^\n\r]+)/gi, label: 'ADDRESS' },
    { regex: /(phone|mobile|tel)[\s:]+([^\n\r]+)/gi, label: 'PHONE' },
    { regex: /(email|e-mail)[\s:]+([^\n\r]+)/gi, label: 'EMAIL' },
];


export const sanitizeText = (text: string, mode: SanitizationMode): string => {
    if (!text || mode === 'none') return text;
    let sanitizedText = text;
    const counters: Record<string, number> = {};

    LABEL_PATTERNS.forEach(({ regex, label }) => {
        sanitizedText = sanitizedText.replace(regex, (match, labelText, valueText) => {
            const trimmedValue = valueText.trim();
            if (trimmedValue.length === 0) return match;
            counters[label] = (counters[label] || 0) + 1;
            let replacementValue;
            switch (mode) {
                case 'tokenize':
                    replacementValue = `[${label}_${counters[label]}]`;
                    break;
                case 'redact':
                    replacementValue = '█'.repeat(trimmedValue.length);
                    break;
                case 'delete':
                    replacementValue = ''; // Delete the value
                    break;
                default:
                    replacementValue = trimmedValue;
            }
            return match.replace(valueText, ` ${replacementValue}`);
        });
    });

    Object.values(PII_PATTERNS).forEach(({ regex, label }) => {
        sanitizedText = sanitizedText.replace(regex, (match) => {
            if (match.includes('[') || match.includes('█')) {
                return match;
            }
            counters[label] = (counters[label] || 0) + 1;
            switch (mode) {
                case 'tokenize': return `[${label}_${counters[label]}]`;
                case 'redact': return '█'.repeat(match.length);
                case 'delete': return ''; // Delete the match
                default: return match;
            }
        });
    });

    return sanitizedText;
};
