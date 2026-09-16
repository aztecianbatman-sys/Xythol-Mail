<p align="center">
  <img src="public/assets/branding/xythol-mail-logo.svg" alt="Xythol Mail" width="760">
</p>

# Xythol Mail

Xythol Mail is a small desktop email workspace built around research, writing and speed.

This repository is the clean restart of the app. The desktop runtime is now **Tauri 2 + Rust** instead of Electron. The frontend is a lightweight Vite + TypeScript app, Supabase handles the anonymous identity and cloud data layer, and Rust handles desktop work such as SMTP delivery.

## The idea

I wanted email and research to live next to each other without building a giant browser inside the mail app.

The main screen is the mail workspace. From there you can write an email, jump into the Xythol research browser, open the normal Chrome app, or run the setup wizard.

The UI is intentionally simple. There are no fake inbox messages and no fake provider connections.

## What is implemented

### Mail

- Mail-first inbox screen
- Detailed compose view
- Recipient and subject fields
- Plain text email body
- Local draft saving
- SMTP delivery through the Rust backend
- STARTTLS and TLS options
- Contacts/settings workspace shells
- Research-first layout and navigation

### Anonymous Xythol identity

A new user can choose a name such as:

\`Night Owl\`

Xythol turns that into an internal identity label such as:

\`night-owl@xythol\`

The account itself is created through Supabase Anonymous Sign-Ins. The chosen name, normalized username and identity label are stored in the protected \`profiles\` table.

The \`@xythol\` address is an identity label inside Xythol, not a public mailbox on the internet.

One important limitation comes with anonymous accounts: they do not have normal password recovery. If local app data is removed or the user moves to another device without linking a permanent authentication method, the anonymous account may not be recoverable.

## Research

Research is a first-class part of the desktop workflow.

The current build has a research desk and a separate Tauri webview window for research pages. There is also an **Open Chrome** action for people who simply want their normal Chrome window.

The separate research window is deliberate. A website should not be able to replace or take over the main mail application window.

## Email delivery

The compose screen sends through a Tauri command.

The frontend sends the message details to Rust. Rust validates the email fields, constructs the message with \`lettre\`, and connects to the configured SMTP server.

Supported settings in this build:

- SMTP host
- SMTP port
- username
- password
- From address
- STARTTLS
- TLS

The SMTP password is not written to Supabase by this code.

Gmail and Outlook OAuth are not pretending to be implemented here. Those require actual provider application registration, redirects, tokens and provider-specific flows.

## Supabase setup

Create a Supabase project and put the following in \`.env.local\`:

\`\`\`text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
\`\`\`

Enable **Anonymous Sign-Ins** in Supabase Authentication.

Apply the migrations in this order:

\`\`\`text
supabase/migrations/202609150001_initial_schema.sql
supabase/migrations/202609150002_anonymous_identities.sql
supabase/migrations/202609160001_tauri_mail_core.sql
\`\`\`

Do not put a Supabase service-role key into the desktop app.

## Why Tauri

The previous implementation used Electron.

For this restart I wanted a smaller desktop runtime and a cleaner boundary between the web UI and native desktop capabilities.

Tauri gives the project:

- Rust for native commands
- WebView2 on Windows
- A small frontend bundle
- Native installer generation
- A clear command boundary for privileged operations

The project does not claim that Tauri makes websites lightweight or browsing anonymous. It simply gives Xythol a lighter desktop architecture.

## Building locally

### Requirements

- Windows 10/11 for the Windows build
- Node.js 22+
- Rust stable
- WebView2
- Tauri 2 prerequisites for your platform

### Install

\`\`\`bash
npm install
\`\`\`

### Check the frontend

\`\`\`bash
npm run typecheck
npm run build
npm test
\`\`\`

### Run the desktop app

\`\`\`bash
npm run tauri:dev
\`\`\`

### Build a Windows installer

\`\`\`bash
npm run tauri:build
\`\`\`

The Tauri configuration uses the Xythol Mail mark as the source icon. CI generates the platform icon set from that source before building the Windows installer.

## GitHub Actions

The active desktop workflow is:

\`.github/workflows/tauri.yml\`

The workflow:

1. checks out \`main\`
2. installs Node
3. installs Rust
4. restores the Rust cache
5. installs frontend dependencies
6. runs TypeScript checking
7. builds the frontend
8. runs tests
9. generates Tauri icons from the Xythol logo
10. builds the Windows NSIS installer
11. uploads the installer as a GitHub Actions artifact

There is no automatic public release in the current workflow. I want the actual Tauri installer tested before publishing another release.

## Project layout

\`\`\`text
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
│     └─ branding/
├─ supabase/
│  └─ migrations/
└─ tests/
\`\`\`

## Branding

The main Xythol Mail logo is stored at:

\`public/assets/branding/xythol-mail-logo.svg\`

The app icon source is:

\`src-tauri/icons/xythol.svg\`

The logo uses a blue-violet-to-cyan treatment and is designed to remain recognizable at small sizes.

## Current limits

This is a real foundation, not a pretend finished mail provider.

The current build still needs a proper mailbox synchronization layer for inboxes, message fetching, folders, provider OAuth and background mail sync.

That is intentional. I would rather have an empty inbox than silently manufacture email data.

## License

No license has been selected yet.
