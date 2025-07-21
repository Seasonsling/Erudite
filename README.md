# Erudite: The Art of Scholarly Distillation

![Erudite Screenshot](https://storage.googleapis.com/maker-suite-media/erudite/erudite-screenshot.png)

**Erudite** is a powerful, AI-driven web application designed to help researchers, students, and academics deconstruct, analyze, and synthesize scholarly papers. By leveraging cutting-edge Large Language Models (LLMs), Erudite transforms dense academic texts into structured, insightful, and interactive notes.

## Core Features

-   **Deep Read Mode**: Analyze single or multiple papers simultaneously by uploading PDFs or pasting text. Erudite generates in-depth, structured notes based on customizable, domain-specific templates (e.g., for computational science, clinical trials, basic research).
-   **Synthesis Mode**:
    -   **Literature Review Generation**: Provide a research topic, and Erudite will search academic databases (PubMed, Google Scholar, arXiv, and more) to find relevant papers and generate a comprehensive literature review.
    -   **Hybrid Input**: Combine online search results with your own uploaded PDFs or pasted text for a complete synthesis.
-   **Interactive & Dynamic Notes**:
    -   **Chat with Your Notes**: Each generated note features a "Discuss" function, opening a chat interface where you can ask follow-up questions, clarify concepts, and delve deeper into the paper's content with an AI collaborator.
    -   **Edit & Refine**: Directly edit the AI-generated Markdown content in the browser to add your own insights or correct details.
    -   **Download & Export**: Easily download your notes as individual `.md` files or as a single `.zip` archive for multi-note sessions.
-   **Two-Pane Viewer**: For notes generated from PDFs, a "View with PDF" button opens a side-by-side interface. The original PDF is displayed on one side and your structured note on the other. References in the note (e.g., "Fig. 1", "Table 2") are clickable, instantly navigating you to the corresponding page in the PDF.
-   **Multi-Model & Multilingual Support**:
    -   Choose from a wide range of LLMs, including models from Google Gemini, OpenAI, Anthropic Claude, and DeepSeek.
    -   The user interface is available in English, Chinese (中文), and German (Deutsch).
-   **Advanced Customization**:
    -   Fine-tune model parameters like temperature, Top-P, and Top-K.
    -   Edit and save custom versions of the note-taking templates to perfectly match your workflow.

## How to Use Erudite

1.  **Get API Keys**: Erudite requires you to use your own API keys for the AI models. The academic search feature specifically requires a **Google Gemini API key**.
    -   Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
    -   Obtain keys for other providers (OpenAI, Anthropic, etc.) from their respective platforms.
2.  **Set API Keys in Erudite**: Click the **key icon (🔑)** in the top-right corner of the app. A modal will appear where you can securely save your keys to your browser's local storage.
3.  **Choose Your Mode**:
    -   **Deep Read**: For analyzing papers you already have.
    -   **Synthesis**: For discovering papers on a topic and generating a literature review.
4.  **Provide Content**:
    -   Upload one or more PDFs.
    -   Paste the full text of one or more papers.
    -   In Synthesis Mode, enter a research topic to search online.
5.  **Analyze**: Select your desired AI model and click the "Analyze" or "Synthesize" button.
6.  **Interact**: Once the notes are generated, you can read, edit, discuss, and download them using the action buttons on each note card.

## Tech Stack

-   **Frontend**: React, TypeScript, Vite
-   **AI**: Google Gemini API (`@google/genai`) for core features and academic search
-   **File Handling**: `pdf.js` for PDF parsing, `jszip` for creating ZIP archives
-   **Styling**: Plain CSS with modern features

## Local Development

To run Erudite on your local machine:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Seasonsling/Erudite.git
    cd Erudite
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Run the development server**:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Contributing

Contributions are welcome! If you have ideas for new features, bug fixes, or improvements, please feel free to open an issue or submit a pull request.

## License

This project is licensed under the Apache 2.0 License. See the `LICENSE` file for details.