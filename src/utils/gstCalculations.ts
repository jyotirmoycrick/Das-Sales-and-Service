export interface LineItem {
  id: string;
  item_name: string;
  description: string;
  unit: string;
  quantity: number;
  sale_price: number;
  mrp: number;
  hsn_sac_code: string;
  gst_percentage: number;
  serial_number: string;
  imei1: string;
  imei2: string;
  base_price: number;
  cgst_amount: number;
  sgst_amount: number;
  total_amount: number;
}

export function calculateGSTFromInclusive(
  salePrice: number,
  quantity: number,
  gstPercentage: number
) {
  const totalSalePrice = salePrice * quantity;
  const gstMultiplier = 1 + gstPercentage / 100;
  const basePrice = totalSalePrice / gstMultiplier;
  const gstAmount = totalSalePrice - basePrice;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;

  return {
    base_price: Math.round(basePrice * 100) / 100,
    cgst_amount: Math.round(cgst * 100) / 100,
    sgst_amount: Math.round(sgst * 100) / 100,
    total_amount: Math.round(totalSalePrice * 100) / 100,
  };
}

export function calculateInvoiceTotals(items: LineItem[]) {
  let subtotal = 0;
  let totalGST = 0;
  let grandTotal = 0;

  items.forEach((item) => {
    subtotal += item.base_price;
    totalGST += item.cgst_amount + item.sgst_amount;
    grandTotal += item.total_amount;
  });

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    total_gst: Math.round(totalGST * 100) / 100,
    grand_total: Math.round(grandTotal * 100) / 100,
  };
}
