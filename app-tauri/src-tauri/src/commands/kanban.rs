use tauri::State;
use crate::types::DbPool;
use crate::models::{KanbanColumn, KanbanCard, JobStats};
use crate::models::traits::DatabaseModel;
use tauri::State;
use crate::db::TauriSql;
use uuid::Uuid;
use chrono::{Utc, DateTime};
use anyhow::Context;

/// Crée une nouvelle colonne kanban
#[tauri::command]
pub async fn create_kanban_column(
    state: State<'_, DbPool>,
    title: String,
    position: i32,
    user_id: String,
) -> Result<KanbanColumn, String> {
    let column = KanbanColumn {
        id: Uuid::new_v4().to_string(),
        title,
        position,
        user_id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    column.create(&state).await.map_err(|e| e.to_string())?;
    Ok(column)
}

/// Récupère toutes les colonnes d'un utilisateur
#[tauri::command]
pub async fn get_kanban_columns(
    state: State<'_, DbPool>,
    user_id: String,
) -> Result<Vec<KanbanColumn>, String> {
    KanbanColumn::find_by_user_id(&state, &user_id)
        .await
        .map_err(|e| e.to_string())
}

/// Met à jour une colonne kanban
#[tauri::command]
pub async fn update_kanban_column(
    state: State<'_, DbPool>,
    id: String,
    title: String,
    position: i32,
) -> Result<(), String> {
    let mut column = KanbanColumn::find_by_id(&state, &id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Column not found".to_string())?;

    column.title = title;
    column.position = position;
    column.updated_at = Utc::now();

    column.update(&state).await.map_err(|e| e.to_string())
}

/// Supprime une colonne kanban
#[tauri::command]
pub async fn delete_kanban_column(
    state: State<'_, DbPool>,
    id: String,
) -> Result<(), String> {
    KanbanColumn::delete(&state, &id)
        .await
        .map_err(|e| e.to_string())
}

/// Crée une nouvelle carte kanban
#[tauri::command]
pub async fn create_kanban_card(
    state: State<'_, TauriSql>,
    column_id: String,
    title: String,
    description: String,
    order: i32,
) -> Result<KanbanCard, String> {
    let pool = state.0.pool.clone();

    // Valider l'ID de la colonne
    let parsed_column_id = Uuid::parse_str(&column_id)
        .with_context(|| format!("L'ID de colonne '{}' n'est pas valide", column_id))
        .map_err(|e| e.to_string())?;

    // Vérifier si la colonne existe
    let column_exists = KanbanColumn::find_by_id(&pool, &column_id)
        .await
        .with_context(|| format!("Erreur lors de la vérification de l'existence de la colonne '{}'", column_id))
        .map_err(|e| e.to_string())?
        .is_some();

    if !column_exists {
        return Err(format!("La colonne avec l'ID '{}' n'existe pas", column_id));
    }

    // Créer la nouvelle carte
    let card = KanbanCard {
        id: Uuid::new_v4(),
        column_id: parsed_column_id,
        title,
        description,
        order,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    // Sauvegarder la carte
    KanbanCard::create(&pool, &card)
        .await
        .with_context(|| "Impossible de créer la nouvelle carte Kanban")
        .map_err(|e| e.to_string())?;

    Ok(card)
}

/// Récupère toutes les cartes d'une colonne
#[tauri::command]
pub async fn get_kanban_cards(
    state: State<'_, TauriSql>,
    column_id: String,
) -> Result<Vec<KanbanCard>, String> {
    let pool = state.0.pool.clone();

    // Valider l'ID de la colonne
    let parsed_column_id = Uuid::parse_str(&column_id)
        .with_context(|| format!("L'ID de colonne '{}' n'est pas valide", column_id))
        .map_err(|e| e.to_string())?;

    // Vérifier si la colonne existe
    let column_exists = KanbanColumn::find_by_id(&pool, &column_id)
        .await
        .with_context(|| format!("Erreur lors de la vérification de l'existence de la colonne '{}'", column_id))
        .map_err(|e| e.to_string())?
        .is_some();

    if !column_exists {
        return Err(format!("La colonne avec l'ID '{}' n'existe pas", column_id));
    }

    // Récupérer les cartes
    let cards = sqlx::query_as::<_, KanbanCard>(
        "SELECT * FROM kanban_cards WHERE column_id = $1 ORDER BY \"order\" ASC"
    )
    .bind(parsed_column_id)
    .fetch_all(&pool)
    .await
    .with_context(|| format!("Impossible de récupérer les cartes pour la colonne '{}'", column_id))
    .map_err(|e| e.to_string())?;

    Ok(cards)
}

/// Met à jour une carte kanban
#[tauri::command]
pub async fn update_kanban_card(
    state: State<'_, TauriSql>,
    id: String,
    column_id: Option<String>,
    title: Option<String>,
    description: Option<String>,
    order: Option<i32>,
) -> Result<(), String> {
    let pool = state.0.pool.clone();

    // Valider l'ID de la carte
    let card_id = Uuid::parse_str(&id)
        .with_context(|| format!("L'ID de carte '{}' n'est pas valide", id))
        .map_err(|e| e.to_string())?;

    // Récupérer la carte existante
    let mut card = KanbanCard::find_by_id(&pool, &id)
        .await
        .with_context(|| format!("Erreur lors de la recherche de la carte '{}'", id))
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("La carte avec l'ID '{}' n'existe pas", id))?;

    // Mettre à jour les champs si fournis
    if let Some(new_column_id) = column_id {
        let parsed_column_id = Uuid::parse_str(&new_column_id)
            .with_context(|| format!("Le nouvel ID de colonne '{}' n'est pas valide", new_column_id))
            .map_err(|e| e.to_string())?;

        // Vérifier si la nouvelle colonne existe
        let column_exists = KanbanColumn::find_by_id(&pool, &new_column_id)
            .await
            .with_context(|| format!("Erreur lors de la vérification de l'existence de la colonne '{}'", new_column_id))
            .map_err(|e| e.to_string())?
            .is_some();

        if !column_exists {
            return Err(format!("La colonne avec l'ID '{}' n'existe pas", new_column_id));
        }

        card.column_id = parsed_column_id;
    }

    if let Some(new_title) = title {
        card.title = new_title;
    }
    if let Some(new_description) = description {
        card.description = new_description;
    }
    if let Some(new_order) = order {
        card.order = new_order;
    }
    card.updated_at = Utc::now();

    // Sauvegarder les modifications
    KanbanCard::update(&pool, &card)
        .await
        .with_context(|| format!("Impossible de mettre à jour la carte '{}'", id))
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Supprime une carte kanban
#[tauri::command]
pub async fn delete_kanban_card(
    state: State<'_, TauriSql>,
    id: String,
) -> Result<(), String> {
    let pool = state.0.pool.clone();

    // Valider l'ID de la carte
    let card_id = Uuid::parse_str(&id)
        .with_context(|| format!("L'ID de carte '{}' n'est pas valide", id))
        .map_err(|e| e.to_string())?;

    // Vérifier si la carte existe avant de la supprimer
    let exists = KanbanCard::find_by_id(&pool, &id)
        .await
        .with_context(|| format!("Erreur lors de la vérification de l'existence de la carte '{}'", id))
        .map_err(|e| e.to_string())?
        .is_some();

    if !exists {
        return Err(format!("La carte avec l'ID '{}' n'existe pas", id));
    }

    // Supprimer la carte
    KanbanCard::delete(&pool, &id)
        .await
        .with_context(|| format!("Impossible de supprimer la carte '{}'", id))
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Crée ou met à jour les statistiques d'un utilisateur
#[tauri::command]
pub async fn update_job_stats(
    state: State<'_, DbPool>,
    user_id: String,
    total_applications: i32,
    applications_this_week: i32,
    applications_this_month: i32,
    interviews_scheduled: i32,
    offers_received: i32,
    rejections: i32,
) -> Result<(), String> {
    let stats = JobStats::find_by_user_id(&state, &user_id)
        .await
        .map_err(|e| e.to_string())?;

    if let Some(mut existing_stats) = stats {
        existing_stats.total_applications = total_applications;
        existing_stats.applications_this_week = applications_this_week;
        existing_stats.applications_this_month = applications_this_month;
        existing_stats.interviews_scheduled = interviews_scheduled;
        existing_stats.offers_received = offers_received;
        existing_stats.rejections = rejections;
        existing_stats.updated_at = Utc::now();

        existing_stats.update(&state).await.map_err(|e| e.to_string())
    } else {
        let new_stats = JobStats {
            id: Uuid::new_v4().to_string(),
            user_id,
            total_applications,
            applications_this_week,
            applications_this_month,
            interviews_scheduled,
            offers_received,
            rejections,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        new_stats.create(&state).await.map_err(|e| e.to_string())
    }
}

/// Récupère les statistiques d'un utilisateur
#[tauri::command]
pub async fn get_job_stats(
    state: State<'_, DbPool>,
    user_id: String,
) -> Result<Option<JobStats>, String> {
    JobStats::find_by_user_id(&state, &user_id)
        .await
        .map_err(|e| e.to_string())
} 