# CareEcho Design System

## Overview
The CareEcho design system implements a healthcare-focused color palette with WCAG-AA compliant contrast ratios and a calm, clinical visual hierarchy.

## Color Tokens

### Brand Colors
- `brand-red-500`: #DE4246 (brand)
- `brand-red-600`: #BA373B (primary CTA & active)
- `brand-red-700`: #9A2F32 (hover states)
- `accent-teal`: #6DC8C5 (links, focus rings, subtle accents)

### Neutral Colors
- `neutral-50`: #F3ECE9 (app background)
- `neutral-100`: #D9D3D0 (cards/surfaces)
- `neutral-200`: #C1BEBC (borders)
- `neutral-300`: #AAA7A6 (disabled states)
- `neutral-400`: #918F8F
- `neutral-500`: #7A7979
- `neutral-600`: #5C5B5B (muted text)
- `neutral-700`: #403F3F
- `neutral-800`: #232424 (body text)
- `neutral-900`: #090B0B (headings)

### Semantic Colors
- `success`: #2E7D32
- `warning`: #F59E0B
- `error`: #C62828 (different from brand red)
- `info`: #2563EB

## Usage Guidelines

### 1. Never Hardcode Colors
Always use theme tokens or CSS variables:
```tsx
// ✅ Correct
<div className="bg-brand-red-600 text-white">
<button className="text-neutral-800 bg-neutral-100">

// ❌ Incorrect
<div className="bg-[#BA373B] text-[#FFFFFF]">
```

### 2. Accessibility Requirements
- Maintain ≥4.5:1 contrast for text
- Default pairs:
  - White text on `brand-red-600` ✅
  - `neutral-900` text on `neutral-50` ✅

### 3. Color Usage Rules
- **Red**: Brand/CTAs/critical emphasis only. Do not use for success/info
- **Teal**: Links, focus rings, chart lines, selection accents
- **Neutrals**: Calm surfaces, backgrounds, borders

### 4. Component States
- **Hover/Active**: Darken `brand-red-600` to `brand-red-700`
- **Disabled**: `neutral-300` bg, `neutral-600` text
- **Focus**: 2px outline `accent-teal`

## Component Classes

### Buttons
```css
.btn-primary {
  @apply bg-brand-red-600 text-white hover:bg-brand-red-700 focus:ring-2 focus:ring-accent-teal;
}

.btn-secondary {
  @apply bg-neutral-100 text-neutral-800 hover:bg-neutral-200 focus:ring-2 focus:ring-accent-teal;
}

.btn-disabled {
  @apply bg-neutral-300 text-neutral-600 cursor-not-allowed;
}
```

### Cards
```css
.card-interactive {
  @apply bg-neutral-100 border border-neutral-200 hover:shadow-lg;
}

.survey-card {
  @apply bg-neutral-100 rounded-2xl p-6 hover:shadow-lg;
}
```

### Links
```css
.link-primary {
  @apply text-accent-teal hover:underline focus:ring-2 focus:ring-accent-teal;
}
```

### Alerts
```css
.alert-success { @apply bg-success/10 border-l-4 border-success; }
.alert-warning { @apply bg-warning/10 border-l-4 border-warning; }
.alert-error { @apply bg-error/10 border-l-4 border-error; }
.alert-info { @apply bg-info/10 border-l-4 border-info; }
```

### Focus Styles
```css
.focus-ring {
  @apply focus:outline-none focus:ring-2 focus:ring-accent-teal focus:ring-offset-2;
}
```

## Implementation Status

### ✅ Completed
- [x] Tailwind config updated with CareEcho palette
- [x] CSS variables updated for light/dark modes
- [x] Component classes refactored
- [x] Header component updated
- [x] Footer component updated
- [x] Index page updated
- [x] Focus styles implemented
- [x] Accessibility contrast maintained

### 🔄 In Progress
- [ ] Survey page component updates
- [ ] UI component library updates (shadcn/ui)
- [ ] Form components styling
- [ ] Modal/dialog components

### 📋 TODO
- [ ] Add unit tests for contrast ratios
- [ ] Visual regression tests
- [ ] Dark mode implementation verification
- [ ] Mobile responsiveness verification

## Testing

### Contrast Testing
Use browser dev tools or tools like:
- WebAIM Contrast Checker
- Stark Contrast Checker
- Browser accessibility inspector

### Visual Testing
- Test all button states (default, hover, active, disabled, focus)
- Verify link styling and focus rings
- Check alert component styling
- Test dark mode toggle

## Migration Notes

### Breaking Changes
- Old `primary` color now maps to `brand-red-600`
- Old `secondary` color now maps to `neutral-100`
- Old `accent` color now maps to `accent-teal`

### Legacy Support
- shadcn/ui components still use CSS variables for compatibility
- Healthcare-specific colors preserved for gradual migration

## Resources
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
