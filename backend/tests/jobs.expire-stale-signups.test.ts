// tests/jobs.expire-stale-signups.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Create a specialized mock for expire signups testing
const mockSupabaseSelect = vi.fn();
const mockSupabaseUpdate = vi.fn();
const mockSupabaseDelete = vi.fn();
const mockSupabaseIn = vi.fn();
const mockSupabaseEq = vi.fn();
const mockSupabaseLt = vi.fn();

function makeExpireSignupsSupabaseMock() {
  return {
    from: (table: string) => {
      if (table === 'user_signups') {
        return {
          select: mockSupabaseSelect.mockReturnValue({
            eq: mockSupabaseEq.mockReturnValue({
              lt: mockSupabaseLt
            })
          }),
          update: mockSupabaseUpdate.mockReturnValue({
            in: mockSupabaseIn
          })
        };
      }
      if (table === 'user_otps') {
        return {
          delete: mockSupabaseDelete.mockReturnValue({
            eq: () => ({
              in: () => ({
                eq: () => Promise.resolve({ error: null })
              })
            })
          })
        };
      }
      return {};
    }
  };
}

// Import the service after mocking
let expireStaleSignups: any;

beforeEach(async () => {
  vi.resetAllMocks();
  await vi.resetModules();

  // Mock Supabase
  vi.doMock('../src/lib/supabase', () => ({
    supabase: makeExpireSignupsSupabaseMock()
  }));

  // Reset mock return values
  mockSupabaseIn.mockResolvedValue({ error: null });

  // Import service after mocks are set up
  const serviceModule = await import('../src/services/expiredSignups.service');
  expireStaleSignups = serviceModule.expireStaleSignups;
});

