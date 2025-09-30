/// <reference lib="webworker" />

/**
 * Web Worker for file processing
 * Offloads heavy file operations from main thread
 */

import { validateFile } from '../lib/fileValidation';

export interface FileProcessMessage {
  type: 'PROCESS_FILE' | 'EXTRACT_TEXT' | 'SANITIZE_TEXT';
  payload: {
    fileData?: ArrayBuffer;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    text?: string;
    mode?: string;
  };
  id: string;
}

export interface FileProcessResponse {
  type: 'PROCESS_COMPLETE' | 'EXTRACT_COMPLETE' | 'SANITIZE_COMPLETE' | 'ERROR';
  payload: any;
  id: string;
}

// Listen for messages from main thread
self.onmessage = async (e: MessageEvent<FileProcessMessage>) => {
  const { type, payload, id } = e.data;

  try {
    switch (type) {
      case 'PROCESS_FILE':
        await processFile(payload, id);
        break;

      case 'EXTRACT_TEXT':
        await extractText(payload, id);
        break;

      case 'SANITIZE_TEXT':
        await sanitizeText(payload, id);
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    self.postMessage({
      type: 'ERROR',
      payload: { error: errorMessage },
      id,
    } as FileProcessResponse);
  }
};

/**
 * Process file validation
 */
async function processFile(payload: FileProcessMessage['payload'], id: string) {
  const { fileData, fileName, fileType, fileSize } = payload;

  if (!fileData || !fileName || !fileType || !fileSize) {
    throw new Error('Missing file data');
  }

  // Create File object from ArrayBuffer
  const blob = new Blob([fileData], { type: fileType });
  const file = new File([blob], fileName, { type: fileType });

  // Validate file
  const validation = await validateFile(file);

  self.postMessage({
    type: 'PROCESS_COMPLETE',
    payload: {
      isValid: validation.isValid,
      errors: validation.errors,
      fileName,
    },
    id,
  } as FileProcessResponse);
}

/**
 * Extract text from file
 */
async function extractText(payload: FileProcessMessage['payload'], id: string) {
  const { fileData, fileType, fileName } = payload;

  if (!fileData || !fileType) {
    throw new Error('Missing file data');
  }

  let extractedText = '';

  try {
    // Handle different file types
    if (fileType === 'text/plain' || fileType === 'text/csv') {
      const decoder = new TextDecoder();
      extractedText = decoder.decode(fileData);
    } else if (fileType === 'application/json') {
      const decoder = new TextDecoder();
      const jsonText = decoder.decode(fileData);
      const jsonData = JSON.parse(jsonText);
      extractedText = JSON.stringify(jsonData, null, 2);
    } else {
      // For other types, try to decode as text
      const decoder = new TextDecoder();
      try {
        extractedText = decoder.decode(fileData);
      } catch {
        extractedText = `[Binary file: ${fileName}]`;
      }
    }

    self.postMessage({
      type: 'EXTRACT_COMPLETE',
      payload: {
        text: extractedText,
        fileName,
      },
      id,
    } as FileProcessResponse);
  } catch (error) {
    throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Sanitize text content
 */
async function sanitizeText(payload: FileProcessMessage['payload'], id: string) {
  const { text, mode } = payload;

  if (!text) {
    throw new Error('Missing text to sanitize');
  }

  let sanitizedText = text;

  try {
    switch (mode) {
      case 'light':
        // Remove only obvious threats
        sanitizedText = text
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
        break;

      case 'moderate':
        // Remove more potential threats
        sanitizedText = text
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
          .replace(/data:text\/html/gi, '');
        break;

      case 'strict':
        // Strip all HTML tags
        sanitizedText = text.replace(/<[^>]*>/g, '');
        break;

      default:
        sanitizedText = text;
    }

    self.postMessage({
      type: 'SANITIZE_COMPLETE',
      payload: {
        text: sanitizedText,
        mode,
      },
      id,
    } as FileProcessResponse);
  } catch (error) {
    throw new Error(`Failed to sanitize text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Notify main thread that worker is ready
self.postMessage({ type: 'READY', payload: {}, id: 'init' } as FileProcessResponse);