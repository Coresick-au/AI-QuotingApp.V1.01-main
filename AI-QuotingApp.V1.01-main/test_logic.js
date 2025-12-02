const rates = {
    siteNormal: 160,
    siteOvertime: 190,
    weekend: 190,
    travel: 120,
    travelOvertime: 120,
    vehicle: 120,
    perDiem: 90,
    travelKmRate: 1.3,
    reportingRate: 160
};

const shift = {
    id: 1,
    date: '2023-10-27',
    isWeekend: false,
    startTime: '06:00',
    finishTime: '14:00', // 8 hours total
    travelIn: 0.5,
    travelOut: 0.5,
    vehicle: true,
    perDiem: false
};

const getDuration = (start, end) => {
    if (!start || !end) return 0;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let diff = (endH + endM / 60) - (startH + startM / 60);
    if (diff < 0) diff += 24;
    return parseFloat(diff.toFixed(2));
};

const calculateShiftBreakdown = (shift) => {
    const totalDuration = getDuration(shift.startTime, shift.finishTime);
    const derivedSiteHrs = Math.max(0, totalDuration - (shift.travelIn + shift.travelOut));

    console.log(`Total Duration: ${totalDuration}`);
    console.log(`Site Hours: ${derivedSiteHrs}`);

    let cost = 0;
    let breakdown = {
        travelInNT: 0, travelInOT: 0,
        siteNT: 0, siteOT: 0,
        travelOutNT: 0, travelOutOT: 0,
        totalHours: totalDuration,
        siteHours: derivedSiteHrs
    };

    if (shift.isWeekend) {
        // ... weekend logic ...
    } else {
        let hoursConsumed = 0;
        const ntLimit = 7.5;

        // A. Travel In
        const travelInNT = Math.max(0, Math.min(shift.travelIn, ntLimit - hoursConsumed));
        const travelInOT = shift.travelIn - travelInNT;
        hoursConsumed += shift.travelIn;

        breakdown.travelInNT = travelInNT;
        breakdown.travelInOT = travelInOT;

        console.log(`Travel In: NT=${travelInNT}, OT=${travelInOT}, Consumed=${hoursConsumed}`);

        // B. Site Time
        const siteNT = Math.max(0, Math.min(derivedSiteHrs, ntLimit - hoursConsumed));
        const siteOT = derivedSiteHrs - siteNT;
        hoursConsumed += derivedSiteHrs;

        breakdown.siteNT = siteNT;
        breakdown.siteOT = siteOT;

        console.log(`Site: NT=${siteNT}, OT=${siteOT}, Consumed=${hoursConsumed}`);

        // C. Travel Out
        const travelOutNT = Math.max(0, Math.min(shift.travelOut, ntLimit - hoursConsumed));
        const travelOutOT = shift.travelOut - travelOutNT;
        hoursConsumed += shift.travelOut;

        breakdown.travelOutNT = travelOutNT;
        breakdown.travelOutOT = travelOutOT;

        console.log(`Travel Out: NT=${travelOutNT}, OT=${travelOutOT}, Consumed=${hoursConsumed}`);
    }

    return breakdown;
};

calculateShiftBreakdown(shift);
