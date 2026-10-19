/** Landing route for each role after login. */
export function homeForRole(role) {
  switch (role) {
    case 'admin':
    case 'moderator':
      return '/admin';
    case 'lawyer':
      return '/lawyer';
    case 'user':
      return '/client';
    default:
      return '/';
  }
}

/** Moderator permission scopes (static config, enforced server-side). */
export const PERMISSIONS = [
  { key: 'ANALYTICS_VIEW', label: 'Analytics View', description: 'View platform metrics on the admin dashboard.' },
  { key: 'USER_MANAGEMENT', label: 'User Management', description: 'View, suspend, or manage client accounts.' },
  { key: 'VERIFICATION_REVIEW', label: 'Lawyer Verification', description: 'Approve or reject lawyer profiles and credentials.' },
  { key: 'FIRM_MANAGEMENT', label: 'Firm Management', description: 'Manage firm registrations and team access.' },
  { key: 'QUERY_LOG_VIEW', label: 'Query Log View', description: 'Access AI chat query logs for auditing.' },
  { key: 'AUDIT_LOG_VIEW', label: 'Audit Log View', description: 'View the record of administrative actions.' },
];
