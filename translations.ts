/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export const translations = {
  en: {
    ui: {
      title: 'Erudite',
      subtitle: 'The art of scholarly distillation.',
      description: 'Drag & drop your PDF files to get started.',
      howToUse: 'How to Use',
      selectedFiles: 'Selected Files:',
      remove: 'Remove',
      generatedNotes: 'Generated Notes',
      or: 'OR',
      tabs: {
        upload: 'Upload Files',
        paste: 'Paste Text',
      },
      dropzone: {
        title: 'Drag & Drop PDF files here',
        or: 'or',
        button: 'Browse Files',
      },
      paste: {
        description: 'Paste the full text of your paper(s) below.',
        pastedPaper: 'Pasted Paper',
        paperNamePlaceholder: 'Optional: Paper Name',
        contentPlaceholder: 'Paste the full text of the paper here...',
        addPaperButton: 'Add another paper',
      },
      mode: {
        deep_read: 'Deep Read',
        synthesis: 'Synthesis',
      },
      synthesis: {
        description: 'Generate a comprehensive literature review. Provide papers by searching academic databases or through local uploads/paste.',
        topicPlaceholder: 'Enter a research topic (e.g., CRISPR in oncology)',
        countPlaceholder: 'Number of results',
        placeholder: 'Use the search and upload tools to provide papers, then click "Synthesize" to generate a review.',
        resultsTitle: (count: number) => `Found ${count} Papers`,
        authors: 'Authors',
        journal: 'Journal',
        sourcesTitle: 'Sources',
        selectSources: 'Search in:',
        timeRange: {
            label: 'Time Range',
            all: 'All time',
            month: 'Last month',
            year: 'Last year',
            threeYear: 'Last 3 years'
        }
      },
      paperTypeSelector: {
        label: 'Paper Type:',
        auto: 'Auto-Detect',
        templateA: 'Template A: Computational/Technical',
        templateB: 'Template B: Clinical Trial',
        templateC: 'Template C: Review/Perspective',
        templateD: 'Template D: AI Clinical Validation',
        templateE: 'Template E: Bio-engineering',
        templateF: 'Template F: Basic Science',
      },
      pdfViewer: {
        loading: 'Loading PDF...',
        prevPage: 'Previous Page',
        nextPage: 'Next Page',
        zoomIn: 'Zoom In',
        zoomOut: 'Zoom Out',
        download: 'Download PDF',
      },
      modelSelector: {
        label: 'Model:',
        gemini: 'Google Gemini',
        openai: 'OpenAI',
        deepseek: 'DeepSeek',
        claude: 'Anthropic Claude',
        proxy: 'Proxy (aiclaude.site)',
      },
      buttons: {
        analyze: 'Analyze',
        synthesis: 'Synthesize',
        synthesizeNotes: 'Synthesize Notes',
        generating: 'Generating...',
        analyzing: 'Analyzing...',
        search: 'Search',
        download: 'Download Notes',
        download_metadata: 'Download Metadata',
        save: 'Save',
        cancel: 'Cancel',
        hideChat: 'Hide Chat',
        discuss: 'Discuss',
        edit: 'Edit',
        copy: 'Copy',
        copied: 'Copied!',
        stop: 'Stop',
        stopped: 'Stopped',
        regenerate: 'Regenerate',
        delete: 'Delete',
        viewWithPdf: 'View with PDF',
        back: 'Back to Notes',
        editTemplate: 'Edit Template'
      },
      placeholder: {
          title: 'Ready to Begin?',
          body: 'Provide papers for analysis. Your AI-generated notes will appear here.'
      },
      chat: {
          placeholder: 'Ask a follow-up question...',
          button: 'Send',
          inputAriaLabel: 'Chat input',
          buttonAriaLabel: 'Send message',
          regenerate: 'Regenerate',
          delete: 'Delete turn',
          branch: 'Branch from here',
      },
      advancedSettings: {
        toggle: 'Advanced Settings',
        temperature: {
            label: 'Temperature',
            description: 'Controls randomness. Lower values are more deterministic.'
        },
        topP: {
            label: 'Top-P',
            description: 'Controls diversity via nucleus sampling. 0.95 means 95% of token probability mass is considered.'
        },
        topK: {
            label: 'Top-K',
            description: 'Controls diversity by selecting from the K most likely tokens.'
        },
        maxOutputTokens: {
            label: 'Max Output Tokens',
            description: (max: number) => `Maximum tokens for the model to generate (max: ${max}).`,
            placeholder: (max: number) => `Default: ${max}`
        }
      },
      apiKeyModal: {
        title: 'Manage API Keys',
        disclaimer: 'Keys are stored in your browser\'s local storage and are not sent anywhere else. Do not use on a shared computer.',
        gemini: 'Google Gemini',
        openai: 'OpenAI',
        deepseek: 'DeepSeek',
        claude: 'Anthropic Claude',
        proxy: 'Proxy (aiclaude.site)',
        placeholder: 'Enter your API key here',
        save: 'Save Keys',
        close: 'Close',
      },
      templateEditor: {
          title: (id: string) => `Edit Template ${id}`,
          description: 'Modify the template below. Your changes will be saved in your browser for future use.',
          save: 'Save Custom Template',
          reset: 'Reset to Default',
          close: 'Close',
      }
    },
    status: {
        preparingAnalysis: 'Preparing analysis...',
        parsing: (fileName: string) => `Reading: ${fileName}`,
        generating: (fileName: string) => `Generating insights for: ${fileName}`,
        synthesizing: (count: number) => `Synthesizing ${count} papers/notes...`,
        finalizing: 'Finalizing notes...',
        preparingSearch: 'Preparing search...',
        searchingOnPlatform: (platform: string, query: string) => `Searching ${platform} for: "${query}"`,
        gatheringInfo: 'Gathering information from search results...',
        structuringData: 'Structuring paper data...',
        verifyingData: 'Verifying result integrity...',
    },
    errors: {
      fileReadFailed: 'Failed to read file.',
      noFiles: 'Please upload at least one PDF file.',
      noInput: 'Please provide at least one paper, either by uploading a PDF or pasting text.',
      synthesisRequiresTwo: 'Synthesis Review mode requires at least two papers.',
      aiNotInitialized: 'AI client not initialized.',
      genericError: 'An error occurred:',
      pdfTextEmpty: 'Extracted text is empty. The PDF might be image-based or protected.',
      pdfParseError: (fileName: string) => `Error processing paper ${fileName}`,
      noNotesToDownload: 'There are no notes to download.',
      clipboardNotAvailable: 'Clipboard API not available in this browser.',
      copyFailed: 'Failed to copy notes to clipboard.',
      downloadFailed: 'Failed to download metadata.',
      noSearchResults: 'No papers were found for this topic. Try a different query.',
      noSearchResultsToAnalyze: 'There are no search results to analyze.',
      noSourcesSelected: 'Please select at least one search source.',
      operationCancelled: 'Operation cancelled by user.',
      apiKeyMissing: (provider: string) => `${provider.charAt(0).toUpperCase() + provider.slice(1)} API key is missing. Please add it in the settings.`,
      geminiKeyMissingForSearch: 'A Google Gemini API key is required for the search feature. Please add one in the settings.',
      allPapersAnalyzed: 'All provided papers have already been analyzed. Add new papers to continue.',
      sourceNotFoundForNote: 'Could not find the original source for this note to regenerate it.',
    },
    prompts: {
        individual: (paperText: string, paperType: string) => {
            if (paperType !== 'auto') {
                return `Please read this PDF in detail and strictly follow the provided template (Template ${paperType}) to generate the complete note content. The final output markdown file should only contain the content generated according to the template, without being wrapped in \`\`\`markdown or \`\`\` code blocks.\n\nHere is the full text of the paper:\n\n${paperText}`;
            }
            return `Please read this PDF in detail and strictly follow the System Instruction to complete all tasks. First, silently follow "Part 2: The Zero-Shot Decision Protocol" to decide which template to use. Then, strictly adhere to the format and requirements of the selected template to generate the complete note content. The final output markdown file should only contain the content generated according to the template, without being wrapped in \`\`\`markdown or \`\`\` code blocks. Pay attention to the file naming (date + paper title), the layout section, and the content format.\n\nHere is the full text of the paper:\n\n${paperText}`;
        },
        synthesis: (fileCount: number, combinedText: string) => `Please read the full text of the following ${fileCount} papers in detail and strictly follow the System Instruction (Template G) to generate a comprehensive and insightful academic review. Ensure the analysis is deep, professional, and follows the specified Markdown format. The final output markdown file should only contain the content generated according to the template, without being wrapped in \`\`\`markdown or \`\`\` code blocks.\n\nHere is the full text of all papers:\n\n${combinedText}`,
        synthesis_abstracts: (fileCount: number, combinedText: string) => `Please analyze the following ${fileCount} paper abstracts in detail and strictly follow the System Instruction (Template G-Abstracts) to generate a comprehensive and insightful academic review based *only* on the provided abstracts. The final output markdown file should only contain the content generated according to the template, without being wrapped in \`\`\`markdown or \`\`\` code blocks.\n\nHere are the abstracts of all papers:\n\n${combinedText}`,
        synthesis_notes: (noteCount: number, combinedText: string) => `Please perform a meta-synthesis of the following ${noteCount} detailed research notes. Strictly follow the System Instruction (Template H) to generate a high-level, strategic review that identifies emergent themes, debates, and future directions. The final output markdown file should only contain the content generated according to the template, without being wrapped in \`\`\`markdown or \`\`\` code blocks.\n\nHere are the full contents of all notes:\n\n${combinedText}`,
        chat: (noteContent: string) => `### [SYSTEM INSTRUCTION: Academic Dialogue Protocol]

You are a peer-level academic collaborator. Your role is to facilitate a deep, critical, and insightful discussion around the provided research note. You are not a general-purpose assistant, but an expert in deconstructing and synthesizing scholarly work.

### **Part 1: Guiding Philosophy**

1.  **Fidelity to the Text, Extension of Knowledge**: Your primary source of information is the original paper and the note. If you use general knowledge to provide context or explain a concept, you must explicitly state: "Drawing on general knowledge outside the provided text...". If the answer is not contained within, state clearly: "The provided text and note do not contain specific information on this topic."

2.  **From "What" to "Why" and "So What"**: Do not merely retrieve information. Your value lies in connecting the dots. When asked for a result, explain its significance in the context of the research question. When asked about a method, discuss its trade-offs and design rationale as described in the note.

3.  **Embrace Scholarly Rigor and Nuance**: Avoid overconfident or simplistic answers. Use cautious and precise language. Acknowledge limitations, counterarguments, and uncertainties mentioned in the paper and note. Frame your answers as a critical analysis, not as absolute fact.

4.  **Be an Active Dialogue Partner**: Your goal is to deepen the user's understanding. After answering a question, consider posing a follow-up question that stimulates critical thinking, such as:
    *   "Given this limitation, what kind of experiment could address it?"
    *   "How might this finding apply in a different context, like [related field]?"
    *   "The authors chose Method A over Method B. What do you think was the key factor in that decision?"

### **Part 2: Operational Protocol**

*   **When asked a factual question (e.g., "What was the p-value for the primary outcome?"):**
    1.  Locate the specific data point in the note.
    2.  State the fact directly and accurately.
    3.  Provide immediate context from the note.

*   **When asked an explanatory question (e.g., "Why is this finding significant?"):**
    1.  Refer to the "Author's Conclusion," "Discussion," or "Significance" sections of the note.
    2.  Synthesize the authors' interpretation.
    3.  Connect the finding back to the paper's central scientific question.

*   **When asked a critical question (e.g., "What are the weaknesses of this study?"):**
    1.  First, report any limitations explicitly mentioned by the authors in the note.
    2.  Then, identify potential unspoken limitations based **only** on the information in the paper (e.g., sample size, baseline comparisons, choice of control group).
    3.  Frame these points as discussion-starters, e.g., "The note mentions the study was retrospective, which might raise questions about potential selection bias. What are your thoughts on that?"

*   **When asked a comparative question (e.g., "How does Model A compare to Model B?"):**
    1.  Extract the relevant details for both from the note.
    2.  Organize the comparison in a structured way (e.g., bullet points or a table) covering key aspects like performance, methodology, and assumptions.

--- NOTE ---
${noteContent}
--- END NOTE ---`
    },
    modal: {
        title: 'How to Use Erudite',
        intro: 'This tool helps you transform dense academic papers into structured, insightful notes. Follow these simple steps:',
        step1: {
            title: 'Choose Your Mode:',
            body: 'Select "Deep Read" to analyze your own documents, or "Synthesis" to generate a literature review.',
        },
        step2: {
            title: 'Provide Content:',
            option1: {
                title: 'In Deep Read Mode:',
                body: 'Use the tabs to either "Upload Files" (drag & drop or browse for PDFs) or "Paste Text" to input your academic content directly. You can also specify the paper type for more accurate note-taking.'
            },
            option2: {
                title: 'In Synthesis Mode:',
                body: 'Enter a research topic into the search bar, or use the local upload/paste options. The AI will use all provided content to generate a review.'
            }
        },
        step3: {
            title: 'Analyze:',
            body: 'Click the "Analyze" or "Synthesize" button. The AI will begin processing the content, which may take a few moments. You\'ll see status updates as it works.'
        },
        step4: {
            title: 'Interact with Notes:',
            action1: 'Discuss:',
            action1_desc: 'Open a chat window to ask follow-up questions about the note. The AI will act as an academic collaborator, helping you explore the paper\'s details more deeply.',
            action2: 'Edit:',
            action2_desc: 'Modify the generated note directly in your browser. Click "Save" to keep your changes or "Cancel" to discard them.',
            action3: 'Copy:',
            action3_desc: 'Instantly copy the full markdown content of the note to your clipboard.',
            action4: 'Download Notes:',
            action4_desc: 'Use the "Download Notes" button to save all currently visible notes as individual `.md` files on your computer. If there are multiple notes, they will be saved in a single .zip file.',
            action5: 'View with PDF:',
            action5_desc: 'For notes from uploaded PDFs, click this to open a split-screen view with the PDF on the left and the note on the right. References like "Fig. 1" in the note are clickable and will jump to the correct page in the PDF.',
        },
        outro: 'If you encounter any issues with PDFs, ensure they are text-based and not a scanned image. Happy researching!'
    }
  },
  zh: {
    ui: {
      title: '笔纪',
      subtitle: '删繁就简三秋树。',
      description: '将您的PDF论文拖放到下方以开始。',
      howToUse: '如何使用',
      selectedFiles: '已选文件:',
      remove: '移除',
      generatedNotes: '生成的笔记',
      or: '或',
      tabs: {
        upload: '上传文件',
        paste: '粘贴文本',
      },
      dropzone: {
        title: '在此处拖放PDF文件',
        or: '或',
        button: '浏览文件',
      },
      paste: {
        description: '在下方粘贴一篇或多篇论文的全文。',
        pastedPaper: '已粘贴论文',
        paperNamePlaceholder: '可选：论文名称',
        contentPlaceholder: '在此处粘贴论文全文...',
        addPaperButton: '添加另一篇论文',
      },
      mode: {
        deep_read: '精读模式',
        synthesis: '综述模式',
      },
      synthesis: {
        description: '从多个来源生成综合性文献综述。您可以通过搜索学术数据库，或上传/粘贴本地文档来提供论文。',
        topicPlaceholder: '输入研究主题（例如：CRISPR在肿瘤学的应用）',
        countPlaceholder: '结果数量',
        placeholder: '使用搜索和上传工具提供论文，然后点击“生成综述”开始。',
        resultsTitle: (count: number) => `找到 ${count} 篇论文`,
        authors: '作者',
        journal: '期刊',
        sourcesTitle: '来源',
        selectSources: '搜索平台:',
        timeRange: {
            label: '时间范围',
            all: '不限时间',
            month: '最近一月',
            year: '最近一年',
            threeYear: '最近三年'
        }
      },
      paperTypeSelector: {
        label: '论文类型:',
        auto: '自动检测',
        templateA: '模板A: 计算/技术科学',
        templateB: '模板B: 临床试验',
        templateC: '模板C: 综述/观点',
        templateD: '模板D: AI临床验证',
        templateE: '模板E: 生物工程',
        templateF: '模板F: 基础科学',
      },
      pdfViewer: {
        loading: '正在加载PDF...',
        prevPage: '上一页',
        nextPage: '下一页',
        zoomIn: '放大',
        zoomOut: '缩小',
        download: '下载PDF',
      },
      modelSelector: {
        label: '模型:',
        gemini: 'Google Gemini',
        openai: 'OpenAI',
        deepseek: 'DeepSeek',
        claude: 'Anthropic Claude',
        proxy: '中转接口 (aiclaude.site)',
      },
      buttons: {
        analyze: '分析',
        synthesis: '生成综述',
        synthesizeNotes: '综述笔记',
        generating: '生成中...',
        analyzing: '分析中...',
        search: '搜索',
        download: '下载笔记',
        download_metadata: '下载元数据',
        save: '保存',
        cancel: '取消',
        hideChat: '隐藏对话',
        discuss: '讨论',
        edit: '编辑',
        copy: '复制',
        copied: '已复制!',
        stop: '停止',
        stopped: '已停止',
        regenerate: '重新生成',
        delete: '删除',
        viewWithPdf: '并排阅读',
        back: '返回笔记列表',
        editTemplate: '编辑模板'
      },
      placeholder: {
          title: '准备好开始了吗？',
          body: '请提供论文以供分析。您生成的AI笔记将在此处显示。'
      },
      chat: {
          placeholder: '提出追问...',
          button: '发送',
          inputAriaLabel: '聊天输入框',
          buttonAriaLabel: '发送消息',
          regenerate: '重新生成',
          delete: '删除此轮对话',
          branch: '从此分支',
      },
      advancedSettings: {
        toggle: '高级设置',
        temperature: {
            label: '温度 (Temperature)',
            description: '控制随机性。值越低，输出越确定。'
        },
        topP: {
            label: 'Top-P',
            description: '通过核心采样控制多样性。0.95表示考虑95%的令牌概率质量。'
        },
        topK: {
            label: 'Top-K',
            description: '通过从K个最可能的令牌中选择来控制多样性。'
        },
        maxOutputTokens: {
            label: '最大输出令牌',
            description: (max: number) => `模型生成的最大令牌数 (此模型最大值: ${max})。`,
            placeholder: (max: number) => `默认值: ${max}`
        }
      },
      apiKeyModal: {
        title: '管理 API 密钥',
        disclaimer: '密钥存储在您浏览器的本地存储中，不会发送到任何地方。请勿在共享计算机上使用。',
        gemini: 'Google Gemini',
        openai: 'OpenAI',
        deepseek: 'DeepSeek',
        claude: 'Anthropic Claude',
        proxy: '中转接口 (aiclaude.site)',
        placeholder: '在此输入您的 API 密钥',
        save: '保存密钥',
        close: '关闭',
      },
      templateEditor: {
          title: (id: string) => `编辑模板 ${id}`,
          description: '在下方修改模板。您的更改将被保存在浏览器中，以备将来使用。',
          save: '保存自定义模板',
          reset: '恢复默认',
          close: '关闭',
      }
    },
    status: {
        preparingAnalysis: '准备分析...',
        parsing: (fileName: string) => `正在阅读: ${fileName}`,
        generating: (fileName: string) => `正在为 ${fileName} 生成洞察`,
        synthesizing: (count: number) => `正在综合 ${count} 篇论文/笔记...`,
        finalizing: '正在完成笔记...',
        preparingSearch: '准备搜索...',
        searchingOnPlatform: (platform: string, query: string) => `正在 ${platform} 搜索: "${query}"`,
        gatheringInfo: '正在从搜索结果中收集信息...',
        structuringData: '正在结构化论文数据...',
        verifyingData: '正在校验结果完整性...',
    },
    errors: {
      fileReadFailed: '文件读取失败。',
      noFiles: '请至少上传一个PDF文件。',
      noInput: '请至少提供一篇论文（上传PDF或粘贴文本）。',
      synthesisRequiresTwo: '“多篇综述”模式需要至少两篇论文。',
      aiNotInitialized: 'AI客户端未初始化。',
      genericError: '发生错误:',
      pdfTextEmpty: '提取的文本为空。PDF可能为图片格式或受保护。',
      pdfParseError: (fileName:string) => `处理论文 ${fileName} 时出错`,
      noNotesToDownload: '没有可供下载的笔记。',
      clipboardNotAvailable: '当前浏览器不支持剪贴板API。',
      copyFailed: '无法将笔记复制到剪贴板。',
      downloadFailed: '元数据下载失败。',
      noSearchResults: '未找到关于此主题的论文。请尝试其他查询。',
      noSearchResultsToAnalyze: '没有可供分析的搜索结果。',
      noSourcesSelected: '请至少选择一个搜索平台。',
      operationCancelled: '操作已被用户取消。',
      apiKeyMissing: (provider: string) => `${provider.charAt(0).toUpperCase() + provider.slice(1)} API 密钥缺失。请在设置中添加。`,
      geminiKeyMissingForSearch: '搜索功能需要 Google Gemini API 密钥。请在设置中添加。',
      allPapersAnalyzed: '所有已提供的论文都已分析完毕。请添加新论文以继续。',
      sourceNotFoundForNote: '无法找到此笔记的原始来源以进行重新生成。',
    },
    prompts: {
        individual: (paperText: string, paperType: string) => {
            if (paperType !== 'auto') {
                return `请详细阅读此PDF，并严格遵循提供的模板（模板 ${paperType}）来生成完整的笔记内容。最终输出的markdown文件应只包含根据模板生成的内容本身，不要在前后包裹 \`\`\`markdown 或 \`\`\` 代码块。\n\n以下是论文的全文：\n\n${paperText}`;
            }
            return `请你详细阅读这个PDF，并严格按照System Instruction指令完成所有任务。请你首先静默遵循"Part 2: The Zero-Shot Decision Protocol"来决定使用哪个模板，然后严格依据所选模板的格式和要求，生成完整的笔记内容。最终输出的markdown文件仅包含依据模板生成的内容本身, 不要在前后包裹 \`\`\`markdown 或 \`\`\` 代码块。注意文件命名（时间+论文名）、layout部分以及内容的格式。\n\n以下是论文全文内容：\n\n${paperText}`;
        },
        synthesis: (fileCount: number, combinedText: string) => `请你详细阅读以下 ${fileCount} 篇论文的全文内容，并严格按照System Instruction（Template G）的要求，生成一份综合性的、深刻的学术综述。请确保分析深入、专业，并遵循指定的Markdown格式。最终输出的markdown文件仅包含依据模板生成的内容本身, 不要在前后包裹 \`\`\`markdown 或 \`\`\` 代码块。\n\n以下是所有论文的全文内容：\n\n${combinedText}`,
        synthesis_abstracts: (fileCount: number, combinedText: string) => `请详细分析以下 ${fileCount} 篇论文的摘要，并严格遵循系统指令（模板 G-Abstracts），生成一份完全基于所提供摘要的、全面而深刻的学术综述。最终输出的 markdown 文件应只包含根据模板生成的内容本身，不要在前后包裹 \`\`\`markdown 或 \`\`\` 代码块。\n\n以下是所有论文的摘要内容：\n\n${combinedText}`,
        synthesis_notes: (noteCount: number, combinedText: string) => `请对以下 ${noteCount} 份详细的研究笔记进行元综合分析。严格遵循系统指令（模板 H）来生成一份高层次的、战略性的综述，识别其中涌现的主题、争论和未来方向。最终输出的markdown文件应只包含根据模板生成的内容本身，不要在前后包裹 \`\`\`markdown 或 \`\`\` 代码块。\n\n以下是所有笔记的全文内容：\n\n${combinedText}`,
        chat: (noteContent: string) => `### 【系统指令：学术对话协议】

您是一位同侪水平的学术合作者。您的角色是围绕提供的研究笔记，引导一场深入、批判且富有洞察力的讨论。您不是一个通用助手，而是一位解构和综合学术著作的专家。

### **第一部分：指导哲学**

1.  **忠于文本，拓展知识**: 您的首要信息来源是论文原文及笔记。如果您使用通用知识来提供背景或解释概念，您必须明确声明：“根据原文及笔记之外的通用知识...”。如果不包含答案，请清楚说明：“提供的原文和笔记中未包含关于该主题的具体信息。”

2.  **从“是什么”到“为什么”与“所以呢”**: 不要仅仅检索信息。您的价值在于连接各个知识点。当被问及一个结果时，请同时解释其在研究目标背景下的重要性。当被问及一种方法时，请讨论笔记中描述的其权衡和设计理念。

3.  **拥抱学术严谨与审慎**: 避免过于自信或简化的回答。使用谨慎而精确的语言。承认论文和笔记中提到的局限性、反论和不确定性。将您的回答构建为一种批判性分析，而非绝对事实。

4.  **成为积极的对话伙伴**: 您的目标是加深用户的理解。在回答问题后，可以考虑向用户提出一个能激发批判性思维的追问，例如：
    *   “考虑到这个局限性，什么样的实验可以解决它？”
    *   “这个发现在像[相关领域]这样的不同背景下可能如何应用？”
    *   “作者选择了方法A而非方法B。您认为这个决定的关键因素是什么？”

### **第二部分：操作规程**

*   **当被问及事实性问题时 (例如，“主要结局的p值是多少？”):**
    1.  在笔记中定位具体数据。
    2.  直接并准确地陈述事实。
    3.  提供笔记中的直接上下文。

*   **当被问及解释性问题时 (例如，“为什么这个发现意义重大？”):**
    1.  参考笔记中的“作者结论”、“讨论”或“意义”部分。
    2.  综合作者的解读。
    3.  将该发现与论文的核心科学问题联系起来。

*   **当被问及批判性问题时 (例如，“这项研究的弱点是什么？”):**
    1.  首先，报告作者在笔记中明确提到的任何局限性。
    2.  然后，**仅**基于论文的信息（如样本量、基线比较、对照组选择），识别潜在的未言明的局限性。
    3.  将这些观点构建为讨论性问题，例如：“笔记提到该研究是回顾性的，这可能会引发关于潜在选择偏见的问题。您对此有何看法？”

*   **当被问及比较性问题时 (例如，“模型A与模型B相比如何？”):**
    1.  从笔记中提取两者的相关细节。
    2.  以结构化的方式（如要点或表格）组织比较，涵盖性能、方法论和假设等关键方面。

--- 笔记 ---
${noteContent}
--- 结束笔记 ---`
    },
    modal: {
        title: '如何使用“笔纪”',
        intro: '本工具帮助您将复杂的学术论文转化为结构化、富有洞察力的笔记。请遵循以下简单步骤：',
        step1: {
            title: '选择您的模式:',
            body: '选择“精读模式”以分析您自己的文档，或选择“综述模式”以生成文献综述。',
        },
        step2: {
            title: '提供内容:',
            option1: {
                title: '在精读模式中:',
                body: '使用选项卡选择“上传文件”（拖放或浏览PDF）或“粘贴文本”以直接输入您的学术内容。您还可以指定论文类型以获得更准确的笔记。'
            },
            option2: {
                title: '在综述模式中:',
                body: '在搜索框中输入一个研究主题，或使用本地上传/粘贴选项。AI将使用所有提供的内容来生成综述。'
            }
        },
        step3: {
            title: '开始处理:',
            body: '点击“分析”或“生成综述”按钮。AI将开始处理内容，这可能需要一些时间。您会看到处理过程中的状态更新。'
        },
        step4: {
            title: '与笔记互动:',
            action1: '讨论:',
            action1_desc: '打开一个聊天窗口，就笔记内容提出追问。AI将扮演学术合作者的角色，帮助您更深入地探讨论文细节。',
            action2: '编辑:',
            action2_desc: '直接在浏览器中修改生成的笔记。点击“保存”以保留您的更改，或点击“取消”放弃修改。',
            action3: '复制:',
            action3_desc: '立即将笔记的完整Markdown内容复制到剪贴板。',
            action4: '下载笔记:',
            action4_desc: '使用“下载笔记”按钮，将当前所有可见的笔记以独立的`.md`文件格式保存到您的电脑上。如果有多篇笔记，它们将被保存在一个.zip压缩包中。',
            action5: '并排阅读:',
            action5_desc: '对于从PDF上传的笔记，点击此按钮可打开分屏视图，左侧显示PDF，右侧显示笔记。笔记中的“图1”等引用是可点击的，会直接跳转到PDF中的相应页面。',
        },
        outro: '如果在使用PDF时遇到任何问题，请确保它们是基于文本的，而不是扫描的图片。祝您研究愉快！'
    }
  },
  de: {
    ui: {
      title: 'Erudite',
      subtitle: 'Wo dichte Schriften Klarheit finden.',
      description: 'Ziehen Sie Ihre PDF-Arbeiten per Drag & Drop hierher, um zu beginnen.',
      howToUse: 'Anleitung',
      selectedFiles: 'Ausgewählte Dateien:',
      remove: 'Entfernen',
      generatedNotes: 'Generierte Notizen',
      or: 'ODER',
       tabs: {
        upload: 'Dateien hochladen',
        paste: 'Text einfügen',
      },
      dropzone: {
        title: 'PDF-Dateien hier ablegen',
        or: 'oder',
        button: 'Dateien durchsuchen',
      },
      paste: {
        description: 'Fügen Sie den vollständigen Text Ihres Papiers/Ihrer Paper unten ein.',
        pastedPaper: 'Eingefügtes Paper',
        paperNamePlaceholder: 'Optional: Name des Papers',
        contentPlaceholder: 'Fügen Sie hier den vollständigen Text des Papers ein...',
        addPaperButton: 'Weiteres Paper hinzufügen',
      },
      mode: {
        deep_read: 'Tiefenlektüre',
        synthesis: 'Synthese',
      },
      synthesis: {
        description: 'Erstellen Sie eine umfassende Literaturübersicht. Stellen Sie Paper durch Suche in akademischen Datenbanken oder durch Hochladen/Einfügen bereit.',
        topicPlaceholder: 'Geben Sie ein Forschungsthema ein (z.B. CRISPR in der Onkologie)',
        countPlaceholder: 'Anzahl der Ergebnisse',
        placeholder: 'Nutzen Sie die Such- und Upload-Funktionen, um Paper bereitzustellen, und klicken Sie dann auf "Synthese erstellen".',
        resultsTitle: (count: number) => `${count} Paper gefunden`,
        authors: 'Autoren',
        journal: 'Journal',
        sourcesTitle: 'Quellen',
        selectSources: 'Suchen in:',
        timeRange: {
            label: 'Zeitraum',
            all: 'Unbegrenzt',
            month: 'Letzter Monat',
            year: 'Letztes Jahr',
            threeYear: 'Letzte 3 Jahre'
        }
      },
      paperTypeSelector: {
        label: 'Paper-Typ:',
        auto: 'Automatisch erkennen',
        templateA: 'Vorlage A: Computer/Technik',
        templateB: 'Vorlage B: Klinische Studie',
        templateC: 'Vorlage C: Übersicht/Perspektive',
        templateD: 'Vorlage D: KI Klinische Validierung',
        templateE: 'Vorlage E: Bio-Engineering',
        templateF: 'Vorlage F: Grundlagenforschung',
      },
      pdfViewer: {
        loading: 'Lade PDF...',
        prevPage: 'Vorherige Seite',
        nextPage: 'Nächste Seite',
        zoomIn: 'Vergrößern',
        zoomOut: 'Verkleinern',
        download: 'PDF herunterladen',
      },
      modelSelector: {
        label: 'Modell:',
        gemini: 'Google Gemini',
        openai: 'OpenAI',
        deepseek: 'DeepSeek',
        claude: 'Anthropic Claude',
        proxy: 'Proxy (aiclaude.site)',
      },
      buttons: {
        analyze: 'Analysieren',
        synthesis: 'Synthese erstellen',
        synthesizeNotes: 'Notizen synthetisieren',
        generating: 'Generiere...',
        analyzing: 'Analysiere...',
        search: 'Suchen',
        download: 'Notizen herunterladen',
        download_metadata: 'Metadaten herunterladen',
        save: 'Speichern',
        cancel: 'Abbrechen',
        hideChat: 'Chat ausblenden',
        discuss: 'Diskutieren',
        edit: 'Bearbeiten',
        copy: 'Kopieren',
        copied: 'Kopiert!',
        stop: 'Stopp',
        stopped: 'Gestoppt',
        regenerate: 'Erneut generieren',
        delete: 'Löschen',
        viewWithPdf: 'Mit PDF anzeigen',
        back: 'Zurück zu den Notizen',
        editTemplate: 'Vorlage bearbeiten'
      },
      placeholder: {
          title: 'Bereit zu starten?',
          body: 'Stellen Sie Paper zur Analyse bereit. Ihre KI-generierten Notizen werden hier erscheinen.'
      },
      chat: {
          placeholder: 'Stellen Sie eine Folgefrage...',
          button: 'Senden',
          inputAriaLabel: 'Chat-Eingabe',
          buttonAriaLabel: 'Nachricht senden',
          regenerate: 'Erneut generieren',
          delete: 'Runde löschen',
          branch: 'Hier abzweigen',
      },
      advancedSettings: {
        toggle: 'Erweiterte Einstellungen',
        temperature: {
            label: 'Temperatur',
            description: 'Steuert die Zufälligkeit. Niedrigere Werte sind deterministischer.'
        },
        topP: {
            label: 'Top-P',
            description: 'Steuert die Vielfalt über Nucleus-Sampling. 0.95 bedeutet, dass 95% der Token-Wahrscheinlichkeitsmasse berücksichtigt werden.'
        },
        topK: {
            label: 'Top-K',
            description: 'Steuert die Vielfalt durch Auswahl aus den K wahrscheinlichsten Tokens.'
        },
        maxOutputTokens: {
            label: 'Max. Ausgabe-Tokens',
            description: (max: number) => `Maximale Anzahl Tokens, die das Modell generiert (max: ${max}).`,
            placeholder: (max: number) => `Standard: ${max}`
        }
      },
      apiKeyModal: {
        title: 'API-Schlüssel verwalten',
        disclaimer: 'Schlüssel werden im lokalen Speicher Ihres Browsers gespeichert und nirgendwo anders hin gesendet. Nicht auf einem gemeinsam genutzten Computer verwenden.',
        gemini: 'Google Gemini',
        openai: 'OpenAI',
        deepseek: 'DeepSeek',
        claude: 'Anthropic Claude',
        proxy: 'Proxy (aiclaude.site)',
        placeholder: 'Geben Sie hier Ihren API-Schlüssel ein',
        save: 'Schlüssel speichern',
        close: 'Schließen',
      },
      templateEditor: {
          title: (id: string) => `Vorlage ${id} bearbeiten`,
          description: 'Ändern Sie die Vorlage unten. Ihre Änderungen werden für die zukünftige Verwendung in Ihrem Browser gespeichert.',
          save: 'Benutzerdefinierte Vorlage speichern',
          reset: 'Auf Standard zurücksetzen',
          close: 'Schließen',
      }
    },
    status: {
        preparingAnalysis: 'Analyse wird vorbereitet...',
        parsing: (fileName: string) => `Lese: ${fileName}`,
        generating: (fileName: string) => `Generiere Einblicke für: ${fileName}`,
        synthesizing: (count: number) => `Synthetisiere ${count} Paper/Notizen...`,
        finalizing: 'Notizen werden fertiggestellt...',
        preparingSearch: 'Suche wird vorbereitet...',
        searchingOnPlatform: (platform: string, query: string) => `Suche auf ${platform} nach: "${query}"`,
        gatheringInfo: 'Sammle Informationen aus den Suchergebnissen...',
        structuringData: 'Strukturiere die Paper-Daten...',
        verifyingData: 'Überprüfe die Integrität der Ergebnisse...',
    },
    errors: {
      fileReadFailed: 'Datei konnte nicht gelesen werden.',
      noFiles: 'Bitte laden Sie mindestens eine PDF-Datei hoch.',
      noInput: 'Bitte geben Sie mindestens ein Paper an, entweder durch Hochladen einer PDF oder durch Einfügen von Text.',
      synthesisRequiresTwo: 'Der Synthese-Modus erfordert mindestens zwei Paper.',
      aiNotInitialized: 'KI-Client nicht initialisiert.',
      genericError: 'Ein Fehler ist aufgetreten:',
      pdfTextEmpty: 'Extrahierter Text ist leer. Das PDF könnte bildbasiert oder geschützt sein.',
      pdfParseError: (fileName: string) => `Fehler beim Verarbeiten des Papers ${fileName}`,
      noNotesToDownload: 'Es gibt keine Notizen zum Herunterladen.',
      clipboardNotAvailable: 'Zwischenablage-API in diesem Browser nicht verfügbar.',
      copyFailed: 'Notizen konnten nicht in die Zwischenablage kopiert werden.',
      downloadFailed: 'Metadaten konnten nicht heruntergeladen werden.',
      noSearchResults: 'Für dieses Thema wurden keine Paper gefunden. Versuchen Sie eine andere Abfrage.',
      noSearchResultsToAnalyze: 'Es gibt keine Suchergebnisse zum Analysieren.',
      noSourcesSelected: 'Bitte wählen Sie mindestens eine Suchquelle aus.',
      operationCancelled: 'Vorgang vom Benutzer abgebrochen.',
      apiKeyMissing: (provider: string) => `Der API-Schlüssel für ${provider.charAt(0).toUpperCase() + provider.slice(1)} fehlt. Bitte fügen Sie ihn in den Einstellungen hinzu.`,
      geminiKeyMissingForSearch: 'Für die Suchfunktion ist ein Google Gemini API-Schlüssel erforderlich. Bitte fügen Sie einen in den Einstellungen hinzu.',
      allPapersAnalyzed: 'Alle bereitgestellten Paper wurden bereits analysiert. Fügen Sie neue Paper hinzu, um fortzufahren.',
      sourceNotFoundForNote: 'Die Originalquelle für diese Notiz konnte nicht gefunden werden, um sie erneut zu generieren.',
    },
    prompts: {
        individual: (paperText: string, paperType: string) => {
            if (paperType !== 'auto') {
                return `Bitte lesen Sie dieses PDF im Detail und befolgen Sie strikt die bereitgestellte Vorlage (Vorlage ${paperType}), um den vollständigen Notizinhalt zu generieren. Die endgültige Markdown-Ausgabedatei sollte nur den gemäß der Vorlage generierten Inhalt enthalten, ohne von \`\`\`markdown oder \`\`\` Codeblöcken umschlossen zu sein.\n\nHier ist der vollständige Text des Papers:\n\n${paperText}`;
            }
            return `Bitte lesen Sie dieses PDF im Detail und befolgen Sie strikt die Systemanweisungen, um alle Aufgaben zu erledigen. Befolgen Sie zuerst stillschweigend "Teil 2: Das Zero-Shot-Entscheidungsprotokoll", um zu entscheiden, welche Vorlage verwendet werden soll. Halten Sie sich dann strikt an das Format und die Anforderungen der ausgewählten Vorlage, um den vollständigen Notizinhalt zu generieren. Die endgültige Markdown-Ausgabedatei sollte nur den gemäß der Vorlage generierten Inhalt enthalten, ohne von \`\`\`markdown oder \`\`\` codeblöcken umschlossen zu sein. Achten Sie auf die Dateibenennung (Datum + Papiertitel), den Layout-Abschnitt und das Inhaltsformat.\n\nHier ist der vollständige Text des Papers:\n\n${paperText}`;
        },
        synthesis: (fileCount: number, combinedText: string) => `Bitte lesen Sie den vollständigen Text der folgenden ${fileCount} Paper im Detail und befolgen Sie strikt die Systemanweisungen (Vorlage G), um eine umfassende und aufschlussreiche akademische Übersicht zu erstellen. Stellen Sie sicher, dass die Analyse tiefgründig und professionell ist und dem angegebenen Markdown-Format folgt. Die endgültige Markdown-Ausgabedatei sollte nur den gemäß der Vorlage generierten Inhalt enthalten, ohne von \`\`\`markdown oder \`\`\` Codeblöcken umschlossen zu sein.\n\nHier ist der vollständige Text aller Paper:\n\n${combinedText}`,
        synthesis_abstracts: (fileCount: number, combinedText: string) => `Bitte analysieren Sie die folgenden ${fileCount} Papier-Abstracts im Detail und befolgen Sie strikt die Systemanweisung (Vorlage G-Abstracts), um eine umfassende und aufschlussreiche akademische Rezension zu erstellen, die *nur* auf den bereitgestellten Abstracts basiert. Die endgültige Markdown-Ausgabedatei sollte nur den gemäß der Vorlage generierten Inhalt enthalten, ohne von \`\`\`markdown oder \`\`\` Codeblöcken umschlossen zu sein.\n\nHier sind die Abstracts aller Paper:\n\n${combinedText}`,
        synthesis_notes: (noteCount: number, combinedText: string) => `Bitte führen Sie eine Meta-Synthese der folgenden ${noteCount} detaillierten Forschungsnotizen durch. Befolgen Sie strikt die Systemanweisung (Vorlage H), um eine hochrangige, strategische Übersicht zu erstellen, die aufkommende Themen, Debatten und zukünftige Richtungen identifiziert. Die endgültige Markdown-Ausgabedatei sollte nur den gemäß der Vorlage generierten Inhalt enthalten, ohne von \`\`\`markdown oder \`\`\` Codeblöcken umschlossen zu sein.\n\nHier ist der vollständige Inhalt aller Notizen:\n\n${combinedText}`,
        chat: (noteContent: string) => `### [SYSTEMANWEISUNG: Akademisches Dialogprotokoll]

Sie sind ein akademischer Mitarbeiter auf Augenhöhe. Ihre Aufgabe ist es, eine tiefe, kritische und aufschlussreiche Diskussion rund um die bereitgestellte Forschungsnotiz zu ermöglichen. Sie sind kein Allzweck-Assistent, sondern ein Experte für die Dekonstruktion und Synthese wissenschaftlicher Arbeiten.

### **Teil 1: Leitphilosophie**

1.  **Texttreue, Erweiterung des Wissens**: Ihre primäre Informationsquelle sind das Originalpapier und die Notiz. Wenn Sie allgemeines Wissen zur Kontextualisierung oder Erklärung eines Konzepts verwenden, müssen Sie explizit angeben: "Ausgehend von allgemeinem Wissen außerhalb des bereitgestellten Textes...". Wenn die Antwort nicht im Text enthalten ist, geben Sie klar an: "Der bereitgestellte Text und die Notiz enthalten keine spezifischen Informationen zu diesem Thema."

2.  **Vom "Was" zum "Warum" und "Na und"**: Rufen Sie nicht nur Informationen ab. Ihr Wert liegt darin, die Punkte zu verbinden. Wenn Sie nach einem Ergebnis gefragt werden, erklären Sie dessen Bedeutung im Kontext der Forschungsfrage. Wenn Sie nach einer Methode gefragt werden, diskutieren Sie deren Kompromisse und Design-Rationale, wie in der Notiz beschrieben.

3.  **Wissenschaftliche Strenge und Nuancen annehmen**: Vermeiden Sie übermäßig selbstbewusste oder vereinfachte Antworten. Verwenden Sie eine vorsichtige und präzise Sprache. Erkennen Sie Einschränkungen, Gegenargumente und Unsicherheiten an, die im Paper und in der Notiz erwähnt werden. Formulieren Sie Ihre Antworten als kritische Analyse, nicht als absolute Tatsache.

4.  **Seien Sie ein aktiver Dialogpartner**: Ihr Ziel ist es, das Verständnis des Benutzers zu vertiefen. Erwägen Sie nach der Beantwortung einer Frage, eine Folgefrage zu stellen, die kritisches Denken anregt, wie zum Beispiel:
    *   "Angesichts dieser Einschränkung, welche Art von Experiment könnte sie angehen?"
    *   "Wie könnte diese Erkenntnis in einem anderen Kontext, wie [verwandtes Feld], Anwendung finden?"
    *   "Die Autoren wählten Methode A statt Methode B. Was war Ihrer Meinung nach der entscheidende Faktor bei dieser Entscheidung?"

### **Teil 2: Operatives Protokoll**

*   **Bei einer sachlichen Frage (z. B. "Was war der p-Wert für das primäre Ergebnis?"):**
    1.  Lokalisieren Sie den spezifischen Datenpunkt in der Notiz.
    2.  Geben Sie die Tatsache direkt und genau an.
    3.  Geben Sie sofortigen Kontext aus der Notiz an.

*   **Bei einer erklärenden Frage (z. B. "Warum ist diese Erkenntnis signifikant?"):**
    1.  Beziehen Sie sich auf die Abschnitte "Schlussfolgerung des Autors", "Diskussion" oder "Bedeutung" der Notiz.
    2.  Synthetisieren Sie die Interpretation der Autoren.
    3.  Verbinden Sie die Erkenntnis mit der zentralen wissenschaftlichen Frage des Papiers.

*   **Bei einer kritischen Frage (z. B. "Was sind die Schwächen dieser Studie?"):**
    1.  Berichten Sie zunächst über alle Einschränkungen, die von den Autoren in der Notiz ausdrücklich erwähnt werden.
    2.  Identifizieren Sie dann potenzielle unausgesprochene Einschränkungen, die **nur** auf den Informationen im Paper basieren (z. B. Stichprobengröße, Baseline-Vergleiche, Wahl der Kontrollgruppe).
    3.  Formulieren Sie diese Punkte als Diskussionsstarter, z. B. "Die Notiz erwähnt, dass die Studie retrospektiv war, was Fragen zu potenziellem Auswahlbias aufwerfen könnte. Was denken Sie darüber?"

*   **Bei einer vergleichenden Frage (z. B. "Wie schneidet Modell A im Vergleich zu Modell B ab?"):**
    1.  Extrahieren Sie die relevanten Details für beide aus der Notiz.
    2.  Organisieren Sie den Vergleich auf strukturierte Weise (z. B. Stichpunkte oder eine Tabelle), die wichtige Aspekte wie Leistung, Methodik und Annahmen abdeckt.

--- NOTIZ ---
${noteContent}
--- ENDE NOTIZ ---`
    },
    modal: {
        title: 'Anleitung zur Benutzung von Erudite',
        intro: 'Dieses Werkzeug hilft Ihnen, dichte wissenschaftliche Arbeiten in strukturierte, aufschlussreiche Notizen umzuwandeln. Befolgen Sie diese einfachen Schritte:',
        step1: {
            title: 'Wählen Sie Ihren Modus:',
            body: 'Wählen Sie "Tiefenlektüre", um Ihre eigenen Dokumente zu analysieren, oder "Synthese", um eine Literaturübersicht zu erstellen.',
        },
        step2: {
            title: 'Inhalt bereitstellen:',
            option1: {
                title: 'Im Tiefenlektüre-Modus:',
                body: 'Verwenden Sie die Tabs, um entweder "Dateien hochzuladen" (per Drag & Drop oder durchsuchen nach PDFs) oder "Text einzufügen", um Ihren akademischen Inhalt direkt einzugeben. Sie können auch den Paper-Typ für genauere Notizen angeben.'
            },
            option2: {
                title: 'Im Synthese-Modus:',
                body: 'Geben Sie ein Forschungsthema in die Suchleiste ein oder verwenden Sie die lokalen Upload-/Einfügeoptionen. Die KI wird alle bereitgestellten Inhalte verwenden, um eine Übersicht zu erstellen.'
            }
        },
        step3: {
            title: 'Analysieren:',
            body: 'Klicken Sie auf die Schaltfläche "Analysieren" oder "Synthese erstellen". Die KI beginnt mit der Verarbeitung des Inhalts, was einige Momente dauern kann. Sie sehen Statusaktualisierungen, während sie arbeitet.'
        },
        step4: {
            title: 'Mit Notizen interagieren:',
            action1: 'Diskutieren:',
            action1_desc: 'Öffnen Sie ein Chat-Fenster, um Folgefragen zur Notiz zu stellen. Die KI agiert als akademischer Mitarbeiter und hilft Ihnen, die Details des Papers tiefer zu erforschen.',
            action2: 'Bearbeiten:',
            action2_desc: 'Ändern Sie die generierte Notiz direkt in Ihrem Browser. Klicken Sie auf "Speichern", um Ihre Änderungen zu behalten, oder auf "Abbrechen", um sie zu verwerfen.',
            action3: 'Kopieren:',
            action3_desc: 'Kopieren Sie den gesamten Markdown-Inhalt der Notiz sofort in Ihre Zwischenablage.',
            action4: 'Notizen herunterladen:',
            action4_desc: 'Verwenden Sie die Schaltfläche "Notizen herunterladen", um alle aktuell sichtbaren Notizen als einzelne `.md`-Dateien auf Ihrem Computer zu speichern. Wenn mehrere Notizen vorhanden sind, werden sie in einer einzigen .zip-Datei gespeichert.',
            action5: 'Mit PDF anzeigen:',
            action5_desc: 'Für Notizen aus hochgeladenen PDFs klicken Sie hier, um eine geteilte Ansicht mit dem PDF auf der linken und der Notiz auf der rechten Seite zu öffnen. Verweise wie "Abb. 1" in der Notiz sind anklickbar und springen zur richtigen Seite im PDF.',
        },
        outro: 'Wenn Sie auf Probleme mit PDFs stoßen, stellen Sie sicher, dass sie textbasiert und kein gescanntes Bild sind. Viel Spaß bei der Forschung!'
    }
  }
};