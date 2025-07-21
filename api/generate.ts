/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI } from "@google/genai";

// This is a Vercel Edge Function for optimal streaming performance.
export const config = {
  runtime: 'edge',
};

// A helper to create a streaming response
function createStreamingResponse(stream: ReadableStream, status: number = 200) {
  return new Response(stream, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

// Main API handler
export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { model, prompt, systemInstruction, history, config } = await req.json();
        const [provider, modelName] = model.split('/');
        
        let apiKey: string | undefined;
        switch (provider) {
            case 'gemini':
                apiKey = process.env.GEMINI_API_KEY;
                break;
            case 'openai':
                apiKey = process.env.OPENAI_API_KEY;
                break;
            case 'deepseek':
                apiKey = process.env.DEEPSEEK_API_KEY;
                break;
            case 'claude':
                apiKey = process.env.CLAUDE_API_KEY;
                break;
            case 'proxy':
                 apiKey = process.env.PROXY_API_KEY;
                 break;
            default:
                return new Response(`Unknown provider: ${provider}`, { status: 400 });
        }

        if (!apiKey) {
            return new Response(`API key for ${provider} is not configured on the server.`, { status: 500 });
        }

        if (provider === 'gemini') {
            const stream = await streamFromGemini(apiKey, modelName, prompt, systemInstruction, history, config);
            return createStreamingResponse(stream);
        } else {
            const stream = await streamFromFetch(provider, apiKey, modelName, prompt, systemInstruction, history, config);
            return createStreamingResponse(stream);
        }

    } catch (error: any) {
        console.error('Error in generate API:', error);
        return new Response(error.message, { status: 500 });
    }
}

// Specific handler for Gemini streaming
async function streamFromGemini(apiKey: string, modelName: string, prompt: string, systemInstruction: string, history: any[], config: any): Promise<ReadableStream> {
    const ai = new GoogleGenAI({ apiKey });
    
    const geminiConfig: any = { ...config };
     if (systemInstruction) {
        geminiConfig.systemInstruction = systemInstruction;
    }
    const thinkingBudget = Math.min(1500, Math.floor(config.maxOutputTokens * 0.25));
    if (modelName === 'gemini-2.5-flash' && config.maxOutputTokens > thinkingBudget) {
        geminiConfig.thinkingConfig = { thinkingBudget };
    }

    const contents = history.length > 0
        ? [...history.map((msg: any) => ({ role: msg.role, parts: [{ text: msg.text }] })), { role: 'user', parts: [{ text: prompt }] }]
        : prompt;

    const responseStream = await ai.models.generateContentStream({
        model: modelName,
        contents: contents,
        config: geminiConfig,
    });

    const { readable, writable } = new TransformStream<any, Uint8Array>();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
        for await (const chunk of responseStream) {
            if (chunk.text) {
                await writer.write(encoder.encode(chunk.text));
            }
        }
        await writer.close();
    })();

    return readable;
}


// Generic handler for other providers (OpenAI, Claude, etc.)
async function streamFromFetch(provider: string, apiKey: string, modelName: string, prompt: string, systemInstruction: string, history: any[], config: any): Promise<ReadableStream> {
    let url = '';
    let headers: Record<string, string> = { 'Content-Type': 'application/json' };
    let body: any = {};

    if (provider === 'openai' || provider === 'deepseek' || provider === 'proxy') {
        if (provider === 'openai') {
            url = 'https://api.openai.com/v1/chat/completions';
        } else if (provider === 'deepseek') {
            url = 'https://api.deepseek.com/chat/completions';
        } else if (provider === 'proxy') {
            url = 'https://api.aiclaude.site/v1/chat/completions';
        }
        headers['Authorization'] = `Bearer ${apiKey}`;
        const messages: { role: 'system' | 'user' | 'assistant', content: string }[] = history ? history.map(msg => ({ role: msg.role === 'model' ? 'assistant' : 'user', content: msg.text })) : [];
        if(systemInstruction) messages.unshift({ role: 'system', content: systemInstruction });
        messages.push({ role: 'user', content: prompt });

        body = {
            model: modelName,
            messages: messages,
            stream: true,
            temperature: config.temperature,
            top_p: config.topP,
            max_tokens: config.maxOutputTokens || undefined,
        };
    } else if (provider === 'claude') {
        url = 'https://api.anthropic.com/v1/messages';
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';

        const messages = history.map(msg => ({ role: msg.role === 'model' ? 'assistant' : 'user', content: msg.text }));
        messages.push({ role: 'user', content: prompt });
        
        body = {
            model: modelName,
            messages: messages,
            stream: true,
            system: systemInstruction,
            temperature: config.temperature,
            top_p: config.topP,
            top_k: config.topK,
            max_tokens: config.maxOutputTokens || 4096,
        };
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`External API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    if (!response.body) {
        throw new Error("External API response body is empty.");
    }
    
    // Create a TransformStream to process the SSE chunks
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    (async () => {
        const reader = response.body!.getReader();
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.substring(6);
                        if (data.trim() === '[DONE]') break;
                        try {
                            const parsed = JSON.parse(data);
                            let text = '';
                             if (provider === 'openai' || provider === 'deepseek' || provider === 'proxy') {
                                text = parsed.choices?.[0]?.delta?.content || '';
                            } else if (provider === 'claude') {
                                if (parsed.type === 'content_block_delta') {
                                    text = parsed.delta?.text || '';
                                }
                            }
                            if (text) {
                                await writer.write(encoder.encode(text));
                            }
                        } catch(e) {
                           // Ignore parsing errors for incomplete JSON
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Streaming error:", e);
            writer.abort(e);
        } finally {
            writer.close();
        }
    })();
    
    return readable;
}
