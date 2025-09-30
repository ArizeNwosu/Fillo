import { useRef, useCallback, useState, useEffect } from 'react';

/**
 * Hook for text-to-speech with proper cleanup
 */
export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Load available voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Cleanup on unmount
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((
    text: string,
    options?: {
      voice?: SpeechSynthesisVoice;
      rate?: number;
      pitch?: number;
      volume?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (error: any) => void;
    }
  ) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Set options
    if (options?.voice) utterance.voice = options.voice;
    if (options?.rate) utterance.rate = options.rate;
    if (options?.pitch) utterance.pitch = options.pitch;
    if (options?.volume) utterance.volume = options.volume;

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
      options?.onStart?.();
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
      options?.onEnd?.();
    };

    utterance.onerror = (event) => {
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
      options?.onError?.(event);
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    currentUtteranceRef.current = null;
  }, []);

  const pause = useCallback(() => {
    if (isSpeaking) {
      window.speechSynthesis.pause();
    }
  }, [isSpeaking]);

  const resume = useCallback(() => {
    if (isSpeaking) {
      window.speechSynthesis.resume();
    }
  }, [isSpeaking]);

  return {
    isSpeaking,
    voices,
    speak,
    stop,
    pause,
    resume,
  };
}