// @/types/requisition.ts
export interface Requisition {
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

export interface ChemicalItem {
    id: number;
    registration_id: number;
    chemical_name: string;
    quantity: number;
    original_quantity?: number;
    unit: string;
    expiry_date: string;
    remark: string;
    is_depleted?: boolean;
    created_at: string;
    updated_at: string;
}

export interface RequisitionItemForm {
    chemical_item_id: number;
    chemical_name: string;
    unit: string;
    expiry_date: string;
    requested_quantity: number;
    remark?: string;
}

export interface RequisitionFormData {
    requisition_date: string;
    department: string;
    requester: string;
    items: RequisitionItemForm[];
}

export interface RequisitionItem {
    id: number;
    requisition_id: number;
    chemical_item_id: number;
    requested_quantity: number;
    approved_quantity: number;
    unit: string;
    expiry_date: string;
    remark: string;
    is_processed: boolean;
    processed_at?: string | null;
    created_at: string;
    updated_at: string;
}

export interface AuditLogEntry {
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

export interface InventoryTransaction {
    id: number;
    chemical_item_id: number;
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

export const STATUS_LABELS: Record<Requisition['status'], string> = {
    pending: 'Pending All Approvals',
    approved_by_technical_manager_c: 'Approved by Technical Manager (C)',
    approved_by_technical_manager_m: 'Approved by Technical Manager (M)',
    approved_by_senior_assistant_director: 'Approved by Senior Assistant Director',
    approved: 'Fully Approved & Processed',
    rejected: 'Rejected',
    cancelled: 'Cancelled'
};

export const STATUS_COLORS: Record<Requisition['status'], string> = {
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

export function isExpired(expiryDate: string): boolean {
    return new Date(expiryDate) < new Date();
}

export function isExpiringSoon(expiryDate: string, daysThreshold: number = 30): boolean {
    const expiry = new Date(expiryDate);
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + daysThreshold);
    return expiry <= threshold && expiry >= new Date();
}