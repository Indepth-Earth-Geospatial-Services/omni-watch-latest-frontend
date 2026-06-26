# Plan: AID-17 Implement Confirmation Dialog

## Summary

Create a reusable `ConfirmDialog` component using shadcn/ui `AlertDialog` that provides confirmation prompts before irreversible actions (approve/dismiss threats). The component will be integrated into the `DetectionDetailModal` to wrap the existing approve/dismiss buttons, and will be reused by the future `BulkActions` component.

## User Story

As a SOC operator
I want a confirmation dialog before approving or dismissing threats
So that I don't accidentally perform irreversible actions

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY |
| Complexity | LOW |
| Systems Affected | UI Components, AI Detection Page |
| Jira Issue | AID-17 |

---

## Patterns to Follow

### shadcn/ui Component Installation
```bash
# Install AlertDialog and Dialog primitives (AID-2 prerequisite)
pnpm dlx shadcn@latest add alert-dialog dialog scroll-area
```

### Component Pattern (Existing)
```tsx
// SOURCE: src/components/features/ai-detection/DetectionDetailModal.tsx:16-21
interface DetectionDetailModalProps {
  detection: ThreatDetection | null;
  onClose: () => void;
  onApprove?: (detection: ThreatDetection) => void;
  onDismiss?: (detection: ThreatDetection) => void;
}
```

### Dark Theme Card Pattern
```tsx
// SOURCE: src/components/features/ai-detection/DetectionDetailModal.tsx:100-105
<div className='bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50'>
  <h4 className='text-xs font-medium text-[#8C90A0] mb-1'>Label</h4>
  <p className='text-sm font-mono text-[#E2E2E8]'>Value</p>
</div>
```

### Button Styling Pattern
```tsx
// SOURCE: src/components/features/ai-detection/DetectionDetailModal.tsx:204-218
// Dismiss button (neutral)
className='flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-[11px] font-bold uppercase tracking-widest hover:border-zinc-500 hover:text-zinc-200 transition-colors'

// Approve button (destructive/red)
className='flex-1 py-2.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-[11px] font-black uppercase tracking-widest hover:bg-red-500/30 hover:border-red-400 transition-colors shadow-[0_0_20px_rgba(239,68,68,0.1)]'
```

### Toast Pattern
```tsx
// Already available via sonner
import { toast } from 'sonner';
toast.success('Threat approved');
toast.error('Failed to approve threat');
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `src/components/ui/alert-dialog.tsx` | CREATE | shadcn AlertDialog primitive (install) |
| `src/components/features/ai-detection/ConfirmDialog.tsx` | CREATE | Reusable confirmation dialog component |
| `src/components/features/ai-detection/DetectionDetailModal.tsx` | UPDATE | Wrap approve/dismiss buttons with ConfirmDialog |

---

## Tasks

### Task 1: Install shadcn/ui AlertDialog Component

- **File**: `src/components/ui/alert-dialog.tsx`
- **Action**: CREATE
- **Implement**: Run `pnpm dlx shadcn@latest add alert-dialog` to install the AlertDialog primitive
- **Mirror**: N/A (package installation)
- **Validate**: `pnpm run build` succeeds
- **Notes**: This is a prerequisite from AID-2. The AlertDialog component cannot be dismissed by clicking outside, which is critical for confirmation dialogs.

### Task 2: Create ConfirmDialog Component

- **File**: `src/components/features/ai-detection/ConfirmDialog.tsx`
- **Action**: CREATE
- **Implement**: Create a reusable confirmation dialog with the following props:
  - `open: boolean` — controls dialog visibility
  - `onOpenChange: (open: boolean) => void` — callback when open state changes
  - `title: string` — dialog title (e.g., "Approve Threat?")
  - `description: string` — dialog description/message
  - `confirmLabel: string` — confirm button text (e.g., "Approve")
  - `onConfirm: () => void` — callback when confirm is clicked
  - `variant?: 'default' | 'destructive'` — controls confirm button styling
  - `isPending?: boolean` — shows loading spinner and disables buttons during API call

  Component structure:
  ```tsx
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="bg-[#0C0D10] border-zinc-800/50">
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} disabled={isPending}>
          {isPending && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  ```
- **Mirror**: DetectionDetailModal.tsx:16-21 (component pattern)
- **Validate**: `pnpm run build` succeeds
- **Notes**: Use `@radix-ui/react-alert-dialog` primitives. Style with existing dark theme colors (`bg-[#0C0D10]`, `border-zinc-800/50`). The `destructive` variant should use red styling for the confirm button.

### Task 3: Integrate ConfirmDialog into DetectionDetailModal

- **File**: `src/components/features/ai-detection/DetectionDetailModal.tsx`
- **Action**: UPDATE
- **Implement**:
  1. Import `ConfirmDialog` component
  2. Add state variables:
     - `confirmOpen: boolean` — controls confirm dialog visibility
     - `confirmAction: 'approve' | 'dismiss' | null` — tracks which action is pending
  3. Wrap the existing approve button click handler to open confirm dialog with:
     - title: "Approve Threat?"
     - description: "Approve this threat? This will mark it as confirmed and may trigger automated responses."
     - variant: 'destructive'
     - onConfirm: calls `onApprove(d)`
  4. Wrap the existing dismiss button click handler to open confirm dialog with:
     - title: "Dismiss Threat?"
     - description: "Dismiss this threat? This will mark it as a false positive."
     - variant: 'default'
     - onConfirm: calls `onDismiss(d)`
  5. Add the `ConfirmDialog` component at the end of the modal
- **Mirror**: DetectionDetailModal.tsx:201-221 (existing button section)
- **Validate**: `pnpm run build` succeeds
- **Notes**: Keep the existing button styles. The confirm dialog provides the safety net before the action executes. Loading state can be managed locally or passed via props if needed.

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

- [ ] AlertDialog primitive installed in `src/components/ui/alert-dialog.tsx`
- [ ] ConfirmDialog component created with proper dark theme styling
- [ ] ConfirmDialog supports 'approve' and 'dismiss' variants
- [ ] ConfirmDialog shows loading state during API calls
- [ ] DetectionDetailModal wraps approve button with ConfirmDialog
- [ ] DetectionDetailModal wraps dismiss button with ConfirmDialog
- [ ] Cancel closes dialog without taking action
- [ ] Confirm triggers the original callback (onApprove/onDismiss)
- [ ] Type check passes
- [ ] Lint passes
