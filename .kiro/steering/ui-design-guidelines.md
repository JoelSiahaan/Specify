# UI Design Guidelines

## Purpose

This document defines the UI/UX design standards and visual styling guidelines for the LMS frontend. The design follows the **tech stack first** (React + Tailwind CSS), then incorporates **Moodle-inspired aesthetics** with modern, clean, and functional interface patterns that prioritize usability and accessibility.

---

## Design Philosophy

**Design Principles (Priority Order):**
1. **Tech Stack Compliance**: Follow React 19.2 + Tailwind CSS patterns
2. **Website-First Approach**: Design for desktop/laptop users first, then adapt for mobile
3. **Moodle-Inspired Aesthetics**: Clean, functional interface similar to Moodle Boost theme
4. **Intuitive Navigation**: Clear hierarchy and easy-to-find features
5. **Accessibility First**: WCAG 2.1 AA compliance

**Key Characteristics:**
- Tailwind CSS utility-first styling (NOT Bootstrap)
- Card-based content organization
- Sidebar navigation for course content
- Top navigation bar for global actions
- Breadcrumb navigation for context
- Clear visual hierarchy with typography
- Responsive design (desktop → tablet → mobile)

---

## Color Palette

### Primary Colors (Moodle-Inspired)

**Primary Blue** (Main brand color, similar to Moodle default):
- Primary: `#0f6cbf` (Moodle blue)
- Primary Dark: `#0a5391`
- Primary Light: `#3d8fd1`
- Primary Lighter: `#e3f2fd`

**Secondary Colors**:
- Secondary: `#6c757d` (Gray for secondary actions)
- Success: `#28a745` (Green for success states)
- Warning: `#ffc107` (Yellow for warnings)
- Danger: `#dc3545` (Red for errors/delete actions)
- Info: `#17a2b8` (Cyan for informational messages)

### Neutral Colors

**Grayscale**:
- White: `#ffffff`
- Gray 100: `#f8f9fa` (Background)
- Gray 200: `#e9ecef` (Borders, dividers)
- Gray 300: `#dee2e6`
- Gray 400: `#ced4da`
- Gray 500: `#adb5bd` (Disabled text)
- Gray 600: `#6c757d` (Secondary text)
- Gray 700: `#495057`
- Gray 800: `#343a40` (Primary text)
- Gray 900: `#212529` (Headings)
- Black: `#000000`

### Semantic Colors

**Status Colors**:
- Not Submitted: `#6c757d` (Gray)
- Submitted: `#17a2b8` (Info blue)
- Graded: `#28a745` (Success green)
- Late: `#ffc107` (Warning yellow)
- Overdue: `#dc3545` (Danger red)
- Active: `#28a745` (Success green)
- Archived: `#6c757d` (Gray)

---

## Typography

### Font Family

**Primary Font**: System font stack (similar to Moodle Boost)
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
             "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", 
             "Segoe UI Emoji", "Segoe UI Symbol";
