> Canonical source: Academic-Engine/docs/. The vault 00 System/ references this file.

# Thesis Workflow

## Propósito

Este flujo define cómo usar Codex, MCP y el vault de Obsidian para producir una tesis escolar con alto rigor científico. El objetivo no es solo redactar un documento final, sino construir una base de evidencia verificable, reutilizable y trazable dentro del vault.

La tesis debe apoyarse en:

- búsqueda sistemática de evidencia
- lectura y síntesis crítica de fuentes
- organización estructurada de notas
- redacción académica por secciones
- control explícito de afirmaciones, fuentes y vacíos

## Principios de rigor

- No escribir afirmaciones factuales sin respaldo en fuentes identificables.
- Distinguir entre evidencia confirmada, interpretación y especulación.
- Priorizar revisiones, estudios primarios, metaanálisis y fuentes institucionales confiables.
- Registrar limitaciones, contradicciones y vacíos de la literatura.
- Reutilizar notas del vault antes de volver a investigar desde cero.
- Guardar los hallazgos importantes en el vault; no dejarlos solo en chat.

## Skills a usar

### Investigación científica

Usar `life-science-research` para:

- búsqueda de literatura biomédica y científica
- contexto de genes, variantes, pathways, expresión y datasets
- contraste entre líneas de evidencia

### Redacción académica

Usar `scientific-writing` para:

- estructura de introducción, marco teórico, metodología, resultados y discusión
- redacción formal y coherente
- revisión de claridad, precisión y tono académico

### Hipótesis y diseño experimental

Usar `Academic-Engine/Imported Skills/scientific-hypothesis-generation-9/` para:

- formular hipótesis testables
- proponer explicaciones mecanísticas
- diseñar predicciones y pruebas

## Modalidades de tesis

Antes de redactar, clasificar la tesis en una de estas modalidades:

### 1. Tesis de revisión

Se centra en sintetizar críticamente literatura existente sobre una pregunta concreta.

Entregables principales:

- problema de investigación
- revisión de literatura
- análisis crítico
- conclusiones basadas en evidencia

### 2. Tesis empírica o de proyecto

Incluye además diseño metodológico, recolección o análisis de datos, y resultados propios.

Entregables principales:

- marco teórico
- pregunta e hipótesis
- metodología
- resultados
- discusión y conclusiones

Si no está claro el tipo de tesis, asumir inicialmente un flujo de revisión hasta que el usuario confirme trabajo empírico.

## Estructura mínima del proyecto de tesis

La tesis debe organizarse en cuatro capas:

1. `Sources/`
   Una nota por fuente individual.
2. `Reviews/`
   Síntesis temáticas o preguntas de investigación en `Reviews/<Project Name>/`.
3. `Hypotheses/`
   Hipótesis, mecanismos y propuestas de prueba en `Hypotheses/<Project Name>/`.
4. `Drafts/`
   Borradores de capítulos o secciones de la tesis en `Drafts/<Project Name>/`.

Complementos:

- `Concepts/` para términos, métodos, genes, teorías o definiciones
- `Projects/` para la planificación global de la tesis, siempre mediante una carpeta de proyecto con `PROJECT_INDEX.md`
- `Inbox/` para capturas rápidas y material no procesado

## Flujo maestro

### Fase 1. Definir el encargo

Objetivo: convertir un tema general en una pregunta investigable.

Pasos:

1. Identificar el tema general.
2. Definir nivel académico, extensión esperada y formato requerido por el colegio.
3. Precisar la pregunta central.
4. Definir alcance:
   - población
   - periodo
   - fenómeno
   - disciplina
5. Determinar si la tesis será de revisión o empírica.

Salida mínima:

- una carpeta de proyecto en `Projects/<Project Name>/`
- carpetas canónicas en:
  - `Drafts/<Project Name>/`
  - `Reviews/<Project Name>/`
  - `Hypotheses/<Project Name>/`
