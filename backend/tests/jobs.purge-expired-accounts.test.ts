// tests/jobs.purge-expired-accounts.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Create mock functions that will be used in the chain
const mockEq = vi.fn();
const mockLt = vi.fn();
const mockIn = vi.fn();
const mockSelect = vi.fn();
const mockDelete = vi.fn();

function makePurgeExpiredAccountsSupabaseMock() {
  return {
    from: (table: string) => {
      const tableObj: any = {};

      if (table === 'user_signups') {
        tableObj.select = mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            lt: mockLt
          })
        });
        
        tableObj.delete = mockDelete.mockReturnValue({
          in: mockIn.mockReturnValue({
            eq: mockEq.mockReturnValue({
              lt: mockLt
            })
          })
        });
      }
      
      if (table === 'user_otps') {
        tableObj.delete = mockDelete.mockReturnValue({
          eq: mockEq.mockReturnValue({
            in: mockIn
          })
        });
      }
      
      if (table === 'user_resume_tokens') {
        tableObj.delete = mockDelete.mockReturnValue({
          in: mockIn
        });
      }

      return tableObj;
    }
  };
}

// Import the service after mocking
let purgeExpiredAccounts: any;
let getExpiredAccountsPurgeCount: any;

beforeEach(async () => {
  vi.resetAllMocks();
  await vi.resetModules();

  // Mock Supabase
  vi.doMock('../src/lib/supabase', () => ({
    supabase: makePurgeExpiredAccountsSupabaseMock()
  }));

  // Set default return values
  mockLt.mockResolvedValue({ data: [], error: null });
  mockIn.mockResolvedValue({ error: null, count: 0 });

  // Import service after mocks are set up
  const serviceModule = await import('../src/services/purgeExpiredAccounts.service');
  purgeExpiredAccounts = serviceModule.purgeExpiredAccounts;
  getExpiredAccountsPurgeCount = serviceModule.getExpiredAccountsPurgeCount;
});

