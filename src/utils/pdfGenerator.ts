import { LineItem } from './gstCalculations';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: 'GST' | 'Non-GST';
  invoice_date: string;
  place_of_supply: string;
  customer_name: string;
  customer_contact: string;
  customer_address: string;
  customer_gstin: string | null;
  subtotal: number;
  total_gst: number;
  grand_total: number;
  amount_in_words: string;
}

export async function generatePDF(invoice: Invoice, items: LineItem[]): Promise<void> {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.invoice_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          font-size: 11px;
          line-height: 1.4;
        }
        .invoice-container {
          max-width: 210mm;
          margin: 0 auto;
          border: 1px solid #000;
        }
        .header {
          padding: 15px;
          border-bottom: 1px solid #000;
        }
        .company-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 3px;
        }
        .header-info {
          font-size: 10px;
          line-height: 1.5;
        }
        .gstin {
          font-size: 11px;
          margin-top: 5px;
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          padding: 10px 15px;
          background: #f5f5f5;
          border-bottom: 1px solid #000;
        }
        .invoice-title {
          text-align: right;
        }
        .invoice-title h2 {
          font-size: 18px;
          margin: 0;
          color: #666;
        }
        .invoice-title .date {
          font-size: 10px;
          color: #666;
        }
        .bill-to-section {
          padding: 10px 15px;
          background: #4a90e2;
          color: white;
          font-weight: bold;
          border-bottom: 1px solid #000;
        }
        .customer-info {
          padding: 10px 15px;
          border-bottom: 1px solid #000;
        }
        .customer-row {
          display: flex;
          gap: 20px;
          font-size: 10px;
          margin: 3px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        .items-table {
          border-bottom: 1px solid #000;
        }
        .items-table th {
          background: #4a90e2;
          color: white;
          padding: 8px 5px;
          text-align: left;
          font-size: 10px;
          border-right: 1px solid #fff;
        }
        .items-table th:last-child {
          border-right: none;
        }
        .items-table td {
          padding: 8px 5px;
          font-size: 10px;
          border-bottom: 1px solid #ddd;
          vertical-align: top;
        }
        .item-details {
          font-size: 9px;
          color: #666;
          margin-top: 2px;
          line-height: 1.4;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .gst-breakdown {
          background: #f9f9f9;
          padding: 8px 15px;
          border-bottom: 1px solid #000;
        }
        .gst-breakdown table {
          width: 100%;
          font-size: 10px;
        }
        .gst-breakdown th {
          background: #4a90e2;
          color: white;
          padding: 5px;
          text-align: left;
        }
        .gst-breakdown td {
          padding: 5px;
          text-align: right;
        }
        .amount-words {
          padding: 8px 15px;
          background: #f9f9f9;
          font-size: 10px;
          border-bottom: 1px solid #000;
        }
        .totals-section {
          background: #f9f9f9;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 15px;
          font-size: 11px;
        }
        .total-amount-row {
          background: #4a90e2;
          color: white;
          font-weight: bold;
          font-size: 13px;
        }
        .terms {
          padding: 15px;
          font-size: 9px;
          line-height: 1.6;
          border-bottom: 1px solid #000;
        }
        .terms-title {
          font-weight: bold;
          margin-bottom: 8px;
          font-size: 10px;
        }
        .terms p {
          margin: 5px 0;
        }
        .bank-details {
          padding: 10px 15px;
          font-size: 9px;
          line-height: 1.6;
          border-bottom: 1px solid #000;
        }
        .signature-section {
          padding: 30px 15px 15px;
          text-align: right;
          font-size: 10px;
        }
        .footer {
          padding: 8px 15px;
          text-align: center;
          font-size: 9px;
          color: #666;
          display: flex;
          justify-content: space-between;
        }
        @media print {
          body { padding: 0; }
          .invoice-container { border: none; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <div class="company-name">Das Sales And Service</div>
          <div class="header-info">
            Garulia Haralal Road Bye Lane,<br>
            743133, North24Parganas, WestBengal<br>
            Contact: +91 8583952858<br>
            Email: dassalesandservice@gmail.com
          </div>
          <div class="gstin">GSTIN : 19CCUPD0463N1Z1</div>
        </div>

        <div class="invoice-header">
          <div></div>
          <div class="invoice-title">
            <div style="color: #666; font-size: 10px;">(Original Copy)</div>
            <h2>INVOICE ${invoice.invoice_number}</h2>
            <div class="date">Date ${formatDate(invoice.invoice_date)}</div>
          </div>
        </div>

        <div class="bill-to-section">
          Bill To :
        </div>

        <div class="customer-info">
          <div style="font-weight: bold; margin-bottom: 5px;">${invoice.customer_name.toUpperCase()}</div>
          <div style="font-size: 10px;">${invoice.customer_address}</div>
          <div class="customer-row" style="margin-top: 8px;">
            <span>Contact: ${invoice.customer_contact}</span>
            <span>PoS: ${invoice.place_of_supply}</span>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 5%">S.No.</th>
              <th style="width: 35%">PARTICULARS</th>
              <th style="width: 10%">HSN/SAC</th>
              <th style="width: 5%">QTY</th>
              <th style="width: 10%">MRP</th>
              <th class="text-right" style="width: 12%">UNIT PRICE</th>
              <th class="text-center" style="width: 8%">GST</th>
              <th class="text-right" style="width: 15%">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, index) => {
              const details = [];
              if (item.description) {
                const descLines = item.description.split('\n').filter((line: string) => line.trim());
                descLines.forEach((line: string) => {
                  const parts = line.split(':');
                  if (parts.length === 2) {
                    details.push(`<div>${parts[0].trim()} :${parts[1].trim()}</div>`);
                  } else {
                    details.push(`<div>${line}</div>`);
                  }
                });
              }
              if (item.imei1) details.push(`<div>IMEI : ${item.imei1}</div>`);
              if (item.imei2) details.push(`<div>IMEI : ${item.imei2}</div>`);
              if (item.serial_number) details.push(`<div>S/N: ${item.serial_number}</div>`);

              return `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>
                  <strong>${item.item_name}</strong>
                  <div class="item-details">${details.join('')}</div>
                </td>
                <td>${item.hsn_sac_code || '-'}</td>
                <td class="text-center">${item.quantity} ${item.unit}</td>
                <td class="text-right">${item.mrp > 0 ? '₹ ' + item.mrp.toFixed(2) : '-'}</td>
                <td class="text-right">₹ ${item.sale_price.toFixed(2)}</td>
                <td class="text-center">${item.gst_percentage}%</td>
                <td class="text-right"><strong>₹ ${item.total_amount.toFixed(2)}</strong></td>
              </tr>
            `;}).join('')}
            <tr>
              <td colspan="3" style="font-weight: bold; padding: 10px 5px;">Total Qty : ${items.reduce((sum, item) => sum + item.quantity, 0)}</td>
              <td colspan="5" style="text-align: right; font-weight: bold; padding: 10px 5px; background: #4a90e2; color: white;">TOTAL ₹ ${invoice.grand_total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        ${invoice.invoice_type === 'GST' ? `
        <div class="gst-breakdown">
          <table>
            <thead>
              <tr>
                <th>HSN/SAC</th>
                <th>GST%</th>
                <th>Amount</th>
                <th>CGST</th>
                <th>SGST</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td style="text-align: left;">${item.hsn_sac_code || '-'}</td>
                  <td>${item.gst_percentage}</td>
                  <td>${item.base_price.toFixed(2)}</td>
                  <td>${item.cgst_amount.toFixed(2)}</td>
                  <td>${item.sgst_amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="amount-words">
          Amount (in words) : ${invoice.amount_in_words}
        </div>

        <div class="totals-section">
          <div class="total-row">
            <span>Sub Total</span>
            <span>₹ ${invoice.subtotal.toFixed(2)}</span>
          </div>
          ${invoice.invoice_type === 'GST' ? `
          <div class="total-row">
            <span>Tax Amount (+)</span>
            <span>₹ ${invoice.total_gst.toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="total-row total-amount-row">
            <span>TOTAL AMOUNT</span>
            <span>₹ ${invoice.grand_total.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Amount Paid</span>
            <span>₹ ${invoice.grand_total.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Balance</span>
            <span>₹ 0.00</span>
          </div>
        </div>

        <div class="terms">
          <div class="terms-title">Terms / Declaration</div>
          <p>E.& O.E.</p>
          <p>1. Warranty of all items are covered by their authorised service center.
          We Don't have any legal or financial liability for the same.</p>
          <p>2. Warranty will be void on physically damaged, broken, electrical
          burn, Mishandled, faulty Installation,</p>
          <p>3. Any mistake(s) found in the invoice related to rate, quantity etc, Should be informed
          immediately. No claim Shall be entertained thereafter.</p>
          <p>4. Replacement of the product sold under warranty will be done only after getting the
          replacement form our principals.</p>
          <p>5. Please pay by A/C payee Cheque only.</p>
        </div>

        <div class="bank-details">
          <strong>Bank Details -</strong><br>
          Bank Name : State Bank of India, Branch Garulia1720<br>
          Account No. : CC A/C NO- 41007399910<br>
          Branch & IFSC : SBIN0001720
        </div>

        <div class="signature-section">
          <p><strong>For, DAS SALES AND SERVICE</strong></p>
        </div>

        <div class="footer">
          <span>Happy To Help You</span>
          <span>Powered By Hitech BillSoft</span>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 250);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
