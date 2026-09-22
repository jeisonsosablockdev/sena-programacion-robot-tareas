# Manual Oficial de Workflows de Marketing y Harness Operativo

Este documento contiene la especificación completa del sistema de marketing para **BRIDS.io**. Establece la taxonomía, los 8 workflows principales, la orquestación de las skills de `Academic-Engine`, el ciclo de vida de tareas en 5 pasos y el protocolo de persistencia en **Academic Vault** mediante Obsidian Local REST API.

---

## 1. Arquitectura del Sistema

```
BRIDS KNOWLEDGE FORT/
├── AGENTS.md                          # Reglas globales de gobernanza y no contaminación
├── README.md                          # Visión general del proyecto
├── Academic-Engine/                      # FUENTE DE VERDAD DE LÓGICA Y HABILIDADES
│   ├── agents/                        # Definición de agentes especializados de negocio y YC
│   ├── context/                       # Contexto central (product-marketing-context.md)
│   ├── docs/                          # Documentación operativa y manual de workflows
│   ├── skills/                        # Skills locales adaptadas para el proyecto
│   ├── templates/                     # Plantillas JSON de tracking y Markdown
│   └── scripts/                       # Scripts de activación, sync y healthcheck
└── Academic Vault/                       # VAULT PERSISTENTE DE OBSIDIAN (CONTENIDO)
    ├── .obsidian/                     # Configuración de Obsidian
    ├── 00 System/                     # Workflows, plantillas y gobernanza
    ├── Concepts/                      # Notas conceptuales y bases teóricas
    ├── Drafts/                        # Secciones de manuscritos, posts y borradores
    ├── Exports/                       # Salidas compiladas (PDF, DOCX)
    ├── Hypotheses/                    # Reivindicaciones y diseño experimental
    ├── Inbox/                         # Capturas crudas, sesiones de tareas y specs
    ├── Projects/                      # Manifiestos de proyectos e índices
    ├── Reviews/                       # Síntesis temáticas y auditorías de calidad
    └── Sources/                       # Fuentes de investigación y bibliografía
```

---

## 2. El Ciclo de Vida Estandarizado de la Tarea (5-Step Harness)

Toda tarea ejecutada en este sistema sigue este flujo:

1. **Captura de la Intención (Intent Capture):**
   * Extraer objetivo comercial, perfil de cliente (ICP) y restricciones.
   * Validar si `product-marketing-context.md` cuenta con los datos de marca necesarios.
2. **Descomposición Atómica (Task Decomposition):**
   * Desglosar la meta en subtareas secuenciales (`TASK-001`, `TASK-002`, etc.) con dependencias explícitas.
3. **Mapeo y Encadenamiento de Workflows (Workflow Chaining):**
   * Asignar a cada subtarea el workflow (W1 a W8) y las skills de `Academic-Engine/skills/`.
   * Encadenar outputs de tareas previas como inputs de la siguiente.
4. **Ejecución y Persistencia en Vault (Execution & Vault Save):**
   * Generar el entregable en Markdown con el formato estándar (`note-template.md`).
   * Guardar en la carpeta numérica correspondiente en `Academic Vault/` usando la Local REST API o el sistema de archivos.
5. **Medición y Retroalimentación (Analytics & Closure):**
   * Asociar eventos de tracking y registrar el estado de completado en el JSON de seguimiento.

---

## 3. Catálogo de los 8 Workflows de Marketing

| Workflow | Nombre | Skills Clave | Carpeta Destino | Entregables Típicos |
| :--- | :--- | :--- | :--- | :--- |
| **W1** | **Estrategia y Posicionamiento de Marca** | `mas-product-marketing-context`, `mas-customer-research`, `mas-pricing-strategy` | `01 Brand Context`, `02 Strategy & Research` | `product-marketing-context.md`, `brand-positioning-framework.md` |
| **W2** | **Landing Pages y Copywriting** | `mas-copywriting`, `mas-copy-editing`, `mas-page-cro`, `mas-marketing-psychology` | `03 Website & Copy`, `06 CRO & Funnel` | `homepage-copy-v1.md`, `landing-lead-magnet.md` |
| **W3** | **Descubrimiento Orgánico y AI SEO** | `mas-seo-audit`, `mas-ai-seo`, `mas-competitor-alternatives`, `mas-schema-markup` | `05 SEO & Discoverability` | `ai-seo-strategy.md`, `competitor-comparison.md` |
| **W4** | **Email Lifecycle y Prospección** | `mas-cold-email`, `mas-email-sequence`, `mas-copy-editing` | `04 Email & Lifecycle` | `cold-outreach-sequence.md`, `welcome-nurture-flow.md` |
| **W5** | **Contenidos y Redes Sociales** | `mas-content-strategy`, `mas-social-content`, `mas-lead-magnets`, `mas-community-marketing` | `07 Paid, Social & Community`, `02 Strategy & Research` | `linkedin-editorial-calendar.md`, `lead-magnet-guide.md` |
| **W6** | **CRO y Experimentos A/B** | `mas-signup-flow-cro`, `mas-onboarding-cro`, `mas-paywall-upgrade-cro`, `mas-ab-test-setup` | `06 CRO & Funnel` | `ab-test-plan-signup.md`, `paywall-cro-audit.md` |
| **W7** | **Habilitación de Ventas y Retención** | `mas-sales-enablement`, `mas-churn-prevention`, `mas-referral-program`, `mas-revops` | `10 RevOps & Sales`, `09 Retention & Growth` | `sales-battlecard.md`, `churn-mitigation-playbook.md` |
| **W8** | **Analítica y Medición de Impacto** | `mas-analytics-tracking`, `mas-ab-test-setup`, `mas-revops` | `08 Analytics & Measurement` | `ga4-tracking-plan.md`, `marketing-performance-scorecard.md` |

---

## 4. Scripts y Utilidades Operativas

* **Gestor Integral del Ciclo de Vida de Tareas (`task-manager.sh`):**
  ```bash
  # 1. Inicializar sesión de tarea
  bash Academic-Engine/scripts/task-manager.sh init <session-id> "<objetivo>" "<icp>" [restricciones]

  # 2. Agregar subtarea atómica con dependencias y destino
  bash Academic-Engine/scripts/task-manager.sh add <session-id> "<titulo>" <workflow> "<skills>" "<output-path>" [depends_on]

  # 3. Consultar dashboard de progreso de la sesión
  bash Academic-Engine/scripts/task-manager.sh show <session-id>

  # 4. Actualizar estado de una subtarea (pending, in_progress, completed, blocked)
  bash Academic-Engine/scripts/task-manager.sh update <session-id> <task-id> completed "Resumen de lo generado"

  # 5. Listar todas las sesiones activas en Inbox/
  bash Academic-Engine/scripts/task-manager.sh list

  # 6. Finalizar y cerrar la sesión de tarea
  bash Academic-Engine/scripts/task-manager.sh close <session-id> "Notas de cierre"
  ```

* **Verificar Local REST API:**
  ```bash
  bash Academic-Engine/scripts/check-obsidian-api.sh
  ```
* **Sincronizar Contexto de Marca:**
  ```bash
  bash Academic-Engine/scripts/sync-brand-context.sh
  ```
* **Activar Skills en el Runtime del Agente:**
  ```bash
  bash Academic-Engine/scripts/enable-project-skills.sh
  ```

