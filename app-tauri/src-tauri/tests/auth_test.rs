use crate::commands::auth::*;
use tauri_plugin_sql::TauriSql;

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_register() {
        let db = TauriSql::default();
        let user = User {
            id: 1,
            email: "test@example.com".to_string(),
            password: "password123".to_string(),
            first_name: "Test".to_string(),
            last_name: "User".to_string(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        let result = register(db, user).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_login() {
        let db = TauriSql::default();
        let credentials = LoginCredentials {
            email: "test@example.com".to_string(),
            password: "password123".to_string(),
        };
        let result = login(db, credentials).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_logout() {
        let db = TauriSql::default();
        let result = logout(db).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_get_current_user() {
        let db = TauriSql::default();
        let result = get_current_user(db).await;
        assert!(result.is_ok());
    }
} 