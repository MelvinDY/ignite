import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Register } from '../../pages/auth/Register';
import { server } from '../../__mocks__/server';
import { http, HttpResponse } from 'msw';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock window.alert
Object.defineProperty(window, 'alert', {
  writable: true,
  value: vi.fn(),
});

const renderRegister = () => {
  return render(
    <BrowserRouter>
      <Register />
    </BrowserRouter>
  );
};

describe('Register Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    vi.clearAllMocks();
  });

  it('renders step 1 correctly', () => {
    renderRegister();
    
    expect(screen.getByRole('heading', { name: /register \(1\/3\)/i })).toBeInTheDocument();
    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zid/i)).toBeInTheDocument();
    expect(screen.getByText(/are you indonesian/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('validates step 1 fields', async () => {
    const user = userEvent.setup();
    renderRegister();
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
    
    expect(screen.getByText(/full name.*required/i)).toBeInTheDocument();
    expect(screen.getByText(/zid.*required/i)).toBeInTheDocument();
  });

  it('validates zID format in step 1', async () => {
    const user = userEvent.setup();
    renderRegister();
    
    const zidInput = screen.getByLabelText(/zid/i);
    const nextButton = screen.getByRole('button', { name: /next/i });
    
    await user.type(zidInput, 'invalid-zid');
    await user.click(nextButton);
    
    expect(screen.getByText(/zid must be in format z1234567/i)).toBeInTheDocument();
  });

  it('progresses to step 2 with valid step 1 data', async () => {
    const user = userEvent.setup();
    renderRegister();
    
    // Fill step 1
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/zid/i), 'z1234567');
    await user.click(screen.getByLabelText(/yes/i));
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    // Should be on step 2
    expect(screen.getByRole('heading', { name: /register \(2\/3\)/i })).toBeInTheDocument();
    expect(screen.getByText(/step 2 of 3/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/year intake/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/program/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/major/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('can go back from step 2 to step 1', async () => {
    const user = userEvent.setup();
    renderRegister();
    
    // Progress to step 2
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/zid/i), 'z1234567');
    await user.click(screen.getByLabelText(/yes/i));
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    // Go back
    await user.click(screen.getByRole('button', { name: /back/i }));
    
    // Should be back on step 1
    expect(screen.getByRole('heading', { name: /register \(1\/3\)/i })).toBeInTheDocument();
  });

  it('validates step 2 fields', async () => {
    const user = userEvent.setup();
    renderRegister();
    
    // Progress to step 2
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/zid/i), 'z1234567');
    await user.click(screen.getByLabelText(/yes/i));
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    // Try to proceed without filling step 2
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    expect(screen.getByText(/year intake.*required/i)).toBeInTheDocument();
    expect(screen.getByText(/program.*required/i)).toBeInTheDocument();
    expect(screen.getByText(/major.*required/i)).toBeInTheDocument();
  });

  // TODO: SearchableSelect program field not accepting input in test environment
  it('progresses to step 3 with valid step 2 data', async () => {
    const user = userEvent.setup();
    renderRegister();
    
    // Fill step 1
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/zid/i), 'z1234567');
    await user.click(screen.getByLabelText(/yes/i));
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    // Fill step 2
    await user.type(screen.getByLabelText(/year intake/i), '2024');
    
    // Select level from dropdown
    const levelSelect = screen.getByLabelText(/level/i);
    await user.selectOptions(levelSelect, 'undergrad');
    
    // For SearchableSelect components, we'll just type to trigger minimal validation
    const programInput = screen.getByLabelText(/program/i);
    await user.type(programInput, 'Computer Engineering');
    
    const majorInput = screen.getByLabelText(/major/i);
    await user.type(majorInput, 'Software Engineering');
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    // Should be on step 3
    expect(screen.getByRole('heading', { name: /register \(3\/3\)/i })).toBeInTheDocument();
    expect(screen.getByText(/step 3 of 3/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  // TODO: Depends on SearchableSelect working in tests
  it('validates step 3 fields', async () => {
    const user = userEvent.setup();
    renderRegister();
    
    // Progress to step 3
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/zid/i), 'z1234567');
    await user.click(screen.getByLabelText(/yes/i));
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    await user.type(screen.getByLabelText(/year intake/i), '2024');
    
    // Select level from dropdown
    const levelSelect = screen.getByLabelText(/level/i);
    await user.selectOptions(levelSelect, 'undergrad');
    
    // For SearchableSelect components, we'll just type to trigger minimal validation
    const programInput = screen.getByLabelText(/program/i);
    await user.type(programInput, 'Computer Engineering');
    
    const majorInput = screen.getByLabelText(/major/i);
    await user.type(majorInput, 'Software Engineering');
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    // Try to submit without filling step 3
    await user.click(screen.getByRole('button', { name: /create account/i }));
    
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  // TODO: Depends on SearchableSelect working in tests
  it('validates password confirmation match', async () => {
    const user = userEvent.setup();
    renderRegister();
    
    // Progress to step 3
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/zid/i), 'z1234567');
    await user.click(screen.getByLabelText(/yes/i));
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    await user.type(screen.getByLabelText(/year intake/i), '2024');
    
    // Select level from dropdown
    const levelSelect = screen.getByLabelText(/level/i);
    await user.selectOptions(levelSelect, 'undergrad');
    
    // For SearchableSelect components, we'll just type to trigger minimal validation
    const programInput = screen.getByLabelText(/program/i);
    await user.type(programInput, 'Computer Engineering');
    
    const majorInput = screen.getByLabelText(/major/i);
    await user.type(majorInput, 'Software Engineering');
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    // Fill step 3 with mismatched passwords
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'different123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  // TODO: Depends on SearchableSelect working in tests
  it('handles successful registration', async () => {
    const user = userEvent.setup();
    renderRegister();
    
    // Complete all steps
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/zid/i), 'z1234567');
    await user.click(screen.getByLabelText(/yes/i));
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    await user.type(screen.getByLabelText(/year intake/i), '2024');
    
    // Select level from dropdown
    const levelSelect = screen.getByLabelText(/level/i);
    await user.selectOptions(levelSelect, 'undergrad');
    
    // For SearchableSelect components, we'll just type to trigger minimal validation
    const programInput = screen.getByLabelText(/program/i);
    await user.type(programInput, 'Computer Engineering');
    
    const majorInput = screen.getByLabelText(/major/i);
    await user.type(majorInput, 'Software Engineering');
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    await user.type(screen.getByLabelText(/email/i), 'new@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/auth/verify?resumeToken=mock-resume-token');
    });
  });

  // TODO: Depends on SearchableSelect working in tests
  it('handles email already exists error', async () => {
    const user = userEvent.setup();
    renderRegister();
    
    // Complete all steps with existing email
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/zid/i), 'z1234567');
    await user.click(screen.getByLabelText(/yes/i));
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    await user.type(screen.getByLabelText(/year intake/i), '2024');
    
    // Select level from dropdown
    const levelSelect = screen.getByLabelText(/level/i);
    await user.selectOptions(levelSelect, 'undergrad');
    
    // For SearchableSelect components, we'll just type to trigger minimal validation
    const programInput = screen.getByLabelText(/program/i);
    await user.type(programInput, 'Computer Engineering');
    
    const majorInput = screen.getByLabelText(/major/i);
    await user.type(majorInput, 'Software Engineering');
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/account with this email already exists/i)).toBeInTheDocument();
    });
  });

  // TODO: Depends on SearchableSelect working in tests
  it('handles zID already exists error', async () => {
    const user = userEvent.setup();
    renderRegister();
    
    // Complete all steps with existing zID
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/zid/i), 'z9999999');
    await user.click(screen.getByLabelText(/yes/i));
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    await user.type(screen.getByLabelText(/year intake/i), '2024');
    
    // Select level from dropdown
    const levelSelect = screen.getByLabelText(/level/i);
    await user.selectOptions(levelSelect, 'undergrad');
    
    // For SearchableSelect components, we'll just type to trigger minimal validation
    const programInput = screen.getByLabelText(/program/i);
    await user.type(programInput, 'Computer Engineering');
    
    const majorInput = screen.getByLabelText(/major/i);
    await user.type(majorInput, 'Software Engineering');
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/zid is already registered/i)).toBeInTheDocument();
    });
  });

  // TODO: Depends on SearchableSelect working in tests
  it('handles pending verification exists error', async () => {
    const user = userEvent.setup();
    renderRegister();
    
    // Complete all steps
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/zid/i), 'z1234567');
    await user.click(screen.getByLabelText(/yes/i));
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    await user.type(screen.getByLabelText(/year intake/i), '2024');
    
    // Select level from dropdown
    const levelSelect = screen.getByLabelText(/level/i);
    await user.selectOptions(levelSelect, 'undergrad');
    
    // For SearchableSelect components, we'll just type to trigger minimal validation
    const programInput = screen.getByLabelText(/program/i);
    await user.type(programInput, 'Computer Engineering');
    
    const majorInput = screen.getByLabelText(/major/i);
    await user.type(majorInput, 'Software Engineering');
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    await user.type(screen.getByLabelText(/email/i), 'pending@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/verification email has already been sent/i)).toBeInTheDocument();
    });
  });

  // TODO: Depends on SearchableSelect working in tests
  it('handles network error gracefully', async () => {
    server.use(
      http.post('http://localhost:3000/auth/register', () => {
        return HttpResponse.error();
      })
    );

    const user = userEvent.setup();
    renderRegister();
    
    // Complete all steps
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/zid/i), 'z1234567');
    await user.click(screen.getByLabelText(/yes/i));
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    await user.type(screen.getByLabelText(/year intake/i), '2024');
    
    // Select level from dropdown
    const levelSelect = screen.getByLabelText(/level/i);
    await user.selectOptions(levelSelect, 'undergrad');
    
    // For SearchableSelect components, we'll just type to trigger minimal validation
    const programInput = screen.getByLabelText(/program/i);
    await user.type(programInput, 'Computer Engineering');
    
    const majorInput = screen.getByLabelText(/major/i);
    await user.type(majorInput, 'Software Engineering');
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/unable to connect to server/i)).toBeInTheDocument();
    });
  });

  // TODO: Depends on SearchableSelect working in tests
  it('shows loading state during registration', async () => {
    server.use(
      http.post('http://localhost:3000/auth/register', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return HttpResponse.json({
          success: true,
          userId: 'user-456',
          resumeToken: 'mock-resume-token',
        }, { status: 201 });
      })
    );

    const user = userEvent.setup();
    renderRegister();
    
    // Complete all steps
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/zid/i), 'z1234567');
    await user.click(screen.getByLabelText(/yes/i));
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    await user.type(screen.getByLabelText(/year intake/i), '2024');
    
    // Select level from dropdown
    const levelSelect = screen.getByLabelText(/level/i);
    await user.selectOptions(levelSelect, 'undergrad');
    
    // For SearchableSelect components, we'll just type to trigger minimal validation
    const programInput = screen.getByLabelText(/program/i);
    await user.type(programInput, 'Computer Engineering');
    
    const majorInput = screen.getByLabelText(/major/i);
    await user.type(majorInput, 'Software Engineering');
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    
    const createButton = screen.getByRole('button', { name: /create account/i });
    await user.click(createButton);
    
    expect(screen.getByText(/creating account.../i)).toBeInTheDocument();
    expect(createButton).toBeDisabled();
  });
});