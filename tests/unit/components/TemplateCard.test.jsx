import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TemplateCard from '@/components/TemplateCard';

// CRITICAL: Mock navigator.clipboard for user-event library
if (!global.navigator) {
  global.navigator = {};
}
if (!global.navigator.clipboard) {
  global.navigator.clipboard = {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve('')),
    write: vi.fn(() => Promise.resolve()),
    read: vi.fn(() => Promise.resolve())
  };
}

describe('TemplateCard Component', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  const mockTemplate = {
    id: 1,
    name: 'Push Day',
    description: 'Chest, shoulders, and triceps workout',
    isDefault: false,
    templateExercises: [
      {
        id: 1,
        exerciseName: 'Bench Press',
        restSeconds: 90
      },
      {
        id: 2,
        exerciseName: 'Shoulder Press',
        restSeconds: 60
      },
      {
        id: 3,
        exerciseName: 'Tricep Dips'
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders template name correctly', () => {
      render(<TemplateCard template={mockTemplate} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      
      expect(screen.getByText('Push Day')).toBeInTheDocument();
    });

    it('renders template description when provided', () => {
      render(<TemplateCard template={mockTemplate} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      
      expect(screen.getByText('Chest, shoulders, and triceps workout')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      const templateWithoutDescription = { ...mockTemplate, description: undefined };
      render(<TemplateCard template={templateWithoutDescription} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      
      expect(screen.queryByText('Chest, shoulders, and triceps workout')).not.toBeInTheDocument();
    });

    it('displays exercise count correctly', () => {
      render(<TemplateCard template={mockTemplate} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      
      expect(screen.getByText('3 exercises')).toBeInTheDocument();
    });

    it('shows default badge for default templates', () => {
      const defaultTemplate = { ...mockTemplate, isDefault: true };
      render(<TemplateCard template={defaultTemplate} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      
      expect(screen.getByText('Default')).toBeInTheDocument();
    });

    it('does not show default badge for non-default templates', () => {
      render(<TemplateCard template={mockTemplate} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      
      expect(screen.queryByText('Default')).not.toBeInTheDocument();
    });

    it('shows rest times indicator when exercises have rest times', () => {
      render(<TemplateCard template={mockTemplate} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      
      expect(screen.getByText('Rest times included')).toBeInTheDocument();
    });

    it('does not show rest times indicator when no exercises have rest times', () => {
      const templateWithoutRestTimes = {
        ...mockTemplate,
        templateExercises: [
          { id: 1, exerciseName: 'Bench Press' },
          { id: 2, exerciseName: 'Shoulder Press' }
        ]
      };
      render(<TemplateCard template={templateWithoutRestTimes} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      
      expect(screen.queryByText('Rest times included')).not.toBeInTheDocument();
    });
  });

  describe('Exercise Preview', () => {
    it('displays first 3 exercises', () => {
      render(<TemplateCard template={mockTemplate} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
      expect(screen.getByText('Shoulder Press')).toBeInTheDocument();
      expect(screen.getByText('Tricep Dips')).toBeInTheDocument();
    });

    it('shows overflow indicator when more than 3 exercises', () => {
      const templateWithManyExercises = {
        ...mockTemplate,
        templateExercises: [
          { id: 1, exerciseName: 'Exercise 1' },
          { id: 2, exerciseName: 'Exercise 2' },
          { id: 3, exerciseName: 'Exercise 3' },
          { id: 4, exerciseName: 'Exercise 4' },
          { id: 5, exerciseName: 'Exercise 5' }
        ]
      };
      render(<TemplateCard template={templateWithManyExercises} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      
      expect(screen.getByText('Exercise 1')).toBeInTheDocument();
      expect(screen.getByText('Exercise 2')).toBeInTheDocument();
      expect(screen.getByText('Exercise 3')).toBeInTheDocument();
      expect(screen.getByText('+2 more')).toBeInTheDocument();
      expect(screen.queryByText('Exercise 4')).not.toBeInTheDocument();
    });

    it('does not show exercise preview when no exercises', () => {
      const templateWithoutExercises = {
        ...mockTemplate,
        templateExercises: []
      };
      render(<TemplateCard template={templateWithoutExercises} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      
      expect(screen.queryByText('Bench Press')).not.toBeInTheDocument();
    });

    it('handles null templateExercises gracefully', () => {
      const templateWithNullExercises = {
        ...mockTemplate,
        templateExercises: null
      };
      render(<TemplateCard template={templateWithNullExercises} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      
      expect(screen.getByText('0 exercises')).toBeInTheDocument();
    });

    it('handles undefined templateExercises gracefully', () => {
      const templateWithUndefinedExercises = {
        ...mockTemplate,
        templateExercises: undefined
      };
      render(<TemplateCard template={templateWithUndefinedExercises} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      
      expect(screen.getByText('0 exercises')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('calls onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<TemplateCard template={mockTemplate} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      
      const editButton = screen.getByText('Edit');
      await user.click(editButton);
      
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('calls onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<TemplateCard template={mockTemplate} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      
      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);
      
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it('disables delete button for default templates', () => {
      const defaultTemplate = { ...mockTemplate, isDefault: true };
      render(<TemplateCard template={defaultTemplate} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      
      const deleteButton = screen.getByText('Delete');
      expect(deleteButton).toBeDisabled();
    });



    it('does not call onDelete when delete button is disabled', async () => {
      const user = userEvent.setup();
      const defaultTemplate = { ...mockTemplate, isDefault: true };
      render(<TemplateCard template={defaultTemplate} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      
      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);
      
      expect(mockOnDelete).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('shows loading state when isDeleting is true', () => {
      render(<TemplateCard template={mockTemplate} onEdit={mockOnEdit} onDelete={mockOnDelete} isDeleting={true} />);
      
      expect(screen.getByText('Deleting...')).toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('shows spinner icon when deleting', () => {
      render(<TemplateCard template={mockTemplate} onEdit={mockOnEdit} onDelete={mockOnDelete} isDeleting={true} />);
      
      const spinner = document.querySelector('svg');
      expect(spinner).toBeInTheDocument();
    });

    it('disables both buttons when deleting', () => {
      render(<TemplateCard template={mockTemplate} onEdit={mockOnEdit} onDelete={mockOnDelete} isDeleting={true} />);
      
      const editButton = screen.getByText('Edit');
      const deleteButton = screen.getByText('Deleting...');
      
      expect(editButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
    });

    it('shows normal state when not deleting', () => {
      render(<TemplateCard template={mockTemplate} onEdit={mockOnEdit} onDelete={mockOnDelete} isDeleting={false} />);
      
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.queryByText('Deleting...')).not.toBeInTheDocument();
      expect(screen.queryByText('.animate-spin')).not.toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('renders file text icon for exercise count', () => {
      render(<TemplateCard template={mockTemplate} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      
      const exerciseCountSection = screen.getByText('3 exercises').parentElement;
      const icon = exerciseCountSection.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders clock icon for rest times', () => {
      render(<TemplateCard template={mockTemplate} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      
      const restTimesSection = screen.getByText('Rest times included').parentElement;
      const icon = restTimesSection.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders edit icon in edit button', () => {
      render(<TemplateCard template={mockTemplate} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      
      const editButton = screen.getByText('Edit');
      const icon = editButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders trash icon in delete button', () => {
      render(<TemplateCard template={mockTemplate} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      
      const deleteButton = screen.getByText('Delete');
      const icon = deleteButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });


  describe('Edge Cases', () => {
    it('handles template with very long name', () => {
      const templateWithLongName = {
        ...mockTemplate,
        name: 'Very Long Template Name That Should Still Display Properly Without Breaking Layout'
      };
      render(<TemplateCard template={templateWithLongName} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      
      expect(screen.getByText('Very Long Template Name That Should Still Display Properly Without Breaking Layout')).toBeInTheDocument();
    });

    it('handles template with very long description', () => {
      const templateWithLongDescription = {
        ...mockTemplate,
        description: 'This is a very long description that should still display properly without breaking the card layout or causing any visual issues'
      };
      render(<TemplateCard template={templateWithLongDescription} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      
      expect(screen.getByText('This is a very long description that should still display properly without breaking the card layout or causing any visual issues')).toBeInTheDocument();
    });

    it('handles exercise with very long name', () => {
      const templateWithLongExerciseName = {
        ...mockTemplate,
        templateExercises: [
          {
            id: 1,
            exerciseName: 'Very Long Exercise Name That Should Fit In Tag'
          }
        ]
      };
      render(<TemplateCard template={templateWithLongExerciseName} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      
      expect(screen.getByText('Very Long Exercise Name That Should Fit In Tag')).toBeInTheDocument();
    });

    it('handles template with exactly 3 exercises (no overflow)', () => {
      const templateWithExactly3Exercises = {
        ...mockTemplate,
        templateExercises: [
          { id: 1, exerciseName: 'Exercise 1' },
          { id: 2, exerciseName: 'Exercise 2' },
          { id: 3, exerciseName: 'Exercise 3' }
        ]
      };
      render(<TemplateCard template={templateWithExactly3Exercises} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      
      expect(screen.getByText('Exercise 1')).toBeInTheDocument();
      expect(screen.getByText('Exercise 2')).toBeInTheDocument();
      expect(screen.getByText('Exercise 3')).toBeInTheDocument();
      expect(screen.queryByText('+0 more')).not.toBeInTheDocument();
    });

    it('handles single exercise template', () => {
      const templateWithSingleExercise = {
        ...mockTemplate,
        templateExercises: [
          { id: 1, exerciseName: 'Single Exercise' }
        ]
      };
      render(<TemplateCard template={templateWithSingleExercise} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      
      expect(screen.getByText('1 exercises')).toBeInTheDocument();
      expect(screen.getByText('Single Exercise')).toBeInTheDocument();
    });
  });
});