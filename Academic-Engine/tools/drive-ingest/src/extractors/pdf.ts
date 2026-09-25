import fs from 'fs';

// pdf-parse v2 provides PDFParse class
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PDFParse } = require('pdf-parse');

export interface PdfExtractionResult {
  numpages: number;
  text: string;
}

/**
 * Extracts raw text and page count from a PDF file using pdf-parse.
 */
export async function extractPdfContent(filePath: string): Promise<PdfExtractionResult> {
  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: dataBuffer });

  try {
    await parser.load();
    const textResult = await parser.getText();

    let text = '';
    if (typeof textResult === 'string') {
      text = textResult;
    } else if (textResult && typeof textResult.text === 'string') {
      text = textResult.text;
    } else if (textResult && Array.isArray(textResult)) {
      text = textResult.join('\n');
    }

    const numpages = parser.doc?.numPages || 1;
    await parser.destroy().catch(() => {});

    return {
      numpages,
      text: (text || '').trim()
    };
  } catch (err: any) {
    await parser.destroy().catch(() => {});
    console.warn(`[PDF Extractor] Error procesando PDF ${filePath}: ${err.message}`);
    return {
      numpages: 1,
      text: ''
    };
  }
}

/**
 * Parses raw PDF text into logical sections based on typical SENA headers.
 */
export function analyzePdfSections(rawText: string): {
  actionItems: string[];
  competencies: string[];
  keyTopics: string[];
  summary: string;
} {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const actionItems: string[] = [];
  const competencies: string[] = [];
  const keyTopics: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Look for evidences and actions
    if (lower.includes('evidencia') || lower.includes('actividad de aprendizaje') || lower.includes('entregable') || lower.includes('taller')) {
      if (line.length < 160 && !actionItems.includes(line)) {
        actionItems.push(line);
      }
    }

    // Look for competencies and RAPs
    if (lower.includes('competencia') || lower.includes('resultado de aprendizaje') || lower.includes('rap')) {
      if (line.length < 180 && !competencies.includes(line)) {
        competencies.push(line);
      }
    }

    // Look for major section headers
    if (/^[0-9]+(\.[0-9]+)*\s+[A-ZÁÉÍÓÚÑ]/.test(line) && line.length < 80) {
      if (!keyTopics.includes(line)) {
        keyTopics.push(line);
      }
    }
  }

  const summary = lines.slice(0, 15).join(' ').slice(0, 800);

  return {
    actionItems: actionItems.slice(0, 8),
    competencies: competencies.slice(0, 6),
    keyTopics: keyTopics.slice(0, 12),
    summary: summary || 'Documento técnico de apoyo formativo.'
  };
}
