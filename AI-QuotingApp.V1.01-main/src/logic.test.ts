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
        // Unified Logic (Travel = Site rate):
        // Total NT: 0.5 (Travel In) + 7.0 (Site) + 0 (Travel Out) = 7.5h -> Cost: 7.5 * 100 = 750
        // Total OT: 0 (Travel In) + 0 (Site) + 0.5 (Travel Out) = 0.5h -> Cost: 0.5 * 150 = 75
        // Total Cost: 750 + 75 = 825

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
        expect(result.breakdown.travelOutNT).toBe(0);
        expect(result.breakdown.travelOutOT).toBe(0.5);

        // Cost check - Unified rates
        expect(result.cost).toBe(825);
    });

    it('Heavy Overtime Weekday: 6am-6pm (12h) with 1h Travel In/Out', () => {
        // Total Duration: 12h
        // Travel In: 1h
        // Travel Out: 1h
        // Site Hours: 10h
        // Unified Logic (Travel = Site rate):
        // Total NT: 1.0 (Travel In) + 6.5 (Site) + 0 (Travel Out) = 7.5h -> Cost: 7.5 * 100 = 750
        // Total OT: 0 (Travel In) + 3.5 (Site) + 1.0 (Travel Out) = 4.5h -> Cost: 4.5 * 150 = 675
        // Total Cost: 750 + 675 = 1425

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

        // Cost check - Unified rates
        expect(result.cost).toBe(1425);
    });

    it('Weekend: Ensure ALL hours use Weekend rate (unified)', () => {
        // 8am-4pm (8h). Travel 0.5 each. Site 7h.
        // Unified Logic: All hours at weekend rate
        // Total Hours: 0.5 (Travel In) + 7 (Site) + 0.5 (Travel Out) = 8h
        // Cost: 8 * 200 (Weekend) = 1600

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
        expect(result.cost).toBe(1600);
    });

    it('Public Holiday: Ensure ALL hours use Public Holiday rate (unified)', () => {
        // 8am-4pm (8h). Travel 0.5 each. Site 7h.
        // Unified Logic: All hours at public holiday rate
        // Total Hours: 0.5 (Travel In) + 7 (Site) + 0.5 (Travel Out) = 8h
        // Cost: 8 * 250 (PH) = 2000

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
        // Base shift: Standard Weekday (Cost 825 with unified rates)
        // + Vehicle (50)
        // + Per Diem (100)
        // Total = 825 + 50 + 100 = 975

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

        expect(result.cost).toBe(975);
    });

    it('Night Shift: All hours should be OT (unified rates)', () => {
        // Weekday, 10 hours site time + 1 hour travel (0.5 in, 0.5 out).
        // Total Duration: 11h.
        // isNightShift = true.
        // Unified Logic: All hours at OT rate
        // Total OT: 0.5 (Travel In) + 10 (Site) + 0.5 (Travel Out) = 11h
        // Cost: 11 * 150 (siteOvertime) = 1650

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
        expect(result.cost).toBe(1650);
    });
});
