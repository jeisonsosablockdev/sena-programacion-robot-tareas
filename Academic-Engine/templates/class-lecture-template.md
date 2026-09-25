---
type: source
kind: video
title: "{{titulo_clase}}"
authors: ["{{autor_instructor_1}}", "{{autor_instructor_2}}"]
year: {{año}}
date_ingested: {{fecha_ingesta}}
session_date: {{fecha_sesion}}
duration: "{{duracion_hh_mm_ss}}"
source_url: "{{url_google_drive}}"
drive_file_id: "{{id_google_drive}}"
program: "Análisis y Desarrollo de Software (ADSO) / Programas de Sistemas"
status: completed
version: "1.0"
workflow: video-ingest
tags:
  - sena
  - formacion-virtual
  - {{etiqueta_modulo}}
---

# {{titulo_clase}}

> [!NOTE] Resumen Ejecutivo
> {{resumen_ejecutivo_sintesis_de_la_sesion}}

> [!IMPORTANT] REGLA DE ARQUITECTURA: ORDEN ESTRICTO OBLIGATORIO
> **ORDEN MANDATORIO DEL DOCUMENTO:**
> Para maximizar la productividad y claridad del aprendiz desde el primer segundo:
> 1. **Resumen Ejecutivo / Introducción** (`> [!NOTE]`)
> 2. **## 1. Plan de Acción y Tareas Pendientes para los Aprendices** (Acciones prioritarias y checklist inmediato)
> 3. **## 2. Contexto y Equipo Ejecutor de Formación** (o Información General de la Sesión)
> 4. **## 3. Estructura y Desarrollo Temático / Metodología**
> 5. **## 4. Sistema Institucional de Calificación y Criterios de Evaluación**
> 6. **## 5. Ecosistema de Plataformas Digitales / Herramientas Utilizadas**
> 7. **## 6. Canales de Comunicación y Normas de Convivencia**
> 8. **## 7. Cronograma de Sesión y Marcas de Tiempo (Timestamps)**
> 9. **## 8. Recursos y Transcripción Completa** (Enlace a transcripción íntegra)
> 10. **## 9. Historial de Revisiones (Changelog)**
>
> ⛔ **PROHIBIDO:** Colocar el Plan de Acción al final de la nota o después del desarrollo teórico. El estudiante debe identificar qué tiene que hacer al abrir el documento sin necesidad de desplazarse hacia abajo.

---

## 1. Plan de Acción y Tareas Pendientes para los Aprendices

> [!IMPORTANT] Acciones Prioritarias Inmediatas
> Tareas obligatorias derivadas de la sesión para desarrollar y verificar en plataforma dentro de los plazos establecidos:

- [ ] **Acceso y Perfil:** {{tarea_1_ejemplo_ingresar_a_plataforma_y_actualizar_datos}}
- [ ] **Sincronización de Datos:** {{tarea_2_ejemplo_verificar_datos_personales_sofia_plus}}
- [ ] **Participación en Foros:** {{tarea_3_ejemplo_participacion_foro_social_o_tematico}}
- [ ] **Guía de Aprendizaje:** {{tarea_4_ejemplo_descargar_guia_y_cronograma}}
- [ ] **Evidencias Asignadas:** {{tarea_5_ejemplo_preparar_y_cargar_evidencias}}
- [ ] **Próxima Sesión:** {{tarea_6_ejemplo_asistir_a_sesion_sincronica}}

---

## 2. Contexto y Equipo Ejecutor de Formación

* **Programa Formativo:** {{programa_formativo}}
* **Fecha de Sesión Sincrónica:** {{fecha_sesion}}
* **Duración de la Grabación:** {{duracion_sesion}}
* **Instructores Líderes de la Sesión:**
  * **{{nombre_instructor_1}}:** {{rol_y_especialidad}} ([[Profesores/{{slug_instructor_1}}|Ver Ficha de Instructor(a)]])
  * **{{nombre_instructor_2}}:** {{rol_y_especialidad}} ([[Profesores/{{slug_instructor_2}}|Ver Ficha de Instructor(a)]])
