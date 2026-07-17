import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../lib/supabase/server';
import { getOrCreateProfile, isProActive } from '../lib/profile';
import { CheckoutButton, ManageBillingButton } from '../components/BillingButtons';

export const metadata = { title: 'Mon compte — CatPilot' };

export default async function AccountPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="account">
        <div className="alert alert-warn">
          Espace compte indisponible : l’authentification n’est pas configurée sur cet environnement.
        </div>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const profile = await getOrCreateProfile(supabase, user);
  const pro = isProActive(profile);
  const periodEnd = profile?.current_period_end
    ? new Date(profile.current_period_end).toLocaleDateString('fr-FR')
    : null;

  return (
    <div className="account">
      <div className="account-head">
        <h1>Mon compte</h1>
        <span className={`plan-badge ${pro ? 'is-pro' : 'is-free'}`}>{pro ? 'Pro' : 'Gratuit'}</span>
      </div>

      <div className="account-card">
        <dl className="account-dl">
          <div>
            <dt>E-mail</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Formule</dt>
            <dd>{pro ? 'Pro' : 'Gratuit (démo)'}</dd>
          </div>
          <div>
            <dt>Statut abonnement</dt>
            <dd>{profile?.subscription_status ?? '—'}</dd>
          </div>
          {periodEnd && (
            <div>
              <dt>Période en cours jusqu’au</dt>
              <dd>{periodEnd}</dd>
            </div>
          )}
        </dl>
      </div>

      {pro ? (
        <div className="account-card">
          <h2>Gérer mon abonnement</h2>
          <p className="muted">
            Modifiez votre moyen de paiement, téléchargez vos factures ou résiliez depuis le portail sécurisé Stripe.
          </p>
          <div className="account-actions">
            <ManageBillingButton>Gérer mon abonnement</ManageBillingButton>
            <Link href="/app" className="btn btn-primary">Ouvrir l’application</Link>
          </div>
        </div>
      ) : (
        <div className="account-card">
          <h2>Passer en Pro</h2>
          <p className="muted">
            Débloquez les 4 variantes stratégiques, la trame de présentation acheteur et le copilote IA connecté.
            Tarifs HT — facturation B2B conforme (TVA intracommunautaire).
          </p>
          <div className="account-plans">
            <div className="account-plan">
              <h3>Pro Mensuel</h3>
              <p className="price">1 200 € <span>HT / mois</span></p>
              <CheckoutButton plan="monthly">Choisir le mensuel</CheckoutButton>
            </div>
            <div className="account-plan">
              <h3>Pro Annuel</h3>
              <p className="price">12 000 € <span>HT / an</span></p>
              <CheckoutButton plan="yearly" className="btn btn-ghost btn-block">Choisir l’annuel</CheckoutButton>
            </div>
          </div>
          <p className="account-quote">
            Gros compte / paiement par virement ?{' '}
            <a href="mailto:contact@catpilot.app?subject=Devis%20CatPilot">Demander un devis</a>.
          </p>
        </div>
      )}
    </div>
  );
}
