from datetime import datetime
from typing import Optional, List, Dict, Any
import sqlite3
import uuid
import contextlib

class Interview:
    def __init__(self, date: datetime, interview_type: str, notes: str):
        self.date = date
        self.interview_type = interview_type
        self.notes = notes

class Card:
    def __init__(
        self,
        id: str,
        title: str,
        description: str,
        status: str,
        job_id: str,
        created_at: datetime,
        updated_at: datetime,
        notes: Optional[str] = None,
        interviews: Optional[List[Interview]] = None
    ):
        self.id = id
        self.title = title
        self.description = description
        self.status = status
        self.job_id = job_id
        self.created_at = created_at
        self.updated_at = updated_at
        self.notes = notes
        self.interviews = interviews or []

class KanbanManager:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_db()

    @contextlib.contextmanager
    def _connect(self):
        """Gère la connexion à la base de données."""
        conn = sqlite3.connect(self.db_path)
        try:
            yield conn
        finally:
            conn.close()

    def _init_db(self):
        """Initialise la base de données avec les tables nécessaires."""
        with self._connect() as conn:
            cursor = conn.cursor()
            
            # Table des cartes
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS cards (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT,
                    status TEXT NOT NULL,
                    job_id TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    notes TEXT
                )
            ''')
            
            # Table des entretiens
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS interviews (
                    id TEXT PRIMARY KEY,
                    card_id TEXT NOT NULL,
                    date TEXT NOT NULL,
                    interview_type TEXT NOT NULL,
                    notes TEXT,
                    FOREIGN KEY (card_id) REFERENCES cards (id)
                )
            ''')
            
            conn.commit()

    def get_card(self, card_id: str) -> Card:
        """Récupère une carte par son ID."""
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Récupérer la carte
            cursor.execute('SELECT * FROM cards WHERE id = ?', (card_id,))
            card_data = cursor.fetchone()
            
            if not card_data:
                raise ValueError(f"Carte non trouvée avec l'ID {card_id}")
            
            # Récupérer les entretiens associés
            cursor.execute('SELECT * FROM interviews WHERE card_id = ?', (card_id,))
            interviews_data = cursor.fetchall()
            
            interviews = [
                Interview(
                    date=datetime.fromisoformat(i['date']),
                    interview_type=i['interview_type'],
                    notes=i['notes']
                )
                for i in interviews_data
            ]
            
            return Card(
                id=card_data['id'],
                title=card_data['title'],
                description=card_data['description'],
                status=card_data['status'],
                job_id=card_data['job_id'],
                created_at=datetime.fromisoformat(card_data['created_at']),
                updated_at=datetime.fromisoformat(card_data['updated_at']),
                notes=card_data['notes'],
                interviews=interviews
            )

    def update_card(self, card_id: str, card_data: Dict[str, Any]) -> Card:
        """Met à jour une carte existante."""
        with self._connect() as conn:
            cursor = conn.cursor()
            
            # Vérifier si la carte existe
            cursor.execute('SELECT id FROM cards WHERE id = ?', (card_id,))
            exists = cursor.fetchone() is not None
            
            current_time = datetime.now().isoformat()
            
            if exists:
                # Mettre à jour les champs de la carte
                update_fields = []
                update_values = []
                
                for field, value in card_data.items():
                    if field not in ['interviews', 'id'] and value is not None:
                        update_fields.append(f"{field} = ?")
                        update_values.append(value)
                
                if update_fields:
                    update_values.extend([current_time, card_id])
                    cursor.execute(
                        f"UPDATE cards SET {', '.join(update_fields)}, updated_at = ? WHERE id = ?",
                        update_values
                    )
            else:
                # Insérer une nouvelle carte
                fields = ['id']
                values = [card_id]
                
                for field, value in card_data.items():
                    if field not in ['interviews', 'id'] and value is not None:
                        fields.append(field)
                        values.append(value)
                
                fields.extend(['created_at', 'updated_at'])
                values.extend([current_time, current_time])
                
                placeholders = ','.join(['?' for _ in fields])
                cursor.execute(
                    f"INSERT INTO cards ({','.join(fields)}) VALUES ({placeholders})",
                    values
                )
            
            # Mettre à jour les entretiens si fournis
            if 'interviews' in card_data:
                # Supprimer les anciens entretiens
                cursor.execute('DELETE FROM interviews WHERE card_id = ?', (card_id,))
                
                # Ajouter les nouveaux entretiens
                for interview in card_data['interviews']:
                    interview_id = str(uuid.uuid4())
                    cursor.execute(
                        'INSERT INTO interviews (id, card_id, date, interview_type, notes) VALUES (?, ?, ?, ?, ?)',
                        (
                            interview_id,
                            card_id,
                            interview['date'],
                            interview['interview_type'],
                            interview['notes']
                        )
                    )
            
            conn.commit()
            
            return self.get_card(card_id)

    def delete_card(self, card_id: str):
        """Supprime une carte et ses entretiens associés."""
        with self._connect() as conn:
            cursor = conn.cursor()
            
            # Supprimer d'abord les entretiens
            cursor.execute('DELETE FROM interviews WHERE card_id = ?', (card_id,))
            
            # Puis supprimer la carte
            cursor.execute('DELETE FROM cards WHERE id = ?', (card_id,))
            
            conn.commit()

    def move_card(self, card_id: str, new_status: str) -> Card:
        """Déplace une carte vers un nouveau statut."""
        with self._connect() as conn:
            cursor = conn.cursor()
            
            cursor.execute(
                'UPDATE cards SET status = ?, updated_at = ? WHERE id = ?',
                (new_status, datetime.now().isoformat(), card_id)
            )
            
            conn.commit()
            
            return self.get_card(card_id) 