* **Dinámica Interdisciplinaria:**
  * {{descripcion_del_equipo_docente_y_competencias_transversales}}

---

## 3. Estructura y Metodología del Proceso Formativo SENA

{{descripcion_etapa_lectiva_productiva_o_metodologia_del_modulo}}

1. **Etapa Lectiva:**
   * {{puntos_clave_etapa_lectiva}}
2. **Etapa Productiva:**
   * {{puntos_clave_etapa_productiva}}

---

## 4. Sistema Institucional de Calificación y Criterios de Evaluación

| Calificación | Denominación | Criterio de Cumplimiento | Implicación Pedagógica |
|---|---|---|---|
| **A** | **Aprobado** | Puntuación $\ge 70\%$ | El aprendiz alcanzó satisfactoriamente el Resultado de Aprendizaje (RAP). |
| **D** | **No Aprobado / Deficiente** | Puntuación $< 70\%$ | La evidencia debe ser corregida según retroalimentación del instructor. |

### Reglas Clave de Evaluación y Deserción:
* **Planes de Mejoramiento y Reintentos:** {{normativa_planes_mejoramiento}}
* **Causales de Deserción:**
  > [!WARNING] Alerta de Deserción
  > {{advertencia_deserción_por_incumplimiento}}

---

## 5. Ecosistema de Plataformas Digitales

### 5.1. Plataforma LMS Oficial (Zajuna)
* **Acceso y Navegación:** {{instrucciones_acceso_zajuna}}
* **Espacios Clave:**
  * **Contenido del Curso:** {{ubicacion_guias_material}}
  * **Espacio de Evidencias:** {{enlace_carga_evidencias}}
  * **Foros Institucionales:** {{foros_habilitados}}
  * **Grabaciones en Línea:** {{ubicacion_grabaciones}}

### 5.2. Sistema Administrativo (Sofia Plus)
* **Funciones:** {{funciones_sofia_plus}}

---

## 6. Canales de Comunicación y Normas de Convivencia

* **Canal Oficial:** Correo electrónico institucional y mensajería/foros de la plataforma Zajuna.
* **Canales No Oficiales:** No se reciben evidencias por canales de mensajería instantánea no institucionales.
* **Netiqueta:** Puntualidad, respeto y participación constructiva en sesiones sincrónicas y foros.

---

## 7. Cronograma de Sesión y Marcas de Tiempo (Timestamps)

| Marca de Tiempo | Duración | Tema / Bloque Abordado | Participantes Clave |
|---|---|---|---|
| `00:00:00` | {{duracion_bloque}} | {{tema_bloque_inicial}} | {{participantes}} |
| `{{timestamp_bloque_2}}` | {{duracion_bloque}} | {{tema_bloque_2}} | {{participantes}} |
| `{{timestamp_bloque_3}}` | {{duracion_bloque}} | {{tema_bloque_3}} | {{participantes}} |

---

## 8. Recursos y Transcripción Completa

* 📄 **Transcripción Íntegra:** [[{{slug_clase}}-transcripcion|Ver Transcripción Completa con Marcas de Tiempo]]
* 📄 **Texto Plano:** `{{slug_clase}}_transcripcion_raw.txt`
* 👥 **Equipo Docente:** [[Profesores/00. PROFESORES_INDEX|Directorio de Profesores SENA ADSO]]

---

## 9. Historial de Revisiones

| Versión | Fecha | Autor | Cambios Realizados |
|---|---|---|---|
| `v1.0` | {{fecha_creacion}} | {{autor_o_agente}} | Creación de la nota técnica a partir de transcripción Whisper GPU. Cumplimiento de regla de arquitectura: Plan de acción obligatorio como sección 1. |
