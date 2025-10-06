// @/app/api/requisitions/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRole } from '@/utils/roles';
import { auth } from '@clerk/nextjs/server';
import { RequisitionFormData, RequisitionItemForm } from '@/types/requisition';

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

export async function POST(request: NextRequest) {
    try {
        if (!(await checkRole('analyst'))) {
            return NextResponse.json({ error: 'Only analysts can create requisitions' }, { status: 403 });
        }

        const { userId } = await auth();
        const body: RequisitionFormData = await request.json();

        if (!body.department || !body.requester || body.items.length === 0) {
            return NextResponse.json({ error: 'Missing required fields or items' }, { status: 400 });
        }

        for (const item of body.items) {
            const { data: chemItem, error } = await supabase
                .from('chemical_items')
                .select('quantity, chemical_name, unit')
                .eq('id', item.chemical_item_id)
                .single();

            if (error || !chemItem) {
                return NextResponse.json({ 
                    error: `Chemical item ${item.chemical_item_id} not found` 
                }, { status: 400 });
            }

            if (item.requested_quantity > chemItem.quantity) {
                return NextResponse.json({ 
                    error: `Requested quantity for ${chemItem.chemical_name} (${item.requested_quantity} ${chemItem.unit}) exceeds available stock (${chemItem.quantity} ${chemItem.unit})` 
                }, { status: 400 });
            }
        }

        const { data: reqData, error: reqError } = await supabase
            .from('requisitions')
            .insert({
                requisition_date: body.requisition_date,
                department: body.department,
                requester: body.requester,
                requester_user_id: userId,
                total_items: body.items.length,
                status: 'pending'
            })
            .select()
            .single();

        if (reqError || !reqData) {
            return NextResponse.json({ 
                error: 'Failed to create requisition: ' + (reqError?.message || 'Unknown error') 
            }, { status: 500 });
        }

        const itemsToInsert = body.items.map((item: RequisitionItemForm) => ({
            requisition_id: reqData.id,
            chemical_item_id: item.chemical_item_id,
            requested_quantity: item.requested_quantity,
            approved_quantity: 0,
            unit: item.unit,
            expiry_date: item.expiry_date,
            remark: item.remark || '',
            is_processed: false
        }));

        const { error: itemsError } = await supabase
            .from('requisition_items')
            .insert(itemsToInsert);

        if (itemsError) {
            await supabase.from('requisitions').delete().eq('id', reqData.id);
            return NextResponse.json({ 
                error: 'Failed to save items: ' + itemsError.message 
            }, { status: 500 });
        }

        await createAuditLog(
            reqData.id,
            'created',
            body.requester,
            'analyst',
            undefined,
            'pending',
            { items_count: body.items.length }
        );

        return NextResponse.json({ 
            id: reqData.id, 
            requisition_number: reqData.requisition_number,
            success: true 
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const isAnalyst = await checkRole('analyst');
        const isAdmin = await checkRole('admin');
        const isTechManagerC = await checkRole('technical_manager_c');
        const isTechManagerM = await checkRole('technical_manager_m');
        const isSeniorDir = await checkRole('senior_assistant_director');
        const isQAManager = await checkRole('quality_assurance_manager');
        
        const isApprover = isTechManagerC || isTechManagerM || isSeniorDir || isQAManager;
        
        if (!isAnalyst && !isAdmin && !isApprover) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'active';
        const { userId } = await auth();

        let query = supabase
            .from('requisitions')
            .select(`
                *,
                requisition_items!inner (
                    id,
                    requested_quantity,
                    approved_quantity,
                    unit,
                    expiry_date,
                    remark,
                    chemical_item_id,
                    is_processed,
                    chemical_items (
                        chemical_name,
                        quantity
                    )
                )
            `);

        if (status === 'active') {
            query = query.in('status', [
                'pending',
                'approved_by_technical_manager_c',
                'approved_by_technical_manager_m',
                'approved_by_senior_assistant_director'
            ]);
        } else if (status === 'completed') {
            query = query.in('status', ['approved', 'rejected', 'cancelled']);
        }

        if (isAnalyst && !isAdmin && !isApprover) {
            query = query.eq('requester_user_id', userId);
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        interface ChemicalItemData {
            chemical_name?: string;
            quantity?: number;
        }

        interface RequisitionItemData {
            id: number;
            requested_quantity: number;
            approved_quantity: number;
            unit: string;
            remark: string;
            is_processed: boolean;
            chemical_items?: ChemicalItemData;
        }

        interface RequisitionData {
            requisition_items?: RequisitionItemData[];
            [key: string]: unknown;
        }

        const transformed = (data || []).map((req: RequisitionData) => ({
            ...req,
            items: (req.requisition_items || []).map((item: RequisitionItemData) => ({
                id: item.id,
                chemical_name: item.chemical_items?.chemical_name || 'Unknown',
                available_quantity: item.chemical_items?.quantity || 0,
                requested_quantity: item.requested_quantity,
                approved_quantity: item.approved_quantity,
                unit: item.unit,
                remark: item.remark,
                is_processed: item.is_processed
            }))
        }));

        return NextResponse.json(transformed);
    } catch (error) {
        console.error('Error fetching requisitions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}