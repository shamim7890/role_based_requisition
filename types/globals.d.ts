// @/types/globals.ts
export {}

export type Roles = 'analyst' | 'technical_manager_c' | 'technical_manager_m' | 'senior_assistant_director' | 'quality_assurance_manager' | 'admin'

declare global {
    interface CustomJwtSessionClaims {
        metadata: {
            role?: Roles
        }
    }
}

export interface UserMetadata {
    role: Roles;
    department?: string;
    employee_id?: string;
}

export interface ClerkUser {
    id: string;
    fullName?: string;
    emailAddresses: Array<{ emailAddress: string }>;
    publicMetadata: UserMetadata;
}