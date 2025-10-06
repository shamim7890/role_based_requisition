// @/app/requisitions/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { RequisitionFormData, ChemicalItem, RequisitionItemForm } from '@/types/requisition';

export default function NewRequisitionPage() {
    const { isLoaded, isSignedIn, user } = useUser();
    const router = useRouter();
    const [formData, setFormData] = useState<RequisitionFormData>({
        requisition_date: new Date().toISOString().split('T')[0],
        department: '',
        requester: user?.fullName || '',
        items: [],
    });
    const [availableChemicals, setAvailableChemicals] = useState<ChemicalItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<{ [key: number]: string }>({});

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            const role = user?.publicMetadata?.role as string;
            if (role !== 'analyst') {
                router.push('/requisitions');
            }
            setFormData(prev => ({ ...prev, requester: user?.fullName || '' }));
        } else if (isLoaded && !isSignedIn) {
            router.push('/sign-in');
        }
    }, [isLoaded, isSignedIn, user, router]);

    useEffect(() => {
        if (!isLoaded) return;

        async function fetchChemicals() {
            const response = await fetch('/api/chemicals');
            if (!response.ok) {
                setError('Failed to load chemicals');
                return;
            }
            const data = await response.json();
            setAvailableChemicals(data || []);
        }
        fetchChemicals();
    }, [isLoaded]);

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-100">
                Loading...
            </div>
        );
    }

    const filteredChemicals = availableChemicals.filter((chem) =>
        chem.chemical_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !formData.items.some(item => item.chemical_item_id === chem.id)
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const addItem = (chemical: ChemicalItem) => {
        const newItem: RequisitionItemForm = {
            chemical_item_id: chemical.id,
            chemical_name: chemical.chemical_name,
            unit: chemical.unit,
            expiry_date: chemical.expiry_date,
            requested_quantity: 0,
            remark: '',
        };
        setFormData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
        setSearchTerm('');
    };

    const updateItem = (index: number, field: keyof RequisitionItemForm, value: number | string) => {
        setFormData((prev) => {
            const newItems = [...prev.items];
            newItems[index] = { ...newItems[index], [field]: value };
            return { ...prev, items: newItems };
        });

        if (field === 'requested_quantity') {
            const item = formData.items[index];
            const chemical = availableChemicals.find(c => c.id === item.chemical_item_id);
            
            if (chemical && typeof value === 'number') {
                if (value > chemical.quantity) {
                    setValidationErrors(prev => ({
                        ...prev,
                        [index]: `Cannot exceed available quantity (${chemical.quantity} ${chemical.unit})`
                    }));
                } else if (value <= 0) {
                    setValidationErrors(prev => ({
                        ...prev,
                        [index]: 'Quantity must be greater than 0'
                    }));
                } else {
                    setValidationErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[index];
                        return newErrors;
                    });
                }
            }
        }
    };

    const removeItem = (index: number) => {
        setFormData((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[index];
            return newErrors;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.department || !formData.requester || formData.items.length === 0) {
            setError('Please fill all required fields and add at least one item.');
            return;
        }

        if (Object.keys(validationErrors).length > 0) {
            setError('Please fix validation errors before submitting.');
            return;
        }

        if (formData.items.some(item => item.requested_quantity <= 0)) {
            setError('All items must have a quantity greater than 0.');
            return;
        }

        setLoading(true);
        setError(null);

        const response = await fetch('/api/requisitions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (!response.ok) {
            setError(result.error || 'Failed to submit requisition');
            setLoading(false);
            return;
        }

        router.push('/requisitions');
        setLoading(false);
    };

    const getTotalItems = () => formData.items.length;
    const hasValidationErrors = Object.keys(validationErrors).length > 0;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            <div className="max-w-5xl mx-auto p-6">
                <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-t-lg">
                        <h1 className="text-3xl font-bold text-white">New Chemical Requisition</h1>
                        <p className="text-blue-100 mt-2">Request chemicals from inventory</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="requisition_date" className="block text-sm font-semibold text-gray-300">
                                    Requisition Date <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="date"
                                    id="requisition_date"
                                    name="requisition_date"
                                    value={formData.requisition_date}
                                    onChange={handleInputChange}
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="department" className="block text-sm font-semibold text-gray-300">
                                    Department <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="department"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="e.g., Chemistry Lab"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label htmlFor="requester" className="block text-sm font-semibold text-gray-300">
                                    Requester <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="requester"
                                    name="requester"
                                    value={formData.requester}
                                    onChange={handleInputChange}
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Your name"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="block text-lg font-semibold text-gray-300">
                                    Add Chemicals <span className="text-red-400">*</span>
                                </label>
                                <span className="text-sm text-gray-400">
                                    {getTotalItems()} item(s) added
                                </span>
                            </div>
                            
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search chemicals by name..."
                                    className="w-full p-4 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                                
                                {searchTerm && filteredChemicals.length > 0 && (
                                    <ul className="absolute z-10 w-full mt-2 bg-gray-700 border border-gray-600 rounded-lg max-h-60 overflow-y-auto shadow-2xl">
                                        {filteredChemicals.map((chem) => (
                                            <li
                                                key={chem.id}
                                                onClick={() => addItem(chem)}
                                                className="p-4 hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-b-0 transition-colors"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-gray-100 font-semibold">{chem.chemical_name}</p>
                                                        <p className="text-sm text-gray-400 mt-1">
                                                            Available: <span className="font-semibold text-green-400">{chem.quantity} {chem.unit}</span>
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500">Expires</p>
                                                        <p className="text-sm text-yellow-400">
                                                            {new Date(chem.expiry_date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                
                                {searchTerm && filteredChemicals.length === 0 && (
                                    <div className="absolute z-10 w-full mt-2 bg-gray-700 border border-gray-600 rounded-lg p-4 text-gray-400 shadow-lg">
                                        No matching chemicals found or all available chemicals already added
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                {formData.items.map((item, index) => {
                                    const chemical = availableChemicals.find(c => c.id === item.chemical_item_id);
                                    const hasError = validationErrors[index];
                                    
                                    return (
                                        <div 
                                            key={index} 
                                            className={`bg-gray-700 p-4 rounded-lg border-2 transition-all ${
                                                hasError ? 'border-red-500' : 'border-gray-600'
                                            }`}
                                        >
                                            <div className="flex gap-4 items-start">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-100 mb-1">{item.chemical_name}</p>
                                                    <div className="flex gap-4 text-sm text-gray-400">
                                                        <span>Unit: <span className="text-gray-300">{item.unit}</span></span>
                                                        <span>Available: <span className="text-green-400 font-semibold">{chemical?.quantity || 0} {item.unit}</span></span>
                                                        <span>Expires: <span className="text-yellow-400">{new Date(item.expiry_date).toLocaleDateString()}</span></span>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="text-red-400 hover:text-red-300 font-semibold text-sm px-3 py-1 hover:bg-red-900/20 rounded transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                            
                                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">
                                                        Requested Quantity <span className="text-red-400">*</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={item.requested_quantity || ''}
                                                        onChange={(e) => updateItem(index, 'requested_quantity', parseFloat(e.target.value) || 0)}
                                                        placeholder="0.000"
                                                        className={`w-full p-2 bg-gray-600 border rounded-lg text-gray-100 focus:outline-none focus:ring-2 transition-all ${
                                                            hasError 
                                                                ? 'border-red-500 focus:ring-red-500' 
                                                                : 'border-gray-500 focus:ring-blue-500'
                                                        }`}
                                                        min="0"
                                                        step="0.001"
                                                        max={chemical?.quantity || 0}
                                                        required
                                                    />
                                                    {hasError && (
                                                        <p className="text-red-400 text-xs mt-1">{hasError}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">Remark (Optional)</label>
                                                    <input
                                                        type="text"
                                                        value={item.remark || ''}
                                                        onChange={(e) => updateItem(index, 'remark', e.target.value)}
                                                        placeholder="Additional notes..."
                                                        className="w-full p-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {formData.items.length === 0 && (
                                    <div className="bg-gray-700/50 border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                                        <p className="text-gray-400 text-lg">No items added yet</p>
                                        <p className="text-gray-500 text-sm mt-2">Search and select chemicals above to add them to your requisition</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {formData.items.length > 0 && (
                            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                                <h3 className="font-semibold text-blue-300 mb-2">Requisition Summary</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-400">Total Items</p>
                                        <p className="text-2xl font-bold text-blue-400">{getTotalItems()}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Department</p>
                                        <p className="text-lg font-semibold text-gray-200">{formData.department || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Requester</p>
                                        <p className="text-lg font-semibold text-gray-200">{formData.requester || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Status</p>
                                        <p className={`text-lg font-semibold ${hasValidationErrors ? 'text-red-400' : 'text-green-400'}`}>
                                            {hasValidationErrors ? 'Has Errors' : 'Ready'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-900/20 border border-red-500 text-red-300 rounded-lg flex items-start gap-3">
                                <span className="text-xl">⚠</span>
                                <div>
                                    <p className="font-semibold">Error</p>
                                    <p className="text-sm mt-1">{error}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-6 border-t border-gray-700">
                            <button
                                type="button"
                                onClick={() => router.push('/requisitions')}
                                className="px-6 py-3 bg-gray-700 text-gray-300 font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || formData.items.length === 0 || hasValidationErrors}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="animate-spin">⏳</span> Submitting...
                                    </span>
                                ) : (
                                    'Submit Requisition'
                                )}
                            </button>
                        </div>

                        <div className="text-xs text-gray-500 space-y-1 pt-4 border-t border-gray-700">
                            <p>• Your requisition requires approval from 4 roles in sequence:</p>
                            <p className="ml-4">1. Technical Manager (C)</p>
                            <p className="ml-4">2. Technical Manager (M)</p>
                            <p className="ml-4">3. Senior Assistant Director</p>
                            <p className="ml-4">4. Quality Assurance Manager</p>
                            <p>• Inventory will be deducted only after all approvals are received</p>
                            <p>• Requested quantities cannot exceed available stock</p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}