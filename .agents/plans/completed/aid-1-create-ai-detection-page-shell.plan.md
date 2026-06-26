# Plan: AID-1 Create AI Detection Page Shell

## Summary

Create a new "AI Detection" page shell in the NextJS dashboard with sidebar navigation entry. The page follows the existing geospatial page pattern, using `MainLayout` wrapper and `useProject()` hook for project context. This is a foundational story that enables all subsequent AI detection features.

## User Story

As a SOC operator, I want a new "AI Detection" page accessible from the sidebar navigation, so that I can access the AI-powered threat detection dashboard.

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY |
| Complexity | LOW |
| Systems Affected | Frontend (NextJS) |
| Jira Issue | AID-1 |

---

## Patterns to Follow

### Page Shell Pattern
```tsx
// SOURCE: src/app/(dashboard)/geospatial/page.tsx:1-19
'use client';
import { MainLayout } from '@/components/layout/main-layout';

export default function GeospatialPage() {
  return (
    <MainLayout
      title='Geospatial Intelligence'
      subtitle='Interactive mission planning and tactical mapping'
    >
      <MapStatusHeader />
      <div className='relative bg-card border border-gray-800 rounded-xl overflow-hidden shadow-2xl'>
        <GeoMap />
      </div>
    </MainLayout>
  );
}
```

### Sidebar Navigation Pattern
```tsx
// SOURCE: src/components/layout/sidebar.tsx:22-34
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Gauge },
  { name: 'Live Feeds', href: '/live-feed', icon: Video },
  { name: 'Geospatial Map', href: '/geospatial', icon: Globe },
  { name: 'Control', href: '/control', icon: Settings },
];
```

### EmptyPage Component Pattern
```tsx
// SOURCE: src/components/features/streams/EmptyPage.tsx:13-31
interface EmptyPageProps {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  action: { label: string; onClick: () => void };
}

export function EmptyPage({ icon, title, body, action }: EmptyPageProps) {
  return (
    <div className='flex flex-col items-center justify-center gap-4 py-24 text-center font-poppins'>
      <div className='w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center'>
        {icon}
      </div>
      <div className='max-w-xs'>
        <h2 className='text-base font-bold text-zinc-200'>{title}</h2>
        <p className='text-sm text-zinc-500 mt-1.5 leading-relaxed'>{body}</p>
      </div>
      <button
        onClick={action.onClick}
        className='flex items-center gap-2 px-5 py-2.5 bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-xs font-bold rounded-xl transition-colors'
      >
        <ChevronRight size={13} />
        {action.label}
      </button>
    </div>
  );
}
```

### Project Context Hook Pattern
```tsx
// SOURCE: src/providers/ProjectProvider.tsx:111-118
export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error(
      'useProject() must be called inside <ProjectProvider>. Check your Providers tree.'
    );
  }
  return ctx;
}
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `src/app/(dashboard)/ai-detection/page.tsx` | CREATE | New AI Detection page shell |
| `src/components/layout/sidebar.tsx` | UPDATE | Add AI Detection navigation entry |

---

## Tasks

Execute in order. Each task is atomic and verifiable.

### Task 1: Add AI Detection to Sidebar Navigation

- **File**: `src/components/layout/sidebar.tsx`
- **Action**: UPDATE
- **Implement**:
  1. Add `Brain` to the lucide-react imports (line 7-19)
  2. Add navigation entry to the `navigation` array (after line 26):
     ```tsx
     { name: 'AI Detection', href: '/ai-detection', icon: Brain },
     ```
- **Mirror**: `src/components/layout/sidebar.tsx:22-34` - follow existing navigation entry pattern
- **Validate**: `pnpm run build`

### Task 2: Create AI Detection Page

- **File**: `src/app/(dashboard)/ai-detection/page.tsx`
- **Action**: CREATE
- **Implement**:
  1. Create the directory `src/app/(dashboard)/ai-detection/`
  2. Create `page.tsx` with:
     - `'use client'` directive
     - Import `MainLayout` from `@/components/layout/main-layout`
     - Import `Brain` from `lucide-react`
     - Import `useProject` from `@/providers/ProjectProvider`
     - Import `EmptyPage` from `@/components/features/streams/EmptyPage`
     - Import `useRouter` from `next/navigation`
     - Export default function `AIDetectionPage()`
     - Use `useProject()` to get `activeProject`
     - If no active project, render `EmptyPage` with Brain icon
     - Otherwise, render `MainLayout` with title="AI & Object Detection"
     - Add placeholder div with `space-y-6` class for future child components
- **Mirror**: `src/app/(dashboard)/geospatial/page.tsx:1-19` - follow page shell pattern
- **Validate**: `pnpm run build`

---

## Validation

```bash
# Type check
pnpm run build

# Lint
pnpm run lint
```

---

## Acceptance Criteria

- [ ] All tasks completed
- [ ] Type check passes
- [ ] Lint passes
- [ ] "AI Detection" entry appears in sidebar with Brain icon
- [ ] Clicking sidebar entry navigates to `/ai-detection`
- [ ] Page renders with MainLayout and correct title
- [ ] EmptyPage shows when no project is active
- [ ] Page redirects to /projects when no project selected (handled by dashboard layout)