```

**Alternative**: Use Google Fonts if custom branding needed
- Headings: `'Roboto', sans-serif` or `'Open Sans', sans-serif`
- Body: `'Open Sans', sans-serif` or `'Lato', sans-serif`

### Font Sizes

**Base**: 16px (1rem)

**Scale**:
- H1: 2.5rem (40px) - Page titles
- H2: 2rem (32px) - Section headings
- H3: 1.75rem (28px) - Subsection headings
- H4: 1.5rem (24px) - Card titles
- H5: 1.25rem (20px) - Small headings
- H6: 1rem (16px) - Smallest headings
- Body: 1rem (16px) - Default text
- Small: 0.875rem (14px) - Helper text, captions
- Tiny: 0.75rem (12px) - Labels, badges

### Font Weights

- Light: 300 (rarely used)
- Regular: 400 (body text)
- Medium: 500 (emphasis)
- Semibold: 600 (headings)
- Bold: 700 (strong emphasis)

### Line Heights

- Headings: 1.2
- Body: 1.5
- Small text: 1.4

---

## Layout Structure

### Grid System

**Tailwind CSS Grid** (12-column responsive grid):
- Container max-width: `max-w-7xl` (1280px on large screens)
- Padding: `px-4` (16px) on mobile, `px-6` (24px) on desktop
- Breakpoints (Tailwind default):
  - sm: ≥ 640px (small tablets)
  - md: ≥ 768px (tablets)
  - lg: ≥ 1024px (desktops)
  - xl: ≥ 1280px (large desktops)
  - 2xl: ≥ 1536px (extra large)

**Note**: Default (< 640px) is for mobile devices.

### Page Layout (Moodle-Inspired)

**Three-Column Layout** (similar to Moodle):
```
┌─────────────────────────────────────────────┐
│           Top Navigation Bar                │
├─────────────────────────────────────────────┤
│  Sidebar  │   Main Content   │  (Optional)  │
│  (Left)   │                  │   Sidebar    │
│  240px    │    Flexible      │   (Right)    │
│           │                  │              │
└─────────────────────────────────────────────┘
```

**Responsive Behavior (Website-First)**:
- Desktop (≥ 1024px): Sidebar visible, main content centered
- Tablet (768px - 1023px): Collapsible sidebar, full-width content
- Mobile (< 768px): Hidden sidebar (hamburger menu), full-width content

### Spacing System

**Tailwind CSS spacing scale**:
- 0: 0
- 1: 0.25rem (4px)
- 2: 0.5rem (8px)
- 3: 0.75rem (12px)
- 4: 1rem (16px)
- 5: 1.25rem (20px)
- 6: 1.5rem (24px)
- 8: 2rem (32px)
- 10: 2.5rem (40px)
- 12: 3rem (48px)

**Usage**:
- Padding: `p-{size}`, `px-{size}`, `py-{size}`, `pt-{size}`, etc.
- Margin: `m-{size}`, `mx-{size}`, `my-{size}`, `mt-{size}`, etc.
- Gap: `gap-{size}` for flex/grid spacing

---

## Components

### Navigation

#### Top Navigation Bar (Header)

**Structure**:
- Height: 56px
- Background: Primary blue (`#0f6cbf`)
- Text color: White
- Fixed position at top

**Elements**:
- Logo/Brand (left)
- Navigation links (center)
- User menu (right)
- Notifications icon (right)
- Search bar (optional, right)

**Example**:
```
┌────────────────────────────────────────────────┐
│ [Logo] Home Courses  [Search]  [🔔] [Profile▼]│
└────────────────────────────────────────────────┘
```

#### Sidebar Navigation (Course Context)

**Structure**:
- Width: 240px (desktop)
- Background: White or Gray 100
- Border-right: 1px solid Gray 200

**Elements**:
- Course name (header)
- Navigation items (list)
- Active state: Primary blue background
- Hover state: Gray 100 background

**Example**:
```
┌──────────────────┐
│ Course Name      │
├──────────────────┤
│ ▶ Dashboard      │
│ ▶ Materials      │
│ ▶ Assignments    │
│ ▶ Quizzes        │
│ ▶ Grades         │
└──────────────────┘
```

#### Breadcrumb Navigation

**Structure**:
- Font size: 0.875rem (14px)
- Color: Gray 600
- Separator: `/` or `>`

**Example**:
```
Home > Courses > Introduction to Programming > Assignments
```

### Cards

**Card Component** (primary content container):

**Structure (Tailwind CSS)**:
```tsx
className="bg-white border border-gray-200 rounded shadow-sm p-6"
```
- Background: `bg-white`
- Border: `border border-gray-200` (1px solid)
- Border-radius: `rounded` (0.25rem / 4px)
- Box-shadow: `shadow-sm` (subtle shadow)
- Padding: `p-6` (1.5rem / 24px)

