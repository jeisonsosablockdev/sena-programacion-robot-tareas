---
spec_id: "SPEC-{{SLUG}}"
title: "{{TITLE}}"
target_vault_folder: "Academic Vault/{{CATEGORY_FOLDER}}/"
target_file: "Academic Vault/{{CATEGORY_FOLDER}}/{{FILENAME}}.md"
subagents_involved:
  - "{{PRIMARY_AGENT}}"
  - "{{SECONDARY_AGENT}}"
status: spec_review # spec_review | spec_approved | draft_optimizing | deliverable_review | completed | frozen_for_arbitration
created_at: "{{DATE}}"
updated_at: "{{DATE}}"
hitl_checkpoints:
  hitl_1_spec_approval:
    status: pending # pending | refining | approved
    approved_at: null
    user_feedback: []
  hitl_2_deliverable_approval:
    status: pending # pending | refining | approved
    approved_at: null
    user_feedback: []
evaluation:
  target_score: 8.5
  scale_max: 9.0
  max_cycles: 5
  current_cycle: 0
  final_score: null
  criticism_history: []
---

# Spec: {{TITLE}}

> [!NOTE]
> **Resumen Ejecutivo:** {{EXECUTIVE_SUMMARY}}
> Este artefacto define de manera formal e inmutable los requisitos, el destino canónico en `Academic Vault/`, los subagentes responsables y las restricciones de calidad para el entregable antes de iniciar cualquier redacción o desarrollo.
> Cuenta con dos puntos de parada humana obligatorios: **HITL-1 (Aprobación del Spec)** y **HITL-2 (Aprobación del Entregable)**.

---

## 1. Destino Canónico en el Vault
- **Carpeta de Destino:** `Academic Vault/{{CATEGORY_FOLDER}}/`
- **Archivo de Salida:** `Academic Vault/{{CATEGORY_FOLDER}}/{{FILENAME}}.md`
- **Taxonomía:** Cumple con la estructura numerada estándar de `Academic Vault/` (00 a 10).
- **Regla de Promoción:** El documento final solo se escribirá en esta ruta cuando el Agente Revisor otorgue una calificación $\ge 8.5 / 9.0$ **Y** el usuario otorgue su confirmación formal en el guardrail **HITL-2** (`approve-deliverable`).

---

## 2. Sub-Agentes Asignados y Roles
| Sub-Agente | Rol Asignado | Responsabilidad Principal |
| :--- | :--- | :--- |
| `{{PRIMARY_AGENT}}` | Creador / Editor Líder | Redacción inicial del borrador técnico/estratégico y subsanación activa de observaciones. |
| `{{SECONDARY_AGENT}}` | Validador de Dominio / Co-Autor | Aportación de datos especializados (legal, métricas financieras o narrativa fundadora). |
| `sdd-reviewer` | Revisor / Auditor Crítico | Evaluación rigurosa en 4 dimensiones, detección de muletillas de IA y emisión del reporte de remediación. |

---

## 3. Propósito Comercial y Audiencia (ICP)
- **Objetivo de Negocio:** {{BUSINESS_GOAL}}
- **Público Objetivo (ICP):** {{TARGET_ICP}}
- **Acción Deseada (CTA):** {{PRIMARY_CTA}}
- **KPI Primario de Éxito:** {{PRIMARY_KPI}}

---

## 4. Anclas Técnicas y Veracidad de Fuentes (Zero-Hallucination)
Toda afirmación técnica, legal o financiera debe estar anclada a hechos verificables del ecosistema BRIDS:
- **Infraestructura Blockchain:** Solana Mainnet / Devnet, RPC de baja latencia, transacciones atómicas.
- **Estándar de Tokenización:** Metaplex Core con plugins de Freeze (congelamiento por cumplimiento regulatorio) y Recovery (recuperación de activos respaldada por validación de identidad).
- **Estructura Legal y Regulatoria:** Separación dual estricta — Delaware C-Corp (proveedor tecnológico de software SaaS sin custodia) vs. SPV LLC independiente por inmueble (emisora y titular legal del activo inmobiliario). KYC/AML vía Stripe Identity.
- **Modelo Financiero y Unit Economics:** Fee de estructuración SaaS, fee por transacción secundaria (si aplica) y recuperación sin comisiones especulativas no sostenibles.
- **Fuentes / Documentos de Referencia:**
  - Contexto de Marca: `[[01 Brand Context/product-marketing-context.md]]`
  - {{REFERENCE_DOC_1}}
  - {{REFERENCE_DOC_2}}

