# Tauri v2 Dependencies & Official Plugins

### Dependencies

#### Required

| Package | Version | Purpose 
| `@tauri-apps/cli` | ^2 (v2+) | CLI tooling 
| `@tauri-apps/api` | ^2 (v2+) | Frontend APIs 
| `tauri` | ^2 (v2+) | Rust core 
| `tauri-build` | ^2 (v2+) | Build scripts 

*Last verified: 2026-04-02. Always check [official changelog](https://github.com/tauri-apps/tauri/blob/dev/crates/tauri/CHANGELOG.md) for feature timing.

#### Optional (Plugins)

| Package | Version | Purpose | Key Permission 
| `tauri-plugin-fs` | ^2 (v2+) | File system access | `fs:default` 
| `tauri-plugin-dialog` | ^2 (v2+) | Native dialogs | `dialog:default` 
| `tauri-plugin-shell` | ^2 (v2+) | Shell commands, open URLs | `shell:default` 
| `tauri-plugin-http` | ^2 (v2+) | HTTP client | `http:default` 
| `tauri-plugin-store` | ^2 (v2+) | Key-value storage | `store:default` 

Plugin permissions are mandatory. Installing a plugin without adding its permission string to a capability file causes silent runtime failures. See [`references/plugin-reference.md`](references/plugin-reference.md) for full install + permission details for all official plugins.
