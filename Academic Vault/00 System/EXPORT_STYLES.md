# Export Styles

## Propósito

Este documento explica cómo manejar estilos de citación y formatos de exportación sin alterar el contenido base del vault.

## Regla principal

- el contenido fuente en Markdown debe permanecer neutral
- el estilo se aplica en la exportación, no en la redacción base

## Estilo actual por defecto

- `APA`
- archivo CSL local: `Academic-Engine/export/styles/apa.csl`

## Cómo cambiar de estilo

Opciones:

1. cambiar `citation_style` en el manifiesto a otro nombre de CSL disponible
2. apuntar `citation_style` a un archivo `.csl` específico

## Ejemplos

### Usar APA

```yaml
citation_style: apa
```

### Usar un CSL externo o personalizado

```yaml
citation_style: /absolute/path/to/custom-style.csl
```

## Recomendación

- usar `APA` mientras el colegio no exija otro formato
- si luego exigen otro estilo, cambiar el manifiesto y volver a exportar
