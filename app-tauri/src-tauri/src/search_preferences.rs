use crate::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use tauri_plugin_sql::{SqlitePool, Row};

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchPreference {
    pub id: String,
    pub user_id: String,
    pub keywords: Option<String>,
    pub location: Option<String>,
    pub salary_min: Option<i32>,
    pub salary_max: Option<i32>,
    pub contract_types: Vec<String>,
    pub experience_levels: Vec<String>,
    pub remote: Option<bool>,
    pub skills: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SavedFilter {
    pub id: String,
    pub user_id: String,
    pub name: String,
    pub keywords: Option<String>,
    pub location: Option<String>,
    pub salary_min: Option<i32>,
    pub salary_max: Option<i32>,
    pub contract_types: Vec<String>,
    pub experience_levels: Vec<String>,
    pub remote: Option<bool>,
    pub skills: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchAlert {
    pub id: String,
    pub user_id: String,
    pub filter_id: String,
    pub frequency: String,
    pub last_notification: Option<String>,
    pub is_active: bool,
}

#[tauri::command]
pub async fn get_search_preferences(
    state: State<'_, AppState>,
    user_id: String,
) -> Result<SearchPreference, String> {
    let conn = state.db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT * FROM search_preferences WHERE user_id = ?")?;
    let mut rows = stmt.query(&[&user_id])?;
    
    if let Some(row) = rows.next()? {
        Ok(SearchPreference {
            id: row.get("id")?,
            user_id: row.get("user_id")?,
            keywords: row.get("keywords")?,
            location: row.get("location")?,
            salary_min: row.get("salary_min")?,
            salary_max: row.get("salary_max")?,
            contract_types: serde_json::from_str(&row.get::<_, String>("contract_types")?).unwrap_or_default(),
            experience_levels: serde_json::from_str(&row.get::<_, String>("experience_levels")?).unwrap_or_default(),
            remote: row.get("remote")?,
            skills: serde_json::from_str(&row.get::<_, String>("skills")?).unwrap_or_default(),
        })
    } else {
        Err("No search preferences found".to_string())
    }
}

#[tauri::command]
pub async fn update_search_preferences(
    state: State<'_, AppState>,
    preference: SearchPreference,
) -> Result<(), String> {
    let conn = state.db.lock().await;
    let conn = conn.as_ref().ok_or("Database connection not initialized")?;

    let contract_types = serde_json::to_string(&preference.contract_types)
        .map_err(|e| e.to_string())?;
    let experience_levels = serde_json::to_string(&preference.experience_levels)
        .map_err(|e| e.to_string())?;
    let skills = serde_json::to_string(&preference.skills)
        .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR REPLACE INTO search_preferences 
        (id, user_id, keywords, location, salary_min, salary_max, 
        contract_types, experience_levels, remote, skills) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params![
            preference.id,
            preference.user_id,
            preference.keywords,
            preference.location,
            preference.salary_min,
            preference.salary_max,
            contract_types,
            experience_levels,
            preference.remote,
            skills,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn save_filter(
    state: State<'_, AppState>,
    filter: SavedFilter,
) -> Result<String, String> {
    let conn = state.db.lock().await;
    let conn = conn.as_ref().ok_or("Database connection not initialized")?;

    let id = Uuid::new_v4().to_string();
    let contract_types = serde_json::to_string(&filter.contract_types)
        .map_err(|e| e.to_string())?;
    let experience_levels = serde_json::to_string(&filter.experience_levels)
        .map_err(|e| e.to_string())?;
    let skills = serde_json::to_string(&filter.skills)
        .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO saved_filters 
        (id, user_id, name, keywords, location, salary_min, salary_max, 
        contract_types, experience_levels, remote, skills) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params![
            id,
            filter.user_id,
            filter.name,
            filter.keywords,
            filter.location,
            filter.salary_min,
            filter.salary_max,
            contract_types,
            experience_levels,
            filter.remote,
            skills,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn get_saved_filters(
    state: State<'_, AppState>,
    user_id: String,
) -> Result<Vec<SavedFilter>, String> {
    let conn = state.db.lock().await;
    let conn = conn.as_ref().ok_or("Database connection not initialized")?;

    let mut stmt = conn
        .prepare(
            "SELECT id, user_id, name, keywords, location, salary_min, salary_max, 
            contract_types, experience_levels, remote, skills 
            FROM saved_filters WHERE user_id = ?",
        )
        .map_err(|e| e.to_string())?;

    let filters = stmt
        .query_map(params![user_id], |row| {
            Ok(SavedFilter {
                id: row.get(0)?,
                user_id: row.get(1)?,
                name: row.get(2)?,
                keywords: row.get(3)?,
                location: row.get(4)?,
                salary_min: row.get(5)?,
                salary_max: row.get(6)?,
                contract_types: serde_json::from_str(&row.get::<_, String>(7)?).unwrap_or_default(),
                experience_levels: serde_json::from_str(&row.get::<_, String>(8)?).unwrap_or_default(),
                remote: row.get(9)?,
                skills: serde_json::from_str(&row.get::<_, String>(10)?).unwrap_or_default(),
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(filters)
}

#[tauri::command]
pub async fn create_search_alert(
    state: State<'_, AppState>,
    alert: SearchAlert,
) -> Result<String, String> {
    let conn = state.db.lock().await;
    let conn = conn.as_ref().ok_or("Database connection not initialized")?;

    let id = Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO search_alerts 
        (id, user_id, filter_id, frequency, last_notification, is_active) 
        VALUES (?, ?, ?, ?, ?, ?)",
        params![
            id,
            alert.user_id,
            alert.filter_id,
            alert.frequency,
            alert.last_notification,
            alert.is_active,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn get_search_alerts(
    state: State<'_, AppState>,
    user_id: String,
) -> Result<Vec<SearchAlert>, String> {
    let conn = state.db.lock().await;
    let conn = conn.as_ref().ok_or("Database connection not initialized")?;

    let mut stmt = conn
        .prepare(
            "SELECT id, user_id, filter_id, frequency, last_notification, is_active 
            FROM search_alerts WHERE user_id = ?",
        )
        .map_err(|e| e.to_string())?;

    let alerts = stmt
        .query_map(params![user_id], |row| {
            Ok(SearchAlert {
                id: row.get(0)?,
                user_id: row.get(1)?,
                filter_id: row.get(2)?,
                frequency: row.get(3)?,
                last_notification: row.get(4)?,
                is_active: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(alerts)
} 