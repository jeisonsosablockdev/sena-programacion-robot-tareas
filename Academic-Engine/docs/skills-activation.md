# Skills Activation

This project keeps the source of truth for skills inside the repository.

## Source Paths

- Local adapted skills: `Academic-Engine/skills/`

## Activation for Codex

Codex discovers skills from `~/.codex/skills/`. To make the project skills available there without moving the source files, run:

```bash
bash Academic-Engine/scripts/enable-project-skills.sh
```

On Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\\Academic-Engine\\scripts\\enable-project-skills.ps1
```

## Modes

Safe mode:

```bash
bash Academic-Engine/scripts/enable-project-skills.sh
```

- links project-local skills that do not already exist in `~/.codex/skills`
- does not replace existing entries

Windows safe mode:

```powershell
powershell -ExecutionPolicy Bypass -File .\\Academic-Engine\\scripts\\enable-project-skills.ps1
```

Force mode:

```bash
bash Academic-Engine/scripts/enable-project-skills.sh --force
```

- replaces existing entries in `~/.codex/skills` with the project versions

Windows force mode:

```powershell
powershell -ExecutionPolicy Bypass -File .\\Academic-Engine\\scripts\\enable-project-skills.ps1 --force
```

## Important Note

- The skills still live in this project
- macOS/Linux use symlinks
- Windows tries symlinks first and falls back to copying if symlinks are blocked
- if you edit a linked skill here, Codex will see the updated file through the symlink

## Brand Context in the Vault

On macOS/Linux, the brand context can be exposed in the vault as a symlink.

On Windows, if symlinks are inconvenient, copy it into the vault with:

```powershell
powershell -ExecutionPolicy Bypass -File .\\Academic-Engine\\scripts\\sync-brand-context.ps1
```

On macOS/Linux:

```bash
bash Academic-Engine/scripts/sync-brand-context.sh
```
