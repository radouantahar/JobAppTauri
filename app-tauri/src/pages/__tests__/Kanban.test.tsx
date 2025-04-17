import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Kanban } from '../Kanban';
import { kanbanService } from '../../services/api';
import { useAppStore } from '../../store';

// Mock des services et hooks
vi.mock('../../services/api', () => ({
  kanbanService: {
    getKanbanColumns: vi.fn(),
    moveCard: vi.fn(),
  },
}));

vi.mock('../../store', () => ({
  useAppStore: vi.fn(),
}));

// Mock des icônes
vi.mock('@tabler/icons-react', () => ({
  IconPlus: () => <span data-testid="icon-plus">➕</span>,
  IconArrowRight: () => <span data-testid="icon-arrow-right">➡️</span>,
}));

describe('Kanban', () => {
  it('renders without crashing', () => {
    render(<Kanban />);
  });

  const mockColumns = [
    {
      id: 1,
      name: 'À postuler',
      color: 'blue',
      cards: [
        {
          id: 1,
          job: {
            title: 'Développeur Full Stack',
            company: 'Tech Corp',
          },
          appliedAt: null,
        },
      ],
    },
    {
      id: 2,
      name: 'En cours',
      color: 'yellow',
      cards: [
        {
          id: 2,
          job: {
            title: 'Ingénieur DevOps',
            company: 'Cloud Inc',
          },
          appliedAt: '2024-04-15',
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAppStore as any).mockReturnValue({
      setLoading: vi.fn(),
    });
    (kanbanService.getKanbanColumns as any).mockResolvedValue(mockColumns);
    (kanbanService.moveCard as any).mockResolvedValue(true);
  });

  it('devrait charger et afficher les colonnes du Kanban', async () => {
    render(<Kanban />);

    // Vérifier que les colonnes sont chargées
    await waitFor(() => {
      expect(screen.getByText('À postuler')).toBeInTheDocument();
      expect(screen.getByText('En cours')).toBeInTheDocument();
    });

    // Vérifier le contenu des cartes
    expect(screen.getByText('Développeur Full Stack')).toBeInTheDocument();
    expect(screen.getByText('Ingénieur DevOps')).toBeInTheDocument();
  });

  it('devrait afficher le bouton "Ajouter une offre"', () => {
    render(<Kanban />);
    expect(screen.getByText('Ajouter une offre')).toBeInTheDocument();
  });

  it('devrait gérer le déplacement d\'une carte vers la colonne suivante', async () => {
    render(<Kanban />);

    // Attendre que les colonnes soient chargées
    await waitFor(() => {
      expect(screen.getByText('À postuler')).toBeInTheDocument();
    });

    // Cliquer sur le bouton "Suivant" de la première carte
    const nextButtons = screen.getAllByText('Suivant');
    fireEvent.click(nextButtons[0]);

    // Vérifier que moveCard a été appelé avec les bons paramètres
    await waitFor(() => {
      expect(kanbanService.moveCard).toHaveBeenCalledWith(1, 2, 0);
    });
  });

  it('devrait afficher "Non postulé" pour les cartes sans date de candidature', async () => {
    render(<Kanban />);

    await waitFor(() => {
      expect(screen.getByText('Non postulé')).toBeInTheDocument();
    });
  });

  it('devrait afficher la date de candidature au format français', async () => {
    render(<Kanban />);

    await waitFor(() => {
      expect(screen.getByText('15/04/2024')).toBeInTheDocument();
    });
  });

  it('devrait gérer les erreurs lors du chargement des colonnes', async () => {
    (kanbanService.getKanbanColumns as any).mockRejectedValue(new Error('Erreur de chargement'));

    render(<Kanban />);

    // Vérifier que setLoading a été appelé correctement
    await waitFor(() => {
      expect(useAppStore().setLoading).toHaveBeenCalledWith(false);
    });
  });

  it('devrait gérer les erreurs lors du déplacement d\'une carte', async () => {
    (kanbanService.moveCard as any).mockRejectedValue(new Error('Erreur de déplacement'));

    render(<Kanban />);

    // Attendre que les colonnes soient chargées
    await waitFor(() => {
      expect(screen.getByText('À postuler')).toBeInTheDocument();
    });

    // Cliquer sur le bouton "Suivant"
    const nextButtons = screen.getAllByText('Suivant');
    fireEvent.click(nextButtons[0]);

    // Vérifier que setLoading a été appelé correctement
    await waitFor(() => {
      expect(useAppStore().setLoading).toHaveBeenCalledWith(false);
    });
  });

  it('devrait afficher le nombre de cartes dans chaque colonne', async () => {
    render(<Kanban />);

    await waitFor(() => {
      const badges = screen.getAllByText('1');
      expect(badges).toHaveLength(2); // Une badge pour chaque colonne
    });
  });

  it('devrait afficher un message quand une colonne est vide', async () => {
    const emptyColumns = [
      {
        id: 1,
        name: 'Vide',
        color: 'gray',
        cards: [],
      },
    ];

    (kanbanService.getKanbanColumns as any).mockResolvedValue(emptyColumns);

    render(<Kanban />);

    await waitFor(() => {
      expect(screen.getByText('Aucune offre dans cette colonne')).toBeInTheDocument();
    });
  });
}); 