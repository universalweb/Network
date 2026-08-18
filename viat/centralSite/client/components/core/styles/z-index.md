# Z-index scale (canonical)

**Source of truth for values:** `styles/variables.css` (`:root` `--z-*` tokens).  
This file documents **when to use which layer**. Do not invent bare integers for fixed/sticky/app chrome.

## Ladder (low → high)

| Token | Typical value | Use |
|-------|---------------|-----|
| `--z-base` | 0 | Default flow / root surfaces |
| `--z-raised` | 10 | Slight lift inside a surface (badge chip, selected row chrome) |
| `--z-sticky-local` | 5 | **Sticky inside a scrollport** — section heads, table `thead`, in-page rails that stick *within* a column |
| `--z-dock` | 100 | Persistent edge chrome (dock, status strip) |
| `--z-fab` | 200 | Floating action / speed-dial |
| `--z-dropdown` | 1000 | Menus, selects, combobox panels (in-tree, not popover top-layer) |
| `--z-sticky` | 1100 | **App chrome sticky/fixed to the viewport** (global app-bar) — not section heads |
| `--z-floating` | 1200 | Morph / floating panels, drawers, expandable cards (in-tree fixed) |
| `--z-modal` | 1300 | Modal / dialog backdrops + sheets |
| `--z-popover` | 1400 | Anchored popovers when not using native top-layer |
| `--z-tooltip` | 1500 | Tooltips |
| `--z-toast` | 1600 | Toasts / notification stack |
| `--z-max` | 10000 | Escape hatch only (boot / full-screen lock) |

Local stacking **inside one component** (series under chart tip, badge on avatar): plain `1`–`9` is fine. Prefer tokens once the layer crosses a component boundary.

## Sticky: local vs app

| Need | Token | Why |
|------|-------|-----|
| Sticky category / table head **inside** a scrolling main column | `--z-sticky-local` | Must not paint over a sibling nav column or app chrome |
| Global top bar fixed to the viewport | `--z-sticky` | Sits above dock/FAB, below dropdowns/modals |

When a scroll column sits beside a rail, isolate the scroller:

```css
.stage {
	isolation: isolate;
	z-index: var(--z-base);
}
.rail {
	position: relative;
	z-index: var(--z-raised);
}
```

## Rules

1. **No magic numbers** for fixed/sticky/overlays — use `var(--z-*)`.
2. **Preview / docs chrome** uses the same tokens as the app (no parallel ladder).
3. **Native `popover` / top-layer** does not need z-index (UA top layer wins).
4. Themes may re-tint shadows, not re-order the ladder without updating this doc + `variables.css`.

## Related

- Elevation / shadows: `modules/util-elevation.css` (`--shadow-*`)
- View paint / lazy scroll: `core/dom/viewPort.js`
