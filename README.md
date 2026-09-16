# Xythol Mail

Xythol Mail is a small desktop email workspace for doing research without constantly jumping between a browser and an email app.

The project is being rebuilt around Rust + Tauri 2. The old Electron application path has been removed. The goal is a fast desktop shell, a clear mail UI, Supabase for the account/data layer, and Rust for operations such as SMTP sending.

## What the current build does

The app starts on a mail-first screen.

It has an inbox area, a detailed compose screen, a research desk, contacts/settings placeholders, an anonymous Xythol identity flow, a setup wizard, a button to open the normal Chrome application, and a dedicated Xythol research browser window.

The UI intentionally does not manufacture fake messages. Mail folders remain empty until a real mailbox synchronization layer exists.

SMTP sending is implemented in Rust with lettre. The frontend passes the request to a Tauri command; Rust validates recipients, builds the message and talks to the SMTP server.

## Why Tauri

The first version used Electron. It worked as a prototype, but the browser/app boundary became too easy to blur and the desktop runtime was heavier than I wanted.

This rebuild uses Tauri 2. On Windows, Tauri uses the WebView2 runtime that is already part of the Windows ecosystem instead of shipping a second complete Chromium runtime.

A web page can still use plenty of memory. The point is to keep the Xythol desktop shell itself small.

## Anonymous Xythol accounts

A user chooses a name such as Night Owl.

Supabase Anonymous Sign-Ins create the authenticated user. Xythol then stores the chosen display name, normalized username and an identity label such as night-owl@xythol.

That label belongs to Xythol. It is not a public internet email mailbox.

The anonymous identity migration uses unique indexes so two users cannot silently take the same normalized identity.

Anonymous Supabase accounts do not behave like normal password accounts. Clearing app data or moving to another device can make an anonymous identity unrecoverable unless it is later linked to a permanent authentication method.

## Supabase

Create a Supabase project and put these values in .env.local:

    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

Enable Anonymous Sign-Ins in Supabase Authentication.

Apply these migrations:

    supabase/migrations/202609150001_initial_schema.sql
    supabase/migrations/202609150002_anonymous_identities.sql
    supabase/migrations/202609160001_tauri_mail_core.sql

Do not put a Supabase service-role key in the desktop application.

## Email sending

Compose has an explicit SMTP section.

The current send path supports SMTP host, port, username, password, From address, STARTTLS and TLS.

The password is passed to the Rust command for the send and is not stored in Supabase by this build.

Gmail and Outlook OAuth are not faked. Their adapters need real provider application registration, redirects and permissions.

## Research

Research is meant to sit next to the email workflow.

The current build provides a research desk and can open a dedicated Tauri webview window for research.

The Open Chrome button launches the normal Chrome application when Xythol can find it on Windows.

## Build locally

You need Node.js 22+, Rust stable, the Tauri prerequisites for your operating system, and WebView2 on Windows.

Run:

    npm install
    npm run typecheck
    npm run build
    npm test
    npm run tauri:dev

Create a Windows installer with:

    npm run tauri:build

## GitHub Actions

The desktop build workflow is .github/workflows/tauri.yml.

It installs Node and Rust, typechecks the frontend, builds the frontend, runs tests, generates Tauri icons, builds the Windows NSIS installer, and uploads that installer as an Actions artifact.

It does not automatically create a GitHub release. The first Tauri installer should be tested before making another public release.

## Project layout

    xythol-mail/
    ├─ src/
    │  ├─ main.ts
    │  ├─ styles.css
    │  └─ vite-env.d.ts
    ├─ src-tauri/
    │  ├─ Cargo.toml
    │  ├─ build.rs
    │  ├─ tauri.conf.json
    │  ├─ src/
    │  │  ├─ lib.rs
    │  │  └─ main.rs
    │  └─ icons/
    ├─ public/
    │  └─ assets/
    ├─ supabase/
    │  └─ migrations/
    └─ tests/

## Development notes

This rebuild keeps the frontend deliberately small instead of starting with a huge UI framework.

The research browser is a separate Tauri window, so a web page does not replace the mail application's main window.

The project also avoids impossible security claims. It is not advertised as unhackable, anonymous internet browsing, or private from websites.

## License

No license has been selected yet.
