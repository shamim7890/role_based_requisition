// @/utils/roles.ts
import { Roles } from '@/types/globals'
import { auth } from '@clerk/nextjs/server'

export const checkRole = async (role: Roles): Promise<boolean> => {
    const { sessionClaims } = await auth()
    return sessionClaims?.metadata.role === role
}

export const getCurrentRole = async (): Promise<Roles | null> => {
    const { sessionClaims } = await auth()
    return (sessionClaims?.metadata.role as Roles) || null
}

export const hasAnyRole = async (roles: Roles[]): Promise<boolean> => {
    const { sessionClaims } = await auth()
    const userRole = sessionClaims?.metadata.role as Roles
    return roles.includes(userRole)
}

export const canApproveRequisitions = async (): Promise<boolean> => {
    return await hasAnyRole([
        'technical_manager_c',
        'technical_manager_m',
        'senior_assistant_director',
        'quality_assurance_manager',
        'admin'
    ])
}

export const canCreateRequisitions = async (): Promise<boolean> => {
    return await checkRole('analyst')
}

export const isApprover = async (): Promise<boolean> => {
    return await hasAnyRole([
        'technical_manager_c',
        'technical_manager_m',
        'senior_assistant_director',
        'quality_assurance_manager'
    ])
}