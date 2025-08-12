const productKPIs: ProductKPI[] = useMemo(() => {
  const computeFor = (
    predicate: (name: string) => boolean,
    displayName: string
  ): ProductKPI | null => {
    const rows = state.datasets
      .filter(d => state.activeDatasetIds.includes(d.id) && predicate(d.name))
      .flatMap(d => d.data);
    if (!rows.length) return null;

    const cols = Object.keys(rows[0]);
    const prodCol = cols.find(c=>c.toLowerCase().includes('production'));
    const salesCol= cols.find(c=>c.toLowerCase().includes('sales'));
    if (!prodCol || !salesCol) return null;

    let sumProd=0, sumSales=0;
    rows.forEach(r => {
      sumProd  += parseFloat(String(r[prodCol ]).replace(/[, ]/g, ''))||0;
      sumSales += parseFloat(String(r[salesCol]).replace(/[, ]/g, ''))||0;
    });
    const avgProd = sumProd/rows.length;
    const avgSales= sumSales/rows.length;
    const recoveryPct = avgProd>0 ? (avgSales/avgProd)*100 : 0;

    return {
      name: displayName,
      avgProduction: Math.round(avgProd*100)/100,
      avgSales:      Math.round(avgSales*100)/100,
      recoveryRate:  Math.round(recoveryPct*100)/100
    };
  };

  return [
    computeFor(name => name.toLowerCase().includes('rcf'), 'RCF'),
    computeFor(name => name.toLowerCase().includes('boomi'), 'Boomi Samrudhi')
  ].filter(Boolean) as ProductKPI[];
}, [state.datasets, state.activeDatasetIds]);
