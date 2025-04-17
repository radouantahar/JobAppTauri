use crate::AppState;
use argon2::{Argon2, PasswordHash, PasswordVerifier, PasswordHasher};
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use thiserror::Error;
use chrono::{Duration, Utc};
use uuid::Uuid;
use jsonwebtoken::{encode, Header, EncodingKey};
use password_hash::SaltString;
use rand::thread_rng;
use crate::models::User;
use tauri_plugin_sql::TauriSql;
use argon2::Config;
use base64;

#[derive(Debug, Error)]
pub enum AuthError {
    #[error("Database error: {0}")]
    DatabaseError(#[from] rusqlite::Error),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub name: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // user id
    pub exp: i64,    // expiration time
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthResponse {
    pub id: String,
    pub email: String,
    pub token: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserInfo {
    pub id: String,
    pub email: String,
}

const JWT_SECRET: &[u8] = b"your-secret-key"; // À remplacer par une clé sécurisée
const JWT_EXPIRATION: i64 = 24 * 60 * 60; // 24 hours

#[tauri::command]
pub async fn login(
    db: State<'_, TauriSql>,
    request: LoginRequest,
) -> Result<String, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let user: User = sqlx::query_as!(
        User,
        r#"
        SELECT * FROM users WHERE email = $1
        "#,
        request.email
    )
    .fetch_one(&conn)
    .await
    .map_err(|_| "Invalid email or password")?;

    let config = Config::default();
    let hash = argon2::hash_encoded(
        request.password.as_bytes(),
        &user.salt,
        &config,
    ).map_err(|_| "Error verifying password")?;

    if hash != user.password_hash {
        return Err("Invalid email or password".to_string());
    }

    let claims = Claims {
        sub: user.id.to_string(),
        exp: Utc::now().timestamp() + JWT_EXPIRATION,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(JWT_SECRET),
    ).map_err(|_| "Error generating token")?;

    Ok(token)
}

#[tauri::command]
pub async fn register(
    db: State<'_, TauriSql>,
    request: RegisterRequest,
) -> Result<String, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    // Vérifier si l'email existe déjà
    let existing_user: Option<User> = sqlx::query_as!(
        User,
        r#"
        SELECT * FROM users WHERE email = $1
        "#,
        request.email
    )
    .fetch_optional(&conn)
    .await
    .map_err(|e| e.to_string())?;

    if existing_user.is_some() {
        return Err("Email already exists".to_string());
    }

    // Générer un sel aléatoire
    let salt: [u8; 32] = rand::thread_rng().gen();
    let salt = base64::encode(salt);

    // Hasher le mot de passe
    let config = Config::default();
    let password_hash = argon2::hash_encoded(
        request.password.as_bytes(),
        salt.as_bytes(),
        &config,
    ).map_err(|_| "Error hashing password")?;

    // Créer l'utilisateur
    let user_id = sqlx::query!(
        r#"
        INSERT INTO users (email, password_hash, salt, name, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
        "#,
        request.email,
        password_hash,
        salt,
        request.name,
        Utc::now(),
        Utc::now()
    )
    .fetch_one(&conn)
    .await
    .map_err(|e| e.to_string())?
    .id;

    // Générer le token JWT
    let claims = Claims {
        sub: user_id.to_string(),
        exp: Utc::now().timestamp() + JWT_EXPIRATION,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(JWT_SECRET),
    ).map_err(|_| "Error generating token")?;

    Ok(token)
}

#[tauri::command]
pub async fn logout() -> Result<(), String> {
    // Dans une application Tauri, la déconnexion est gérée côté client
    // en supprimant le token du stockage local
    Ok(())
}

#[tauri::command]
#[allow(dead_code)]
pub async fn verify_token(
    state: State<'_, AppState>,
    token: String,
) -> Result<UserInfo, String> {
    let db_state = state.db.lock().await;
    let db_state = db_state.as_ref().ok_or("Database connection not initialized")?;
    let conn = &db_state.conn;

    // Vérifier le token dans la base de données
    let mut stmt = conn
        .prepare(
            "SELECT u.id, u.email FROM users u 
            JOIN sessions s ON u.id = s.user_id 
            WHERE s.token = ? AND s.expires_at > datetime('now')",
        )
        .map_err(|e| e.to_string())?;

    let user = stmt
        .query_row(params![token], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|_| "Invalid or expired token".to_string())?;

    Ok(UserInfo {
        id: user.0,
        email: user.1,
    })
} 