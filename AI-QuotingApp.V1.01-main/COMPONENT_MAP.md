# AI Quoting App - Component Map

## 1. Global State
**Hook:** `src/hooks/useQuote.ts`
- **Responsibility:** Manages all data (Quotes, Customers, Rates).
- **Persistence:** Syncs to `localStorage`.
- **Key Actions:** `loadQuote`, `calculateShiftBreakdown` (bridged to `logic.ts`), `saveCustomer`.

## 2. Component Hierarchy

### Root: `src/App.tsx`
- **Condition:**
  - If `!activeQuoteId` -> Renders **Dashboard**.
  - If `activeQuoteId` -> Renders **Layout** with active tab.

### A. Dashboard (`src/components/Dashboard.tsx`)
- **Tabs:** Quotes / Customers / Technicians.
- **Sub-components:**
  - `CustomerDashboard`: Manage customer profiles + default rates.
  - `TechnicianDashboard`: Add/Remove technicians.

### B. Workspace (`src/components/Layout.tsx`)
- **Header:** Displays Status (Draft/Quoted) and Live Total Cost.
- **Nav:** Switch between Quote / Rates / Summary.

#### Tab 1: Quote Builder (`src/components/QuoteBuilder/QuoteBuilder.tsx`)
- **`JobDetails`**: Customer selection (triggers rate load), Job #, Site info.
- **`Timesheet`**: Grid for entering shifts.
  - **Logic:** Calls `calculateShiftBreakdown` (from `logic.ts`) to display costs live.
- **`Extras`**: Accommodation, parts, etc.

#### Tab 2: Rates Config (`src/components/RatesConfig.tsx`)
- **Function:** Overwrite rates *specifically for this quote*.
- **Calculator:** Helper to calculate Travel Charge Ex-Brisbane.

#### Tab 3: Summary (`src/components/Summary.tsx`)
- **Function:** Read-only view.
- **Outputs:** Xero-formatted text string, PDF Export.