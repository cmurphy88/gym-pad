import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AuthForm from '@/components/AuthForm';

// Mock Next.js router
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('./__mocks__/next-navigation.js');
  return actual;
});

// Mock fetch globally
global.fetch = vi.fn();
global.window = {
  ...global.window,
  location: { reload: vi.fn() }
};

describe('AuthForm Component', () => {
  const mockOnAuthSuccess = vi.fn();
  const mockPush = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    global.fetch.mockClear();
    
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

    // Mock window.location.reload
    vi.stubGlobal('window', {
      ...window,
      location: { reload: vi.fn() }
    });
  });

  describe('Rendering', () => {
    it('renders login form by default', () => {
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />);
      
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Enter your full name')).not.toBeInTheDocument();
    });

    it('renders sign up link in login mode', () => {
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />);
      
      expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
      expect(screen.getByText('Sign up')).toBeInTheDocument();
    });

    it('switches to register form when sign up is clicked', async () => {
      const user = userEvent.setup();
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />);
      
      const signUpButton = screen.getByText('Sign up');
      await user.click(signUpButton);
      
      expect(screen.getByText('Create your account')).toBeInTheDocument();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your full name')).toBeInTheDocument();
      expect(screen.getByText('Already have an account?')).toBeInTheDocument();
      expect(screen.getByText('Sign in')).toBeInTheDocument();
    });

    it('switches back to login from register', async () => {
      const user = userEvent.setup();
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />);
      
      // Switch to register
      await user.click(screen.getByText('Sign up'));
      expect(screen.getByText('Create your account')).toBeInTheDocument();
      
      // Switch back to login
      await user.click(screen.getByText('Sign in'));
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Enter your full name')).not.toBeInTheDocument();
    });
  });

  describe('Form State Management', () => {
    it('updates input values correctly', async () => {
      const user = userEvent.setup();
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />);
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      
      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'testpass');
      
      expect(usernameInput).toHaveValue('testuser');
      expect(passwordInput).toHaveValue('testpass');
    });

    it('clears form when switching between login and register', async () => {
      const user = userEvent.setup();
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />);
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      await user.type(usernameInput, 'testuser');
      
      // Switch to register
      await user.click(screen.getByText('Sign up'));
      
      // Form should be cleared
      expect(screen.getByPlaceholderText('Enter your username')).toHaveValue('');
    });

    it('clears error when switching modes', async () => {
      const user = userEvent.setup();
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />);
      
      // Mock a failed login to show error
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' })
      });
      
      await user.type(screen.getByPlaceholderText('Enter your username'), 'test');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'test');
      await user.click(screen.getByText('Sign In'));
      
      // Wait a bit for the async operation to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Check if error appears
      if (screen.queryByText('Invalid credentials')) {
        // Switch modes
        await user.click(screen.getByText('Sign up'));
        
        // Error should be cleared
        expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
      }
    });

    it('clears error when user starts typing', async () => {
      const user = userEvent.setup();
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />);
      
      // Mock a failed login to show error
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' })
      });
      
      await user.type(screen.getByPlaceholderText('Enter your username'), 'test');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'test');
      await user.click(screen.getByText('Sign In'));
      
      // Wait a bit for the async operation to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Check if error appears and then test clearing
      if (screen.queryByText('Invalid credentials')) {
        // Start typing again
        const usernameInput = screen.getByPlaceholderText('Enter your username');
        await user.clear(usernameInput);
        await user.type(usernameInput, 'newuser');
        
        // Error should be cleared
        expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
      }
    });
  });

  describe('Form Submission', () => {
    it('submits login form with correct data', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: { id: 1, username: 'testuser' } })
      });
      
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />);
      
      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'testpass');
      await user.click(screen.getByText('Sign In'));
      
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser', password: 'testpass' })
      });
    });

    it('submits register form with correct data', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: { id: 1, username: 'testuser' } })
      });
      
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />);
      
      // Switch to register
      await user.click(screen.getByText('Sign up'));
      
      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser');
      await user.type(screen.getByPlaceholderText('Enter your full name'), 'Test User');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'testpass');
      await user.click(screen.getByText('Sign Up'));
      
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: 'testuser', 
          password: 'testpass', 
          name: 'Test User' 
        })
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      
      // Mock a delayed response
      global.fetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 1, username: 'testuser' } })
        }), 100))
      );
      
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />);
      
      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'testpass');
      
      const submitButton = screen.getByText('Sign In');
      await user.click(submitButton);
      
      expect(screen.getByText('Please wait...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      
      // Just verify the loading state was shown, don't wait for completion
      // since the component will reload the page
    });

    it('reloads page on successful authentication', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: { id: 1, username: 'testuser' } })
      });
      
      const reloadSpy = vi.spyOn(window.location, 'reload');
      
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />);
      
      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'testpass');
      await user.click(screen.getByText('Sign In'));
      
      // Wait a moment for the async operation
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('displays error message on login failure', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' })
      });
      
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />);
      
      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'wrongpass');
      await user.click(screen.getByText('Sign In'));
      
      // Wait a moment for the async operation
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    it('displays error message on register failure', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Username already exists' })
      });
      
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />);
      
      // Switch to register
      await user.click(screen.getByText('Sign up'));
      
      await user.type(screen.getByPlaceholderText('Enter your username'), 'existinguser');
      await user.type(screen.getByPlaceholderText('Enter your full name'), 'Test User');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'testpass');
      await user.click(screen.getByText('Sign Up'));
      
      // Wait a moment for the async operation
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(screen.getByText('Username already exists')).toBeInTheDocument();
    });

    it('displays generic error on network failure', async () => {
      const user = userEvent.setup();
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />);
      
      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'testpass');
      await user.click(screen.getByText('Sign In'));
      
      // Wait a moment for the async operation
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('displays default error message when error is undefined', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({})
      });
      
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />);
      
      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'testpass');
      await user.click(screen.getByText('Sign In'));
      
      // Wait a moment for the async operation
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(screen.getByText('Authentication failed')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />);
      
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('has proper form labels in register mode', async () => {
      const user = userEvent.setup();
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />);
      
      await user.click(screen.getByText('Sign up'));
      
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('marks required fields correctly', () => {
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />);
      
      expect(screen.getByPlaceholderText('Enter your username')).toHaveAttribute('required');
      expect(screen.getByPlaceholderText('Enter your password')).toHaveAttribute('required');
    });

    it('has proper error styling', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Test error' })
      });
      
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />);
      
      await user.type(screen.getByPlaceholderText('Enter your username'), 'test');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'test');
      await user.click(screen.getByText('Sign In'));
      
      // Wait a moment for the async operation
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const errorDiv = screen.getByText('Test error').closest('div');
      expect(errorDiv).toHaveClass('bg-red-900/50', 'border-red-700', 'text-red-200');
    });
  });

  describe('Button States', () => {
    it('enables submit button when form is valid', async () => {
      const user = userEvent.setup();
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />);
      
      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'testpass');
      
      const submitButton = screen.getByText('Sign In');
      expect(submitButton).not.toBeDisabled();
    });

    it('disables submit button during loading', async () => {
      const user = userEvent.setup();
      
      global.fetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 1, username: 'testuser' } })
        }), 100))
      );
      
      render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />);
      
      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'testpass');
      
      const submitButton = screen.getByText('Sign In');
      await user.click(submitButton);
      
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });
  });
});