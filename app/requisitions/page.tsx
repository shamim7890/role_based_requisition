// @/app/requisitions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Requisition } from '@/types/requisition';

interface RequisitionItem {
    id: number;
    chemical_name: string;
    available_quantity: number;
    requested_quantity: number;
    approved_quantity: number;
    unit: string;
    remark: string;
    is_processed: boolean;
}

// @/app/requisitions/page.tsx (continued)

interface RequisitionWithItems extends Requisition {
    requisition_number: string;
    items: RequisitionItem[];
}

export default function RequisitionsPage() {
    const { isLoaded, isSignedIn, user } = useUser();
    const router = useRouter();
    const [requisitions, setRequisitions] = useState<RequisitionWithItems[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [approvingId, setApprovingId] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<'active' | 'completed' | 'all'>('active');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [rejectionReason, setRejectionReason] = useState<{ [key: number]: string }>({});
    const [showPartialApproval, setShowPartialApproval] = useState<number | null>(null);
    const [partialQuantities, setPartialQuantities] = useState<{ [key: number]: number }>({});

    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            setRole(user?.publicMetadata?.role as string || null);
            fetchRequisitions();
        } else if (isLoaded && !isSignedIn) {
            router.push('/sign-in');
        }
    }, [isLoaded, isSignedIn, user, router, statusFilter]);

    const isAnalyst = role === 'analyst';
    const isAdmin = role === 'admin';
    const isTechManagerC = role === 'technical_manager_c';
    const isTechManagerM = role === 'technical_manager_m';
    const isSeniorDir = role === 'senior_assistant_director';
    const isQAManager = role === 'quality_assurance_manager';
    const isApprover = isTechManagerC || isTechManagerM || isSeniorDir || isQAManager;

    async function fetchRequisitions() {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/requisitions?status=${statusFilter}`);
        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            setError(result.error || 'Failed to load requisitions');
            setLoading(false);
            return;
        }
        const data = await response.json();
        setRequisitions(data || []);
        setLoading(false);
    }

    async function handleAction(
        requisitionId: number, 
        action: 'approve' | 'reject', 
        approvedQuantities?: Array<{ item_id: number; quantity: number }>
    ) {
        setApprovingId(requisitionId);
        setError(null);
        
        const payload: Record<string, unknown> = { action };
        if (action === 'reject') {
            payload.rejection_reason = rejectionReason[requisitionId] || 'No reason provided';
        }
        if (approvedQuantities && approvedQuantities.length > 0) {
            payload.approved_quantities = approvedQuantities;
        }

        const response = await fetch(`/api/requisitions/${requisitionId}/approve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            setError(result.error || 'Failed to update requisition');
        } else {
            fetchRequisitions();
            setShowPartialApproval(null);
            setPartialQuantities({});
            setRejectionReason({});
        }
        setApprovingId(null);
    }

    const getStatusBadge = (req: RequisitionWithItems) => {
        if (req.rejected_at) {
            return (
                <span className="bg-red-600 px-3 py-1 rounded-full text-xs font-semibold">
                    Rejected by {req.rejected_by_role}
                </span>
            );
        }
        if (req.completed_at && req.status === 'approved') {
            return (
                <span className="bg-green-600 px-3 py-1 rounded-full text-xs font-semibold">
                    Fully Approved & Processed
                </span>
            );
        }
        if (req.quality_assurance_manager_approved_at && 
            req.senior_assistant_director_approved_at && 
            req.technical_manager_m_approved_at && 
            req.technical_manager_c_approved_at) {
            return (
                <span className="bg-green-600 px-3 py-1 rounded-full text-xs font-semibold">
                    All Approvals Complete
                </span>
            );
        }
        if (req.senior_assistant_director_approved_at) {
            return (
                <span className="bg-yellow-600 px-3 py-1 rounded-full text-xs font-semibold">
                    Approved by SAD (Awaiting QA Manager)
                </span>
            );
        }
        if (req.technical_manager_m_approved_at) {
            return (
                <span className="bg-yellow-600 px-3 py-1 rounded-full text-xs font-semibold">
                    Approved by TM(M) (Awaiting SAD)
                </span>
            );
        }
        if (req.technical_manager_c_approved_at) {
            return (
                <span className="bg-yellow-600 px-3 py-1 rounded-full text-xs font-semibold">
                    Approved by TM(C) (Awaiting TM(M))
                </span>
            );
        }
        return (
            <span className="bg-gray-600 px-3 py-1 rounded-full text-xs font-semibold">
                Pending All Approvals
            </span>
        );
    };

    const canApproveReq = (req: RequisitionWithItems) => {
        if (req.rejected_at || req.completed_at) return false;
        
        if (isAdmin) return true;
        
        if (isTechManagerC && !req.technical_manager_c_approved_at) return true;
        if (isTechManagerM && req.technical_manager_c_approved_at && !req.technical_manager_m_approved_at) return true;
        if (isSeniorDir && req.technical_manager_c_approved_at && req.technical_manager_m_approved_at && !req.senior_assistant_director_approved_at) return true;
        if (isQAManager && req.technical_manager_c_approved_at && req.technical_manager_m_approved_at && req.senior_assistant_director_approved_at && !req.quality_assurance_manager_approved_at) return true;
        
        return false;
    };

    const getApprovalMessage = (req: RequisitionWithItems) => {
        if (req.rejected_at) return 'This requisition has been rejected.';
        if (req.completed_at) return 'This requisition has been fully processed.';
        
        if (isTechManagerC && req.technical_manager_c_approved_at) {
            return 'You have already approved this requisition.';
        }
        if (isTechManagerM) {
            if (req.technical_manager_m_approved_at) return 'You have already approved this requisition.';
            if (!req.technical_manager_c_approved_at) return 'Awaiting Technical Manager (C) approval first.';
        }
        if (isSeniorDir) {
            if (req.senior_assistant_director_approved_at) return 'You have already approved this requisition.';
            if (!req.technical_manager_c_approved_at || !req.technical_manager_m_approved_at) {
                return 'Awaiting previous approvals (TM(C) and TM(M)).';
            }
        }
        if (isQAManager) {
            if (req.quality_assurance_manager_approved_at) return 'You have already approved this requisition.';
            if (!req.technical_manager_c_approved_at || !req.technical_manager_m_approved_at || !req.senior_assistant_director_approved_at) {
                return 'Awaiting previous approvals (TM(C), TM(M), and SAD).';
            }
        }
        
        return null;
    };

    const handlePartialApproval = (reqId: number) => {
        const req = requisitions.find(r => r.id === reqId);
        if (!req) return;

        const approvedQuantities = req.items.map(item => ({
            item_id: item.id,
            quantity: partialQuantities[item.id] ?? item.requested_quantity
        }));

        handleAction(reqId, 'approve', approvedQuantities);
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-gray-100">Loading...</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-gray-100">Loading requisitions...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Chemical Requisitions</h1>
                    <div className="flex gap-3">
                        {isAnalyst && (
                            <button 
                                onClick={() => router.push('/requisitions/new')} 
                                className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                            >
                                + New Requisition
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 mb-6 border-b border-gray-700">
                    {(['active', 'completed', 'all'] as const).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setStatusFilter(filter)}
                            className={`px-4 py-2 font-semibold transition-colors ${
                                statusFilter === filter
                                    ? 'border-b-2 border-blue-500 text-blue-400'
                                    : 'text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="p-4 bg-red-900/20 border border-red-500 text-red-300 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                <div className="grid gap-4">
                    {requisitions.map((req) => (
                        <div key={req.id} className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
                            <div 
                                className="p-5 bg-gray-750 cursor-pointer hover:bg-gray-700 transition-colors"
                                onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-lg text-blue-400">
                                            {req.requisition_number || `#${req.id}`}
                                        </h3>
                                        <p className="text-gray-400 text-sm mt-1">
                                            {req.department} | {req.requester}
                                        </p>
                                        <p className="text-gray-500 text-xs mt-1">
                                            Created: {new Date(req.requisition_date).toLocaleDateString()} | 
                                            Items: {req.items.length}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {getStatusBadge(req)}
                                        <button className="text-gray-400 text-sm">
                                            {expandedId === req.id ? 'Collapse' : 'Expand'}
                                        </button>
                                    </div>
                                </div>

                                {(!expandedId || expandedId !== req.id) && (
                                    <div className="flex gap-4 text-xs text-gray-500">
                                        {req.technical_manager_c_approved_at && (
                                            <span>TM(C): {req.technical_manager_c_approved_by}</span>
                                        )}
                                        {req.technical_manager_m_approved_at && (
                                            <span>TM(M): {req.technical_manager_m_approved_by}</span>
                                        )}
                                        {req.senior_assistant_director_approved_at && (
                                            <span>SAD: {req.senior_assistant_director_approved_by}</span>
                                        )}
                                        {req.quality_assurance_manager_approved_at && (
                                            <span>QA: {req.quality_assurance_manager_approved_by}</span>
                                        )}
                                        {req.rejected_at && (
                                            <span className="text-red-400">Rejected</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {expandedId === req.id && (
                                <div className="p-5 space-y-4">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-700">
                                                <tr>
                                                    <th className="p-3 text-left">Chemical</th>
                                                    <th className="p-3 text-right">Available</th>
                                                    <th className="p-3 text-right">Requested</th>
                                                    <th className="p-3 text-right">Approved</th>
                                                    <th className="p-3 text-left">Status</th>
                                                    <th className="p-3 text-left">Remark</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {req.items.map((item) => (
                                                    <tr key={item.id} className="border-b border-gray-700">
                                                        <td className="p-3">{item.chemical_name}</td>
                                                        <td className="p-3 text-right">
                                                            {item.available_quantity} {item.unit}
                                                        </td>
                                                        <td className="p-3 text-right font-semibold">
                                                            {item.requested_quantity} {item.unit}
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            {item.approved_quantity > 0 
                                                                ? `${item.approved_quantity} ${item.unit}`
                                                                : '-'}
                                                        </td>
                                                        <td className="p-3">
                                                            {item.is_processed ? (
                                                                <span className="text-green-400 text-xs">Processed</span>
                                                            ) : (
                                                                <span className="text-yellow-400 text-xs">Pending</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-gray-400">{item.remark || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="bg-gray-700 p-4 rounded-lg space-y-2 text-sm">
                                        <h4 className="font-semibold text-gray-300 mb-2">Approval Timeline</h4>
                                        {req.technical_manager_c_approved_at && (
                                            <p className="text-gray-400">
                                                Technical Manager (C) approved by <span className="font-semibold">{req.technical_manager_c_approved_by}</span> on {new Date(req.technical_manager_c_approved_at).toLocaleString()}
                                            </p>
                                        )}
                                        {req.technical_manager_m_approved_at && (
                                            <p className="text-gray-400">
                                                Technical Manager (M) approved by <span className="font-semibold">{req.technical_manager_m_approved_by}</span> on {new Date(req.technical_manager_m_approved_at).toLocaleString()}
                                            </p>
                                        )}
                                        {req.senior_assistant_director_approved_at && (
                                            <p className="text-gray-400">
                                                Senior Assistant Director approved by <span className="font-semibold">{req.senior_assistant_director_approved_by}</span> on {new Date(req.senior_assistant_director_approved_at).toLocaleString()}
                                            </p>
                                        )}
                                        {req.quality_assurance_manager_approved_at && (
                                            <p className="text-gray-400">
                                                Quality Assurance Manager approved by <span className="font-semibold">{req.quality_assurance_manager_approved_by}</span> on {new Date(req.quality_assurance_manager_approved_at).toLocaleString()}
                                            </p>
                                        )}
                                        {req.rejected_at && (
                                            <div className="text-red-400">
                                                <p>Rejected by {req.rejected_by} ({req.rejected_by_role}) on {new Date(req.rejected_at).toLocaleString()}</p>
                                                <p className="mt-1 italic">Reason: {req.rejection_reason}</p>
                                            </div>
                                        )}
                                        {req.completed_at && (
                                            <p className="text-green-400 font-semibold">
                                                Completed and inventory deducted on {new Date(req.completed_at).toLocaleString()}
                                            </p>
                                        )}
                                    </div>

                                    {isApprover && canApproveReq(req) && (
                                        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-700">
                                            <button
                                                onClick={() => handleAction(req.id, 'approve')}
                                                disabled={approvingId === req.id}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                                            >
                                                {approvingId === req.id ? 'Processing...' : 'Approve'}
                                            </button>

                                            <button
                                                onClick={() => setShowPartialApproval(showPartialApproval === req.id ? null : req.id)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                Partial Approval
                                            </button>

                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="text"
                                                    placeholder="Rejection reason..."
                                                    value={rejectionReason[req.id] || ''}
                                                    onChange={(e) => setRejectionReason({ ...rejectionReason, [req.id]: e.target.value })}
                                                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                                                />
                                                <button
                                                    onClick={() => handleAction(req.id, 'reject')}
                                                    disabled={approvingId === req.id}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {showPartialApproval === req.id && (
                                        <div className="bg-gray-700 p-4 rounded-lg space-y-3">
                                            <h4 className="font-semibold text-gray-300">Adjust Approved Quantities</h4>
                                            {req.items.map((item) => (
                                                <div key={item.id} className="flex items-center gap-3">
                                                    <span className="flex-1 text-sm">{item.chemical_name}</span>
                                                    <span className="text-xs text-gray-400">Requested: {item.requested_quantity}</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={item.requested_quantity}
                                                        step="0.001"
                                                        value={partialQuantities[item.id] ?? item.requested_quantity}
                                                        onChange={(e) => setPartialQuantities({
                                                            ...partialQuantities,
                                                            [item.id]: parseFloat(e.target.value) || 0
                                                        })}
                                                        className="w-24 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-400">{item.unit}</span>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => handlePartialApproval(req.id)}
                                                disabled={approvingId === req.id}
                                                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-semibold"
                                            >
                                                Confirm Partial Approval
                                            </button>
                                        </div>
                                    )}

                                    {!canApproveReq(req) && isApprover && (
                                        <p className="text-sm text-gray-400 italic pt-4 border-t border-gray-700">
                                            {getApprovalMessage(req)}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {requisitions.length === 0 && (
                        <div className="bg-gray-800 rounded-lg p-8 text-center">
                            <p className="text-gray-400 text-lg">No requisitions found for this filter.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}