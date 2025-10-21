export interface Database {
  public: {
    Tables: {
      invoices: {
        Row: {
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
          pdf_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_number: string;
          invoice_type: 'GST' | 'Non-GST';
          invoice_date?: string;
          place_of_supply: string;
          customer_name: string;
          customer_contact: string;
          customer_address: string;
          customer_gstin?: string | null;
          subtotal: number;
          total_gst: number;
          grand_total: number;
          amount_in_words: string;
          pdf_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invoice_number?: string;
          invoice_type?: 'GST' | 'Non-GST';
          invoice_date?: string;
          place_of_supply?: string;
          customer_name?: string;
          customer_contact?: string;
          customer_address?: string;
          customer_gstin?: string | null;
          subtotal?: number;
          total_gst?: number;
          grand_total?: number;
          amount_in_words?: string;
          pdf_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          item_name: string;
          description: string;
          unit: string;
          quantity: number;
          sale_price: number;
          mrp: number;
          hsn_sac_code: string;
          gst_percentage: number;
          serial_number: string | null;
          imei1: string | null;
          imei2: string | null;
          base_price: number;
          cgst_amount: number;
          sgst_amount: number;
          total_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          item_name: string;
          description?: string;
          unit?: string;
          quantity?: number;
          sale_price: number;
          mrp?: number;
          hsn_sac_code?: string;
          gst_percentage?: number;
          serial_number?: string | null;
          imei1?: string | null;
          imei2?: string | null;
          base_price: number;
          cgst_amount?: number;
          sgst_amount?: number;
          total_amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          item_name?: string;
          description?: string;
          unit?: string;
          quantity?: number;
          sale_price?: number;
          mrp?: number;
          hsn_sac_code?: string;
          gst_percentage?: number;
          serial_number?: string | null;
          imei1?: string | null;
          imei2?: string | null;
          base_price?: number;
          cgst_amount?: number;
          sgst_amount?: number;
          total_amount?: number;
          created_at?: string;
        };
      };
    };
  };
}
