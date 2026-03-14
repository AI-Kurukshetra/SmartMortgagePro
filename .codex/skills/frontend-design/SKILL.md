---
name: frontend-design
description: >
  Visual system, component patterns, and implementation constraints for SmartMortgagePro UI.
  Use this skill whenever building or modifying any UI surface in SmartMortgagePro — React components,
  pages, dashboards, forms, data tables, calculators, or any MUI-based layout. Also trigger when
  styling, refactoring, or auditing existing components for consistency, accessibility, or responsiveness.
  Contains design tokens, state templates, MUI usage rules, and fintech-specific patterns.
---

# SmartMortgagePro · Frontend Design System

## Visual Language

Professional fintech: clean, trust-oriented, high information density without clutter.
Prioritise **readability and data clarity** over decoration.

---

## Design Tokens

Use CSS-in-JS (`sx` prop / `styled`) or a shared `theme.ts`. Never hardcode values.

### Palette
```ts
primary:   { main: '#1A3C5E', light: '#2D5F8A', dark: '#0F2237' }  // Navy trust
secondary: { main: '#0A7EA4', light: '#3AABE8', dark: '#065A76' }  // Teal action
success:   { main: '#2E7D32' }
warning:   { main: '#ED6C02' }
error:     { main: '#D32F2F' }
neutral:   { 50: '#F8FAFC', 100: '#F1F5F9', 800: '#1E293B', 900: '#0F172A' }
surface:   '#FFFFFF'
divider:   'rgba(0,0,0,0.08)'
```

### Typography
```ts
fontFamily: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif'
// Headings: IBM Plex Sans SemiBold (600)
// Body:     IBM Plex Sans Regular (400)
// Mono (rates, amounts): IBM Plex Mono — always for financial figures
```

| Variant    | Size  | Weight | Use                        |
|------------|-------|--------|----------------------------|
| h1         | 2rem  | 600    | Page titles                |
| h2         | 1.5rem| 600    | Section headers            |
| h3         | 1.25rem| 500   | Card titles                |
| body1      | 1rem  | 400    | Primary content            |
| body2      | 0.875rem| 400  | Secondary / metadata       |
| caption    | 0.75rem | 400  | Labels, helper text        |
| **mono**   | inherit | 500  | All currency / rate values |

### Spacing
8px base grid. Use MUI `spacing(n)` — multiples of 8.
Common: `spacing(1)=8px` `spacing(2)=16px` `spacing(3)=24px` `spacing(4)=32px`

### Elevation / Shadow
```ts
card:    'box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)'
overlay: 'box-shadow: 0 10px 25px rgba(0,0,0,0.12)'
// Avoid MUI default heavy shadows — use the above instead via sx
```

---

## Responsive Breakpoints

| Breakpoint | Width     | Layout behaviour                              |
|-----------|-----------|-----------------------------------------------|
| xs        | 320px+    | Single column, stacked cards, full-width forms |
| sm        | 600px+    | 2-col grids start, side nav collapses to drawer|
| md        | 900px+    | 3-col grids, persistent side nav              |
| lg        | 1200px+   | Max content width 1440px, centred             |

Always test at 320, 768, 1024, 1440.

---

## Component Guidance

### When to use MUI vs local primitives
| Situation                              | Use                          |
|----------------------------------------|------------------------------|
| Data tables, complex grids             | MUI `DataGrid`               |
| Layout surfaces (Card, Stack, Grid)    | MUI                          |
| Form inputs (text, select, checkbox)   | Local shadcn-style primitives|
| Dialogs, Drawers, Tooltips             | MUI                          |
| Buttons                                | MUI `Button` with theme variants|
| Charts / sparklines                    | Recharts or MUI X Charts     |

### Financial Data Display
```tsx
// Currency — always use Intl.NumberFormat, never template strings
// Wrap in a <span className="font-mono"> or Typography variant="mono"
const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
// Render client-side only (useEffect / dynamic import) to avoid SSR hydration mismatch
```

### Data Tables (MUI DataGrid)
- Freeze first column for identifier (loan ID, borrower name)
- Right-align all numeric columns
- Show totals row in `pinnedRows.bottom`
- Always provide `getRowId`; never rely on array index

### Forms
- Group related fields in `<fieldset>` with visible `<legend>` (screen-reader + visual)
- Inline validation: show error on blur, clear on valid input
- Disable submit while submitting; show `CircularProgress` inside button
- Never reset the form on API error — preserve user input

### Cards (summary / KPI)
```tsx
// Consistent structure:
<Card sx={{ p: 3, borderRadius: 2, ...cardShadow }}>
  <Typography variant="caption" color="text.secondary">{label}</Typography>
  <Typography variant="h3" fontFamily="IBM Plex Mono">{value}</Typography>
  <Typography variant="body2" color={delta >= 0 ? 'success.main' : 'error.main'}>
    {deltaLabel}
  </Typography>
</Card>
```

---

## State Templates

Every data-driven view **must** implement all three:

### Loading
```tsx
// Skeleton — match the shape of real content
<Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1, mb: 1 }} />
// For tables: render 5 Skeleton rows at correct row height
// For KPI cards: Skeleton with same card dimensions
```

### Empty
```tsx
<Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
  <SvgIcon component={EmptyStateIcon} sx={{ fontSize: 48, mb: 2, opacity: 0.4 }} />
  <Typography variant="h3">{title}</Typography>
  <Typography variant="body2" sx={{ mt: 1 }}>{subtitle}</Typography>
  {actionLabel && <Button variant="contained" sx={{ mt: 3 }}>{actionLabel}</Button>}
</Box>
```

### Error
```tsx
<Alert severity="error" action={<Button onClick={retry}>Retry</Button>}>
  <AlertTitle>Something went wrong</AlertTitle>
  {message ?? 'Unable to load data. Please try again.'}
</Alert>
```

---

## Accessibility Requirements

- **Contrast**: Minimum 4.5:1 body text; 3:1 for large text and UI components (WCAG AA)
- **Focus styles**: Never `outline: none` without a custom visible replacement
  ```css
  :focus-visible { outline: 2px solid #0A7EA4; outline-offset: 2px; }
  ```
- **Keyboard navigation**: All interactive elements reachable via Tab; logical DOM order
- **ARIA**: `aria-label` on icon-only buttons; `aria-live="polite"` on async status regions
- **Form labels**: Every input has an associated `<label>` — never rely on `placeholder` alone
- **Tables**: Use `scope="col"` on `<th>`; provide `caption` or `aria-label` on `<table>`
- **Loading states**: `aria-busy="true"` on the container while loading

---

## SSR / Hydration Rules

- **Never** render locale-formatted numbers, dates, or currency during SSR
- Wrap Intl/Date formatting in `useEffect` or a `ClientOnly` wrapper component
- No `Math.random()` or `Date.now()` in render — use deterministic seeds or server props
- Conditional rendering based on `typeof window` must be guarded with `useEffect` / `mounted` state

---

## Output Checklist

Before marking any component complete:

- [ ] Loading skeleton implemented, matches content layout
- [ ] Empty state with illustration, message, and optional CTA
- [ ] Error state with message and retry action
- [ ] Financial values use `IBM Plex Mono` and `Intl.NumberFormat` (client-side only)
- [ ] Responsive at 320 / 768 / 1024 / 1440
- [ ] All inputs have accessible labels
- [ ] Focus styles visible on all interactive elements
- [ ] Contrast passes WCAG AA
- [ ] No hardcoded colours, spacing, or font sizes — uses tokens
- [ ] No `Math.random()` / `Date.now()` in render path
- [ ] MUI used for layout surfaces; local primitives for form controls