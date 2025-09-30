import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Gemini AI with server-side API key
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3005',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting store (in-memory, use Redis in production)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;

// Rate limiting middleware
const rateLimit = (req, res, next) => {
  const identifier = req.ip || req.socket.remoteAddress;
  const now = Date.now();

  if (!rateLimitStore.has(identifier)) {
    rateLimitStore.set(identifier, []);
  }

  const requests = rateLimitStore.get(identifier);
  const recentRequests = requests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);

  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - recentRequests[0])) / 1000)
    });
  }

  recentRequests.push(now);
  rateLimitStore.set(identifier, recentRequests);

  next();
};

// Clean up rate limit store periodically
setInterval(() => {
  const now = Date.now();
  for (const [identifier, timestamps] of rateLimitStore.entries()) {
    const recentRequests = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
    if (recentRequests.length === 0) {
      rateLimitStore.delete(identifier);
    } else {
      rateLimitStore.set(identifier, recentRequests);
    }
  }
}, RATE_LIMIT_WINDOW);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gemini API proxy endpoint - Generate content
app.post('/api/gemini/generate', rateLimit, async (req, res) => {
  try {
    const { model, contents, systemInstruction, generationConfig } = req.body;

    if (!model || !contents) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: model and contents'
      });
    }

    // Validate model name
    const allowedModels = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-2.0-flash-exp',
      'gemini-2.5-flash',
      'gemini-exp-1206'
    ];

    if (!allowedModels.includes(model)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid model name'
      });
    }

    // Get the model
    const geminiModel = genAI.getGenerativeModel({
      model,
      systemInstruction
    });

    // Generate content
    const result = await geminiModel.generateContent({
      contents,
      generationConfig
    });

    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      text,
      response: {
        candidates: response.candidates,
        usageMetadata: response.usageMetadata
      }
    });

  } catch (error) {
    console.error('Gemini API Error:', error);

    // Handle specific error types
    if (error.status === 429) {
      return res.status(429).json({
        error: 'Rate Limit',
        message: 'Gemini API rate limit exceeded. Please try again later.'
      });
    }

    if (error.status === 400) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Invalid request to Gemini API'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Gemini API proxy endpoint - Generate content stream
app.post('/api/gemini/generate-stream', rateLimit, async (req, res) => {
  try {
    const { model, contents, systemInstruction, generationConfig } = req.body;

    if (!model || !contents) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: model and contents'
      });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Get the model
    const geminiModel = genAI.getGenerativeModel({
      model,
      systemInstruction
    });

    // Generate content stream
    const result = await geminiModel.generateContentStream({
      contents,
      generationConfig
    });

    // Stream chunks to client
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
    }

    // Send final message
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('Gemini Stream API Error:', error);

    res.write(`data: ${JSON.stringify({
      error: true,
      message: error.message
    })}\n\n`);
    res.end();
  }
});

// Gemini API proxy endpoint - Chat session
app.post('/api/gemini/chat', rateLimit, async (req, res) => {
  try {
    const { model, history, message, systemInstruction, generationConfig } = req.body;

    if (!model || !message) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: model and message'
      });
    }

    // Get the model
    const geminiModel = genAI.getGenerativeModel({
      model,
      systemInstruction
    });

    // Start chat session
    const chat = geminiModel.startChat({
      history: history || [],
      generationConfig
    });

    // Send message
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      text,
      response: {
        candidates: response.candidates,
        usageMetadata: response.usageMetadata
      }
    });

  } catch (error) {
    console.error('Gemini Chat API Error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to send chat message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Privatas API Server running on port ${PORT}`);
  console.log(`📡 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3005'}`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    console.log('HTTP server closed');
  });
});