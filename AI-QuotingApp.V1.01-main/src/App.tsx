import { useState, Suspense, lazy } from 'react';
import Layout from './components/Layout';
import QuoteBuilder from './components/QuoteBuilder/QuoteBuilder';
import RatesConfig from './components/RatesConfig';
import Summary from './components/Summary';
import { useQuote } from './hooks/useQuote';

// Lazy load the Dashboard for performance
const Dashboard = lazy(() => import('./components/Dashboard'));

function App() {
  const [activeTab, setActiveTab] = useState('quote');
  const quote = useQuote();

  if (!quote.activeQuoteId) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center text-slate-400">Loading Dashboard...</div>}>
        <Dashboard
          savedQuotes={quote.savedQuotes}
          createNewQuote={quote.createNewQuote}
          loadQuote={quote.loadQuote}
          deleteQuote={quote.deleteQuote}
          savedCustomers={quote.savedCustomers}
          saveCustomer={quote.saveCustomer}
          deleteCustomer={quote.deleteCustomer}
          savedTechnicians={quote.savedTechnicians}
          saveTechnician={quote.saveTechnician}
          deleteTechnician={quote.deleteTechnician}
          saveAsDefaults={quote.saveAsDefaults}
          resetToDefaults={quote.resetToDefaults}
          savedDefaultRates={quote.savedDefaultRates}
          exportState={quote.exportState}
          importState={quote.importState}
        />
      </Suspense>
    );
  }

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      status={quote.status}
      totalCost={quote.totalCost}
      exitQuote={quote.exitQuote}
    >
      {activeTab === 'quote' && <QuoteBuilder quote={quote} />}
      {activeTab === 'rates' && <RatesConfig rates={quote.rates} setRates={quote.setRates} isLocked={quote.isLocked} />}
      {activeTab === 'summary' && <Summary quote={quote} />}
    </Layout>
  );
}

export default App;
