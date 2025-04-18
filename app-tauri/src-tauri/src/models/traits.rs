use crate::types::{DbPool, DbResult, DbRow};
use uuid::Uuid;
use crate::db::DbRow;

#[async_trait::async_trait]
/// Trait pour les modèles de base de données
pub trait DatabaseModel: Sized {
    /// Retourne le nom de la table
    fn table_name() -> &'static str;

    /// Crée une nouvelle instance dans la base de données
    async fn create(pool: &DbPool, model: &Self) -> DbResult<()>;

    /// Trouve une instance par son ID
    async fn find_by_id(pool: &DbPool, id: &str) -> DbResult<Option<Self>>;

    /// Met à jour une instance existante
    async fn update(pool: &DbPool, model: &Self) -> DbResult<()>;

    /// Supprime une instance par son ID
    async fn delete(pool: &DbPool, id: &str) -> DbResult<()>;

    /// Convertit une ligne de base de données en modèle
    fn from_row(row: DbRow) -> DbResult<Self>;
}

pub trait FromRow: Sized {
    fn from_row(row: DbRow) -> DbResult<Self>;
} 