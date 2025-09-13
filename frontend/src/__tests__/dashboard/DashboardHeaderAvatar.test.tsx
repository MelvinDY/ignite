import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DashboardHeaderAvatar } from '../../components/DashboardHeaderAvatar';
import * as profileApi from '../../lib/api/profile';

// Mock the profile API
vi.mock('../../lib/api/profile', () => ({
  profileApi: {
    getMyProfile: vi.fn(),
  },
  ProfileApiError: class MockProfileApiError extends Error {
    constructor(public code: string, public status: number, message: string) {
      super(message);
      this.name = 'ProfileApiError';
    }
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('DashboardHeaderAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (profileApi.profileApi.getMyProfile as any).mockImplementation(() => new Promise(() => {}));

    render(<DashboardHeaderAvatar />);

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('navigates to handle setup when handle is null', async () => {
    const mockProfile = {
      id: 'profile-123',
      fullName: 'Test User',
      handle: null,
      photoUrl: null,
      isIndonesian: true,
      program: 'Computer Science',
      major: 'Software Engineering',
      level: 'undergrad',
      yearStart: 2022,
      yearGrad: null,
      zid: 'z1234567',
      headline: null,
      domicileCity: null,
      domicileCountry: null,
      bio: null,
      socialLinks: {},
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    };

    (profileApi.profileApi.getMyProfile as any).mockResolvedValue(mockProfile);

    render(<DashboardHeaderAvatar />);

    await waitFor(() => {
      expect(screen.getByText('TU')).toBeInTheDocument(); // Initials
    });

    fireEvent.click(screen.getByRole('button'));

    expect(mockNavigate).toHaveBeenCalledWith('/profile/handle-setup');
  });

  it('navigates to profile when handle exists', async () => {
    const mockProfile = {
      id: 'profile-123',
      fullName: 'Test User',
      handle: 'testuser',
      photoUrl: null,
      isIndonesian: true,
      program: 'Computer Science',
      major: 'Software Engineering',
      level: 'undergrad',
      yearStart: 2022,
      yearGrad: null,
      zid: 'z1234567',
      headline: null,
      domicileCity: null,
      domicileCountry: null,
      bio: null,
      socialLinks: {},
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    };

    (profileApi.profileApi.getMyProfile as any).mockResolvedValue(mockProfile);

    render(<DashboardHeaderAvatar />);

    await waitFor(() => {
      expect(screen.getByText('TU')).toBeInTheDocument(); // Initials
    });

    fireEvent.click(screen.getByRole('button'));

    expect(mockNavigate).toHaveBeenCalledWith('/profile/me');
  });

  it('renders profile photo when available', async () => {
    const mockProfile = {
      id: 'profile-123',
      fullName: 'Test User',
      handle: 'testuser',
      photoUrl: 'https://example.com/photo.jpg',
      isIndonesian: true,
      program: 'Computer Science',
      major: 'Software Engineering',
      level: 'undergrad',
      yearStart: 2022,
      yearGrad: null,
      zid: 'z1234567',
      headline: null,
      domicileCity: null,
      domicileCountry: null,
      bio: null,
      socialLinks: {},
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    };

    (profileApi.profileApi.getMyProfile as any).mockResolvedValue(mockProfile);

    render(<DashboardHeaderAvatar />);

    await waitFor(() => {
      const img = screen.getByAltText("Test User's profile");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
    });
  });

  it('renders initials fallback when no photo', async () => {
    const mockProfile = {
      id: 'profile-123',
      fullName: 'John Doe Smith',
      handle: 'testuser',
      photoUrl: null,
      isIndonesian: true,
      program: 'Computer Science',
      major: 'Software Engineering',
      level: 'undergrad',
      yearStart: 2022,
      yearGrad: null,
      zid: 'z1234567',
      headline: null,
      domicileCity: null,
      domicileCountry: null,
      bio: null,
      socialLinks: {},
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    };

    (profileApi.profileApi.getMyProfile as any).mockResolvedValue(mockProfile);

    render(<DashboardHeaderAvatar />);

    await waitFor(() => {
      expect(screen.getByText('JD')).toBeInTheDocument(); // First two initials
    });
  });

  it('handles API error gracefully', async () => {
    const mockError = new Error('API Error');
    (profileApi.profileApi.getMyProfile as any).mockRejectedValue(mockError);

    render(<DashboardHeaderAvatar />);

    await waitFor(() => {
      // Should show error state when profile fetch fails  
      expect(screen.getByText('Profile error')).toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', async () => {
    const mockProfile = {
      id: 'profile-123',
      fullName: 'Test User',
      handle: 'testuser',
      photoUrl: null,
      isIndonesian: true,
      program: 'Computer Science',
      major: 'Software Engineering',
      level: 'undergrad',
      yearStart: 2022,
      yearGrad: null,
      zid: 'z1234567',
      headline: null,
      domicileCity: null,
      domicileCountry: null,
      bio: null,
      socialLinks: {},
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    };

    (profileApi.profileApi.getMyProfile as any).mockResolvedValue(mockProfile);

    render(<DashboardHeaderAvatar />);

    await waitFor(() => {
      const button = screen.getByLabelText('Open my profile');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Open my profile');
    });
  });
});