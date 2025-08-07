import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExerciseItem from '@/components/ExerciseItem';

describe('ExerciseItem Component', () => {
  const mockOnClick = vi.fn();

  const mockExercise = {
    id: 1,
    name: 'Bench Press',
    sets: [
      { reps: 10, weight: 135 },
      { reps: 8, weight: 140 }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders exercise name correctly', () => {
      render(<ExerciseItem exercise={mockExercise} onClick={mockOnClick} />);
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
    });

    it('renders without onClick handler', () => {
      render(<ExerciseItem exercise={mockExercise} />);
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
    });

    it('displays ChevronRightIcon', () => {
      render(<ExerciseItem exercise={mockExercise} onClick={mockOnClick} />);
      const exerciseDiv = screen.getByText('Bench Press').closest('div').parentElement;
      const icon = exerciseDiv.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Sets Display Formatting', () => {
    it('displays "0 sets" for empty sets array', () => {
      const exerciseWithNoSets = {
        ...mockExercise,
        sets: []
      };
      render(<ExerciseItem exercise={exerciseWithNoSets} onClick={mockOnClick} />);
      expect(screen.getByText('0 sets')).toBeInTheDocument();
    });

    it('displays identical sets correctly', () => {
      const exerciseWithIdenticalSets = {
        ...mockExercise,
        sets: [
          { reps: 10, weight: 135 },
          { reps: 10, weight: 135 },
          { reps: 10, weight: 135 }
        ]
      };
      render(<ExerciseItem exercise={exerciseWithIdenticalSets} onClick={mockOnClick} />);
      expect(screen.getByText('3 sets × 10 reps · 135 kg')).toBeInTheDocument();
    });

    it('displays varied sets with details', () => {
      render(<ExerciseItem exercise={mockExercise} onClick={mockOnClick} />);
      expect(screen.getByText('2 sets: 135×10, 140×8')).toBeInTheDocument();
    });

    it('handles sets with RPE correctly for identical sets', () => {
      const exerciseWithRPE = {
        ...mockExercise,
        sets: [
          { reps: 10, weight: 135, rpe: 7 },
          { reps: 10, weight: 135, rpe: 8 }
        ]
      };
      render(<ExerciseItem exercise={exerciseWithRPE} onClick={mockOnClick} />);
      expect(screen.getByText('2 sets × 10 reps · 135 kg · RPE 7.5')).toBeInTheDocument();
    });

    it('handles sets with RPE correctly for varied sets', () => {
      const exerciseWithVariedRPE = {
        ...mockExercise,
        sets: [
          { reps: 10, weight: 135, rpe: 7 },
          { reps: 8, weight: 140, rpe: 9 }
        ]
      };
      render(<ExerciseItem exercise={exerciseWithVariedRPE} onClick={mockOnClick} />);
      expect(screen.getByText('2 sets: 135×10@7, 140×8@9')).toBeInTheDocument();
    });

    it('handles sets with zero weight correctly', () => {
      const exerciseWithNoWeight = {
        ...mockExercise,
        sets: [
          { reps: 15, weight: 0 },
          { reps: 12, weight: 0 }
        ]
      };
      render(<ExerciseItem exercise={exerciseWithNoWeight} onClick={mockOnClick} />);
      expect(screen.getByText('2 sets: 15 reps, 12 reps')).toBeInTheDocument();
    });

    it('handles sets with missing weight property', () => {
      const exerciseWithMissingWeight = {
        ...mockExercise,
        sets: [
          { reps: 15 },
          { reps: 12 }
        ]
      };
      render(<ExerciseItem exercise={exerciseWithMissingWeight} onClick={mockOnClick} />);
      expect(screen.getByText('2 sets: 15 reps, 12 reps')).toBeInTheDocument();
    });

    it('handles sets with missing reps property', () => {
      const exerciseWithMissingReps = {
        ...mockExercise,
        sets: [
          { weight: 135 },
          { weight: 140 }
        ]
      };
      render(<ExerciseItem exercise={exerciseWithMissingReps} onClick={mockOnClick} />);
      expect(screen.getByText('2 sets: 135×0, 140×0')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onClick with exercise name when clicked', () => {
      render(<ExerciseItem exercise={mockExercise} onClick={mockOnClick} />);
      
      const exerciseItem = screen.getByText('Bench Press').closest('div').parentElement;
      fireEvent.click(exerciseItem);
      
      expect(mockOnClick).toHaveBeenCalledWith('Bench Press');
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when no handler provided', () => {
      render(<ExerciseItem exercise={mockExercise} />);
      
      const exerciseItem = screen.getByText('Bench Press').closest('div');
      fireEvent.click(exerciseItem);
      
      // Should not throw error and mockOnClick should not be called
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles null or undefined sets gracefully', () => {
      const exerciseWithNullSets = {
        ...mockExercise,
        sets: null
      };
      render(<ExerciseItem exercise={exerciseWithNullSets} onClick={mockOnClick} />);
      expect(screen.getByText('0 sets')).toBeInTheDocument();
    });

    it('handles exercise with very long name', () => {
      const exerciseWithLongName = {
        ...mockExercise,
        name: 'Very Long Exercise Name That Should Still Display Properly'
      };
      render(<ExerciseItem exercise={exerciseWithLongName} onClick={mockOnClick} />);
      expect(screen.getByText('Very Long Exercise Name That Should Still Display Properly')).toBeInTheDocument();
    });

    it('handles single set correctly', () => {
      const exerciseWithSingleSet = {
        ...mockExercise,
        sets: [{ reps: 10, weight: 135 }]
      };
      render(<ExerciseItem exercise={exerciseWithSingleSet} onClick={mockOnClick} />);
      expect(screen.getByText('1 sets × 10 reps · 135 kg')).toBeInTheDocument();
    });

    it('handles fractional RPE values', () => {
      const exerciseWithFractionalRPE = {
        ...mockExercise,
        sets: [
          { reps: 10, weight: 135, rpe: 7.5 },
          { reps: 10, weight: 135, rpe: 8.5 }
        ]
      };
      render(<ExerciseItem exercise={exerciseWithFractionalRPE} onClick={mockOnClick} />);
      expect(screen.getByText('2 sets × 10 reps · 135 kg · RPE 8.0')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper text structure for screen readers', () => {
      render(<ExerciseItem exercise={mockExercise} onClick={mockOnClick} />);
      
      const exerciseName = screen.getByText('Bench Press');
      const setsInfo = screen.getByText('2 sets: 135×10, 140×8');
      
      expect(exerciseName).toBeInTheDocument();
      expect(setsInfo).toBeInTheDocument();
    });
  });
});