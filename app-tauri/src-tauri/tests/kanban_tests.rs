use crate::models::{KanbanColumn, KanbanCard, JobStats};
use crate::commands::kanban::*;
use chrono::Utc;
use tauri_plugin_sql::SqlitePool;
use uuid::Uuid;

#[cfg(test)]
mod tests {
    use super::*;

    async fn setup_test_db() -> SqlitePool {
        let pool = SqlitePool::new("sqlite::memory:").await.unwrap();
        
        // Exécuter les migrations
        let migrations = vec![
            include_str!("../migrations/0001_initial_schema.sql"),
            include_str!("../migrations/0002_kanban_tables.sql"),
        ];

        for migration in migrations {
            pool.execute(migration).await.unwrap();
        }

        pool
    }

    #[tokio::test]
    async fn test_kanban_column_crud() {
        let pool = setup_test_db().await;
        let user_id = Uuid::new_v4().to_string();
        let now = Utc::now();

        // Test création
        let column = KanbanColumn {
            id: Uuid::new_v4().to_string(),
            title: "Test Column".to_string(),
            position: 0,
            user_id: user_id.clone(),
            created_at: now,
            updated_at: now,
        };

        column.create(&pool).await.unwrap();

        // Test lecture
        let found_column = KanbanColumn::find_by_id(&pool, &column.id)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(found_column.title, "Test Column");

        // Test mise à jour
        let mut updated_column = found_column;
        updated_column.title = "Updated Column".to_string();
        updated_column.update(&pool).await.unwrap();

        let found_updated = KanbanColumn::find_by_id(&pool, &column.id)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(found_updated.title, "Updated Column");

        // Test suppression
        KanbanColumn::delete(&pool, &column.id).await.unwrap();
        let deleted = KanbanColumn::find_by_id(&pool, &column.id)
            .await
            .unwrap();
        assert!(deleted.is_none());
    }

    #[tokio::test]
    async fn test_kanban_card_crud() {
        let pool = setup_test_db().await;
        let user_id = Uuid::new_v4().to_string();
        let now = Utc::now();

        // Créer une colonne pour la carte
        let column = KanbanColumn {
            id: Uuid::new_v4().to_string(),
            title: "Test Column".to_string(),
            position: 0,
            user_id: user_id.clone(),
            created_at: now,
            updated_at: now,
        };
        column.create(&pool).await.unwrap();

        // Test création
        let card = KanbanCard {
            id: Uuid::new_v4().to_string(),
            title: "Test Card".to_string(),
            description: Some("Test Description".to_string()),
            position: 0,
            column_id: column.id.clone(),
            application_id: None,
            created_at: now,
            updated_at: now,
        };

        card.create(&pool).await.unwrap();

        // Test lecture
        let found_card = KanbanCard::find_by_id(&pool, &card.id)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(found_card.title, "Test Card");

        // Test mise à jour
        let mut updated_card = found_card;
        updated_card.title = "Updated Card".to_string();
        updated_card.update(&pool).await.unwrap();

        let found_updated = KanbanCard::find_by_id(&pool, &card.id)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(found_updated.title, "Updated Card");

        // Test suppression
        KanbanCard::delete(&pool, &card.id).await.unwrap();
        let deleted = KanbanCard::find_by_id(&pool, &card.id)
            .await
            .unwrap();
        assert!(deleted.is_none());
    }

