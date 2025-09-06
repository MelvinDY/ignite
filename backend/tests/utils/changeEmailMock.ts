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

export type EmailChangeScenario = Scenario & {
  userSignupById: { id: string; password_hash: string; full_name: string } | null;
  profileByEmail: { id: string } | null;
  profileById: { id: string; full_name: string } | null;
  pendingChange: { id: string; user_id: string } | null;
  pendingChangeCleared: boolean;
};

type Filters = Record<string, any>;

function projector<T extends Record<string, any>>(row: T, cols: string) {
  if (!cols || cols === '*') return row;
  const wanted = cols.split(',').map((s) => s.trim());
  const out: any = {};
  for (const k of wanted) if (k in row) out[k] = row[k];
  return out;
}

export function makeEmailChangeSupabaseMock(scenario: EmailChangeScenario) {
  return {
    from(table: string) {
      if (table === 'pending_email_changes') {
        const state: { filters: Filters } = { filters: {} };
        const api = {
          delete() {
            return {
              eq(col: string, val: any) {
                state.filters[col] = val;
                
                if (col === 'user_id' && scenario.pendingChange?.user_id === val) {
                  scenario.pendingChange = null;
                  scenario.pendingChangeCleared = true;
                }
              }
            };
          }
        };
        return api;
      }
      if (table === 'profiles') {
        const state: { filters: Filters; cols: string } = { filters: {}, cols: 'id' };
        const api = {
          select(cols: string) {
            state.cols = cols; 
            return api;
          },
          eq(col: string, val: any) {
            state.filters[col] = val; 
            return api;
          },
          
          single() {
            const { id } = state.filters;
            if (id && scenario.profileById) {
              return { 
                data: projector(scenario.profileById, state.cols), 
                error: null 
              };
            }
            return { data: null, error: null };
          },

          maybeSingle() {
            const { status, email, zid, id } = state.filters;
            
            // For profile lookup by ID
            if (id && scenario.profileById) {
              return { data: projector(scenario.profileById, state.cols), error: null };
            }
            
            // For email conflict checking in email change flow
            if (email && status === 'ACTIVE' && scenario.profileByEmail) {
              return { data: projector(scenario.profileByEmail, state.cols), error: null };
            }
            
            // Original logic for active profiles
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
        };
        return api;
      }

      if (table === 'user_signups') {
        const state: { filters: Filters; cols: string } = { filters: {}, cols: 'id' };
        const api = {
          select(cols: string) { 
            state.cols = cols; 
            return api; 
          },
          eq(col: string, val: any) { 
            state.filters[col] = val; 
            return api; 
          },

          // Add single() method for email change route queries
          single() {
            const { id } = state.filters;
            if (id && scenario.userSignupById) {
              return { 
                data: projector(scenario.userSignupById, state.cols), 
                error: null 
              };
            }
            return { data: null, error: null };
          },

          maybeSingle() {
            const { signup_email, zid, status, id } = state.filters;

            // Handle queries by ID (for email change route)
            if (id && scenario.userSignupById) {
              return { 
                data: projector(scenario.userSignupById, state.cols), 
                error: null 
              };
            }

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
              const row = { 
                id: scenario.expiredByZid.id, 
                signup_email: scenario.expiredByZid.signup_email 
              };
              return { data: projector(row, state.cols), error: null };
            }

            // EXPIRED by email
            if (signup_email && status === 'EXPIRED' && scenario.expiredByEmail) {
              const row = { 
                id: scenario.expiredByEmail.id, 
                zid: scenario.expiredByEmail.zid 
              };
              return { data: projector(row, state.cols), error: null };
            }

            return { data: null, error: null };
          },

          insert(_values: any) {
            return {
              select: (_cols: string) => ({
                single: () => ({ data: { id: scenario.createdSignupId }, error: null }),
              }),
            };
          },

          update(_values: any) {
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

      // Default table mock for any other tables
      return {
        select: () => ({ 
          eq: () => ({
            maybeSingle: () => ({ data: null, error: null }),
            single: () => ({ data: null, error: null }),
          }),
          maybeSingle: () => ({ data: null, error: null }),
          single: () => ({ data: null, error: null }),
        }),
      };
    },
  };
}