- vistas por symlink dentro de `Projects/<Project Name>/` para `Drafts`, `Reviews` y `Hypotheses`
- una nota canónica `PROJECT_INDEX.md`
- una formulación clara de la pregunta
- una lista inicial de subpreguntas
- una referencia a `Sources/SOURCES_INDEX.md`
- una referencia a `MASTER_INDEX.md` y `Projects/PROJECTS_INDEX.md`

## Fase 2. Mapa de investigación

Objetivo: convertir la pregunta en líneas de búsqueda.

Pasos:

1. Descomponer la pregunta en conceptos clave.
2. Identificar palabras clave, sinónimos y términos técnicos.
3. Definir líneas de evidencia necesarias.
4. Listar vacíos de conocimiento que habrá que cubrir.

Ejemplo de líneas:

- contexto biológico o conceptual
- evidencia experimental
- evidencia clínica o aplicada
- controversias o límites metodológicos

Salida mínima:

- una nota de revisión inicial en `Reviews/`
- una lista de temas a investigar

## Fase 3. Ingesta de literatura

Objetivo: construir una base sólida de fuentes.

Pasos:

1. Buscar literatura con `life-science-research`.
2. Priorizar primero revisiones y estudios clave.
3. Crear una nota `source` por cada fuente relevante.
4. Guardar en cada nota:
   - metadatos
   - hallazgo principal
   - método
   - limitaciones
   - relevancia para la tesis
5. Actualizar `Sources/SOURCES_INDEX.md` para cada fuente convertida.
6. Enlazar cada fuente con las preguntas o capítulos relevantes.
7. Solo agregar la tesis en la columna `Projects` del índice cuando el usuario apruebe explícitamente la inclusión de esa fuente.

Regla:

- ninguna fuente importante debe quedar solo mencionada en chat

## Fase 4. Síntesis temática

Objetivo: pasar de fuentes aisladas a conocimiento organizado.

Pasos:

1. Agrupar fuentes por tema o subpregunta.
2. Identificar consensos, contradicciones y vacíos.
3. Redactar una nota `review` por tema.
4. Separar claramente:
   - qué se sabe
   - qué no se sabe
   - qué está en debate

Usar `scientific-writing` para convertir notas dispersas en prosa académica útil.

## Fase 5. Hipótesis o tesis argumental

Objetivo: formular la postura intelectual de la tesis.

Si la tesis es empírica:

1. Formular hipótesis explícitas.
2. Definir variables o entidades relevantes.
3. Especificar predicciones.
4. Diseñar la lógica de prueba.

Si la tesis es de revisión:

1. Formular una tesis argumental central.
2. Definir qué postura defenderá el documento.
3. Identificar qué evidencia la sostiene y qué la limita.

Usar `scientific-hypothesis-generation-9` cuando la tesis requiera mecanismos, hipótesis rivales o diseño de pruebas.

## Fase 6. Arquitectura del documento

Objetivo: estructurar la tesis antes de redactar capítulos completos.

Crear un esquema maestro con:

- título provisional
- pregunta central
- objetivo general
- objetivos específicos
- capítulos o secciones
- evidencia que alimenta cada sección

Estructura recomendada:

1. Título
2. Resumen
3. Introducción
4. Planteamiento del problema
5. Objetivos
6. Marco teórico o revisión de literatura
7. Metodología
8. Resultados o desarrollo analítico
9. Discusión
10. Conclusiones
11. Referencias

Para tesis escolares más simples, algunas secciones pueden combinarse, pero la lógica argumental debe mantenerse.

## Fase 7. Redacción por secciones

Objetivo: redactar con trazabilidad, no improvisar el documento final de una sola vez.

Regla principal:

- cada sección debe surgir de notas previas del vault

Proceso por sección:

