import { redirect } from 'next/navigation';
import { createClient } from '../lib/supabase/server';
import PresentationsHeader from '../components/PresentationsHeader';
import PresentationsList from '../components/PresentationsList';

export const metadata = { title: 'Mes présentations — CatPilot' };

export default async function PresentationsPage() {
  const supabase = await createClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect('/login');
  }

  return (
    <div className="account">
      <PresentationsHeader />
      <PresentationsList />
    </div>
  );
}
