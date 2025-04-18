use crate::models::User;
use tauri::State;
use tauri_plugin_sql::{SqlitePool, Row};
use serde::{Deserialize, Serialize};
use chrono::Utc;
use uuid::Uuid;
use bcrypt::{hash, verify, DEFAULT_COST};
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub first_name: String,
    pub last_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub user: User,
    pub token: String,
}

#[tauri::command]
pub async fn register(
    email: String,
    password: String,
    first_name: String,
    last_name: String,
    db: State<'_, TauriSql>,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;

    // Vérifier si l'utilisateur existe déjà
    let mut rows = conn.query(
        "SELECT * FROM users WHERE email = ?",
        &[&email],
    ).map_err(|e| e.to_string())?;

    if rows.next().map_err(|e| e.to_string())?.is_some() {
        return Err("Email already exists".to_string());
    }

    // Hasher le mot de passe
    let password_hash = hash(password, DEFAULT_COST).map_err(|e| e.to_string())?;

    // Créer l'utilisateur
    let user_id = Uuid::new_v4();
    let now = Utc::now().to_string();

    conn.execute(
        r#"
        INSERT INTO users (id, email, password_hash, first_name, last_name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        "#,
        &[
            &user_id.to_string(),
            &email,
            &password_hash,
            &first_name,
            &last_name,
            &now,
            &now,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn login(
    email: String,
    password: String,
    db: State<'_, TauriSql>,
) -> Result<User, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;

    // Trouver l'utilisateur
    let mut rows = conn.query(
        "SELECT * FROM users WHERE email = ?",
        &[&email],
    ).map_err(|e| e.to_string())?;

    let row = rows.next().map_err(|e| e.to_string())?
        .ok_or_else(|| "User not found".to_string())?;

    let user = User::from(row);

    // Vérifier le mot de passe
    if !verify(password, &user.password_hash).map_err(|e| e.to_string())? {
        return Err("Invalid password".to_string());
    }

    Ok(user)
}

#[tauri::command]
pub async fn logout() -> Result<(), String> {
    // Pour l'instant, on ne fait rien car la gestion des tokens n'est pas implémentée
    Ok(())
}

#[tauri::command]
pub async fn get_current_user(
    db: State<'_, TauriSql>,
) -> Result<Option<User>, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    // Pour l'instant, on retourne le premier utilisateur
    // TODO: Implémenter la gestion des tokens pour récupérer l'utilisateur actuel
    let mut rows = conn.query(
        "SELECT * FROM users LIMIT 1",
        &[],
    ).map_err(|e| e.to_string())?;

    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        Ok(Some(User::from(row)))
    } else {
        Ok(None)
    }
} 