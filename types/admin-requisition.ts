// @/types/admin-requisition.ts
export interface AdminItemRequisition {
    id: number;
    requisition_number?: string;
    requisition_date: string;
    department: string;
    requester: string;
    requester_user_id?: string;
    status: 'pending' | 'approved_by_technical_manager_c' | 'approved_by_technical_manager_m' | 'approved_by_senior_assistant_director' | 'approved' | 'rejected' | 'cancelled';
    total_items: number;
    
    technical_manager_c_approved_by?: string | null;
    technical_manager_c_approved_at?: string | null;
    
    technical_manager_m_approved_by?: string | null;
    technical_manager_m_approved_at?: string | null;
    
    senior_assistant_director_approved_by?: string | null;
    senior_assistant_director_approved_at?: string | null;
    
    quality_assurance_manager_approved_by?: string | null;
    quality_assurance_manager_approved_at?: string | null;
    
    rejected_at?: string | null;
    rejected_by?: string | null;
    rejected_by_role?: string | null;
    rejection_reason?: string | null;
    completed_at?: string | null;
    created_at: string;
    updated_at: string;
}

export interface AdminItem {
    id: number;
    registration_id: number;
    item_name: string;
    quantity: number;
    unit: string;
    remark: string;
    created_at: string;
    updated_at: string;
}

export interface AdminItemRequisitionItemForm {
    admin_item_id: number;
    item_name: string;
    unit: string;
    requested_quantity: number;
    remark?: string;
}

export interface AdminItemRequisitionFormData {
    requisition_date: string;
    department: string;
    requester: string;
    items: AdminItemRequisitionItemForm[];
}

export interface AdminItemRequisitionItem {
    id: number;
    requisition_id: number;
    admin_item_id: number;
    requested_quantity: number;
    approved_quantity: number;
    unit: string;
    remark: string;
    is_processed: boolean;
    processed_at?: string | null;
    created_at: string;
    updated_at: string;
}

export interface AdminItemAuditLogEntry {
    id: number;
    requisition_id: number;
    action: string;
    performed_by: string;
    performed_by_role: string;
    old_status?: string;
    new_status?: string;
    details: Record<string, unknown>;
    created_at: string;
}

export interface AdminItemInventoryTransaction {
    id: number;
    admin_item_id: number;
    requisition_item_id?: number;
    transaction_type: 'requisition_deduction' | 'manual_adjustment' | 'registration_addition';
    quantity_change: number;
    quantity_before: number;
    quantity_after: number;
    performed_by?: string;
    reason?: string;
    created_at: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export const ADMIN_STATUS_LABELS: Record<AdminItemRequisition['status'], string> = {
    pending: 'Pending All Approvals',
    approved_by_technical_manager_c: 'Approved by Technical Manager (C)',
    approved_by_technical_manager_m: 'Approved by Technical Manager (M)',
    approved_by_senior_assistant_director: 'Approved by Senior Assistant Director',
    approved: 'Fully Approved & Processed',
    rejected: 'Rejected',
    cancelled: 'Cancelled'
};

export const ADMIN_STATUS_COLORS: Record<AdminItemRequisition['status'], string> = {
    pending: 'bg-gray-600',
    approved_by_technical_manager_c: 'bg-yellow-600',
    approved_by_technical_manager_m: 'bg-yellow-600',
    approved_by_senior_assistant_director: 'bg-yellow-600',
    approved: 'bg-green-600',
    rejected: 'bg-red-600',
    cancelled: 'bg-gray-500'
};

export function validateQuantity(requested: number, available: number): { valid: boolean; error?: string } {
    if (requested <= 0) {
        return { valid: false, error: 'Quantity must be greater than 0' };
    }
    if (requested > available) {
        return { valid: false, error: `Cannot exceed available quantity (${available})` };
    }
    return { valid: true };
}