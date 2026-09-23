/* TilePreview — non-interactive live render of a tile config, for the Ops tile library. */
function TilePreview({ cfg }) {
  if (!cfg || !cfg.ds) return null;
  const ds = dmDataset(cfg.ds);
  const gate = ds && ds.needsConnect;
  const q = React.useMemo(() => {
    if (gate || cfg.viz === 'text') return null;
    try { return dmRunQuery({ ...cfg, filters: cfg.filters || [] }); } catch (e) { return null; }
  }, [JSON.stringify(cfg), !!gate]);
  return (
    <div style={{ height:'100%', minHeight:0, display:'flex', flexDirection:'column', pointerEvents:'none', overflow:'hidden' }}>
      <TileViz cfg={cfg} q={q} height={0} deltaCfg={cfg} />
    </div>
  );
}

/* the shipped catalogue, flattened: one entry per tile with its template group */
const tsSlug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function tsCatalogue() {
  const out = [];
  (window.TA_TEMPLATES || []).forEach(tpl => {
    (tpl.tiles || []).forEach((t, i) => {
      out.push({ cfg: { ...t, id: 'lib-' + tpl.id + '-' + (t.title ? tsSlug(t.title) : i) },
        group: tpl.name, groupId: tpl.id, cat: t.cat || tpl.cat || tpl.name });
    });
  });
  return out;
}

Object.assign(window, { TilePreview, tsCatalogue });
window.dispatchEvent(new Event('tilestudio:ready'));
