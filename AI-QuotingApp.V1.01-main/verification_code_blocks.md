export type Status = 'draft' | 'quoted' | 'invoice' | 'closed';

export interface Rates {
    siteNormal: number;
    siteOvertime: number;
    weekend: number;
    publicHoliday: number;
    officeReporting: number;
    travel: number;
    travelOvertime: number;
    travelCharge: number; // per km
    travelChargeExBrisbane: number; // per km
    vehicle: number; // per day
    perDiem: number; // per night
    standardDayRate: number; // 12hrs
    weekendDayRate: number; // 12hrs
}

export interface Customer {
    id: string;
    name: string;
    rates: Rates;
}

export interface JobDetails {
    customer: string;
    jobNo: string;
    location: string;
    techName: string; // Legacy field
    technicians: string[];
    description: string;
    reportingTime: number; // hours
    includeTravelCharge: boolean;
    travelDistance: number; // km
    quotedAmount?: number;
    varianceReason?: string;
    externalLink?: string;
}

export interface Shift {
    id: number;
    date: string;
    dayType: 'weekday' | 'weekend' | 'publicHoliday';
    startTime: string;
    finishTime: string;
    travelIn: number;
    travelOut: number;
    vehicle: boolean;
    perDiem: boolean;
    tech: string;
}

export interface ExtraItem {
    id: number;
    description: string;
    cost: number;
}

export interface ShiftBreakdown {
    travelInNT: number;
    travelInOT: number;
    siteNT: number;
    siteOT: number;
    travelOutNT: number;
    travelOutOT: number;
    totalHours: number;
    siteHours: number;
}

export interface CalculatedShift {
    cost: number;
    breakdown: ShiftBreakdown;
}

export interface Quote {
    id: string;
    quoteNumber: string;
    lastModified: number;
    status: Status;
    rates: Rates;
    jobDetails: JobDetails;
    shifts: Shift[];
    extras: ExtraItem[];
}

import { useState, useEffect } from 'react';
import type { Rates, JobDetails, Shift, ExtraItem, Quote, Customer, Status } from '../types';
import { calculateShiftBreakdown as calculateLogic } from '../logic';


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

const DEFAULT_JOB_DETAILS: JobDetails = {
    customer: '',
    jobNo: '',
    location: '',
    techName: '',
    technicians: ['Tech 1'],
    description: '',
    reportingTime: 0,
    includeTravelCharge: false,
    travelDistance: 0,
    quotedAmount: 0,
    varianceReason: '',
    externalLink: ''
};

const DEFAULT_SHIFTS: Shift[] = [
    {
        id: 1,
        date: new Date().toISOString().split('T')[0],
        dayType: 'weekday',
        startTime: '06:00',
        finishTime: '18:00',
        travelIn: 0.5,
        travelOut: 0.5,
        vehicle: true,
        perDiem: false,
        tech: 'Tech 1'
    }
];

const QUOTES_STORAGE_KEY = 'service-quoter-quotes';
const CUSTOMERS_STORAGE_KEY = 'service-quoter-customers';
const TECHNICIANS_STORAGE_KEY = 'service-quoter-technicians';
const DEFAULT_RATES_STORAGE_KEY = 'service-quoter-default-rates';

