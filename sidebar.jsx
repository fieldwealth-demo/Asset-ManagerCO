/* Field Shadcn — Sidebar (dual-state)
   A single component with two views the user toggles via the hamburger:
     • Collapsed (56 px icon rail) — parents with sub-items show a dot indicator;
       hovering reveals a flyout panel anchored to the right of the rail.
     • Expanded  (240 px)         — labels visible, parents with sub-items
       reveal as inline accordion groups with a chevron.

   The two views are not separate components — they share one item model,
   selection state, active/hover treatments, and the user's last-chosen toggle
   state. See design-system/Sidebar.html for the canonical documentation.

   Item shape:
     { id, label, icon, badge?, section?, children?:[{id,label,badge?}] }
   Sections (optional, expanded-only headers):
     [{ id:'workspace', label:'Workspace' }, { id:'more', label:'More' }]

   Selection model:
     `active` may be a parent id ('clients') or a sub-item id ('clients.households').
     A parent is treated as active when active===parent.id OR when any of its
     children's ids equal `active`. In collapsed mode, this surfaces the active
     accent on the parent icon along with the dot indicator.

   Persistence:
     persistKey           localStorage key for expanded boolean
     persistAccordionKey  localStorage key for the set of open accordion groups

   Backwards-compat:
     Items without `children` and no `sections` array still render as a plain
     flat nav — this is what the UI-kit demo uses.
*/

/* ---- tokens ------------------------------------------------------------ */
const SB_BG       = 'rgb(31,41,55)';
const SB_BORDER   = 'rgb(75,85,99)';
const SB_INK_DIM  = 'rgb(163,163,163)';
const SB_INK      = 'rgb(209,213,219)';
const SB_INK_HI   = 'rgb(249,250,251)';
const SB_ACCENT   = 'rgb(52,211,153)';
const SB_ACCENT_BG= 'rgba(5,122,85,0.22)';
const SB_HOVER_BG = 'rgba(255,255,255,0.04)';
const SB_DOT      = 'rgb(52,211,153)';
const W_COLLAPSED = 56;
const W_EXPANDED  = 240;
const FLYOUT_GRACE_MS = 150;

/* ---- small primitives -------------------------------------------------- */
function SBTooltip({ label, anchorRef, show }) {
  const [pos, setPos] = React.useState(null);
  React.useEffect(() => {
    if (show && anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect();
      setPos({ top: r.top + r.height / 2, left: r.right + 10 });
    }
  }, [show, anchorRef]);
  if (!show || !pos) return null;
  return ReactDOM.createPortal(
    <span style={{
      position:'fixed', left: pos.left, top: pos.top, transform: 'translateY(-50%)',
      background:'rgb(17,24,39)', border:`1px solid ${SB_BORDER}`, borderRadius:6,
      padding:'5px 9px', fontFamily:'Inter', fontSize:11, fontWeight:500, color:SB_INK_HI,
      whiteSpace:'nowrap', zIndex:80, pointerEvents:'none',
      boxShadow:'0 8px 20px -4px rgba(0,0,0,0.6)',
      animation: 'sbTipIn 140ms ease-out both',
    }}>
      <span style={{
        position:'absolute', left:-4, top:'50%', transform:'translateY(-50%) rotate(45deg)',
        width:7, height:7, background:'rgb(17,24,39)',
        borderLeft:`1px solid ${SB_BORDER}`, borderBottom:`1px solid ${SB_BORDER}`,
      }} />
      {label}
    </span>,
    document.body
  );
}

