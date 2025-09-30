# 🔄 Migration Guide - Using New Production Features

## Overview

This guide explains how to integrate the new production-ready features into your existing Privatas codebase.

---

## 1. Backend API Proxy Integration

### Before (Direct API Calls)
```typescript
import { GoogleGenerativeAI } from '@google/genai';

const ai = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
});
```

### After (Backend Proxy)
```typescript
import { GeminiApiService } from './services/geminiApi';

const response = await GeminiApiService.generateContent({
  model: 'gemini-2.5-flash',
  contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
});

// Response format is the same
const text = response.text;
```

### Legacy Compatibility Wrapper
```typescript
import { createProxiedAI } from './services/geminiApi';

// Drop-in replacement - same API as before
const ai = createProxiedAI();

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
});
```

---

## 2. Secure Storage Integration

### Before (Plain localStorage)
```typescript
// Storing data
localStorage.setItem('chat-history', JSON.stringify(messages));

// Retrieving data
const stored = localStorage.getItem('chat-history');
const messages = stored ? JSON.parse(stored) : [];
```

### After (Encrypted Storage)
```typescript
import { useSecureStorage } from './hooks/useSecureStorage';

function MyComponent() {
  const { getItem, setItem, isReady, isEncrypted } = useSecureStorage();

  // Wait for storage to be ready
  useEffect(() => {
    if (!isReady) return;

    // Storing data (automatically encrypted if user logged in)
    await setItem('chat-history', JSON.stringify(messages));

    // Retrieving data (automatically decrypted)
    const stored = await getItem('chat-history');
    const messages = stored ? JSON.parse(stored) : [];
  }, [isReady]);
}
```

### Migration Script for Existing Data
```typescript
import { SecureStorage, derivePasswordFromSession } from './lib/encryption';
import { useAuth } from './contexts/AuthContext';

async function migrateLocalStorageData() {
  const { user } = useAuth();

  if (!user) return;

  const storage = new SecureStorage();
  storage.setPassword(derivePasswordFromSession(user.uid));
  storage.setEnabled(true);

  // List of keys to migrate
  const keysToMigrate = [
    'Privatas-settings',
    'Privatas-activeModules',
    'Privatas-customModules'
  ];

  for (const key of keysToMigrate) {
    const plainData = localStorage.getItem(key);
    if (plainData) {
      // Encrypt and store
      await storage.setItem(key, plainData);
      console.log(`Migrated ${key}`);
    }
  }

  console.log('Migration complete!');
}
```

---

## 3. Object URL Cleanup

### Before (Manual URL Creation)
```typescript
// Creating object URLs without cleanup
const url = URL.createObjectURL(blob);
setImageUrl(url);

// Problem: URLs never get revoked, causing memory leaks
```

### After (Tracked URLs)
```typescript
import { useObjectURLs } from './hooks/useObjectURLs';

function MyComponent() {
  const { createObjectURL, revokeObjectURL, revokeAll } = useObjectURLs();
  const [imageUrl, setImageUrl] = useState<string>('');

  const handleFileUpload = (file: File) => {
    // Old URL is automatically tracked
    const url = createObjectURL(file);
    setImageUrl(url);
  };

  const handleRemove = () => {
    // Manually revoke specific URL
    if (imageUrl) {
      revokeObjectURL(imageUrl);
      setImageUrl('');
    }
  };

  // All URLs automatically revoked on unmount
  return (
    <div>
      {imageUrl && <img src={imageUrl} alt="Preview" />}
      <button onClick={handleRemove}>Remove</button>
    </div>
  );
}
```

### Global Manager (Non-Component Usage)
```typescript
import { objectURLManager } from './hooks/useObjectURLs';

// In utility functions
function processFile(file: File) {
  const url = objectURLManager.createObjectURL(file);

  // Do processing...

  // Clean up when done
  objectURLManager.revokeObjectURL(url);
}
```

---

## 4. Virtual Scrolling for Chat

### Before (All Messages Rendered)
```typescript
<div className="chat-messages">
  {messages.map(msg => (
    <ChatMessage key={msg.id} message={msg} />
  ))}
</div>
```