1. Reunir notas `source`, `review`, `concept` y `hypothesis` relacionadas.
2. Crear o actualizar un `draft` de la sección.
3. Redactar primero un esquema breve.
4. Convertir el esquema en párrafos completos con `scientific-writing`.
5. Verificar que cada afirmación importante tenga respaldo.
6. Registrar preguntas abiertas o partes débiles.

## Fase 8. Control de citas y afirmaciones

Objetivo: evitar una tesis elegante pero débil.

Checklist de verificación:

- cada afirmación fuerte tiene fuente
- cada cifra tiene fuente
- cada comparación importante tiene respaldo
- las fuentes contradictorias se reconocen
- las limitaciones metodológicas se explicitan

## Fase 9. Exportación y entrega

Objetivo: producir una versión entregable sin romper la trazabilidad del vault.

Pasos:

1. Reunir las secciones finales en `Drafts/`.
2. Crear o actualizar `Projects/<Project Name>/EXPORT_MANIFEST.md`.
3. Mantener `document_status: draft` hasta aprobación explícita del usuario.
4. Usar `@export-document` para exportar a `PDF` y `DOCX`.
5. Aplicar `APA` por defecto o cambiar el estilo en el manifiesto si el colegio exige otro.
6. Si una plantilla LaTeX institucional requiere adaptación, usar `latex-paper-conversion` solo como skill auxiliar de plantilla.

Salida mínima:

- un `PDF` de borrador
- un `DOCX` de borrador
- una carpeta `Exports/` dentro del proyecto
- no se presentan inferencias como hechos comprobados

Si una afirmación no puede sostenerse, debe:

- debilitarse
- precisarse
- o eliminarse

## Fase 9. Revisión científica y editorial

Objetivo: mejorar calidad intelectual y claridad.

Revisar cada capítulo en dos capas:

### Revisión científica

- coherencia entre pregunta, evidencia y conclusión
- uso correcto de conceptos
- suficiencia de evidencia
- tratamiento honesto de incertidumbre

### Revisión editorial

- claridad de párrafos
- transición entre secciones
- precisión del lenguaje
- redundancias
- consistencia terminológica

Usar `scientific-writing` para revisión fina del estilo.

## Fase 10. Ensamblaje final

Objetivo: consolidar una sola versión coherente.

Pasos:

1. Integrar capítulos revisados.
2. Unificar tono, términos y formato.
3. Revisar resumen, introducción y conclusiones al final.
4. Validar que las conclusiones respondan realmente a la pregunta central.
5. Confirmar que la bibliografía refleje las fuentes usadas.

## Tipos de notas recomendadas para tesis

### Nota de proyecto

Debe contener:

- tema
- pregunta central
- objetivos
- estado actual
- próximos pasos

### Nota de fuente

Debe contener:

- referencia completa
- resumen breve
- hallazgo útil para la tesis
- limitaciones
- etiquetas temáticas

### Nota de revisión

Debe contener:

- pregunta temática
- síntesis de evidencias
- debates
- vacíos
- enlaces a fuentes

### Nota de borrador

Debe contener:

- sección o capítulo
- versión
- estado
- texto redactado
- dudas pendientes

## Reglas de uso de MCP

- Leer primero el vault antes de abrir una línea de investigación ya existente.
- Guardar resultados intermedios importantes, no solo el texto final.
- Actualizar notas existentes cuando el tema ya está cubierto.
- Crear nuevas notas cuando aparezca una unidad intelectual distinta.
- Mantener nombres de archivos estables y comprensibles.

## Criterios de éxito

La tesis va bien encaminada si:

- la pregunta es específica y defendible
- las fuentes están organizadas y enlazadas
- las notas de revisión ya contienen síntesis reales, no solo citas sueltas
- cada capítulo se apoya en notas previas del vault
- las conclusiones salen de la evidencia y no de intuiciones

## Regla operativa final

Codex debe tratar la tesis como un sistema acumulativo de conocimiento. Primero se construye evidencia organizada en el vault. Después se redacta la tesis a partir de esa base. No al revés.