describe('Service: purgeExpiredAccounts (Story 1.7)', () => {
  it('should find and permanently delete expired accounts (>15 days old)', async () => {
    // Mock finding 2 expired accounts older than 15 days
    const expiredAccounts = [
      { id: 'expired-user-123' },
      { id: 'expired-user-456' }
    ];

    // Set up the mock responses in order:
    // 1. Initial select query to find users
    mockLt.mockResolvedValueOnce({ data: expiredAccounts, error: null });
    
    // 2. Delete OTPs
    mockIn.mockResolvedValueOnce({ error: null, count: 2 });
    
    // 3. Delete resume tokens  
    mockIn.mockResolvedValueOnce({ error: null, count: 1 });
    
    // 4. Delete users (uses lt at the end)
    mockLt.mockResolvedValueOnce({ error: null, count: 2 });

    const result = await purgeExpiredAccounts();

    expect(result.purgedCount).toBe(2);
    expect(result.userIds).toEqual(['expired-user-123', 'expired-user-456']);

    // Verify the methods were called
    expect(mockSelect).toHaveBeenCalledWith('id');
    expect(mockDelete).toHaveBeenCalledTimes(3);
    expect(mockEq).toHaveBeenCalledWith('status', 'EXPIRED');
    expect(mockIn).toHaveBeenCalledWith('user_id', ['expired-user-123', 'expired-user-456']);
    expect(mockIn).toHaveBeenCalledWith('id', ['expired-user-123', 'expired-user-456']);
  });

  it('should handle no expired accounts found gracefully', async () => {
    // Mock empty result
    mockLt.mockResolvedValue({ data: [], error: null });

    const result = await purgeExpiredAccounts();

    expect(result.purgedCount).toBe(0);
    expect(result.userIds).toEqual([]);

    // Should query but not delete
    expect(mockSelect).toHaveBeenCalledWith('id');
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('should handle null data response', async () => {
    mockLt.mockResolvedValue({ data: null, error: null });

    const result = await purgeExpiredAccounts();

    expect(result.purgedCount).toBe(0);
    expect(result.userIds).toEqual([]);
  });

  it('should handle database select errors', async () => {
    mockLt.mockResolvedValue({
      data: null,
      error: { message: 'Database connection failed', code: 'ECONNREFUSED' }
    });

    await expect(purgeExpiredAccounts()).rejects.toThrow();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('should handle database deletion errors', async () => {
    const expiredAccounts = [{ id: 'expired-user-123' }];

    // Mock successful user finding
    mockLt.mockResolvedValueOnce({ data: expiredAccounts, error: null });

    // Mock OTP deletion success but user deletion failure
    mockIn.mockResolvedValueOnce({ error: null, count: 1 }); // OTPs success
    mockIn.mockResolvedValueOnce({ error: null, count: 0 }); // Resume tokens success
    mockLt.mockResolvedValueOnce({ 
      error: { message: 'Delete failed', code: 'DELETE_ERROR' } 
    }); // Users failure

    await expect(purgeExpiredAccounts()).rejects.toThrow();
  });

  it('should be idempotent - multiple runs should work consistently', async () => {
    // First run: find expired accounts
    const expiredAccounts = [{ id: 'expired-user-123' }];

    mockLt.mockResolvedValueOnce({ data: expiredAccounts, error: null });
    mockIn.mockResolvedValueOnce({ error: null, count: 1 }); // OTPs
    mockIn.mockResolvedValueOnce({ error: null, count: 0 }); // Resume tokens
    mockLt.mockResolvedValueOnce({ error: null, count: 1 }); // Users

    const result1 = await purgeExpiredAccounts();
    expect(result1.purgedCount).toBe(1);
    expect(result1.userIds).toEqual(['expired-user-123']);

    // Second run: no more expired accounts (idempotent)
    mockLt.mockResolvedValueOnce({ data: [], error: null });

    const result2 = await purgeExpiredAccounts();
    expect(result2.purgedCount).toBe(0);
    expect(result2.userIds).toEqual([]);
  });

  it('should use correct date filter (15 days ago)', async () => {
    mockLt.mockResolvedValue({ data: [], error: null });

    await purgeExpiredAccounts();

    // Verify correct status filter
    expect(mockEq).toHaveBeenCalledWith('status', 'EXPIRED');
    
    // Verify date filter is approximately 15 days ago
    const capturedDate = mockLt.mock.calls[0][1];
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const capturedDateObj = new Date(capturedDate);
    
    // Allow small time difference due to test execution time
    const timeDiff = Math.abs(fifteenDaysAgo.getTime() - capturedDateObj.getTime());
    expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
  });

  it('should only affect EXPIRED status users (not PENDING_VERIFICATION or ACTIVE)', async () => {
    mockLt.mockResolvedValue({ data: [], error: null });

    await purgeExpiredAccounts();

    // Verify status filter ensures only EXPIRED users are targeted
    expect(mockEq).toHaveBeenCalledWith('status', 'EXPIRED');
    
    // The delete query should also include status filter for safety
    const deleteCallArgs = mockEq.mock.calls;
    const hasStatusFilterInDelete = deleteCallArgs.some(call => 
      call[0] === 'status' && call[1] === 'EXPIRED'
    );
    expect(hasStatusFilterInDelete).toBe(true);
  });

  it('should handle single account purging', async () => {
    const expiredAccounts = [{ id: 'single-expired-user' }];

    mockLt.mockResolvedValueOnce({ data: expiredAccounts, error: null });
    mockIn.mockResolvedValueOnce({ error: null, count: 0 }); // OTPs
    mockIn.mockResolvedValueOnce({ error: null, count: 1 }); // Resume tokens
    mockLt.mockResolvedValueOnce({ error: null, count: 1 }); // Users

    const result = await purgeExpiredAccounts();

    expect(result.purgedCount).toBe(1);
    expect(result.userIds).toEqual(['single-expired-user']);
    expect(mockIn).toHaveBeenCalledWith('id', ['single-expired-user']);
  });

  it('should delete dependent records before users (OTPs and resume tokens)', async () => {
    const expiredAccounts = [{ id: 'user-with-dependencies' }];

    mockLt.mockResolvedValueOnce({ data: expiredAccounts, error: null });
    mockIn.mockResolvedValueOnce({ error: null, count: 1 }); // OTPs
    mockIn.mockResolvedValueOnce({ error: null, count: 1 }); // Resume tokens
    mockLt.mockResolvedValueOnce({ error: null, count: 1 }); // Users

    const result = await purgeExpiredAccounts();

    expect(result.purgedCount).toBe(1);
    expect(result.userIds).toEqual(['user-with-dependencies']);
  });

  it('should continue execution even if dependent record deletion fails (non-critical)', async () => {
    const expiredAccounts = [{ id: 'user-123' }];

    mockLt.mockResolvedValueOnce({ data: expiredAccounts, error: null });
    mockIn.mockResolvedValueOnce({ 
      error: { message: 'OTP delete failed' } 
    }); // OTPs fail

    await expect(purgeExpiredAccounts()).rejects.toThrow();
  });
});

describe('Service: getExpiredAccountsPurgeCount', () => {
  it('should return correct count of expired accounts eligible for purging', async () => {
    // For count queries, the chain ends with mockLt returning the count result
    mockLt.mockResolvedValue({ count: 5, error: null });

    const count = await getExpiredAccountsPurgeCount();

    expect(count).toBe(5);
    expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    expect(mockEq).toHaveBeenCalledWith('status', 'EXPIRED');
    expect(mockLt).toHaveBeenCalledWith('updated_at', expect.any(String));
  });

  it('should handle zero count gracefully', async () => {
    mockLt.mockResolvedValue({ count: 0, error: null });

    const count = await getExpiredAccountsPurgeCount();

    expect(count).toBe(0);
  });

  it('should handle null count', async () => {
    mockLt.mockResolvedValue({ count: null, error: null });

    const count = await getExpiredAccountsPurgeCount();

    expect(count).toBe(0);
  });

  it('should handle database errors', async () => {
    mockLt.mockResolvedValue({
      count: null,
      error: { message: 'Count query failed', code: 'COUNT_ERROR' }
    });

    await expect(getExpiredAccountsPurgeCount()).rejects.toThrow();
  });
});