### After (Virtual Scrolling)
```typescript
import { SmartChatList } from './components/chat/VirtualChatList';

<SmartChatList
  items={messages}
  renderItem={(msg, idx) => (
    <ChatMessage message={msg} />
  )}
  virtualThreshold={50} // Use virtual scrolling after 50 messages
  className="chat-messages"
/>
```

### Manual Virtual Scrolling
```typescript
import { VirtualChatList } from './components/chat/VirtualChatList';

<VirtualChatList
  items={messages}
  renderItem={(msg, idx) => <ChatMessage message={msg} />}
  itemHeight={150}  // Approximate height per message
  overscan={3}      // Items to render outside viewport
  className="chat-messages"
  onLoadMore={() => {
    // Load more messages when scrolled to top
  }}
/>
```

---

## 5. Web Worker File Processing

### Before (Main Thread Processing)
```typescript
async function processFile(file: File) {
  // Heavy processing on main thread - UI freezes
  const validation = await validateFile(file);
  const text = await extractText(file);

  return { validation, text };
}
```

### After (Web Worker)
```typescript
import { useFileWorker } from './hooks/useFileWorker';

function MyComponent() {
  const { processFile, extractText, isReady } = useFileWorker();

  const handleUpload = async (file: File) => {
    if (!isReady) return;

    // Processing happens in worker - UI stays responsive
    const validation = await processFile(file);
    const extracted = await extractText(file);

    console.log('Validation:', validation);
    console.log('Text:', extracted.text);
  };
}
```

---

## 6. Custom Hooks

### Chat Management
```typescript
import { useChatManagement } from './hooks/useChatManagement';

function MyComponent() {
  const {
    chats,
    activeChat,
    createNewChat,
    deleteChat,
    addMessage,
    updateMessage,
  } = useChatManagement();

  const handleSend = (text: string) => {
    addMessage(activeChat.id, {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now()
    });
  };
}
```

### Speech Recognition
```typescript
import { useSpeechRecognition } from './hooks/useSpeechRecognition';

function MyComponent() {
  const { isSupported, isListening, startListening, stopListening } =
    useSpeechRecognition();

  const handleVoiceInput = () => {
    startListening(
      (transcript) => {
        console.log('You said:', transcript);
        setInput(transcript);
      },
      (error) => {
        console.error('Speech error:', error);
      }
    );
  };

  if (!isSupported) {
    return <div>Speech recognition not supported</div>;
  }

  return (
    <button onClick={handleVoiceInput} disabled={isListening}>
      {isListening ? 'Listening...' : 'Speak'}
    </button>
  );
}
```

### Speech Synthesis
```typescript
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';

function MyComponent() {
  const { isSpeaking, speak, stop, voices } = useSpeechSynthesis();

  const handleReadAloud = (text: string) => {
    speak(text, {
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      onStart: () => console.log('Started speaking'),
      onEnd: () => console.log('Finished speaking'),
      onError: (err) => console.error('Speech error:', err)
    });
  };

  return (
    <div>
      <button onClick={() => handleReadAloud('Hello world')} disabled={isSpeaking}>
        Read Aloud
      </button>
      <button onClick={stop} disabled={!isSpeaking}>
        Stop
      </button>
    </div>
  );
}
```

---

## 7. Error Boundaries

### Wrapping Components
```typescript
import { ErrorBoundary, AIErrorBoundary, FileProcessingErrorBoundary }
  from './components/ErrorBoundary';

// Wrap entire app
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Wrap AI components
{messages.map(msg => (
  <AIErrorBoundary key={msg.id}>
    <ChatMessage message={msg} />
  </AIErrorBoundary>
))}

// Wrap file processing
<FileProcessingErrorBoundary>
  <FileUploader />
</FileProcessingErrorBoundary>
```

### Custom Error Handler
```typescript
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Send to error tracking service
    console.error('App crashed:', error, errorInfo);
  }}
  fallback={
    <div className="error-screen">
      <h1>Something went wrong</h1>
      <button onClick={() => window.location.reload()}>Reload</button>
    </div>
  }
>
  <App />
</ErrorBoundary>
```

