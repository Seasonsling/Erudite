/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { Chat, GenerateContentResponse, GoogleGenAI } from '@google/genai';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import JSZip from 'jszip';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { translations } from './translations.ts';
import { searchPapers, PaperMetadata, SearchSource } from './search.ts';
import { 
    INDIVIDUAL_NOTE_INSTRUCTION_EN, SYNTHESIS_INSTRUCTION_EN, SYNTHESIS_FROM_ABSTRACTS_INSTRUCTION_EN,
    SYNTHESIS_FROM_NOTES_INSTRUCTION_EN,
    individualTemplatesEn, GUIDING_PHILOSOPHY_EN
} from './instruction_en.ts';
import { 
    INDIVIDUAL_NOTE_INSTRUCTION_ZH, SYNTHESIS_INSTRUCTION_ZH, SYNTHESIS_FROM_ABSTRACTS_INSTRUCTION_ZH,
    SYNTHESIS_FROM_NOTES_INSTRUCTION_ZH,
    individualTemplatesZh, GUIDING_PHILOSOPHY_ZH
} from './instruction_zh.ts';
import { 
    INDIVIDUAL_NOTE_INSTRUCTION_DE, SYNTHESIS_INSTRUCTION_DE, SYNTHESIS_FROM_ABSTRACTS_INSTRUCTION_DE,
    SYNTHESIS_FROM_NOTES_INSTRUCTION_DE,
    individualTemplatesDe, GUIDING_PHILOSOPHY_DE
} from './instruction_de.ts';


interface ChatMessage {
    id: number;
    role: 'user' | 'model';
    text: string;
}

interface Note {
    id: number;
    sourceKey: string | number;
    content: string;
    chatHistory: ChatMessage[];
    isChatVisible: boolean;
    isChatLoading: boolean;
    isEditing: boolean;
    isGenerating: boolean;
}

interface PastedPaper {
    id: number;
    name: string;
    content: string;
}

interface UnifiedPaperSource {
    key: string | number;
    name: string;
    getContent: () => Promise<string>;
    statusName: string;
    isAbstract: boolean;
    file?: File;
}

interface ProgressStep {
    id: number;
    label: string;
    status: 'pending' | 'in-progress' | 'completed' | 'error';
}

const ALL_MODELS = {
    openai: [
        { id: "openai/gpt-4o-2024-08-06", name: "GPT-4o" },
        { id: "openai/gpt-4.1-2025-04-14", name: "GPT-4.1" },
        { id: "openai/o3-2025-04-16", name: "o3" },
        { id: "openai/gpt-4o-mini-2024-07-18", name: "GPT-4o mini" },
        { id: "openai/gpt-4.1-nano-2025-04-14", name: "GPT-4.1 nano" },
    ],
    gemini: [
        { id: "gemini/gemini-2.5-pro", name: "Gemini 2.5 Pro" },
        { id: "gemini/gemini-2.5-flash", name: "Gemini 2.5 Flash" },
        { id: "gemini/gemini-2.0-flash-thinking", name: "Gemini 2.0 Flash Thinking" },
        { id: "gemini/gemini-2.0-flash-lite", name: "Gemini 2.0 Flash-Lite" },
    ],
    claude: [
        { id: "claude/claude-opus-4-20250514", name: "Claude Opus 4" },
        { id: "claude/claude-sonnet-4-20250514", name: "Claude Sonnet 4" },
        { id: "claude/claude-3-5-haiku-20241022", name: "Claude Haiku 3.5" },
        { id: "claude/claude-3-haiku-20240307", name: "Claude 3 Haiku" },
    ],
    deepseek: [
        { id: "deepseek/deepseek-reasoner", name: "DeepSeek-R1" },
        { id: "deepseek/deepseek-chat", name: "DeepSeek-V3" },
    ],
    proxy: [
        { id: "proxy/claude-3-5-sonnet-20240620", name: "Claude 3.5 Sonnet (Proxy)" },
        { id: "proxy/gemini-2.5-flash", name: "Gemini 2.5 Flash (Proxy)" },
        { id: "proxy/deepseek-chat", name: "DeepSeek Chat (Proxy)" },
    ]
};

type SearchTimeRange = 'all' | 'month' | 'year' | '3year';
type PaperTemplateType = 'auto' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
type Language = 'en' | 'zh' | 'de';

const instructions = {
    en: {
        individual: INDIVIDUAL_NOTE_INSTRUCTION_EN,
        philosophy: GUIDING_PHILOSOPHY_EN,
        templates: individualTemplatesEn,
        synthesis: SYNTHESIS_INSTRUCTION_EN,
        synthesis_abstracts: SYNTHESIS_FROM_ABSTRACTS_INSTRUCTION_EN,
        synthesis_notes: SYNTHESIS_FROM_NOTES_INSTRUCTION_EN,
    },
    zh: {
        individual: INDIVIDUAL_NOTE_INSTRUCTION_ZH,
        philosophy: GUIDING_PHILOSOPHY_ZH,
        templates: individualTemplatesZh,
        synthesis: SYNTHESIS_INSTRUCTION_ZH,
        synthesis_abstracts: SYNTHESIS_FROM_ABSTRACTS_INSTRUCTION_ZH,
        synthesis_notes: SYNTHESIS_FROM_NOTES_INSTRUCTION_ZH,
    },
    de: {
        individual: INDIVIDUAL_NOTE_INSTRUCTION_DE,
        philosophy: GUIDING_PHILOSOPHY_DE,
        templates: individualTemplatesDe,
        synthesis: SYNTHESIS_INSTRUCTION_DE,
        synthesis_abstracts: SYNTHESIS_FROM_ABSTRACTS_INSTRUCTION_DE,
        synthesis_notes: SYNTHESIS_FROM_NOTES_INSTRUCTION_DE,
    }
};

const cleanMarkdown = (text: string): string => {
    let cleaned = text.trim();
    if (cleaned.startsWith('```markdown')) {
      cleaned = cleaned.substring('```markdown'.length).trimStart();
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.substring(3).trimStart();
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3).trimEnd();
    }
    return cleaned;
};

const parseNoteContent = (rawContent: string) => {
    const frontMatterRegex = /^---\s*\n([\s\S]+?)\n---\s*/;
    const match = rawContent.match(frontMatterRegex);

    if (match) {
        const frontMatter = match[1].trim();
        const body = rawContent.substring(match[0].length).trim();
        return { frontMatter, body };
    }

    return { frontMatter: null, body: rawContent };
};

const ApiKeyModal = ({ currentKeys, onSave, onClose, lang }: { currentKeys: Record<string, string>, onSave: (keys: Record<string, string>) => void, onClose: () => void, lang: Language }) => {
    const [keys, setKeys] = useState(currentKeys);
    const t = translations[lang].ui.apiKeyModal;

    const handleKeyChange = (provider: string, value: string) => {
        setKeys(prev => ({ ...prev, [provider]: value }));
    };

    const providers = [
        { id: 'gemini', name: t.gemini },
        { id: 'openai', name: t.openai },
        { id: 'claude', name: t.claude },
        { id: 'deepseek', name: t.deepseek },
        { id: 'proxy', name: t.proxy },
    ];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-button" onClick={onClose} aria-label={t.close}>&times;</button>
                <h2>{t.title}</h2>
                <p className="modal-disclaimer">{t.disclaimer}</p>
                <div className="api-key-form">
                    {providers.map(p => (
                        <div className="api-key-group" key={p.id}>
                            <label htmlFor={`api-key-${p.id}`}>{p.name}</label>
                            <input
                                id={`api-key-${p.id}`}
                                type="password"
                                value={keys[p.id] || ''}
                                onChange={(e) => handleKeyChange(p.id, e.target.value)}
                                placeholder={t.placeholder}
                            />
                        </div>
                    ))}
                </div>
                <div className="modal-actions">
                    <button className="save-keys-button" onClick={() => onSave(keys)}>{t.save}</button>
                </div>
            </div>
        </div>
    );
};

const InstructionModal = ({ onClose, lang }: { onClose: () => void, lang: Language }) => {
    const t = translations[lang].modal;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-button" onClick={onClose} aria-label="Close instructions">&times;</button>
                <h2>{t.title}</h2>
                <p>{t.intro}</p>
                <ol>
                     <li>
                        <strong>{t.step1.title}</strong> {t.step1.body}
                    </li>
                    <li>
                        <strong>{t.step2.title}</strong> {t.step2.body}
                    </li>
                    <li>
                        <strong>{t.step3.title}</strong>
                        <ul>
                            <li><strong>{t.step3.option1.title}</strong> {t.step3.option1.body}</li>
                            <li><strong>{t.step3.option2.title}</strong> {t.step3.option2.body}</li>
                        </ul>
                    </li>
                    <li>
                        <strong>{t.step4.title}</strong> {t.step4.body}
                    </li>
                    <li>
                        <strong>{t.step5.title}</strong>
                        <ul>
                            <li><strong>{t.step5.action1}</strong> {t.step5.action1_desc}</li>
                            <li><strong>{t.step5.action2}</strong> {t.step5.action2_desc}</li>
                             <li><strong>{t.step5.action5}</strong> {t.step5.action5_desc}</li>
                            <li><strong>{t.step5.action3}</strong> {t.step5.action3_desc}</li>
                            <li><strong>{t.step5.action4}</strong> {t.step5.action4_desc}</li>
                        </ul>
                    </li>
                </ol>
                <p>{t.outro}</p>
            </div>
        </div>
    );
};

const TemplateEditorModal = ({ templateId, customContent, onSave, onReset, onClose, lang }: { templateId: PaperTemplateType, customContent?: string, onSave: (id: string, content: string) => void, onReset: (id: string) => void, onClose: () => void, lang: Language }) => {
    const t = translations[lang].ui.templateEditor;
    
    const originalTemplate = useMemo(() => {
        if (templateId === 'auto' || !templateId) return '';
        const templateMap = instructions[lang].templates as Record<string, string>;
        return templateMap[templateId] ?? '';
    }, [templateId, lang]);

    const [content, setContent] = useState(customContent ?? originalTemplate);

    useEffect(() => {
        if (customContent === undefined) {
            setContent(originalTemplate);
        }
    }, [originalTemplate, customContent]);


    const handleSave = () => {
        onSave(templateId, content);
    };

    const handleReset = () => {
        onReset(templateId);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="template-editor-modal" onClick={e => e.stopPropagation()}>
                <button className="modal-close-button" onClick={onClose} aria-label={t.close}>&times;</button>
                <h2>{t.title(templateId)}</h2>
                <p>{t.description}</p>
                <textarea
                    className="template-editor-textarea"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    aria-label={t.title(templateId)}
                />
                <div className="modal-actions template-editor-actions">
                    <button className="secondary-button" onClick={handleReset}>{t.reset}</button>
                    <button className="save-keys-button" onClick={handleSave}>{t.save}</button>
                </div>
            </div>
        </div>
    );
};