    #[tokio::test]
    async fn test_job_stats_crud() {
        let pool = setup_test_db().await;
        let user_id = Uuid::new_v4().to_string();
        let now = Utc::now();

        // Test création
        let stats = JobStats {
            id: Uuid::new_v4().to_string(),
            user_id: user_id.clone(),
            total_applications: 10,
            applications_this_week: 2,
            applications_this_month: 5,
            interviews_scheduled: 3,
            offers_received: 1,
            rejections: 2,
            created_at: now,
            updated_at: now,
        };

        stats.create(&pool).await.unwrap();

        // Test lecture
        let found_stats = JobStats::find_by_user_id(&pool, &user_id)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(found_stats.total_applications, 10);

        // Test mise à jour
        let mut updated_stats = found_stats;
        updated_stats.total_applications = 15;
        updated_stats.update(&pool).await.unwrap();

        let found_updated = JobStats::find_by_user_id(&pool, &user_id)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(found_updated.total_applications, 15);

        // Test suppression
        JobStats::delete(&pool, &stats.id).await.unwrap();
        let deleted = JobStats::find_by_user_id(&pool, &user_id)
            .await
            .unwrap();
        assert!(deleted.is_none());
    }

    #[tokio::test]
    async fn test_kanban_commands() {
        let pool = setup_test_db().await;
        let user_id = Uuid::new_v4().to_string();

        // Test création de colonne
        let column = create_kanban_column(
            tauri::State::new(pool.clone()),
            "Test Column".to_string(),
            0,
            user_id.clone(),
        )
        .await
        .unwrap();
        assert_eq!(column.title, "Test Column");

        // Test récupération des colonnes
        let columns = get_kanban_columns(
            tauri::State::new(pool.clone()),
            user_id.clone(),
        )
        .await
        .unwrap();
        assert_eq!(columns.len(), 1);

        // Test création de carte
        let card = create_kanban_card(
            tauri::State::new(pool.clone()),
            "Test Card".to_string(),
            Some("Test Description".to_string()),
            0,
            column.id.clone(),
            None,
        )
        .await
        .unwrap();
        assert_eq!(card.title, "Test Card");

        // Test récupération des cartes
        let cards = get_kanban_cards(
            tauri::State::new(pool.clone()),
            column.id.clone(),
        )
        .await
        .unwrap();
        assert_eq!(cards.len(), 1);

        // Test mise à jour des statistiques
        update_job_stats(
            tauri::State::new(pool.clone()),
            user_id.clone(),
            10,
            2,
            5,
            3,
            1,
            2,
        )
        .await
        .unwrap();

        // Test récupération des statistiques
        let stats = get_job_stats(
            tauri::State::new(pool.clone()),
            user_id.clone(),
        )
        .await
        .unwrap()
        .unwrap();
        assert_eq!(stats.total_applications, 10);
    }