describe('Service: expireStaleSignups (Story 1.6)', () => {
  it('should find and expire stale signups (>7 days old)', async () => {
    // Mock finding 2 stale signups
    const staleSignups = [
      { 
        id: 'user-123', 
        signup_email: 'stale1@test.com', 
        created_at: '2024-01-01T00:00:00Z', 
        full_name: 'Stale User 1' 
      },
      { 
        id: 'user-456', 
        signup_email: 'stale2@test.com', 
        created_at: '2024-01-02T00:00:00Z', 
        full_name: 'Stale User 2' 
      }
    ];

    mockSupabaseLt.mockResolvedValue({
      data: staleSignups,
      error: null
    });

    const result = await expireStaleSignups();

    expect(result.expiredCount).toBe(2);
    expect(result.userIds).toEqual(['user-123', 'user-456']);

    // Verify correct query was made
    expect(mockSupabaseSelect).toHaveBeenCalledWith('id, signup_email, created_at, full_name');
    expect(mockSupabaseEq).toHaveBeenCalledWith('status', 'PENDING_VERIFICATION');
    expect(mockSupabaseLt).toHaveBeenCalledWith('created_at', expect.any(String));

    // Verify update was called correctly
    expect(mockSupabaseUpdate).toHaveBeenCalledWith({
      status: 'EXPIRED',
      email_verified_at: null,
      resume_token_hash: null,
      resume_token_expires_at: null,
      updated_at: expect.any(String)
    });
    expect(mockSupabaseIn).toHaveBeenCalledWith('id', ['user-123', 'user-456']);

    // Verify OTP deletion was attempted
    expect(mockSupabaseDelete).toHaveBeenCalled();
  });

  it('should handle no stale signups found gracefully', async () => {
    // Mock empty result
    mockSupabaseLt.mockResolvedValue({
      data: [],
      error: null
    });

    const result = await expireStaleSignups();

    expect(result.expiredCount).toBe(0);
    expect(result.userIds).toEqual([]);

    // Should query but not update
    expect(mockSupabaseSelect).toHaveBeenCalled();
    expect(mockSupabaseUpdate).not.toHaveBeenCalled();
  });

  it('should handle null data response', async () => {
    mockSupabaseLt.mockResolvedValue({
      data: null,
      error: null
    });

    const result = await expireStaleSignups();

    expect(result.expiredCount).toBe(0);
    expect(result.userIds).toEqual([]);
  });

  it('should handle database select errors', async () => {
    mockSupabaseLt.mockResolvedValue({
      data: null,
      error: { message: 'Database connection failed', code: 'ECONNREFUSED' }
    });

    await expect(expireStaleSignups()).rejects.toThrow();
    expect(mockSupabaseUpdate).not.toHaveBeenCalled();
  });

  it('should handle database update errors', async () => {
    const staleSignups = [
      { id: 'user-123', signup_email: 'stale@test.com', created_at: '2024-01-01T00:00:00Z', full_name: 'Stale User' }
    ];

    mockSupabaseLt.mockResolvedValue({
      data: staleSignups,
      error: null
    });

    mockSupabaseIn.mockResolvedValue({
      error: { message: 'Update failed', code: 'UPDATE_ERROR' }
    });

    await expect(expireStaleSignups()).rejects.toThrow();
  });

  it('should continue if OTP deletion fails (non-critical)', async () => {
    const staleSignups = [
      { id: 'user-123', signup_email: 'stale@test.com', created_at: '2024-01-01T00:00:00Z', full_name: 'Stale User' }
    ];

    mockSupabaseLt.mockResolvedValue({
      data: staleSignups,
      error: null
    });

    // Mock OTP deletion failure by redefining the mock
    vi.doMock('../src/lib/supabase', () => ({
      supabase: {
        from: (table: string) => {
          if (table === 'user_signups') {
            return {
              select: mockSupabaseSelect.mockReturnValue({
                eq: mockSupabaseEq.mockReturnValue({
                  lt: mockSupabaseLt
                })
              }),
              update: mockSupabaseUpdate.mockReturnValue({
                in: mockSupabaseIn
              })
            };
          }
          if (table === 'user_otps') {
            return {
              delete: () => ({
                eq: () => ({
                  in: () => ({
                    eq: () => Promise.resolve({ error: { message: 'OTP delete failed' } })
                  })
                })
              })
            };
          }
          return {};
        }
      }
    }));

    const result = await expireStaleSignups();
    
    // Should still succeed even if OTP deletion fails
    expect(result.expiredCount).toBe(1);
    expect(result.userIds).toEqual(['user-123']);
  });

  it('should be idempotent - multiple runs should work consistently', async () => {
    // First run: find stale signups
    const staleSignups = [
      { id: 'user-123', signup_email: 'stale@test.com', created_at: '2024-01-01T00:00:00Z', full_name: 'Stale User' }
    ];

    mockSupabaseLt.mockResolvedValueOnce({
      data: staleSignups,
      error: null
    });

    const result1 = await expireStaleSignups();
    expect(result1.expiredCount).toBe(1);
    expect(result1.userIds).toEqual(['user-123']);

    // Second run: no more stale signups (idempotent)
    mockSupabaseLt.mockResolvedValueOnce({
      data: [],
      error: null
    });

    const result2 = await expireStaleSignups();
    expect(result2.expiredCount).toBe(0);
    expect(result2.userIds).toEqual([]);
  });

  it('should use correct date filter (7 days ago)', async () => {
    mockSupabaseLt.mockResolvedValue({
      data: [],
      error: null
    });

    await expireStaleSignups();

    // Verify correct status filter
    expect(mockSupabaseEq).toHaveBeenCalledWith('status', 'PENDING_VERIFICATION');
    
    // Verify date filter is approximately 7 days ago
    const capturedDate = mockSupabaseLt.mock.calls[0][1];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const capturedDateObj = new Date(capturedDate);
    
    // Allow small time difference due to test execution time
    const timeDiff = Math.abs(sevenDaysAgo.getTime() - capturedDateObj.getTime());
    expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
  });

  it('should update all required fields when expiring users', async () => {
    const staleSignups = [
      { id: 'user-123', signup_email: 'stale@test.com', created_at: '2024-01-01T00:00:00Z', full_name: 'Stale User' }
    ];

    mockSupabaseLt.mockResolvedValue({
      data: staleSignups,
      error: null
    });

    await expireStaleSignups();

    // Verify all required fields are updated according to story requirements
    expect(mockSupabaseUpdate).toHaveBeenCalledWith({
      status: 'EXPIRED',
      email_verified_at: null,           // Clear email_verified_at
      resume_token_hash: null,           // Invalidate resumeToken
      resume_token_expires_at: null,     // Invalidate resumeToken
      updated_at: expect.any(String)
    });
  });

  it('should handle single user expiration', async () => {
    const staleSignups = [
      { id: 'user-only', signup_email: 'only@test.com', created_at: '2024-01-01T00:00:00Z', full_name: 'Only User' }
    ];

    mockSupabaseLt.mockResolvedValue({
      data: staleSignups,
      error: null
    });

    const result = await expireStaleSignups();

    expect(result.expiredCount).toBe(1);
    expect(result.userIds).toEqual(['user-only']);
    expect(mockSupabaseIn).toHaveBeenCalledWith('id', ['user-only']);
  });
});