/* ---- main component ---------------------------------------------------- */
function Sidebar({
  items = [],
  sections = null,            // optional [{id,label}] for grouped headers in expanded
  footerItems = [],           // items pinned above the user/sign-out cluster
  active,
  onSelect,
  brand = 'FIELD',
  signOutHref,
  signOutLabel = 'Sign out',
  user,                       // { name, role, initials? }
  defaultExpanded = false,
  persistKey,
  persistAccordionKey,
  onWidthChange,
  onExpandedChange,
}) {
  const [expanded, setExpanded] = React.useState(() => {
    if (!persistKey) return defaultExpanded;
    try {
      const v = localStorage.getItem(persistKey);
      if (v === '1') return true;
      if (v === '0') return false;
      return defaultExpanded;
    } catch (e) { return defaultExpanded; }
  });
  React.useEffect(() => {
    if (persistKey) { try { localStorage.setItem(persistKey, expanded ? '1' : '0'); } catch (e) {} }
    if (onExpandedChange) onExpandedChange(expanded);
  }, [expanded, persistKey, onExpandedChange]);

  // Accordion open groups (expanded view only) ------------------------------
  const [openGroups, setOpenGroups] = React.useState(() => {
    let stored = null;
    if (persistAccordionKey) {
      try { stored = JSON.parse(localStorage.getItem(persistAccordionKey) || 'null'); } catch (e) {}
    }
    if (Array.isArray(stored)) return new Set(stored);
    // auto-open whichever parent matches the current active sub-item
    const set = new Set();
    if (active && active.includes('.')) set.add(active.split('.')[0]);
    return set;
  });
  React.useEffect(() => {
    if (!persistAccordionKey) return;
    try { localStorage.setItem(persistAccordionKey, JSON.stringify([...openGroups])); } catch (e) {}
  }, [openGroups, persistAccordionKey]);

  // Auto-open the parent of the active sub-item when active changes externally
  React.useEffect(() => {
    if (active && active.includes('.')) {
      const p = active.split('.')[0];
      setOpenGroups(prev => prev.has(p) ? prev : new Set([...prev, p]));
    }
  }, [active]);

  const W = expanded ? W_EXPANDED : W_COLLAPSED;
  React.useEffect(() => { if (onWidthChange) onWidthChange(W); }, [W, onWidthChange]);

  const toggleRef = React.useRef(null);
  const [toggleHover, setToggleHover] = React.useState(false);
  // Toggling the rail unmounts the hovered button before mouseleave can fire,
  // leaving the tooltip stuck open over the newly-rendered toggle. Reset on
  // every state change.
  React.useEffect(() => { setToggleHover(false); }, [expanded]);

  // Flyout (collapsed-only) -------------------------------------------------
  const [flyout, setFlyout] = React.useState(null); // { parent, anchorTop }
  const flyoutCloseTimer = React.useRef(null);
  const openFlyout = React.useCallback((parent, anchorEl) => {
    if (flyoutCloseTimer.current) { clearTimeout(flyoutCloseTimer.current); flyoutCloseTimer.current = null; }
    const r = anchorEl.getBoundingClientRect();
    setFlyout({ parent, anchorTop: r.top, anchorLeft: r.right + 8 });
  }, []);
  const scheduleClose = React.useCallback(() => {
    if (flyoutCloseTimer.current) clearTimeout(flyoutCloseTimer.current);
    flyoutCloseTimer.current = setTimeout(() => { setFlyout(null); flyoutCloseTimer.current = null; }, FLYOUT_GRACE_MS);
  }, []);
  const cancelClose = React.useCallback(() => {
    if (flyoutCloseTimer.current) { clearTimeout(flyoutCloseTimer.current); flyoutCloseTimer.current = null; }
  }, []);
  // Close flyout immediately whenever we expand
  React.useEffect(() => { if (expanded) setFlyout(null); }, [expanded]);

  // Selection helpers ------------------------------------------------------
  const isItemActive = (item) => {
    if (active === item.id) return true;
    if (item.children && item.children.some(c => c.id === active)) return true;
    return false;
  };
  const activeChildOf = (parent) => {
    if (!parent.children) return null;
    return parent.children.find(c => c.id === active) || null;
  };

  // Group items by section --------------------------------------------------
  const renderSection = (sec) => {
    const secItems = items.filter(it => (it.section || null) === (sec ? sec.id : null));
    if (!secItems.length) return null;
    return (
      <React.Fragment key={sec ? sec.id : '_default'}>
        {expanded && sec && (
          <div style={{
            fontFamily:'Inter', fontSize:10.5, fontWeight:600,
            letterSpacing:'0.08em', textTransform:'uppercase',
            color:'rgb(120,128,141)', padding:'14px 10px 6px',
          }}>{sec.label}</div>
        )}
        {!expanded && sec && (
          <div style={{
            height:1, background:'rgba(75,85,99,0.5)', width:24,
            alignSelf:'center', margin:'10px 0 6px',
          }} />
        )}
        {secItems.map(it => (
          <SBItem
            key={it.id}
            item={it}
            expanded={expanded}
            isActive={isItemActive(it)}
            activeChildId={active}
            isAccordionOpen={!!openGroups.has(it.id)}
            onToggleAccordion={() => setOpenGroups(prev => {
              const next = new Set(prev);
              if (next.has(it.id)) next.delete(it.id); else next.add(it.id);
              return next;
            })}
            onSelect={(id) => onSelect && onSelect(id)}
            onHoverOpen={openFlyout}
            onHoverClose={scheduleClose}
          />
        ))}
      </React.Fragment>
    );
  };

  return (
    <React.Fragment>
      <aside style={{
        position:'fixed', top:0, left:0, bottom:0, width:W,
        background:SB_BG, borderRight:`1px solid ${SB_BORDER}`,
        display:'flex', flexDirection:'column',
        alignItems: expanded ? 'stretch' : 'center',
        padding: expanded ? '14px 12px' : '14px 0',
        gap:2, zIndex:40,
        transition:'width 220ms cubic-bezier(0.22, 0.61, 0.36, 1), padding 220ms cubic-bezier(0.22, 0.61, 0.36, 1)',
        overflow:'hidden', overflowY:'auto',
      }}>
        {/* top row: hamburger (collapsed) OR brand + collapse-button (expanded) */}
        {expanded ? (
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            width:'100%', height:32, padding:'0 4px 0 8px', marginBottom:10, flexShrink:0,
          }}>
            <span style={{ fontFamily:'Inter', fontSize:12, fontWeight:600, color:SB_INK_HI, letterSpacing:0.4 }}>
              {brand}
            </span>
            <button
              ref={toggleRef}
              onClick={() => setExpanded(false)}
              onMouseEnter={() => setToggleHover(true)}
              onMouseLeave={() => setToggleHover(false)}
              title=""
              style={{
                width:26, height:26, borderRadius:6, border:'none',
                background: toggleHover ? SB_HOVER_BG : 'transparent',
                color: toggleHover ? SB_INK_HI : SB_INK_DIM, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'background-color 120ms ease, color 120ms ease',
              }}
            >
              <i className="fa-solid fa-chevron-left" style={{ fontSize:11 }} />
            </button>
          </div>
        ) : (
          <button
            ref={toggleRef}
            onClick={() => setExpanded(true)}
            onMouseEnter={() => setToggleHover(true)}
            onMouseLeave={() => setToggleHover(false)}
            title=""
            style={{
              height:32, width:32,
              borderRadius:8, border:'none', background:'transparent',
              color: toggleHover ? SB_INK_HI : SB_INK_DIM, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              padding:0, marginBottom:10, flexShrink:0,
              transition:'color 120ms ease',
            }}
          >
            <i className="fa-solid fa-bars" style={{ fontSize:14, width:16, textAlign:'center' }} />
          </button>
        )}

        {/* items */}
        <div style={{ display:'flex', flexDirection:'column', gap:4, width:'100%', alignItems: expanded ? 'stretch' : 'center' }}>
          {sections ? sections.map(renderSection) : items.map(it => (
            <SBItem
              key={it.id}
              item={it}
              expanded={expanded}
              isActive={isItemActive(it)}
              activeChildId={active}
              isAccordionOpen={!!openGroups.has(it.id)}
              onToggleAccordion={() => setOpenGroups(prev => {
                const next = new Set(prev);
                if (next.has(it.id)) next.delete(it.id); else next.add(it.id);
                return next;
              })}
              onSelect={(id) => onSelect && onSelect(id)}
              onHoverOpen={openFlyout}
              onHoverClose={scheduleClose}
            />
          ))}
        </div>

        <div style={{ flex:1, minHeight:8 }} />

        <ProfileCluster
          expanded={expanded}
          user={user}
          footerItems={footerItems}
          signOutHref={signOutHref}
          signOutLabel={signOutLabel}
          activeId={active}
          onSelect={onSelect}
        />
      </aside>

      {/* Flyout (collapsed only) */}
      {flyout && !expanded && (
        <Flyout
          parent={flyout.parent}
          anchorTop={flyout.anchorTop}
          anchorLeft={flyout.anchorLeft}
          activeChildId={active}
          onEnter={cancelClose}
          onLeave={scheduleClose}
          onSelect={(id) => { onSelect && onSelect(id); setFlyout(null); cancelClose(); }}
        />
      )}

      <SBTooltip label={expanded ? 'Collapse menu' : 'Expand menu'} anchorRef={toggleRef} show={toggleHover} />
    </React.Fragment>
  );
}

