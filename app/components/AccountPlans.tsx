'use client';

import { useState } from 'react';
import { CheckoutButton } from './BillingButtons';

/** Per-seat plan picker on the account page (149 €/siège/mois, 1 490 €/siège/an). */
export default function AccountPlans() {
  const [seats, setSeats] = useState(1);

  return (
    <>
      <div className="seats-picker">
        <label htmlFor="seats">Nombre de sièges nominatifs</label>
        <input
          id="seats"
          type="number"
          min={1}
          max={100}
          value={seats}
          onChange={(e) => setSeats(Math.min(100, Math.max(1, Math.floor(Number(e.target.value) || 1))))}
        />
        <span className="muted">1 siège = 1 personne (e-mail personnel)</span>
      </div>

      <div className="account-plans">
        <div className="account-plan">
          <h3>Pro Mensuel</h3>
          <p className="price">{(149 * seats).toLocaleString('fr-FR')} € <span>HT / mois · {seats} siège{seats > 1 ? 's' : ''}</span></p>
          <p className="muted plan-unit">149 € HT / siège / mois</p>
          <CheckoutButton plan="monthly" seats={seats}>Choisir le mensuel</CheckoutButton>
        </div>
        <div className="account-plan">
          <h3>Pro Annuel</h3>
          <p className="price">{(1490 * seats).toLocaleString('fr-FR')} € <span>HT / an · {seats} siège{seats > 1 ? 's' : ''}</span></p>
          <p className="muted plan-unit">1 490 € HT / siège / an (2 mois offerts)</p>
          <CheckoutButton plan="yearly" seats={seats} className="btn btn-ghost btn-block">Choisir l’annuel</CheckoutButton>
        </div>
      </div>
    </>
  );
}
