import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Header from '@/components/Header';

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

// Mock Next.js navigation
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('./__mocks__/next-navigation.js');
  return actual;
});

// Mock AuthContext
vi.mock('@/contexts/AuthContext', async () => {
  const actual = await vi.importActual('./__mocks__/auth-context.js');
  return actual;
});

// Mock CalendarModal component
vi.mock('@/components/CalendarModal', () => ({
  default: vi.fn(({ isOpen, onClose }) => 
    isOpen ? (
      <div data-testid="calendar-modal">
        <button onClick={onClose}>Close Calendar</button>
      </div>
    ) : null
  )
}));

describe('Header Component', () => {
  const mockPush = vi.fn();
  const mockLogout = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Setup router mock
    const { useRouter } = vi.mocked(await import('next/navigation'));
    useRouter.mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    });

    // Setup auth mock with default authenticated state
    const { setMockAuthState } = vi.mocked(await import('@/contexts/AuthContext'));
    setMockAuthState({
      user: { id: 1, username: 'testuser', name: 'Test User' },
      isLoading: false,
      isAuthenticated: true,
      logout: mockLogout
    });
  });

  describe('Rendering', () => {
    it('renders app logo and title', () => {
      render(<Header />);
      
      expect(screen.getByText('GymPad')).toBeInTheDocument();
      const dumbbellIcon = screen.getByText('GymPad').previousElementSibling;
      expect(dumbbellIcon).toBeInTheDocument();
    });

    it('renders navigation buttons', () => {
      render(<Header />);
      
      expect(screen.getByTitle('Manage Templates')).toBeInTheDocument();
      expect(screen.getByTitle('Weight Tracking')).toBeInTheDocument();
      expect(screen.getByTitle('View Calendar')).toBeInTheDocument();
    });

    it('renders user menu button with user name', () => {
      render(<Header />);
      
      expect(screen.getByTitle('Test User')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('hides user name on small screens', () => {
      render(<Header />);
      
      const userName = screen.getByText('Test User');
      expect(userName).toHaveClass('hidden', 'sm:inline');
    });

    it('does not render user menu when not authenticated', async () => {
      const { setMockAuthState } = vi.mocked(await import('@/contexts/AuthContext'));
      setMockAuthState({
        user: null,
        isAuthenticated: false,
        logout: mockLogout
      });
      
      render(<Header />);
      
      expect(screen.queryByText('Test User')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates to home when logo is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      const logo = screen.getByText('GymPad').closest('div');
      await user.click(logo);
      
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('navigates to templates when templates button is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      const templatesButton = screen.getByTitle('Manage Templates');
      await user.click(templatesButton);
      
      expect(mockPush).toHaveBeenCalledWith('/templates');
    });

    it('navigates to weight tracking when weight button is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      const weightButton = screen.getByTitle('Weight Tracking');
      await user.click(weightButton);
      
      expect(mockPush).toHaveBeenCalledWith('/weight');
    });

    it('opens calendar modal when calendar button is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      const calendarButton = screen.getByTitle('View Calendar');
      await user.click(calendarButton);
      
      expect(screen.getByTestId('calendar-modal')).toBeInTheDocument();
    });

    it('closes calendar modal when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      const calendarButton = screen.getByTitle('View Calendar');
      await user.click(calendarButton);
      
      const closeButton = screen.getByText('Close Calendar');
      await user.click(closeButton);
      
      expect(screen.queryByTestId('calendar-modal')).not.toBeInTheDocument();
    });
  });

  describe('User Menu', () => {
    it('toggles user menu when user button is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      const userButton = screen.getByTitle('Test User');
      
      // Initially closed
      expect(screen.queryByText('Signed in as')).not.toBeInTheDocument();
      
      // Open menu
      await user.click(userButton);
      expect(screen.getByText('Signed in as')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
      
      // Close menu
      await user.click(userButton);
      expect(screen.queryByText('Signed in as')).not.toBeInTheDocument();
    });

    it('displays user information in dropdown', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      const userButton = screen.getByTitle('Test User');
      await user.click(userButton);
      
      expect(screen.getByText('Signed in as')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });

    it('calls logout when sign out is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      const userButton = screen.getByTitle('Test User');
      await user.click(userButton);
      
      const signOutButton = screen.getByText('Sign out');
      await user.click(signOutButton);
      
      expect(mockLogout).toHaveBeenCalled();
    });

    it('closes user menu after logout', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      const userButton = screen.getByTitle('Test User');
      await user.click(userButton);
      
      const signOutButton = screen.getByText('Sign out');
      await user.click(signOutButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Signed in as')).not.toBeInTheDocument();
      });
    });
  });

  describe('Click Outside Behavior', () => {
    it('closes user menu when clicking outside', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      const userButton = screen.getByTitle('Test User');
      await user.click(userButton);
      
      expect(screen.getByText('Signed in as')).toBeInTheDocument();
      
      // Click outside the menu
      await user.click(document.body);
      
      await waitFor(() => {
        expect(screen.queryByText('Signed in as')).not.toBeInTheDocument();
      });
    });

    it('does not close menu when clicking inside menu', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      const userButton = screen.getByTitle('Test User');
      await user.click(userButton);
      
      const menuContent = screen.getByText('Signed in as');
      await user.click(menuContent);
      
      // Menu should still be open
      expect(screen.getByText('Signed in as')).toBeInTheDocument();
    });
  });


  describe('Accessibility', () => {
    it('has proper button titles for screen readers', () => {
      render(<Header />);
      
      expect(screen.getByTitle('Manage Templates')).toBeInTheDocument();
      expect(screen.getByTitle('Weight Tracking')).toBeInTheDocument();
      expect(screen.getByTitle('View Calendar')).toBeInTheDocument();
      expect(screen.getByTitle('Test User')).toBeInTheDocument();
    });

    it('has proper header role', () => {
      render(<Header />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('has proper button roles for interactive elements', () => {
      render(<Header />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('has proper menu structure', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      const userButton = screen.getByTitle('Test User');
      await user.click(userButton);
      
      const menu = screen.getByText('Signed in as');
      expect(menu).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('renders all required icons', () => {
      render(<Header />);
      
      // Check that all icons are rendered (they should be SVG elements)
      const svgs = document.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThanOrEqual(5); // DumbbellIcon, SettingsIcon, ScaleIcon, CalendarIcon, UserIcon
    });
  });

  describe('Edge Cases', () => {
    it('handles missing user gracefully', async () => {
      const { setMockAuthState } = vi.mocked(await import('@/contexts/AuthContext'));
      setMockAuthState({
        user: null,
        isAuthenticated: false,
        logout: mockLogout
      });
      
      expect(() => {
        render(<Header />);
      }).not.toThrow();
    });

    it('handles user without name gracefully', async () => {
      const { setMockAuthState } = vi.mocked(await import('@/contexts/AuthContext'));
      setMockAuthState({
        user: { id: 1, username: 'testuser' }, // no name property
        isAuthenticated: true,
        logout: mockLogout
      });
      
      render(<Header />);
      
      const userButton = screen.getByTitle('User menu');
      expect(userButton).toBeInTheDocument();
    });

    it('handles very long user names', async () => {
      const { setMockAuthState } = vi.mocked(await import('@/contexts/AuthContext'));
      setMockAuthState({
        user: { 
          id: 1, 
          username: 'verylongusername', 
          name: 'Very Long User Name That Should Display Properly'
        },
        isAuthenticated: true,
        logout: mockLogout
      });
      
      render(<Header />);
      
      expect(screen.getByText('Very Long User Name That Should Display Properly')).toBeInTheDocument();
    });
  });
});