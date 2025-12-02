
import { useState } from 'react';
import { Plus, Trash2, Save, User } from 'lucide-react';
import RatesConfig from './RatesConfig';
import type { Customer, Rates } from '../types';

interface CustomerDashboardProps {
    savedCustomers: Customer[];
    saveCustomer: (customer: Customer) => void;
    deleteCustomer: (id: string) => void;
    saveAsDefaults: (rates: Rates) => void;
    resetToDefaults: () => void; // Kept in interface but not used directly
    savedDefaultRates: Rates;
}

const DEFAULT_RATES: Rates = {
    siteNormal: 160,
    siteOvertime: 190,
    weekend: 210,
    publicHoliday: 235,
    officeReporting: 160,
    travel: 120,
    travelOvertime: 120,
    travelCharge: 1.30,
    travelChargeExBrisbane: 0,
    vehicle: 120,
    perDiem: 90,
    standardDayRate: 2040,
    weekendDayRate: 2520
};

export default function CustomerDashboard({
    savedCustomers, saveCustomer, deleteCustomer,
    saveAsDefaults, resetToDefaults, savedDefaultRates
}: CustomerDashboardProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editRates, setEditRates] = useState<Rates>(DEFAULT_RATES);
    const [showDefaultRates, setShowDefaultRates] = useState(false);

    const handleSelect = (customer: Customer) => {
        setSelectedId(customer.id);
        setEditName(customer.name);
        setEditRates(customer.rates);
    };

    const handleCreate = () => {
        const newId = crypto.randomUUID();
        const newCustomer: Customer = {
            id: newId,
            name: 'New Customer',
            rates: DEFAULT_RATES
        };
        saveCustomer(newCustomer);
        handleSelect(newCustomer);
    };

    const handleSave = () => {
        if (!selectedId) return;
        saveCustomer({
            id: selectedId,
            name: editName,
            rates: editRates
        });
        alert('Customer saved!');
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this customer?')) {
            deleteCustomer(id);
            if (selectedId === id) {
                setSelectedId(null);
            }
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
            {/* Sidebar List */}
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-600 flex justify-between items-center">
                    <h2 className="font-semibold text-slate-200">Customers</h2>
                    <button
                        onClick={handleCreate}
                        className="bg-primary-600 text-white p-2 rounded hover:bg-primary-700"
                        title="Add Customer"
                    >
                        <Plus size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {savedCustomers.length === 0 && (
                        <p className="text-center text-slate-400 py-4 text-sm">No customers yet.</p>
                    )}
                    {savedCustomers.map(c => (
                        <div
                            key={c.id}
                            onClick={() => handleSelect(c)}
                            className={`p-3 rounded cursor-pointer flex justify-between items-center group ${selectedId === c.id ? 'bg-primary-900/20 border-primary-700 border' : 'hover:bg-gray-700 border border-transparent'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedId === c.id ? 'bg-primary-700 text-primary-200' : 'bg-gray-600 text-slate-300'}`}>
                                    <User size={16} />
                                </div>
                                <span className="font-medium text-slate-200">{c.name}</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                                className="text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Editor */}
            <div className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto">
                {/* Toggle Default Rates */}
                <div className="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700">
                    <button
                        onClick={() => setShowDefaultRates(!showDefaultRates)}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                        {showDefaultRates ? 'Hide' : 'Show'} Default Rates
                    </button>
                </div>

                {/* Dedicated Default Rates Management */}
                {showDefaultRates && (
                    <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold text-slate-200 mb-2">Default Rates Management</h2>
                            <p className="text-sm text-slate-400">Configure system-wide default rates for new customers</p>
                        </div>
                        <RatesConfig
                            rates={savedDefaultRates}
                            setRates={saveAsDefaults}
                            saveAsDefaults={saveAsDefaults}
                            resetToDefaults={resetToDefaults}
                        />
                    </div>
                )}

                {/* Customer-Specific Editor (Conditional) */}
                {selectedId ? (
                    <>
                        <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                            <div className="flex justify-between items-end">
                                <div className="w-full max-w-md">
                                    <label className="block text-sm text-slate-300 mb-1">Customer Name</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full text-xl font-semibold border border-gray-600 rounded bg-gray-700 text-slate-100 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none py-2 px-3"
                                        placeholder="Enter customer name"
                                    />
                                </div>
                                <button
                                    onClick={handleSave}
                                    className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700 flex items-center gap-2 font-medium"
                                >
                                    <Save size={18} /> Save Changes
                                </button>
                            </div>
                        </div>

                        <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-slate-200">Customer-Specific Rates</h3>
                                <p className="text-sm text-slate-400">Override default rates for this specific customer</p>
                            </div>
                            <RatesConfig
                                rates={editRates}
                                setRates={setEditRates}
                                saveAsDefaults={saveAsDefaults}
                                resetToDefaults={() => setEditRates(savedDefaultRates)}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400 bg-gray-700 rounded-lg border-2 border-dashed border-gray-600">
                        <p>Select a customer to edit their specific rates</p>
                    </div>
                )}
            </div>
        </div>
    );
}
