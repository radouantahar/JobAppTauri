use crate::models::{JobSearchResult, SearchCriteria};
use serde_json::Value;
use std::process::Command;
use tokio::process::Command as AsyncCommand;
use std::error::Error;

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