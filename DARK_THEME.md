# Dark Theme Color Palette

This document outlines the dark theme color choices used in this project. The theme uses a sophisticated dark blue-gray palette with high contrast for readability.

## Color System

All colors are defined using HSL (Hue, Saturation, Lightness) format in CSS custom properties.

### Base Colors

#### Background & Surface Colors
- **`--background`**: `240 10% 3.9%` → `hsl(240, 10%, 3.9%)` → `#09090b`
  - Very dark blue-gray, almost black
  - Main background color for the entire application

- **`--card`**: `240 10% 3.9%` → `hsl(240, 10%, 3.9%)` → `#09090b`
  - Same as background for seamless card integration

- **`--popover`**: `240 10% 3.9%` → `hsl(240, 10%, 3.9%)` → `#09090b`
  - Consistent background for popover elements

#### Text Colors
- **`--foreground`**: `0 0% 98%` → `hsl(0, 0%, 98%)` → `#fafafa`
  - Almost white, high contrast primary text color

- **`--card-foreground`**: `0 0% 98%` → `hsl(0, 0%, 98%)` → `#fafafa`
  - Text on card surfaces

- **`--popover-foreground`**: `0 0% 98%` → `hsl(0, 0%, 98%)` → `#fafafa`
  - Text on popover surfaces

### Interactive Elements

#### Primary
- **`--primary`**: `0 0% 98%` → `hsl(0, 0%, 98%)` → `#fafafa`
  - Light/white for primary actions

- **`--primary-foreground`**: `240 5.9% 10%` → `hsl(240, 5.9%, 10%)` → `#18181b`
  - Very dark for text on primary buttons

#### Secondary & Muted
- **`--secondary`**: `240 3.7% 15.9%` → `hsl(240, 3.7%, 15.9%)` → `#27272a`
  - Dark gray-blue for secondary elements

- **`--secondary-foreground`**: `0 0% 98%` → `hsl(0, 0%, 98%)` → `#fafafa`
  - Light text on secondary elements

- **`--muted`**: `240 3.7% 15.9%` → `hsl(240, 3.7%, 15.9%)` → `#27272a`
  - Subtle background for muted elements

- **`--muted-foreground`**: `240 5% 64.9%` → `hsl(240, 5%, 64.9%)` → `#a1a1aa`
  - Medium gray for less prominent text

#### Accent
- **`--accent`**: `240 3.7% 15.9%` → `hsl(240, 3.7%, 15.9%)` → `#27272a`
  - Dark gray-blue for accent elements

- **`--accent-foreground`**: `0 0% 98%` → `hsl(0, 0%, 98%)` → `#fafafa`
  - Light text on accent elements

### Feedback Colors

#### Destructive/Error
- **`--destructive`**: `0 62.8% 30.6%` → `hsl(0, 62.8%, 30.6%)` → `#7f1d1d`
  - Dark red for destructive actions and errors

- **`--destructive-foreground`**: `0 0% 98%` → `hsl(0, 0%, 98%)` → `#fafafa`
  - Light text on destructive elements

### UI Elements

#### Borders & Inputs
- **`--border`**: `240 3.7% 15.9%` → `hsl(240, 3.7%, 15.9%)` → `#27272a`
  - Subtle borders that don't overpower the UI

- **`--input`**: `240 3.7% 15.9%` → `hsl(240, 3.7%, 15.9%)` → `#27272a`
  - Input field background color

- **`--ring`**: `240 4.9% 83.9%` → `hsl(240, 4.9%, 83.9%)` → `#d4d4d8`
  - Light gray for focus rings and outlines

## Design Philosophy

### Why These Colors?

1. **Dark Blue-Gray Base** (`240 10% 3.9%`): Provides a sophisticated alternative to pure black, reducing eye strain while maintaining a modern aesthetic. The slight blue hue (240°) gives warmth without being overbearing.

2. **Minimal Saturation**: Most colors have very low saturation (3.7-10%), creating a professional, neutral palette that won't cause visual fatigue during extended use.

3. **High Contrast Text**: The foreground color (`98%` lightness) against the background (`3.9%` lightness) provides excellent readability with a contrast ratio well above WCAG AAA standards.

4. **Consistent Secondary Elements**: Using the same value (`240 3.7% 15.9%`) for secondary, muted, accent, border, and input creates visual harmony while maintaining subtle differentiation through context.

5. **Subtle Hierarchy**: The muted foreground (`64.9%` lightness) is noticeably lighter than the background but darker than primary text, creating clear information hierarchy.

## Additional Theme Elements

### Custom Accent Colors (from styles)
- **Online Status**: `#10b981` (green with pulse animation)
- **Offline Status**: `#ef4444` (red with pulse animation)
- **Focus Outline**: `#2563eb` (blue, 2px solid)

### Scrollbar
- **Thumb**: `rgba(75, 85, 99, 0.5)` with hover state at `0.7` opacity
- **Track**: Transparent
- **Width**: 6px

## Usage in Code

```css
.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --card: 240 10% 3.9%;
  --card-foreground: 0 0% 98%;
  --popover: 240 10% 3.9%;
  --popover-foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;
  --secondary: 240 3.7% 15.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 3.7% 15.9%;
  --input: 240 3.7% 15.9%;
  --ring: 240 4.9% 83.9%;
}
```

These values are used with Tailwind CSS utility classes and can be referenced as `bg-background`, `text-foreground`, etc.

## Color Palette Summary

| Purpose | HSL | HEX | Description |
|---------|-----|-----|-------------|
| Background | 240 10% 3.9% | #09090b | Very dark blue-gray |
| Foreground | 0 0% 98% | #fafafa | Almost white |
| Secondary | 240 3.7% 15.9% | #27272a | Dark gray-blue |
| Muted Text | 240 5% 64.9% | #a1a1aa | Medium gray |
| Destructive | 0 62.8% 30.6% | #7f1d1d | Dark red |
| Focus Ring | 240 4.9% 83.9% | #d4d4d8 | Light gray |
