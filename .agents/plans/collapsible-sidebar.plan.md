# Plan: Collapsible Sidebar

## Summary

Add a collapsible sidebar that can toggle between expanded (icons + labels, 256px) and collapsed (icons only, 64px) states. State is persisted in localStorage. A toggle button is added at the bottom of the sidebar for desktop users. The main content area dynamically adjusts its left margin.

## User Story

As a user
I want to collapse the sidebar to just icons
So that I have more space for content-heavy pages like AI Detection

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | MEDIUM |
| Systems Affected | Layout, Sidebar, MainLayout |
| Jira Issue | N/A |

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `src/contexts/SidebarContext.tsx` | CREATE | Context provider for sidebar collapsed state |
| `src/components/layout/sidebar.tsx` | UPDATE | Support collapsed mode (icons only) + toggle button |
| `src/components/layout/main-layout.tsx` | UPDATE | Consume context, adjust `lg:ml-*` dynamically |
| `src/providers/Providers.tsx` | UPDATE | Wrap with SidebarProvider |

---

## Tasks

### Task 1: Create SidebarContext

- **File**: `src/contexts/SidebarContext.tsx`
- **Action**: CREATE
- **Implement**:
  - `SidebarProvider` component with `useState` + `useEffect` for localStorage sync
  - `useSidebar()` hook returning `{ collapsed, toggle }`
  - Key: `sidebar-collapsed` in localStorage
  - Default: `false` (expanded) on first visit
  - Wrap children, export context

### Task 2: Update Sidebar for collapsed mode

- **File**: `src/components/layout/sidebar.tsx`
- **Action**: UPDATE
- **Implement**:
  - Import `useSidebar` from context
  - When collapsed:
    - Width: `w-16` (64px) instead of `w-64`
    - Hide text labels (`{item.name}`, username, "Sign Out" text)
    - Show only icons centered
    - Logo: show only Satellite icon, hide "ISR C&C" text
    - Nav items: icon only, centered, with tooltip (`title` attribute)
    - User footer: show only avatar/icon, hide name/role text
    - Projects: icon only
  - When expanded: current behavior (full width with labels)
  - Add toggle button at bottom of sidebar (above user footer):
    - `ChevronLeft` when expanded, `ChevronRight` when collapsed
    - Calls `toggle()` from context
    - Only visible on `lg:` screens
  - Smooth transition: `transition-all duration-300`

### Task 3: Update MainLayout for dynamic margin

- **File**: `src/components/layout/main-layout.tsx`
- **Action**: UPDATE
- **Implement**:
  - Import `useSidebar` from context
  - Replace hardcoded `lg:ml-64` with dynamic class:
    - Expanded: `lg:ml-64`
    - Collapsed: `lg:ml-16`
  - Use `cn()` utility for conditional classes
  - Transition: `transition-all duration-300` (already present)

### Task 4: Add SidebarProvider to Providers

- **File**: `src/providers/Providers.tsx`
- **Action**: UPDATE
- **Implement**:
  - Import `SidebarProvider`
  - Wrap inside `ProjectProvider` (so it's available to all dashboard children)
  - Order: ThemeProvider > AuthProvider > QueryProvider > ProjectProvider > SidebarProvider

---

## Validation

```bash
npx tsc --noEmit
```

## Acceptance Criteria

- [ ] Sidebar collapses to 64px showing only icons
- [ ] Sidebar expands to 256px showing icons + labels
- [ ] Toggle button visible at bottom of sidebar (desktop only)
- [ ] State persists in localStorage
- [ ] Main content margin adjusts dynamically
- [ ] Smooth transition animation
- [ ] Tooltips on collapsed nav items
- [ ] Mobile behavior unchanged (slide-in drawer)
