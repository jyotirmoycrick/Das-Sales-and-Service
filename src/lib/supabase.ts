import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export async function initializeDatabase() {
  const { data: tables, error } = await supabase.from('invoices').select('id').limit(1);

  if (error) {
    console.warn('Invoices table not found, attempting to create…');

    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS invoices (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_number text UNIQUE NOT NULL,
        invoice_type text NOT NULL CHECK (invoice_type IN ('GST', 'Non-GST')),
        invoice_date date NOT NULL DEFAULT CURRENT_DATE,
        place_of_supply text NOT NULL,
        customer_name text NOT NULL,
        customer_contact text NOT NULL,
        customer_address text NOT NULL,
        customer_gstin text,
        subtotal decimal(12, 2) NOT NULL DEFAULT 0,
        total_gst decimal(12, 2) NOT NULL DEFAULT 0,
        grand_total decimal(12, 2) NOT NULL DEFAULT 0,
        amount_in_words text NOT NULL,
        pdf_url text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS invoice_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        item_name text NOT NULL,
        description text NOT NULL DEFAULT '',
        unit text NOT NULL DEFAULT 'PCS',
        quantity decimal(10, 2) NOT NULL DEFAULT 1,
        sale_price decimal(12, 2) NOT NULL,
        mrp decimal(12, 2) NOT NULL DEFAULT 0,
        hsn_sac_code text NOT NULL DEFAULT '',
        gst_percentage decimal(5, 2) NOT NULL DEFAULT 0,
        serial_number text,
        imei1 text,
        imei2 text,
        base_price decimal(12, 2) NOT NULL,
        cgst_amount decimal(12, 2) NOT NULL DEFAULT 0,
        sgst_amount decimal(12, 2) NOT NULL DEFAULT 0,
        total_amount decimal(12, 2) NOT NULL,
        created_at timestamptz DEFAULT now()
      );
    `;

    // Use SQL API via REST (requires service role key, not anon)
    const sqlRes = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_SERVICE_KEY, // needs service key
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql: createTablesSQL }),
    });

    if (sqlRes.ok) {
      console.log('✅ Tables created successfully');
    } else {
      console.error('❌ Failed to create tables:', await sqlRes.text());
    }
  }
}

