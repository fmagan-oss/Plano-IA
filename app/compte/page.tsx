import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../lib/supabase/server';
import { getOrCreateProfile, isProActive, isProEntitled } from '../lib/profile';
import { ManageBillingButton } from '../components/BillingButtons';
import AccountPlans from '../components/AccountPlans';
import TeamManager from '../components/TeamManager';

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
  const owner = isProActive(profile);
  const pro = owner || (await isProEntitled(supabase, profile));
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
            <dd>{owner ? `Pro — ${profile?.seats ?? 1} siège(s)` : pro ? 'Pro (siège d’équipe)' : 'Gratuit (démo)'}</dd>
          </div>
          <div>
            <dt>Statut abonnement</dt>
            <dd>{owner ? profile?.subscription_status ?? '—' : pro ? 'couvert par le titulaire' : '—'}</dd>
          </div>
          {periodEnd && owner && (
            <div>
              <dt>Période en cours jusqu’au</dt>
              <dd>{periodEnd}</dd>
            </div>
          )}
        </dl>
      </div>

      {owner ? (
        <>
          <div className="account-card">
            <h2>Gérer mon abonnement</h2>
            <p className="muted">
              Modifiez le nombre de sièges, votre moyen de paiement, téléchargez vos factures ou résiliez depuis le
              portail sécurisé Stripe.
            </p>
            <div className="account-actions">
              <ManageBillingButton>Gérer mon abonnement</ManageBillingButton>
              <Link href="/app" className="btn btn-primary">Ouvrir l’application</Link>
            </div>
          </div>
          <TeamManager />
        </>
      ) : pro ? (
        <div className="account-card">
          <h2>Votre accès Pro</h2>
          <p className="muted">
            Vous occupez un siège nominatif sur l’abonnement de votre équipe. Toutes les fonctionnalités Pro sont
            débloquées.
          </p>
          <div className="account-actions">
            <Link href="/app" className="btn btn-primary">Ouvrir l’application</Link>
          </div>
        </div>
      ) : (
        <div className="account-card">
          <h2>Passer en Pro</h2>
          <p className="muted">
            Débloquez les 4 variantes stratégiques, la trame de présentation acheteur, le copilote IA connecté et
            l’espace « Mes présentations ». Tarification par siège nominatif — chaque membre se connecte avec sa
            propre adresse. Tarifs HT, facturation B2B conforme.
          </p>
          <AccountPlans />
          <p className="account-quote">
            Gros compte / paiement par virement ?{' '}
            <a href="mailto:contact@catpilot.app?subject=Devis%20CatPilot">Demander un devis</a>.
          </p>
        </div>
      )}
    </div>
  );
}
