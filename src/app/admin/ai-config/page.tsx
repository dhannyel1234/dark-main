import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AIConfigController from '@/functions/database/controllers/AIConfigController';
import AIConfigPage from './AIConfigPage';

export default async function Page() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('admin_level')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.admin_level !== 'admin' && profile.admin_level !== 'owner')) {
    redirect('/dashboard');
  }

  const configs = await AIConfigController.getAll();

  return <AIConfigPage initialConfigs={configs} />;
}