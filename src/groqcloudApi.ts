// Utility to call GroqCloud API
interface GroqCloudMessage {
    role: 'user' | 'assistant' | string;
    content: string;
}

interface GroqCloudRequestBody {
    model: string;
    messages: GroqCloudMessage[];
}

interface GroqCloudChoice {
    message: GroqCloudMessage;
    [key: string]: any;
}

interface GroqCloudResponse {
    choices?: GroqCloudChoice[];
    [key: string]: any;
}

export async function fetchGroqCloudResponse(prompt: string): Promise<string> {
    const apiKey: string = import.meta.env.VITE_GROQCLOUD_API_KEY;
    if (!apiKey) {
        console.error('[GroqCloud API] API key is missing! Check your .env file and restart the dev server.');
        throw new Error('GroqCloud API key is missing');
    }
    console.log('[GroqCloud API] Using API key:', apiKey.slice(0, 6) + '...'); // Only show first 6 chars for safety
    const endpoint = 'https://api.groqcloud.com/v1/chat/completions';
    try {
        const response: Response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'llama3-8b-8192', // Change model if needed
                messages: [
                    { role: 'user', content: prompt }
                ]
            } as GroqCloudRequestBody)
        });
        if (!response.ok) {
            const text = await response.text();
            console.error('[GroqCloud API] Response not OK:', response.status, text);
            throw new Error('GroqCloud API error: ' + response.status + ' ' + text);
        }
        const data: GroqCloudResponse = await response.json();
        return data.choices?.[0]?.message?.content || '';
    } catch (err) {
        console.error('[GroqCloud API] Network or fetch error:', err);
        throw err;
    }
}
