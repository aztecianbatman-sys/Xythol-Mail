# Xythol Mail

Xythol Mail is a Windows desktop workspace for people who do a lot of research and then need to turn that research into useful email.

The idea is pretty simple: Research -> Collect -> Organize -> Write -> Review -> Send.

It is built with Electron 37.2.6, React, TypeScript, Vite and Supabase. The browser is integrated into the desktop app using Electron's Chromium engine, so the browser and the research tools can feel like one product instead of two windows stuck together.

## What is actually in this repo

The current public build includes a real Electron shell, a secure preload boundary, a Chromium research browser, a real Supabase Auth flow, a Supabase/Postgres migration with ownership-based RLS, local draft persistence, research/contacts data screens, a working SMTP send path, a global Ctrl+K command palette, privacy/settings screens, and the Xythol brand assets.

There are intentionally no pretend mailbox rows. Inbox/Sent/Starred/etc. stay empty until a real mailbox provider is configured.

## Run it

Use Node.js 22+.

    npm install
    copy .env.example .env.local
    npm run dev

Set these in .env.local:

    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

Apply supabase/migrations/202609150001_initial_schema.sql to your Supabase project.

For a production build:

    npm run build
    npm start

For a Windows installer:

    npm run package:win

## Supabase setup

Supabase is the cloud account/data layer. The app expects a publishable key in the client, not a secret/service-role key. The migration creates the core tables and enables RLS everywhere user-owned data is stored.

The RLS rules use the authenticated user's auth.uid() and keep child records tied to a user-owned parent where needed. Do not remove those checks just to make a query return data.

New Supabase projects no longer automatically expose newly created public tables through the Data API, so the migration includes explicit authenticated-role grants. RLS still decides which rows the user can see.

## Mail providers

The application is structured so the rest of the UI can eventually consume a normalized provider adapter:

- Gmail
- Outlook
- IMAP
- SMTP

Gmail and Outlook need their own OAuth application registration, redirect configuration and permissions. Those credentials cannot be invented inside this repository.

SMTP sending is real today. The compose screen passes connection details to the Electron main process, which verifies the SMTP connection and sends through Nodemailer. A successful send is only shown after the transport accepts the message.

## Browser

The research browser is a real Chromium view (WebContentsView), not an iframe pretending to be a browser.

Website content runs separately from the application renderer. It does not receive the Xythol preload bridge. Navigation is restricted to HTTP(S), pop-up windows are explicitly handled, and browser permissions are denied by default in this first build.

The browser is still a normal browser from the website's point of view. A site may receive the normal browser information that sites usually receive.

## Research

Research sessions live in Supabase once signed in.

A session is meant to hold sources, notes and the final draft relationship. The browser exposes two explicit capture actions:

- Save source
- Save selection

A source save captures page metadata. A selection save captures the user's selected text. Xythol does not silently scrape an entire website.

## Privacy

The Privacy Center exists because "private" should mean something concrete.

Local information can include the Chromium profile, cookies/site data and unsynced drafts.

Cloud information can include your Xythol account and the data you explicitly sync to Supabase.

The project does not describe itself as unhackable, anonymous, military-grade, or 100% secure. Those would be dishonest claims.

## Performance

The UI is deliberately light on animation and heavy visual effects. Lists are kept simple and the browser is kept outside the React tree as a native Chromium view.

There is no fixed RAM promise because Chromium memory use depends on the web pages you open, the number of tabs, and the rest of your machine.

## Tests

    npm test

There are basic unit tests for search/validation in the development workspace. RLS should also be tested against a real Supabase project with separate users before production use.

## Project layout

    xythol-mail/
    ├─ electron/
    │  ├─ main.cjs
    │  └─ preload.cjs
    ├─ src/
    │  ├─ App.tsx
    │  ├─ main.tsx
    │  ├─ supabase.ts
    │  └─ styles.css
    ├─ supabase/
    │  └─ migrations/
    ├─ assets/
    │  └─ branding/
    └─ tests/

## Current limits

This is a serious starting point, not a claim that every external provider feature already has a working production credential flow.

Mailbox sync, Gmail/Outlook OAuth completion, scheduled sending, full offline conflict resolution, and destructive account deletion still need their provider/server-side setup and additional implementation. Those areas are intentionally visible in the product instead of being hidden behind fake success messages.

That rule matters to this project: a button should either do the thing, or tell you why it cannot yet.

## Branding

The custom Xythol Mail logo combines a geometric envelope, a signal/spark and motion lines. Vector variants are in assets/branding/, with basic usage notes in assets/branding/BRAND.md.

## License

No license has been selected yet. If this repo is going to be redistributed, add the license you actually want instead of assuming one.
