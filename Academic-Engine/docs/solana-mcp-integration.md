# ⚡ Integración de Solana Developer MCP (mcp.solana.com)

*Guía Oficial de Integración y Protocolo de Uso del Servidor MCP de Solana*  
*Endpoint Canónico:* `https://mcp.solana.com/mcp`  
*Last updated: 2026-09-12*

---

## 📌 1. Visión General

El servidor **Solana Developer MCP** (`mcp.solana.com`) es la fuente oficial y canónica de conocimiento técnico en tiempo real para el ecosistema Solana. En **BRIDS KNOWLEDGE FORT**, este servidor está configurado nativamente y operativo para ser consumido por los subagentes autónomos y los desarrolladores del equipo.

Permite evitar la obsolescencia técnica (drift) en especificaciones críticas de BRIDS:
* **Metaplex Core:** Plugins de congelamiento (`PermanentFreezeExecute`, `FreezeDelegate`) y rescate/recuperación (`Owner` vs `Authority`).
* **Solana Kit (TypeScript SDK):** Migración de `@solana/web3.js` legacy a `@solana/kit` v7 y clientes Codama.
* **Programas en Rust / Anchor / Pinocchio:** Reglas de optimización de Compute Units (CU) y validación estática de cuentas.
* **Squads Multi-Sig & Tesorería:** Contratos de gobernanza institucional.

---

## 🛠️ 2. Herramientas Disponibles

| Nombre de la Herramienta | Propósito y Cuándo Invocarla |
| :--- | :--- |
| `list_sections` | Lista el catálogo completo de fuentes oficiales agrupadas por 21 áreas taxonómicas (*core, programs, frameworks, clients, tokens, nft, defi, etc.*). Invocable sin parámetros para descubrir documentación disponible. |
| `get_documentation` | Extrae la documentación técnica canónica completa para uno o varios identificadores de fuentes (e.g. `anchor-docs`, `solana-kit-docs`, `gh-mpl-core`). |
| `Solana_Documentation_Search` | Búsqueda semántica RAG de alta precisión. Ideal para consultas puntuales (e.g. *"Metaplex Core plugins freeze and recovery"* o *"How to derive PDA with Anchor"*). |
| `Solana_Expert__Ask_For_Help` | Asistente de depuración técnica especializado en resolver errores on-chain, transacciones fallidas y dudas de arquitectura. |
| `program_autofixer` | Auditor y corrector estático de seguridad para código Rust de Solana (Anchor y Pinocchio). Detecta vulnerabilidades y optimizaciones antes de desplegar. |

---

## 📜 3. Protocolo Mandatorio para Subagentes de BRIDS

Para garantizar que todos los entregables técnicos y de negocio mantengan rigor criptográfico:
1. **Verificación Canónica Previa:** Los subagentes (`compliance-officer`, `pitch-deck-architect`, `business-consultant`) deben contrastar cualquier afirmación técnica de Solana (estándares NFT, fees, plugins de Metaplex Core) contra `Solana_Documentation_Search` o `get_documentation`.
2. **Generación de Código Rust:** Si se redacta o modifica código de contratos inteligentes en Solana, es obligatorio pasar el código por `program_autofixer` antes de dar por completada la tarea.

---

## 💻 4. Configuración para Clientes Externos

Si miembros del equipo desean conectar sus IDEs o terminales locales al mismo MCP:

### Claude Code
```bash
claude mcp add --transport http solana-mcp https://mcp.solana.com/mcp
```

### Cursor (`~/.cursor/mcp.json` o `.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "solana-mcp": {
      "url": "https://mcp.solana.com/mcp"
    }
  }
}
```

### Windsurf (`~/.codeium/windsurf/mcp_config.json`)
```json
{
  "mcpServers": {
    "solana-mcp": {
      "serverUrl": "https://mcp.solana.com/mcp"
    }
  }
}
```

### VS Code (`.vscode/mcp.json`)
```json
{
  "servers": {
    "solana-mcp": {
      "url": "https://mcp.solana.com/mcp"
    }
  }
}
```
