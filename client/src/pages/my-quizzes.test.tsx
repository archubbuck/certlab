import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import MyQuizzes from './my-quizzes';
import type { QuizTemplate } from '@shared/schema';

// Mock modules
vi.mock('@/lib/storage-factory', () => ({
  storage: {
    getUserQuizTemplates: vi.fn(),
    duplicateQuizTemplate: vi.fn(),
  },
}));

vi.mock('@/lib/auth-provider', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user', tenantId: 1 },
  })),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('MyQuizzes Page', () => {
  let queryClient: QueryClient;

  const mockTemplate: QuizTemplate = {
    id: 1,
    userId: 'test-user',
    tenantId: 1,
    title: 'Test Quiz',
    description: 'Test Description',
    instructions: 'Test Instructions',
    categoryIds: [1],
    subcategoryIds: [1],
    customQuestions: [
      {
        id: 'q1',
        text: 'Question 1',
        options: [
          { id: 0, text: 'Option 1' },
          { id: 1, text: 'Option 2' },
        ],
        correctAnswer: 0,
        explanation: 'Explanation',
        difficultyLevel: 2,
        type: 'multiple_choice',
        tags: [],
      },
    ],
    questionCount: 1,
    timeLimit: 30,
    passingScore: 70,
    maxAttempts: 3,
    difficultyLevel: 2,
    isPublished: false,
    isDraft: true,
    tags: ['test-tag'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <MyQuizzes />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('should render the page title and search input', async () => {
    const { storage } = await import('@/lib/storage-factory');
    vi.mocked(storage.getUserQuizTemplates).mockResolvedValue([]);

    renderComponent();

    expect(screen.getByText('My Quizzes')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Search quizzes by title, description, or tags...')
    ).toBeInTheDocument();
  });

  it('should display quiz templates when loaded', async () => {
    const { storage } = await import('@/lib/storage-factory');
    vi.mocked(storage.getUserQuizTemplates).mockResolvedValue([mockTemplate]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Quiz')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('test-tag')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('should show empty state when no quizzes exist', async () => {
    const { storage } = await import('@/lib/storage-factory');
    vi.mocked(storage.getUserQuizTemplates).mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No quizzes yet')).toBeInTheDocument();
    });

    expect(screen.getByText('Create your first custom quiz to get started')).toBeInTheDocument();
  });

  it('should filter templates by search query', async () => {
    const { storage } = await import('@/lib/storage-factory');
    const templates: QuizTemplate[] = [
      { ...mockTemplate, id: 1, title: 'CISSP Quiz' },
      { ...mockTemplate, id: 2, title: 'CISM Quiz' },
    ];
    vi.mocked(storage.getUserQuizTemplates).mockResolvedValue(templates);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('CISSP Quiz')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      'Search quizzes by title, description, or tags...'
    );
    await userEvent.type(searchInput, 'CISSP');

    await waitFor(() => {
      expect(screen.getByText('CISSP Quiz')).toBeInTheDocument();
      expect(screen.queryByText('CISM Quiz')).not.toBeInTheDocument();
    });
  });

  it('should navigate to quiz builder when create button is clicked', async () => {
    const { storage } = await import('@/lib/storage-factory');
    vi.mocked(storage.getUserQuizTemplates).mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Create New Quiz')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create New Quiz');
    await userEvent.click(createButton);

    expect(mockNavigate).toHaveBeenCalledWith('/app/quiz-builder');
  });

  it('should navigate to quiz builder when edit button is clicked', async () => {
    const { storage } = await import('@/lib/storage-factory');
    vi.mocked(storage.getUserQuizTemplates).mockResolvedValue([mockTemplate]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Quiz')).toBeInTheDocument();
    });

    // Find the edit button (it's the first button in the actions column)
    const editButtons = screen.getAllByRole('button', { name: '' });
    const editButton = editButtons.find((btn) => btn.querySelector('svg[class*="lucide-edit"]'));

    if (editButton) {
      await userEvent.click(editButton);
      expect(mockNavigate).toHaveBeenCalledWith('/app/quiz-builder?template=1');
    }
  });

  it('should open confirmation dialog when duplicate button is clicked', async () => {
    const { storage } = await import('@/lib/storage-factory');
    vi.mocked(storage.getUserQuizTemplates).mockResolvedValue([mockTemplate]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Quiz')).toBeInTheDocument();
    });

    // Find the duplicate button (it's the second button in the actions column)
    const buttons = screen.getAllByRole('button', { name: '' });
    const duplicateButton = buttons.find((btn) => btn.querySelector('svg[class*="lucide-copy"]'));

    if (duplicateButton) {
      await userEvent.click(duplicateButton);

      await waitFor(() => {
        expect(screen.getByText('Duplicate Quiz')).toBeInTheDocument();
      });

      expect(screen.getByText(/Are you sure you want to duplicate/)).toBeInTheDocument();
      expect(screen.getByText('Questions:')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    }
  });

  it('should call duplicateQuizTemplate when confirmed', async () => {
    const { storage } = await import('@/lib/storage-factory');
    const { useToast } = await import('@/hooks/use-toast');
    const mockToast = vi.fn();

    vi.mocked(storage.getUserQuizTemplates).mockResolvedValue([mockTemplate]);
    vi.mocked(storage.duplicateQuizTemplate).mockResolvedValue({
      ...mockTemplate,
      id: 2,
      title: 'Copy of Test Quiz',
    });
    vi.mocked(useToast).mockReturnValue({ toast: mockToast } as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Quiz')).toBeInTheDocument();
    });

    // Click duplicate button
    const buttons = screen.getAllByRole('button', { name: '' });
    const duplicateButton = buttons.find((btn) => btn.querySelector('svg[class*="lucide-copy"]'));

    if (duplicateButton) {
      await userEvent.click(duplicateButton);

      await waitFor(() => {
        expect(screen.getByText('Duplicate Quiz')).toBeInTheDocument();
      });

      // Click confirm button in dialog
      const confirmButton = screen.getByRole('button', { name: /Duplicate Quiz/i });
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(storage.duplicateQuizTemplate).toHaveBeenCalledWith(1, 'test-user');
      });
    }
  });

  it('should show error toast when duplication fails', async () => {
    const { storage } = await import('@/lib/storage-factory');
    const { useToast } = await import('@/hooks/use-toast');
    const mockToast = vi.fn();

    vi.mocked(storage.getUserQuizTemplates).mockResolvedValue([mockTemplate]);
    vi.mocked(storage.duplicateQuizTemplate).mockRejectedValue(new Error('Duplication failed'));
    vi.mocked(useToast).mockReturnValue({ toast: mockToast } as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Quiz')).toBeInTheDocument();
    });

    // Click duplicate button
    const buttons = screen.getAllByRole('button', { name: '' });
    const duplicateButton = buttons.find((btn) => btn.querySelector('svg[class*="lucide-copy"]'));

    if (duplicateButton) {
      await userEvent.click(duplicateButton);

      await waitFor(() => {
        expect(screen.getByText('Duplicate Quiz')).toBeInTheDocument();
      });

      // Click confirm button
      const confirmButton = screen.getByRole('button', { name: /Duplicate Quiz/i });
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Duplication Failed',
            variant: 'destructive',
          })
        );
      });
    }
  });
});
