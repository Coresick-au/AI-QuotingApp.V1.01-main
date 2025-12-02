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
    isNightShift?: boolean;
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
        tech: 'Tech 1',
        isNightShift: false
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
            tech: prevTech,
            isNightShift: false
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
import type { Shift, Rates, CalculatedShift, ShiftBreakdown } from './types';

export const getDuration = (startTime: string, finishTime: string): number => {
    if (!startTime || !finishTime) return 0;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = finishTime.split(':').map(Number);
    let diff = (endH + endM / 60) - (startH + startM / 60);
    if (diff < 0) diff += 24;
    return parseFloat(diff.toFixed(2));
};

export const calculateShiftBreakdown = (shift: Shift, rates: Rates): CalculatedShift => {
    const totalDuration = getDuration(shift.startTime, shift.finishTime);
    const siteHours = Math.max(0, totalDuration - (shift.travelIn + shift.travelOut));

    const breakdown: ShiftBreakdown = {
        travelInNT: 0,
        travelInOT: 0,
        siteNT: 0,
        siteOT: 0,
        travelOutNT: 0,
        travelOutOT: 0,
        totalHours: totalDuration,
        siteHours: siteHours
    };

    let cost = 0;

    if (shift.dayType === 'weekday') {
        if (shift.isNightShift) {
            // Night Shift: All hours are OT. Ignore 7.5h cap.
            breakdown.travelInNT = 0;
            breakdown.travelInOT = shift.travelIn;
            breakdown.siteNT = 0;
            breakdown.siteOT = siteHours;
            breakdown.travelOutNT = 0;
            breakdown.travelOutOT = shift.travelOut;

            cost += shift.travelIn * rates.travelOvertime;
            cost += siteHours * rates.siteOvertime;
            cost += shift.travelOut * rates.travelOvertime;
        } else {
            let hoursConsumed = 0;
            const ntLimit = 7.5;

            // 1. Travel In
            const travelInNT = Math.max(0, Math.min(shift.travelIn, ntLimit - hoursConsumed));
            const travelInOT = shift.travelIn - travelInNT;
            hoursConsumed += shift.travelIn;

            breakdown.travelInNT = travelInNT;
            breakdown.travelInOT = travelInOT;

            cost += travelInNT * rates.travel;
            cost += travelInOT * rates.travelOvertime;

            // 2. Site Time
            const siteNT = Math.max(0, Math.min(siteHours, ntLimit - hoursConsumed));
            const siteOT = siteHours - siteNT;
            hoursConsumed += siteHours;

            breakdown.siteNT = siteNT;
            breakdown.siteOT = siteOT;

            cost += siteNT * rates.siteNormal;
            cost += siteOT * rates.siteOvertime;

            // 3. Travel Out
            const travelOutNT = Math.max(0, Math.min(shift.travelOut, ntLimit - hoursConsumed));
            const travelOutOT = shift.travelOut - travelOutNT;
            hoursConsumed += shift.travelOut;

            breakdown.travelOutNT = travelOutNT;
            breakdown.travelOutOT = travelOutOT;

            cost += travelOutNT * rates.travel;
            cost += travelOutOT * rates.travelOvertime;
        }

    } else if (shift.dayType === 'weekend') {
        // Weekend: All Site = Weekend Rate. Travel = OT Rate.
        breakdown.siteNT = siteHours; // Using NT bucket for base hours
        breakdown.travelInOT = shift.travelIn;
        breakdown.travelOutOT = shift.travelOut;

        cost += siteHours * rates.weekend;
        cost += shift.travelIn * rates.travelOvertime;
        cost += shift.travelOut * rates.travelOvertime;

    } else if (shift.dayType === 'publicHoliday') {
        // Public Holiday: All hours = PH Rate.
        breakdown.siteNT = siteHours;
        breakdown.travelInNT = shift.travelIn;
        breakdown.travelOutNT = shift.travelOut;

        cost += siteHours * rates.publicHoliday;
        cost += shift.travelIn * rates.publicHoliday;
        cost += shift.travelOut * rates.publicHoliday;
    }

    // Allowances
    if (shift.vehicle) {
        cost += rates.vehicle;
    }
    if (shift.perDiem) {
        cost += rates.perDiem;
    }

    return {
        cost,
        breakdown
    };
};

import { Plus, Trash2 } from 'lucide-react';
import type { Shift, CalculatedShift } from '../../types';

interface TimesheetProps {
    shifts: Shift[];
    isLocked: boolean;
    addShift: () => void;
    updateShift: (id: number, field: keyof Shift, value: any) => void;
    removeShift: (id: number) => void;
    calculateShiftBreakdown: (shift: Shift) => CalculatedShift;
    formatMoney: (amount: number) => string;
}