    #[tokio::test]
    async fn test_kanban_column_errors() {
        let pool = setup_test_db().await;
        let user_id = Uuid::new_v4().to_string();
        let now = Utc::now();

        // Test création avec titre vide
        let column = KanbanColumn {
            id: Uuid::new_v4().to_string(),
            title: "".to_string(),
            position: 0,
            user_id: user_id.clone(),
            created_at: now,
            updated_at: now,
        };

        let result = column.create(&pool).await;
        assert!(result.is_err());

        // Test mise à jour d'une colonne inexistante
        let result = KanbanColumn::update(&pool, &column).await;
        assert!(result.is_err());

        // Test suppression d'une colonne inexistante
        let result = KanbanColumn::delete(&pool, &column.id).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_kanban_card_errors() {
        let pool = setup_test_db().await;
        let user_id = Uuid::new_v4().to_string();
        let now = Utc::now();

        // Test création avec titre vide
        let card = KanbanCard {
            id: Uuid::new_v4().to_string(),
            title: "".to_string(),
            description: None,
            position: 0,
            column_id: "invalid_column_id".to_string(),
            application_id: None,
            created_at: now,
            updated_at: now,
        };

        let result = card.create(&pool).await;
        assert!(result.is_err());

        // Test mise à jour d'une carte inexistante
        let result = KanbanCard::update(&pool, &card).await;
        assert!(result.is_err());

        // Test suppression d'une carte inexistante
        let result = KanbanCard::delete(&pool, &card.id).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_job_stats_errors() {
        let pool = setup_test_db().await;
        let user_id = Uuid::new_v4().to_string();
        let now = Utc::now();

        // Test création avec valeurs négatives
        let stats = JobStats {
            id: Uuid::new_v4().to_string(),
            user_id: user_id.clone(),
            total_applications: -1,
            applications_this_week: -1,
            applications_this_month: -1,
            interviews_scheduled: -1,
            offers_received: -1,
            rejections: -1,
            created_at: now,
            updated_at: now,
        };

        let result = stats.create(&pool).await;
        assert!(result.is_err());

        // Test mise à jour de statistiques inexistantes
        let result = JobStats::update(&pool, &stats).await;
        assert!(result.is_err());

        // Test suppression de statistiques inexistantes
        let result = JobStats::delete(&pool, &stats.id).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_kanban_commands_errors() {
        let pool = setup_test_db().await;
        let user_id = Uuid::new_v4().to_string();

        // Test création de colonne avec titre vide
        let result = create_kanban_column(
            tauri::State::new(pool.clone()),
            "".to_string(),
            0,
            user_id.clone(),
        ).await;
        assert!(result.is_err());

        // Test récupération des colonnes d'un utilisateur inexistant
        let result = get_kanban_columns(
            tauri::State::new(pool.clone()),
            "invalid_user_id".to_string(),
        ).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 0);

        // Test création de carte avec colonne inexistante
        let result = create_kanban_card(
            tauri::State::new(pool.clone()),
            "Test Card".to_string(),
            None,
            0,
            "invalid_column_id".to_string(),
            None,
        ).await;
        assert!(result.is_err());

        // Test récupération des cartes d'une colonne inexistante
        let result = get_kanban_cards(
            tauri::State::new(pool.clone()),
            "invalid_column_id".to_string(),
        ).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 0);

        // Test mise à jour des statistiques avec valeurs invalides
        let result = update_job_stats(
            tauri::State::new(pool.clone()),
            user_id.clone(),
            -1,
            -1,
            -1,
            -1,
            -1,
            -1,
        ).await;
        assert!(result.is_err());

        // Test récupération des statistiques d'un utilisateur inexistant
        let result = get_job_stats(
            tauri::State::new(pool.clone()),
            "invalid_user_id".to_string(),
        ).await;
        assert!(result.is_ok());
        assert!(result.unwrap().is_none());
    }

    #[tokio::test]
    async fn test_kanban_column_ordering() {
        let pool = setup_test_db().await;
        let user_id = Uuid::new_v4().to_string();
        let now = Utc::now();

        // Créer plusieurs colonnes avec différentes positions
        let columns = vec![
            KanbanColumn {
                id: Uuid::new_v4().to_string(),
                title: "Column 1".to_string(),
                position: 2,
                user_id: user_id.clone(),
                created_at: now,
                updated_at: now,
            },
            KanbanColumn {
                id: Uuid::new_v4().to_string(),
                title: "Column 2".to_string(),
                position: 0,
                user_id: user_id.clone(),
                created_at: now,
                updated_at: now,
            },
            KanbanColumn {
                id: Uuid::new_v4().to_string(),
                title: "Column 3".to_string(),
                position: 1,
                user_id: user_id.clone(),
                created_at: now,
                updated_at: now,
            },
        ];

        for column in &columns {
            column.create(&pool).await.unwrap();
        }

        // Vérifier que les colonnes sont retournées dans l'ordre correct
        let found_columns = KanbanColumn::find_by_user_id(&pool, &user_id)
            .await
            .unwrap();
        
        assert_eq!(found_columns.len(), 3);
        assert_eq!(found_columns[0].title, "Column 2");
        assert_eq!(found_columns[1].title, "Column 3");
        assert_eq!(found_columns[2].title, "Column 1");
    }

    #[tokio::test]
    async fn test_kanban_card_ordering() {
        let pool = setup_test_db().await;
        let user_id = Uuid::new_v4().to_string();
        let now = Utc::now();

        // Créer une colonne
        let column = KanbanColumn {
            id: Uuid::new_v4().to_string(),
            title: "Test Column".to_string(),
            position: 0,
            user_id: user_id.clone(),
            created_at: now,
            updated_at: now,
        };
        column.create(&pool).await.unwrap();

        // Créer plusieurs cartes avec différentes positions
        let cards = vec![
            KanbanCard {
                id: Uuid::new_v4().to_string(),
                title: "Card 1".to_string(),
                description: None,
                position: 2,
                column_id: column.id.clone(),
                application_id: None,
                created_at: now,
                updated_at: now,
            },
            KanbanCard {
                id: Uuid::new_v4().to_string(),
                title: "Card 2".to_string(),
                description: None,
                position: 0,
                column_id: column.id.clone(),
                application_id: None,
                created_at: now,
                updated_at: now,
            },
            KanbanCard {
                id: Uuid::new_v4().to_string(),
                title: "Card 3".to_string(),
                description: None,
                position: 1,
                column_id: column.id.clone(),
                application_id: None,
                created_at: now,
                updated_at: now,
            },
        ];

        for card in &cards {
            card.create(&pool).await.unwrap();
        }

        // Vérifier que les cartes sont retournées dans l'ordre correct
        let found_cards = KanbanCard::find_by_column_id(&pool, &column.id)
            .await
            .unwrap();
        
        assert_eq!(found_cards.len(), 3);
        assert_eq!(found_cards[0].title, "Card 2");
        assert_eq!(found_cards[1].title, "Card 3");
        assert_eq!(found_cards[2].title, "Card 1");
    }

    #[tokio::test]
    async fn test_kanban_card_validation() {
        let pool = setup_test_db().await;
        let user_id = Uuid::new_v4().to_string();
        let now = Utc::now();

        // Test création avec colonne inexistante
        let card = KanbanCard {
            id: Uuid::new_v4().to_string(),
            title: "Test Card".to_string(),
            description: Some("Test Description".to_string()),
            order: 0,
            column_id: Uuid::new_v4().to_string(),
            created_at: now,
            updated_at: now,
        };

        let result = create_kanban_card(
            tauri::State::new(pool.clone()),
            card.title.clone(),
            card.description.clone(),
            card.order,
            card.column_id.clone(),
            None,
        ).await;
        
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("La colonne spécifiée n'existe pas"));

        // Test création avec titre vide
        let result = create_kanban_card(
            tauri::State::new(pool.clone()),
            "".to_string(),
            None,
            0,
            card.column_id.clone(),
            None,
        ).await;
        
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Le titre ne peut pas être vide"));
    }