const ProgressTracker = ({ steps }: { steps: ProgressStep[] }) => {
    const getStatusIcon = (status: ProgressStep['status']) => {
        switch (status) {
            case 'completed':
                return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="progress-icon completed"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
            case 'in-progress':
                return <span className="loader-small progress-icon"></span>;
            case 'error':
                 return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="progress-icon error"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;
            case 'pending':
            default:
                return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="progress-icon pending"><circle cx="12" cy="12" r="10"></circle></svg>;
        }
    };

    return (
        <div className="progress-tracker">
            {steps.map((step, index) => (
                <div key={step.id} className={`progress-step ${step.status}`}>
                    {getStatusIcon(step.status)}
                    <span className="progress-label">{step.label}</span>
                </div>
            ))}
        </div>
    );
};

const App = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [pastedPapers, setPastedPapers] = useState<PastedPaper[]>([{ id: Date.now(), name: '', content: '' }]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [editingContent, setEditingContent] = useState<string>('');
    const [copySuccessId, setCopySuccessId] = useState<number | null>(null);
    const [generationMode, setGenerationMode] = useState<'deep_read' | 'synthesis'>('deep_read');
    const [selectedModel, setSelectedModel] = useState<string>('gemini/gemini-2.5-pro');
    const [isInstructionModalOpen, setIsInstructionModalOpen] = useState(false);
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
    const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
    const [language, setLanguage] = useState<Language>('zh');
    const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
    const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
    
    // Synthesis Mode State
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchCount, setSearchCount] = useState(10);
    const [searchTimeRange, setSearchTimeRange] = useState<SearchTimeRange>('all');
    const [searchResults, setSearchResults] = useState<PaperMetadata[]>([]);
    const [searchSources, setSearchSources] = useState<SearchSource[]>([]);
    const [expandedResultIndex, setExpandedResultIndex] = useState<number | null>(null);
    const availableSources = ['PubMed', 'Google Scholar', 'arXiv', 'Nature', 'Science', 'Cell', 'Semantic Scholar', 'bioRxiv'];
    const [selectedSources, setSelectedSources] = useState<string[]>(['PubMed', 'Google Scholar', 'arXiv']);

    const [isAdvancedPopoverOpen, setIsAdvancedPopoverOpen] = useState(false);
    const [temperature, setTemperature] = useState(0.6);
    const [topP, setTopP] = useState(0.95);
    const [topK, setTopK] = useState(64);
    const [maxOutputTokens, setMaxOutputTokens] = useState<number | ''>('');
    
    // Feature State
    const [selectedPaperType, setSelectedPaperType] = useState<PaperTemplateType>('auto');
    const [activePdfNote, setActivePdfNote] = useState<{note: Note, file: File} | null>(null);
    const [customTemplates, setCustomTemplates] = useState<Record<string, string>>({});
    const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);
    const [editingTemplateId, setEditingTemplateId] = useState<PaperTemplateType | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const advancedControlsRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const t = useMemo(() => translations[language], [language]);

    useEffect(() => {
        try {
            const storedTemplates = localStorage.getItem('erudite-custom-templates');
            if (storedTemplates) setCustomTemplates(JSON.parse(storedTemplates));
            
            const storedKeys = localStorage.getItem('erudite-api-keys');
            if (storedKeys) {
                setApiKeys(JSON.parse(storedKeys));
            }

        } catch (e) {
            console.error("Failed to parse from localStorage", e);
        }
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;
    }, []);

    const handleSaveApiKeys = (keys: Record<string, string>) => {
        setApiKeys(keys);
        localStorage.setItem('erudite-api-keys', JSON.stringify(keys));
        setIsApiKeyModalOpen(false);
    };
    
    const handleSaveCustomTemplate = (templateId: string, content: string) => {
        const newCustomTemplates = { ...customTemplates, [templateId]: content };
        setCustomTemplates(newCustomTemplates);
        localStorage.setItem('erudite-custom-templates', JSON.stringify(newCustomTemplates));
        setIsTemplateEditorOpen(false);
    };

    const handleResetCustomTemplate = (templateId: string) => {
        const newCustomTemplates = { ...customTemplates };
        delete newCustomTemplates[templateId];
        setCustomTemplates(newCustomTemplates);
        localStorage.setItem('erudite-custom-templates', JSON.stringify(newCustomTemplates));
        setIsTemplateEditorOpen(false);
    };

    const maxTokensForModel = useMemo(() => {
        const [provider, modelName] = selectedModel.split('/');
        if (provider === 'gemini' && modelName === 'gemini-2.5-pro') return 65536;
        if (provider === 'gemini' && modelName === 'gemini-2.5-flash') return 8192;
        if (provider === 'openai' && modelName.startsWith('gpt-4')) return 128000;
        return 16385; // A safe default
    }, [selectedModel]);
    
    useEffect(() => {
        setMaxOutputTokens(maxTokensForModel);
    }, [maxTokensForModel]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (advancedControlsRef.current && !advancedControlsRef.current.contains(event.target as Node)) {
                setIsAdvancedPopoverOpen(false);
            }
        };

        if (isAdvancedPopoverOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isAdvancedPopoverOpen]);

    const handleFileChange = (newFiles: FileList | null) => {
        if (newFiles) {
            const pdfFiles = Array.from(newFiles).filter(file => file.type === 'application/pdf');
            setFiles(prevFiles => [...prevFiles, ...pdfFiles]);
        }
    };

    const handleDragEvent = (e: React.DragEvent<HTMLDivElement>, isEntering: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(isEntering);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        handleDragEvent(e, false);
        handleFileChange(e.dataTransfer.files);
    };

    const removeFile = (indexToRemove: number) => {
        setFiles(files.filter((_, index) => index !== indexToRemove));
    };

    const addPastedPaper = () => {
        setPastedPapers(prev => [...prev, { id: Date.now(), name: '', content: '' }]);
    };

    const removePastedPaper = (idToRemove: number) => {
        setPastedPapers(prev => prev.filter(p => p.id !== idToRemove));
    };

    const updatePastedPaper = (id: number, field: 'name' | 'content', value: string) => {
        setPastedPapers(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };
    
    const parsePdf = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                if (!event.target?.result) {
                    return reject(new Error(t.errors.fileReadFailed));
                }
                try {
                    const pdf = await pdfjsLib.getDocument({ data: event.target.result as ArrayBuffer }).promise;
                    let textContent = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const text = await page.getTextContent();
                        textContent += text.items.map(s => (s as any).str).join(' ');
                    }
                    resolve(textContent);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    };
    
    const buildGenerationConfig = () => {
        const config: any = {
            temperature,
            topP,
            topK,
        };

        if (maxOutputTokens && Number(maxOutputTokens) > 0) {
            config.maxOutputTokens = Number(maxOutputTokens);
        }
        return config;
    }

    const getUnifiedPaperSources = (): UnifiedPaperSource[] => {
        const allSources: UnifiedPaperSource[] = [];

        const searchPaperSources: UnifiedPaperSource[] = searchResults.map((p, index) => ({
            key: p.title + index,
            name: p.title,
            getContent: () => Promise.resolve(`Title: ${p.title}\nAuthors: ${p.authors.join(', ')}\nAbstract: ${p.abstract}`),
            statusName: p.title,
            isAbstract: true,
        }));
        
        const fileSources: UnifiedPaperSource[] = files.map(file => ({
            key: file.name + file.lastModified,
            name: file.name,
            getContent: () => parsePdf(file),
            statusName: file.name,
            isAbstract: false,
            file: file,
        }));
        
        const pastedSources: UnifiedPaperSource[] = pastedPapers
            .filter(p => p.content.trim() !== '')
            .map((p, index) => ({
                key: p.id,
                name: p.name.trim() || `${t.ui.paste.pastedPaper} ${index + 1}`,
                getContent: () => Promise.resolve(p.content),
                statusName: p.name.trim() || `${t.ui.paste.pastedPaper} ${index + 1}`,
                isAbstract: false,
            }));
            
        allSources.push(...searchPaperSources, ...fileSources, ...pastedSources);
        
        return allSources;
    };
    
    const updateProgress = (stepId: number, status: ProgressStep['status']) => {
        setProgressSteps(prev => prev.map(s => s.id === stepId ? { ...s, status } : s));
    };

    const handleStop = () => {
        abortControllerRef.current?.abort();
    };

    const getSystemInstruction = (paperType: PaperTemplateType, lang: Language) => {
        const langInstructions = instructions[lang];
        const customTemplateContent = customTemplates[paperType as string];
    
        // If a user has a custom template saved, it takes the highest priority.
        if (customTemplateContent) {
            return customTemplateContent;
        }
    
        // If set to auto-detect, use the full instruction set which includes the decision protocol.
        if (paperType === 'auto') {
            return langInstructions.individual;
        }
    
        // If a specific template is manually selected, build an optimized prompt.
        const template = (langInstructions.templates as Record<string, string>)[paperType];
        if (template) {
            // Combine *only* the Guiding Philosophy with the specific template.
            // This skips the redundant Zero-Shot Decision Protocol.
            const philosophy = langInstructions.philosophy || '';
            const finalInstruction = `${philosophy}\n\n---
### **Part 3: The Master Templates**

First, you need to construct the document name: paper publication date + paper title, for example, "2023-04-17-Training-language-models-to-follow-instructions-with-human.md"

${template}`;
            return finalInstruction;
        }
        
        // Fallback to the full instruction set if something goes wrong.
        return langInstructions.individual;
    };
    
    const handleUnifiedAnalysis = async () => {
        const allPaperSources = getUnifiedPaperSources();

        let paperSourcesToAnalyze = allPaperSources;
        if (generationMode === 'deep_read') {
            const existingSourceKeys = new Set(notes.map(n => n.sourceKey));
            paperSourcesToAnalyze = allPaperSources.filter(p => !existingSourceKeys.has(p.key));
        }
        
        if (paperSourcesToAnalyze.length === 0) {
            if (allPaperSources.length > 0 && generationMode === 'deep_read') {
                // All papers already have notes, do nothing.
                setError(t.errors.allPapersAnalyzed);
            } else if (allPaperSources.length === 0) {
                setError(t.errors.noInput);
            }
            return;
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsLoading(true);
        setError(null);
        if (generationMode === 'synthesis') {
            setNotes([]);
        }
        setIsAdvancedPopoverOpen(false);

        try {
            if (generationMode === 'deep_read') {
                await generateAllIndividualNotes(paperSourcesToAnalyze, updateProgress, controller.signal, language, selectedPaperType);
            } else { // Synthesis Mode
                const hasFullText = paperSourcesToAnalyze.some(p => !p.isAbstract);
                const isAbstractOnly = !hasFullText;

                const initialSteps: ProgressStep[] = [];
                let stepCounter = 1;
                initialSteps.push({ id: stepCounter++, label: t.status.preparingAnalysis, status: 'in-progress' });
                paperSourcesToAnalyze.forEach(p => {
                    initialSteps.push({ id: stepCounter++, label: t.status.parsing(p.statusName), status: 'pending' });
                });
                initialSteps.push({ id: stepCounter++, label: t.status.synthesizing(paperSourcesToAnalyze.length), status: 'pending' });
                initialSteps.push({ id: stepCounter++, label: t.status.finalizing, status: 'pending' });
                setProgressSteps(initialSteps);
                
                updateProgress(1, 'completed');

                await generateSynthesisReview(paperSourcesToAnalyze, isAbstractOnly, updateProgress, controller.signal, language);
                
                const finalizingStepId = paperSourcesToAnalyze.length + 3;
                updateProgress(finalizingStepId, 'completed');
            }
        } catch (e: any) {
            if (e.name === 'AbortError') {
                setError(t.errors.operationCancelled);
                setProgressSteps(prev => prev.map(s => s.status === 'in-progress' ? {...s, status: 'error', label: `${s.label} (${t.ui.buttons.stopped})`} : s));
            } else {
                console.error(e);
                setError(`${t.errors.genericError} ${e.message}`);
                setProgressSteps(prev => prev.map(s => s.status === 'in-progress' ? {...s, status: 'error'} : s));
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    const handleSynthesizeNotes = async () => {
        if (notes.length < 2) return;

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsLoading(true);
        setError(null);
        setIsAdvancedPopoverOpen(false);

        const initialSteps: ProgressStep[] = [
            { id: 1, label: t.status.preparingAnalysis, status: 'in-progress' },
            { id: 2, label: t.status.synthesizing(notes.length), status: 'pending' },
            { id: 3, label: t.status.finalizing, status: 'pending' }
        ];
        setProgressSteps(initialSteps);
        updateProgress(1, 'completed');

        const synthesisNoteId = Date.now();
        try {
            const combinedNotes = notes.map(note => {
                const { body } = parseNoteContent(cleanMarkdown(note.content));
                const sourceInfo = getUnifiedPaperSources().find(s => s.key === note.sourceKey);
                return `--- START OF NOTE for: ${sourceInfo?.name || 'Unknown Paper'} ---\n\n${body}\n\n--- END OF NOTE ---\n\n`;
            }).join('\n');
            
            updateProgress(2, 'in-progress');
            
            const synthesisNote: Note = {
                id: synthesisNoteId, sourceKey: 'synthesis-from-notes', content: '', chatHistory: [],
                isChatVisible: false, isChatLoading: false, isEditing: false, isGenerating: true,
            };
            setNotes([synthesisNote]);

            const userPrompt = t.prompts.synthesis_notes(notes.length, combinedNotes);
            const systemInstruction = instructions[language].synthesis_notes;
            
            const stream = generateStreamUnified({
                prompt: userPrompt,
                systemInstruction: systemInstruction,
                signal: controller.signal,
            });

            let fullResponse = '';
            for await (const chunk of stream) {
                if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');
                fullResponse += chunk;
                setNotes(prev => prev.map(n => n.id === synthesisNoteId ? { ...n, content: fullResponse } : n));
            }
            
            updateProgress(2, 'completed');
            updateProgress(3, 'completed');
            
            setNotes(prev => prev.map(n => n.id === synthesisNoteId ? { ...n, isGenerating: false } : n));

        } catch (e: any) {
            if (e.name === 'AbortError') {
                setError(t.errors.operationCancelled);
                setProgressSteps(prev => prev.map(s => s.status === 'in-progress' ? {...s, status: 'error', label: `${s.label} (${t.ui.buttons.stopped})`} : s));
            } else {
                console.error(e);
                setError(`${t.errors.genericError} ${e.message}`);
                setProgressSteps(prev => prev.map(s => s.status === 'in-progress' ? {...s, status: 'error'} : s));
            }
            setNotes(prev => prev.filter(n => n.id !== synthesisNoteId));

        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };
    
    const handleSourceSelectionChange = (source: string) => {
        setSelectedSources(prev => 
            prev.includes(source) 
            ? prev.filter(s => s !== source)
            : [...prev, source]
        );
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        if (selectedSources.length === 0) {
            setError(t.errors.noSourcesSelected);
            return;
        }

        const geminiApiKey = apiKeys['gemini'];
        if (!geminiApiKey) {
            setError(t.errors.geminiKeyMissingForSearch);
            return;
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsSearching(true);
        setError(null);
        setNotes([]);
        setSearchResults([]);
        setSearchSources([]);

        const searchStepLabel = t.status.searchingOnPlatform(selectedSources.join('/'), searchQuery);
        const initialSteps: ProgressStep[] = [
            { id: 1, label: t.status.preparingSearch, status: 'completed' },
            { id: 2, label: searchStepLabel, status: 'in-progress' },
            { id: 3, label: t.status.finalizing, status: 'pending' }
        ];
        setProgressSteps(initialSteps);

        try {
            const result = await searchPapers(
                searchQuery,
                searchCount,
                searchTimeRange,
                selectedSources,
                geminiApiKey,
                controller.signal
            );
            
            updateProgress(2, 'completed');
            
            updateProgress(3, 'in-progress');
            setSearchResults(result.papers);
            setSearchSources(result.sources);

            if (result.papers.length === 0) {
                setError(t.errors.noSearchResults);
            }
            
            await new Promise(resolve => setTimeout(resolve, 300));
            updateProgress(3, 'completed');

        } catch (e: any) {
            if (e.name === 'AbortError') {
                 setError(t.errors.operationCancelled);
                 setProgressSteps(prev => prev.map(s => s.status === 'in-progress' ? {...s, status: 'error', label: `${s.label} (${t.ui.buttons.stopped})`} : s));
            } else {
                console.error(e);
                setError(`${t.errors.genericError} ${e.message}`);
                setProgressSteps(prev => prev.map(s => s.status === 'in-progress' ? {...s, status: 'error'} : s));
            }
        } finally {
            setIsSearching(false);
            abortControllerRef.current = null;
        }
    };

    const generateAllIndividualNotes = async (
        paperSources: UnifiedPaperSource[],
        updateProgress: (id: number, status: ProgressStep['status']) => void,
        signal: AbortSignal,
        lang: Language,
        paperType: PaperTemplateType
    ) => {
        const initialSteps: ProgressStep[] = [];
        let stepCounter = 1;
        initialSteps.push({ id: stepCounter++, label: t.status.preparingAnalysis, status: 'in-progress' });
        paperSources.forEach(p => {
            initialSteps.push({ id: stepCounter++, label: t.status.parsing(p.statusName), status: 'pending' });
            initialSteps.push({ id: stepCounter++, label: t.status.generating(p.name), status: 'pending' });
        });
        initialSteps.push({ id: stepCounter++, label: t.status.finalizing, status: 'pending' });
        setProgressSteps(initialSteps);
    
        updateProgress(1, 'completed');
    
        const newNotes: Note[] = paperSources.map((p, index) => ({
            id: Date.now() + index, sourceKey: p.key, content: '', chatHistory: [],
            isChatVisible: false, isChatLoading: false, isEditing: false, isGenerating: true,
        }));
        setNotes(prev => [...prev, ...newNotes]);
    
        const processingPromises = paperSources.map(async (paperSource, index) => {
            const noteId = newNotes[index].id;
            const parsingStepId = 2 + index * 2;
            const generatingStepId = 3 + index * 2;
    
            try {
                if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
                
                updateProgress(parsingStepId, 'in-progress');
                let paperText = '';
                try {
                    paperText = await paperSource.getContent();
                    if (!paperText.trim()) throw new Error(t.errors.pdfTextEmpty);
                    updateProgress(parsingStepId, 'completed');
                } catch(e: any) {
                    updateProgress(parsingStepId, 'error');
                    // Re-throw to be caught by the outer catch block of this promise
                    throw new Error(`\n**${t.errors.pdfParseError(paperSource.name)}:** ${e.message}\n`);
                }
    
                if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
                updateProgress(generatingStepId, 'in-progress');
    
                const systemInstruction = getSystemInstruction(paperType, lang);
                const userPrompt = t.prompts.individual(paperText, paperType);
    
                const stream = generateStreamUnified({
                    prompt: userPrompt,
                    systemInstruction: systemInstruction,
                    signal: signal
                });
    
                let fullResponse = '';
                for await (const chunk of stream) {
                    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
                    fullResponse += chunk;
                    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, content: fullResponse } : n));
                }
                updateProgress(generatingStepId, 'completed');
            } catch (e: any) {
                if (e.name === 'AbortError') {
                    // Propagate abort signals to be handled by the main Promise.all catch block
                    throw e;
                }
                // For other errors, update the specific note and progress steps
                setNotes(prev => prev.map(n => n.id === noteId ? { ...n, content: `${e.message}` } : n));
                if (generatingStepId) updateProgress(generatingStepId, 'error');
                // Ensure parsing step is also marked as error if it failed there
                if (parsingStepId && progressSteps.find(s=>s.id === parsingStepId)?.status !== 'completed') {
                    updateProgress(parsingStepId, 'error');
                }
            } finally {
                setNotes(prev => prev.map(n => n.id === noteId ? { ...n, isGenerating: false } : n));
            }
        });
    
        await Promise.all(processingPromises);
    
        const finalizingStepId = paperSources.length * 2 + 2;
        updateProgress(finalizingStepId, 'completed');
    };

    const generateSynthesisReview = async (paperSources: UnifiedPaperSource[], isAbstractOnly: boolean, updateProgress: (id: number, status: ProgressStep['status']) => void, signal: AbortSignal, lang: Language) => {
        const synthesisNote: Note = {
            id: Date.now(), sourceKey: 'synthesis-review', content: '', chatHistory: [],
            isChatVisible: false, isChatLoading: false, isEditing: false, isGenerating: true,
        };
        setNotes([synthesisNote]);

        let combinedText = '';
        for (const [index, paperSource] of paperSources.entries()) {
            const stepId = index + 2;
            updateProgress(stepId, 'in-progress');
            try {
                if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
                const paperText = await paperSource.getContent();
                if (!paperText.trim()) throw new Error(t.errors.pdfTextEmpty);
                combinedText += `--- START OF PAPER: ${paperSource.name} ---\n\n${paperText}\n\n--- END OF PAPER: ${paperSource.name} ---\n\n`;
                updateProgress(stepId, 'completed');
            } catch (e: any) {
                 setNotes(prev => prev.map(n => n.id === synthesisNote.id ? { ...n, content: `${n.content}\n**${t.errors.pdfParseError(paperSource.name)}:** ${e.message}\n` } : n));
                 updateProgress(stepId, 'error');
            }
        }
        
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
        const synthesizingStepId = paperSources.length + 2;
        updateProgress(synthesizingStepId, 'in-progress');

        const userPrompt = isAbstractOnly
            ? t.prompts.synthesis_abstracts(paperSources.length, combinedText)
            : t.prompts.synthesis(paperSources.length, combinedText);
        
        const systemInstruction = isAbstractOnly
            ? instructions[lang].synthesis_abstracts
            : instructions[lang].synthesis;
            
        const stream = generateStreamUnified({
            prompt: userPrompt,
            systemInstruction: systemInstruction,
            signal: signal,
        });

        let fullResponse = '';
        for await (const chunk of stream) {
            if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
            fullResponse += chunk;
            setNotes(prev => prev.map(n => n.id === synthesisNote.id ? { ...n, content: fullResponse } : n));
        }
        updateProgress(synthesizingStepId, 'completed');
        setNotes(prev => prev.map(n => n.id === synthesisNote.id ? { ...n, isGenerating: false } : n));
    };
    
    const handleDownload = async () => {
        const visibleNotes = notes.filter(note => note.content.trim() || note.isGenerating);
        if (visibleNotes.length === 0) {
            setError(t.errors.noNotesToDownload);
            return;
        }

        const generateNoteName = (note: Note) => {
            let downloadName = `erudite-note-${note.id}.md`;
            const noteToDownload = cleanMarkdown(note.content).trim();
            const titleMatch = noteToDownload.match(/^title:\s*"(.*)"/m);
            const dateMatch = noteToDownload.match(/^date:\s*".*?(\d{4}-\d{2}-\d{2})/m);
    
            if (note.sourceKey === 'synthesis-review' || note.sourceKey === 'synthesis-from-notes') {
                downloadName = 'synthesis-review.md';
            }

            if (titleMatch?.[1] && dateMatch?.[1]) {
                const date = dateMatch[1].trim();
                const title = titleMatch[1].trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-').substring(0, 150);
                if (date && title) downloadName = `${date}-${title}.md`;
            } else if (titleMatch?.[1]) {
                const title = titleMatch[1].trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-').substring(0, 150);
                downloadName = `synthesis-${title}.md`;
            }
            return downloadName;
        };

        if (visibleNotes.length > 1) {
            try {
                const zip = new JSZip();
                visibleNotes.forEach((note) => {
                    const downloadName = generateNoteName(note);
                    const noteToDownload = cleanMarkdown(note.content).trim();
                    zip.file(downloadName, noteToDownload);
                });

                const blob = await zip.generateAsync({ type: "blob" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'erudite-notes.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch(e: any) {
                console.error("Failed to create zip file:", e);
                setError(`${t.errors.genericError} ${e.message}`);
            }
        } else if (visibleNotes.length === 1) {
            const note = visibleNotes[0];
            const downloadName = generateNoteName(note);
            const noteToDownload = cleanMarkdown(note.content).trim();
            const blob = new Blob([noteToDownload], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = downloadName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const handleDownloadSearchResults = () => {
        if (searchResults.length === 0) return;

        try {
            const escapeCsvField = (field: string | number | undefined): string => {
                if (field === null || field === undefined) return '""';
                const stringField = String(field);
                const escapedField = stringField.replace(/"/g, '""');
                return `"${escapedField}"`;
            };

            const headers = ['Title', 'Authors', 'Journal', 'Year', 'Abstract', 'URL'];
            const csvRows = [headers.join(',')];

            searchResults.forEach(paper => {
                const row = [
                    escapeCsvField(paper.title),
                    escapeCsvField(paper.authors.join('; ')),
                    escapeCsvField(paper.journal),
                    escapeCsvField(paper.year),
                    escapeCsvField(paper.abstract),
                    escapeCsvField(paper.url)
                ].join(',');
                csvRows.push(row);
            });

            const csvString = csvRows.join('\n');
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'erudite-search-results.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e: any) {
            console.error("Download failed:", e);
            setError(`${t.errors.downloadFailed} ${e.message}`);
        }
    };

    const handleCopy = async (note: Note) => {
        if (!navigator.clipboard) {
            setError(t.errors.clipboardNotAvailable);
            return;
        }
        try {
            await navigator.clipboard.writeText(cleanMarkdown(note.content));
            setCopySuccessId(note.id);
            setTimeout(() => setCopySuccessId(null), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
            setError(t.errors.copyFailed);
        }
    };

    const handleEditClick = (note: Note) => {
        setEditingNoteId(note.id);
        setEditingContent(cleanMarkdown(note.content));
    };

    const handleSaveClick = (noteId: number) => {
        setNotes(notes.map(n => n.id === noteId ? { ...n, content: editingContent, isEditing: false } : n));
        setEditingNoteId(null);
        setEditingContent('');
    };

    const handleCancelClick = () => {
        setEditingNoteId(null);
        setEditingContent('');
    };
    
    const handlePasteInEditor = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        if (!e.clipboardData || !e.clipboardData.items) return;

        const imageItem = Array.from(e.clipboardData.items).find(item => item.type.startsWith('image/'));
        const imageFile = imageItem?.getAsFile();

        if (imageFile) {
            e.preventDefault();

            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Image = event.target?.result as string;
                if (base64Image) {
                    const textarea = e.currentTarget;
                    const selectionStart = textarea.selectionStart;
                    const selectionEnd = textarea.selectionEnd;
                    
                    const markdownImage = `\n![pasted-image](${base64Image})\n`;
    
                    const newValue = 
                        editingContent.substring(0, selectionStart) + 
                        markdownImage + 
                        editingContent.substring(selectionEnd);
                    
                    setEditingContent(newValue);
                    
                    setTimeout(() => {
                        textarea.focus();
                        const newCursorPosition = selectionStart + markdownImage.length;
                        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
                    }, 0);
                }
            };
            reader.onerror = () => {
                console.error("Error reading pasted image file.");
            };
            reader.readAsDataURL(imageFile);
        }
    };


    const toggleChat = (noteId: number) => {
        setNotes(notes.map(n => n.id === noteId ? { ...n, isChatVisible: !n.isChatVisible } : n));
    };
    
    async function* generateStreamUnified(
        { prompt, systemInstruction, history = [], signal }:
        { prompt: string, systemInstruction?: string, history?: ChatMessage[], signal?: AbortSignal }
    ): AsyncGenerator<string, void, unknown> {
        
        const modelConfig = buildGenerationConfig();
        const [provider, modelName] = selectedModel.split('/');

        const apiKey: string | undefined = apiKeys[provider];

        if (!apiKey) {
            throw new Error(t.errors.apiKeyMissing(provider));
        }

        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        
        // Gemini logic using @google/genai SDK
        if (provider === 'gemini') {
            const ai = new GoogleGenAI({ apiKey });
            
            const geminiConfig: any = { ...modelConfig };
            if (systemInstruction) {
                geminiConfig.systemInstruction = systemInstruction;
            }

            const thinkingBudget = Math.min(1500, Math.floor((modelConfig.maxOutputTokens || 8192) * 0.25));
            if (modelName === 'gemini-2.5-flash' && (modelConfig.maxOutputTokens || 8192) > thinkingBudget) {
                geminiConfig.thinkingConfig = { thinkingBudget };
            }
            
            const contents = history.length > 0
                ? [...history.map((msg: any) => ({ role: msg.role === 'model' ? 'model' : 'user', parts: [{ text: msg.text }] })), { role: 'user', parts: [{ text: prompt }] }]
                : prompt;

            const responseStream = await ai.models.generateContentStream({
                model: modelName,
                contents: contents,
                config: geminiConfig,
            });

            for await (const chunk of responseStream) {
                if (signal?.aborted) break;
                if (chunk.text) {
                    yield chunk.text;
                }
            }
            return;
        }

        // Logic for other providers using fetch
        let url = '';
        let headers: Record<string, string> = { 'Content-Type': 'application/json' };
        let body: any = {};

        if (provider === 'openai' || provider === 'deepseek' || provider === 'proxy') {
            if (provider === 'openai') url = 'https://api.openai.com/v1/chat/completions';
            else if (provider === 'deepseek') url = 'https://api.deepseek.com/chat/completions';
            else if (provider === 'proxy') url = 'https://api.aiclaude.site/v1/chat/completions';
            
            headers['Authorization'] = `Bearer ${apiKey}`;
            const messages: { role: 'system' | 'user' | 'assistant', content: string }[] = history ? history.map(msg => ({ role: msg.role === 'model' ? 'assistant' : 'user', content: msg.text })) : [];
            if(systemInstruction) messages.unshift({ role: 'system', content: systemInstruction });
            messages.push({ role: 'user', content: prompt });

            body = {
                model: modelName,
                messages: messages,
                stream: true,
                temperature: modelConfig.temperature,
                top_p: modelConfig.topP,
                max_tokens: modelConfig.maxOutputTokens || undefined,
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
                temperature: modelConfig.temperature,
                top_p: modelConfig.topP,
                top_k: modelConfig.topK,
                max_tokens: modelConfig.maxOutputTokens || 4096,
            };
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body),
            signal,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        if (!response.body) {
            throw new Error('Response body is empty.');
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        let buffer = '';
        while(true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (signal?.aborted) {
                reader.cancel();
                throw new DOMException('Aborted', 'AbortError');
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim() === '') continue;
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
                            yield text;
                        }
                    } catch(e) {
                       console.warn("Could not parse stream chunk:", data);
                    }
                }
            }
        }
    }

    const handleSendMessage = async (noteId: number, messageText: string) => {
        let noteToUpdate = notes.find(n => n.id === noteId);
        if (!noteToUpdate) return;
        
        const userMessage: ChatMessage = { role: 'user', text: messageText, id: Date.now() };
        const modelMessagePlaceholder: ChatMessage = { role: 'model', text: '', id: Date.now() + 1 };
        
        setNotes(notes.map(n => 
            n.id === noteId 
            ? { 
                ...n, 
                chatHistory: [...n.chatHistory, userMessage, modelMessagePlaceholder], 
                isChatLoading: true
            }
            : n
        ));
        
        try {
            const stream = generateStreamUnified({
                prompt: messageText,
                systemInstruction: t.prompts.chat(noteToUpdate.content),
                history: noteToUpdate.chatHistory,
            });

            let modelResponse = '';
            for await (const chunk of stream) {
                modelResponse += chunk;
                setNotes(prev => prev.map(n => {
                    if (n.id === noteId) {
                        const newHistory = [...n.chatHistory];
                        const lastMessage = newHistory[newHistory.length - 1];
                        if(lastMessage.role === 'model') {
                           lastMessage.text = modelResponse;
                        }
                        return { ...n, chatHistory: newHistory };
                    }
                    return n;
                }));
            }
        } catch(e: any) {
            const errorMessage: ChatMessage = { id: Date.now(), role: 'model', text: `Error: ${e.message}`};
            setNotes(prev => prev.map(n => {
                 if (n.id === noteId) {
                    const newHistory = [...n.chatHistory];
                    newHistory.splice(newHistory.length - 2, 2, errorMessage); // Replace user and placeholder with error
                    return { ...n, chatHistory: newHistory };
                }
                return n;
            }));
        } finally {
            setNotes(prev => prev.map(n => n.id === noteId ? { ...n, isChatLoading: false } : n));
        }
    };
    
    const handleRegenerateMessage = async (noteId: number, modelMessageId: number) => {
        const noteToUpdate = notes.find(n => n.id === noteId);
        if (!noteToUpdate) return;

        const modelMessageIndex = noteToUpdate.chatHistory.findIndex(m => m.id === modelMessageId);
        if (modelMessageIndex < 1 || noteToUpdate.chatHistory[modelMessageIndex - 1].role !== 'user') return;
        
        const historyForRegen = noteToUpdate.chatHistory.slice(0, modelMessageIndex - 1);
        const userMessage = noteToUpdate.chatHistory[modelMessageIndex - 1];
        
        setNotes(prev => prev.map(n => n.id === noteId ? { 
            ...n, 
            isChatLoading: true,
            chatHistory: n.chatHistory.map(m => m.id === modelMessageId ? { ...m, text: '' } : m)
        } : n));
        
        try {
             const stream = generateStreamUnified({
                prompt: userMessage.text,
                systemInstruction: t.prompts.chat(noteToUpdate.content),
                history: historyForRegen,
            });

            let modelResponse = '';

            for await (const chunk of stream) {
                modelResponse += chunk;
                setNotes(prev => prev.map(n => {
                    if (n.id === noteId) {
                        const newHistory = [...n.chatHistory];
                        const msgIndex = newHistory.findIndex(m => m.id === modelMessageId);
                        if (msgIndex !== -1) {
                            newHistory[msgIndex].text = modelResponse;
                        }
                        return { ...n, chatHistory: newHistory };
                    }
                    return n;
                }));
            }
        } catch(e: any) {
            const errorMessage = `Error: ${e.message}`;
            setNotes(prev => prev.map(n => {
                 if (n.id === noteId) {
                    const newHistory = [...n.chatHistory];
                    const msgIndex = newHistory.findIndex(m => m.id === modelMessageId);
                    if (msgIndex !== -1) {
                       newHistory[msgIndex].text = errorMessage;
                    }
                    return { ...n, chatHistory: newHistory };
                }
                return n;
            }));
        } finally {
             setNotes(prev => prev.map(n => n.id === noteId ? { ...n, isChatLoading: false } : n));
        }
    };
    
    const handleDeleteTurn = (noteId: number, userMessageId: number) => {
        setNotes(prev => prev.map(n => {
            if (n.id !== noteId) return n;
            
            const userMessageIndex = n.chatHistory.findIndex(m => m.id === userMessageId);
            if (userMessageIndex === -1) return n;
            
            const newHistory = [...n.chatHistory];
            newHistory.splice(userMessageIndex, 2); // Remove user message and model message
            
            return { ...n, chatHistory: newHistory };
        }));
    };
    
    const handleBranchConversation = (noteId: number, modelMessageId: number) => {
         setNotes(prev => prev.map(n => {
            if (n.id !== noteId) return n;
            
            const modelMessageIndex = n.chatHistory.findIndex(m => m.id === modelMessageId);
            if (modelMessageIndex === -1) return n;
            
            const newHistory = n.chatHistory.slice(0, modelMessageIndex + 1);
            
            return { ...n, chatHistory: newHistory };
        }));
    };
    
    const handleRegenerateNote = async (noteId: number) => {
        const noteToRegenerate = notes.find(n => n.id === noteId);
        if (!noteToRegenerate) return;
        
        const allPaperSources = getUnifiedPaperSources();
        const paperSource = allPaperSources.find(p => p.key === noteToRegenerate.sourceKey);
        
        if (!paperSource) {
            setError(t.errors.sourceNotFoundForNote);
            return;
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        
        setNotes(prev => prev.map(n => n.id === noteId ? { ...n, content: '', chatHistory: [], isChatVisible: false, isGenerating: true, isEditing: false } : n));
        
        try {
            const paperText = await paperSource.getContent();
            
            const systemInstruction = getSystemInstruction(selectedPaperType, language);
            const userPrompt = t.prompts.individual(paperText, selectedPaperType);

            const stream = generateStreamUnified({
                prompt: userPrompt,
                systemInstruction: systemInstruction,
                signal: controller.signal,
            });

            let fullResponse = '';
            for await (const chunk of stream) {
                if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');
                fullResponse += chunk;
                setNotes(prev => prev.map(n => n.id === noteId ? { ...n, content: fullResponse } : n));
            }
            // On success, mark as not generating
            setNotes(prev => prev.map(n => n.id === noteId ? { ...n, isGenerating: false } : n));
        } catch (e: any) {
             if (e.name === 'AbortError') {
                 // On abort, just mark as not generating
                 setNotes(prev => prev.map(n => n.id === noteId ? { ...n, isGenerating: false } : n));
             } else {
                setError(`${t.errors.genericError} ${e.message}`);
                // On failure, set error message and mark as not generating
                const errorMessage = `\n**${t.errors.genericError}** ${e.message}\n`;
                setNotes(prev => prev.map(n => n.id === noteId ? { ...n, content: errorMessage, isGenerating: false } : n));
            }
        } finally {
             if (abortControllerRef.current === controller) {
                abortControllerRef.current = null;
            }
        }
    };

    const handleDeleteNote = (noteId: number) => {
        setNotes(prev => prev.filter(n => n.id !== noteId));
    };

    const handleViewWithPdf = (note: Note) => {
        const allPaperSources = getUnifiedPaperSources();
        const source = allPaperSources.find(p => p.key === note.sourceKey);
        if (source?.file) {
            setActivePdfNote({ note, file: source.file });
        } else {
            setError(t.errors.sourceNotFoundForNote);
        }
    };

    const visibleNotes = notes.filter(note => note.content.trim() || note.id === (notes.find(n => n.id)?.id) || note.isGenerating);

    const maxTokensDescription = useMemo(() => {
        return t.ui.advancedSettings.maxOutputTokens.description(maxTokensForModel);
    }, [t, maxTokensForModel]);
    
    const papersForAnalysisCount = useMemo(() => {
        const pastedCount = pastedPapers.filter(p => p.content.trim() !== '').length;
        const fileCount = files.length;
        
        if (generationMode === 'synthesis') {
            return searchResults.length + fileCount + pastedCount;
        }
        
        // In deep_read mode, count only un-analyzed papers
        const existingSourceKeys = new Set(notes.map(n => n.sourceKey));
        const unanalyzedFiles = files.filter(f => !existingSourceKeys.has(f.name + f.lastModified)).length;
        const unanalyzedPasted = pastedPapers.filter(p => p.content.trim() !== '' && !existingSourceKeys.has(p.id)).length;
        
        return unanalyzedFiles + unanalyzedPasted;
    }, [searchResults, files, pastedPapers, notes, generationMode]);
        
    const isAnyNoteGenerating = useMemo(() => notes.some(n => n.isGenerating), [notes]);
    
    const LocalInputsComponent = () => (
        <>
            <div className="input-mode-selector">
                <button onClick={() => setInputMode('upload')} className={inputMode === 'upload' ? 'selected' : ''} disabled={isLoading || isSearching || isAnyNoteGenerating} aria-pressed={inputMode === 'upload'}>
                    {t.ui.tabs.upload}
                </button>
                <button onClick={() => setInputMode('paste')} className={inputMode === 'paste' ? 'selected' : ''} disabled={isLoading || isSearching || isAnyNoteGenerating} aria-pressed={inputMode === 'paste'}>
                    {t.ui.tabs.paste}
                </button>
            </div>

            {inputMode === 'upload' && (
                <>
                    <p className="input-section-description">{t.ui.description}</p>
                    <div 
                        className={`drop-zone ${isDragging ? 'active' : ''}`}
                        onDragEnter={(e) => handleDragEvent(e, true)}
                        onDragLeave={(e) => handleDragEvent(e, false)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                    >
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            multiple 
                            accept=".pdf"
                            onChange={(e) => handleFileChange(e.target.files)}
                            className="sr-only" 
                            id="file-input"
                            disabled={isLoading || isSearching || isAnyNoteGenerating}
                        />
                        <div className="drop-zone-text">
                            <svg className="upload-icon" xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                            <p>{t.ui.dropzone.title}</p>
                            <p className="subtle">{t.ui.dropzone.or}</p>
                            <button className="browse-button" onClick={() => fileInputRef.current?.click()} disabled={isLoading || isSearching || isAnyNoteGenerating}>
                                {t.ui.dropzone.button}
                            </button>
                        </div>
                    </div>
                    {files.length > 0 && (
                        <div className="file-list">
                            <h4>{t.ui.selectedFiles}</h4>
                            <ul>
                                {files.map((file, index) => (
                                    <li key={index}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                        <span>{file.name}</span>
                                        <button onClick={() => removeFile(index)} disabled={isLoading || isSearching || isAnyNoteGenerating} aria-label={`${t.ui.remove} ${file.name}`}>&times;</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            )}

            {inputMode === 'paste' && (
                 <div className="paste-zone">
                    <p className="input-section-description">{t.ui.paste.description}</p>
                    <div className="pasted-papers-list">
                        {pastedPapers.map((paper, index) => (
                            <div className="pasted-paper-item" key={paper.id}>
                                <div className="pasted-paper-header">
                                    <input
                                        type="text"
                                        placeholder={`${t.ui.paste.paperNamePlaceholder} ${index + 1}`}
                                        value={paper.name}
                                        onChange={(e) => updatePastedPaper(paper.id, 'name', e.target.value)}
                                        className="pasted-paper-name-input"
                                        disabled={isLoading || isSearching || isAnyNoteGenerating}
                                    />
                                    {pastedPapers.length > 1 && (
                                        <button 
                                            onClick={() => removePastedPaper(paper.id)} 
                                            disabled={isLoading || isSearching || isAnyNoteGenerating} 
                                            className="remove-pasted-paper-button"
                                            aria-label={`${t.ui.remove} ${t.ui.paste.pastedPaper} ${index + 1}`}
                                        >&times;</button>
                                    )}
                                </div>
                                <textarea
                                    placeholder={t.ui.paste.contentPlaceholder}
                                    value={paper.content}
                                    onChange={(e) => updatePastedPaper(paper.id, 'content', e.target.value)}
                                    className="pasted-paper-content-input"
                                    disabled={isLoading || isSearching || isAnyNoteGenerating}
                                    rows={10}
                                />
                            </div>
                        ))}
                    </div>
                    <button onClick={addPastedPaper} disabled={isLoading || isSearching || isAnyNoteGenerating} className="add-pasted-paper-button">
                        + {t.ui.paste.addPaperButton}
                    </button>
                 </div>
            )}

            {generationMode === 'deep_read' && (
                <div className="paper-type-selector">
                    <label htmlFor="paper-type-select">{t.ui.paperTypeSelector.label}</label>
                    <select
                        id="paper-type-select"
                        value={selectedPaperType}
                        onChange={e => setSelectedPaperType(e.target.value as PaperTemplateType)}
                        disabled={isLoading || isSearching || isAnyNoteGenerating}
                    >
                        <option value="auto">{t.ui.paperTypeSelector.auto}</option>
                        <option value="A">{t.ui.paperTypeSelector.templateA}</option>
                        <option value="B">{t.ui.paperTypeSelector.templateB}</option>
                        <option value="C">{t.ui.paperTypeSelector.templateC}</option>
                        <option value="D">{t.ui.paperTypeSelector.templateD}</option>
                        <option value="E">{t.ui.paperTypeSelector.templateE}</option>
                        <option value="F">{t.ui.paperTypeSelector.templateF}</option>
                    </select>
                    {selectedPaperType !== 'auto' && (
                         <button
                            className="edit-template-button"
                            onClick={() => {
                                setEditingTemplateId(selectedPaperType);
                                setIsTemplateEditorOpen(true);
                            }}
                            disabled={isLoading || isSearching || isAnyNoteGenerating}
                            title={t.ui.buttons.editTemplate}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                        </button>
                    )}
                </div>
            )}
        </>
    );
    
    if (activePdfNote) {
        return <TwoPaneViewer 
                    activeNote={activePdfNote.note} 
                    file={activePdfNote.file}
                    onClose={() => setActivePdfNote(null)}
                    lang={language}
                    t={t}
                    editingNoteId={editingNoteId}
                    editingContent={editingContent}
                    setEditingContent={setEditingContent}
                    handleSaveClick={handleSaveClick}
                    handleCancelClick={handleCancelClick}
                    handlePasteInEditor={handlePasteInEditor}
                    handleEditClick={handleEditClick}
                    handleCopy={handleCopy}
                    copySuccessId={copySuccessId}
                    toggleChat={toggleChat}
                    isAnyNoteGenerating={isAnyNoteGenerating}
                    generationMode={generationMode}
                    handleRegenerateNote={handleRegenerateNote}
                    handleDeleteNote={handleDeleteNote}
                    onSendMessage={handleSendMessage}
                    onRegenerateMessage={handleRegenerateMessage}
                    onDeleteTurn={handleDeleteTurn}
                    onBranchConversation={handleBranchConversation}
                />;
    }

    return (
        <>
            <div className="app-container">
                <header className="header">
                    <div className="header-content">
                        <h1>{t.ui.title}</h1>
                        <h2>{t.ui.subtitle}</h2>
                    </div>
                    <div className="header-actions">
                         <div className="language-switcher">
                             <button onClick={() => setLanguage('zh')} className={language === 'zh' ? 'active' : ''} aria-pressed={language === 'zh'}>中文</button>
                             <button onClick={() => setLanguage('en')} className={language === 'en' ? 'active' : ''} aria-pressed={language === 'en'}>EN</button>
                             <button onClick={() => setLanguage('de')} className={language === 'de' ? 'active' : ''} aria-pressed={language === 'de'}>DE</button>
                         </div>
                         <button onClick={() => setIsApiKeyModalOpen(true)} className="help-button icon-only" title={t.ui.apiKeyModal.title}>
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.5 8.5L18 6c-1.3-1.3-3-2-4.9-2-2.8 0-5.1 2.3-5.1 5.1 0 1.9 1.1 3.5 2.6 4.4l-2.5 2.5L9.6 17l6.4-6.4c.5-1.1.9-2.3.9-3.6z"></path><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                         </button>
                         <button onClick={() => setIsInstructionModalOpen(true)} className="help-button">
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                             {t.ui.howToUse}
                         </button>
                    </div>
                </header>

                <main>
                    <section className="input-section card">
                        <div className="generation-mode-selector">
                                 <button 
                                    className={generationMode === 'deep_read' ? 'selected' : ''} 
                                    onClick={() => setGenerationMode('deep_read')}
                                    disabled={isLoading || isSearching || isAnyNoteGenerating}
                                    aria-pressed={generationMode === 'deep_read'}
                                 >
                                    {t.ui.mode.deep_read}
                                 </button>
                                 <button 
                                    className={generationMode === 'synthesis' ? 'selected' : ''} 
                                    onClick={() => setGenerationMode('synthesis')}
                                    disabled={isLoading || isSearching || isAnyNoteGenerating}
                                    aria-pressed={generationMode === 'synthesis'}
                                >
                                    {t.ui.mode.synthesis}
                                </button>
                        </div>

                        {generationMode === 'deep_read' && (
                             <LocalInputsComponent/>
                        )}
                        
                        {generationMode === 'synthesis' && (
                            <>
                                <div className="explore-container">
                                    <p className="input-section-description">{t.ui.synthesis.description}</p>
                                    <div className="search-form">
                                        <div className="source-selector-container">
                                            <h5>{t.ui.synthesis.selectSources}</h5>
                                            <ul className="source-selector-list">
                                                {availableSources.map(source => (
                                                    <li key={source} className="source-selector-item">
                                                        <input
                                                            type="checkbox"
                                                            id={`source-${source}`}
                                                            value={source}
                                                            checked={selectedSources.includes(source)}
                                                            onChange={() => handleSourceSelectionChange(source)}
                                                            disabled={isSearching || isLoading || isAnyNoteGenerating}
                                                        />
                                                        <label htmlFor={`source-${source}`}>{source}</label>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="search-form-row">
                                            <input
                                                type="text"
                                                placeholder={t.ui.synthesis.topicPlaceholder}
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                disabled={isSearching || isLoading || isAnyNoteGenerating}
                                                className="search-form-input"
                                            />
                                             <div className="search-form-group">
                                                <label htmlFor="search-count" className="sr-only">Number of results</label>
                                                <input
                                                    type="number"
                                                    id="search-count"
                                                    min="1"
                                                    max="30"
                                                    value={searchCount}
                                                    onChange={(e) => setSearchCount(parseInt(e.target.value, 10))}
                                                    disabled={isSearching || isLoading || isAnyNoteGenerating}
                                                    className="search-form-input count"
                                                    title={t.ui.synthesis.countPlaceholder}
                                                />
                                             </div>
                                             <div className="search-form-group">
                                                 <label htmlFor="time-range-select" className="sr-only">{t.ui.synthesis.timeRange.label}</label>
                                                 <select
                                                    id="time-range-select"
                                                    value={searchTimeRange}
                                                    onChange={(e) => setSearchTimeRange(e.target.value as SearchTimeRange)}
                                                    disabled={isSearching || isLoading || isAnyNoteGenerating}
                                                    className="search-form-input time-range"
                                                    title={t.ui.synthesis.timeRange.label}
                                                >
                                                    <option value="all">{t.ui.synthesis.timeRange.all}</option>
                                                    <option value="month">{t.ui.synthesis.timeRange.month}</option>
                                                    <option value="year">{t.ui.synthesis.timeRange.year}</option>
                                                    <option value="3year">{t.ui.synthesis.timeRange.threeYear}</option>
                                                </select>
                                             </div>
                                            <button 
                                                onClick={isSearching ? handleStop : handleSearch} 
                                                disabled={isLoading || isAnyNoteGenerating || (!isSearching && !searchQuery.trim())}
                                                className={`search-button ${isSearching ? 'stop-button' : ''}`}
                                            >
                                                {isSearching ? t.ui.buttons.stop : t.ui.buttons.search}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="or-divider">
                                    <span>{t.ui.or}</span>
                                </div>
                                <LocalInputsComponent/>
                            </>
                        )}
                    </section>
                    
                    <section className="controls">
                        <div className="controls-left">
                            <div className="model-selector">
                                <label htmlFor="model-select">{t.ui.modelSelector.label}</label>
                                <select
                                    id="model-select"
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    disabled={isLoading || isSearching || isAnyNoteGenerating}
                                >
                                    <optgroup label={t.ui.modelSelector.openai}>
                                         {ALL_MODELS.openai.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}
                                    </optgroup>
                                    <optgroup label={t.ui.modelSelector.gemini}>
                                        {ALL_MODELS.gemini.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}
                                    </optgroup>
                                    <optgroup label={t.ui.modelSelector.claude}>
                                         {ALL_MODELS.claude.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}
                                    </optgroup>
                                     <optgroup label={t.ui.modelSelector.deepseek}>
                                         {ALL_MODELS.deepseek.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}
                                    </optgroup>
                                    <optgroup label={t.ui.modelSelector.proxy}>
                                         {ALL_MODELS.proxy.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}
                                    </optgroup>
                                </select>
                            </div>
                        </div>

                        <div className="controls-right">
                            <div className="action-buttons">
                                <button
                                    onClick={isLoading ? handleStop : handleUnifiedAnalysis}
                                    disabled={isSearching || isAnyNoteGenerating || (!isLoading && papersForAnalysisCount === 0 && generationMode !== 'synthesis') }
                                    className={`generate-button ${isLoading ? 'stop-button' : ''}`}
                                >
                                    {isLoading ? t.ui.buttons.stop : (generationMode === 'synthesis' ? t.ui.buttons.synthesis : t.ui.buttons.analyze)}
                                </button>
                                
                                {generationMode === 'deep_read' && notes.length > 1 && (
                                     <button
                                        onClick={handleSynthesizeNotes}
                                        disabled={isSearching || isLoading || isAnyNoteGenerating}
                                        className="secondary-button"
                                     >
                                        {t.ui.buttons.synthesizeNotes}
                                     </button>
                                )}
                               
                                <button onClick={handleDownload} disabled={isLoading || isSearching || isAnyNoteGenerating || notes.length === 0 || visibleNotes.length === 0} className="secondary-button">
                                    {t.ui.buttons.download}
                                </button>

                                <div className="advanced-settings-container" ref={advancedControlsRef}>
                                    <button 
                                        className="icon-button" 
                                        onClick={() => setIsAdvancedPopoverOpen(!isAdvancedPopoverOpen)}
                                        aria-expanded={isAdvancedPopoverOpen}
                                        aria-label={t.ui.advancedSettings.toggle}
                                        disabled={isLoading || isSearching || isAnyNoteGenerating}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                                    </button>
                                    {isAdvancedPopoverOpen && (
                                        <div className="advanced-popover">
                                            <h4>{t.ui.advancedSettings.toggle}</h4>
                                            <div className="advanced-controls">
                                                <div className="control-group">
                                                    <label htmlFor="temperature">{t.ui.advancedSettings.temperature.label} ({temperature.toFixed(2)})</label>
                                                    <input 
                                                        type="range" 
                                                        id="temperature" 
                                                        min="0" 
                                                        max="1" 
                                                        step="0.05" 
                                                        value={temperature}
                                                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                                        disabled={isLoading || isSearching || isAnyNoteGenerating}
                                                    />
                                                    <p className="control-description">{t.ui.advancedSettings.temperature.description}</p>
                                                </div>
                                                <div className="control-group">
                                                    <label htmlFor="topP">{t.ui.advancedSettings.topP.label} ({topP.toFixed(2)})</label>
                                                    <input 
                                                        type="range" 
                                                        id="topP" 
                                                        min="0" 
                                                        max="1" 
                                                        step="0.05" 
                                                        value={topP}
                                                        onChange={(e) => setTopP(parseFloat(e.target.value))}
                                                        disabled={isLoading || isSearching || isAnyNoteGenerating}
                                                    />
                                                    <p className="control-description">{t.ui.advancedSettings.topP.description}</p>
                                                </div>
                                                <div className="control-group">
                                                    <label htmlFor="topK">{t.ui.advancedSettings.topK.label}</label>
                                                    <input 
                                                        type="number" 
                                                        id="topK" 
                                                        min="1"
                                                        value={topK}
                                                        onChange={(e) => setTopK(parseInt(e.target.value, 10))}
                                                        disabled={isLoading || isSearching || isAnyNoteGenerating}
                                                        className="number-input"
                                                    />
                                                    <p className="control-description">{t.ui.advancedSettings.topK.description}</p>
                                                </div>
                                                <div className="control-group">
                                                    <label htmlFor="maxOutputTokens">{t.ui.advancedSettings.maxOutputTokens.label}</label>
                                                    <input 
                                                        type="number" 
                                                        id="maxOutputTokens" 
                                                        min="1"
                                                        max={maxTokensForModel}
                                                        value={maxOutputTokens}
                                                        onChange={(e) => setMaxOutputTokens(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                                        placeholder={String(maxTokensForModel)}
                                                        disabled={isLoading || isSearching || isAnyNoteGenerating}
                                                        className="number-input"
                                                    />
                                                    <p className="control-description">{maxTokensDescription}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {error && <div className="error-message" role="alert">{error}</div>}

                    {(isLoading || isSearching) && progressSteps.length > 0 && (
                         <section className="progress-tracker-container card">
                             <ProgressTracker steps={progressSteps} />
                         </section>
                     )}
                    
                    {searchResults.length > 0 && (
                        <section className="search-results-container">
                            <div className="search-results-header">
                                <h3 className="search-results-title">{t.ui.synthesis.resultsTitle(searchResults.length)}</h3>
                                <button onClick={handleDownloadSearchResults} className="download-metadata-button" disabled={isLoading || isSearching || isAnyNoteGenerating}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                    {t.ui.buttons.download_metadata}
                                </button>
                            </div>
                             {searchResults.map((paper, index) => (
                                <div key={index} className="search-result-item card">
                                    <div className="search-result-header" onClick={() => setExpandedResultIndex(expandedResultIndex === index ? null : index)}>
                                        <h4>
                                            {paper.url ? (
                                                <a href={paper.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                                    {paper.title}
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="external-link-icon"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                                </a>
                                            ) : (
                                                paper.title
                                            )}
                                        </h4>
                                        <button className={`expand-icon ${expandedResultIndex === index ? 'expanded' : ''}`} aria-expanded={expandedResultIndex === index}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                        </button>
                                    </div>
                                    <div className="search-result-meta">
                                        <span><strong>{t.ui.synthesis.authors}:</strong> {paper.authors.join(', ')}</span>
                                        <span><strong>{t.ui.synthesis.journal}:</strong> {paper.journal} ({paper.year})</span>
                                    </div>
                                    {expandedResultIndex === index && (
                                        <p className="search-result-abstract">{paper.abstract}</p>
                                    )}
                                </div>
                             ))}
                             {searchSources.length > 0 && (
                                 <div className="search-sources-list">
                                     <h4>{t.ui.synthesis.sourcesTitle}</h4>
                                     <ul>
                                        {searchSources.map((source, index) => (
                                            <li key={index}><a href={source.uri} target="_blank" rel="noopener noreferrer">{source.title || source.uri}</a></li>
                                        ))}
                                     </ul>
                                 </div>
                             )}
                        </section>
                    )}


                    {(visibleNotes.length > 0) && (
                         <section className="output-section" aria-live="polite">
                            <h3 className="output-title">{t.ui.generatedNotes}</h3>
                             <div className="output-content-wrapper">
                                 <div className="output-content">
                                     {visibleNotes.map((note) => {
                                         const cleanedContent = cleanMarkdown(note.content);
                                         const { frontMatter, body } = parseNoteContent(cleanedContent);
                                         const sourceFile = getUnifiedPaperSources().find(s => s.key === note.sourceKey)?.file;

                                         return (
                                             <React.Fragment key={note.id}>
                                                 <div className="note-wrapper card">
                                                     {editingNoteId === note.id ? (
                                                         <textarea
                                                             className="edit-textarea"
                                                             value={editingContent}
                                                             onChange={(e) => setEditingContent(e.target.value)}
                                                             onPaste={handlePasteInEditor}
                                                             autoFocus
                                                         />
                                                     ) : (
                                                        <>
                                                            {note.isGenerating ? (
                                                                <div className="output-placeholder"><span className="loader-small"></span>{t.ui.buttons.generating}</div>
                                                            ) : note.content.trim() ? (
                                                                <>
                                                                    {frontMatter && (
                                                                        <pre className="frontmatter-block"><code>{frontMatter}</code></pre>
                                                                    )}
                                                                    <div className="markdown-body">
                                                                        <ReactMarkdown rehypePlugins={[rehypeRaw]}>{body || ''}</ReactMarkdown>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <div className="output-placeholder">{t.errors.genericError}</div>
                                                            )}
                                                        </>
                                                     )}

                                                     <div className="note-actions">
                                                         {editingNoteId === note.id ? (
                                                             <>
                                                                 <button className="note-action-button save" onClick={() => handleSaveClick(note.id)}>{t.ui.buttons.save}</button>
                                                                 <button className="note-action-button cancel" onClick={handleCancelClick}>{t.ui.buttons.cancel}</button>
                                                             </>
                                                         ) : (
                                                            <>
                                                                {sourceFile && (
                                                                     <button className="note-action-button" onClick={() => handleViewWithPdf(note)} disabled={isAnyNoteGenerating || note.isGenerating}>{t.ui.buttons.viewWithPdf}</button>
                                                                )}
                                                                <button className="note-action-button" onClick={() => toggleChat(note.id)} disabled={!note.content.trim() || isAnyNoteGenerating || note.isGenerating}>{note.isChatVisible ? t.ui.buttons.hideChat : t.ui.buttons.discuss}</button>
                                                                <button className="note-action-button" onClick={() => handleEditClick(note)} disabled={!note.content.trim() || isAnyNoteGenerating || note.isGenerating}>{t.ui.buttons.edit}</button>
                                                                <button className="note-action-button" onClick={() => handleCopy(note)} disabled={!note.content.trim() || isAnyNoteGenerating || note.isGenerating}>
                                                                    {copySuccessId === note.id ? t.ui.buttons.copied : t.ui.buttons.copy}
                                                                </button>
                                                                {generationMode === 'deep_read' && note.sourceKey !== 'synthesis-from-notes' && (
                                                                    <>
                                                                        <button className="note-action-button" onClick={() => handleRegenerateNote(note.id)} disabled={isLoading || isAnyNoteGenerating || note.isGenerating}>
                                                                            {t.ui.buttons.regenerate}
                                                                        </button>
                                                                        <button className="note-action-button delete" onClick={() => handleDeleteNote(note.id)} disabled={isLoading || isAnyNoteGenerating || note.isGenerating}>
                                                                            {t.ui.buttons.delete}
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </>
                                                         )}
                                                     </div>

                                                     {note.isChatVisible && (
                                                         <ChatInterface 
                                                             note={note}
                                                             onSendMessage={handleSendMessage}
                                                             onRegenerate={handleRegenerateMessage}
                                                             onDeleteTurn={handleDeleteTurn}
                                                             onBranch={handleBranchConversation}
                                                             lang={language}
                                                         />
                                                     )}
                                                 </div>
                                                 
                                             </React.Fragment>
                                         );
                                     })}
                                 </div>
                             </div>
                         </section>
                     )}
                     
                     { !isLoading && !isSearching && visibleNotes.length === 0 && searchResults.length === 0 && !error && (
                        <div className="output-placeholder-full">
                           <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                           <h3>{t.ui.placeholder.title}</h3>
                           <p>{generationMode === 'deep_read' ? t.ui.placeholder.body : t.ui.synthesis.placeholder}</p>
                        </div>
                     )}

                </main>
                 <footer className="footer">
                    <p>© {new Date().getFullYear()} Seasonsling</p>
                    <a href="https://github.com/Seasonsling/Erudite" target="_blank" rel="noopener noreferrer" aria-label={t.ui.githubAriaLabel}>
                        <svg className="github-icon" viewBox="0 0 16 16" version="1.1" width="24" height="24" aria-hidden="true">
                            <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                        </svg>
                    </a>
                </footer>
            </div>
            {isInstructionModalOpen && <InstructionModal onClose={() => setIsInstructionModalOpen(false)} lang={language} />}
            {isApiKeyModalOpen && <ApiKeyModal currentKeys={apiKeys} onSave={handleSaveApiKeys} onClose={() => setIsApiKeyModalOpen(false)} lang={language} />}
            {isTemplateEditorOpen && editingTemplateId && (
                <TemplateEditorModal
                    templateId={editingTemplateId}
                    customContent={customTemplates[editingTemplateId]}
                    onSave={handleSaveCustomTemplate}
                    onReset={handleResetCustomTemplate}
                    onClose={() => setIsTemplateEditorOpen(false)}
                    lang={language}
                />
            )}
        </>
    );
};

const TwoPaneViewer = (props: {
    activeNote: Note,
    file: File,
    onClose: () => void,
    lang: Language,
    t: any,
    editingNoteId: number | null,
    editingContent: string,
    setEditingContent: (content: string) => void,
    handleSaveClick: (noteId: number) => void,
    handleCancelClick: () => void,
    handlePasteInEditor: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void,
    handleEditClick: (note: Note) => void,
    handleCopy: (note: Note) => void,
    copySuccessId: number | null,
    toggleChat: (noteId: number) => void,
    isAnyNoteGenerating: boolean,
    generationMode: 'deep_read' | 'synthesis',
    handleRegenerateNote: (noteId: number) => void,
    handleDeleteNote: (noteId: number) => void,
    onSendMessage: (noteId: number, message: string) => void,
    onRegenerateMessage: (noteId: number, modelMessageId: number) => void,
    onDeleteTurn: (noteId: number, userMessageId: number) => void,
    onBranchConversation: (noteId: number, modelMessageId: number) => void,
}) => {
    const {
        activeNote, file, onClose, lang, t,
        editingNoteId, editingContent, setEditingContent,
        handleSaveClick, handleCancelClick, handlePasteInEditor,
        handleEditClick, handleCopy, copySuccessId, toggleChat,
        isAnyNoteGenerating, generationMode, handleRegenerateNote, handleDeleteNote,
        onSendMessage, onRegenerateMessage, onDeleteTurn, onBranchConversation
    } = props;
    
    const [pdfUrl, setPdfUrl] = useState('');
    const [pdfTextCache, setPdfTextCache] = useState<Map<number, string>>(new Map());
    const [isSearchingPdf, setIsSearchingPdf] = useState(false);

    // Effect to create and revoke the PDF Object URL and pre-cache text content
    useEffect(() => {
        const objectUrl = URL.createObjectURL(file);
        setPdfUrl(objectUrl);
        
        const loadAndCachePdf = async () => {
            try {
                const doc = await pdfjsLib.getDocument({ url: objectUrl }).promise;
                const textCache = new Map<number, string>();
                for (let i = 1; i <= doc.numPages; i++) {
                    const page = await doc.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(s => (s as any).str).join(' ');
                    textCache.set(i, pageText.toLowerCase());
                }
                setPdfTextCache(textCache);
            } catch (e) {
                console.error("Failed to load or parse PDF for viewer", e);
            }
        };

        loadAndCachePdf();

        return () => {
            URL.revokeObjectURL(objectUrl);
            setPdfUrl('');
        };
    }, [file]);
    
    // Handle clicking a reference in the note to jump the PDF
    const handleReferenceClick = (searchText: string) => {
        if (isSearchingPdf || pdfTextCache.size === 0) return;
        
        setIsSearchingPdf(true);
        const lowerSearchText = searchText.toLowerCase().trim();
        
        setTimeout(() => {
            for (const [pageNum, pageText] of pdfTextCache.entries()) {
                if (pageText.includes(lowerSearchText)) {
                    const baseUrl = pdfUrl.split('#')[0];
                    setPdfUrl(`${baseUrl}#page=${pageNum}`);
                    setIsSearchingPdf(false);
                    return; 
                }
            }
            setIsSearchingPdf(false);
        }, 10);
    };

    const { frontMatter, body } = parseNoteContent(cleanMarkdown(activeNote.content));

    return (
        <div className="two-pane-viewer">
            <header className="two-pane-header">
                <button onClick={onClose} className="back-button">&larr; {t.ui.buttons.back}</button>
                <h3>{file.name}</h3>
            </header>
            <main className="two-pane-main">
                <div className="pdf-pane">
                    {pdfUrl && (
                        <iframe
                            src={pdfUrl}
                            title={file.name}
                            className="pdf-iframe"
                        />
                    )}
                </div>
                <div className="note-pane">
                     <div className="note-wrapper card">
                        {editingNoteId === activeNote.id ? (
                            <textarea
                                className="edit-textarea"
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                onPaste={handlePasteInEditor}
                                autoFocus
                            />
                        ) : (
                            <>
                                {activeNote.isGenerating ? (
                                    <div className="output-placeholder"><span className="loader-small"></span>{t.ui.buttons.generating}</div>
                                ) : activeNote.content.trim() ? (
                                    <>
                                        {frontMatter && (
                                            <pre className="frontmatter-block"><code>{frontMatter}</code></pre>
                                        )}
                                        <div className="markdown-body">
                                            <NoteRenderer content={body || ''} onReferenceClick={handleReferenceClick} />
                                        </div>
                                    </>
                                ) : (
                                    <div className="output-placeholder">{t.errors.genericError}</div>
                                )}
                            </>
                        )}

                        <div className="note-actions">
                            {editingNoteId === activeNote.id ? (
                                <>
                                    <button className="note-action-button save" onClick={() => handleSaveClick(activeNote.id)}>{t.ui.buttons.save}</button>
                                    <button className="note-action-button cancel" onClick={handleCancelClick}>{t.ui.buttons.cancel}</button>
                                </>
                            ) : (
                                <>
                                    <button className="note-action-button" onClick={() => toggleChat(activeNote.id)} disabled={!activeNote.content.trim() || isAnyNoteGenerating || activeNote.isGenerating}>{activeNote.isChatVisible ? t.ui.buttons.hideChat : t.ui.buttons.discuss}</button>
                                    <button className="note-action-button" onClick={() => handleEditClick(activeNote)} disabled={!activeNote.content.trim() || isAnyNoteGenerating || activeNote.isGenerating}>{t.ui.buttons.edit}</button>
                                    <button className="note-action-button" onClick={() => handleCopy(activeNote)} disabled={!activeNote.content.trim() || isAnyNoteGenerating || activeNote.isGenerating}>
                                        {copySuccessId === activeNote.id ? t.ui.buttons.copied : t.ui.buttons.copy}
                                    </button>
                                    {generationMode === 'deep_read' && activeNote.sourceKey !== 'synthesis-from-notes' && (
                                        <>
                                            <button className="note-action-button" onClick={() => handleRegenerateNote(activeNote.id)} disabled={isAnyNoteGenerating || activeNote.isGenerating}>
                                                {t.ui.buttons.regenerate}
                                            </button>
                                            <button className="note-action-button delete" onClick={() => handleDeleteNote(activeNote.id)} disabled={isAnyNoteGenerating || activeNote.isGenerating}>
                                                {t.ui.buttons.delete}
                                            </button>
                                        </>
                                    )}
                                </>
                            )}
                        </div>

                        {activeNote.isChatVisible && (
                            <ChatInterface 
                                note={activeNote}
                                onSendMessage={onSendMessage}
                                onRegenerate={onRegenerateMessage}
                                onDeleteTurn={onDeleteTurn}
                                onBranch={onBranchConversation}
                                lang={lang}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

const NoteRenderer = ({ content, onReferenceClick }: { content: string, onReferenceClick: (text: string) => void }) => {
    const referenceRegex = /(Fig(?:ure)?|Table)\.?\s*([\w\d.-]+)/gi;

    return <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={{
            p: ({ children }) => {
                const newChildren = React.Children.toArray(children).flatMap((child: any) => {
                    if (typeof child === 'string') {
                        const parts = child.split(referenceRegex);
                        return parts.reduce((acc: any[], part: string, i: number) => {
                             if (i % 3 === 1) { // This is the 'Fig' or 'Table' part
                                const nextPart = parts[i+1]; // This is the number part
                                const fullMatch = `${part} ${nextPart}`;
                                acc.push(
                                    <span key={`${i}-ref`} className="note-reference" onClick={() => onReferenceClick(fullMatch)}>
                                        {fullMatch}
                                    </span>
                                );
                            } else if (i % 3 === 0) { // Regular text
                                if (part) acc.push(part);
                            }
                            return acc;
                        }, []);
                    }
                    return child;
                });
                return <p>{newChildren}</p>;
            },
        }}
    >
        {content}
    </ReactMarkdown>;
};


interface ChatInterfaceProps {
    note: Note;
    onSendMessage: (noteId: number, message: string) => void;
    onRegenerate: (noteId: number, modelMessageId: number) => void;
    onDeleteTurn: (noteId: number, userMessageId: number) => void;
    onBranch: (noteId: number, modelMessageId: number) => void;
    lang: Language;
}

const ChatInterface = ({ note, onSendMessage, onRegenerate, onDeleteTurn, onBranch, lang }: ChatInterfaceProps) => {
    const [message, setMessage] = useState('');
    const chatMessagesRef = useRef<HTMLDivElement>(null);
    const t = translations[lang].ui.chat;
    
    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [note.chatHistory]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && !note.isChatLoading) {
            onSendMessage(note.id, message);
            setMessage('');
        }
    };
    
    const chatTurns = useMemo(() => {
        const turns: { user: ChatMessage, model?: ChatMessage }[] = [];
        for (let i = 0; i < note.chatHistory.length; i++) {
            if (note.chatHistory[i].role === 'user') {
                turns.push({ user: note.chatHistory[i], model: note.chatHistory[i + 1] });
            }
        }
        return turns;
    }, [note.chatHistory]);


    return (
        <div className="chat-container">
            <div className="chat-messages" ref={chatMessagesRef}>
                {chatTurns.map(({ user, model }) => (
                    <div className="chat-turn" key={user.id}>
                        <div className="message user">
                           <div className="message-content"><ReactMarkdown rehypePlugins={[rehypeRaw]}>{user.text}</ReactMarkdown></div>
                        </div>
                        {model && (
                            <div className="message model">
                                <div className="message-content"><ReactMarkdown rehypePlugins={[rehypeRaw]}>{model.text}</ReactMarkdown></div>
                            </div>
                        )}
                         <div className="chat-turn-actions">
                             {model && (
                                <>
                                    <button onClick={() => onBranch(note.id, model.id)} title={t.branch} className="chat-action-button" disabled={note.isChatLoading}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v12"></path><path d="M18 9a3 3 0 0 0-3-3H6"></path><path d="M18 21a3 3 0 0 0-3-3H6"></path></svg>
                                    </button>
                                    <button onClick={() => onRegenerate(note.id, model.id)} title={t.regenerate} className="chat-action-button" disabled={note.isChatLoading}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path></svg>
                                    </button>
                                </>
                             )}
                            <button onClick={() => onDeleteTurn(note.id, user.id)} title={t.delete} className="chat-action-button" disabled={note.isChatLoading}>
                                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                         </div>
                    </div>
                ))}
                {note.isChatLoading && chatTurns.length > 0 && (
                    <div className="message model">
                        <div className="message-content">
                            <span className="typing-indicator"></span>
                        </div>
                    </div>
                )}
            </div>
            <form className="chat-input-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t.placeholder}
                    disabled={note.isChatLoading}
                    aria-label={t.inputAriaLabel}
                />
                <button type="submit" disabled={note.isChatLoading || !message.trim()} aria-label={t.buttonAriaLabel}>
                    {t.button}
                </button>
            </form>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);