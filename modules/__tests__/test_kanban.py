import pytest
from datetime import datetime
import os
import tempfile
import sys
from pathlib import Path

# Ajouter le répertoire parent au PYTHONPATH
sys.path.append(str(Path(__file__).parent.parent))
from kanban import KanbanManager, Card, Interview

@pytest.fixture
def db_path():
    """Crée une base de données temporaire pour les tests."""
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        return tmp.name

@pytest.fixture
def manager(db_path):
    """Crée une instance de KanbanManager avec une base de données temporaire."""
    return KanbanManager(db_path)

@pytest.fixture
def sample_card():
    """Retourne une carte de test."""
    return {
        'id': 'test-card-1',
        'title': 'Test Card',
        'description': 'Test Description',
        'status': 'applied',
        'job_id': 'job-1',
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'notes': 'Test Notes',
        'interviews': [
            {
                'date': datetime.now().isoformat(),
                'interview_type': 'phone',
                'notes': 'Test Interview Notes'
            }
        ]
    }

def test_init_db(manager):
    """Teste l'initialisation de la base de données."""
    # Vérifie que les tables existent
    with manager._connect() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        assert 'cards' in tables
        assert 'interviews' in tables

def test_create_and_get_card(manager, sample_card):
    """Teste la création et la récupération d'une carte."""
    # Créer une carte
    manager.update_card(sample_card['id'], sample_card)
    
    # Récupérer la carte
    card = manager.get_card(sample_card['id'])
    
    # Vérifier les données
    assert card.id == sample_card['id']
    assert card.title == sample_card['title']
    assert card.description == sample_card['description']
    assert card.status == sample_card['status']
    assert card.job_id == sample_card['job_id']
    assert card.notes == sample_card['notes']
    assert len(card.interviews) == 1
    assert card.interviews[0].interview_type == 'phone'

def test_update_card(manager, sample_card):
    """Teste la mise à jour d'une carte."""
    # Créer une carte initiale
    manager.update_card(sample_card['id'], sample_card)
    
    # Mettre à jour la carte
    update_data = {
        'title': 'Updated Title',
        'description': 'Updated Description',
        'notes': 'Updated Notes'
    }
    updated_card = manager.update_card(sample_card['id'], update_data)
    
    # Vérifier les mises à jour
    assert updated_card.title == 'Updated Title'
    assert updated_card.description == 'Updated Description'
    assert updated_card.notes == 'Updated Notes'
    assert updated_card.status == sample_card['status']  # Non modifié

def test_delete_card(manager, sample_card):
    """Teste la suppression d'une carte."""
    # Créer une carte
    manager.update_card(sample_card['id'], sample_card)
    
    # Supprimer la carte
    manager.delete_card(sample_card['id'])
    
    # Vérifier que la carte n'existe plus
    with pytest.raises(ValueError):
        manager.get_card(sample_card['id'])

def test_move_card(manager, sample_card):
    """Teste le déplacement d'une carte vers un nouveau statut."""
    # Créer une carte
    manager.update_card(sample_card['id'], sample_card)
    
    # Déplacer la carte
    new_status = 'interview'
    moved_card = manager.move_card(sample_card['id'], new_status)
    
    # Vérifier le nouveau statut
    assert moved_card.status == new_status
    assert moved_card.id == sample_card['id']

def test_card_not_found(manager):
    """Teste le cas où une carte n'est pas trouvée."""
    with pytest.raises(ValueError):
        manager.get_card('non-existent-id')

def test_invalid_card_data(manager):
    """Teste la gestion des données de carte invalides."""
    with pytest.raises(Exception):
        manager.update_card('test-id', {'invalid_field': 'value'})

def test_interview_management(manager, sample_card):
    """Teste la gestion des entretiens."""
    # Créer une carte avec un entretien
    manager.update_card(sample_card['id'], sample_card)
    
    # Ajouter un nouvel entretien
    new_interview = {
        'date': datetime.now().isoformat(),
        'interview_type': 'onsite',
        'notes': 'Second Interview'
    }
    update_data = {
        'interviews': [sample_card['interviews'][0], new_interview]
    }
    updated_card = manager.update_card(sample_card['id'], update_data)
    
    # Vérifier les entretiens
    assert len(updated_card.interviews) == 2
    assert any(i.interview_type == 'onsite' for i in updated_card.interviews)

def test_cleanup(db_path):
    """Nettoie la base de données temporaire après les tests."""
    if os.path.exists(db_path):
        os.unlink(db_path) 