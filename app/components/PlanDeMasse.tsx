import type { Planogram } from '../lib/types';

const pct = (x: number) => `${Math.round(x * 100)}%`;

export default function PlanDeMasse({ plano }: { plano: Planogram }) {
  return (
    <div className="masse">
      <div className="masse-head">
        <h3>Plan de masse</h3>
        <span className="muted">Répartition du linéaire par marque</span>
      </div>

      <div className="masse-bar" role="img" aria-label="Répartition du linéaire par marque">
        {plano.brandBlocks.map((b) => (
          <span
            key={b.brand}
            className="masse-seg"
            style={{ width: pct(b.share), background: b.color }}
            title={`${b.brand} — ${pct(b.share)} du linéaire`}
          >
            {b.share > 0.08 && <span>{b.brand}</span>}
          </span>
        ))}
      </div>

      <table className="masse-table">
        <thead>
          <tr>
            <th>Marque</th>
            <th>Réf.</th>
            <th>Facings</th>
            <th>% linéaire</th>
            <th>% CA</th>
            <th>Écart</th>
          </tr>
        </thead>
        <tbody>
          {plano.brandBlocks.map((b) => {
            const gap = b.share - b.revenueShare;
            return (
              <tr key={b.brand}>
                <td>
                  <span className="legend-swatch sm" style={{ background: b.color }} /> {b.brand}
                  {b.novelties > 0 && <span className="new-dot inline">NEW ×{b.novelties}</span>}
                </td>
                <td>{b.products}</td>
                <td>{b.facings}</td>
                <td>{pct(b.share)}</td>
                <td>{pct(b.revenueShare)}</td>
                <td className={gap > 0.03 ? 'gap-over' : gap < -0.03 ? 'gap-under' : 'gap-ok'}>
                  {gap > 0 ? '+' : ''}
                  {Math.round(gap * 100)} pts
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="masse-help">
        « Écart » = part de linéaire − part de CA. Un écart positif signale une marque sur-facée vs son poids
        commercial ; négatif, une opportunité de gagner du linéaire.
      </p>
    </div>
  );
}
