/**
 * App Component Tests
 * 
 * Basic tests to verify React Router setup.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../../App';

describe('App Component', () => {
  it('should render without crashing', () => {
    render(<App />);
    expect(screen.getByText(/Learning Management System/i)).toBeInTheDocument();
  });

  it('should render home page by default', () => {
    render(<App />);
    expect(screen.getByText(/A modern platform for teachers and students/i)).toBeInTheDocument();
  });

  it('should have login and register buttons', () => {
    render(<App />);
    // Use getAllByText since "Login" and "Register" appear in both navigation and homepage
    const loginElements = screen.getAllByText('Login');
    const registerElements = screen.getAllByText('Register');
    
    expect(loginElements.length).toBeGreaterThan(0);
    expect(registerElements.length).toBeGreaterThan(0);
  });
});