**Variants**:
- Default: `bg-white`
- Highlighted: `bg-blue-50` (primary lighter)
- Warning: `bg-yellow-50`
- Danger: `bg-red-50`

**Example**:
```tsx
<div className="bg-white border border-gray-200 rounded shadow-sm p-6">
  <h3 className="text-xl font-semibold mb-4">Card Title</h3>
  <p className="text-gray-700 mb-4">Card content goes here...</p>
  <button className="bg-primary text-white py-2 px-4 rounded">
    Action Button
  </button>
</div>
```

### Buttons

**Button Styles** (Tailwind CSS):

**Primary Button**:
```tsx
className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded transition-colors duration-150"
```
- Background: `bg-primary` (Moodle blue `#0f6cbf`)
- Text: `text-white`
- Hover: `hover:bg-primary-dark` (`#0a5391`)
- Border-radius: `rounded` (0.25rem / 4px)
- Padding: `py-2 px-4` (8px 16px)

**Secondary Button**:
```tsx
className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition-colors duration-150"
```

**Success Button**:
```tsx
className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors duration-150"
```

**Danger Button**:
```tsx
className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors duration-150"
```

**Outline Button**:
```tsx
className="bg-transparent border border-primary text-primary hover:bg-primary hover:text-white font-medium py-2 px-4 rounded transition-colors duration-150"
```

**Button Sizes**:
- Small: `py-1.5 px-3 text-sm` (6px 12px, 14px font)
- Default: `py-2 px-4 text-base` (8px 16px, 16px font)
- Large: `py-3 px-6 text-lg` (12px 24px, 18px font)

### Forms

**Form Elements (Tailwind CSS)**:

**Input Fields**:
```tsx
className="w-full h-10 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
```
- Height: `h-10` (40px)
- Border: `border border-gray-300`
- Border-radius: `rounded` (0.25rem / 4px)
- Padding: `px-3 py-2` (12px 8px)
- Focus: `focus:ring-2 focus:ring-primary focus:border-transparent`

**Labels**:
```tsx
className="block font-medium text-gray-800 mb-2"
```
- Font-weight: `font-medium` (500)
- Margin-bottom: `mb-2` (0.5rem / 8px)
- Color: `text-gray-800`

**Helper Text**:
```tsx
className="text-sm text-gray-600 mt-1"
```
- Font-size: `text-sm` (0.875rem / 14px)
- Color: `text-gray-600`
- Margin-top: `mt-1` (0.25rem / 4px)

**Error State**:
```tsx
className="border-red-500 focus:ring-red-500"
// Helper text
className="text-sm text-red-600 mt-1"
```

**Success State**:
```tsx
className="border-green-500 focus:ring-green-500"
// Helper text
className="text-sm text-green-600 mt-1"
```

**Form Layout**:
- Vertical stacking: `space-y-4` (default)
- Horizontal layout: `flex gap-4` for short forms
- Grid layout: `grid grid-cols-2 gap-4` for complex forms

### Tables

**Table Styles** (Moodle-inspired):

**Structure**:
- Border: 1px solid Gray 200
- Header background: Gray 100
- Row hover: Gray 50
- Striped rows: Alternate Gray 50 background

**Header**:
- Font-weight: 600 (semibold)
- Padding: 0.75rem (12px)
- Border-bottom: 2px solid Gray 300

**Cells**:
- Padding: 0.75rem (12px)
- Border-bottom: 1px solid Gray 200

**Responsive**:
- Horizontal scroll on mobile
- Stack columns on very small screens

### Badges

**Badge Component** (status indicators):

**Structure**:
- Font-size: 0.75rem (12px)
- Font-weight: 600 (semibold)
- Padding: 0.25rem 0.5rem (4px 8px)
- Border-radius: 0.25rem (4px)

**Variants**:
- Primary: Primary blue background, white text
- Success: Success green background, white text
- Warning: Warning yellow background, dark text
- Danger: Danger red background, white text
- Info: Info cyan background, white text
- Secondary: Gray 600 background, white text

