mod applications;
mod search;

pub fn register_commands(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    app.invoke_handler(tauri::generate_handler![
        applications::create_application,
        applications::get_application,
        applications::update_application_status,
        applications::add_application_stage,
        applications::add_application_note,
        applications::add_application_document,
        search::search_jobs,
        search::get_job_details,
    ]);
    Ok(())
} 