import { useRef, useCallback, useState, useEffect } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

/**
 * Hook for speech recognition with proper cleanup
 */
export function useSpeechRecognition() {
  const speechRecognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      speechRecognitionRef.current = new SpeechRecognition();
      speechRecognitionRef.current.continuous = false;
      speechRecognitionRef.current.interimResults = false;
    }

    // Cleanup on unmount
    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (e) {
          // Ignore errors if already stopped
        }
        speechRecognitionRef.current.onresult = null;
        speechRecognitionRef.current.onend = null;
        speechRecognitionRef.current.onerror = null;
      }
    };
  }, []);

  const startListening = useCallback((
    onResult: (transcript: string) => void,
    onError?: (error: any) => void
  ) => {
    if (!speechRecognitionRef.current) {
      onError?.(new Error('Speech recognition not supported'));
      return;
    }

    try {
      speechRecognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        setIsListening(false);
      };

      speechRecognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        onError?.(event);
        setIsListening(false);
      };

      speechRecognitionRef.current.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      onError?.(error);
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (speechRecognitionRef.current && isListening) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
      setIsListening(false);
    }
  }, [isListening]);

  return {
    isSupported,
    isListening,
    startListening,
    stopListening,
  };
}