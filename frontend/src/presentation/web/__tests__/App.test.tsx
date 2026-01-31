/**
 * App Component Tests
 * 
 * Basic tests to verify React Router setup.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../../../App';

describe('App Component', () => {
  it('should render without crashing', async () => {
    render(<App />);
    // Use findByText (async) to wait for AuthProvider to finish loading
    expect(await screen.findByText(/Learning Management System/i)).toBeInTheDocument();
  });

  it('should render home page by default', async () => {
    render(<App />);
    // Use findByText (async) to wait for AuthProvider to finish loading
    expect(await screen.findByText(/A modern platform for teachers and students/i)).toBeInTheDocument();
  });

  it('should have login and register buttons', async () => {
    render(<App />);
    // Wait for page to load, then check for buttons
    await waitFor(() => {
      const loginElements = screen.getAllByText('Login');
      const registerElements = screen.getAllByText('Register');
      
      expect(loginElements.length).toBeGreaterThan(0);
      expect(registerElements.length).toBeGreaterThan(0);
    });
  });
});
