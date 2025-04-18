use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use crate::models::types::{Email, Id, Identifiable, Timestamped, DatabaseModel, Owned};
use crate::types::{DbPool, DbResult, DbRow, TauriSql};
use uuid::Uuid;
use anyhow::Result;
use crate::models::traits::{DatabaseModel as TraitDatabaseModel, FromRow};

/// Représente un utilisateur dans le système
/// 
/// # Fields
/// * `id` - Identifiant unique de l'utilisateur (INTEGER)
/// * `username` - Nom d'utilisateur unique
/// * `email` - Adresse email de l'utilisateur
/// * `password_hash` - Hash du mot de passe de l'utilisateur
/// * `created_at` - Date de création du compte
/// * `last_login` - Date de dernière connexion (optionnelle)
/// * `preferences` - Préférences utilisateur au format JSON
/// * `settings` - Paramètres utilisateur au format JSON
#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: Id,
    pub email: Email,
    pub password_hash: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Identifiable for User {
    fn id(&self) -> &Id {
        &self.id
    }
}

impl Timestamped for User {
    fn created_at(&self) -> &DateTime<Utc> {
        &self.created_at
    }

    fn updated_at(&self) -> &DateTime<Utc> {
        &self.updated_at
    }
}

impl Owned for User {
    fn user_id(&self) -> &Id {
        &self.id
    }
}

impl TraitDatabaseModel for User {
    fn table_name() -> &'static str {
        "users"
    }

    async fn create(pool: &DbPool, model: &Self) -> DbResult<()> {
        let mut tx = pool.begin().await?;
        
        tx.execute(
            r#"
            INSERT INTO users (
                id, email, password_hash, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?)
            "#,
            &[
                &model.id.to_string(),
                &model.email.as_str(),
                &model.password_hash,
                &model.created_at.to_rfc3339(),
                &model.updated_at.to_rfc3339(),
            ],
        )
        .await?;

        tx.commit().await?;
        Ok(())
    }

    async fn find_by_id(pool: &DbPool, id: &Id) -> DbResult<Option<Self>> {
        let row = pool
            .fetch_one(
                r#"
                SELECT * FROM users WHERE id = ?
                "#,
                &[&id.to_string()],
            )
            .await?;
        Ok(Some(Self::from_row(row)?))
    }

    async fn update(pool: &DbPool, model: &Self) -> DbResult<()> {
        let mut tx = pool.begin().await?;
        
        tx.execute(
            r#"
            UPDATE users SET
                email = ?,
                password_hash = ?,
                updated_at = ?
            WHERE id = ?
            "#,
            &[
                &model.email.as_str(),
                &model.password_hash,
                &model.updated_at.to_rfc3339(),
                &model.id.to_string(),
            ],
        )
        .await?;

        tx.commit().await?;
        Ok(())
    }

    async fn delete(pool: &DbPool, id: &Id) -> DbResult<()> {
        let mut tx = pool.begin().await?;
        
        tx.execute(
            r#"
            DELETE FROM users WHERE id = ?
            "#,
            &[&id.to_string()],
        )
        .await?;

        tx.commit().await?;
        Ok(())
    }

    fn from_row(row: DbRow) -> DbResult<Self> {
        Ok(Self {
            id: Uuid::parse_str(&row.get::<String>("id")?)?,
            email: Email::new(row.get("email")?)?,
            password_hash: row.get("password_hash")?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<String>("created_at")?)?.with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<String>("updated_at")?)?.with_timezone(&Utc),
        })
    }
}

impl User {
    pub async fn find_by_email(pool: &DbPool, email: &str) -> DbResult<Option<Self>> {
        let row = pool
            .fetch_one(
                r#"
                SELECT * FROM users WHERE email = ?
                "#,
                &[&email],
            )
            .await?;
        Ok(Some(Self::from_row(row)?))
    }

    pub async fn update_password(pool: &DbPool, id: &Id, new_password_hash: &str) -> DbResult<()> {
        let mut tx = pool.begin().await?;
        
        tx.execute(
            r#"
            UPDATE users SET
                password_hash = ?,
                updated_at = ?
            WHERE id = ?
            "#,
            &[
                &new_password_hash,
                &Utc::now().to_rfc3339(),
                &id.to_string(),
            ],
        )
        .await?;

        tx.commit().await?;
        Ok(())
    }
}

/// Structure pour la création d'un nouvel utilisateur
/// 
/// # Fields
/// * `username` - Nom d'utilisateur unique
/// * `email` - Adresse email du nouvel utilisateur
/// * `password` - Mot de passe en clair (sera hashé avant stockage)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewUser {
    pub email: Email,
    pub password: String,
}

/// Structure pour la mise à jour d'un utilisateur existant
/// 
/// # Fields
/// * `username` - Nouveau nom d'utilisateur (optionnel)
/// * `email` - Nouvelle adresse email (optionnelle)
/// * `password` - Nouveau mot de passe (optionnel)
/// * `preferences` - Nouvelles préférences (optionnelles)
/// * `settings` - Nouveaux paramètres (optionnels)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateUser {
    pub email: Option<Email>,
    pub password: Option<String>,
} 