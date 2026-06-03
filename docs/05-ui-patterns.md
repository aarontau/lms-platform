# 05 — UI Patterns

This document describes the visual and structural patterns used throughout the frontend.
Following these patterns ensures that new pages look like they belong to the same platform.

---

## Layout

Every authenticated page shares the same shell:

```
┌──────────────────────────────────────────────────────┐
│  Sidebar (fixed left, 256px / w-64)                  │
│  ┌────────────────────────────────────────────────┐  │
│  │  School Seal (192px circle)                    │  │
│  │  Nav sections: Main / Academic / Management    │  │
│  │  User card + Sign Out                          │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Main area (flex-1, scrollable)                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  TopBar (sticky, shows page title + user)      │  │
│  │  <main> padding-6                              │  │
│  │    Page content                                │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

The layout file is `apps/web/src/app/(dashboard)/layout.tsx`.

On mobile (< lg breakpoint), the sidebar slides in as an overlay. A hamburger button
in the TopBar toggles it. The backdrop behind the sidebar closes it on click.

---

## Colour System

The primary colour is defined once in `tailwind.config.ts` as a scale from 50 to 950.
Currently set to **indigo/blue**. To change the brand colour for a new school, update
this file only — every button, active nav link, and accent throughout the platform
inherits from it automatically.

```typescript
// tailwind.config.ts
primary: {
  50:  '#eef2ff',
  100: '#e0e7ff',
  ...
  600: '#4f46e5',  // ← main brand colour
  700: '#4338ca',
  ...
  950: '#1e1b4b',  // ← sidebar background
}
```

**Semantic colours used throughout:**
- `primary-600` — primary action buttons, active nav links
- `primary-950` — sidebar background
- `red-600` — danger / delete / high-risk
- `amber-600` — warning / pending / moderate-risk
- `emerald-600` — success / active / low-risk / reviewed
- `gray-50` — page background
- `white` — card backgrounds

---

## Page Header Pattern

Every page starts with a coloured gradient hero band. This establishes context immediately
and gives each section its own identity colour.

```tsx
<div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[dark] via-[mid] to-[light] p-6 shadow-lg">
  {/* Decorative background circles */}
  <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
    <svg>...</svg>
  </div>
  {/* Large ghost letter/symbol */}
  <span className="absolute right-5 bottom-1 text-[8rem] font-black text-white/10 ...">
    ψ {/* or ∑ or whatever suits the section */}
  </span>
  
  <div className="relative">
    {/* Project badge */}
    <div className="flex items-center gap-2 mb-1">
      <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <span className="text-white/70 text-sm font-medium">UL-Junior Project</span>
    </div>
    <h1 className="text-2xl font-bold text-white">Page Title</h1>
    <p className="text-white/80 text-sm mt-1">Brief description of what this section does.</p>
  </div>
</div>
```

**Colour conventions per section:**
| Section | Gradient |
|---------|---------|
| Learners | `from-primary-800 via-primary-700 to-indigo-700` |
| Screeners | `from-rose-700 via-rose-600 to-pink-600` |
| HR | `from-violet-800 via-violet-700 to-purple-700` |
| Diagnostics | `from-slate-800 via-slate-700 to-slate-600` |
| Class Lists | `from-primary-800 via-primary-700 to-indigo-700` |

---

## Card Pattern

White content containers use consistent rounding and border:

```tsx
<div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
  {/* content */}
</div>
```

Or using the utility class defined in `globals.css`:
```tsx
<div className="card">...</div>
```

---

## Table Pattern

```tsx
<div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Column Name
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.map(row => (
          <tr key={row.id} className="hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3">...</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

---

## Modal Pattern

Modals use the shared `Modal` component from `src/components/ui/Modal.tsx`.

```tsx
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Modal Title" size="lg">
  <form onSubmit={handleSubmit}>
    {/* form content */}
    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
      <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
      <button type="submit" className="btn-primary">Save</button>
    </div>
  </form>
</Modal>
```

---

## Form Pattern

```tsx
<div className="space-y-4">
  <div>
    <label className="form-label">Field Name</label>
    <input
      type="text"
      className="form-input"
      value={value}
      onChange={e => setValue(e.target.value)}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
  
  <div>
    <label className="form-label">Dropdown Field</label>
    <select className="form-input">
      <option value="">Select...</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
</div>
```

`form-label` and `form-input` are utility classes defined in `globals.css`.

---

## Status Badge Pattern

```tsx
// Reusable status badges
<span className="badge status-active">Active</span>
<span className="badge status-warning">Pending</span>
<span className="badge status-danger">High Risk</span>
```

These use `.badge`, `.status-active`, `.status-warning`, `.status-danger` classes
from `globals.css`.

---

## Button Pattern

```tsx
<button className="btn-primary">Primary Action</button>
<button className="btn-secondary">Secondary Action</button>
<button className="btn-danger">Delete</button>
```

Defined in `globals.css`. Include `disabled:opacity-50 disabled:cursor-not-allowed`
by default.

---

## Loading State Pattern

```tsx
if (isLoading) return (
  <div className="p-8 text-center text-sm text-gray-400">
    Loading...
  </div>
)
```

Or for inline spinners:
```tsx
<span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
```

---

## Empty State Pattern

```tsx
if (data.length === 0) return (
  <div className="p-12 text-center">
    <Icon className="h-12 w-12 text-gray-200 mx-auto mb-3" />
    <p className="text-sm text-gray-500 font-medium">Nothing here yet</p>
    <p className="text-xs text-gray-400 mt-1">Descriptive explanation of how to add data.</p>
  </div>
)
```

---

## Print Pattern

Two mechanisms are used for printing:

**Full-page print** (class lists, DA papers):
```typescript
// Add class to body → CSS hides everything except .classlist-print-area
document.body.classList.add('classlist-print-mode')
window.print()
document.body.classList.remove('classlist-print-mode')
```

Defined in `globals.css` under `/* ─── Class List print mode ─── */`.

**Element-level print** (report cards, individual records):
Uses `@media print` CSS with `.no-print` class to hide UI chrome.

---

## The School Seal Component

```tsx
import { SchoolSeal } from '@/components/ui/SchoolSeal'

// In the sidebar (dark background):
<SchoolSeal
  size={192}
  topLabel="UL-Junior Project"
  bottomLabel={schoolName}
  variant="light"    // white/gold text on dark background
/>

// On printed documents (white paper):
<SchoolSeal
  size={120}
  topLabel="UL-Junior Project"
  bottomLabel="MWED-BUPHEPHUKGAMA"
  variant="dark"     // navy/amber text on white paper
/>
```

**For a new school:** Change `bottomLabel` and `topLabel` as needed. The emblem SVG
inside `SchoolSeal.tsx` is generic (graduation cap, open book, EDUCATION banner) and
works for any educational institution. A school-specific emblem would be provided as an
image file and inserted in place of `EmblemSVG`.

---

## Animation

Two entry animations are defined in `globals.css`:
- `animate-fade-in` — pages fade in from slightly below (used on every page)
- `animate-slide-in-left` — slides in from the left (used for sidebar items)

Apply `animate-fade-in` to the outermost `<div>` of every page:
```tsx
<div className="space-y-6 animate-fade-in">
  ...
</div>
```
