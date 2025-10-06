// @/utils/permissions.ts
import { Roles } from '@/types/globals'

export interface Permission {
    resource: string;
    action: 'create' | 'read' | 'update' | 'delete' | 'approve';
}

const ROLE_PERMISSIONS: Record<Roles, Permission[]> = {
    admin: [
        { resource: 'requisitions', action: 'read' },
        { resource: 'requisitions', action: 'approve' },
        { resource: 'requisitions', action: 'delete' },
        { resource: 'chemicals', action: 'create' },
        { resource: 'chemicals', action: 'read' },
        { resource: 'chemicals', action: 'update' },
        { resource: 'chemicals', action: 'delete' },
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'update' },
        { resource: 'audit_logs', action: 'read' },
    ],
    technical_manager_c: [
        { resource: 'requisitions', action: 'read' },
        { resource: 'requisitions', action: 'approve' },
        { resource: 'chemicals', action: 'read' },
        { resource: 'audit_logs', action: 'read' },
    ],
    technical_manager_m: [
        { resource: 'requisitions', action: 'read' },
        { resource: 'requisitions', action: 'approve' },
        { resource: 'chemicals', action: 'read' },
        { resource: 'audit_logs', action: 'read' },
    ],
    senior_assistant_director: [
        { resource: 'requisitions', action: 'read' },
        { resource: 'requisitions', action: 'approve' },
        { resource: 'chemicals', action: 'read' },
        { resource: 'audit_logs', action: 'read' },
    ],
    quality_assurance_manager: [
        { resource: 'requisitions', action: 'read' },
        { resource: 'requisitions', action: 'approve' },
        { resource: 'chemicals', action: 'read' },
        { resource: 'audit_logs', action: 'read' },
    ],
    analyst: [
        { resource: 'requisitions', action: 'create' },
        { resource: 'requisitions', action: 'read' },
        { resource: 'chemicals', action: 'read' },
    ],
}

export function hasPermission(role: Roles, resource: string, action: Permission['action']): boolean {
    const permissions = ROLE_PERMISSIONS[role] || []
    return permissions.some(p => p.resource === resource && p.action === action)
}

export function getRolePermissions(role: Roles): Permission[] {
    return ROLE_PERMISSIONS[role] || []
}