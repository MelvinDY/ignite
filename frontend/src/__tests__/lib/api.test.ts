import { describe, it, expect, beforeEach } from 'vitest';
import { apiClient, ApiError } from '../../lib/api';
import { server } from '../../__mocks__/server';
import { http, HttpResponse } from 'msw';

describe('API Client', () => {
  beforeEach(() => {
    // Reset any runtime request handlers we add during the tests
    server.resetHandlers();
  });

  describe('login', () => {
    it('handles successful login', async () => {
      const response = await apiClient.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response).toEqual({
        success: true,
        userId: 'user-123',
        accessToken: 'mock-access-token',
        expiresIn: 3600,
      });
    });

    it('handles invalid credentials', async () => {
      await expect(
        apiClient.login({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow(ApiError);

      try {
        await apiClient.login({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('INVALID_CREDENTIALS');
        expect((error as ApiError).status).toBe(401);
      }
    });

    it('handles network errors', async () => {
      server.use(
        http.post('http://localhost:5000/api/auth/login', () => {
          return HttpResponse.error();
        })
      );

      await expect(
        apiClient.login({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(ApiError);

      try {
        await apiClient.login({
          email: 'test@example.com',
          password: 'password123',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('NETWORK_ERROR');
      }
    });
  });

  describe('register', () => {
    it('handles successful registration', async () => {
      const response = await apiClient.register({
        fullName: 'John Doe',
        zid: 'z1234567',
        yearIntake: 2024,
        isIndonesian: true,
        program: 'BE',
        major: 'SE',
        email: 'new@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      expect(response).toEqual({
        success: true,
        userId: 'user-456',
        resumeToken: 'mock-resume-token',
      });
    });

    it('handles email exists error', async () => {
      await expect(
        apiClient.register({
          fullName: 'John Doe',
          zid: 'z1234567',
          yearIntake: 2024,
          isIndonesian: true,
          program: 'BE',
          major: 'SE',
          email: 'existing@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        })
      ).rejects.toThrow(ApiError);

      try {
        await apiClient.register({
          fullName: 'John Doe',
          zid: 'z1234567',
          yearIntake: 2024,
          isIndonesian: true,
          program: 'BE',
          major: 'SE',
          email: 'existing@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('EMAIL_EXISTS');
        expect((error as ApiError).status).toBe(409);
      }
    });

    it('handles zID exists error', async () => {
      await expect(
        apiClient.register({
          fullName: 'John Doe',
          zid: 'z9999999',
          yearIntake: 2024,
          isIndonesian: true,
          program: 'BE',
          major: 'SE',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        })
      ).rejects.toThrow(ApiError);
    });

    it('handles validation error', async () => {
      await expect(
        apiClient.register({
          fullName: '',
          zid: '',
          yearIntake: 2024,
          isIndonesian: true,
          program: 'BE',
          major: 'SE',
          email: '',
          password: 'password123',
          confirmPassword: 'password123',
        })
      ).rejects.toThrow(ApiError);

      try {
        await apiClient.register({
          fullName: '',
          zid: '',
          yearIntake: 2024,
          isIndonesian: true,
          program: 'BE',
          major: 'SE',
          email: '',
          password: 'password123',
          confirmPassword: 'password123',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('VALIDATION_ERROR');
        expect((error as ApiError).status).toBe(400);
      }
    });
  });
});