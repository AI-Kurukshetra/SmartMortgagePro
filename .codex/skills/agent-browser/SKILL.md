# agent-browser

## Purpose
Run visual QA and responsive checks before signoff.

## Protocol
1. Open target route on desktop and mobile widths.
2. Validate:
   - No layout shift on initial render
   - No hydration warnings in console
   - No clipped/overflowing form controls
3. Confirm critical action paths are visible and usable.

## Required Breakpoints
- Mobile: `390x844`
- Tablet: `768x1024`
- Desktop: `1440x900`

## Signoff Criteria
- UI parity across breakpoints.
- No blocking console errors.
- Primary CTA flow works end-to-end.
