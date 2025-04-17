use crate::models::{UserProfile, UserLocations, CVInfo, UserPreferences, JobPreferences};
use tauri::State;
use tauri_plugin_sql::TauriSql;
use serde::{Deserialize, Serialize};
use chrono::Utc;
use uuid::Uuid;

#[tauri::command]
pub async fn get_user_profile(
    db: State<'_, TauriSql>,
    user_id: Uuid,
) -> Result<UserProfile, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let profile: UserProfile = sqlx::query_as!(
        UserProfile,
        r#"
        SELECT * FROM user_profiles WHERE user_id = $1
        "#,
        user_id
    )
    .fetch_one(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(profile)
}

#[tauri::command]
pub async fn update_user_profile(
    db: State<'_, TauriSql>,
    profile: UserProfile,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    sqlx::query!(
        r#"
        UPDATE user_profiles
        SET name = $1, phone = $2, location = $3, primary_home = $4,
            secondary_home = $5, skills = $6, experience = $7,
            education = $8, cv_path = $9, cv_last_updated = $10,
            updated_at = $11
        WHERE user_id = $12
        "#,
        profile.name,
        profile.phone,
        profile.location,
        profile.primary_home,
        profile.secondary_home,
        profile.skills,
        profile.experience,
        profile.education,
        profile.cv_path,
        profile.cv_last_updated,
        Utc::now(),
        profile.user_id
    )
    .execute(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_user_locations(
    db: State<'_, TauriSql>,
    user_id: Uuid,
) -> Result<UserLocations, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let locations: UserLocations = sqlx::query_as!(
        UserLocations,
        r#"
        SELECT * FROM user_locations WHERE user_id = $1
        "#,
        user_id
    )
    .fetch_one(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(locations)
}

#[tauri::command]
pub async fn update_user_locations(
    db: State<'_, TauriSql>,
    locations: UserLocations,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    sqlx::query!(
        r#"
        UPDATE user_locations
        SET primary_home = $1, secondary_home = $2, updated_at = $3
        WHERE user_id = $4
        "#,
        locations.primary_home,
        locations.secondary_home,
        Utc::now(),
        locations.user_id
    )
    .execute(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_cv_info(
    db: State<'_, TauriSql>,
    user_id: Uuid,
) -> Result<CVInfo, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let cv_info: CVInfo = sqlx::query_as!(
        CVInfo,
        r#"
        SELECT * FROM cv_info WHERE user_id = $1
        "#,
        user_id
    )
    .fetch_one(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(cv_info)
}

#[tauri::command]
pub async fn update_cv_info(
    db: State<'_, TauriSql>,
    cv_info: CVInfo,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    sqlx::query!(
        r#"
        UPDATE cv_info
        SET cv_path = $1, last_updated = $2, updated_at = $3
        WHERE user_id = $4
        "#,
        cv_info.cv_path,
        cv_info.last_updated,
        Utc::now(),
        cv_info.user_id
    )
    .execute(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_user_preferences(
    db: State<'_, TauriSql>,
    user_id: Uuid,
) -> Result<UserPreferences, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let preferences: UserPreferences = sqlx::query_as!(
        UserPreferences,
        r#"
        SELECT * FROM user_preferences WHERE user_id = $1
        "#,
        user_id
    )
    .fetch_one(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(preferences)
}

#[tauri::command]
pub async fn update_user_preferences(
    db: State<'_, TauriSql>,
    preferences: UserPreferences,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    sqlx::query!(
        r#"
        UPDATE user_preferences
        SET theme = $1, language = $2, notifications = $3, updated_at = $4
        WHERE user_id = $5
        "#,
        preferences.theme,
        preferences.language,
        preferences.notifications,
        Utc::now(),
        preferences.user_id
    )
    .execute(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_job_preferences(
    db: State<'_, TauriSql>,
    user_id: Uuid,
) -> Result<JobPreferences, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let preferences: JobPreferences = sqlx::query_as!(
        JobPreferences,
        r#"
        SELECT * FROM job_preferences WHERE user_id = $1
        "#,
        user_id
    )
    .fetch_one(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(preferences)
}

#[tauri::command]
pub async fn update_job_preferences(
    db: State<'_, TauriSql>,
    preferences: JobPreferences,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    sqlx::query!(
        r#"
        UPDATE job_preferences
        SET job_types = $1, locations = $2, salary_range = $3,
            experience_level = $4, skills = $5, updated_at = $6
        WHERE user_id = $7
        "#,
        preferences.job_types,
        preferences.locations,
        preferences.salary_range,
        preferences.experience_level,
        preferences.skills,
        Utc::now(),
        preferences.user_id
    )
    .execute(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
} 