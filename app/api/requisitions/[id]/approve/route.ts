// @/app/api/requisitions/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentRole } from '@/utils/roles';
import { currentUser } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAuditLog(
    requisitionId: number,
    action: string,
    performedBy: string,
    performedByRole: string,
    oldStatus?: string,
    newStatus?: string,
    details?: Record<string, unknown>
) {
    await supabase.from('requisition_audit_log').insert({
        requisition_id: requisitionId,
        action,
        performed_by: performedBy,
        performed_by_role: performedByRole,
        old_status: oldStatus,
        new_status: newStatus,
        details: details || {}
    });
}

async function processInventoryDeduction(requisitionId: number, performedBy: string) {
    interface RequisitionItemData {
        id: number;
        chemical_item_id: number;
        approved_quantity: number;
        requested_quantity: number;
    }

    const { data: items, error: itemsError } = await supabase
        .from('requisition_items')
        .select('id, chemical_item_id, approved_quantity, requested_quantity')
        .eq('requisition_id', requisitionId)
        .eq('is_processed', false);

    if (itemsError || !items) {
        throw new Error('Failed to fetch requisition items: ' + itemsError?.message);
    }

    for (const item of items as RequisitionItemData[]) {
        const quantityToDeduct = item.approved_quantity > 0 ? item.approved_quantity : item.requested_quantity;

        interface ChemicalItemData {
            quantity: number;
            chemical_name: string;
        }

        const { data: chemItem, error: chemError } = await supabase
            .from('chemical_items')
            .select('quantity, chemical_name')
            .eq('id', item.chemical_item_id)
            .single();

        if (chemError || !chemItem) {
            throw new Error(`Chemical item ${item.chemical_item_id} not found`);
        }

        const chemData = chemItem as ChemicalItemData;

        if (chemData.quantity < quantityToDeduct) {
            throw new Error(`Insufficient quantity for ${chemData.chemical_name}. Available: ${chemData.quantity}, Required: ${quantityToDeduct}`);
        }

        const newQuantity = chemData.quantity - quantityToDeduct;

        const { error: updateError } = await supabase
            .from('chemical_items')
            .update({ 
                quantity: newQuantity,
                updated_at: new Date().toISOString()
            })
            .eq('id', item.chemical_item_id);

        if (updateError) {
            throw new Error('Failed to update inventory: ' + updateError.message);
        }

        await supabase.from('inventory_transactions').insert({
            chemical_item_id: item.chemical_item_id,
            requisition_item_id: item.id,
            transaction_type: 'requisition_deduction',
            quantity_change: -quantityToDeduct,
            quantity_before: chemData.quantity,
            quantity_after: newQuantity,
            performed_by: performedBy,
            reason: `Requisition #${requisitionId} approved and processed`
        });

        await supabase
            .from('requisition_items')
            .update({ 
                is_processed: true,
                processed_at: new Date().toISOString()
            })
            .eq('id', item.id);
    }
}

interface ApprovalQuantity {
    item_id: number;
    quantity: number;
}

interface RequestBody {
    action: string;
    approved_quantities?: ApprovalQuantity[];
    rejection_reason?: string;
}

