import React from 'react';
import { Briefcase, Calendar, Settings, FileText, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

interface LayoutProps {
    children: React.ReactNode;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    status: string;
    totalCost: number;
    exitQuote: () => void;
}

export default function Layout({ children, activeTab, setActiveTab, status, totalCost, exitQuote }: LayoutProps) {
    const formatMoney = (amount: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);

    const getStatusBadge = () => {
        switch (status) {
            case 'draft': return <span className="bg-yellow-900/20 text-yellow-300 text-xs px-2 py-1 rounded-full font-bold">DRAFT QUOTE</span>;
            case 'quoted': return <span className="bg-green-900/20 text-green-300 text-xs px-2 py-1 rounded-full font-bold">QUOTE SAVED</span>;
            case 'invoice': return <span className="bg-purple-900/20 text-purple-300 text-xs px-2 py-1 rounded-full font-bold">DRAFT INVOICE</span>;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-slate-100 font-sans">
            {/* Header */}
            <header className="bg-gray-800 text-white p-4 shadow-md sticky top-0 z-10">
                <div className="max-w-[95%] mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <Briefcase size={24} /> Accurate Industries - Service Quotation & Billing Setup
                        </h1>
                        {getStatusBadge()}
                        <button
                            onClick={exitQuote}
                            className="ml-6 px-3 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors flex items-center gap-2 text-sm"
                            title="Return to Dashboard"
                        >
                            <ArrowLeft size={16} /> Dashboard
                        </button>
                    </div>
                    <div className="text-right">
                        <div className="text-xs opacity-80">ESTIMATED TOTAL</div>
                        <div className="text-2xl font-bold">{formatMoney(totalCost)}</div>
                    </div>
                </div>
            </header>

            {/* Navigation - Folder Tab Style */}
            <nav className="bg-gray-800 border-b border-gray-700">
                <div className="max-w-[95%] mx-auto flex gap-1 p-4 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('quote')}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all font-medium",
                            activeTab === 'quote' 
                                ? 'bg-gray-900 text-white shadow-lg border border-gray-600 border-b-0' 
                                : 'bg-gray-700/50 text-slate-400 hover:bg-gray-700'
                        )}
                    >
                        <Calendar size={18} /> {status === 'invoice' ? 'Invoice Builder' : 'Quote Builder'}
                    </button>
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all font-medium",
                            activeTab === 'summary' 
                                ? 'bg-gray-900 text-white shadow-lg border border-gray-600 border-b-0' 
                                : 'bg-gray-700/50 text-slate-400 hover:bg-gray-700'
                        )}
                    >
                        <FileText size={18} /> {status === 'closed' ? 'Closed Invoice Summary' : status === 'invoice' ? 'Invoice Summary' : 'Quote Summary'}
                    </button>
                    <button
                        onClick={() => setActiveTab('rates')}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all font-medium",
                            activeTab === 'rates' 
                                ? 'bg-gray-900 text-white shadow-lg border border-gray-600 border-b-0' 
                                : 'bg-gray-700/50 text-slate-400 hover:bg-gray-700'
                        )}
                    >
                        <Settings size={18} /> Rates Configuration
                    </button>
                </div>
            </nav>

            <main className="max-w-[95%] mx-auto p-4 md:p-6 space-y-6">
                {children}
            </main>
        </div>
    );
}
