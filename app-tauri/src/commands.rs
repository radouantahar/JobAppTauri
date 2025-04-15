use crate::models::{JobSearchResult, SearchCriteria};
use serde_json::Value;
use std::process::Command;
use tokio::process::Command as AsyncCommand;
use std::error::Error;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Card {
    pub id: String,
    pub title: String,
    pub description: String,
    pub status: String,
    pub job_id: String,
    pub created_at: String,
    pub updated_at: String,
    pub notes: Option<String>,
    pub interviews: Option<Vec<Interview>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Interview {
    pub date: String,
    pub interview_type: String,
    pub notes: String,
}

#[tauri::command]
pub async fn search_jobs(criteria: SearchCriteria) -> Result<JobSearchResult, String> {
    let python_script = format!(
        r#"
from modules.job_scraper import JobScraper
import json

scraper = JobScraper('jobs.db')
results = scraper.search_jobs(
    keywords={keywords},
    location='{location}',
    job_type={job_type},
    is_remote={is_remote},
    hours_old=72
)

print(json.dumps({{
    'jobs': [{{ 
        'id': str(job.id),
        'title': job.title,
        'company': job.company_name,
        'location': job.location,
        'description': job.description,
        'url': job.url,
        'date_posted': job.date_posted.isoformat() if job.date_posted else '',
        'salary': f"{job.salary_min}-{job.salary_max} {job.salary_currency}" if job.salary_min else None,
        'matching_score': job.matching_score
    }} for job in results['jobs']],
    'stats': {{
        'total': results['stats']['total'],
        'new': results['stats']['new'],
        'updated': results['stats']['updated']
    }}
}}))
"#,
        keywords = criteria.keywords,
        location = criteria.location,
        job_type = criteria.job_type.unwrap_or_default(),
        is_remote = criteria.remote_only
    );

    let output = AsyncCommand::new("python3")
        .arg("-c")
        .arg(python_script)
        .output()
        .await
        .map_err(|e| format!("Failed to execute Python script: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python script error: {}", stderr));
    }

    let stdout = String::from_utf8(output.stdout)
        .map_err(|e| format!("Failed to read Python output: {}", e))?;

    serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse search results: {}", e))
}

#[tauri::command]
pub async fn get_card(card_id: String) -> Result<Card, String> {
    let python_script = format!(
        r#"
from modules.kanban import KanbanManager
import json

manager = KanbanManager('jobs.db')
card = manager.get_card('{card_id}')

print(json.dumps({{
    'id': str(card.id),
    'title': card.title,
    'description': card.description,
    'status': card.status,
    'job_id': str(card.job_id),
    'created_at': card.created_at.isoformat(),
    'updated_at': card.updated_at.isoformat(),
    'notes': card.notes,
    'interviews': [{{ 
        'date': i.date.isoformat(),
        'interview_type': i.interview_type,
        'notes': i.notes
    }} for i in card.interviews] if card.interviews else None
}}))
"#,
        card_id = card_id
    );

    let output = AsyncCommand::new("python3")
        .arg("-c")
        .arg(python_script)
        .output()
        .await
        .map_err(|e| format!("Failed to execute Python script: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python script error: {}", stderr));
    }

    let stdout = String::from_utf8(output.stdout)
        .map_err(|e| format!("Failed to read Python output: {}", e))?;

    serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse card data: {}", e))
}

#[tauri::command]
pub async fn update_card(card_id: String, card_data: Value) -> Result<Card, String> {
    let python_script = format!(
        r#"
from modules.kanban import KanbanManager
import json

manager = KanbanManager('jobs.db')
card = manager.update_card('{card_id}', {card_data})

print(json.dumps({{
    'id': str(card.id),
    'title': card.title,
    'description': card.description,
    'status': card.status,
    'job_id': str(card.job_id),
    'created_at': card.created_at.isoformat(),
    'updated_at': card.updated_at.isoformat(),
    'notes': card.notes,
    'interviews': [{{ 
        'date': i.date.isoformat(),
        'interview_type': i.interview_type,
        'notes': i.notes
    }} for i in card.interviews] if card.interviews else None
}}))
"#,
        card_id = card_id,
        card_data = card_data.to_string()
    );

    let output = AsyncCommand::new("python3")
        .arg("-c")
        .arg(python_script)
        .output()
        .await
        .map_err(|e| format!("Failed to execute Python script: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python script error: {}", stderr));
    }

    let stdout = String::from_utf8(output.stdout)
        .map_err(|e| format!("Failed to read Python output: {}", e))?;

    serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse card data: {}", e))
}

#[tauri::command]
pub async fn delete_card(card_id: String) -> Result<(), String> {
    let python_script = format!(
        r#"
from modules.kanban import KanbanManager

manager = KanbanManager('jobs.db')
manager.delete_card('{card_id}')
"#,
        card_id = card_id
    );

    let output = AsyncCommand::new("python3")
        .arg("-c")
        .arg(python_script)
        .output()
        .await
        .map_err(|e| format!("Failed to execute Python script: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python script error: {}", stderr));
    }

    Ok(())
}

#[tauri::command]
pub async fn move_card(card_id: String, new_status: String) -> Result<Card, String> {
    let python_script = format!(
        r#"
from modules.kanban import KanbanManager
import json

manager = KanbanManager('jobs.db')
card = manager.move_card('{card_id}', '{new_status}')

print(json.dumps({{
    'id': str(card.id),
    'title': card.title,
    'description': card.description,
    'status': card.status,
    'job_id': str(card.job_id),
    'created_at': card.created_at.isoformat(),
    'updated_at': card.updated_at.isoformat(),
    'notes': card.notes,
    'interviews': [{{ 
        'date': i.date.isoformat(),
        'interview_type': i.interview_type,
        'notes': i.notes
    }} for i in card.interviews] if card.interviews else None
}}))
"#,
        card_id = card_id,
        new_status = new_status
    );

    let output = AsyncCommand::new("python3")
        .arg("-c")
        .arg(python_script)
        .output()
        .await
        .map_err(|e| format!("Failed to execute Python script: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python script error: {}", stderr));
    }

    let stdout = String::from_utf8(output.stdout)
        .map_err(|e| format!("Failed to read Python output: {}", e))?;

    serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse card data: {}", e))
}