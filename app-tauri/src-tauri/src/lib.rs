#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

pub mod commands;
pub mod models;
pub mod types;
pub mod auth;
pub mod db;

#[cfg(test)]
mod tests {
    mod application_test;
}
