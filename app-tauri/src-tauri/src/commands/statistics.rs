use tauri::State;
use tauri_plugin_sql::TauriSql;
use serde::{Deserialize, Serialize};
use chrono::{Utc, Duration};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct ApplicationStats {
    pub total_applications: i64,
    pub active_applications: i64,
    pub completed_applications: i64,
    pub average_response_time: Option<Duration>,
    pub success_rate: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JobStats {
    pub total_jobs: i64,
    pub active_jobs: i64,
    pub average_salary: Option<f64>,
    pub most_common_job_types: Vec<String>,
    pub most_common_locations: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentStats {
    pub total_documents: i64,
    pub documents_by_type: Vec<(String, i64)>,
    pub average_document_size: Option<f64>,
    pub last_updated: chrono::DateTime<Utc>,
}

#[tauri::command]
pub async fn get_application_stats(
    db: State<'_, TauriSql>,
    user_id: Uuid,
) -> Result<ApplicationStats, String> {
    let conn = db.get("sqlite:app.db")?;
    
    // Récupérer les statistiques de base
    let mut rows = conn.query(
        r#"
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
        FROM applications 
        WHERE user_id = ?
        "#,
        &[&user_id.to_string()],
    )?;

    let stats = if let Some(row) = rows.next()? {
        (
            row.get::<i64>("total")?,
            row.get::<i64>("active")?,
            row.get::<i64>("completed")?,
        )
    } else {
        (0, 0, 0)
    };

    // Calculer le temps de réponse moyen
    let mut rows = conn.query(
        r#"
        SELECT AVG(
            julianday(response_date) - julianday(applied_date)
        ) as avg_days
        FROM applications 
        WHERE user_id = ? AND response_date IS NOT NULL
        "#,
        &[&user_id.to_string()],
    )?;

    let avg_response = if let Some(row) = rows.next()? {
        row.get::<Option<f64>>("avg_days")?
            .map(|days| Duration::days(days as i64))
    } else {
        None
    };

    // Calculer le taux de succès
    let mut rows = conn.query(
        r#"
        SELECT 
            CAST(SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS FLOAT) / 
            NULLIF(COUNT(*), 0) as rate
        FROM applications 
        WHERE user_id = ?
        "#,
        &[&user_id.to_string()],
    )?;

    let success_rate = if let Some(row) = rows.next()? {
        row.get::<Option<f64>>("rate")?.unwrap_or(0.0)
    } else {
        0.0
    };

    Ok(ApplicationStats {
        total_applications: stats.0,
        active_applications: stats.1,
        completed_applications: stats.2,
        average_response_time: avg_response,
        success_rate,
    })
}

#[tauri::command]
pub async fn get_job_stats(
    db: State<'_, TauriSql>,
    user_id: Uuid,
) -> Result<JobStats, String> {
    let conn = db.get("sqlite:app.db")?;
    
    // Récupérer les statistiques de base
    let mut rows = conn.query(
        r#"
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
            AVG(salary_max) as avg_salary
        FROM jobs 
        WHERE user_id = ?
        "#,
        &[&user_id.to_string()],
    )?;

    let stats = if let Some(row) = rows.next()? {
        (
            row.get::<i64>("total")?,
            row.get::<i64>("active")?,
            row.get::<Option<f64>>("avg_salary")?,
        )
    } else {
        (0, 0, None)
    };

    // Récupérer les types d'emploi les plus courants
    let mut rows = conn.query(
        r#"
        SELECT job_type, COUNT(*) as count
        FROM jobs 
        WHERE user_id = ?
        GROUP BY job_type
        ORDER BY count DESC
        LIMIT 5
        "#,
        &[&user_id.to_string()],
    )?;

    let mut job_types = Vec::new();
    while let Some(row) = rows.next()? {
        job_types.push(row.get::<String>("job_type")?);
    }

    // Récupérer les localisations les plus courantes
    let mut rows = conn.query(
        r#"
        SELECT location, COUNT(*) as count
        FROM jobs 
        WHERE user_id = ?
        GROUP BY location
        ORDER BY count DESC
        LIMIT 5
        "#,
        &[&user_id.to_string()],
    )?;

    let mut locations = Vec::new();
    while let Some(row) = rows.next()? {
        locations.push(row.get::<String>("location")?);
    }

    Ok(JobStats {
        total_jobs: stats.0,
        active_jobs: stats.1,
        average_salary: stats.2,
        most_common_job_types: job_types,
        most_common_locations: locations,
    })
}

#[tauri::command]
pub async fn get_document_stats(
    db: State<'_, TauriSql>,
    user_id: Uuid,
) -> Result<DocumentStats, String> {
    let conn = db.get("sqlite:app.db")?;
    
    // Récupérer les statistiques de base
    let mut rows = conn.query(
        r#"
        SELECT 
            COUNT(*) as total,
            AVG(size) as avg_size,
            MAX(updated_at) as last_updated
        FROM documents 
        WHERE user_id = ?
        "#,
        &[&user_id.to_string()],
    )?;

    let stats = if let Some(row) = rows.next()? {
        (
            row.get::<i64>("total")?,
            row.get::<Option<f64>>("avg_size")?,
            row.get::<chrono::DateTime<Utc>>("last_updated")?,
        )
    } else {
        (0, None, Utc::now())
    };

    // Récupérer le nombre de documents par type
    let mut rows = conn.query(
        r#"
        SELECT document_type, COUNT(*) as count
        FROM documents 
        WHERE user_id = ?
        GROUP BY document_type
        ORDER BY count DESC
        "#,
        &[&user_id.to_string()],
    )?;

    let mut documents_by_type = Vec::new();
    while let Some(row) = rows.next()? {
        documents_by_type.push((
            row.get::<String>("document_type")?,
            row.get::<i64>("count")?,
        ));
    }

    Ok(DocumentStats {
        total_documents: stats.0,
        documents_by_type,
        average_document_size: stats.1,
        last_updated: stats.2,
    })
} 