export async function PUT(
    request: NextRequest, 
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const requisitionId = parseInt(id, 10);
    
    try {
        const role = await getCurrentRole();
        
        if (!role || !['technical_manager_c', 'technical_manager_m', 'senior_assistant_director', 'quality_assurance_manager', 'admin'].includes(role)) {
            return NextResponse.json({ 
                error: 'Only approvers can approve requisitions' 
            }, { status: 403 });
        }

        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        const userName = 
            [user.firstName, user.lastName]
                .filter(Boolean)
                .join(' ') ||
            user.emailAddresses?.[0]?.emailAddress ||
            'Unknown';

        const body: RequestBody = await request.json();
        const { action, approved_quantities, rejection_reason } = body;

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        interface RequisitionData {
            status: string;
            technical_manager_c_approved_at: string | null;
            technical_manager_m_approved_at: string | null;
            senior_assistant_director_approved_at: string | null;
            quality_assurance_manager_approved_at: string | null;
        }

        const { data: reqData, error: fetchError } = await supabase
            .from('requisitions')
            .select('*')
            .eq('id', requisitionId)
            .single();

        if (fetchError || !reqData) {
            return NextResponse.json({ error: 'Requisition not found' }, { status: 404 });
        }

        const requisition = reqData as RequisitionData;
        const { status } = requisition;

        if (status === 'rejected' || status === 'cancelled') {
            return NextResponse.json({ error: `Already ${status}` }, { status: 400 });
        }

        if (status === 'approved') {
            return NextResponse.json({ error: 'Already fully approved' }, { status: 400 });
        }

        // Handle rejection
        if (action === 'reject') {
            const { error: rejectError } = await supabase
                .from('requisitions')
                .update({ 
                    status: 'rejected',
                    rejected_at: new Date().toISOString(),
                    rejected_by: userName,
                    rejected_by_role: role,
                    rejection_reason: rejection_reason || 'No reason provided',
                    updated_at: new Date().toISOString()
                })
                .eq('id', requisitionId);

            if (rejectError) {
                return NextResponse.json({ 
                    error: 'Failed to reject: ' + rejectError.message 
                }, { status: 500 });
            }

            await createAuditLog(
                requisitionId,
                'rejected',
                userName,
                role,
                status,
                'rejected',
                { rejection_reason }
            );

            return NextResponse.json({ success: true, status: 'rejected' });
        }

        // Handle approval
        const updateFields: Record<string, string | number> = { 
            updated_at: new Date().toISOString() 
        };
        let newStatus = status;

        // Check if already approved by this role
        if (role === 'technical_manager_c') {
            if (requisition.technical_manager_c_approved_at) {
                return NextResponse.json({ error: 'Already approved by Technical Manager (C)' }, { status: 400 });
            }
            updateFields.technical_manager_c_approved_at = new Date().toISOString();
            updateFields.technical_manager_c_approved_by = userName;
            newStatus = 'approved_by_technical_manager_c';
        } else if (role === 'technical_manager_m') {
            if (requisition.technical_manager_m_approved_at) {
                return NextResponse.json({ error: 'Already approved by Technical Manager (M)' }, { status: 400 });
            }
            updateFields.technical_manager_m_approved_at = new Date().toISOString();
            updateFields.technical_manager_m_approved_by = userName;
            
            if (requisition.technical_manager_c_approved_at) {
                newStatus = 'approved_by_technical_manager_m';
            }
        } else if (role === 'senior_assistant_director') {
            if (requisition.senior_assistant_director_approved_at) {
                return NextResponse.json({ error: 'Already approved by Senior Assistant Director' }, { status: 400 });
            }
            updateFields.senior_assistant_director_approved_at = new Date().toISOString();
            updateFields.senior_assistant_director_approved_by = userName;
            
            if (requisition.technical_manager_c_approved_at && requisition.technical_manager_m_approved_at) {
                newStatus = 'approved_by_senior_assistant_director';
            }
        } else if (role === 'quality_assurance_manager') {
            if (requisition.quality_assurance_manager_approved_at) {
                return NextResponse.json({ error: 'Already approved by Quality Assurance Manager' }, { status: 400 });
            }
            updateFields.quality_assurance_manager_approved_at = new Date().toISOString();
            updateFields.quality_assurance_manager_approved_by = userName;
            
            if (requisition.technical_manager_c_approved_at && 
                requisition.technical_manager_m_approved_at && 
                requisition.senior_assistant_director_approved_at) {
                newStatus = 'approved';
                updateFields.completed_at = new Date().toISOString();
            }
        } else if (role === 'admin') {
            // Admin can skip to full approval
            updateFields.technical_manager_c_approved_at = new Date().toISOString();
            updateFields.technical_manager_c_approved_by = userName;
            updateFields.technical_manager_m_approved_at = new Date().toISOString();
            updateFields.technical_manager_m_approved_by = userName;
            updateFields.senior_assistant_director_approved_at = new Date().toISOString();
            updateFields.senior_assistant_director_approved_by = userName;
            updateFields.quality_assurance_manager_approved_at = new Date().toISOString();
            updateFields.quality_assurance_manager_approved_by = userName;
            newStatus = 'approved';
            updateFields.completed_at = new Date().toISOString();
        }

        updateFields.status = newStatus;

        const { error: approveError } = await supabase
            .from('requisitions')
            .update(updateFields)
            .eq('id', requisitionId);

        if (approveError) {
            return NextResponse.json({ 
                error: 'Failed to approve: ' + approveError.message 
            }, { status: 500 });
        }

        // Update approved quantities if provided
        if (approved_quantities && approved_quantities.length > 0) {
            for (const item of approved_quantities) {
                await supabase
                    .from('requisition_items')
                    .update({ approved_quantity: item.quantity })
                    .eq('id', item.item_id);
            }
        }

        // Process inventory deduction if fully approved
        if (newStatus === 'approved') {
            try {
                await processInventoryDeduction(requisitionId, userName);
                
                await createAuditLog(
                    requisitionId,
                    'inventory_deducted',
                    userName,
                    role,
                    undefined,
                    undefined,
                    { message: 'Inventory successfully deducted' }
                );
            } catch (invError) {
                const errorMessage = invError instanceof Error ? invError.message : 'Unknown error';
                
                // Rollback approval
                const rollbackFields: Record<string, string | null> = {
                    status: status,
                    completed_at: null
                };
                
                if (role === 'technical_manager_c') {
                    rollbackFields.technical_manager_c_approved_at = null;
                    rollbackFields.technical_manager_c_approved_by = null;
                } else if (role === 'technical_manager_m') {
                    rollbackFields.technical_manager_m_approved_at = null;
                    rollbackFields.technical_manager_m_approved_by = null;
                } else if (role === 'senior_assistant_director') {
                    rollbackFields.senior_assistant_director_approved_at = null;
                    rollbackFields.senior_assistant_director_approved_by = null;
                } else if (role === 'quality_assurance_manager') {
                    rollbackFields.quality_assurance_manager_approved_at = null;
                    rollbackFields.quality_assurance_manager_approved_by = null;
                }

                await supabase
                    .from('requisitions')
                    .update(rollbackFields)
                    .eq('id', requisitionId);

                return NextResponse.json({ 
                    error: 'Approval succeeded but inventory deduction failed: ' + errorMessage + '. Approval has been rolled back.' 
                }, { status: 500 });
            }
        }

        await createAuditLog(
            requisitionId,
            `${role}_approved`,
            userName,
            role,
            status,
            newStatus
        );

        return NextResponse.json({ success: true, status: newStatus });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}