
import React, { useState } from 'react';
import { FileText, Plus, Trash2, FolderOpen, Users, Download, Upload } from 'lucide-react';
import type { Quote, Customer, Rates } from '../types';
import CustomerDashboard from './CustomerDashboard';
import TechnicianDashboard from './TechnicianDashboard';

interface DashboardProps {
    savedQuotes: Quote[];
    createNewQuote: () => void;
    loadQuote: (id: string) => void;
    deleteQuote: (id: string) => void;
    savedCustomers: Customer[];
    saveCustomer: (customer: Customer) => void;
    deleteCustomer: (id: string) => void;
    savedTechnicians: string[];
    saveTechnician: (name: string) => void;
    deleteTechnician: (name: string) => void;
    saveAsDefaults: (rates: Rates) => void;
    resetToDefaults: () => void;
    savedDefaultRates: Rates;
    exportState: () => void;
    importState: (fileContent: string) => boolean;
}

export default function Dashboard({
    savedQuotes, createNewQuote, loadQuote, deleteQuote,
    savedCustomers, saveCustomer, deleteCustomer,
    savedTechnicians, saveTechnician, deleteTechnician,
    saveAsDefaults, resetToDefaults, savedDefaultRates, exportState, importState
}: DashboardProps) {
    const [view, setView] = useState<'quotes' | 'customers' | 'technicians' | 'backup'>('quotes');
    const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'quoted' | 'invoice' | 'closed'>('all');
    const [backupSuccess, setBackupSuccess] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleBackup = () => {
        exportState();
        setBackupSuccess(true);
        setTimeout(() => setBackupSuccess(false), 2000); // Reset after 2 seconds
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                const success = importState(content);
                if (success) {
                    alert('State imported successfully!');
                } else {
                    alert('Failed to import state. Please check the file format.');
                }
            };
            reader.readAsText(file);
        }
        // Reset the file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this quote?")) {
            deleteQuote(id);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 p-6">
            <div className="max-w-[95%] mx-auto">
                {/* Header & Tabs */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-100">Service Quoter</h1>
                        <p className="text-slate-400 mt-1">Manage quotes, customers, and technicians</p>
                    </div>

                    <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700 shadow-sm">
                        <button
                            onClick={() => setView('quotes')}
                            className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors ${view === 'quotes' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-gray-700'}`}
                        >
                            <FileText size={18} /> Quotes
                        </button>
                        <button
                            onClick={() => setView('customers')}
                            className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors ${view === 'customers' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-gray-700'}`}
                        >
                            <Users size={18} /> Customers
                        </button>
                        <button
                            onClick={() => setView('backup')}
                            className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors ${view === 'backup' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-gray-700'}`}
                        >
                            <Download size={18} /> Backup & Restore
                        </button>
                    </div>
                </div>

                {view === 'quotes' && (
                    <div className="flex gap-2 mb-6">
                        {(['all', 'draft', 'quoted', 'invoice', 'closed'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${filterStatus === status
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-800 text-slate-400 border border-gray-700 hover:bg-gray-700'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                )}

                {view === 'quotes' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* New Quote Card */}
                        <button
                            onClick={createNewQuote}
                            className="flex flex-col items-center justify-center h-48 bg-gray-800 border-2 border-dashed border-primary-600 rounded-lg hover:border-primary-400 hover:bg-gray-700 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 mb-3 group-hover:scale-110 transition-transform">
                                <Plus size={24} />
                            </div>
                            <span className="font-semibold text-slate-300">Create New Quote</span>
                        </button>

                        {/* Filtered Quotes */}
                        {savedQuotes
                            .filter(q => filterStatus === 'all' || q.status === filterStatus)
                            .sort((a, b) => b.lastModified - a.lastModified)
                            .map((quote) => (
                                <div
                                    key={quote.id}
                                    onClick={() => loadQuote(quote.id)}
                                    className={`p-6 rounded-lg shadow-sm border border-gray-700 hover:shadow-md transition-shadow cursor-pointer relative group ${quote.status === 'draft' ? 'bg-gray-800 text-slate-400' :
                                        quote.status === 'quoted' ? 'bg-yellow-900/20 text-yellow-300' :
                                            quote.status === 'invoice' ? 'bg-purple-900/20 text-purple-300' :
                                                'bg-emerald-900/20 text-emerald-300 border-emerald-700'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wide ${quote.status === 'draft' ? 'bg-gray-700 text-slate-300' :
                                            quote.status === 'quoted' ? 'bg-yellow-800/50 text-yellow-200' :
                                                quote.status === 'invoice' ? 'bg-purple-800/50 text-purple-200' :
                                                    'bg-emerald-800/50 text-emerald-200'
                                            }`}>
                                            {quote.status}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-mono text-slate-500">#{quote.quoteNumber}</span>
                                            <button
                                                onClick={(e) => handleDelete(e, quote.id)}
                                                className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-black text-slate-100 mb-2 tracking-tight">
                                        {quote.jobDetails.jobNo ? `JOB${quote.jobDetails.jobNo}` : 'JOB-----'}
                                    </h3>
                                    <p className="text-slate-400 text-sm mb-4">
                                        {quote.jobDetails.customer || 'No Customer'}
                                    </p>

                                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-auto">
                                        <FolderOpen size={14} />
                                        <span>Last edited {new Date(quote.lastModified).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                    </div>
                ) : view === 'customers' ? (
                    <CustomerDashboard
                        savedCustomers={savedCustomers}
                        saveCustomer={saveCustomer}
                        deleteCustomer={deleteCustomer}
                        saveAsDefaults={saveAsDefaults}
                        resetToDefaults={resetToDefaults}
                        savedDefaultRates={savedDefaultRates}
                    />
                ) : view === 'backup' ? (
                    <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-slate-200 mb-2">Backup & Restore</h2>
                            <p className="text-sm text-slate-400">Save and restore your complete application data including quotes, customers, and default rates.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                                <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                                    <Download size={18} /> Export Data
                                </h3>
                                <p className="text-sm text-slate-400 mb-4">
                                    Download a complete backup of all your quotes, customers, and settings.
                                </p>
                                <button
                                    onClick={handleBackup}
                                    className={`w-full px-4 py-2 rounded transition-colors flex items-center justify-center gap-2 font-medium ${
                                        backupSuccess 
                                            ? 'bg-green-600 text-white' 
                                            : 'bg-primary-600 text-white hover:bg-primary-700'
                                    }`}
                                >
                                    {backupSuccess ? (
                                        <>
                                            <Download size={16} /> Backup Saved Successfully!
                                        </>
                                    ) : (
                                        <>
                                            <Download size={16} /> Backup/Save State
                                        </>
                                    )}
                                </button>
                            </div>
                            
                            <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                                <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                                    <Upload size={18} /> Import Data
                                </h3>
                                <p className="text-sm text-slate-400 mb-4">
                                    Restore your data from a previously saved backup file.
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileImport}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500 transition-colors flex items-center justify-center gap-2 font-medium"
                                >
                                    <Upload size={16} /> Restore/Load State
                                </button>
                            </div>
                        </div>
                        
                        <div className="mt-6 p-4 bg-amber-900/20 border border-amber-700 rounded-lg">
                            <p className="text-sm text-amber-300">
                                <strong>Warning:</strong> Importing data will overwrite all existing quotes, customers, and settings. Consider creating a backup before importing.
                            </p>
                        </div>
                    </div>
                ) : (
                    <TechnicianDashboard
                        savedTechnicians={savedTechnicians}
                        saveTechnician={saveTechnician}
                        deleteTechnician={deleteTechnician}
                    />
                )}
            </div>
        </div>
    );
}
