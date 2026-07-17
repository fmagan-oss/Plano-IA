import type { Planogram } from '../lib/types';

export default function PlanogramView({ plano }: { plano: Planogram }) {
  return (
    <div className="plano">
      <div className="plano-head">
        <h3>Planogramme au facing</h3>
        <span className="muted">
          {plano.totalFacings} facings · {plano.shelves.length} niveaux
        </span>
      </div>
      <div className="plano-fixture">
        {plano.shelves.map((shelf) => (
          <div className="plano-shelf" key={shelf.level}>
            <div className="shelf-label">{shelf.label}</div>
            <div className="shelf-cells">
              {shelf.cells.length === 0 ? (
                <div className="shelf-empty">— espace libre —</div>
              ) : (
                shelf.cells.map((cell, i) => (
                  <div
                    key={i}
                    className="facing-cell"
                    style={{
                      flexGrow: cell.facings,
                      // brand color already assigned in brandBlocks; recompute via block lookup
                      background: cellColor(plano, cell.product.brand),
                    }}
                    title={`${cell.product.brand} — ${cell.product.name} (${cell.facings} facing${cell.facings > 1 ? 's' : ''})`}
                  >
                    <span className="facing-name">{cell.product.name}</span>
                    <span className="facing-meta">
                      {cell.product.isNew && <span className="new-dot">NEW</span>}
                      ×{cell.facings}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="plano-legend">
        {plano.brandBlocks.map((b) => (
          <span className="legend-item" key={b.brand}>
            <span className="legend-swatch" style={{ background: b.color }} />
            {b.brand}
          </span>
        ))}
      </div>
    </div>
  );
}

function cellColor(plano: Planogram, brand: string): string {
  const block = plano.brandBlocks.find((b) => b.brand === brand);
  return block ? block.color : '#94a3b8';
}
