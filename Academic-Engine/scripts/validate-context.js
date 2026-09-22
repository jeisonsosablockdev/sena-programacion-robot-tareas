#!/usr/bin/env node

/**
 * Academic & Course Context Enforcement Linter
 * Validates that course-profile.md, cs-standards.md, and academic-writing-guide.md
 * are complete and ready before generating deliverables.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const CONTEXT_DIR = path.join(ROOT_DIR, 'Academic-Engine', 'context');
const COURSE_PROFILE_PATH = path.join(CONTEXT_DIR, 'course-profile.md');
const CS_STANDARDS_PATH = path.join(CONTEXT_DIR, 'cs-standards.md');
const WRITING_GUIDE_PATH = path.join(CONTEXT_DIR, 'academic-writing-guide.md');

function auditContext() {
  console.log('\n' + '═'.repeat(75));
  console.log('🔍 AUDITORÍA DE ENFORCEMENT: CONTEXTO FORMATIVO Y ESTÁNDARES CS');
  console.log('═'.repeat(75));

  if (!fs.existsSync(COURSE_PROFILE_PATH)) {
    console.error(`❌ ERROR CRÍTICO: No existe el archivo de perfil formativo en ${COURSE_PROFILE_PATH}`);
    process.exit(1);
  }

  const content = fs.readFileSync(COURSE_PROFILE_PATH, 'utf8');

  const requiredSections = [
    { name: 'Institución y Programa', regex: /## Institución y Programa[\s\S]*?- \*\*Institución:\*\*\s*(.+)/i },
    { name: 'Estudiante / Aprendiz', regex: /## Estudiante \/ Aprendiz[\s\S]*?- \*\*Nombre del Aprendiz:\*\*\s*(.+)/i },
    { name: 'Objetivos de Aprendizaje', regex: /## Objetivos de Aprendizaje[\s\S]*?1\.\s*(.+)/i },
    { name: 'Competencias Técnicas Clave', regex: /## Competencias Técnicas Clave[\s\S]*?-\s*(.+)/i },
    { name: 'Stack Tecnológico Principal', regex: /## Stack Tecnológico Principal[\s\S]*?\|\s*\*\*Lenguajes\*\*\s*\|\s*(.+?)\s*\|/i },
    { name: 'Tipología de Evidencias de Aprendizaje', regex: /## Tipología de Evidencias de Aprendizaje[\s\S]*?1\.\s*(.+)/i }
  ];

  let completedCount = 0;
  const issues = [];
  const passed = [];

  for (const sec of requiredSections) {
    const match = content.match(sec.regex);
    if (match && match[1] && match[1].trim().length > 2) {
      completedCount++;
      passed.push(`✅ ${sec.name}: "${match[1].trim().substring(0, 45)}..."`);
    } else {
      issues.push(`⚠️ Falta completar: ${sec.name}`);
    }
  }

  // Verify supplementary context files
  if (fs.existsSync(CS_STANDARDS_PATH)) {
    passed.push(`✅ Estándares de Ingeniería y Calidad CS: ${path.basename(CS_STANDARDS_PATH)}`);
  } else {
    issues.push(`⚠️ Falta archivo de estándares CS: ${path.basename(CS_STANDARDS_PATH)}`);
  }

  if (fs.existsSync(WRITING_GUIDE_PATH)) {
    passed.push(`✅ Guía de Redacción Académica y Técnica: ${path.basename(WRITING_GUIDE_PATH)}`);
  } else {
    issues.push(`⚠️ Falta archivo de guía académica: ${path.basename(WRITING_GUIDE_PATH)}`);
  }

  const totalChecks = requiredSections.length + 2;
  const totalPassed = completedCount + (fs.existsSync(CS_STANDARDS_PATH) ? 1 : 0) + (fs.existsSync(WRITING_GUIDE_PATH) ? 1 : 0);
  const readinessScore = Math.round((totalPassed / totalChecks) * 100);

  console.log(`📍 Perfil Formativo: ${COURSE_PROFILE_PATH}`);
  console.log(`📊 Nivel de Preparación del Contexto: ${readinessScore}%\n`);

  if (passed.length > 0) {
    console.log('Campos y Archivos Verificados:');
    for (const p of passed) console.log(`   ${p}`);
    console.log('');
  }

  if (issues.length > 0) {
    console.log('Puntos de Atención:');
    for (const iss of issues) console.log(`   ${iss}`);
    console.log('');
  }

  console.log('═'.repeat(75));

  if (readinessScore < 50) {
    console.warn('⚠️ AVISO DE ENFORCEMENT: El contexto formativo está incompleto.');
    process.exit(1);
  } else {
    console.log('✅ Contexto formativo y estándares CS verificados para orquestar tareas sin drifting.\n');
    return { passed: true, score: readinessScore };
  }
}

auditContext();