export default function Timesheet({
    shifts,
    isLocked,
    addShift,
    updateShift,
    removeShift,
    calculateShiftBreakdown,
    formatMoney
}: TimesheetProps) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-slate-700">Timesheet & Hours</h2>
                    <p className="text-xs text-slate-500">Enter Start/Finish + Travel. Site hours are calculated automatically.</p>
                </div>
                {!isLocked && (
                    <button onClick={addShift} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1 hover:bg-blue-700">
                        <Plus size={16} /> Add Shift
                    </button>
                )}
            </div>

            <table className="w-full min-w-[1100px] text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                    <tr>
                        <th className="p-3 w-32">Date</th>
                        <th className="p-3 w-32">Tech</th>
                        <th className="p-3 w-32">Type</th>
                        <th className="p-3 w-24">Start</th>
                        <th className="p-3 w-24">Finish</th>
                        <th className="p-3 w-20 text-center text-blue-800 bg-blue-50">Trav In</th>
                        <th className="p-3 w-20 text-center text-blue-800 bg-blue-50">Trav Out</th>
                        <th className="p-3 w-20 text-center font-bold">Site Hrs</th>
                        <th className="p-3 w-20 text-center font-bold text-slate-700">Total Hrs</th>
                        <th className="p-3 w-10 text-center">Night?</th>
                        <th className="p-3 w-10 text-center">Veh?</th>
                        <th className="p-3 w-10 text-center">P.D?</th>
                        <th className="p-3 text-right">Cost</th>
                        <th className="p-3 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {shifts.map((shift) => {
                        const { cost, breakdown } = calculateShiftBreakdown(shift);
                        return (
                            <tr key={shift.id} className="hover:bg-slate-50">
                                <td className="p-3">
                                    <input
                                        disabled={isLocked}
                                        type="date"
                                        value={shift.date}
                                        className={`border rounded p-1 w-full ${isLocked ? 'bg-slate-100' : ''}`}
                                        onChange={(e) => updateShift(shift.id, 'date', e.target.value)}
                                    />
                                </td>
                                <td className="p-3">
                                    <input
                                        type="text"
                                        disabled={isLocked}
                                        className={`border rounded p-1 w-full ${isLocked ? 'bg-slate-100' : ''}`}
                                        value={shift.tech}
                                        onChange={(e) => updateShift(shift.id, 'tech', e.target.value)}
                                    />
                                </td>
                                <td className="p-3">
                                    <select
                                        disabled={isLocked}
                                        className={`border rounded p-1 w-full ${isLocked ? 'bg-slate-100' : 'bg-white'}`}
                                        value={shift.dayType}
                                        onChange={(e) => updateShift(shift.id, 'dayType', e.target.value)}
                                    >
                                        <option value="weekday">Weekday</option>
                                        <option value="weekend">Weekend</option>
                                        <option value="publicHoliday">Public Holiday</option>
                                    </select>
                                </td>
                                <td className="p-3">
                                    <input
                                        disabled={isLocked}
                                        type="time"
                                        value={shift.startTime}
                                        className={`border rounded p-1 w-full text-center ${isLocked ? 'bg-slate-100' : ''}`}
                                        onChange={(e) => updateShift(shift.id, 'startTime', e.target.value)}
                                    />
                                </td>
                                <td className="p-3">
                                    <input
                                        disabled={isLocked}
                                        type="time"
                                        value={shift.finishTime}
                                        className={`border rounded p-1 w-full text-center ${isLocked ? 'bg-slate-100' : ''}`}
                                        onChange={(e) => updateShift(shift.id, 'finishTime', e.target.value)}
                                    />
                                </td>
                                <td className="p-3 bg-blue-50">
                                    <input
                                        disabled={isLocked}
                                        type="number" step="0.25"
                                        value={shift.travelIn}
                                        className={`border border-blue-200 rounded p-1 w-full text-center ${isLocked ? 'bg-slate-100' : ''}`}
                                        onChange={(e) => updateShift(shift.id, 'travelIn', parseFloat(e.target.value) || 0)}
                                    />
                                </td>
                                <td className="p-3 bg-blue-50">
                                    <input
                                        disabled={isLocked}
                                        type="number" step="0.25"
                                        value={shift.travelOut}
                                        className={`border border-blue-200 rounded p-1 w-full text-center ${isLocked ? 'bg-slate-100' : ''}`}
                                        onChange={(e) => updateShift(shift.id, 'travelOut', parseFloat(e.target.value) || 0)}
                                    />
                                </td>
                                <td className="p-3 text-center">
                                    <div className="font-bold text-slate-700">{breakdown.siteHours.toFixed(2)}</div>
                                    {breakdown.siteOT > 0 && <div className="text-[10px] text-amber-600">OT: {breakdown.siteOT.toFixed(2)}</div>}
                                </td>
                                <td className="p-3 text-center">
                                    <div className="font-bold text-slate-900 bg-slate-100 rounded px-1">{breakdown.totalHours.toFixed(2)}</div>
                                </td>
                                <td className="p-3 text-center">
                                    <input
                                        disabled={isLocked}
                                        type="checkbox"
                                        checked={shift.isNightShift || false}
                                        onChange={(e) => updateShift(shift.id, 'isNightShift', e.target.checked)}
                                        className="w-4 h-4 accent-blue-600"
                                    />
                                </td>
                                <td className="p-3 text-center">
                                    <input
                                        disabled={isLocked}
                                        type="checkbox"
                                        checked={shift.vehicle}
                                        onChange={(e) => updateShift(shift.id, 'vehicle', e.target.checked)}
                                        className="w-4 h-4 accent-blue-600"
                                    />
                                </td>
                                <td className="p-3 text-center">
                                    <input
                                        disabled={isLocked}
                                        type="checkbox"
                                        checked={shift.perDiem}
                                        onChange={(e) => updateShift(shift.id, 'perDiem', e.target.checked)}
                                        className="w-4 h-4 accent-blue-600"
                                    />
                                </td>
                                <td className="p-3 text-right font-mono text-xs">
                                    {formatMoney(cost)}
                                </td>
                                <td className="p-3 text-center">
                                    {!isLocked && (
                                        <button onClick={() => removeShift(shift.id)} className="text-slate-400 hover:text-red-500">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
import { describe, it, expect } from 'vitest';
import { calculateShiftBreakdown } from './logic';
import type { Shift, Rates } from './types';

const MOCK_RATES: Rates = {
    siteNormal: 100,
    siteOvertime: 150,
    weekend: 200,
    publicHoliday: 250,
    officeReporting: 0, // Not used in these tests
    travel: 80,
    travelOvertime: 100,
    travelCharge: 0,
    travelChargeExBrisbane: 0,
    vehicle: 50,
    perDiem: 100,
    standardDayRate: 0,
    weekendDayRate: 0
};

describe('Business Logic - Shift Calculations', () => {

    it('Standard Weekday: 8am-4pm (8h) with 0.5h Travel In/Out', () => {
        // Total Duration: 8h
        // Travel In: 0.5h
        // Travel Out: 0.5h
        // Site Hours: 7h
        // Logic:
        // 1. Travel In (0.5) -> Consumes NT (0.5/7.5 used) -> Cost: 0.5 * 80 = 40
        // 2. Site (7.0) -> Consumes NT (7.0/7.5 used) -> Cost: 7.0 * 100 = 700
        // 3. Travel Out (0.5) -> Consumes remaining NT? No, 0.5+7.0 = 7.5. So Travel Out is OT?
        // Wait, 0.5 (Travel In) + 7.0 (Site) = 7.5.
        // So Travel Out starts at 7.5.
        // Travel Out (0.5) -> All OT. -> Cost: 0.5 * 100 = 50.
        // Total Cost: 40 + 700 + 50 = 790.

        const shift: Shift = {
            id: 1,
            date: '2023-10-27',
            dayType: 'weekday',
            startTime: '08:00',
            finishTime: '16:00',
            travelIn: 0.5,
            travelOut: 0.5,
            vehicle: false,
            perDiem: false,
            tech: 'Test Tech'
        };

        const result = calculateShiftBreakdown(shift, MOCK_RATES);

        expect(result.breakdown.totalHours).toBe(8);
        expect(result.breakdown.siteHours).toBe(7);

        // Breakdown checks
        expect(result.breakdown.travelInNT).toBe(0.5);
        expect(result.breakdown.travelInOT).toBe(0);
        expect(result.breakdown.siteNT).toBe(7);
        expect(result.breakdown.siteOT).toBe(0);
        expect(result.breakdown.travelOutNT).toBe(0); // Cap reached exactly at end of site time
        expect(result.breakdown.travelOutOT).toBe(0.5);

        // Cost check
        expect(result.cost).toBe(790);
    });

    it('Heavy Overtime Weekday: 6am-6pm (12h) with 1h Travel In/Out', () => {
        // Total Duration: 12h
        // Travel In: 1h
        // Travel Out: 1h
        // Site Hours: 10h
        // Logic:
        // 1. Travel In (1.0) -> Consumes NT (1.0/7.5 used) -> Cost: 1 * 80 = 80
        // 2. Site (10.0) -> 
        //    - NT Remaining: 6.5.
        //    - Site NT: 6.5 -> Cost: 6.5 * 100 = 650
        //    - Site OT: 3.5 -> Cost: 3.5 * 150 = 525
        // 3. Travel Out (1.0) -> All OT -> Cost: 1 * 100 = 100
        // Total Cost: 80 + 650 + 525 + 100 = 1355.

        const shift: Shift = {
            id: 2,
            date: '2023-10-27',
            dayType: 'weekday',
            startTime: '06:00',
            finishTime: '18:00',
            travelIn: 1,
            travelOut: 1,
            vehicle: false,
            perDiem: false,
            tech: 'Test Tech'
        };

        const result = calculateShiftBreakdown(shift, MOCK_RATES);

        expect(result.breakdown.totalHours).toBe(12);
        expect(result.breakdown.siteHours).toBe(10);

        expect(result.breakdown.travelInNT).toBe(1);
        expect(result.breakdown.siteNT).toBe(6.5);
        expect(result.breakdown.siteOT).toBe(3.5);
        expect(result.breakdown.travelOutOT).toBe(1);

        expect(result.cost).toBe(1355);
    });

    it('Weekend: Ensure ALL site hours use Weekend rate and Travel uses OT rate', () => {
        // 8am-4pm (8h). Travel 0.5 each. Site 7h.
        // Travel In: 0.5 * 100 (OT) = 50
        // Site: 7 * 200 (Weekend) = 1400
        // Travel Out: 0.5 * 100 (OT) = 50
        // Total: 1500

        const shift: Shift = {
            id: 3,
            date: '2023-10-28',
            dayType: 'weekend',
            startTime: '08:00',
            finishTime: '16:00',
            travelIn: 0.5,
            travelOut: 0.5,
            vehicle: false,
            perDiem: false,
            tech: 'Test Tech'
        };

        const result = calculateShiftBreakdown(shift, MOCK_RATES);

        expect(result.breakdown.siteHours).toBe(7);
        expect(result.cost).toBe(1500);
    });

    it('Public Holiday: Ensure ALL site hours use Public Holiday rate', () => {
        // 8am-4pm (8h). Travel 0.5 each. Site 7h.
        // Travel In: 0.5 * 250 (PH) = 125
        // Site: 7 * 250 (PH) = 1750
        // Travel Out: 0.5 * 250 (PH) = 125
        // Total: 2000

        const shift: Shift = {
            id: 4,
            date: '2023-10-29',
            dayType: 'publicHoliday',
            startTime: '08:00',
            finishTime: '16:00',
            travelIn: 0.5,
            travelOut: 0.5,
            vehicle: false,
            perDiem: false,
            tech: 'Test Tech'
        };

        const result = calculateShiftBreakdown(shift, MOCK_RATES);

        expect(result.breakdown.siteHours).toBe(7);
        expect(result.cost).toBe(2000);
    });

    it('Allowances: Vehicle and Per Diem add correctly', () => {
        // Base shift: Standard Weekday (Cost 790)
        // + Vehicle (50)
        // + Per Diem (100)
        // Total = 790 + 50 + 100 = 940

        const shift: Shift = {
            id: 5,
            date: '2023-10-27',
            dayType: 'weekday',
            startTime: '08:00',
            finishTime: '16:00',
            travelIn: 0.5,
            travelOut: 0.5,
            vehicle: true,
            perDiem: true,
            tech: 'Test Tech'
        };

        const result = calculateShiftBreakdown(shift, MOCK_RATES);

        expect(result.cost).toBe(940);
    });

    it('Night Shift: All hours should be OT', () => {
        // Weekday, 10 hours site time + 1 hour travel (0.5 in, 0.5 out).
        // Total Duration: 11h.
        // isNightShift = true.
        // Expectation:
        // siteNT = 0
        // siteOT = 10
        // travelInOT = 0.5
        // travelOutOT = 0.5
        // Cost: (0.5 * 100) + (10 * 150) + (0.5 * 100) = 50 + 1500 + 50 = 1600.

        const shift: Shift = {
            id: 6,
            date: '2023-10-27',
            dayType: 'weekday',
            startTime: '08:00',
            finishTime: '19:00',
            travelIn: 0.5,
            travelOut: 0.5,
            vehicle: false,
            perDiem: false,
            tech: 'Test Tech',
            isNightShift: true
        };

        const result = calculateShiftBreakdown(shift, MOCK_RATES);

        expect(result.breakdown.siteNT).toBe(0);
        expect(result.breakdown.siteOT).toBe(10);
        expect(result.breakdown.travelInOT).toBe(0.5);
        expect(result.breakdown.travelOutOT).toBe(0.5);
        expect(result.cost).toBe(1600);
    });
});
