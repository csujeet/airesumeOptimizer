// TypeScript declaration for pdfTextExtract.js
// Place this file next to pdfTextExtract.js

declare function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string>;
export = extractTextFromPDF;
