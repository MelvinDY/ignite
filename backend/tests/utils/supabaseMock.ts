// tests/utils/supabaseMock.ts
export type Scenario = {
  adminUserByEmail: any | null;
  adminListUsers: any[];
  activeProfileByEmail: { id: string } | null;
  activeProfileByZid: { id: string } | null;
  pendingByEmail: { id: string; zid?: string } | null;
  pendingByZid: { id: string } | null;
  expiredByZid: { id: string; signup_email: string } | null;
  expiredByEmail: { id: string; zid: string } | null;
  createdSignupId: string;
  revivedSignupId: string;
};

type Filters = Record<string, any>;

function projector<T extends Record<string, any>>(row: T, cols: string) {
  if (!cols || cols === '*') return row;
  const wanted = cols.split(',').map((s) => s.trim());
  const out: any = {};
  for (const k of wanted) if (k in row) out[k] = row[k];
  return out;
}

export function makeSupabaseMock(scenario: Scenario) {
  return {
    from(table: string) {
      if (table === 'profiles') {
        const state: { filters: Filters; cols: string } = { filters: {}, cols: 'id' };
        const api = {
          select(cols: string) {
            state.cols = cols; return api;
          },
          eq(col: string, val: any) {
            state.filters[col] = val; return api;
          },
          maybeSingle() {
            const { status, email, zid } = state.filters;
            if (status === 'ACTIVE') {
              if (email && scenario.activeProfileByEmail) {
                return { data: projector(scenario.activeProfileByEmail, state.cols), error: null };
              }
              if (zid && scenario.activeProfileByZid) {
                return { data: projector(scenario.activeProfileByZid, state.cols), error: null };
              }
            }
            return { data: null, error: null };
          },
          single() { return api.maybeSingle(); },
        };
        return api;
      }

      if (table === 'user_signups') {
        const state: { filters: Filters; cols: string } = { filters: {}, cols: 'id' };
        const api = {
          select(cols: string) { state.cols = cols; return api; },
          eq(col: string, val: any) { state.filters[col] = val; return api; },

          maybeSingle() {
            const { signup_email, zid, status } = state.filters;

            // PENDING by email
            if (signup_email && status === 'PENDING_VERIFICATION' && scenario.pendingByEmail) {
              const row = {
                id: scenario.pendingByEmail.id,
                zid: scenario.pendingByEmail.zid ?? 'z1234567',
              };
              return { data: projector(row, state.cols), error: null };
            }
            // PENDING by zid
            if (zid && status === 'PENDING_VERIFICATION' && scenario.pendingByZid) {
              const row = { id: scenario.pendingByZid.id };
              return { data: projector(row, state.cols), error: null };
            }
            // EXPIRED by zid
            if (zid && status === 'EXPIRED' && scenario.expiredByZid) {
              const row = { id: scenario.expiredByZid.id, signup_email: scenario.expiredByZid.signup_email };
              return { data: projector(row, state.cols), error: null };
            }
            // EXPIRED by email
            if (signup_email && status === 'EXPIRED' && scenario.expiredByEmail) {
              const row = { id: scenario.expiredByEmail.id, zid: scenario.expiredByEmail.zid };
              return { data: projector(row, state.cols), error: null };
            }
            return { data: null, error: null };
          },
          single() { return api.maybeSingle(); },

          insert(_values: any) {
            // fresh PENDING row path: .insert(...).select('id').single()
            return {
              select: (_cols: string) => ({
                single: () => ({ data: { id: scenario.createdSignupId }, error: null }),
              }),
            };
          },

          update(_values: any) {
            // supports both:
            //  - update(...).eq('id', X)                     (resume token update)
            //  - update(...).eq('id', X).select('id').single() (revive flow)
            return {
              eq: (_col: string, _val: any) => ({
                select: (_cols: string) => ({
                  single: () => ({
                    data: { id: scenario.revivedSignupId ?? scenario.createdSignupId },
                    error: null,
                  }),
                }),
              }),
            };
          },
        };
        return api;
      }

      // default table mock
      return {
        select: () => ({ maybeSingle: () => ({ data: null, error: null }) }),
      };
    },
  };
}
