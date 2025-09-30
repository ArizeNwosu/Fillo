// Type declarations for third-party libraries

declare module 'pdfjs-dist' {
    export const GlobalWorkerOptions: {
        workerSrc: string;
    };

    export function getDocument(src: string | { data: Uint8Array }): {
        promise: Promise<PDFDocumentProxy>;
    };

    export interface PDFDocumentProxy {
        numPages: number;
        getPage(pageNumber: number): Promise<PDFPageProxy>;
    }

    export interface PDFPageProxy {
        getTextContent(): Promise<TextContent>;
    }

    export interface TextContent {
        items: Array<{ str: string }>;
    }
}

declare module 'mammoth' {
    export function extractRawText(options: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>;
}

declare module 'tesseract.js' {
    export function createWorker(): Promise<Worker>;

    export interface Worker {
        load(): Promise<void>;
        loadLanguage(lang: string): Promise<void>;
        initialize(lang: string): Promise<void>;
        recognize(image: string): Promise<{ data: { text: string } }>;
        terminate(): Promise<void>;
    }
}

declare module 'jspdf' {
    export default class jsPDF {
        constructor(options?: { orientation?: string; unit?: string; format?: string | number[] });
        text(text: string, x: number, y: number, options?: { maxWidth?: number }): void;
        addPage(): void;
        save(filename: string): void;
        internal: {
            pageSize: {
                getWidth(): number;
                getHeight(): number;
            };
        };
    }
}

declare module 'html2canvas' {
    export default function html2canvas(element: HTMLElement, options?: {
        scale?: number;
        useCORS?: boolean;
        logging?: boolean;
        backgroundColor?: string;
    }): Promise<HTMLCanvasElement>;
}