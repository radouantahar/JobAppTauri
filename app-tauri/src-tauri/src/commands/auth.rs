use crate::models::User;
use tauri::State;
use tauri_plugin_sql::SqlitePool;
use serde::{Deserialize, Serialize};
use chrono::Utc;
use uuid::Uuid;
use bcrypt::{hash, verify, DEFAULT_COST};

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
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    // Vérifier si l'utilisateur existe déjà
    if let Some(_) = User::find_by_email(&pool, &email).await.map_err(|e| e.to_string())? {
        return Err("Email already exists".to_string());
    }

    // Hasher le mot de passe
    let password_hash = hash(password, DEFAULT_COST).map_err(|e| e.to_string())?;

    // Créer l'utilisateur
    let user = User {
        id: Uuid::new_v4(),
        email,
        password_hash,
        first_name,
        last_name,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    // Sauvegarder l'utilisateur
    user.create(&pool).await.map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn login(
    email: String,
    password: String,
    pool: State<'_, SqlitePool>,
) -> Result<User, String> {
    // Trouver l'utilisateur
    let user = User::find_by_email(&pool, &email)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "User not found".to_string())?;

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
    db: State<'_, SqlitePool>,
) -> Result<Option<User>, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    // Pour l'instant, on retourne le premier utilisateur
    // TODO: Implémenter la gestion des tokens pour récupérer l'utilisateur actuel
    let user: Option<User> = sqlx::query_as!(
        User,
        r#"
        SELECT * FROM users LIMIT 1
        "#
    )
    .fetch_optional(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(user)
} 