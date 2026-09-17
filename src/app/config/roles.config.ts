import { UserRole } from '../models/supply-chain.model';

/**
 * Role definitions and module access, mirroring the RB ABC Supply Chain
 * user-access matrix (User Role / Main Responsibility / System Access sheet).
 */

export const ROLE_LABELS: Record<UserRole, string> = {
  NURSE: 'Nurse (Branch User)',
  RNS: 'Regional Nurse Supervisor',
  DISTRICT_MANAGER: 'District Manager',
  SUPPLY_OFFICER: 'Supply Officer',
  SUPPLY_DIRECTOR: 'Supply Chain Director',
};

export const ROLE_RESPONSIBILITIES: Record<UserRole, string> = {
  NURSE: 'Branch inventory management and purchase request initiation.',
  RNS: 'Clinical inventory monitoring and branch validation.',
  DISTRICT_MANAGER: 'Operational approval and branch request authorization.',
  SUPPLY_OFFICER: 'Centralized procurement and inventory control.',
  SUPPLY_DIRECTOR: 'Strategic monitoring, approval, and decision-making.',
};

export const ALL_ROLES: UserRole[] = [
  'NURSE',
  'RNS',
  'DISTRICT_MANAGER',
  'SUPPLY_OFFICER',
  'SUPPLY_DIRECTOR',
];

/** Roles that initiate a branch Purchase Request. */
export const REQUEST_CREATOR_ROLES: UserRole[] = ['NURSE'];

/** Roles that perform the Regional Nurse Supervisor review/endorsement step. */
export const RNS_REVIEW_ROLES: UserRole[] = ['RNS'];

/** Roles that approve or return branch purchase requests. */
export const APPROVAL_ROLES: UserRole[] = ['DISTRICT_MANAGER'];

/** Roles that manage centralized procurement, PRS processing, and suppliers. */
export const PROCUREMENT_ROLES: UserRole[] = ['SUPPLY_OFFICER'];

/** Roles that manage branch/HQ reference data. */
export const REFERENCE_DATA_ROLES: UserRole[] = ['SUPPLY_OFFICER'];

/** Roles that can manage user accounts and role assignments. */
export const USER_MANAGEMENT_ROLES: UserRole[] = ['SUPPLY_OFFICER'];

/**
 * Checks whether a role has access to something gated by an allow-list.
 * SUPPLY_DIRECTOR is a super-role with full system access everywhere
 * ("✅ Full system access" in the user-access matrix), so it always passes.
 */
export function roleCanAccess(role: UserRole | null | undefined, allowed: UserRole[]): boolean {
  if (!role) {
    return false;
  }

  if (role === 'SUPPLY_DIRECTOR') {
    return true;
  }

  return allowed.includes(role);
}
