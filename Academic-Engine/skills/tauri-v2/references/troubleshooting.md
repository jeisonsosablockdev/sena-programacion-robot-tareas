# Tauri v2 Troubleshooting & Platform Matrix

### Troubleshooting

#### White Screen on Launch

Symptoms: App launches but shows blank white screen

Solution:

- Verify `devUrl` matches your frontend dev server port

- Check `beforeDevCommand` runs your dev server

- Open DevTools (Cmd+Option+I / Ctrl+Shift+I) to check for errors

#### Command Returns Undefined

Symptoms: `invoke()` returns undefined instead of expected value

Solution:

- Verify command is in `generate_handler![]`

- Check Rust command actually returns a value

- Ensure argument names match (camelCase in JS, snake_case in Rust by default)

#### Mobile Build Failures

Symptoms: Android/iOS build fails with missing target

Solution:

```rust
# Android targets
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android

# iOS targets (macOS only)
rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim

```

#### Desktop vs Mobile Behavioral Differences

Not all Tauri APIs and plugins support mobile (iOS/Android). Before using any plugin or API in a mobile build:

- Check the plugin page at `v2.tauri.app/plugin/<name>/` for platform support matrix

- Common desktop-only items: System tray (`TrayIconBuilder`), window labels/multi-window, some shell plugin features

- Mobile-safe patterns: IPC commands/events/channels work on all platforms; `tauri::AppHandle` is mobile-safe

- Conditional compilation: Use `#[cfg(desktop)]` / `#[cfg(mobile)]` for platform-specific Rust logic

```rust
#[tauri::command]
fn platform_info() -> String {
    #[cfg(desktop)]
    return "desktop".to_string();
    #[cfg(mobile)]
    return "mobile".to_string();
}

```
