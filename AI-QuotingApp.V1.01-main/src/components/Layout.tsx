import React from 'react';
import { Home, Settings, FileText, Calendar, Briefcase, Users, Database } from 'lucide-react';
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
            case 'draft': return <span className="bg-warning/20 text-warning text-xs px-2 py-1 rounded-full font-bold">DRAFT QUOTE</span>;
            case 'quoted': return <span className="bg-success/20 text-success text-xs px-2 py-1 rounded-full font-bold">QUOTE SAVED</span>;
            case 'invoice': return <span className="bg-purple-900/20 text-purple-300 text-xs px-2 py-1 rounded-full font-bold">DRAFT INVOICE</span>;
            case 'closed': return <span className="bg-emerald-900/20 text-emerald-300 text-xs px-2 py-1 rounded-full font-bold">INVOICE CLOSED</span>;
            default: return null;
        }
    };

    const getWorkspaceLabel = () => {
        switch (status) {
            case 'draft': return 'Quote Builder';
            case 'quoted': return 'Submitted Quote';
            case 'invoice': return 'Invoice';
            case 'closed': return 'Closed Invoice';
            default: return 'Quote Builder';
        }
    };

    return (
        <div className="flex min-h-screen bg-bg-primary text-slate-200 font-sans">
            {/* Side Panel Navigation (Fixed) */}
            <nav className="w-64 bg-bg-secondary flex flex-col p-4 shadow-2xl z-20 sticky top-0 h-screen">

                {/* App Menu Section */}
                <div className="mb-6 pb-4 border-b border-gray-700">
                    <div className="flex items-center gap-2 text-xl font-bold text-accent-primary mb-3">
                        <Briefcase size={20} /> App Menu
                    </div>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={exitQuote}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left text-slate-300 hover:bg-gray-700"
                            title="Return to Dashboard"
                        >
                            <Home size={18} /> Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('customers')}
                            className={clsx(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left",
                                activeTab === 'customers'
                                    ? 'bg-accent-primary/20 text-accent-primary font-bold'
                                    : 'text-slate-300 hover:bg-gray-700'
                            )}
                        >
                            <Users size={18} /> Customers
                        </button>
                        <button
                            onClick={() => setActiveTab('backup')}
                            className={clsx(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left",
                                activeTab === 'backup'
                                    ? 'bg-accent-primary/20 text-accent-primary font-bold'
                                    : 'text-slate-300 hover:bg-gray-700'
                            )}
                        >
                            <Database size={18} /> Backup & Restore
                        </button>
                    </div>
                </div>

                {/* Secondary Navigation (Quote Tabs) */}
                <h3 className="text-xs uppercase text-slate-400 font-semibold mb-2 tracking-wider">{getWorkspaceLabel()}</h3>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => setActiveTab('quote')}
                        className={clsx(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left",
                            activeTab === 'quote'
                                ? 'bg-accent-primary/20 text-accent-primary font-bold'
                                : 'text-slate-300 hover:bg-gray-700'
                        )}
                    >
                        <Calendar size={18} /> {status === 'invoice' || status === 'closed' ? 'Invoice Builder' : 'Quote Builder'}
                    </button>
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={clsx(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left",
                            activeTab === 'summary'
                                ? 'bg-accent-primary/20 text-accent-primary font-bold'
                                : 'text-slate-300 hover:bg-gray-700'
                        )}
                    >
                        <FileText size={18} /> {status === 'closed' ? 'Closed Summary' : 'Summary'}
                    </button>
                    <button
                        onClick={() => setActiveTab('rates')}
                        className={clsx(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left",
                            activeTab === 'rates'
                                ? 'bg-accent-primary/20 text-accent-primary font-bold'
                                : 'text-slate-300 hover:bg-gray-700'
                        )}
                    >
                        <Settings size={18} /> Rates Configuration
                    </button>
                </div>

                {/* Footer / Status */}
                <div className="mt-auto pt-4 border-t border-gray-700">
                    <div className="mb-2">{getStatusBadge()}</div>
                    <div className="text-xs opacity-80 text-slate-400">ESTIMATED TOTAL</div>
                    <div className="text-xl font-bold text-accent-primary">{formatMoney(totalCost)}</div>
                </div>

            </nav>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
                {/* Simplified Top Header (Just for context/status inside main view) */}
                <header className="bg-bg-secondary text-white p-4 shadow-md sticky top-0 z-10 border-b border-slate-700">
                    <div className="max-w-[95%] flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                            {getWorkspaceLabel()}: <span className="font-normal text-slate-400 capitalize">{activeTab}</span>
                        </div>
                    </div>
                </header>

                {/* Main Content (children) */}
                <div className="max-w-[95%] mx-auto p-4 md:p-6 space-y-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
