/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

type SearchTimeRange = 'all' | 'month' | 'year' | '3year';

const getTimeConstraintString = (timeRange: SearchTimeRange): string => {
    const now = new Date();
    let fromDate: Date;

    switch (timeRange) {
        case 'month':
            fromDate = new Date();
            fromDate.setMonth(now.getMonth() - 1);
            break;
        case 'year':
            fromDate = new Date();
            fromDate.setFullYear(now.getFullYear() - 1);
            break;
        case '3year':
            fromDate = new Date();
            fromDate.setFullYear(now.getFullYear() - 3);
            break;
        case 'all':
        default:
            return '';
    }
    
    const yyyy = fromDate.getFullYear();
    const mm = String(fromDate.getMonth() + 1).padStart(2, '0');
    const dd = String(fromDate.getDate()).padStart(2, '0');
    
    return `published after ${yyyy}-${mm}-${dd}`;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { query, count, timeRange, sourcesToSearch } = req.body;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
        return res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
    }
    
    if (!query || !count || !timeRange || !sourcesToSearch) {
        return res.status(400).json({ error: 'Missing required search parameters.' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });

        const timeConstraint = getTimeConstraintString(timeRange);
        const sourcesString = sourcesToSearch.join(', ');

        const searchPrompt = `You are a professional academic research assistant. Your primary goal is to find verifiable information and return it in a structured format.

        Find the top ${count} most relevant, recent, and highly-cited academic papers on the topic of '${query}'${timeConstraint ? ` ${timeConstraint}`: ''}.

        You should prioritize results from the following high-authority academic sources: ${sourcesString}.

        For each paper found, extract the required information and directly return the complete findings as a JSON array that conforms to the provided schema. The JSON should be the only thing you output.

        Critical instructions for data extraction:
        1.  **Title**: The full, exact title of the paper.
        2.  **Authors**: A list of all authors.
        3.  **Journal**: The name of the journal or conference.
        4.  **Year**: The year of publication.
        5.  **URL**: This is critical. You MUST provide a working link. First, try to find the direct, canonical URL to the paper's main page (e.g., on PubMed, arXiv, or a publisher's site). If you cannot verify a direct URL, you MUST construct a Google Search URL for the paper's exact title (e.g., "https://www.google.com/search?q=A+new+method+for+X").
        6.  **Abstract**: The complete, verbatim abstract from the paper. You MUST NOT summarize, shorten, or invent an abstract. If the full abstract is not accessible, output the string "Abstract not available".
        
        If no relevant papers are found, return an empty JSON array [].`;
        
        const responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    authors: { type: Type.ARRAY, items: { type: Type.STRING } },
                    journal: { type: Type.STRING },
                    year: { type: Type.INTEGER },
                    abstract: { type: Type.STRING },
                    url: { type: Type.STRING, description: "The direct URL to the paper's page. This field is optional." },
                },
                required: ["title", "authors", "journal", "year", "abstract"],
            },
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: searchPrompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = groundingChunks
            .map(chunk => ({
                uri: chunk.web?.uri || '',
                title: chunk.web?.title || '',
            }))
            .filter(source => source.uri);

        const jsonText = (response.text || '[]').trim();
        let papers = [];
        
        try {
            papers = JSON.parse(jsonText);
        } catch (e) {
            console.error("Failed to parse JSON from single-step search call", e);
            throw new Error("Failed to get structured paper data from AI. The response was not valid JSON.");
        }
        
        return res.status(200).json({ papers, sources });

    } catch (error: any) {
        console.error('Error in search API:', error);
        return res.status(500).json({ error: error.message });
    }
}