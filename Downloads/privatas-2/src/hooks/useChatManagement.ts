import { useState, useCallback } from 'react';

export interface Chat {
  id: string;
  name: string;
  createdAt: number;
  messages: Message[];
  summary?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp?: number;
  files?: SanitizedFile[];
}

export interface SanitizedFile {
  fileName: string;
  status: 'pending' | 'processing' | 'sanitized' | 'failed';
  previewUrl?: string;
  originalSize?: number;
  sanitizedSize?: number;
  displayContent?: string;
}

/**
 * Hook for managing chat state and operations
 */
export function useChatManagement() {
  const [chats, setChats] = useState<Chat[]>([{
    id: 'default',
    name: 'New Chat',
    createdAt: Date.now(),
    messages: []
  }]);
  const [activeChatId, setActiveChatId] = useState('default');

  const activeChat = chats.find(c => c.id === activeChatId);

  const createNewChat = useCallback(() => {
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      name: 'New Chat',
      createdAt: Date.now(),
      messages: []
    };
    setChats(prev => [...prev, newChat]);
    setActiveChatId(newChat.id);
    return newChat;
  }, []);

  const deleteChat = useCallback((id: string) => {
    setChats(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (filtered.length === 0) {
        const newChat: Chat = {
          id: 'default',
          name: 'New Chat',
          createdAt: Date.now(),
          messages: []
        };
        return [newChat];
      }
      return filtered;
    });

    if (activeChatId === id) {
      setActiveChatId(chats[0]?.id || 'default');
    }
  }, [activeChatId, chats]);

  const renameChat = useCallback((id: string, newName: string) => {
    setChats(prev => prev.map(c =>
      c.id === id ? { ...c, name: newName } : c
    ));
  }, []);

  const updateChatMessages = useCallback((chatId: string, messages: Message[]) => {
    setChats(prev => prev.map(c =>
      c.id === chatId ? { ...c, messages } : c
    ));
  }, []);

  const addMessage = useCallback((chatId: string, message: Message) => {
    setChats(prev => prev.map(c =>
      c.id === chatId ? { ...c, messages: [...c.messages, message] } : c
    ));
  }, []);

  const updateMessage = useCallback((chatId: string, messageId: string, updates: Partial<Message>) => {
    setChats(prev => prev.map(c =>
      c.id === chatId
        ? {
            ...c,
            messages: c.messages.map(m =>
              m.id === messageId ? { ...m, ...updates } : m
            )
          }
        : c
    ));
  }, []);

  const clearChat = useCallback((chatId: string) => {
    setChats(prev => prev.map(c =>
      c.id === chatId ? { ...c, messages: [] } : c
    ));
  }, []);

  const setSummary = useCallback((chatId: string, summary: string) => {
    setChats(prev => prev.map(c =>
      c.id === chatId ? { ...c, summary } : c
    ));
  }, []);

  return {
    chats,
    activeChat,
    activeChatId,
    setActiveChatId,
    createNewChat,
    deleteChat,
    renameChat,
    updateChatMessages,
    addMessage,
    updateMessage,
    clearChat,
    setSummary,
  };
}