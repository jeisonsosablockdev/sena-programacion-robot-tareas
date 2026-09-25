import { execSync } from 'child_process';

export interface PptxSlide {
  index: number;
  title: string;
  bullets: string[];
  notes?: string;
}

export interface PptxExtractionResult {
  totalSlides: number;
  slides: PptxSlide[];
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();
}

/**
 * Extracts slides, text bullets, and speaker notes from a PPTX file using built-in unzip.
 */
export function extractPptxContent(filePath: string): PptxExtractionResult {
  try {
    // 1. List files inside PPTX archive
    const zipListing = execSync(`/usr/bin/unzip -Z1 "${filePath}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });

    const lines = zipListing.split('\n').map(l => l.trim());

    // 2. Identify slide files: ppt/slides/slide{N}.xml
    const slideEntries = lines
      .filter(l => /^ppt\/slides\/slide\d+\.xml$/.test(l))
      .map(entry => {
        const match = entry.match(/slide(\d+)\.xml/);
        const num = match ? parseInt(match[1], 10) : 0;
        return { entry, num };
      })
      .sort((a, b) => a.num - b.num);

    const slides: PptxSlide[] = [];

    // 3. Extract text from each slide
    for (let i = 0; i < slideEntries.length; i++) {
      const item = slideEntries[i];
      const slideIndex = i + 1;

      let xmlContent = '';
      try {
        xmlContent = execSync(`/usr/bin/unzip -p "${filePath}" "${item.entry}"`, {
          encoding: 'utf8',
          maxBuffer: 10 * 1024 * 1024,
          stdio: ['pipe', 'pipe', 'ignore']
        });
      } catch {
        continue;
      }

      // Extract all text chunks <a:t>...</a:t>
      const matches = [...xmlContent.matchAll(/<a:t(?:\s+[^>]*)?>([\s\S]*?)<\/a:t>/g)].map(m =>
        decodeXmlEntities(m[1])
      ).filter(t => t.length > 0);

      const title = matches.length > 0 ? matches[0] : `Diapositiva ${slideIndex}`;
      const bullets = matches.length > 1 ? matches.slice(1) : [];

      // Check for speaker notes: ppt/notesSlides/notesSlide{num}.xml
      let notes: string | undefined = undefined;
      const notePath = `ppt/notesSlides/notesSlide${item.num}.xml`;
      if (lines.includes(notePath)) {
        try {
          const notesXml = execSync(`/usr/bin/unzip -p "${filePath}" "${notePath}"`, {
            encoding: 'utf8',
            maxBuffer: 5 * 1024 * 1024,
            stdio: ['pipe', 'pipe', 'ignore']
          });
          const noteMatches = [...notesXml.matchAll(/<a:t(?:\s+[^>]*)?>([\s\S]*?)<\/a:t>/g)].map(m =>
            decodeXmlEntities(m[1])
          ).filter(t => t.length > 0 && !t.includes('slide') && !/^\d+$/.test(t));
          if (noteMatches.length > 0) {
            notes = noteMatches.join(' ');
          }
        } catch {
          // No notes available
        }
      }

      slides.push({
        index: slideIndex,
        title,
        bullets: bullets.slice(0, 15),
        notes
      });
    }

    return {
      totalSlides: slides.length,
      slides
    };
  } catch (err: any) {
    console.warn(`[PPTX Extractor] Error procesando ${filePath}: ${err.message}`);
    return {
      totalSlides: 0,
      slides: []
    };
  }
}
