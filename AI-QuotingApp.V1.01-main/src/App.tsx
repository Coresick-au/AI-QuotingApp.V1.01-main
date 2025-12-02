import { useState } from 'react';
import Layout from './components/Layout';
import QuoteBuilder from './components/QuoteBuilder/QuoteBuilder';
import RatesConfig from './components/RatesConfig';
import Summary from './components/Summary';
import Dashboard from './components/Dashboard';
import { useQuote } from './hooks/useQuote';

function App() {
  const [activeTab, setActiveTab] = useState('quote');
  const quote = useQuote();

  if (!quote.activeQuoteId) {
    return (
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
      />
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