export function useQuote() {
    // Global State
    const [savedQuotes, setSavedQuotes] = useState<Quote[]>([]);
    const [savedCustomers, setSavedCustomers] = useState<Customer[]>([]);
    const [savedTechnicians, setSavedTechnicians] = useState<string[]>([]);
    const [savedDefaultRates, setSavedDefaultRates] = useState<Rates>(DEFAULT_RATES);
    const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Active Quote State
    const [status, setStatus] = useState<Status>('draft');
    const [rates, setRates] = useState<Rates>(DEFAULT_RATES);
    const [jobDetails, setJobDetails] = useState<JobDetails>(DEFAULT_JOB_DETAILS);
    const [shifts, setShifts] = useState<Shift[]>(DEFAULT_SHIFTS);
    const [extras, setExtras] = useState<ExtraItem[]>([{ id: 1, description: 'Accommodation', cost: 0 }]);

    // Load from local storage on mount
    useEffect(() => {
        const savedQ = localStorage.getItem(QUOTES_STORAGE_KEY);
        const savedC = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
        const savedT = localStorage.getItem(TECHNICIANS_STORAGE_KEY);
        const savedDR = localStorage.getItem(DEFAULT_RATES_STORAGE_KEY);

        if (savedQ) {
            try {
                setSavedQuotes(JSON.parse(savedQ));
            } catch (e) {
                console.error("Failed to load quotes", e);
            }
        }

        if (savedC) {
            try {
                setSavedCustomers(JSON.parse(savedC));
            } catch (e) {
                console.error("Failed to load customers", e);
            }
        }

        if (savedT) {
            try {
                setSavedTechnicians(JSON.parse(savedT));
            } catch (e) {
                console.error("Failed to load technicians", e);
            }
        }

        if (savedDR) {
            try {
                const loadedRates = JSON.parse(savedDR);
                setSavedDefaultRates(loadedRates);
                // Only set active rates to defaults if we are initializing a fresh state (not implemented here, but good practice)
                // For now, initial state uses DEFAULT_RATES constant, but we could update it here if needed.
                // However, since we might be loading a quote, we shouldn't overwrite 'rates' here.
                // But if we are starting fresh, we might want to use these.
                // Since 'rates' is initialized with DEFAULT_RATES constant, let's update it if no quote is active?
                // Actually, let's just keep 'rates' as is. The user can "Reset to Defaults".
            } catch (e) {
                console.error("Failed to load default rates", e);
            }
        }

        setIsLoaded(true);
    }, []);

    // Save lists to local storage
    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(savedQuotes));
    }, [savedQuotes, isLoaded]);

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(savedCustomers));
    }, [savedCustomers, isLoaded]);

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem(TECHNICIANS_STORAGE_KEY, JSON.stringify(savedTechnicians));
    }, [savedTechnicians, isLoaded]);

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem(DEFAULT_RATES_STORAGE_KEY, JSON.stringify(savedDefaultRates));
    }, [savedDefaultRates, isLoaded]);

    // Auto-save active quote to list
    useEffect(() => {
        if (!activeQuoteId || !isLoaded) return;

        setSavedQuotes(prev => prev.map(q =>
            q.id === activeQuoteId
                ? { ...q, status, rates, jobDetails, shifts, extras, lastModified: Date.now() }
                : q
        ));
    }, [status, rates, jobDetails, shifts, extras, activeQuoteId, isLoaded]);

    const createNewQuote = () => {
        const newId = crypto.randomUUID();

        // Auto-increment Quote Number
        const maxQuoteNum = savedQuotes.reduce((max, q) => {
            const num = parseInt(q.quoteNumber || '0', 10);
            return num > max ? num : max;
        }, 0);
        const nextQuoteNum = (maxQuoteNum + 1).toString().padStart(4, '0');

        const newQuote: Quote = {
            id: newId,
            quoteNumber: nextQuoteNum,
            lastModified: Date.now(),
            status: 'draft',
            rates: savedDefaultRates, // Use saved defaults for new quotes
            jobDetails: DEFAULT_JOB_DETAILS,
            shifts: DEFAULT_SHIFTS,
            extras: [{ id: 1, description: 'Accommodation', cost: 0 }]
        };
        setSavedQuotes([...savedQuotes, newQuote]);
        loadQuote(newId, newQuote);
    };

    const loadQuote = (id: string, quoteData?: Quote) => {
        const quote = quoteData || savedQuotes.find(q => q.id === id);
        if (!quote) return;

        setActiveQuoteId(id);
        setStatus(quote.status);
        setRates(quote.rates);
        setJobDetails(quote.jobDetails);
        setShifts(quote.shifts);
        setExtras(quote.extras);
    };

    const deleteQuote = (id: string) => {
        setSavedQuotes(savedQuotes.filter(q => q.id !== id));
        if (activeQuoteId === id) {
            setActiveQuoteId(null);
        }
    };

    const exitQuote = () => {
        setActiveQuoteId(null);
    };

    // Customer Management
    const saveCustomer = (customer: Customer) => {
        setSavedCustomers(prev => {
            const exists = prev.find(c => c.id === customer.id);
            if (exists) {
                return prev.map(c => c.id === customer.id ? customer : c);
            }
            return [...prev, customer];
        });
    };

    const deleteCustomer = (id: string) => {
        setSavedCustomers(prev => prev.filter(c => c.id !== id));
    };

    // Technician Management
    const saveTechnician = (name: string) => {
        if (!savedTechnicians.includes(name)) {
            setSavedTechnicians([...savedTechnicians, name]);
        }
    };

    const deleteTechnician = (name: string) => {
        setSavedTechnicians(savedTechnicians.filter(t => t !== name));
    };

    // Default Rates Management
    const saveAsDefaults = (newRates: Rates) => {
        setSavedDefaultRates(newRates);
    };

    const resetToDefaults = () => {
        setRates(savedDefaultRates);
    };

    const isLocked = status === 'quoted' || status === 'closed';

    // Helpers
    // Bridge to our verified logic
    const calculateShiftBreakdown = (shift: Shift) => {
        // We pass the current 'rates' state to the pure logic function
        return calculateLogic(shift, rates);
    };

    const reportingCost = (jobDetails.reportingTime || 0) * rates.officeReporting;

    const travelChargeCost = jobDetails.includeTravelCharge
        ? (rates.travelChargeExBrisbane || 0) * jobDetails.technicians.length
        : 0;

    const totalCost = shifts.reduce((acc, shift) => acc + (calculateShiftBreakdown(shift).cost || 0), 0) +
        extras.reduce((acc, item) => acc + (item.cost || 0), 0) +
        (reportingCost || 0) +
        (travelChargeCost || 0);

    const totalHours = shifts.reduce((acc, shift) => acc + calculateShiftBreakdown(shift).breakdown.totalHours, 0);

    // Actions
    const addShift = () => {
        if (isLocked) return;
        const newId = shifts.length > 0 ? Math.max(...shifts.map(s => s.id)) + 1 : 1;
        const lastShift = shifts.length > 0 ? shifts[shifts.length - 1] : null;

        const lastDate = lastShift ? new Date(lastShift.date) : new Date();
        if (lastShift) lastDate.setDate(lastDate.getDate() + 1);

        const prevStart = lastShift ? lastShift.startTime : '06:00';
        const prevFinish = lastShift ? lastShift.finishTime : '18:00';
        const prevTech = lastShift ? lastShift.tech : (jobDetails.technicians[0] || 'Tech 1');

        const dayOfWeek = lastDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        setShifts([...shifts, {
            id: newId,
            date: lastDate.toISOString().split('T')[0],
            dayType: isWeekend ? 'weekend' : 'weekday',
            startTime: prevStart,
            finishTime: prevFinish,
            travelIn: 0.5,
            travelOut: 0.5,
            vehicle: true,
            perDiem: false,
            tech: prevTech
        }]);
    };

    const updateShift = (id: number, field: keyof Shift, value: any) => {
        if (isLocked) return;
        setShifts(shifts.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const removeShift = (id: number) => {
        if (isLocked) return;
        setShifts(shifts.filter(s => s.id !== id));
    };

    const addExtra = () => {
        if (isLocked) return;
        setExtras([...extras, { id: Date.now(), description: '', cost: 0 }]);
    };

    const updateExtra = (id: number, field: keyof ExtraItem, value: any) => {
        if (isLocked) return;
        setExtras(extras.map(e => e.id === id ? { ...e, [field]: value } : e));
    };

    const removeExtra = (id: number) => {
        if (isLocked) return;
        setExtras(extras.filter(e => e.id !== id));
    };

    return {
        // Global
        savedQuotes,
        savedCustomers,
        savedTechnicians,
        savedDefaultRates,
        activeQuoteId,
        createNewQuote,
        loadQuote,
        deleteQuote,
        exitQuote,
        saveCustomer,
        deleteCustomer,
        saveTechnician,
        deleteTechnician,
        saveAsDefaults,
        resetToDefaults,

        // Active Quote
        status,
        setStatus,
        rates,
        setRates,
        jobDetails,
        setJobDetails,
        shifts,
        addShift,
        updateShift,
        removeShift,
        extras,
        addExtra,
        updateExtra,
        removeExtra,

        // Calculations
        calculateShiftBreakdown,
        totalCost,
        reportingCost,
        travelChargeCost,
        totalHours,
        isLocked
    };
}

import { useState } from 'react';
import { FileText, Plus, Trash2, FolderOpen, Users, Wrench } from 'lucide-react';
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
}

