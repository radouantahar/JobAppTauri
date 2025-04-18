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
    
    let mut rows = conn.query(
        "SELECT * FROM user_profiles WHERE user_id = ?",
        &[&user_id.to_string()],
    ).map_err(|e| e.to_string())?;

    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        Ok(UserProfile::from(row))
    } else {
        Err("Profil utilisateur non trouvé".to_string())
    }
}

#[tauri::command]
pub async fn update_user_profile(
    db: State<'_, TauriSql>,
    profile: UserProfile,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    conn.execute(
        r#"
        UPDATE user_profiles
        SET name = ?, phone = ?, location = ?, primary_home = ?,
            secondary_home = ?, skills = ?, experience = ?,
            education = ?, cv_path = ?, cv_last_updated = ?,
            updated_at = ?
        WHERE user_id = ?
        "#,
        &[
            &profile.name,
            &profile.phone,
            &profile.location,
            &profile.primary_home,
            &profile.secondary_home,
            &profile.skills,
            &profile.experience,
            &profile.education,
            &profile.cv_path,
            &profile.cv_last_updated,
            &Utc::now().to_string(),
            &profile.user_id.to_string(),
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_user_locations(
    db: State<'_, TauriSql>,
    user_id: Uuid,
) -> Result<UserLocations, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let mut rows = conn.query(
        "SELECT * FROM user_locations WHERE user_id = ?",
        &[&user_id.to_string()],
    ).map_err(|e| e.to_string())?;

    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        Ok(UserLocations::from(row))
    } else {
        Err("Localisations utilisateur non trouvées".to_string())
    }
}

#[tauri::command]
pub async fn update_user_locations(
    db: State<'_, TauriSql>,
    locations: UserLocations,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    conn.execute(
        r#"
        UPDATE user_locations
        SET primary_home = ?, secondary_home = ?, updated_at = ?
        WHERE user_id = ?
        "#,
        &[
            &locations.primary_home,
            &locations.secondary_home,
            &Utc::now().to_string(),
            &locations.user_id.to_string(),
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_cv_info(
    db: State<'_, TauriSql>,
    user_id: Uuid,
) -> Result<CVInfo, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let mut rows = conn.query(
        "SELECT * FROM cv_info WHERE user_id = ?",
        &[&user_id.to_string()],
    ).map_err(|e| e.to_string())?;

    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        Ok(CVInfo::from(row))
    } else {
        Err("Informations CV non trouvées".to_string())
    }
}

#[tauri::command]
pub async fn update_cv_info(
    db: State<'_, TauriSql>,
    cv_info: CVInfo,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    conn.execute(
        r#"
        UPDATE cv_info
        SET cv_path = ?, last_updated = ?, updated_at = ?
        WHERE user_id = ?
        "#,
        &[
            &cv_info.cv_path,
            &cv_info.last_updated,
            &Utc::now().to_string(),
            &cv_info.user_id.to_string(),
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_user_preferences(
    db: State<'_, TauriSql>,
    user_id: Uuid,
) -> Result<UserPreferences, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let mut rows = conn.query(
        "SELECT * FROM user_preferences WHERE user_id = ?",
        &[&user_id.to_string()],
    ).map_err(|e| e.to_string())?;

    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        Ok(UserPreferences::from(row))
    } else {
        Err("Préférences utilisateur non trouvées".to_string())
    }
}

#[tauri::command]
pub async fn update_user_preferences(
    db: State<'_, TauriSql>,
    preferences: UserPreferences,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    conn.execute(
        r#"
        UPDATE user_preferences
        SET theme = ?, language = ?, notifications = ?, updated_at = ?
        WHERE user_id = ?
        "#,
        &[
            &preferences.theme,
            &preferences.language,
            &preferences.notifications,
            &Utc::now().to_string(),
            &preferences.user_id.to_string(),
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_job_preferences(
    db: State<'_, TauriSql>,
    user_id: Uuid,
) -> Result<JobPreferences, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let mut rows = conn.query(
        "SELECT * FROM job_preferences WHERE user_id = ?",
        &[&user_id.to_string()],
    ).map_err(|e| e.to_string())?;

    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        Ok(JobPreferences::from(row))
    } else {
        Err("Préférences d'emploi non trouvées".to_string())
    }
}

#[tauri::command]
pub async fn update_job_preferences(
    db: State<'_, TauriSql>,
    preferences: JobPreferences,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    conn.execute(
        r#"
        UPDATE job_preferences
        SET job_types = ?, locations = ?, salary_range = ?,
            experience_level = ?, skills = ?, updated_at = ?
        WHERE user_id = ?
        "#,
        &[
            &preferences.job_types,
            &preferences.locations,
            &preferences.salary_range,
            &preferences.experience_level,
            &preferences.skills,
            &Utc::now().to_string(),
            &preferences.user_id.to_string(),
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn create_user_profile(
    db: State<'_, TauriSql>,
    user_id: Uuid,
    name: String,
    phone: Option<String>,
    location: Option<String>,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    let now = Utc::now().to_string();
    
    conn.execute(
        r#"
        INSERT INTO user_profiles (
            user_id, name, phone, location, primary_home, secondary_home,
            skills, experience, education, cv_path, cv_last_updated,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
        &[
            &user_id.to_string(),
            &name,
            &phone,
            &location,
            &None::<String>,
            &None::<String>,
            &None::<String>,
            &None::<String>,
            &None::<String>,
            &None::<String>,
            &None::<String>,
            &now,
            &now,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn create_user_locations(
    db: State<'_, TauriSql>,
    user_id: Uuid,
    primary_home: Option<String>,
    secondary_home: Option<String>,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    let now = Utc::now().to_string();
    
    conn.execute(
        r#"
        INSERT INTO user_locations (
            user_id, primary_home, secondary_home, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?)
        "#,
        &[
            &user_id.to_string(),
            &primary_home,
            &secondary_home,
            &now,
            &now,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn create_cv_info(
    db: State<'_, TauriSql>,
    user_id: Uuid,
    cv_path: Option<String>,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    let now = Utc::now().to_string();
    
    conn.execute(
        r#"
        INSERT INTO cv_info (
            user_id, cv_path, last_updated, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?)
        "#,
        &[
            &user_id.to_string(),
            &cv_path,
            &None::<String>,
            &now,
            &now,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn create_user_preferences(
    db: State<'_, TauriSql>,
    user_id: Uuid,
    theme: Option<String>,
    language: Option<String>,
    notifications: Option<bool>,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    let now = Utc::now().to_string();
    
    conn.execute(
        r#"
        INSERT INTO user_preferences (
            user_id, theme, language, notifications, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        "#,
        &[
            &user_id.to_string(),
            &theme,
            &language,
            &notifications,
            &now,
            &now,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn create_job_preferences(
    db: State<'_, TauriSql>,
    user_id: Uuid,
    job_types: Option<Vec<String>>,
    locations: Option<Vec<String>>,
    salary_range: Option<String>,
    experience_level: Option<String>,
    skills: Option<Vec<String>>,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    let now = Utc::now().to_string();
    
    conn.execute(
        r#"
        INSERT INTO job_preferences (
            user_id, job_types, locations, salary_range,
            experience_level, skills, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        "#,
        &[
            &user_id.to_string(),
            &job_types.map(|v| serde_json::to_string(&v).unwrap()),
            &locations.map(|v| serde_json::to_string(&v).unwrap()),
            &salary_range,
            &experience_level,
            &skills.map(|v| serde_json::to_string(&v).unwrap()),
            &now,
            &now,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
} 