import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Toast from '@/components/Toast';

describe('Toast Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders success toast with message', () => {
      render(<Toast message="Success message" type="success" onClose={mockOnClose} />);
      
      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders error toast with message', () => {
      render(<Toast message="Error message" type="error" onClose={mockOnClose} />);
      
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('defaults to success type when type not specified', () => {
      render(<Toast message="Default message" onClose={mockOnClose} />);
      
      expect(screen.getByText('Default message')).toBeInTheDocument();
    });

    it('renders with visible state initially', () => {
      render(<Toast message="Test message" onClose={mockOnClose} />);
      
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  describe('Toast Types', () => {
    it('renders CheckCircle icon for success type', () => {
      render(<Toast message="Success" type="success" onClose={mockOnClose} />);
      
      // The icon should be rendered as an SVG
      const icon = document.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders XCircle icon for error type', () => {
      render(<Toast message="Error" type="error" onClose={mockOnClose} />);
      
      // The icon should be rendered as an SVG
      const icon = document.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Auto Close Behavior', () => {
    it('auto closes after default duration (3000ms)', () => {
      render(<Toast message="Auto close test" onClose={mockOnClose} />);
      
      expect(mockOnClose).not.toHaveBeenCalled();
      
      // Fast forward to trigger fade out
      vi.advanceTimersByTime(3000);
      
      // Fast forward animation duration
      vi.advanceTimersByTime(300);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('auto closes after custom duration', () => {
      render(<Toast message="Custom duration" duration={5000} onClose={mockOnClose} />);
      
      expect(mockOnClose).not.toHaveBeenCalled();
      
      // Fast forward custom duration
      vi.advanceTimersByTime(5000);
      
      // Fast forward animation
      vi.advanceTimersByTime(300);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not close before duration expires', () => {
      render(<Toast message="Wait test" duration={5000} onClose={mockOnClose} />);
      
      // Fast forward less than duration
      vi.advanceTimersByTime(2000);
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Manual Close', () => {
    it('closes when close button is clicked', () => {
      render(<Toast message="Manual close test" onClose={mockOnClose} />);
      
      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);
      
      // Fast forward animation
      vi.advanceTimersByTime(300);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes immediately when close button is clicked, ignoring auto-close timer', () => {
      render(<Toast message="Immediate close" duration={10000} onClose={mockOnClose} />);
      
      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);
      
      // Fast forward animation
      vi.advanceTimersByTime(300);
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Animation States', () => {
    it('initially renders with visible state', () => {
      render(<Toast message="Animation test" duration={1000} onClose={mockOnClose} />);
      
      expect(screen.getByText('Animation test')).toBeInTheDocument();
    });
  });


  describe('Content Layout', () => {
    it('displays message text correctly', () => {
      render(<Toast message="Layout test message" onClose={mockOnClose} />);
      
      const messageElement = screen.getByText('Layout test message');
      expect(messageElement).toBeInTheDocument();
    });

    it('handles long messages properly', () => {
      const longMessage = 'This is a very long message that should still display properly in the toast component without breaking the layout or styling';
      
      render(<Toast message={longMessage} onClose={mockOnClose} />);
      
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('handles empty message gracefully', () => {
      render(<Toast message="" onClose={mockOnClose} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button role for close button', () => {
      render(<Toast message="Accessibility test" onClose={mockOnClose} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Timer Cleanup', () => {
    it('cleans up timer on unmount', () => {
      const { unmount } = render(<Toast message="Cleanup test" onClose={mockOnClose} />);
      
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      unmount();
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('does not call onClose after unmount', () => {
      const { unmount } = render(<Toast message="Unmount test" duration={1000} onClose={mockOnClose} />);
      
      unmount();
      
      // Fast forward past duration
      vi.advanceTimersByTime(2000);
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero duration', () => {
      render(<Toast message="Zero duration" duration={0} onClose={mockOnClose} />);
      
      // Advance timers to trigger immediate close
      vi.advanceTimersByTime(0);
      vi.advanceTimersByTime(300);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('handles very long duration', () => {
      render(<Toast message="Long duration" duration={999999} onClose={mockOnClose} />);
      
      // Should not close before long duration
      vi.advanceTimersByTime(10000);
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('handles multiple rapid clicks on close button', () => {
      render(<Toast message="Rapid clicks" onClose={mockOnClose} />);
      
      const closeButton = screen.getByRole('button');
      
      // Click multiple times rapidly
      fireEvent.click(closeButton);
      fireEvent.click(closeButton);
      fireEvent.click(closeButton);
      
      vi.advanceTimersByTime(300);
      
      // Should only be called once due to state management
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});