export default function Dashboard({
    savedQuotes, createNewQuote, loadQuote, deleteQuote,
    savedCustomers, saveCustomer, deleteCustomer,
    savedTechnicians, saveTechnician, deleteTechnician,
    saveAsDefaults, resetToDefaults, savedDefaultRates
}: DashboardProps) {
    const [view, setView] = useState<'quotes' | 'customers' | 'technicians'>('quotes');
    const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'quoted' | 'invoice' | 'closed'>('all');

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this quote?")) {
            deleteQuote(id);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-[95%] mx-auto">
                {/* Header & Tabs */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Service Quoter</h1>
                        <p className="text-slate-500 mt-1">Manage quotes, customers, and technicians</p>
                    </div>

                    <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        <button
                            onClick={() => setView('quotes')}
                            className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors ${view === 'quotes' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <FileText size={18} /> Quotes
                        </button>
                        <button
                            onClick={() => setView('customers')}
                            className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors ${view === 'customers' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Users size={18} /> Customers
                        </button>
                        <button
                            onClick={() => setView('technicians')}
                            className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors ${view === 'technicians' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Wrench size={18} /> Technicians
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
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
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
                            className="flex flex-col items-center justify-center h-48 bg-white border-2 border-dashed border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 transition-transform">
                                <Plus size={24} />
                            </div>
                            <span className="font-semibold text-slate-700">Create New Quote</span>
                        </button>

                        {/* Filtered Quotes */}
                        {savedQuotes
                            .filter(q => filterStatus === 'all' || q.status === filterStatus)
                            .sort((a, b) => b.lastModified - a.lastModified)
                            .map((quote) => (
                                <div
                                    key={quote.id}
                                    onClick={() => loadQuote(quote.id)}
                                    className={`p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer relative group ${quote.status === 'draft' ? 'bg-slate-100' :
                                        quote.status === 'quoted' ? 'bg-yellow-50' :
                                            quote.status === 'invoice' ? 'bg-purple-100' :
                                                'bg-emerald-50 border-emerald-200'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wide ${quote.status === 'draft' ? 'bg-slate-100 text-slate-600' :
                                            quote.status === 'quoted' ? 'bg-amber-100 text-amber-700' :
                                                quote.status === 'invoice' ? 'bg-purple-200 text-purple-800' :
                                                    'bg-emerald-100 text-emerald-700'
                                            }`}>
                                            {quote.status}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-mono text-slate-500">#{quote.quoteNumber}</span>
                                            <button
                                                onClick={(e) => handleDelete(e, quote.id)}
                                                className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
                                        {quote.jobDetails.jobNo || 'Untitled Job'}
                                    </h3>
                                    <p className="text-slate-500 text-sm mb-4">
                                        {quote.jobDetails.customer || 'No Customer'}
                                    </p>

                                    <div className="flex items-center gap-2 text-sm text-slate-400 mt-auto">
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

import { Save, Lock, FileCheck, Unlock, ArrowLeft } from 'lucide-react';
import JobDetails from './JobDetails';
import Timesheet from './Timesheet';
import Extras from './Extras';
import type { useQuote } from '../../hooks/useQuote';

interface QuoteBuilderProps {
    quote: ReturnType<typeof useQuote>;
}

export default function QuoteBuilder({ quote }: QuoteBuilderProps) {
    const {
        status, setStatus,
        jobDetails, setJobDetails,
        shifts, addShift, updateShift, removeShift, calculateShiftBreakdown,
        extras, addExtra, updateExtra, removeExtra,
        isLocked, exitQuote, savedQuotes, loadQuote, activeQuoteId,
        savedCustomers, setRates
    } = quote;

    const saveQuoteToSystem = () => {
        if (!jobDetails.customer) {
            alert("Please enter Customer Name before saving.");
            return;
        }
        setStatus('quoted');
        alert("Quote saved to system! It is now locked. Convert to Invoice to edit actuals.");
    };

    const convertToDraftInvoice = () => {
        setStatus('invoice');
    };

    const unlockQuote = () => {
        if (confirm("Are you sure you want to unlock this quote? It will revert to draft status.")) {
            setStatus('draft');
        }
    };

    const formatMoney = (amount: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);

    return (
        <div className="space-y-6">
            {/* Workflow Controls */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={exitQuote}
                        className="bg-slate-800 text-white px-4 py-2 rounded shadow hover:bg-slate-700 flex items-center gap-2 transition-colors"
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>

                    {savedQuotes.length > 1 && (
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">Switch Quote:</label>
                            <select
                                value={activeQuoteId || ''}
                                onChange={(e) => loadQuote(e.target.value)}
                                className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            >
                                {savedQuotes.map((q) => (
                                    <option key={q.id} value={q.id}>
                                        {q.jobDetails.customer || 'Untitled'} - {q.jobDetails.jobNo || 'No Job #'} ({q.status})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    {status === 'draft' && (
                        <button
                            onClick={saveQuoteToSystem}
                            className="bg-green-600 text-white px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-green-700 font-medium"
                        >
                            <Save size={18} /> Add Quote to System
                        </button>
                    )}
                    {status === 'quoted' && (
                        <div className="flex items-center gap-3">
                            <span className="text-slate-500 text-sm flex items-center gap-1"><Lock size={14} /> Quote is Locked</span>
                            <button
                                onClick={unlockQuote}
                                className="bg-amber-600 text-white px-3 py-1.5 rounded text-sm flex items-center gap-2 hover:bg-amber-700 font-medium"
                            >
                                <Unlock size={16} /> Unlock to Edit
                            </button>
                            <button
                                onClick={convertToDraftInvoice}
                                className="bg-purple-600 text-white px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-purple-700 font-medium"
                            >
                                <FileCheck size={18} /> Convert to Draft Invoice
                            </button>
                        </div>
                    )}
                    {status === 'invoice' && (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded border border-purple-200 text-purple-800">
                                <Unlock size={14} />
                                <span className="text-sm font-medium">Invoice Mode</span>
                            </div>
                            <button
                                onClick={() => setStatus('closed')}
                                className="bg-emerald-600 text-white px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-emerald-700 font-medium"
                            >
                                <FileCheck size={18} /> Finalize & Close
                            </button>
                        </div>
                    )}
                    {status === 'closed' && (
                        <div className="flex items-center gap-3">
                            <span className="text-slate-500 text-sm flex items-center gap-1"><Lock size={14} /> Invoice Closed</span>
                            <button
                                onClick={() => setStatus('invoice')}
                                className="bg-amber-600 text-white px-3 py-1.5 rounded text-sm flex items-center gap-2 hover:bg-amber-700 font-medium"
                            >
                                <Unlock size={16} /> Unlock to Edit
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <JobDetails
                jobDetails={jobDetails}
                setJobDetails={setJobDetails}
                isLocked={isLocked}
                savedCustomers={savedCustomers}
                setRates={setRates}

            />

            <Timesheet
                shifts={shifts}
                isLocked={isLocked}
                addShift={addShift}
                updateShift={updateShift}
                removeShift={removeShift}
                calculateShiftBreakdown={calculateShiftBreakdown}
                formatMoney={formatMoney}
            />

            <Extras
                extras={extras}
                isLocked={isLocked}
                addExtra={addExtra}
                updateExtra={updateExtra}
                removeExtra={removeExtra}
            />
        </div>
    );
}

import { MapPin, Users, Briefcase, Plus, X } from 'lucide-react';
import type { JobDetails as JobDetailsType, Customer, Rates } from '../../types';

interface JobDetailsProps {
    jobDetails: JobDetailsType;
    setJobDetails: (details: JobDetailsType) => void;
    isLocked: boolean;
    savedCustomers: Customer[];
    setRates: (rates: Rates) => void;

}

export default function JobDetails({
    jobDetails, setJobDetails, isLocked, savedCustomers, setRates
}: JobDetailsProps) {

    const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setJobDetails({ ...jobDetails, customer: value });

        // Check if it matches a saved customer
        const customer = savedCustomers.find(c => c.name === value);
        if (customer) {
            setRates(customer.rates);
        }
    };

    const addTechnician = () => {
        if (isLocked) return;
        // Always use Tech N pattern for new technicians
        const newTechName = `Tech ${jobDetails.technicians.length + 1}`;
        setJobDetails({ ...jobDetails, technicians: [...jobDetails.technicians, newTechName] });
    };

    const removeTechnician = (index: number) => {
        if (isLocked || jobDetails.technicians.length <= 1) return;
        const newTechs = jobDetails.technicians.filter((_, i) => i !== index);
        setJobDetails({ ...jobDetails, technicians: newTechs });
    };

    const updateTechnician = (index: number, value: string) => {
        if (isLocked) return;
        const newTechs = [...jobDetails.technicians];
        newTechs[index] = value;
        setJobDetails({ ...jobDetails, technicians: newTechs });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-700">Job Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Customer with Datalist */}
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-2">
                        <Briefcase size={16} /> Customer
                    </label>
                    <input
                        type="text"
                        list="customer-list"
                        disabled={isLocked}
                        value={jobDetails.customer}
                        onChange={handleCustomerChange}
                        className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none ${isLocked ? 'bg-slate-100 text-slate-500' : ''}`}
                        placeholder="Select or type customer..."
                    />
                    <datalist id="customer-list">
                        {savedCustomers.map(c => (
                            <option key={c.id} value={c.name} />
                        ))}
                    </datalist>
                </div>



                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-2">
                        <MapPin size={16} /> Location
                    </label>
                    <input
                        type="text"
                        disabled={isLocked}
                        value={jobDetails.location}
                        onChange={(e) => setJobDetails({ ...jobDetails, location: e.target.value })}
                        className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none ${isLocked ? 'bg-slate-100 text-slate-500' : ''}`}
                        placeholder="Site Location"
                    />
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                    <Users size={16} /> Technicians
                </label>
                <div className="flex flex-wrap gap-3">
                    {jobDetails.technicians.map((tech, index) => (
                        <div key={index} className="flex items-center gap-1">
                            <input
                                type="text"
                                disabled={isLocked}
                                value={tech}
                                onChange={(e) => updateTechnician(index, e.target.value)}
                                className={`p-2 border rounded w-48 focus:ring-2 focus:ring-blue-500 outline-none ${isLocked ? 'bg-slate-100 text-slate-500' : ''}`}
                                placeholder={`Tech ${index + 1}`}
                            />
                            {!isLocked && jobDetails.technicians.length > 1 && (
                                <button
                                    onClick={() => removeTechnician(index)}
                                    className="text-slate-400 hover:text-red-500"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                    {!isLocked && (
                        <button
                            onClick={addTechnician}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50"
                        >
                            <Plus size={16} /> Add Tech
                        </button>
                    )}
                </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Reporting Time (Hours)</label>
                    <input
                        type="number"
                        step="0.5"
                        disabled={isLocked}
                        value={jobDetails.reportingTime || 0}
                        onChange={(e) => setJobDetails({ ...jobDetails, reportingTime: parseFloat(e.target.value) || 0 })}
                        className={`p-2 border rounded w-full ${isLocked ? 'bg-slate-100 text-slate-500' : ''}`}
                    />
                </div>

                <div className="flex items-end gap-4">
                    <div className="flex items-center h-10 gap-2">
                        <input
                            type="checkbox"
                            id="includeTravelCharge"
                            disabled={isLocked}
                            checked={jobDetails.includeTravelCharge}
                            onChange={(e) => setJobDetails({ ...jobDetails, includeTravelCharge: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="includeTravelCharge" className="text-sm font-medium text-slate-700 select-none cursor-pointer">
                            Include Travel Charge?
                        </label>
                    </div>


                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Description / Scope of Works</label>
                <textarea
                    disabled={isLocked}
                    value={jobDetails.description}
                    onChange={(e) => setJobDetails({ ...jobDetails, description: e.target.value })}
                    className={`w-full p-3 border rounded h-24 focus:ring-2 focus:ring-blue-500 outline-none ${isLocked ? 'bg-slate-100 text-slate-500' : ''}`}
                    placeholder="Enter job description..."
                />
            </div>
        </div>
    );
}

import { Copy, FileDown, ExternalLink } from 'lucide-react';
import jsPDF from 'jspdf';
import { useQuote } from '../hooks/useQuote';

interface SummaryProps {
    quote: ReturnType<typeof useQuote>;
}

export default function Summary({ quote }: SummaryProps) {
    const {
        shifts, extras, rates, calculateShiftBreakdown, totalCost, jobDetails, status,
        reportingCost, travelChargeCost
    } = quote;

    const formatMoney = (amount: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);

    const generateInvoiceString = () => {
        // Calculate Totals
        const siteNTCost = shifts.reduce((acc, s) => acc + (calculateShiftBreakdown(s).breakdown.siteNT * rates.siteNormal), 0);
        const siteOTCost = shifts.reduce((acc, s) => {
            const { breakdown } = calculateShiftBreakdown(s);
            const rate = s.dayType === 'publicHoliday' ? rates.publicHoliday : (s.dayType === 'weekend' ? rates.weekend : rates.siteOvertime);
            return acc + (breakdown.siteOT * rate);
        }, 0);
        const travelNTCost = shifts.reduce((acc, s) => {
            const { breakdown } = calculateShiftBreakdown(s);
            return acc + (breakdown.travelInNT * rates.travel) + (breakdown.travelOutNT * rates.travel);
        }, 0);
        const travelOTCost = shifts.reduce((acc, s) => {
            const { breakdown } = calculateShiftBreakdown(s);
            return acc + (breakdown.travelInOT * rates.travelOvertime) + (breakdown.travelOutOT * rates.travelOvertime);
        }, 0);
        const vehicleCost = shifts.filter(s => s.vehicle).length * rates.vehicle;
        const perDiemCost = shifts.filter(s => s.perDiem).length * rates.perDiem;
        const extrasCost = extras.reduce((acc, item) => acc + (item.cost || 0), 0);

        // Admin Header
        const variance = totalCost - (jobDetails.quotedAmount || 0);
        const hasVariance = (jobDetails.quotedAmount || 0) > 0 && Math.abs(variance) > 0.01;

        let body = `Hi Admin,\n\nSee draft invoice details for ${jobDetails.jobNo} - ${jobDetails.customer}.\n\nTotal to Invoice: ${formatMoney(totalCost)}\n`;

        if (hasVariance) {
            body += `\nNote: The final value is ${formatMoney(Math.abs(variance))} ${variance > 0 ? 'higher' : 'lower'} than the original quote of ${formatMoney(jobDetails.quotedAmount || 0)}.`;
            if (jobDetails.varianceReason) {
                body += `\nReason: ${jobDetails.varianceReason}`;
            }
            body += '\n';
        }

        // Financial Breakdown
        body += `\n---\nFinancial Breakdown:\n`;
        body += `Site Labor (Normal): ${formatMoney(siteNTCost)}\n`;
        body += `Site Labor (Overtime): ${formatMoney(siteOTCost)}\n`;
        body += `Travel Labor (NT): ${formatMoney(travelNTCost)}\n`;
        body += `Travel Labor (OT): ${formatMoney(travelOTCost)}\n`;

        if (vehicleCost > 0) body += `Vehicle Allowances: ${formatMoney(vehicleCost)}\n`;
        if (perDiemCost > 0) body += `Per Diems: ${formatMoney(perDiemCost)}\n`;
        if (reportingCost > 0) body += `Reporting Time: ${formatMoney(reportingCost)}\n`;
        if (travelChargeCost > 0) body += `Travel Charge: ${formatMoney(travelChargeCost)}\n`;

        if (extrasCost > 0) {
            extras.filter(e => e.cost > 0).forEach(extra => {
                body += `${extra.description}: ${formatMoney(extra.cost)}\n`;
            });
        }

        body += `\nTotal: ${formatMoney(totalCost)}`;

        return body;
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generateInvoiceString());
        alert("Copied to clipboard!");
    };

    const exportPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text(`Service ${status === 'invoice' ? 'Invoice' : 'Quote'}`, 20, 20);

        doc.setFontSize(12);
        doc.text(`Customer: ${jobDetails.customer}`, 20, 35);
        doc.text(`Job No: ${jobDetails.jobNo}`, 20, 42);
        doc.text(`Technician: ${jobDetails.techName}`, 20, 49);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 35);

        let y = 65;
        doc.setFontSize(14);
        doc.text("Shift Breakdown", 20, y);
        y += 10;

        doc.setFontSize(10);
        shifts.forEach(s => {
            const { breakdown } = calculateShiftBreakdown(s);
            const line = `${s.date} | ${s.startTime}-${s.finishTime} | Site: ${breakdown.siteHours.toFixed(2)}h | Travel: ${(s.travelIn + s.travelOut).toFixed(2)}h`;
            doc.text(line, 20, y);
            y += 7;
        });

        y += 10;
        doc.setFontSize(14);
        doc.text("Financials", 20, y);
        y += 10;

        doc.setFontSize(10);
        doc.text(`Total Cost: ${formatMoney(totalCost)}`, 20, y);

        doc.save(`${jobDetails.jobNo}_${status}.pdf`);
    };

    // Calculate individual allowances
    const vehicleCount = shifts.filter(s => s.vehicle).length;
    const perDiemCount = shifts.filter(s => s.perDiem).length;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-fit">
                <h2 className="text-lg font-semibold mb-4 text-slate-700">Financial Summary</h2>

                <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-600">Site Labor (Normal)</span>
                        <span className="font-mono">
                            {formatMoney(shifts.reduce((acc, s) => acc + (calculateShiftBreakdown(s).breakdown.siteNT * rates.siteNormal), 0))}
                        </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-600">Site Labor (Overtime)</span>
                        <span className="font-mono">
                            {formatMoney(shifts.reduce((acc, s) => {
                                const { breakdown } = calculateShiftBreakdown(s);
                                const rate = s.dayType === 'publicHoliday' ? rates.publicHoliday : (s.dayType === 'weekend' ? rates.weekend : rates.siteOvertime);
                                return acc + (breakdown.siteOT * rate);
                            }, 0))}
                        </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-600">Travel Labor (NT)</span>
                        <span className="font-mono">
                            {formatMoney(shifts.reduce((acc, s) => {
                                const { breakdown } = calculateShiftBreakdown(s);
                                return acc + (breakdown.travelInNT * rates.travel) + (breakdown.travelOutNT * rates.travel);
                            }, 0))}
                        </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-600">Travel Labor (OT)</span>
                        <span className="font-mono">
                            {formatMoney(shifts.reduce((acc, s) => {
                                const { breakdown } = calculateShiftBreakdown(s);
                                return acc + (breakdown.travelInOT * rates.travelOvertime) + (breakdown.travelOutOT * rates.travelOvertime);
                            }, 0))}
                        </span>
                    </div>

                    {vehicleCount > 0 && (
                        <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-slate-600">Vehicle Allowance ({vehicleCount}x)</span>
                            <span className="font-mono">
                                {formatMoney(vehicleCount * rates.vehicle)}
                            </span>
                        </div>
                    )}

                    {perDiemCount > 0 && (
                        <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-slate-600">Per Diem ({perDiemCount}x)</span>
                            <span className="font-mono">
                                {formatMoney(perDiemCount * rates.perDiem)}
                            </span>
                        </div>
                    )}

                    {reportingCost > 0 && (
                        <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-slate-600">Reporting Time ({jobDetails.reportingTime}h)</span>
                            <span className="font-mono">
                                {formatMoney(reportingCost)}
                            </span>
                        </div>
                    )}

                    {travelChargeCost > 0 && (
                        <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-slate-600">Travel Charge</span>
                            <span className="font-mono">
                                {formatMoney(travelChargeCost)}
                            </span>
                        </div>
                    )}

                    {extras.filter(e => e.cost > 0).map((extra) => (
                        <div key={extra.id} className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-slate-600">{extra.description || 'Extra Item'}</span>
                            <span className="font-mono">
                                {formatMoney(parseFloat(extra.cost as any) || 0)}
                            </span>
                        </div>
                    ))}

                    <div className="flex justify-between pt-4 text-xl font-bold">
                        <span>Grand Total</span>
                        <span>{formatMoney(totalCost)}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Admin Communication Section */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-slate-700">Admin Communication</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                Job Number
                            </label>
                            <input
                                type="text"
                                value={jobDetails.jobNo || ''}
                                onChange={(e) => quote.setJobDetails({ ...jobDetails, jobNo: e.target.value })}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. J123456"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                External Link
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={jobDetails.externalLink || ''}
                                    onChange={(e) => quote.setJobDetails({ ...jobDetails, externalLink: e.target.value })}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="https://..."
                                />
                                {jobDetails.externalLink && (
                                    <button
                                        onClick={() => window.open(jobDetails.externalLink, '_blank')}
                                        className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                                        title="Open Link"
                                    >
                                        <ExternalLink size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                Original Quote / PO Amount
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                                <input
                                    type="number"
                                    value={jobDetails.quotedAmount || ''}
                                    onChange={(e) => quote.setJobDetails({ ...jobDetails, quotedAmount: parseFloat(e.target.value) || 0 })}
                                    className="w-full pl-7 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                Variance Reason
                            </label>
                            <input
                                type="text"
                                value={jobDetails.varianceReason || ''}
                                onChange={(e) => quote.setJobDetails({ ...jobDetails, varianceReason: e.target.value })}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. Extra site time requested..."
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded border border-slate-200 flex justify-between items-center mb-4">
                        <span className="text-sm font-medium text-slate-600">Total to Invoice: {formatMoney(totalCost)}</span>
                        {(jobDetails.quotedAmount || 0) > 0 && (
                            <span className={`text-sm font-bold ${totalCost > (jobDetails.quotedAmount || 0) ? 'text-red-600' : 'text-green-600'}`}>
                                Difference: {formatMoney(totalCost - (jobDetails.quotedAmount || 0))}
                                {Math.abs(totalCost - (jobDetails.quotedAmount || 0)) > 0.01 ? (totalCost > (jobDetails.quotedAmount || 0) ? ' (Higher)' : ' (Lower)') : ''}
                            </span>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-slate-700">Invoice Copy</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={exportPDF}
                                className="bg-slate-600 text-white px-3 py-1.5 rounded text-sm flex items-center gap-2 hover:bg-slate-700"
                            >
                                <FileDown size={16} /> PDF
                            </button>
                            <button
                                onClick={copyToClipboard}
                                className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm flex items-center gap-2 hover:bg-blue-700"
                            >
                                <Copy size={16} /> Copy Email
                            </button>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 mb-2">
                        Copy this block and paste it directly into your email or accounting software.
                    </p>
                    <textarea
                        readOnly
                        className="w-full h-64 p-3 font-mono text-sm bg-slate-50 border rounded focus:outline-none"
                        value={generateInvoiceString()}
                    />
                </div>
            </div>

        </div>
    );
}

import type { Rates } from '../types';
import { Lock, Unlock, Calculator, PlusCircle, Save, RotateCcw } from 'lucide-react';
import { useState } from 'react';

interface RatesConfigProps {
    rates: Rates;
    setRates: (rates: Rates) => void;
    saveAsDefaults?: (rates: Rates) => void;
    resetToDefaults?: () => void;
}

export default function RatesConfig({ rates, setRates, saveAsDefaults, resetToDefaults }: RatesConfigProps) {
    const [isLocked, setIsLocked] = useState(true);
    const [calcKm, setCalcKm] = useState<number>(0);
    const [calcHours, setCalcHours] = useState<number>(0);

    const handleUnlock = () => {
        if (confirm("Are you sure you want to edit rates? These are typically fixed once set up for a customer.")) {
            setIsLocked(false);
        }
    };

    const handleLock = () => {
        setIsLocked(true);
    };

    const calculateTotal = () => {
        return (calcHours * rates.travel) + (calcKm * rates.travelCharge);
    };

    const addToExBrisbane = () => {
        const amountToAdd = calculateTotal();
        if (amountToAdd > 0) {
            setRates({
                ...rates,
                travelChargeExBrisbane: parseFloat((rates.travelChargeExBrisbane + amountToAdd).toFixed(2))
            });
            // Reset calculator inputs
            setCalcKm(0);
            setCalcHours(0);
        }
    };

    const handleSaveDefaults = () => {
        if (saveAsDefaults && confirm("Are you sure you want to set these rates as the new SYSTEM DEFAULTS? All new quotes will use these rates.")) {
            saveAsDefaults(rates);
            alert("New default rates saved.");
        }
    };

    const handleResetDefaults = () => {
        if (resetToDefaults && confirm("Are you sure you want to reset these rates to the SYSTEM DEFAULTS? This will overwrite current changes.")) {
            resetToDefaults();
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-slate-700">Service Technician Rates</h2>
                    <p className="text-sm text-slate-500 mt-1">Configure hourly rates and allowances for this customer</p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Default Management Buttons */}
                    {!isLocked && (saveAsDefaults || resetToDefaults) && (
                        <div className="flex items-center gap-2 mr-4 border-r pr-4 border-slate-200">
                            {resetToDefaults && (
                                <button
                                    onClick={handleResetDefaults}
                                    className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded text-sm font-medium flex items-center gap-1 hover:bg-slate-50"
                                    title="Load system default rates"
                                >
                                    <RotateCcw size={16} /> Load Defaults
                                </button>
                            )}
                            {saveAsDefaults && (
                                <button
                                    onClick={handleSaveDefaults}
                                    className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded text-sm font-medium flex items-center gap-1 hover:bg-slate-50"
                                    title="Save current rates as system defaults"
                                >
                                    <Save size={16} /> Set as Defaults
                                </button>
                            )}
                        </div>
                    )}

                    {isLocked ? (
                        <button
                            onClick={handleUnlock}
                            className="bg-amber-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-amber-700 font-medium"
                        >
                            <Unlock size={18} /> Unlock to Edit
                        </button>
                    ) : (
                        <button
                            onClick={handleLock}
                            className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700 font-medium"
                        >
                            <Lock size={18} /> Lock Rates
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Labor Rates */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide border-b pb-2">Labor Rates</h3>

                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Site Normal Working Hours - First 7.5hrs</label>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500">$</span>
                            <input
                                disabled={isLocked}
                                type="number"
                                step="1"
                                value={rates.siteNormal}
                                onChange={(e) => setRates({ ...rates, siteNormal: parseFloat(e.target.value) || 0 })}
                                className={`border rounded p-2 w-full ${isLocked ? 'bg-slate-100 text-slate-500' : ''}`}
                            />
                            <span className="text-slate-500">/hr</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Site Overtime Rate - After 7.5 Normal Working Hours</label>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500">$</span>
                            <input
                                disabled={isLocked}
                                type="number"
                                step="1"
                                value={rates.siteOvertime}
                                onChange={(e) => setRates({ ...rates, siteOvertime: parseFloat(e.target.value) || 0 })}
                                className={`border rounded p-2 w-full ${isLocked ? 'bg-slate-100 text-slate-500' : ''}`}
                            />
                            <span className="text-slate-500">/hr</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Saturday/Sunday</label>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500">$</span>
                            <input
                                disabled={isLocked}
                                type="number"
                                step="1"
                                value={rates.weekend}
                                onChange={(e) => setRates({ ...rates, weekend: parseFloat(e.target.value) || 0 })}
                                className={`border rounded p-2 w-full ${isLocked ? 'bg-slate-100 text-slate-500' : ''}`}
                            />
                            <span className="text-slate-500">/hr</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Public Holidays</label>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500">$</span>
                            <input
                                disabled={isLocked}
                                type="number"
                                step="1"
                                value={rates.publicHoliday}
                                onChange={(e) => setRates({ ...rates, publicHoliday: parseFloat(e.target.value) || 0 })}
                                className={`border rounded p-2 w-full ${isLocked ? 'bg-slate-100 text-slate-500' : ''}`}
                            />
                            <span className="text-slate-500">/hr</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Office Reporting Time</label>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500">$</span>
                            <input
                                disabled={isLocked}
                                type="number"
                                step="1"
                                value={rates.officeReporting}
                                onChange={(e) => setRates({ ...rates, officeReporting: parseFloat(e.target.value) || 0 })}
                                className={`border rounded p-2 w-full ${isLocked ? 'bg-slate-100 text-slate-500' : ''}`}
                            />
                            <span className="text-slate-500">/hr</span>
                        </div>
                    </div>
                </div>

                {/* Travel & Allowances */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide border-b pb-2">Allowances & Other</h3>

                    {/* Moved Travel Rate and Travel Charge to Calculator section below */}

                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Travel Charge ex Brisbane</label>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500">$</span>
                            <input
                                disabled={isLocked}
                                type="number"
                                step="0.01"
                                value={rates.travelChargeExBrisbane}
                                onChange={(e) => setRates({ ...rates, travelChargeExBrisbane: parseFloat(e.target.value) || 0 })}
                                className={`border rounded p-2 w-full ${isLocked ? 'bg-slate-100 text-slate-500' : ''}`}
                                placeholder="Input Value"
                            />
                            <span className="text-slate-500">/tech</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Site Vehicle</label>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500">$</span>
                            <input
                                disabled={isLocked}
                                type="number"
                                step="1"
                                value={rates.vehicle}
                                onChange={(e) => setRates({ ...rates, vehicle: parseFloat(e.target.value) || 0 })}
                                className={`border rounded p-2 w-full ${isLocked ? 'bg-slate-100 text-slate-500' : ''}`}
                            />
                            <span className="text-slate-500">/day</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Technician Overnight Allowance</label>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500">$</span>
                            <input
                                disabled={isLocked}
                                type="number"
                                step="1"
                                value={rates.perDiem}
                                onChange={(e) => setRates({ ...rates, perDiem: parseFloat(e.target.value) || 0 })}
                                className={`border rounded p-2 w-full ${isLocked ? 'bg-slate-100 text-slate-500' : ''}`}
                            />
                            <span className="text-slate-500">/night</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Standard Day Rate (12hrs)</label>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500">$</span>
                            <input
                                disabled
                                type="number"
                                value={(rates.siteNormal * 7.5) + (rates.siteOvertime * 4.5)}
                                className="border rounded p-2 w-full bg-slate-100 text-slate-600 font-medium cursor-not-allowed"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Calculated: (7.5h Ã— Normal) + (4.5h Ã— OT)</p>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Weekend Day Rate (12hrs)</label>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500">$</span>
                            <input
                                disabled
                                type="number"
                                value={rates.weekend * 12}
                                className="border rounded p-2 w-full bg-slate-100 text-slate-600 font-medium cursor-not-allowed"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Calculated: 12h Ã— Weekend Rate</p>
                    </div>
                </div>
            </div>

            {/* Travel Calculator */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-700 text-sm mb-4 flex items-center gap-2">
                    <Calculator size={16} /> Travel Rates & Calculator
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Travel Rate</label>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500">$</span>
                            <input
                                disabled={isLocked}
                                type="number"
                                step="1"
                                value={rates.travel}
                                onChange={(e) => setRates({ ...rates, travel: parseFloat(e.target.value) || 0 })}
                                className={`border rounded p-2 w-full ${isLocked ? 'bg-slate-100 text-slate-500' : ''}`}
                            />
                            <span className="text-slate-500">/hr</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Travel Charge</label>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500">$</span>
                            <input
                                disabled={isLocked}
                                type="number"
                                step="0.01"
                                value={rates.travelCharge}
                                onChange={(e) => setRates({ ...rates, travelCharge: parseFloat(e.target.value) || 0 })}
                                className={`border rounded p-2 w-full ${isLocked ? 'bg-slate-100 text-slate-500' : ''}`}
                            />
                            <span className="text-slate-500">/km</span>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Calculate Trip Cost</h4>
                    <div className="flex flex-wrap items-end gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Hours</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={calcHours || ''}
                                    className="w-20 p-2 border rounded bg-white"
                                    onChange={(e) => setCalcHours(parseFloat(e.target.value) || 0)}
                                />
                                <span className="text-slate-500 text-sm">hrs</span>
                            </div>
                        </div>
                        <div className="pb-2 text-slate-400">+</div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Distance</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={calcKm || ''}
                                    className="w-24 p-2 border rounded bg-white"
                                    onChange={(e) => setCalcKm(parseFloat(e.target.value) || 0)}
                                />
                                <span className="text-slate-500 text-sm">km</span>
                            </div>
                        </div>
                        <div className="pb-2 text-slate-400">=</div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Total</label>
                            <div className="py-2 px-3 bg-white rounded border border-slate-300 text-slate-800 font-bold min-w-[100px]">
                                {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(calculateTotal())}
                            </div>
                        </div>

                        <button
                            onClick={addToExBrisbane}
                            disabled={isLocked || (calcKm <= 0 && calcHours <= 0)}
                            className="mb-0.5 bg-blue-600 text-white px-4 py-2 rounded shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                        >
                            <PlusCircle size={16} /> Add to Ex-Brisbane
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Calculates (Hours Ã— Travel Rate) + (Distance Ã— Travel Charge) and adds it to the "Travel Charge ex Brisbane" field.
                    </p>
                </div>
            </div>
        </div>
    );
}
