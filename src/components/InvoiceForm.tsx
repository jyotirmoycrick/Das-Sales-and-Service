import { useState, useEffect } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { numberToWordsIndian } from '../utils/numberToWords';
import { calculateGSTFromInclusive, calculateInvoiceTotals, type LineItem } from '../utils/gstCalculations';
import { generatePDF } from '../utils/pdfGenerator';

const GST_RATES = [0, 5, 12, 18, 28];
const UNITS = ['PCS', 'PAC', 'BOX', 'KG', 'LTR', 'MTR'];

export function InvoiceForm() {
  const [invoiceType, setInvoiceType] = useState<'GST' | 'Non-GST'>('GST');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [placeOfSupply, setPlaceOfSupply] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerGSTIN, setCustomerGSTIN] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    generateInvoiceNumber();
    addNewItem();
  }, []);

  const generateInvoiceNumber = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('invoice_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error:', error);
      }

      if (data?.invoice_number) {
        const match = data.invoice_number.match(/GST-(\d+)/);
        if (match) {
          const lastNumber = parseInt(match[1]);
          setInvoiceNumber(`GST-${lastNumber + 1}`);
        } else {
          setInvoiceNumber('GST-1');
        }
      } else {
        setInvoiceNumber('GST-1');
      }
    } catch (error) {
      console.error('Error generating invoice number:', error);
      setInvoiceNumber('GST-1');
    }
  };

  const addNewItem = () => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      item_name: '',
      description: '',
      unit: 'PCS',
      quantity: 1,
      sale_price: 0,
      mrp: 0,
      hsn_sac_code: '',
      gst_percentage: 18,
      serial_number: '',
      imei1: '',
      imei2: '',
      base_price: 0,
      cgst_amount: 0,
      sgst_amount: 0,
      total_amount: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };

          if (field === 'sale_price' || field === 'quantity' || field === 'gst_percentage') {
            const calculations = calculateGSTFromInclusive(
              updatedItem.sale_price,
              updatedItem.quantity,
              invoiceType === 'GST' ? updatedItem.gst_percentage : 0
            );
            return { ...updatedItem, ...calculations };
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  const totals = calculateInvoiceTotals(items);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const invoiceData = {
        invoice_number: invoiceNumber,
        invoice_type: invoiceType,
        invoice_date: invoiceDate,
        place_of_supply: placeOfSupply,
        customer_name: customerName,
        customer_contact: customerContact,
        customer_address: customerAddress,
        customer_gstin: invoiceType === 'GST' ? (customerGSTIN || null) : null,
        subtotal: totals.subtotal,
        total_gst: totals.total_gst,
        grand_total: totals.grand_total,
        amount_in_words: numberToWordsIndian(totals.grand_total),
      };

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single();

      if (invoiceError) {
        console.error('Invoice error:', invoiceError);
        throw new Error(invoiceError.message || 'Failed to create invoice');
      }

      if (!invoice) {
        throw new Error('No invoice data returned');
      }

      const itemsData = items.map((item) => ({
        invoice_id: invoice.id,
        item_name: item.item_name,
        description: item.description || '',
        unit: item.unit,
        quantity: item.quantity,
        sale_price: item.sale_price,
        mrp: item.mrp || 0,
        hsn_sac_code: item.hsn_sac_code || '',
        gst_percentage: invoiceType === 'GST' ? item.gst_percentage : 0,
        serial_number: item.serial_number || null,
        imei1: item.imei1 || null,
        imei2: item.imei2 || null,
        base_price: item.base_price,
        cgst_amount: item.cgst_amount,
        sgst_amount: item.sgst_amount,
        total_amount: item.total_amount,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsData);

      if (itemsError) {
        console.error('Items error:', itemsError);
        await supabase.from('invoices').delete().eq('id', invoice.id);
        throw new Error(itemsError.message || 'Failed to add invoice items');
      }

      await generatePDF(invoice, items);

      alert('Invoice created successfully!');
      window.location.reload();
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      setError(error.message || 'Error creating invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Invoice Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Invoice Type
            </label>
            <select
              value={invoiceType}
              onChange={(e) => setInvoiceType(e.target.value as 'GST' | 'Non-GST')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
              required
            >
              <option value="GST">GST</option>
              <option value="Non-GST">Non-GST</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Invoice Number
            </label>
            <input
              type="text"
              value={invoiceNumber}
              readOnly
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Place of Supply
            </label>
            <input
              type="text"
              value={placeOfSupply}
              onChange={(e) => setPlaceOfSupply(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
              placeholder="e.g., 19-West Bengal"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
              placeholder="Enter customer name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Contact Number
            </label>
            <input
              type="tel"
              value={customerContact}
              onChange={(e) => setCustomerContact(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
              placeholder="Enter contact number"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Customer Address
            </label>
            <input
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
              placeholder="Enter customer address"
              required
            />
          </div>

          {invoiceType === 'GST' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Customer GSTIN
              </label>
              <input
                type="text"
                value={customerGSTIN}
                onChange={(e) => setCustomerGSTIN(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                placeholder="Enter GSTIN (optional)"
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Product Details</h2>
          <button
            type="button"
            onClick={addNewItem}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium text-slate-900">Item #{index + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  disabled={items.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={item.item_name}
                    onChange={(e) => updateItem(item.id, 'item_name', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    HSN/SAC Code
                  </label>
                  <input
                    type="text"
                    value={item.hsn_sac_code}
                    onChange={(e) => updateItem(item.id, 'hsn_sac_code', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none text-sm"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Description
                  </label>
                  <textarea
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none text-sm"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Unit
                  </label>
                  <select
                    value={item.unit}
                    onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none text-sm"
                  >
                    {UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none text-sm"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Unit Price (incl. GST) *
                  </label>
                  <input
                    type="number"
                    value={item.sale_price}
                    onChange={(e) => updateItem(item.id, 'sale_price', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none text-sm"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    MRP
                  </label>
                  <input
                    type="number"
                    value={item.mrp}
                    onChange={(e) => updateItem(item.id, 'mrp', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>

                {invoiceType === 'GST' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      GST %
                    </label>
                    <select
                      value={item.gst_percentage}
                      onChange={(e) => updateItem(item.id, 'gst_percentage', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none text-sm"
                    >
                      {GST_RATES.map((rate) => (
                        <option key={rate} value={rate}>
                          {rate}%
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={item.serial_number}
                    onChange={(e) => updateItem(item.id, 'serial_number', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    IMEI 1
                  </label>
                  <input
                    type="text"
                    value={item.imei1}
                    onChange={(e) => updateItem(item.id, 'imei1', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none text-sm"
                    placeholder="Enter IMEI 1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    IMEI 2
                  </label>
                  <input
                    type="text"
                    value={item.imei2}
                    onChange={(e) => updateItem(item.id, 'imei2', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none text-sm"
                    placeholder="Enter IMEI 2"
                  />
                </div>
              </div>

              {invoiceType === 'GST' && (
                <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-slate-600">Base: </span>
                    <span className="font-medium">₹{item.base_price.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">CGST: </span>
                    <span className="font-medium">₹{item.cgst_amount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">SGST: </span>
                    <span className="font-medium">₹{item.sgst_amount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Total: </span>
                    <span className="font-bold text-slate-900">₹{item.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Totals</h2>

        <div className="space-y-2 max-w-md ml-auto">
          <div className="flex justify-between text-slate-700">
            <span>Subtotal (Base):</span>
            <span className="font-medium">₹{totals.subtotal.toFixed(2)}</span>
          </div>
          {invoiceType === 'GST' && (
            <div className="flex justify-between text-slate-700">
              <span>Total GST (CGST + SGST):</span>
              <span className="font-medium">₹{totals.total_gst.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
            <span>Grand Total:</span>
            <span>₹{totals.grand_total.toFixed(2)}</span>
          </div>
          <div className="text-sm text-slate-600 pt-2">
            {numberToWordsIndian(totals.grand_total)}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Generating Invoice...' : 'Generate Invoice'}
        </button>
      </div>
    </form>
  );
}
