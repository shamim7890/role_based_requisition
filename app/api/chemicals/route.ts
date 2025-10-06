// @/app/api/chemicals/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('chemical_items')
            .select('*')
            .gte('expiry_date', today)
            .gt('quantity', 0);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}