**Usage**:
- Course status (Active, Archived)
- Submission status (Submitted, Graded, Late)
- Role indicators (Student, Teacher)

### Alerts

**Alert Component** (notifications, messages):

**Structure**:
- Padding: 1rem (16px)
- Border-radius: 0.25rem (4px)
- Border-left: 4px solid (color variant)
- Background: Light variant of color

**Variants**:
- Success: Green border, light green background
- Warning: Yellow border, light yellow background
- Danger: Red border, light red background
- Info: Blue border, light blue background

**Elements**:
- Icon (left)
- Title (optional, bold)
- Message text
- Close button (right, optional)

### Modals

**Modal Component** (dialogs, confirmations):

**Structure**:
- Backdrop: Semi-transparent black (rgba(0,0,0,0.5))
- Modal: White background, centered
- Max-width: 500px (small), 800px (large)
- Border-radius: 0.5rem (8px)
- Box-shadow: 0 4px 6px rgba(0,0,0,0.1)

**Elements**:
- Header: Title, close button
- Body: Content
- Footer: Action buttons (right-aligned)

### Loading States

**Loading Indicators**:

**Spinner**:
- Size: 1rem (small), 2rem (default), 3rem (large)
- Color: Primary blue
- Animation: Rotate 360deg, 1s linear infinite

**Skeleton Loader**:
- Background: Gray 200
- Animation: Shimmer effect
- Use for cards, lists, tables

**Progress Bar**:
- Height: 0.5rem (8px)
- Background: Gray 200
- Fill: Primary blue
- Border-radius: 0.25rem (4px)

---

## Iconography

### Icon Library

**Recommended**: Bootstrap Icons or Font Awesome (free version)

**Icon Sizes**:
- Small: 16px
- Default: 20px
- Large: 24px
- Extra Large: 32px

**Common Icons**:
- Home: 🏠
- Courses: 📚
- Assignments: 📝
- Quizzes: ❓
- Grades: 📊
- Materials: 📄
- Upload: ⬆️
- Download: ⬇️
- Edit: ✏️
- Delete: 🗑️
- Archive: 📦
- Search: 🔍
- Notifications: 🔔
- User: 👤
- Settings: ⚙️
- Logout: 🚪

---

## Accessibility

### WCAG 2.1 AA Compliance

**Color Contrast**:
- Normal text: Minimum 4.5:1 contrast ratio
- Large text (18pt+): Minimum 3:1 contrast ratio
- UI components: Minimum 3:1 contrast ratio

**Keyboard Navigation**:
- All interactive elements must be keyboard accessible
- Visible focus indicators (outline or box-shadow)
- Logical tab order

**Screen Reader Support**:
- Semantic HTML (use proper heading hierarchy)
- ARIA labels for icons and buttons
- Alt text for images
- Form labels properly associated

**Responsive Text**:
- Minimum font size: 14px (0.875rem)
- Text must be resizable up to 200%
- No horizontal scrolling at 320px width

---

## Responsive Design

### Website-First Approach

**Breakpoint Strategy**:
1. Design for desktop/laptop first (≥ 1024px)
2. Adapt for tablets (768px - 1023px)
3. Simplify for mobile (< 768px)
4. Test on real devices

**Desktop Optimizations** (Primary Focus):
- Three-column layouts
- Persistent sidebar
- Hover states
- Keyboard shortcuts
- Larger content areas

**Tablet Optimizations**:
- Two-column layouts
- Collapsible sidebar
- Touch-friendly targets (minimum 44x44px)
- Simplified navigation

**Mobile Optimizations**:
- Single column layouts (stacked)
- Hidden sidebar (hamburger menu)
- Touch-friendly targets (minimum 44x44px)
- Larger font sizes (minimum 16px to prevent zoom)
- Bottom navigation for primary actions (optional)

