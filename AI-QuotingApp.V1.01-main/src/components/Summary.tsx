
import { Copy, Eye, ExternalLink, X } from 'lucide-react';
import { useState } from 'react';
import { useQuote } from '../hooks/useQuote';

interface SummaryProps {
    quote: ReturnType<typeof useQuote>;
}

export default function Summary({ quote }: SummaryProps) {
    const {
        shifts, extras, rates, calculateShiftBreakdown, totalCost, jobDetails, setJobDetails, status,
        reportingCost, travelChargeCost, isLocked
    } = quote;

    const [showBreakdownModal, setShowBreakdownModal] = useState(false);

    const formatMoney = (amount: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);

    const generateInvoiceString = () => {
        // Calculate Totals - Unified labor costs
        const totalNTCost = shifts.reduce((acc, s) => {
            const { breakdown } = calculateShiftBreakdown(s);
            return acc + ((breakdown.siteNT + breakdown.travelInNT + breakdown.travelOutNT) * rates.siteNormal);
        }, 0);

        const totalOTCost = shifts.reduce((acc, s) => {
            const { breakdown } = calculateShiftBreakdown(s);
            const rate = s.dayType === 'publicHoliday' ? rates.publicHoliday : (s.dayType === 'weekend' ? rates.weekend : rates.siteOvertime);
            return acc + ((breakdown.siteOT + breakdown.travelInOT + breakdown.travelOutOT) * rate);
        }, 0);

        const vehicleCost = shifts.filter(s => s.vehicle).length * rates.vehicle;
        const perDiemCost = shifts.filter(s => s.perDiem).length * rates.perDiem;

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

        // Financial Breakdown - Consolidated Labor
        body += `\n---\nFinancial Breakdown:\n`;
        body += `Labor (Normal): ${formatMoney(totalNTCost)}\n`;
        body += `Labor (Overtime): ${formatMoney(totalOTCost)}\n`;

        if (vehicleCost > 0) body += `Vehicle Allowances: ${formatMoney(vehicleCost)}\n`;
        if (perDiemCost > 0) body += `Per Diems: ${formatMoney(perDiemCost)}\n`;
        if (reportingCost > 0) body += `Reporting Time: ${formatMoney(reportingCost)}\n`;
        if (travelChargeCost > 0) body += `Travel Charge: ${formatMoney(travelChargeCost)}\n`;

        // Break down extras individually
        extras.filter(e => (e.cost || 0) > 0).forEach(extra => {
            body += `${extra.description}: ${formatMoney(extra.cost || 0)}\n`;
        });

        body += `\nTotal: ${formatMoney(totalCost)}`;

        // Append Xero link if exists
        if (jobDetails.externalLink) {
            body += `\n\nLink to Xero Quote: ${jobDetails.externalLink}`;
        }

        // Append comments if exist
        if (jobDetails.adminComments) {
            body += `\n\nComments: ${jobDetails.adminComments}`;
        }

        return body;
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generateInvoiceString());
        alert("Copied to clipboard!");
    };

    const generateShiftBreakdown = () => {
        let breakdown = 'SHIFT BREAKDOWN\n\n';

        shifts.forEach((shift, index) => {
            const { breakdown: b } = calculateShiftBreakdown(shift);
            breakdown += `Shift ${index + 1}:\n`;
            breakdown += `Date: ${shift.date} | Tech: ${shift.tech}\n`;
            breakdown += `Time: ${shift.startTime} - ${shift.finishTime}\n`;
            breakdown += `Day Type: ${shift.dayType}${shift.isNightShift ? ' (Night Shift)' : ''}\n`;
            breakdown += `\nHours Breakdown:\n`;
            breakdown += `  Travel In NT: ${b.travelInNT.toFixed(2)}h | OT: ${b.travelInOT.toFixed(2)}h\n`;
            breakdown += `  Site NT: ${b.siteNT.toFixed(2)}h | OT: ${b.siteOT.toFixed(2)}h\n`;
            breakdown += `  Travel Out NT: ${b.travelOutNT.toFixed(2)}h | OT: ${b.travelOutOT.toFixed(2)}h\n`;
            breakdown += `  Total Hours: ${b.totalHours.toFixed(2)}h (Site: ${b.siteHours.toFixed(2)}h)\n`;
            breakdown += `\n`;
        });

        return breakdown;
    };

    const copyBreakdown = () => {
        navigator.clipboard.writeText(generateShiftBreakdown());
        alert("Shift breakdown copied to clipboard!");
    };

    // Calculate individual allowances
    const vehicleCount = shifts.filter(s => s.vehicle).length;
    const perDiemCount = shifts.filter(s => s.perDiem).length;

    return (
        <div className="space-y-6">
            {/* Header with Finalize Buttons */}
            {status === 'invoice' && (
                <div className="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-2 bg-purple-900/20 px-3 py-1.5 rounded border border-purple-700 text-purple-300">
                        <span className="text-sm font-medium">Invoice Mode - Ready to Finalize</span>
                    </div>
                    <button
                        onClick={() => quote.setStatus('closed')}
                        disabled={isLocked}
                        className="bg-emerald-600 text-white px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-emerald-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Finalize & Close
                    </button>
                </div>
            )}
            {status === 'closed' && (
                <div className="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-emerald-400">
                        <span className="text-sm font-medium">✓ Invoice Closed</span>
                    </div>
                    <button
                        onClick={() => quote.setStatus('invoice')}
                        className="bg-amber-600 text-white px-3 py-1.5 rounded text-sm flex items-center gap-2 hover:bg-amber-700 font-medium"
                    >
                        Unlock to Edit
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700 h-fit">
                    <h2 className="text-lg font-semibold mb-4 text-slate-200">Financial Summary</h2>

                    <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-700">
                            <span className="text-slate-300">Site Labor (Normal)</span>
                            <span className="font-mono">
                                {formatMoney(shifts.reduce((acc, s) => acc + (calculateShiftBreakdown(s).breakdown.siteNT * rates.siteNormal), 0))}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-700">
                            <span className="text-slate-300">Site Labor (Overtime)</span>
                            <span className="font-mono">
                                {formatMoney(shifts.reduce((acc, s) => {
                                    const { breakdown } = calculateShiftBreakdown(s);
                                    const rate = s.dayType === 'publicHoliday' ? rates.publicHoliday : (s.dayType === 'weekend' ? rates.weekend : rates.siteOvertime);
                                    return acc + (breakdown.siteOT * rate);
                                }, 0))}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-700">
                            <span className="text-slate-300">Travel Labor (NT)</span>
                            <span className="font-mono">
                                {formatMoney(shifts.reduce((acc, s) => {
                                    const { breakdown } = calculateShiftBreakdown(s);
                                    return acc + (breakdown.travelInNT * rates.travel) + (breakdown.travelOutNT * rates.travel);
                                }, 0))}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-700">
                            <span className="text-slate-300">Travel Labor (OT)</span>
                            <span className="font-mono">
                                {formatMoney(shifts.reduce((acc, s) => {
                                    const { breakdown } = calculateShiftBreakdown(s);
                                    return acc + (breakdown.travelInOT * rates.travelOvertime) + (breakdown.travelOutOT * rates.travelOvertime);
                                }, 0))}
                            </span>
                        </div>

                        {vehicleCount > 0 && (
                            <div className="flex justify-between py-2 border-b border-gray-700">
                                <span className="text-slate-300">Vehicle Allowance ({vehicleCount}x)</span>
                                <span className="font-mono">
                                    {formatMoney(vehicleCount * rates.vehicle)}
                                </span>
                            </div>
                        )}

                        {perDiemCount > 0 && (
                            <div className="flex justify-between py-2 border-b border-gray-700">
                                <span className="text-slate-300">Per Diem ({perDiemCount}x)</span>
                                <span className="font-mono">
                                    {formatMoney(perDiemCount * rates.perDiem)}
                                </span>
                            </div>
                        )}

                        {reportingCost > 0 && (
                            <div className="flex justify-between py-2 border-b border-gray-700">
                                <span className="text-slate-300">Reporting Time ({jobDetails.reportingTime}h)</span>
                                <span className="font-mono">
                                    {formatMoney(reportingCost)}
                                </span>
                            </div>
                        )}

                        {travelChargeCost > 0 && (
                            <div className="flex justify-between py-2 border-b border-gray-700">
                                <span className="text-slate-300">Travel Charge</span>
                                <span className="font-mono">
                                    {formatMoney(travelChargeCost)}
                                </span>
                            </div>
                        )}

                        {extras.filter(e => e.cost > 0).map((extra) => (
                            <div key={extra.id} className="flex justify-between py-2 border-b border-gray-700">
                                <span className="text-slate-300">{extra.description || 'Extra Item'}</span>
                                <span className="font-mono">
                                    {formatMoney(parseFloat(extra.cost as any) || 0)}
                                </span>
                            </div>
                        ))}

                        <div className="flex justify-between pt-4 text-xl font-bold text-slate-100">
                            <span>Grand Total</span>
                            <span>{formatMoney(totalCost)}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Admin Communication Section */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-slate-200">Admin Communication</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Job Number
                                </label>
                                <input
                                    type="text"
                                    value={jobDetails.jobNo || ''}
                                    onChange={(e) => quote.setJobDetails({ ...jobDetails, jobNo: e.target.value })}
                                    className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="e.g. J123456"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    External Link
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={jobDetails.externalLink || ''}
                                        onChange={(e) => quote.setJobDetails({ ...jobDetails, externalLink: e.target.value })}
                                        className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="https://..."
                                    />
                                    {jobDetails.externalLink && (
                                        <button
                                            onClick={() => window.open(jobDetails.externalLink, '_blank')}
                                            className="p-2 bg-gray-700 text-slate-300 rounded hover:bg-gray-600"
                                            title="Open Link"
                                        >
                                            <ExternalLink size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Additional Comments
                            </label>
                            <textarea
                                value={jobDetails.adminComments || ''}
                                onChange={(e) => setJobDetails({ ...jobDetails, adminComments: e.target.value })}
                                disabled={isLocked}
                                className={`w-full p-2 border border-gray-600 rounded bg-gray-700 text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none h-20 ${isLocked ? 'bg-gray-600 opacity-50' : ''}`}
                                placeholder="Additional notes for admin..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Original Quote / PO Amount
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                                    <input
                                        type="number"
                                        value={jobDetails.quotedAmount || ''}
                                        onChange={(e) => quote.setJobDetails({ ...jobDetails, quotedAmount: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-7 p-2 border border-gray-600 rounded bg-gray-700 text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Variance Reason
                                </label>
                                <input
                                    type="text"
                                    value={jobDetails.varianceReason || ''}
                                    onChange={(e) => quote.setJobDetails({ ...jobDetails, varianceReason: e.target.value })}
                                    className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="e.g. Extra site time requested..."
                                />
                            </div>
                        </div>

                        <div className="bg-gray-700 p-3 rounded border border-gray-600 flex justify-between items-center mb-4">
                            <span className="text-sm font-medium text-slate-300">Total to Invoice: {formatMoney(totalCost)}</span>
                            {(jobDetails.quotedAmount || 0) > 0 && (
                                <span className={`text-sm font-bold ${totalCost > (jobDetails.quotedAmount || 0) ? 'text-red-400' : 'text-green-400'}`}>
                                    Difference: {formatMoney(totalCost - (jobDetails.quotedAmount || 0))}
                                    {Math.abs(totalCost - (jobDetails.quotedAmount || 0)) > 0.01 ? (totalCost > (jobDetails.quotedAmount || 0) ? ' (Higher)' : ' (Lower)') : ''}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-slate-200">Invoice Copy</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowBreakdownModal(true)}
                                    className="bg-gray-700 text-white px-3 py-1.5 rounded text-sm flex items-center gap-2 hover:bg-gray-600"
                                >
                                    <Eye size={16} /> See Shift Breakdown Hours
                                </button>
                                <button
                                    onClick={copyToClipboard}
                                    className="bg-primary-600 text-white px-3 py-1.5 rounded text-sm flex items-center gap-2 hover:bg-primary-700"
                                >
                                    <Copy size={16} /> Copy Email
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-slate-400 mb-2">
                            Copy this block and paste it directly into your email or accounting software.
                        </p>
                        <textarea
                            readOnly
                            className="w-full h-64 p-3 font-mono text-sm bg-gray-700 text-slate-100 border border-gray-600 rounded focus:outline-none"
                            value={generateInvoiceString()}
                        />
                    </div>
                </div>

                {/* Shift Breakdown Modal */}
                {showBreakdownModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowBreakdownModal(false)}>
                        <div className="bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center p-6 border-b">
                                <h2 className="text-xl font-semibold text-slate-100">Shift Breakdown Hours</h2>
                                <button
                                    onClick={() => setShowBreakdownModal(false)}
                                    className="text-slate-400 hover:text-slate-200"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
                                <textarea
                                    readOnly
                                    className="w-full h-96 p-3 font-mono text-sm bg-gray-700 text-slate-100 border border-gray-600 rounded focus:outline-none"
                                    value={generateShiftBreakdown()}
                                />
                            </div>
                            <div className="flex justify-end gap-2 p-6 border-t bg-gray-700">
                                <button
                                    onClick={copyBreakdown}
                                    className="bg-primary-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-primary-700"
                                >
                                    <Copy size={16} /> Copy Breakdown
                                </button>
                                <button
                                    onClick={() => setShowBreakdownModal(false)}
                                    className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
