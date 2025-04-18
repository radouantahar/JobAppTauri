-- Create kanban_columns table
CREATE TABLE IF NOT EXISTS kanban_columns (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    position INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create kanban_cards table
CREATE TABLE IF NOT EXISTS kanban_cards (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    position INTEGER NOT NULL,
    column_id TEXT NOT NULL,
    application_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (column_id) REFERENCES kanban_columns(id) ON DELETE CASCADE,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL
);

-- Create job_stats table
CREATE TABLE IF NOT EXISTS job_stats (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    total_applications INTEGER DEFAULT 0,
    applications_this_week INTEGER DEFAULT 0,
    applications_this_month INTEGER DEFAULT 0,
    interviews_scheduled INTEGER DEFAULT 0,
    offers_received INTEGER DEFAULT 0,
    rejections INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create triggers to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_kanban_columns_timestamp 
AFTER UPDATE ON kanban_columns
BEGIN
    UPDATE kanban_columns SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_kanban_cards_timestamp 
AFTER UPDATE ON kanban_cards
BEGIN
    UPDATE kanban_cards SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_job_stats_timestamp 
AFTER UPDATE ON job_stats
BEGIN
    UPDATE job_stats SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END; 