**Tailwind Responsive Classes**:
```tsx
// Desktop first, then adapt
className="w-64 md:w-48 sm:w-full"  // 256px desktop, 192px tablet, full mobile

// Show/hide based on screen size
className="hidden lg:block"  // Show only on desktop
className="block lg:hidden"  // Show only on mobile/tablet
```

---

## Animation and Transitions

### Subtle Animations

**Transition Duration**:
- Fast: 150ms (hover states)
- Default: 300ms (most transitions)
- Slow: 500ms (complex animations)

**Easing Functions**:
- Ease-in-out: Default for most transitions
- Ease-out: For entering elements
- Ease-in: For exiting elements

**Common Transitions**:
- Button hover: background-color 150ms ease-in-out
- Card hover: box-shadow 300ms ease-in-out
- Modal open: opacity 300ms ease-out, transform 300ms ease-out
- Dropdown: max-height 300ms ease-in-out

**Avoid**:
- Excessive animations (distracting)
- Long animations (> 500ms)
- Animations on page load (performance)

---

## Dark Mode (Future Enhancement)

**Not implemented in initial version**, but design should consider:
- Use CSS variables for colors
- Avoid hardcoded color values
- Test contrast in both light and dark modes

---

## Implementation Guidelines

### CSS Architecture

**Approach**: Utility-first with Tailwind CSS

**Tailwind Configuration** (`tailwind.config.js`):
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0f6cbf',  // Moodle blue
          dark: '#0a5391',
          light: '#3d8fd1',
          lighter: '#e3f2fd',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
```

**Global Styles** (`src/index.css`):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply font-sans text-gray-800 bg-gray-50;
  }
  
  h1 {
    @apply text-4xl font-semibold text-gray-900;
  }
  
  h2 {
    @apply text-3xl font-semibold text-gray-900;
  }
  
  h3 {
    @apply text-2xl font-semibold text-gray-900;
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded transition-colors duration-150;
  }
  
  .btn-secondary {
    @apply bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition-colors duration-150;
  }
  
  .card {
    @apply bg-white border border-gray-200 rounded shadow-sm p-6;
  }
  
  .input {
    @apply w-full h-10 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent;
  }
}
```

**File Structure**:
```
src/
├── index.css              # Tailwind directives + global styles
├── presentation/
│   └── web/
│       ├── components/
│       │   └── shared/    # Reusable components
│       │       ├── Button.tsx
│       │       ├── Card.tsx
│       │       ├── Input.tsx
│       │       └── ...
│       └── ...
└── ...
```

### Component Development

**React Component Structure with Tailwind CSS**:
```tsx
// Example: Button component
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  className = ''
}) => {
  const baseClasses = 'font-medium rounded transition-colors duration-150';
  
  const variantClasses = {
    primary: 'bg-primary hover:bg-primary-dark text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };
  
  const sizeClasses = {
    sm: 'py-1.5 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-6 text-lg',
  };
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
```

**Shared Components** (create in `src/presentation/web/components/shared/`):
- Button
- Input
- Card
- Modal
- Alert
- Badge
- Spinner
- Table
- Dropdown
- Breadcrumb
- Pagination

---

## Design Checklist

For each new feature/component, verify:

- [ ] Follows Moodle-inspired visual style
- [ ] Uses defined color palette
- [ ] Uses consistent typography
- [ ] Responsive on all breakpoints
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Keyboard navigable
- [ ] Screen reader friendly
- [ ] Touch-friendly on mobile
- [ ] Loading states implemented
- [ ] Error states handled
- [ ] Empty states designed
- [ ] Consistent spacing
- [ ] Proper visual hierarchy

---

## References

- **Moodle UI Component Library**: https://componentlibrary.moodle.com/
- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **Material Design** (for inspiration): https://material.io/design
- **Moodle Boost Theme**: Default Moodle theme (reference for visual style)

---


**Remember**: Good UI design improves user experience, reduces cognitive load, and makes the LMS easier to use. Always prioritize usability over aesthetics, and test with real users when possible.
