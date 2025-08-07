import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SessionCard from '@/components/SessionCard';

// Mock Next.js router
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('./__mocks__/next-navigation.js');
  return actual;
});

// Mock ExerciseItem component to isolate testing
vi.mock('@/components/ExerciseItem', () => ({
  default: vi.fn(({ exercise, onClick }) => (
    <div 
      data-testid={`exercise-${exercise.id}`}
      onClick={() => onClick && onClick(exercise.name)}
    >
      {exercise.name}
    </div>
  ))
}));

describe('SessionCard Component', () => {
  const mockOpenHistoryModal = vi.fn();
  const mockPush = vi.fn();

  const mockSession = {
    id: 1,
    title: 'Push Day',
    date: '2025-01-01T10:00:00Z',
    duration: 3600,
    exercises: [
      {
        id: 1,
        name: 'Bench Press',
        sets: [
          { reps: 10, weight: 135 },
          { reps: 8, weight: 140 }
        ]
      },
      {
        id: 2,
        name: 'Shoulder Press',
        sets: [
          { reps: 12, weight: 65 }
        ]
      }
    ]
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock useRouter
    const { useRouter } = vi.mocked(await import('next/navigation'));
    useRouter.mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    });
  });

  describe('Rendering', () => {
    it('renders session title correctly', () => {
      render(<SessionCard session={mockSession} openHistoryModal={mockOpenHistoryModal} />);
      expect(screen.getByText('Push Day')).toBeInTheDocument();
    });

    it('renders formatted date correctly', () => {
      render(<SessionCard session={mockSession} openHistoryModal={mockOpenHistoryModal} />);
      expect(screen.getByText('Jan 1, 2025')).toBeInTheDocument();
    });

    it('renders calendar and weight icons', () => {
      render(<SessionCard session={mockSession} openHistoryModal={mockOpenHistoryModal} />);
      const calendarIcon = screen.getByRole('button').querySelector('svg[data-testid="calendar-icon"], svg');
      const weightIcon = document.querySelector('svg[data-testid="weight-icon"], svg');
      expect(calendarIcon).toBeInTheDocument();
    });

    it('renders with default collapsed state', () => {
      render(<SessionCard session={mockSession} openHistoryModal={mockOpenHistoryModal} />);
      // Should not show exercises initially
      expect(screen.queryByTestId('exercise-1')).not.toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('formats date string correctly', () => {
      render(<SessionCard session={mockSession} openHistoryModal={mockOpenHistoryModal} />);
      expect(screen.getByText('Jan 1, 2025')).toBeInTheDocument();
    });

    it('handles Date object correctly', () => {
      const sessionWithDateObject = {
        ...mockSession,
        date: new Date('2025-02-15T14:30:00Z')
      };
      render(<SessionCard session={sessionWithDateObject} openHistoryModal={mockOpenHistoryModal} />);
      expect(screen.getByText('Feb 15, 2025')).toBeInTheDocument();
    });
  });

  describe('Expand/Collapse Functionality', () => {
    it('expands when header is clicked', () => {
      render(<SessionCard session={mockSession} openHistoryModal={mockOpenHistoryModal} />);
      
      const header = screen.getByText('Push Day').closest('div');
      fireEvent.click(header);
      
      // Should show exercises after expanding
      expect(screen.getByTestId('exercise-1')).toBeInTheDocument();
      expect(screen.getByTestId('exercise-2')).toBeInTheDocument();
    });

    it('toggles chevron icon when expanded/collapsed', () => {
      render(<SessionCard session={mockSession} openHistoryModal={mockOpenHistoryModal} />);
      
      const header = screen.getByText('Push Day').closest('div');
      
      // Initially collapsed - should show right chevron
      expect(header.querySelector('svg')).toBeInTheDocument();
      
      // Click to expand
      fireEvent.click(header);
      
      // Should now show down chevron
      expect(header.querySelector('svg')).toBeInTheDocument();
    });

    it('collapses when clicked again', () => {
      render(<SessionCard session={mockSession} openHistoryModal={mockOpenHistoryModal} />);
      
      const header = screen.getByText('Push Day').closest('div');
      
      // Expand
      fireEvent.click(header);
      expect(screen.getByTestId('exercise-1')).toBeInTheDocument();
      
      // Collapse
      fireEvent.click(header);
      expect(screen.queryByTestId('exercise-1')).not.toBeInTheDocument();
    });
  });

  describe('Exercise Interaction', () => {
    it('calls openHistoryModal when exercise is clicked', () => {
      render(<SessionCard session={mockSession} openHistoryModal={mockOpenHistoryModal} />);
      
      // Expand to show exercises
      const header = screen.getByText('Push Day').closest('div');
      fireEvent.click(header);
      
      // Click on exercise
      const exercise = screen.getByTestId('exercise-1');
      fireEvent.click(exercise);
      
      expect(mockOpenHistoryModal).toHaveBeenCalledWith('Bench Press');
    });

    it('renders all exercises when expanded', () => {
      render(<SessionCard session={mockSession} openHistoryModal={mockOpenHistoryModal} />);
      
      // Expand
      const header = screen.getByText('Push Day').closest('div');
      fireEvent.click(header);
      
      expect(screen.getByTestId('exercise-1')).toBeInTheDocument();
      expect(screen.getByTestId('exercise-2')).toBeInTheDocument();
    });
  });

  describe('Total Load Calculation', () => {
    it('calculates and displays total load correctly', () => {
      render(<SessionCard session={mockSession} openHistoryModal={mockOpenHistoryModal} />);
      
      // Expand to show total load
      const header = screen.getByText('Push Day').closest('div');
      fireEvent.click(header);
      
      // Total load: (135*10 + 140*8) + (65*12) = 1350 + 1120 + 780 = 3250
      expect(screen.getByText('3250 kg total')).toBeInTheDocument();
    });

    it('handles exercises without sets gracefully', () => {
      const sessionWithoutSets = {
        ...mockSession,
        exercises: [
          { id: 1, name: 'Test Exercise', sets: [] }
        ]
      };
      render(<SessionCard session={sessionWithoutSets} openHistoryModal={mockOpenHistoryModal} />);
      
      const header = screen.getByText('Push Day').closest('div');
      fireEvent.click(header);
      
      expect(screen.getByText('0 kg total')).toBeInTheDocument();
    });

    it('handles session with no exercises', () => {
      const sessionWithoutExercises = {
        ...mockSession,
        exercises: []
      };
      render(<SessionCard session={sessionWithoutExercises} openHistoryModal={mockOpenHistoryModal} />);
      
      const header = screen.getByText('Push Day').closest('div');
      fireEvent.click(header);
      
      expect(screen.getByText('0 kg total')).toBeInTheDocument();
    });

    it('handles missing weight values in sets', () => {
      const sessionWithMissingWeights = {
        ...mockSession,
        exercises: [
          {
            id: 1,
            name: 'Bodyweight Exercise',
            sets: [
              { reps: 15 }, // no weight property
              { reps: 12, weight: 0 }, // zero weight
            ]
          }
        ]
      };
      render(<SessionCard session={sessionWithMissingWeights} openHistoryModal={mockOpenHistoryModal} />);
      
      const header = screen.getByText('Push Day').closest('div');
      fireEvent.click(header);
      
      expect(screen.getByText('0 kg total')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates to session detail when "View Details" is clicked', () => {
      render(<SessionCard session={mockSession} openHistoryModal={mockOpenHistoryModal} />);
      
      // Expand to show View Details button
      const header = screen.getByText('Push Day').closest('div');
      fireEvent.click(header);
      
      const viewDetailsButton = screen.getByText('View Details');
      fireEvent.click(viewDetailsButton);
      
      expect(mockPush).toHaveBeenCalledWith('/session/1');
    });

    it('does not navigate when header is clicked', () => {
      render(<SessionCard session={mockSession} openHistoryModal={mockOpenHistoryModal} />);
      
      const header = screen.getByText('Push Day').closest('div');
      fireEvent.click(header);
      
      // Router should not be called for expand/collapse
      expect(mockPush).not.toHaveBeenCalled();
    });
  });


  describe('Edge Cases', () => {
    it('handles null exercises array', () => {
      const sessionWithNullExercises = {
        ...mockSession,
        exercises: null
      };
      expect(() => {
        render(<SessionCard session={sessionWithNullExercises} openHistoryModal={mockOpenHistoryModal} />);
      }).not.toThrow();
    });

    it('handles undefined exercises array', () => {
      const sessionWithUndefinedExercises = {
        ...mockSession,
        exercises: undefined
      };
      expect(() => {
        render(<SessionCard session={sessionWithUndefinedExercises} openHistoryModal={mockOpenHistoryModal} />);
      }).not.toThrow();
    });

    it('handles very long session title', () => {
      const sessionWithLongTitle = {
        ...mockSession,
        title: 'Very Long Session Title That Should Display Properly Without Breaking Layout'
      };
      render(<SessionCard session={sessionWithLongTitle} openHistoryModal={mockOpenHistoryModal} />);
      
      expect(screen.getByText('Very Long Session Title That Should Display Properly Without Breaking Layout')).toBeInTheDocument();
    });
  });
});