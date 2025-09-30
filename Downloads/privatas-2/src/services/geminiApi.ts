// Client-side API service for communicating with backend proxy
// This replaces direct Gemini API calls with secure backend proxying

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface GeminiGenerateRequest {
  model: string;
  contents: any[];
  systemInstruction?: string;
  generationConfig?: any;
}

interface GeminiChatRequest {
  model: string;
  history?: any[];
  message: string;
  systemInstruction?: string;
  generationConfig?: any;
}

interface GeminiResponse {
  success: boolean;
  text: string;
  response: {
    candidates: any[];
    usageMetadata?: any;
  };
}

interface ApiError {
  error: string;
  message: string;
  details?: string;
  retryAfter?: number;
}

export class GeminiApiService {
  private static async handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
      const error: ApiError = await response.json();

      if (response.status === 429) {
        throw new Error(
          `Rate limit exceeded. Please try again in ${error.retryAfter || 60} seconds.`
        );
      }

      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  /**
   * Generate content using Gemini API
   */
  static async generateContent(request: GeminiGenerateRequest): Promise<GeminiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/gemini/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }

  /**
   * Generate content stream using Gemini API (SSE)
   */
  static async generateContentStream(
    request: GeminiGenerateRequest,
    onChunk: (text: string) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/gemini/generate-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.message || 'Stream API request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              onComplete?.();
              return;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.error) {
                throw new Error(parsed.message);
              }

              if (parsed.text) {
                onChunk(parsed.text);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

      onComplete?.();
    } catch (error) {
      console.error('Gemini Stream API Error:', error);
      onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Send chat message using Gemini API
   */
  static async sendChatMessage(request: GeminiChatRequest): Promise<GeminiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/gemini/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Gemini Chat API Error:', error);
      throw error;
    }
  }

  /**
   * Health check for API server
   */
  static async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('API server is not reachable');
    }
  }
}

// Legacy compatibility wrapper for existing code
// This allows gradual migration from direct AI calls to proxy calls
export function createProxiedAI() {
  return {
    models: {
      generateContent: async (config: {
        model: string;
        contents: any;
        systemInstruction?: string;
        generationConfig?: any;
      }) => {
        const response = await GeminiApiService.generateContent({
          model: config.model,
          contents: Array.isArray(config.contents) ? config.contents : [config.contents],
          systemInstruction: config.systemInstruction,
          generationConfig: config.generationConfig,
        });

        // Return in same format as direct AI call
        return {
          response: {
            text: () => response.text,
            candidates: response.response.candidates,
            usageMetadata: response.response.usageMetadata,
          },
        };
      },
    },
  };
}