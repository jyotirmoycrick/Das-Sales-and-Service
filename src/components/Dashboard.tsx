import { useState, useEffect } from 'react';
import { FileText, History, LogOut, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { InvoiceForm } from './InvoiceForm';
import { BillingHistory } from './BillingHistory';
import { initializeDatabase } from '../lib/supabase';

type Tab = 'create' | 'history';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const [dbInitialized, setDbInitialized] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    const init = async () => {
      await initializeDatabase();
      setDbInitialized(true);
    };
    init();
  }, []);

  if (!dbInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Initializing application...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">DasSales Billing</h1>
                <p className="text-xs text-slate-600">Invoice Management System</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex gap-2 bg-white rounded-lg shadow-sm border border-slate-200 p-1">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 flex-1 px-4 py-3 rounded-md font-medium transition-colors ${
              activeTab === 'create'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Plus className="w-5 h-5" />
            Create Invoice
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 flex-1 px-4 py-3 rounded-md font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <History className="w-5 h-5" />
            Billing History
          </button>
        </div>

        {activeTab === 'create' ? <InvoiceForm /> : <BillingHistory />}
      </div>
    </div>
  );
}