---

## 8. TypeScript Strictness

### Removing `any` Types

#### Before
```typescript
function processData(data: any) {
  return data.value;
}

const result: any = fetchData();
```

#### After
```typescript
interface DataType {
  value: string;
  timestamp: number;
}

function processData(data: DataType): string {
  return data.value;
}

const result: DataType = fetchData();
```

### Common Type Replacements
```typescript
// Instead of: any
// Use:        unknown (for truly unknown types)
//             object (for objects)
//             Record<string, unknown> (for dictionaries)
//             T extends {...} (for generic constraints)

// Instead of: function(param: any)
// Use:        function<T>(param: T)
//             function(param: unknown)

// Instead of: const x: any = ...
// Use:        const x = ... as const
//             const x: Type = ...
```

---

## 9. Environment Variables

### Update .env.local
```bash
# Add these new variables
VITE_API_BASE_URL=http://localhost:3001
VITE_USE_BACKEND_PROXY=true

# Keep existing Firebase variables
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
# etc.
```

### Conditional API Usage
```typescript
const USE_PROXY = import.meta.env.VITE_USE_BACKEND_PROXY === 'true';

let ai;
if (USE_PROXY) {
  // Use backend proxy
  ai = createProxiedAI();
} else {
  // Use direct API (development only)
  ai = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
}
```

---

## 10. Testing New Features

### Test Backend Proxy
```bash
# 1. Start backend
cd server
npm install
npm run dev

# 2. Test health endpoint
curl http://localhost:3001/health

# 3. Test generate endpoint
curl -X POST http://localhost:3001/api/gemini/generate \
  -H "Content-Type: application/json" \
  -d '{"model":"gemini-2.5-flash","contents":[{"role":"user","parts":[{"text":"Hello"}]}]}'
```

### Test Encryption
```typescript
import { SecureStorage } from './lib/encryption';

async function testEncryption() {
  const storage = new SecureStorage();
  storage.setPassword('test-password');
  storage.setEnabled(true);

  // Test set and get
  await storage.setItem('test-key', 'sensitive data');
  const retrieved = await storage.getItem('test-key');

  console.log('Original:', 'sensitive data');
  console.log('Retrieved:', retrieved);
  console.log('Match:', retrieved === 'sensitive data');

  // Check localStorage (should be encrypted)
  const raw = localStorage.getItem('test-key');
  console.log('Encrypted in localStorage:', raw);
}
```

### Test Web Worker
```typescript
import { useFileWorker } from './hooks/useFileWorker';

function TestComponent() {
  const { processFile, isReady } = useFileWorker();

  useEffect(() => {
    if (!isReady) return;

    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

    processFile(testFile).then(result => {
      console.log('Worker result:', result);
    });
  }, [isReady]);
}
```

---

## 🎯 Migration Checklist

- [ ] Install backend dependencies (`cd server && npm install`)
- [ ] Configure environment variables (`.env.local` and `server/.env`)
- [ ] Start backend server (`npm run server`)
- [ ] Update API calls to use proxy (or use compatibility wrapper)
- [ ] Integrate secure storage for sensitive data
- [ ] Replace object URL creation with tracked version
- [ ] Add virtual scrolling for chat messages
- [ ] Integrate Web Workers for file processing
- [ ] Wrap components with error boundaries
- [ ] Remove `any` types and improve TypeScript strictness
- [ ] Extract custom hooks where applicable
- [ ] Test all features in development
- [ ] Run security audit
- [ ] Deploy to staging
- [ ] Run load tests
- [ ] Deploy to production

---

## 📝 Notes

- **Backwards Compatibility:** All new features are opt-in and don't break existing code
- **Gradual Migration:** You can migrate features one at a time
- **Fallback Support:** All features have fallbacks if they fail to initialize
- **Development Mode:** You can still use direct API calls in development by setting `VITE_USE_BACKEND_PROXY=false`

---

For questions or issues during migration, refer to the main `PRODUCTION_READY.md` documentation.