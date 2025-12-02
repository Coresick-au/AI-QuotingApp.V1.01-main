# AI Quoting App - Technical Specifications

## 1. Core Architecture
- **Stack**: React (Vite) + TypeScript + Tailwind CSS
- **State Management**: Custom hook `useQuote.ts` persisting to `localStorage`.
- **Styling**: Utility-first (Tailwind).

## 2. Business Logic Rules (DO NOT MODIFY WITHOUT EXPLICIT INSTRUCTION)

### A. Shift Duration Calculation
- **Duration**: Difference between `finishTime` and `startTime`.
- **Site Hours**: `Total Duration` - (`Travel In` + `Travel Out`).

### B. Overtime & Rates Logic
The calculation order for "consuming" the standard 7.5h Normal Time (NT) cap on a **Weekday** is:
1. **Travel In**: Consumes NT first.
2. **Site Time**: Consumes remaining NT.
3. **Travel Out**: Consumes any remaining NT.

**Rules:**
- **Weekday**:
    - First 7.5 hours of combined work/travel = **Site Normal** / **Travel Normal**.
    - All excess hours = **Site Overtime** / **Travel Overtime**.
- **Weekend**: All hours are calculated at **Weekend Rate** (Travel is usually OT rate).
- **Public Holiday**: All hours at **Public Holiday Rate**.

### C. Allowances
- **Vehicle**: Flat rate per shift if `vehicle: true`.
- **Per Diem**: Flat rate per shift if `perDiem: true`.
- **Travel Charge**: (Distance * Rate) + Ex-Brisbane Charge.

## 3. Data Structure (Reference)
Key entities are defined in `src/types.ts`. When modifying state, preserve:
- `Quote`: Root object containing `shifts` and `jobDetails`.
- `rates`: The configuration object used for all cost math.

## 4. Development Protocols (AI MUST FOLLOW)

### Data Flow & Component Modification
Before modifying any component properties or data inputs, perform this audit:
1.  **Audit Data Sources:** Distinguish between *Global State* (Master Lists like `savedTechnicians`) and *Local State* (Active Selection like `jobDetails.technicians`).
2.  **Dropdown/Selection Rule:** When creating inputs or dropdowns, ALWAYS use the **Global/Master List** to populate options. Never limit a selection list to only the items currently selected (the "Local List"), as this prevents adding new items.
3.  **Destructuring Check:** Ensure necessary global arrays are destructured from the source hook (e.g., `const { savedTechnicians } = quote`) before trying to use them.