/* ---- single item ------------------------------------------------------- */
function SBItem({ item, expanded, isActive, activeChildId, isAccordionOpen, onToggleAccordion, onSelect, onHoverOpen, onHoverClose }) {
  const [hover, setHover] = React.useState(false);
  const [tipPos, setTipPos] = React.useState(null);
  const btnRef = React.useRef(null);
  const hasChildren = !!(item.children && item.children.length);

  const onEnter = () => {
    setHover(true);
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setTipPos({ top: r.top + r.height / 2, left: r.right + 10 });
      if (!expanded && hasChildren) onHoverOpen(item, btnRef.current);
    }
  };
  const onLeave = () => {
    setHover(false);
    if (!expanded && hasChildren) onHoverClose();
  };

  const handleClick = () => {
    if (expanded && hasChildren) {
      onToggleAccordion();
      return;
    }
    onSelect(item.id);
  };

  const showActive = isActive;
  const rowColor = showActive ? SB_ACCENT : (hover ? SB_INK_HI : SB_INK_DIM);
  const rowBg    = showActive ? SB_ACCENT_BG : (hover ? SB_HOVER_BG : 'transparent');

  return (
    <React.Fragment>
      <button
        ref={btnRef}
        onClick={handleClick}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        title=""
        style={{
          position:'relative',
          height:34, width: expanded ? '100%' : 32,
          borderRadius:8, border:'none', background:rowBg, color:rowColor,
          cursor:'pointer',
          display:'flex', alignItems:'center',
          justifyContent: expanded ? 'flex-start' : 'center',
          padding: expanded ? '0 8px' : 0, gap:12,
          transition:'background-color 120ms ease, color 120ms ease',
        }}>
        <i className={`fa-solid fa-${item.icon}`} style={{ fontSize:14, width:16, textAlign:'center', flexShrink:0 }} />

        {/* Status dot (e.g. unread) — only meaningful on parents w/o sub-items in collapsed mode */}
        {item.dotColor && !hasChildren && (
          <span style={{
            position:'absolute',
            top: expanded ? 10 : 6,
            left: expanded ? 18 : 18,
            width:7, height:7, borderRadius:9999,
            background:item.dotColor, border:`1.5px solid ${SB_BG}`, pointerEvents:'none',
          }} />
        )}

        {expanded && (
          <span style={{
            flex:1, fontFamily:'Inter', fontSize:12.5, fontWeight: showActive ? 600 : 500,
            color: showActive ? SB_ACCENT : SB_INK,
            whiteSpace:'nowrap', textAlign:'left',
          }}>{item.label}</span>
        )}

        {expanded && item.badge && (
          <span style={{
            minWidth:18, height:18, padding:'0 5px', borderRadius:9999,
            background:'rgb(220,38,38)', color:'#fff', fontSize:10, fontWeight:700,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>{item.badge}</span>
        )}
        {!expanded && item.badge && (
          <span style={{
            position:'absolute', top:-2, right:-2, minWidth:14, height:14, padding:'0 3px', borderRadius:9999,
            background:'rgb(220,38,38)', color:'#fff', fontSize:9, fontWeight:700,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>{item.badge}</span>
        )}

        {expanded && hasChildren && (
          <i className="fa-solid fa-chevron-down" style={{
            fontSize:10, color: showActive ? SB_ACCENT : SB_INK_DIM,
            transition:'transform 200ms ease',
            transform: isAccordionOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
            width:10,
          }} />
        )}

        {/* Collapsed hover tooltip (only when no children — otherwise the flyout takes over) */}
        {!expanded && !hasChildren && hover && tipPos && ReactDOM.createPortal(
          <span style={{
            position:'fixed', left: tipPos.left, top: tipPos.top, transform: 'translateY(-50%)',
            background:'rgb(17,24,39)', border:`1px solid ${SB_BORDER}`, borderRadius:6,
            padding:'5px 9px', fontFamily:'Inter', fontSize:11, fontWeight:500, color:SB_INK_HI,
            whiteSpace:'nowrap', zIndex:80, pointerEvents:'none',
            boxShadow:'0 8px 20px -4px rgba(0,0,0,0.6)',
            animation: 'sbTipIn 140ms ease-out both',
          }}>
            <span style={{
              position:'absolute', left:-4, top:'50%', transform:'translateY(-50%) rotate(45deg)',
              width:7, height:7, background:'rgb(17,24,39)',
              borderLeft:`1px solid ${SB_BORDER}`, borderBottom:`1px solid ${SB_BORDER}`,
            }} />
            {item.label}
          </span>,
          document.body
        )}
      </button>

      {/* Accordion children (expanded only) */}
      {expanded && hasChildren && (
        <div style={{
          overflow:'hidden',
          maxHeight: isAccordionOpen ? (item.children.length * 30 + 4) : 0,
          transition:'max-height 220ms cubic-bezier(0.22, 0.61, 0.36, 1)',
        }}>
          <div style={{ display:'flex', flexDirection:'column', gap:1, padding:'2px 0 4px', marginLeft:14, borderLeft:'1px solid rgba(75,85,99,0.5)' }}>
            {item.children.map(child => {
              const childActive = activeChildId === child.id;
              return (
                <button key={child.id}
                  onClick={() => onSelect(child.id)}
                  style={{
                    position:'relative',
                    textAlign:'left', height:28, borderRadius:6, border:'none',
                    background: childActive ? SB_ACCENT_BG : 'transparent',
                    color: childActive ? SB_ACCENT : SB_INK,
                    cursor:'pointer', padding:'0 10px 0 14px',
                    fontFamily:'Inter', fontSize:12, fontWeight: childActive ? 600 : 500,
                    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                    transition:'background-color 120ms ease, color 120ms ease',
                    marginLeft:6,
                  }}
                  onMouseEnter={e => { if (!childActive) e.currentTarget.style.background = SB_HOVER_BG; }}
                  onMouseLeave={e => { if (!childActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  {childActive && (
                    <span style={{
                      position:'absolute', left:-7, top:6, bottom:6, width:2,
                      background:SB_ACCENT, borderRadius:2,
                    }} />
                  )}
                  {child.label}
                  {child.badge && (
                    <span style={{
                      marginLeft:8, padding:'0 5px', borderRadius:9999,
                      background:'rgb(220,38,38)', color:'#fff', fontSize:9, fontWeight:700,
                    }}>{child.badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

/* ---- Flyout (collapsed sub-nav) --------------------------------------- */
function Flyout({ parent, anchorTop, anchorLeft, activeChildId, onEnter, onLeave, onSelect }) {
  return ReactDOM.createPortal(
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        position:'fixed',
        left: anchorLeft, top: Math.max(8, anchorTop - 6),
        minWidth:200, padding:'6px 6px',
        background:SB_BG, border:`1px solid ${SB_BORDER}`, borderRadius:10,
        boxShadow:'0 18px 40px -10px rgba(0,0,0,0.55), 0 4px 10px -2px rgba(0,0,0,0.4)',
        zIndex:60,
        animation:'sbFlyoutIn 160ms ease-out both',
      }}>
      {/* connector arrow */}
      <span style={{
        position:'absolute', left:-5, top:14,
        width:9, height:9, background:SB_BG,
        borderLeft:`1px solid ${SB_BORDER}`, borderBottom:`1px solid ${SB_BORDER}`,
        transform:'rotate(45deg)',
      }} />
      <div style={{
        padding:'6px 10px 8px', fontFamily:'Inter', fontSize:10.5, fontWeight:700,
        letterSpacing:'0.08em', textTransform:'uppercase', color:'rgb(120,128,141)',
      }}>{parent.label}</div>
      <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
        {parent.children.map(c => {
          const isActive = activeChildId === c.id;
          return (
            <button key={c.id}
              onClick={() => onSelect(c.id)}
              style={{
                position:'relative',
                textAlign:'left', height:30, borderRadius:6, border:'none',
                background: isActive ? SB_ACCENT_BG : 'transparent',
                color: isActive ? SB_ACCENT : SB_INK,
                cursor:'pointer', padding:'0 10px',
                fontFamily:'Inter', fontSize:12.5, fontWeight: isActive ? 600 : 500,
                transition:'background-color 120ms ease, color 120ms ease',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = SB_HOVER_BG; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              {c.label}
              {c.badge && (
                <span style={{
                  marginLeft:8, padding:'0 5px', borderRadius:9999,
                  background:'rgb(220,38,38)', color:'#fff', fontSize:9, fontWeight:700,
                }}>{c.badge}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );
}

/* ---- Profile cluster (always-visible footer: Settings, Help, profile, Sign out) - */
function ProfileCluster({ expanded, user, footerItems = [], signOutHref, signOutLabel = 'Sign out', activeId, onSelect, onHoverOpen, onHoverClose }) {
  const initials = user ? (user.initials || (user.name || '').split(' ').map(w => w[0]).slice(0,2).join('')) : '';
  const handleSignOut = (e) => {
    e.preventDefault();
    if (signOutHref) window.open(signOutHref, '_blank', 'noopener,noreferrer');
  };

  if (!user && !footerItems.length && !signOutHref) return null;

  return (
    <div style={{
      display:'flex', flexDirection:'column', gap:2, width:'100%',
      alignItems: expanded ? 'stretch' : 'center',
      paddingTop:8, marginTop:8,
      borderTop:`1px solid rgba(75,85,99,0.5)`,
      flexShrink:0,
    }}>
      {/* Settings, Help — always visible inline */}
      {footerItems.map(it => (
        <SBItem
          key={it.id}
          item={it}
          expanded={expanded}
          isActive={activeId === it.id || (it.children && it.children.some(c => c.id === activeId))}
          activeChildId={activeId}
          isAccordionOpen={false}
          onToggleAccordion={() => {}}
          onSelect={(id) => onSelect && onSelect(id)}
          onHoverOpen={onHoverOpen || (() => {})}
          onHoverClose={onHoverClose || (() => {})}
        />
      ))}

      {/* Profile row — non-interactive display */}
      {user && (
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          padding: expanded ? '8px 8px' : '4px 0',
          marginTop: footerItems.length ? 4 : 0,
          justifyContent: expanded ? 'flex-start' : 'center',
          flexShrink:0,
        }}>
          <div style={{
            width:30, height:30, borderRadius:9999, flexShrink:0,
            background:'linear-gradient(135deg, rgb(16,185,129), rgb(5,122,85))',
            color:SB_INK_HI, fontFamily:'Inter', fontWeight:700, fontSize:11,
            display:'flex', alignItems:'center', justifyContent:'center',
            border:'1px solid rgba(255,255,255,0.08)',
          }}>{initials}</div>
          {expanded && (
            <div style={{ minWidth:0, overflow:'hidden', flex:1 }}>
              <div style={{ fontFamily:'Inter', fontSize:12.5, fontWeight:600, color:SB_INK_HI, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user.name}</div>
              {user.role && <div style={{ fontFamily:'Inter', fontSize:11, color:SB_INK_DIM, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user.role}</div>}
            </div>
          )}
        </div>
      )}

      {/* Sign out — always visible */}
      {signOutHref && (
        <a
          href={signOutHref}
          onClick={handleSignOut}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            height:32, width: expanded ? '100%' : 32,
            marginTop:4,
            borderRadius: expanded ? 8 : 9999,
            background:'transparent', border:`1px solid ${SB_BORDER}`,
            display:'flex', alignItems:'center',
            justifyContent: expanded ? 'flex-start' : 'center',
            padding: expanded ? '0 8px' : 0, gap:10,
            color:SB_INK_DIM, cursor:'pointer', textDecoration:'none',
            boxSizing:'border-box', overflow:'hidden', flexShrink:0,
            transition:'color 120ms ease, background-color 120ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = SB_INK_HI; e.currentTarget.style.background = SB_HOVER_BG; }}
          onMouseLeave={e => { e.currentTarget.style.color = SB_INK_DIM; e.currentTarget.style.background = 'transparent'; }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="13" height="13" fill="currentColor" style={{ flexShrink:0 }}>
            <path d="M86.6 297.4L64 320L86.6 342.6L214.6 470.6L237.2 493.2L282.5 447.9C275.9 441.3 243.9 409.3 186.5 351.9L416 351.9L416 287.9L186.5 287.9C243.9 230.5 275.9 198.5 282.5 191.9L237.2 146.6L214.6 169.2L86.6 297.2zM416 480L384 480L384 544L576 544L576 96L384 96L384 160L512 160L512 480L416 480z"/>
          </svg>
          {expanded && (
            <span style={{ fontFamily:'Inter', fontSize:12, fontWeight:500, color:'inherit', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', minWidth:0 }}>
              {signOutLabel}
            </span>
          )}
        </a>
      )}
    </div>
  );
}

Object.assign(window, { Sidebar, SBItem, SBTooltip, ProfileCluster });