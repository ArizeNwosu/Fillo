import { useEffect, useRef, useCallback } from 'react';
import type { FileProcessMessage, FileProcessResponse } from '../workers/fileProcessor.worker';

/**
 * Hook for using file processing Web Worker
 * Offloads heavy file operations from main thread
 */
export function useFileWorker() {
  const workerRef = useRef<Worker | null>(null);
  const callbacksRef = useRef<Map<string, (response: FileProcessResponse) => void>>(new Map());
  const messageIdRef = useRef(0);

  // Initialize worker
  useEffect(() => {
    try {
      // Create worker
      const worker = new Worker(
        new URL('../workers/fileProcessor.worker.ts', import.meta.url),
        { type: 'module' }
      );

      // Handle messages from worker
      worker.onmessage = (e: MessageEvent<FileProcessResponse>) => {
        const { id, type, payload } = e.data;

        // Handle worker ready message
        if (type === 'READY') {
          console.log('File worker ready');
          return;
        }

        // Call the appropriate callback
        const callback = callbacksRef.current.get(id);
        if (callback) {
          callback(e.data);
          callbacksRef.current.delete(id);
        }
      };

      // Handle worker errors
      worker.onerror = (error) => {
        console.error('File worker error:', error);
      };

      workerRef.current = worker;

      return () => {
        worker.terminate();
      };
    } catch (error) {
      console.error('Failed to create file worker:', error);
    }
  }, []);

  /**
   * Send message to worker and wait for response
   */
  const sendMessage = useCallback(
    <T = any>(type: FileProcessMessage['type'], payload: FileProcessMessage['payload']): Promise<T> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker not initialized'));
          return;
        }

        const id = `msg-${messageIdRef.current++}`;

        // Store callback
        callbacksRef.current.set(id, (response: FileProcessResponse) => {
          if (response.type === 'ERROR') {
            reject(new Error(response.payload.error));
          } else {
            resolve(response.payload as T);
          }
        });

        // Send message
        workerRef.current.postMessage({
          type,
          payload,
          id,
        } as FileProcessMessage);
      });
    },
    []
  );

  /**
   * Process file validation
   */
  const processFile = useCallback(
    async (file: File): Promise<{ isValid: boolean; errors: string[]; fileName: string }> => {
      const arrayBuffer = await file.arrayBuffer();

      return sendMessage('PROCESS_FILE', {
        fileData: arrayBuffer,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
    },
    [sendMessage]
  );

  /**
   * Extract text from file
   */
  const extractText = useCallback(
    async (file: File): Promise<{ text: string; fileName: string }> => {
      const arrayBuffer = await file.arrayBuffer();

      return sendMessage('EXTRACT_TEXT', {
        fileData: arrayBuffer,
        fileName: file.name,
        fileType: file.type,
      });
    },
    [sendMessage]
  );

  /**
   * Sanitize text content
   */
  const sanitizeText = useCallback(
    async (text: string, mode: string): Promise<{ text: string; mode: string }> => {
      return sendMessage('SANITIZE_TEXT', {
        text,
        mode,
      });
    },
    [sendMessage]
  );

  return {
    processFile,
    extractText,
    sanitizeText,
    isReady: workerRef.current !== null,
  };
}