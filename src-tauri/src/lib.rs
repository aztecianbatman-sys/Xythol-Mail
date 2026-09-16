#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use lettre::message::Mailbox;
use lettre::{Message, SmtpTransport, Transport};
use serde::Deserialize;
use std::process::Command;
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SmtpConfig {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub from: String,
    pub security: String,
}

#[derive(Debug, Deserialize)]
pub struct MailMessage {
    pub to: Vec<String>,
    #[serde(default)]
    pub cc: Vec<String>,
    #[serde(default)]
    pub bcc: Vec<String>,
    pub subject: String,
    pub body: String,
}

fn web_url(value: &str) -> Result<url::Url, String> {
    let parsed = value.parse::<url::Url>().map_err(|_| "Invalid URL".to_string())?;
    match parsed.scheme() {
        "http" | "https" => Ok(parsed),
        _ => Err("Only http and https URLs are allowed".to_string()),
    }
}

#[tauri::command]
fn open_chrome(url: String) -> Result<(), String> {
    let target = web_url(&url)?.to_string();

    #[cfg(target_os = "windows")]
    {
        let paths = [
            std::env::var("LOCALAPPDATA").ok().map(|p| format!(r#"{p}\Google\Chrome\Application\chrome.exe"#)),
            std::env::var("PROGRAMFILES").ok().map(|p| format!(r#"{p}\Google\Chrome\Application\chrome.exe"#)),
            std::env::var("PROGRAMFILES(X86)").ok().map(|p| format!(r#"{p}\Google\Chrome\Application\chrome.exe"#)),
        ];
        for path in paths.into_iter().flatten() {
            if std::path::Path::new(&path).exists() {
                Command::new(path).arg(&target).spawn().map_err(|e| e.to_string())?;
                return Ok(());
            }
        }
        Command::new("cmd")
            .args(["/C", "start", "", &target])
            .spawn()
            .map_err(|e| e.to_string())?;
        return Ok(());
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open").arg(&target).spawn().map_err(|e| e.to_string())?;
        return Ok(());
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        Command::new("xdg-open").arg(&target).spawn().map_err(|e| e.to_string())?;
        return Ok(());
    }

    #[allow(unreachable_code)]
    Err("Opening Chrome is not supported on this platform".to_string())
}

#[tauri::command]
fn open_research_browser(app: tauri::AppHandle, url: String) -> Result<(), String> {
    let target = web_url(&url)?;

    if let Some(window) = app.get_webview_window("research") {
        window.navigate(target).map_err(|e| e.to_string())?;
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    WebviewWindowBuilder::new(&app, "research", WebviewUrl::External(target))
        .title("Xythol Research Browser")
        .inner_size(1280.0, 820.0)
        .min_inner_size(900.0, 600.0)
        .resizable(true)
        .build()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn send_email(smtp: SmtpConfig, message: MailMessage) -> Result<(), String> {
    if message.to.is_empty() {
        return Err("At least one recipient is required".into());
    }
    if smtp.host.trim().is_empty()
        || smtp.username.trim().is_empty()
        || smtp.password.is_empty()
        || smtp.from.trim().is_empty()
    {
        return Err("SMTP host, username, password and from address are required".into());
    }

    let from: Mailbox = smtp.from.parse().map_err(|e| format!("Invalid from address: {e}"))?;
    let mut builder = Message::builder().from(from).subject(&message.subject);

    for address in &message.to {
        builder = builder.to(address.parse::<Mailbox>().map_err(|e| format!("Invalid recipient: {e}"))?);
    }
    for address in &message.cc {
        builder = builder.cc(address.parse::<Mailbox>().map_err(|e| format!("Invalid cc address: {e}"))?);
    }
    for address in &message.bcc {
        builder = builder.bcc(address.parse::<Mailbox>().map_err(|e| format!("Invalid bcc address: {e}"))?);
    }

    let email = builder.body(message.body).map_err(|e| e.to_string())?;
    let credentials = lettre::transport::smtp::authentication::Credentials::new(
        smtp.username.clone(),
        smtp.password.clone(),
    );

    let transport = match smtp.security.as_str() {
        "tls" => SmtpTransport::relay(&smtp.host)
            .map_err(|e| e.to_string())?
            .port(smtp.port)
            .credentials(credentials)
            .build(),
        _ => SmtpTransport::starttls_relay(&smtp.host)
            .map_err(|e| e.to_string())?
            .port(smtp.port)
            .credentials(credentials)
            .build(),
    };

    transport.send(&email).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            open_chrome,
            open_research_browser,
            send_email
        ])
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_title("Xythol Mail");
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Xythol Mail");
}
