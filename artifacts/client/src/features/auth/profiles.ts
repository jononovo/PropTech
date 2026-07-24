import type { VerdictDecidedBy } from '@workspace/api-client-react';

/**
 * Test sign-in profiles. Real authentication replaces this module later —
 * the rest of the app only ever consumes `Profile`, so the swap is contained.
 */
export interface Profile {
  id: string;
  name: string;
  role: VerdictDecidedBy;
  org: string;
  initials: string;
}

export const PROFILES: Profile[] = [
  { id: 'ron', name: 'Ron Alvarez', role: 'Originator', org: 'Golden State Home Loans', initials: 'RA' },
  { id: 'dana', name: 'Dana Whitfield', role: 'Underwriter', org: 'Homium Underwriting', initials: 'DW' },
  { id: 'priya', name: 'Priya Nair', role: 'Underwriter', org: 'Homium Underwriting', initials: 'PN' },
  { id: 'marcus', name: 'Marcus Cole', role: 'Manager', org: 'Homium Compliance', initials: 'MC' },
];

export const DEFAULT_PROFILE_ID = PROFILES[0].id;
