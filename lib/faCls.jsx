// faCls.jsx — Lucide-name → Font Awesome className bridge.
// Components keep using Lucide names like icon="chevron-right"; this maps them
// to Font Awesome 6 class strings. Add entries here as needed — unknown names
// fall back to solid + `fa-<name>` which will render as "missing icon" so the
// gap is visible.
const __FA_MAP = {
  'chevron-down':'fa-solid fa-chevron-down',
  'chevron-right':'fa-solid fa-chevron-right',
  'chevron-up':'fa-solid fa-chevron-up',
  'chevron-left':'fa-solid fa-chevron-left',
  'chevrons-up-down':'fa-solid fa-up-down',
  'external-link':'fa-solid fa-arrow-up-right-from-square',
  'trending-up':'fa-solid fa-arrow-trend-up',
  'trending-down':'fa-solid fa-arrow-trend-down',
  'arrow-up':'fa-solid fa-arrow-up',
  'arrow-down':'fa-solid fa-arrow-down',
  'arrow-right':'fa-solid fa-arrow-right',
  'check':'fa-solid fa-check',
  'check-circle-2':'fa-solid fa-circle-check',
  'circle-check':'fa-solid fa-circle-check',
  'search':'fa-solid fa-magnifying-glass',
  'plus':'fa-solid fa-plus',
  'calendar':'fa-regular fa-calendar',
  'ellipsis':'fa-solid fa-ellipsis',
  'more-horizontal':'fa-solid fa-ellipsis',
  'loader-circle':'fa-solid fa-spinner fa-spin',
  'menu':'fa-solid fa-bars',
  'panel-left':'fa-solid fa-bars',
  'download':'fa-solid fa-download',
  'x':'fa-solid fa-xmark',
  'mail':'fa-solid fa-envelope',
  'bell':'fa-solid fa-bell',
  'sparkles':'fa-solid fa-wand-magic-sparkles',
  'layout-dashboard':'fa-solid fa-table-columns',
  'check-square':'fa-regular fa-square-check',
  'terminal':'fa-solid fa-terminal',
  'credit-card':'fa-regular fa-credit-card',
  'users':'fa-solid fa-users',
  'settings':'fa-solid fa-gear',
  'file-bar-chart':'fa-solid fa-chart-column',
  'layers':'fa-solid fa-layer-group',
  'message-circle':'fa-solid fa-message',
  'folder':'fa-regular fa-folder',
  'shield':'fa-solid fa-shield',
  'target':'fa-solid fa-bullseye',
  'briefcase':'fa-solid fa-briefcase',
  'shield-check':'fa-solid fa-shield-halved',
  'droplet':'fa-solid fa-droplet',
  'percent':'fa-solid fa-percent',
  'triangle-alert':'fa-solid fa-triangle-exclamation',
};
function faCls(name) {
  return __FA_MAP[name] || ('fa-solid fa-' + String(name || ''));
}
Object.assign(window, { faCls, __FA_MAP });
