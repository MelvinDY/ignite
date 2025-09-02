// tests/utils/supabaseMock.ts
export type Scenario = {
  adminUserByEmail?: { id: string } | null;
  adminListUsers?: Array<{ email: string }>;
  activeProfileByZid?: { id: string } | null;
  pendingByEmail?: { id: string } | null;
  pendingByZid?: { id: string } | null;
  expiredByZid?: { id: string; signup_email?: string } | null;
  expiredByEmail?: { id: string; zid: string } | null;
  createdSignupId?: string;
  revivedSignupId?: string;
  _lastUpdate?: any;
  _lastInsert?: any;
};

export function makeSupabaseMock(s: Scenario) {
  const auth = {
    admin: {
      getUserByEmail: async (_email: string) =>
        ({ data: { user: s.adminUserByEmail ? { id: 'auth_' + s.adminUserByEmail.id } : null } }),
      listUsers: async () =>
        ({ data: { users: (s.adminListUsers || []).map(u => ({ email: u.email })) } })
    }
  };

  function qb(table: string) {
    let _filters: Record<string, any> = {};
    const api = {
      select() { return api; },
      eq(col: string, val: any) { _filters[col] = val; return api; },
      neq(col: string, val: any) { _filters[col] = { $neq: val }; return api; },
      async maybeSingle() { return { data: await single(), error: null }; },
      async single() { return { data: await single(), error: null }; },
      insert(payload: any) {
        s._lastInsert = payload;
        return { select: () => ({ single: async () => ({ data: { id: s.createdSignupId || 'new' }, error: null }) }) };
      },
      update(payload: any) {
        s._lastUpdate = payload;
        return { eq() { return { select() { return { single: async () => ({ data: { id: s.revivedSignupId || 'revived' }, error: null }) }; } }; } };
      }
    };
    async function single() {
      if (table === 'profiles' && _filters['zid']) return s.activeProfileByZid ?? null;
      if (table === 'user_signups') {
        const status = _filters['status'];
        if ('signup_email' in _filters) {
          if (status === 'PENDING_VERIFICATION') return s.pendingByEmail ?? null;
          if (status === 'EXPIRED') return s.expiredByEmail ?? null;
        }
        if ('zid' in _filters) {
          if (status === 'PENDING_VERIFICATION') return s.pendingByZid ?? null;
          if (status === 'EXPIRED') return s.expiredByZid ?? null;
        }
      }
      return null;
    }
    return api;
  }

  return { auth, from: (table: string) => qb(table) };
}
