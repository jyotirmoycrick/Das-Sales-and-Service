import { useState, useEffect } from 'react';
import { Search, Download, Trash2, FileText, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generatePDF } from '../utils/pdfGenerator';
import type { Database } from '../lib/database.types';

type Invoice = Database['public']['Tables']['invoices']['Row'];
type InvoiceItem = Database['public']['Tables']['invoice_items']['Row'];

export function BillingHistory() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'GST' | 'Non-GST'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [stats, setStats] = useState({
    today: 0,
    thisMonth: 0,
    thisYear: 0,
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInvoices(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (invoicesList: Invoice[]) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisYear = now.getFullYear().toString();

    const todayTotal = invoicesList
      .filter((inv) => inv.invoice_date === today)
      .reduce((sum, inv) => sum + inv.grand_total, 0);

    const monthTotal = invoicesList
      .filter((inv) => inv.invoice_date.startsWith(thisMonth))
      .reduce((sum, inv) => sum + inv.grand_total, 0);

    const yearTotal = invoicesList
      .filter((inv) => inv.invoice_date.startsWith(thisYear))
      .reduce((sum, inv) => sum + inv.grand_total, 0);

    setStats({
      today: todayTotal,
      thisMonth: monthTotal,
      thisYear: yearTotal,
    });
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || invoice.invoice_type === filterType;

    const matchesDateFrom = !dateFrom || invoice.invoice_date >= dateFrom;
    const matchesDateTo = !dateTo || invoice.invoice_date <= dateTo;

    return matchesSearch && matchesType && matchesDateFrom && matchesDateTo;
  });

  const handleViewPDF = async (invoice: Invoice) => {
    try {
      const { data: items, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id);

      if (error) throw error;

      await generatePDF(invoice, items || []);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF');
    }
  };

  const handleDelete = async (id: string, invoiceNumber: string) => {
    if (!confirm(`Are you sure you want to delete invoice ${invoiceNumber}?`)) {
      return;
    }

    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id);

      if (error) throw error;

      setInvoices(invoices.filter((inv) => inv.id !== id));
      alert('Invoice deleted successfully');
      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Error deleting invoice');
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Invoice No',
      'Date',
      'Type',
      'Customer Name',
      'Contact',
      'Subtotal',
      'GST',
      'Grand Total',
    ];

    const rows = filteredInvoices.map((inv) => [
      inv.invoice_number,
      new Date(inv.invoice_date).toLocaleDateString('en-IN'),
      inv.invoice_type,
      inv.customer_name,
      inv.customer_contact,
      inv.subtotal.toFixed(2),
      inv.total_gst.toFixed(2),
      inv.grand_total.toFixed(2),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading invoices...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Today's Sales</p>
              <p className="text-2xl font-bold text-slate-900">₹{stats.today.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">This Month</p>
              <p className="text-2xl font-bold text-slate-900">₹{stats.thisMonth.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">This Year</p>
              <p className="text-2xl font-bold text-slate-900">₹{stats.thisYear.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by invoice number or customer name..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'GST' | 'Non-GST')}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
          >
            <option value="all">All Types</option>
            <option value="GST">GST</option>
            <option value="Non-GST">Non-GST</option>
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="From"
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="To"
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
          />

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Invoice No</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Date</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Type</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Contact</th>
                <th className="px-4 py-3 text-right font-medium text-slate-700">Amount</th>
                <th className="px-4 py-3 text-center font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No invoices found
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(invoice.invoice_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          invoice.invoice_type === 'GST'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {invoice.invoice_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-900">{invoice.customer_name}</td>
                    <td className="px-4 py-3 text-slate-600">{invoice.customer_contact}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      ₹{invoice.grand_total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewPDF(invoice)}
                          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          title="View/Download PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(invoice.id, invoice.invoice_number)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length > 0 && (
          <div className="mt-4 text-sm text-slate-600">
            Showing {filteredInvoices.length} of {invoices.length} invoices
          </div>
        )}
      </div>
    </div>
  );
}