    #[tokio::test]
    async fn test_kanban_card_update() {
        let pool = setup_test_db().await;
        let user_id = Uuid::new_v4().to_string();
        let now = Utc::now();

        // Créer une colonne
        let column = KanbanColumn {
            id: Uuid::new_v4().to_string(),
            title: "Test Column".to_string(),
            position: 0,
            user_id: user_id.clone(),
            created_at: now,
            updated_at: now,
        };
        column.create(&pool).await.unwrap();

        // Créer une carte
        let card = KanbanCard {
            id: Uuid::new_v4().to_string(),
            title: "Test Card".to_string(),
            description: Some("Test Description".to_string()),
            order: 0,
            column_id: column.id.clone(),
            created_at: now,
            updated_at: now,
        };
        card.create(&pool).await.unwrap();

        // Test mise à jour partielle
        let result = update_kanban_card(
            tauri::State::new(pool.clone()),
            card.id.clone(),
            Some("Updated Title".to_string()),
            None,
            None,
            None,
        ).await;
        
        assert!(result.is_ok());
        let updated_card = KanbanCard::find_by_id(&pool, &card.id).await.unwrap().unwrap();
        assert_eq!(updated_card.title, "Updated Title");
        assert_eq!(updated_card.description, Some("Test Description".to_string()));
        assert_eq!(updated_card.order, 0);
    }
} 