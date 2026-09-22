#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 📄 BRIDS KNOWLEDGE FORT - UNIFIED LATEX & PDF EXPORT ENGINE (v1.0)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Compila y exporta documentos a PDF de alta resolución con soporte nativo
 * para LaTeX puro (.tex) y Markdown enriquecido (.md) con fórmulas matemáticas,
 * tablas y diseño institucional BRIDS.
 * 
 * Motores utilizados:
 *   - Tectonic (v0.16.9): Compilador XeTeX moderno y autónomo en Rust.
 *   - Pandoc (v3.9.0): Conversor universal con motor PDF Tectonic.
 * 
 * Uso:
 *   node Academic-Engine/scripts/export-pdf.js <input-file> [output-file] [opciones]
 *   bash Academic-Engine/scripts/export-pdf.sh <input-file> [output-file]
 * 
 * Opciones:
 *   --raw          No inyectar la plantilla corporativa BRIDS (para .md)
 *   --open         Abrir el PDF resultante automáticamente al finalizar
 * ═══════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '../..');
const ENGINE_DIR = path.join(ROOT_DIR, 'Academic-Engine');
const BRAND_DIR = path.join(ENGINE_DIR, 'brand');
const TEMPLATES_DIR = path.join(ENGINE_DIR, 'templates');
const HEADER_TEMPLATE = path.join(TEMPLATES_DIR, 'brids-latex-header.tex');

function checkPrerequisites() {
  const errors = [];
  try {
    execSync('tectonic --version', { stdio: 'ignore' });
  } catch {
    errors.push('Tectonic no está instalado o no se encuentra en el PATH. Instala con: brew install tectonic');
  }

  try {
    execSync('pandoc --version', { stdio: 'ignore' });
  } catch {
    errors.push('Pandoc no está instalado o no se encuentra en el PATH. Instala con: brew install pandoc');
  }

  if (errors.length > 0) {
    console.error('\n❌ ERROR: Requisitos de software faltantes:');
    for (const err of errors) console.error(`   • ${err}`);
    process.exit(1);
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function exportPdf() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Uso:
  bash Academic-Engine/scripts/export-pdf.sh <archivo-entrada> [archivo-salida.pdf] [opciones]

Ejemplos:
  bash Academic-Engine/scripts/export-pdf.sh "Academic Vault/Drafts/informe-tecnico.md"
  bash Academic-Engine/scripts/export-pdf.sh whitepaper.tex
  bash Academic-Engine/scripts/export-pdf.sh nota.md salida.pdf --open
`);
    process.exit(0);
  }

  checkPrerequisites();

  const isRaw = args.includes('--raw');
  const shouldOpen = args.includes('--open');
  const positionalArgs = args.filter(a => !a.startsWith('--'));

  const inputPath = path.resolve(process.cwd(), positionalArgs[0]);
  if (!fs.existsSync(inputPath)) {
    console.error(`\n❌ Error: El archivo de entrada no existe: ${inputPath}`);
    process.exit(1);
  }

  const ext = path.extname(inputPath).toLowerCase();
  if (ext !== '.tex' && ext !== '.md') {
    console.error(`\n❌ Error: Formato no soportado (${ext}). El archivo debe ser .tex o .md`);
    process.exit(1);
  }

  let outputPath = positionalArgs[1]
    ? path.resolve(process.cwd(), positionalArgs[1])
    : path.join(path.dirname(inputPath), `${path.basename(inputPath, ext)}.pdf`);

  ensureDir(path.dirname(outputPath));

  console.log('\n' + '═'.repeat(75));
  console.log('🏛️ BRIDS KNOWLEDGE FORT - EXPORTADOR DE ALTA RESOLUCIÓN A PDF');
  console.log('═'.repeat(75));
  console.log(`   📄 Entrada:   ${path.relative(ROOT_DIR, inputPath)}`);
  console.log(`   📑 Salida:    ${path.relative(ROOT_DIR, outputPath)}`);
  console.log(`   ⚙️ Motor:     Tectonic + Pandoc`);

  const startTime = Date.now();

  try {
    if (ext === '.tex') {
      console.log('   🚀 Compilando archivo LaTeX nativo con Tectonic...');
      const workDir = path.dirname(inputPath);
      execSync(`tectonic "${inputPath}" -o "${path.dirname(outputPath)}"`, {
        cwd: workDir,
        stdio: 'inherit'
      });
      const defaultOut = path.join(path.dirname(outputPath), `${path.basename(inputPath, '.tex')}.pdf`);
      if (defaultOut !== outputPath && fs.existsSync(defaultOut)) {
        fs.renameSync(defaultOut, outputPath);
      }
    } else if (ext === '.md') {
      console.log(`   🚀 Procesando Markdown con soporte LaTeX ${isRaw ? '(Modo Raw)' : '(Plantilla Institucional BRIDS)'}...`);
      
      let headerArg = '';
      let tmpHeader = null;

      if (!isRaw && fs.existsSync(HEADER_TEMPLATE)) {
        const headerContent = fs.readFileSync(HEADER_TEMPLATE, 'utf8');
        const logoPath = path.join(BRAND_DIR, 'brids-logo-dark.pdf');
        const resolvedHeader = headerContent.replace('brids-logo-dark.pdf', logoPath);
        tmpHeader = path.join(ENGINE_DIR, 'templates', '.tmp-brids-header.tex');
        fs.writeFileSync(tmpHeader, resolvedHeader, 'utf8');
        headerArg = ` -H "${tmpHeader}"`;
      }

      const resourcePaths = [
        '.',
        path.dirname(inputPath),
        BRAND_DIR,
        TEMPLATES_DIR,
        ROOT_DIR
      ].join(':');

      const pandocCmd = `pandoc "${inputPath}" --pdf-engine=tectonic -o "${outputPath}" --resource-path="${resourcePaths}"${headerArg}`;

      try {
        execSync(pandocCmd, {
          cwd: path.dirname(inputPath),
          stdio: 'inherit'
        });
      } finally {
        if (tmpHeader && fs.existsSync(tmpHeader)) {
          fs.unlinkSync(tmpHeader);
        }
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const stats = fs.statSync(outputPath);
    const sizeKb = (stats.size / 1024).toFixed(1);

    console.log('═'.repeat(75));
    console.log(`   ✅ PDF exportado con éxito: ${path.relative(ROOT_DIR, outputPath)} (${sizeKb} KB)`);
    console.log(`   ⏱️ Tiempo de compilación: ${elapsed}s`);
    console.log('═'.repeat(75));

    if (shouldOpen) {
      const openCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
      execSync(`${openCmd} "${outputPath}"`);
    }

  } catch (error) {
    console.error('\n❌ Fallo en la exportación a PDF:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  exportPdf();
}

module.exports = { exportPdf };