---

## 5. Desglose Estructural (Outline)
Estructura obligatoria del documento final:
1. **Título & Frontmatter Estándar:** Con metadatos versionados (v1.0), tags y callout `> [!NOTE]`.
2. **Contexto & Problema de Mercado:** Dolor cuantificado del sponsor/inversor sin introducciones genéricas.
3. **Propuesta de Valor & Mecánica de Solución:** Explicación técnica y comercial de la solución BRIDS.
4. **Métricas & Casos de Uso Concretos:** Datos financieros o arquitecturas verificables.
5. **Llamado a la Acción (CTA) & Próximos Pasos:** Contacto o interacción definida.
- **Rango de Extensión Estimada:** {{WORD_COUNT_RANGE}} palabras.

---

## 6. Filtro Anti-Robot y Clichés Prohibidos (Banned Patterns)
> [!CAUTION]
> **Tolerancia Cero con Muletillas de IA:** La presencia de cualquiera de las siguientes frases restará automáticamente puntaje en la dimensión *Originalidad Léxica & Cero Clichés* e impedirá la aprobación del entregable:
- ❌ *"en resumen"* / *"en conclusión"* / *"para concluir"* / *"en definitiva"*
- ❌ *"es importante destacar"* / *"es importante mencionar"* / *"cabe destacar"* / *"cabe resaltar"* / *"es crucial destacar"*
- ❌ *"en el vertiginoso mundo"* / *"en el cambiante mundo"* / *"en un mundo cada vez más"*
- ❌ *"un papel crucial"* / *"juega un papel fundamental"* / *"un rol crucial"*
- ❌ *"a la vanguardia"* / *"revolucionario"* / *"cambio de paradigma"*
- ❌ *"sumergirse en"* / *"adentrémonos en"* / *"en este artículo"* / *"a lo largo de este"*
- ❌ *"sin duda alguna"* / *"no cabe duda"* / *"como hemos visto"*

---

## 7. Pasos Atómicos de Ejecución (Checklist con Doble HITL)
- [ ] **STEP-01 (HITL-1 Spec Review & Approval):** Inspección humana del spec (`sdd-manager.sh preview {{SLUG}}`), refinamiento opcional con `refine-spec` y aprobación formal mediante `bash Academic-Engine/scripts/sdd-manager.sh approve-spec {{SLUG}}`.
- [ ] **STEP-02 (Initial Draft Generation):** Redacción inicial del borrador por `{{PRIMARY_AGENT}}` respetando el outline y las anclas técnicas.
- [ ] **STEP-03 (Evaluator-Optimizer Autonomous Loop):** Bucle Creador vs Revisor hasta calificar con nota $\ge 8.5 / 9.0$ y cero clichés (máximo 5 ciclos).
- [ ] **STEP-04 (HITL-2 Deliverable Review & Approval):** Inspección humana del texto pulido (`sdd-manager.sh review-deliverable {{SLUG}}`), ajustes con `refine-deliverable` y aprobación formal mediante `bash Academic-Engine/scripts/sdd-manager.sh approve-deliverable {{SLUG}}`.
- [ ] **STEP-05 (Vault Integration):** Promoción atómica e idempotente del documento aceptado a `Academic Vault/{{CATEGORY_FOLDER}}/{{FILENAME}}.md`.

---

## 8. Rúbrica de Calificación del Revisor (Escala 0 a 9)
| Dimensión | Puntos Máx | Criterio de Pase |
| :--- | :---: | :--- |
| **1. Cumplimiento del Objetivo & ICP** | 2.5 pts | Alineación directa con el problema del lector objetivo y CTA contundente. |
| **2. Veracidad Técnica & Fuentes** | 2.5 pts | Exactitud en Solana, Metaplex Core y estructura legal Delaware SPV. Cero alucinaciones. |
| **3. Voz Fundadora vs Tono Robot** | 2.0 pts | Convicción auténtica de founder Web3/PropTech; ausencia de prosa corporativa hueca. |
| **4. Originalidad Léxica & Cero Clichés** | 2.0 pts | Cero frases prohibidas de IA y riqueza expresiva. Penalización severa por muletilla detectada. |
| **TOTAL MÁXIMO** | **9.0 pts** | **Nota mínima requerida para pasar a HITL-2: $\ge 8.5 / 9.0$** |
