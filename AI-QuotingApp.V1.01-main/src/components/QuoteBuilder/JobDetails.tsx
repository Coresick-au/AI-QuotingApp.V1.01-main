
import { MapPin, Users, Briefcase, Plus, X } from 'lucide-react';
import type { JobDetails as JobDetailsType, Customer, Rates } from '../../types';

interface JobDetailsProps {
    jobDetails: JobDetailsType;
    setJobDetails: (details: JobDetailsType) => void;
    isLocked: boolean;
    savedCustomers: Customer[];
    setRates: (rates: Rates) => void;
    renameTechnician: (index: number, newName: string) => void;
}

export default function JobDetails({
    jobDetails, setJobDetails, isLocked, savedCustomers, setRates, renameTechnician
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
        renameTechnician(index, value);
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-200">Job Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Customer with Datalist */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                        <Briefcase size={16} /> Customer
                    </label>
                    <input
                        type="text"
                        list="customer-list"
                        disabled={isLocked}
                        value={jobDetails.customer}
                        onChange={handleCustomerChange}
                        className={`w-full p-2 border border-gray-600 rounded bg-gray-700 text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none ${isLocked ? 'bg-gray-600 opacity-50 text-slate-400' : ''}`}
                        placeholder="Select or type customer..."
                    />
                    <datalist id="customer-list">
                        {savedCustomers.map(c => (
                            <option key={c.id} value={c.name} />
                        ))}
                    </datalist>
                </div>



                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                        <MapPin size={16} /> Location
                    </label>
                    <input
                        type="text"
                        disabled={isLocked}
                        value={jobDetails.location}
                        onChange={(e) => setJobDetails({ ...jobDetails, location: e.target.value })}
                        className={`w-full p-2 border border-gray-600 rounded bg-gray-700 text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none ${isLocked ? 'bg-gray-600 opacity-50 text-slate-400' : ''}`}
                        placeholder="Site Location"
                    />
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
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
                                className={`p-2 border border-gray-600 rounded w-48 bg-gray-700 text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none ${isLocked ? 'bg-gray-600 opacity-50 text-slate-400' : ''}`}
                                placeholder={`Tech ${index + 1}`}
                            />
                            {!isLocked && jobDetails.technicians.length > 1 && (
                                <button
                                    onClick={() => removeTechnician(index)}
                                    className="text-slate-400 hover:text-red-400"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                    {!isLocked && (
                        <button
                            onClick={addTechnician}
                            className="flex items-center gap-1 text-primary-400 hover:text-primary-300 font-medium px-2 py-1 rounded hover:bg-primary-900/20"
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
                        className={`p-2 border border-gray-600 rounded w-full bg-gray-700 text-slate-100 ${isLocked ? 'bg-gray-600 opacity-50 text-slate-400' : ''}`}
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
                            className="w-4 h-4 accent-primary-600 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="includeTravelCharge" className="text-sm font-medium text-slate-300 select-none cursor-pointer">
                            Include Travel Charge?
                        </label>
                    </div>


                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description / Scope of Works</label>
                <textarea
                    disabled={isLocked}
                    value={jobDetails.description}
                    onChange={(e) => setJobDetails({ ...jobDetails, description: e.target.value })}
                    className={`w-full p-3 border border-gray-600 rounded h-24 bg-gray-700 text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none ${isLocked ? 'bg-gray-600 opacity-50 text-slate-400' : ''}`}
                    placeholder="Enter job description..."
                />
            </div>
        </div>
    );
}
