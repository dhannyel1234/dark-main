import { createClient } from '@/utils/supabase/server';

interface InvoiceData {
    id: string;
    machine_name: string;
    expiration_date: string;
    owner_id: string;
}

// Create or Update (Upsert)
const create = async (data: InvoiceData) => {
    const supabase = await createClient();
    const { data: savedInvoice, error } = await supabase
        .from('invoices')
        .upsert(data)
        .select()
        .single();
    
    if (error) throw error;
    return savedInvoice;
};

// Delete
const remove = async (machine_name: string) => {
    const supabase = await createClient();
    const { data: deletedInvoice, error } = await supabase
        .from('invoices')
        .delete()
        .eq('machine_name', machine_name)
        .select();

    if (error) throw error;
    return deletedInvoice;
};

// Update
const update = async (id: string, updates: Partial<InvoiceData>) => {
    const supabase = await createClient();
    const { data: updatedInvoice, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return updatedInvoice;
};

// Read [Find by Machine Name]
const find = async (machine_name: string) => {
    const supabase = await createClient();
    const { data: invoice, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('machine_name', machine_name)
        .maybeSingle();

    if (error) throw error;
    return invoice;
};

// Read [Find All by User]
const findAllUser = async (owner_id: string) => {
    const supabase = await createClient();
    const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('owner_id', owner_id);

    if (error) throw error;
    return invoices;
};

// Read [Find All]
const findAll = async () => {
    const supabase = await createClient();
    const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*');

    if (error) throw error;
    return invoices;
};

const controller = {
    create,
    remove,
    update,
    find,
    findAllUser,
    findAll
};

export default controller;