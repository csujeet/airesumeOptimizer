// This helper uses pdfjs-dist to extract real text from a PDF ArrayBuffer in the browser.
// Usage: import extractTextFromPDF from './pdfTextExtract';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

// Set workerSrc to CDN for Vite compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function extractTextFromPDF(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }
  return text.trim();
}

export default extractTextFromPDF;
