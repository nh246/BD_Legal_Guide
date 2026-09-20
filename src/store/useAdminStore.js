import { create } from 'zustand';

export const PERMISSIONS = [
  { key: 'VERIFICATION_REVIEW', label: 'Verification Review', description: 'Approve or reject lawyer profiles and check credentials.' },
  { key: 'USER_MANAGEMENT', label: 'User Management', description: 'View, suspend, or manage client and lawyer accounts.' },
  { key: 'QUERY_LOG_VIEW', label: 'Query Log View', description: 'Access historical AI chat logs and queries for auditing.' },
  { key: 'COMPLAINT_HANDLING', label: 'Complaint Handling', description: 'Review and resolve user complaints and disputes.' },
  { key: 'FIRM_MANAGEMENT', label: 'Firm Management', description: 'Manage firm registrations, limits, and team access.' },
  { key: 'ANALYTICS_VIEW', label: 'Analytics View', description: 'View financial and usage metrics, revenue, and charts.' },
  { key: 'CONTENT_MODERATION', label: 'Content Moderation', description: 'Moderate public directory reviews and Q&A content.' }
];

export const INITIAL_MODS = [
  { id: 'm1', name: 'Rafiq Hasan', scopes: ['VERIFICATION_REVIEW'], status: 'active' },
  { id: 'm2', name: 'Shirin Akter', scopes: ['QUERY_LOG_VIEW', 'COMPLAINT_HANDLING'], status: 'active' },
  { id: 'm3', name: 'Tanvir Alam', scopes: ['USER_MANAGEMENT', 'FIRM_MANAGEMENT', 'ANALYTICS_VIEW'], status: 'suspended' }
];

const useAdminStore = create((set, get) => ({
  // Auth state specifically for Admin Portal
  adminRole: 'ADMIN', // 'ADMIN' or 'MODERATOR'
  activeModId: null, // The ID of the current moderator if role is MODERATOR

  // Data
  moderators: INITIAL_MODS,
  auditLogs: [
    { id: 1, timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), actor: 'Admin', action: 'Created Moderator', target: 'Rafiq Hasan' },
    { id: 2, timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), actor: 'Admin', action: 'Suspended Moderator', target: 'Tanvir Alam' },
  ],

  // Actions
  setAdminRole: (role, modId = null) => set({ adminRole: role, activeModId: modId }),
  
  addModerator: (mod) => set(state => {
    const newMod = { ...mod, id: Date.now().toString() };
    get().addAuditLog({ actor: get().getCurrentActor(), action: 'Created Moderator', target: newMod.name });
    return { moderators: [...state.moderators, newMod] };
  }),

  updateModerator: (id, updates) => set(state => {
    get().addAuditLog({ actor: get().getCurrentActor(), action: 'Updated Moderator', target: id });
    return {
      moderators: state.moderators.map(m => m.id === id ? { ...m, ...updates } : m)
    };
  }),

  deleteModerator: (id) => set(state => {
    const target = state.moderators.find(m => m.id === id)?.name || id;
    get().addAuditLog({ actor: get().getCurrentActor(), action: 'Deleted Moderator', target });
    return { moderators: state.moderators.filter(m => m.id !== id) };
  }),

  addAuditLog: ({ actor, action, target }) => set(state => ({
    auditLogs: [{
      id: Date.now(),
      timestamp: new Date().toISOString(),
      actor,
      action,
      target
    }, ...state.auditLogs]
  })),

  // Helpers
  getCurrentActor: () => {
    const { adminRole, activeModId, moderators } = get();
    if (adminRole === 'ADMIN') return 'Admin';
    if (adminRole === 'MODERATOR') {
      const mod = moderators.find(m => m.id === activeModId);
      return mod ? mod.name : 'Unknown Mod';
    }
    return 'System';
  },

  hasScope: (scopeKey) => {
    const { adminRole, activeModId, moderators } = get();
    if (adminRole === 'ADMIN') return true;
    if (adminRole === 'MODERATOR') {
      const mod = moderators.find(m => m.id === activeModId);
      if (!mod || mod.status !== 'active') return false;
      return mod.scopes.includes(scopeKey);
    }
    return false;
  }
}));

export default useAdminStore;
