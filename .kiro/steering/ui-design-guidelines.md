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

**Two-Column Layout** (similar to Moodle):
```
┌─────────────────────────────────────────────┐
│           Top Navigation Bar                │
├─────────────────────────────────────────────┤
│  Sidebar  │   Main Content Area             │
│  (Left)   │                                 │
│  240px    │    Flexible Width               │
│           │                                 │
│           │                                 │
└─────────────────────────────────────────────┘
```

**Layout Characteristics**:
- **Left Sidebar**: 240px fixed width, persistent navigation
- **Main Content**: Flexible width, fills remaining space
- **No Right Sidebar**: Cleaner, more focused layout
- **Breadcrumb**: Above main content for context

**Responsive Behavior (Website-First)**:
- Desktop (≥ 1024px): Sidebar visible, main content fills remaining space
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

## LMS-Specific Components

### Quiz Timer Component

**Purpose**: Display remaining time during quiz taking with visual warnings

**Structure**:
```tsx
className="fixed top-20 right-4 bg-white border-2 border-gray-300 rounded-lg shadow-lg p-4 min-w-[200px]"
```

**States**:
- **Normal** (> 5 minutes): Gray border, black text
- **Warning** (2-5 minutes): Yellow border (`border-yellow-500`), yellow text
- **Critical** (< 2 minutes): Red border (`border-red-500`), red text, pulsing animation

**Example**:
```tsx
<div className="fixed top-20 right-4 bg-white border-2 border-gray-300 rounded-lg shadow-lg p-4 min-w-[200px]">
  <div className="flex items-center gap-2">
    <span className="text-2xl">⏱️</span>
    <div>
      <p className="text-sm text-gray-600">Time Remaining</p>
      <p className="text-2xl font-bold text-gray-900">15:30</p>
    </div>
  </div>
</div>

{/* Warning State */}
<div className="fixed top-20 right-4 bg-white border-2 border-yellow-500 rounded-lg shadow-lg p-4">
  <p className="text-2xl font-bold text-yellow-600">03:45</p>
</div>

{/* Critical State */}
<div className="fixed top-20 right-4 bg-white border-2 border-red-500 rounded-lg shadow-lg p-4 animate-pulse">
  <p className="text-2xl font-bold text-red-600">01:20</p>
</div>
```

**Behavior**:
- Fixed position (top-right corner)
- Updates every second
- Auto-submit when timer reaches 00:00
- Warning at 5 minutes remaining
- Critical warning at 2 minutes remaining

---

### File Upload Component

**Purpose**: Upload files with drag & drop, progress tracking, and validation

**Structure**:
```tsx
className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors"
```

**States**:
- **Default**: Dashed gray border
- **Hover**: Primary blue border
- **Drag Over**: Primary blue background (`bg-blue-50`)
- **Uploading**: Progress bar visible
- **Success**: Green checkmark, file preview
- **Error**: Red border, error message

**Example**:
```tsx
{/* Default State */}
<div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
  <div className="flex flex-col items-center gap-4">
    <span className="text-5xl">📁</span>
    <div>
      <p className="text-lg font-medium text-gray-700">Drop files here or click to browse</p>
      <p className="text-sm text-gray-500 mt-1">PDF, DOCX, or images (max 10MB)</p>
    </div>
  </div>
</div>

{/* Uploading State */}
<div className="border-2 border-primary rounded-lg p-6">
  <div className="flex items-center gap-4">
    <span className="text-3xl">📄</span>
    <div className="flex-1">
      <p className="font-medium text-gray-900">assignment.pdf</p>
      <div className="mt-2 bg-gray-200 rounded-full h-2">
        <div className="bg-primary h-2 rounded-full" style={{width: '65%'}}></div>
      </div>
      <p className="text-sm text-gray-600 mt-1">Uploading... 65%</p>
    </div>
  </div>
</div>

{/* Success State */}
<div className="border-2 border-green-500 rounded-lg p-6 bg-green-50">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <span className="text-3xl">📄</span>
      <div>
        <p className="font-medium text-gray-900">assignment.pdf</p>
        <p className="text-sm text-gray-600">2.5 MB</p>
      </div>
    </div>
    <span className="text-2xl text-green-600">✓</span>
  </div>
</div>

{/* Error State */}
<div className="border-2 border-red-500 rounded-lg p-6 bg-red-50">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <span className="text-3xl">📄</span>
      <div>
        <p className="font-medium text-gray-900">large-file.pdf</p>
        <p className="text-sm text-red-600">File exceeds 10MB limit</p>
      </div>
    </div>
    <button className="text-primary hover:text-primary-dark">Retry</button>
  </div>
</div>
```

**Features**:
- Drag and drop support
- File type validation (PDF, DOCX, images)
- File size validation (max 10MB)
- Upload progress indicator
- File preview after upload
- Remove/replace file option
- Multiple file upload support (for materials)

---

### Rich Text Editor Component

**Purpose**: Allow formatted text input for descriptions, feedback, and content

**Recommended Library**: TipTap or React-Quill

**Structure**:
```tsx
className="border border-gray-300 rounded-lg overflow-hidden"
```

**Toolbar**:
```tsx
<div className="bg-gray-100 border-b border-gray-300 p-2 flex gap-1">
  <button className="p-2 hover:bg-gray-200 rounded">B</button>
  <button className="p-2 hover:bg-gray-200 rounded">I</button>
  <button className="p-2 hover:bg-gray-200 rounded">U</button>
  {/* More formatting buttons */}
</div>
```

**Editor Area**:
```tsx
<div className="p-4 min-h-[200px] max-h-[400px] overflow-y-auto focus:outline-none focus:ring-2 focus:ring-primary">
  {/* Editable content */}
</div>
```

**Allowed Formatting**:
- Bold, Italic, Underline
- Headings (H1-H3)
- Bullet lists, Numbered lists
- Links
- Code blocks (for programming courses)

**Security**:
- Sanitize HTML with DOMPurify before rendering
- Whitelist allowed tags only
- Strip dangerous attributes (onclick, onerror, etc.)

---

### Grade Display Component

**Purpose**: Show grades with visual feedback and status

**Variants**:

**Badge Style** (for lists):
```tsx
{/* Graded */}
<span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
  <span>85/100</span>
  <span className="text-green-600">✓</span>
</span>

{/* Not Graded */}
<span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
  Pending
</span>

{/* Late Submission */}
<span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
  <span>75/100</span>
  <span className="text-yellow-600">⚠</span>
</span>
```

**Card Style** (for details):
```tsx
<div className="bg-white border border-gray-200 rounded-lg p-6">
  <div className="text-center">
    <p className="text-sm text-gray-600 mb-2">Your Grade</p>
    <p className="text-5xl font-bold text-green-600">85</p>
    <p className="text-lg text-gray-500 mt-1">out of 100</p>
  </div>
  {feedback && (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <p className="text-sm font-medium text-gray-700 mb-2">Feedback:</p>
      <p className="text-gray-600">{feedback}</p>
    </div>
  )}
</div>
```

**Color Coding**:
- 90-100: Green (`text-green-600`)
- 75-89: Blue (`text-blue-600`)
- 60-74: Yellow (`text-yellow-600`)
- < 60: Red (`text-red-600`)

---

### Course Card Component

**Purpose**: Display course information in grid/list view

**Structure**:
```tsx
<div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
  {/* Header with status badge */}
  <div className="bg-primary p-4 text-white">
    <div className="flex justify-between items-start">
      <h3 className="text-xl font-semibold">Introduction to Programming</h3>
      <span className="px-2 py-1 bg-green-500 rounded text-xs font-semibold">ACTIVE</span>
    </div>
    <p className="text-sm text-blue-100 mt-1">ABC123</p>
  </div>
  
  {/* Body */}
  <div className="p-4">
    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
      Learn programming basics with Python...
    </p>
    
    {/* Footer info */}
    <div className="flex items-center justify-between text-sm text-gray-500">
      <div className="flex items-center gap-1">
        <span>👤</span>
        <span>John Doe</span>
      </div>
      <div className="flex items-center gap-1">
        <span>👥</span>
        <span>25 students</span>
      </div>
    </div>
  </div>
</div>
```

**Hover Effect**:
- Elevate shadow from `shadow-sm` to `shadow-md`
- Smooth transition (300ms)

**Responsive**:
- Desktop: 3 columns grid
- Tablet: 2 columns grid
- Mobile: 1 column (full width)

---

### Assignment/Quiz List Item Component

**Purpose**: Display assignment or quiz in a list with status and due date

**Structure**:
```tsx
<div className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
  <div className="flex items-start justify-between">
    {/* Left: Icon and info */}
    <div className="flex gap-4 flex-1">
      <span className="text-3xl">📝</span>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900">Assignment 1: Variables</h4>
        <p className="text-sm text-gray-600 mt-1">Due: Jan 20, 2025 at 11:59 PM</p>
        
        {/* Status indicator */}
        <div className="mt-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
            <span>✓</span>
            <span>Submitted</span>
          </span>
        </div>
      </div>
    </div>
    
    {/* Right: Grade or action */}
    <div className="text-right">
      <span className="text-2xl font-bold text-green-600">85</span>
      <p className="text-xs text-gray-500">/ 100</p>
    </div>
  </div>
</div>
```

**Status Variants**:
```tsx
{/* Not Submitted */}
<span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
  Not Submitted
</span>

{/* Submitted (pending grade) */}
<span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
  Submitted
</span>

{/* Graded */}
<span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
  <span>✓</span>
  <span>Graded</span>
</span>

{/* Late */}
<span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
  <span>⚠</span>
  <span>Late</span>
</span>

{/* Overdue */}
<span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
  <span>!</span>
  <span>Overdue</span>
</span>
```

**Due Date Formatting**:
- Same day: "Today at 11:59 PM"
- Tomorrow: "Tomorrow at 11:59 PM"
- This week: "Monday at 11:59 PM"
- Future: "Jan 20, 2025 at 11:59 PM"
- Past: "Jan 15, 2025 at 11:59 PM" (red text if overdue)

---

### Submission Status Indicator

**Purpose**: Visual indicator for submission status in teacher grading view

**Icon + Color Combinations**:
```tsx
{/* Not Submitted */}
<div className="flex items-center gap-2 text-gray-600">
  <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
  <span>Not Submitted</span>
</div>

{/* Submitted */}
<div className="flex items-center gap-2 text-blue-600">
  <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
  <span>Submitted</span>
</div>

{/* Graded */}
<div className="flex items-center gap-2 text-green-600">
  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
  <span>Graded</span>
</div>

{/* Late */}
<div className="flex items-center gap-2 text-yellow-600">
  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
  <span>Late</span>
</div>
```

---

### Statistics Card Component

**Purpose**: Display metrics on dashboards (enrollment count, submission count, etc.)

**Structure**:
```tsx
<div className="bg-white border border-gray-200 rounded-lg p-6">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-600 mb-1">Total Students</p>
      <p className="text-3xl font-bold text-gray-900">125</p>
      <p className="text-sm text-green-600 mt-1">↑ 12% from last month</p>
    </div>
    <span className="text-4xl">👥</span>
  </div>
</div>
```

**Variants**:
- Total Courses
- Total Students
- Pending Submissions
- Average Grade
- Completion Rate

**Color Coding for Trends**:
- Positive: Green (`text-green-600`) with ↑
- Negative: Red (`text-red-600`) with ↓
- Neutral: Gray (`text-gray-600`) with →

---

## Page Layout Specifications

### Student Dashboard Layout (Moodle-Inspired)

**Structure** (Two-Column Layout):
```
┌─────────────────────────────────────────────────────────────┐
│                  Top Navigation Bar (56px)                  │
│  [Logo] Dashboard  My Courses        [🔔] [Profile ▼]      │
├──────────┬──────────────────────────────────────────────────┤
│ Left     │  Main Content Area                               │
│ Sidebar  │                                                  │
│ (240px)  │  ┌────────────────────────────────────────────┐ │
│          │  │  Welcome back, John!                       │ │
│ Dashboard│  │  Monday, Jan 20, 2025                      │ │
│ Site home│  └────────────────────────────────────────────┘ │
│ Calendar │                                                  │
│ My cours │  ┌────────────────────────────────────────────┐ │
│          │  │  My Courses                                │ │
│          │  │  ┌──────────────────────────────────────┐ │ │
│          │  │  │ [Active] [Archived] [All]            │ │ │
│          │  │  └──────────────────────────────────────┘ │ │
│          │  │                                            │ │ │
│          │  │  ┌──────┐ ┌──────┐ ┌──────┐              │ │
│          │  │  │Course│ │Course│ │Course│              │ │
│          │  │  │Card 1│ │Card 2│ │Card 3│              │ │
│          │  │  └──────┘ └──────┘ └──────┘              │ │
│          │  │  ┌──────┐ ┌──────┐                        │ │
│          │  │  │Course│ │Course│                        │ │
│          │  │  │Card 4│ │Card 5│                        │ │
│          │  │  └──────┘ └──────┘                        │ │
│          │  └────────────────────────────────────────────┘ │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

**Left Sidebar** (240px, persistent on desktop):
- Dashboard (home icon)
- Site home
- Calendar
- My courses (expandable list)
- More... (collapsible menu)

**Main Content Area** (flexible width):
- Welcome message with date
- My courses section with tab filters:
  - **Active Tab**: Shows only active courses (default)
  - **Archived Tab**: Shows only archived courses
  - **All Tab**: Shows all courses (active + archived)
- Course cards grid (3-column grid on desktop) with:
  - Course name and code
  - Teacher name
  - Status badge (Active/Archived)
  - Quick access button

**Tab Behavior**:
- **Active** (default): Display courses with status = ACTIVE
- **Archived**: Display courses with status = ARCHIVED
- **All**: Display all courses regardless of status

**Responsive Behavior**:
- Desktop (≥ 1024px): Two columns visible, 3-column course grid
- Tablet (768px - 1023px): Left sidebar collapsible, 2-column course grid
- Mobile (< 768px): Hamburger menu, 1-column course grid

---

### Teacher Dashboard Layout (Moodle-Inspired)

**Structure** (Two-Column Layout):
```
┌─────────────────────────────────────────────────────────────┐
│                  Top Navigation Bar (56px)                  │
│  [Logo] Dashboard  My Courses        [🔔] [Profile ▼]      │
├──────────┬──────────────────────────────────────────────────┤
│ Left     │  Main Content Area                               │
│ Sidebar  │                                                  │
│ (240px)  │  ┌────────────────────────────────────────────┐ │
│          │  │  Welcome, Prof. Smith!                     │ │
│ Dashboard│  │  Monday, Jan 20, 2025                      │ │
│ Site home│  └────────────────────────────────────────────┘ │
│ My cours │                                                  │
│ ▼ Intro  │  ┌────────────────────────────────────────────┐ │
│   to Prog│  │  My Courses                                │ │
│ ▼ Advancd│  │  ┌──────────────────────────────────────┐ │ │
│   Algo   │  │  │ [Active] [Archived] [All]            │ │ │
│          │  │  └──────────────────────────────────────┘ │ │
│          │  │                                            │ │ │
│          │  │  ┌──────────────────────────────────────┐ │ │
│          │  │  │ Introduction to Programming          │ │ │
│          │  │  │ ABC123 • 25 students • Active        │ │ │
│          │  │  │ [Manage] [Grade] [View]              │ │ │
│          │  │  └──────────────────────────────────────┘ │ │
│          │  │                                            │ │ │
│          │  │  ┌──────────────────────────────────────┐ │ │
│          │  │  │ Advanced Algorithms                  │ │ │
│          │  │  │ DEF456 • 18 students • Active        │ │ │
│          │  │  │ [Manage] [Grade] [View]              │ │ │
│          │  │  └──────────────────────────────────────┘ │ │
│          │  │                                            │ │ │
│          │  │  ┌──────────────────────────────────────┐ │ │
│          │  │  │ Data Structures                      │ │ │
│          │  │  │ GHI789 • 30 students • Active        │ │ │
│          │  │  │ [Manage] [Grade] [View]              │ │ │
│          │  │  └──────────────────────────────────────┘ │ │
│          │  │                                            │ │ │
│          │  │  [+ Create New Course]                     │ │
│          │  └────────────────────────────────────────────┘ │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

**Left Sidebar** (240px, Moodle-style):
- Dashboard
- Site home
- My courses (with expandable course list)
  - Each course shows as nested item
  - Click to expand course sections
- More... (additional options)

**Main Content Area** (flexible width):
- Welcome message with date
- My courses section with tab filters:
  - **Active Tab**: Shows only active courses (default)
  - **Archived Tab**: Shows only archived courses
  - **All Tab**: Shows all courses (active + archived)
- Course list items with:
  - Course name and code
  - Student count
  - Status badge (Active/Archived)
  - Action buttons: Manage, Grade, View
- Create New Course button at bottom

**Tab Behavior**:
- **Active** (default): Display courses with status = ACTIVE
- **Archived**: Display courses with status = ARCHIVED
- **All**: Display all courses regardless of status

**Responsive Behavior**:
- Desktop (≥ 1024px): Two columns visible, main content fills remaining space
- Tablet (768px - 1023px): Left sidebar collapsible, full-width content
- Mobile (< 768px): Hamburger menu, full-width content, stacked course cards

---

### Course Details Page Layout (Moodle-Inspired)

**Structure** (Two-Column Layout with Course Context):
```
┌─────────────────────────────────────────────────────────────┐
│                  Top Navigation Bar (56px)                  │
│  [Logo] Dashboard  My Courses        [🔔] [Profile ▼]      │
├─────────────────────────────────────────────────────────────┤
│  Home > My Courses > Introduction to Programming            │
├──────────┬──────────────────────────────────────────────────┤
│ Course   │  Main Content Area                               │
│ Sidebar  │                                                  │
│ (240px)  │  ┌────────────────────────────────────────────┐ │
│          │  │  Course Header                             │ │
│ ▼ Intro  │  │  Introduction to Programming               │ │
│   to Prog│  │  ABC123 • 25 students • Teacher: Prof. S   │ │
│          │  └────────────────────────────────────────────┘ │
│ General  │                                                  │
│ Announcem│  ┌────────────────────────────────────────────┐ │
│          │  │  Course Description                        │ │
│ Week 1   │  │  Learn programming basics with Python.     │ │
│ • Intro  │  │  This course covers variables, loops,      │ │
│ • Lecture│  │  functions, and more...                    │ │
│          │  └────────────────────────────────────────────┘ │
│ Week 2   │                                                  │
│ • Variab │  ┌────────────────────────────────────────────┐ │
│ • Assign │  │  Week 1: Introduction                      │ │
│          │  │  📄 Lecture 1: Course Overview             │ │
│ Week 3   │  │  📄 Lecture 2: Setup Environment           │ │
│ • Loops  │  │  📝 Assignment 1: Hello World              │ │
│ • Quiz 1 │  │  ❓ Quiz 1: Basics                         │ │
│          │  └────────────────────────────────────────────┘ │
│ ...      │                                                  │
│          │  ┌────────────────────────────────────────────┐ │
│ Grades   │  │  Week 2: Variables and Data Types          │ │
│          │  │  📄 Lecture 3: Variables                   │ │
│          │  │  📝 Assignment 2: Calculator               │ │
│          │  └────────────────────────────────────────────┘ │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

**Left Sidebar** (240px, Course Navigation):
- Course name (header, collapsible)
- General section
  - Announcements
  - Course info
- Weekly/Topic sections (expandable)
  - Week 1, Week 2, etc.
  - Each week shows materials, assignments, quizzes
  - Activity icons: 📄 (files), 📝 (assignments), ❓ (quizzes)
- Grades (link to gradebook)
- Participants (link to participants list)
- Settings (teacher only)

**Main Content Area** (flexible width):
- Course header (name, code, teacher, enrollment)
- Course description
- Weekly/topic sections with activities
- Activity completion indicators (checkboxes)
- Submission status
- Upcoming deadlines (inline)
- Recent activity feed (inline)

**Moodle-Specific Features**:
- Collapsible sections in left sidebar (▼ indicator)
- Activity icons (📄, 📝, ❓)
- Completion checkboxes next to activities
- Breadcrumb navigation at top
- Inline calendar events and deadlines

**Responsive Behavior**:
- Desktop (≥ 1024px): Two columns visible, main content fills remaining space
- Tablet (768px - 1023px): Left sidebar collapsible, full-width content
- Mobile (< 768px): Hamburger menu, full-width content

---

### Quiz Taking Page Layout

**Structure**:
```
┌─────────────────────────────────────────────┐
│           Top Navigation Bar                │
├─────────────────────────────────────────────┤
│                                    ┌──────┐ │
│  Quiz: Midterm Exam                │Timer │ │
│  Question 3 of 10                  │15:30 │ │
│                                    └──────┘ │
│  ┌─────────────────────────────────────┐   │
│  │  Question Navigation                │   │
│  │  [1✓] [2✓] [3] [4] [5] ... [10]    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Question Content                    │   │
│  │                                      │   │
│  │  What is the output of this code?   │   │
│  │                                      │   │
│  │  ○ Option A                          │   │
│  │  ○ Option B                          │   │
│  │  ○ Option C                          │   │
│  │  ○ Option D                          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [← Previous]              [Next →]         │
│                                             │
│  [Save Draft]           [Submit Quiz]       │
│                                             │
└─────────────────────────────────────────────┘
```

**Components**:
- Fixed timer (top-right)
- Question navigation (numbered buttons, checkmarks for answered)
- Question content area
- Answer options (radio for MCQ, textarea for essay)
- Navigation buttons (Previous, Next)
- Action buttons (Save Draft, Submit Quiz)

**Features**:
- Auto-save every 30 seconds
- Visual indicator for answered questions (✓)
- Warning before leaving page
- Confirmation dialog before submit
- Auto-submit when timer expires

---

### Grading Interface Layout

**Structure**:
```
┌─────────────────────────────────────────────┐
│           Top Navigation Bar                │
├─────────────────────────────────────────────┤
│  Assignment 1: Variables - Submissions      │
│                                             │
├──────────────┬──────────────────────────────┤
│ Submission   │  Submission Details          │
│ List         │                              │
│              │  Student: John Doe           │
│ ┌──────────┐│  Submitted: Jan 15, 11:30 PM │
│ │John Doe  ││  Status: On Time             │
│ │Submitted ││                              │
│ │[View]    ││  ┌────────────────────────┐  │
│ └──────────┘│  │  File Preview          │  │
│              │  │  assignment.pdf        │  │
│ ┌──────────┐│  │  [Download]            │  │
│ │Jane Smith││  └────────────────────────┘  │
│ │Submitted ││                              │
│ │[View]    ││  ┌────────────────────────┐  │
│ └──────────┘│  │  Grade Input           │  │
│              │  │  Score: [___] / 100    │  │
│ ┌──────────┐│  │                        │  │
│ │Bob Lee   ││  │  Feedback:             │  │
│ │Not Submit││  │  [Text area]           │  │
│ └──────────┘│  │                        │  │
│              │  │  [Save Grade]          │  │
│              │  └────────────────────────┘  │
└──────────────┴──────────────────────────────┘
```

**Left Panel** (Submission List):
- Student name
- Submission status
- Submission time
- Grade (if graded)
- Click to view details

**Right Panel** (Submission Details):
- Student information
- Submission timestamp
- File preview/download
- Grade input form
- Feedback textarea
- Save button

**Features**:
- Filter by status (All, Submitted, Graded, Not Submitted)
- Sort by name, submission time, grade
- Keyboard navigation (arrow keys to move between submissions)
- Quick grade entry (number input with validation)

---

### Material Viewer Layout

**Structure**:
```
┌─────────────────────────────────────────────┐
│           Top Navigation Bar                │
├─────────────────────────────────────────────┤
│  Home > Course > Materials > Lecture 1      │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Material Header                     │   │
│  │  Lecture 1: Introduction             │   │
│  │  PDF • 2.5 MB • Uploaded Jan 10      │   │
│  │                                      │   │
│  │  [Download] [Print]                  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                      │   │
│  │  File Preview Area                   │   │
│  │  (PDF viewer, image viewer, or       │   │
│  │   rich text content)                 │   │
│  │                                      │   │
│  │                                      │   │
│  │                                      │   │
│  │                                      │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [← Back to Materials]                      │
│                                             │
└─────────────────────────────────────────────┘
```

**Components**:
- Material header (title, type, size, upload date)
- Action buttons (Download, Print)
- Preview area (PDF viewer, image viewer, or rich text)
- Back navigation

**File Type Handling**:
- **PDF**: Embedded PDF viewer (iframe or library)
- **Images**: Full-size image display with zoom
- **Text**: Rich text rendering with formatting
- **Video Links**: Embedded YouTube/Vimeo player
- **Other**: Download button only

---

## Interactive States & Feedback

### Empty States

**Purpose**: Provide guidance when no content exists

**No Courses (Student)**:
```tsx
<div className="text-center py-16">
  <span className="text-6xl mb-4 block">📚</span>
  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Courses Yet</h3>
  <p className="text-gray-600 mb-6">You haven't enrolled in any courses.</p>
  <button className="btn-primary">Browse Courses</button>
</div>
```

**No Courses (Teacher)**:
```tsx
<div className="text-center py-16">
  <span className="text-6xl mb-4 block">📚</span>
  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Courses Yet</h3>
  <p className="text-gray-600 mb-6">Create your first course to get started.</p>
  <button className="btn-primary">Create Course</button>
</div>
```

**No Submissions**:
```tsx
<div className="text-center py-16">
  <span className="text-6xl mb-4 block">📝</span>
  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Submissions Yet</h3>
  <p className="text-gray-600">Students haven't submitted any work yet.</p>
</div>
```

**No Materials**:
```tsx
<div className="text-center py-16">
  <span className="text-6xl mb-4 block">📄</span>
  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Materials</h3>
  <p className="text-gray-600 mb-6">This course doesn't have any materials yet.</p>
  <button className="btn-primary">Add Material</button>
</div>
```

**Design Principles**:
- Large icon (6xl size, 72px)
- Clear heading explaining the empty state
- Helpful description text
- Call-to-action button (when applicable)
- Centered layout with generous padding

---

### Error States

**Upload Failed**:
```tsx
<div className="border-2 border-red-500 rounded-lg p-6 bg-red-50">
  <div className="flex items-start gap-4">
    <span className="text-3xl">⚠️</span>
    <div className="flex-1">
      <h4 className="font-semibold text-red-900 mb-1">Upload Failed</h4>
      <p className="text-sm text-red-700 mb-3">
        The file could not be uploaded. Please check your connection and try again.
      </p>
      <button className="text-sm text-red-700 hover:text-red-900 font-medium">
        Try Again
      </button>
    </div>
  </div>
</div>
```

**Network Error**:
```tsx
<div className="border-2 border-red-500 rounded-lg p-6 bg-red-50 text-center">
  <span className="text-5xl mb-4 block">🔌</span>
  <h3 className="text-xl font-semibold text-red-900 mb-2">Connection Error</h3>
  <p className="text-red-700 mb-4">
    Unable to connect to the server. Please check your internet connection.
  </p>
  <button className="btn-primary">Retry</button>
</div>
```

**Timeout Error**:
```tsx
<div className="border-2 border-yellow-500 rounded-lg p-6 bg-yellow-50">
  <div className="flex items-start gap-4">
    <span className="text-3xl">⏱️</span>
    <div>
      <h4 className="font-semibold text-yellow-900 mb-1">Request Timeout</h4>
      <p className="text-sm text-yellow-700">
        The request took too long to complete. Please try again.
      </p>
    </div>
  </div>
</div>
```

**Form Validation Error**:
```tsx
<div className="border-l-4 border-red-500 bg-red-50 p-4 mb-4">
  <div className="flex items-start gap-3">
    <span className="text-red-500 text-xl">⚠</span>
    <div>
      <h4 className="font-semibold text-red-900 mb-1">Please fix the following errors:</h4>
      <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
        <li>Name is required</li>
        <li>Due date must be in the future</li>
        <li>Time limit must be positive</li>
      </ul>
    </div>
  </div>
</div>
```

---

### Success States

**Submission Success**:
```tsx
<div className="border-2 border-green-500 rounded-lg p-6 bg-green-50 text-center">
  <span className="text-5xl mb-4 block">✅</span>
  <h3 className="text-xl font-semibold text-green-900 mb-2">Submitted Successfully!</h3>
  <p className="text-green-700 mb-4">
    Your assignment has been submitted. You'll be notified when it's graded.
  </p>
  <button className="btn-primary">Back to Assignments</button>
</div>
```

**Grade Saved**:
```tsx
<div className="border-l-4 border-green-500 bg-green-50 p-4">
  <div className="flex items-start gap-3">
    <span className="text-green-500 text-xl">✓</span>
    <div>
      <h4 className="font-semibold text-green-900">Grade Saved</h4>
      <p className="text-sm text-green-700">The grade has been saved successfully.</p>
    </div>
  </div>
</div>
```

**Course Created**:
```tsx
<div className="border-2 border-green-500 rounded-lg p-6 bg-green-50">
  <div className="flex items-start gap-4">
    <span className="text-4xl">🎉</span>
    <div>
      <h4 className="font-semibold text-green-900 mb-1">Course Created!</h4>
      <p className="text-sm text-green-700 mb-3">
        Your course "Introduction to Programming" has been created with code ABC123.
      </p>
      <div className="flex gap-2">
        <button className="btn-primary">Add Materials</button>
        <button className="btn-secondary">View Course</button>
      </div>
    </div>
  </div>
</div>
```

---

### Loading States

**Skeleton Loader for Course Card**:
```tsx
<div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden animate-pulse">
  <div className="bg-gray-300 h-24"></div>
  <div className="p-4 space-y-3">
    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
    <div className="flex justify-between">
      <div className="h-3 bg-gray-300 rounded w-1/4"></div>
      <div className="h-3 bg-gray-300 rounded w-1/4"></div>
    </div>
  </div>
</div>
```

**Skeleton Loader for List Item**:
```tsx
<div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
  <div className="flex gap-4">
    <div className="w-12 h-12 bg-gray-300 rounded"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
    </div>
  </div>
</div>
```

**Spinner (Inline)**:
```tsx
<div className="flex items-center justify-center gap-2">
  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
  <span className="text-gray-600">Loading...</span>
</div>
```

**Full Page Loading**:
```tsx
<div className="flex items-center justify-center min-h-screen">
  <div className="text-center">
    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
    <p className="text-gray-600">Loading content...</p>
  </div>
</div>
```

---

### Toast Notifications

**Purpose**: Temporary feedback messages for user actions

**Position**: Top-right corner, fixed position

**Structure**:
```tsx
<div className="fixed top-20 right-4 z-50 space-y-2">
  {/* Success Toast */}
  <div className="bg-white border-l-4 border-green-500 rounded-lg shadow-lg p-4 min-w-[300px] animate-slide-in">
    <div className="flex items-start gap-3">
      <span className="text-green-500 text-xl">✓</span>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900">Success</h4>
        <p className="text-sm text-gray-600">Your changes have been saved.</p>
      </div>
      <button className="text-gray-400 hover:text-gray-600">✕</button>
    </div>
  </div>
  
  {/* Error Toast */}
  <div className="bg-white border-l-4 border-red-500 rounded-lg shadow-lg p-4 min-w-[300px]">
    <div className="flex items-start gap-3">
      <span className="text-red-500 text-xl">⚠</span>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900">Error</h4>
        <p className="text-sm text-gray-600">Failed to save changes.</p>
      </div>
      <button className="text-gray-400 hover:text-gray-600">✕</button>
    </div>
  </div>
  
  {/* Info Toast */}
  <div className="bg-white border-l-4 border-blue-500 rounded-lg shadow-lg p-4 min-w-[300px]">
    <div className="flex items-start gap-3">
      <span className="text-blue-500 text-xl">ℹ</span>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900">Info</h4>
        <p className="text-sm text-gray-600">New material has been added.</p>
      </div>
      <button className="text-gray-400 hover:text-gray-600">✕</button>
    </div>
  </div>
</div>
```

**Behavior**:
- Auto-dismiss after 5 seconds
- Manual dismiss with close button
- Stack multiple toasts vertically
- Slide-in animation from right
- Fade-out animation on dismiss

**Variants**:
- Success: Green border (`border-green-500`)
- Error: Red border (`border-red-500`)
- Warning: Yellow border (`border-yellow-500`)
- Info: Blue border (`border-blue-500`)

---

### Confirmation Dialogs

**Delete Course Confirmation**:
```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
    <div className="flex items-start gap-4 mb-4">
      <span className="text-4xl">⚠️</span>
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Course?</h3>
        <p className="text-gray-600">
          Are you sure you want to delete "Introduction to Programming"? 
          This action cannot be undone and will delete all materials, assignments, and submissions.
        </p>
      </div>
    </div>
    <div className="flex justify-end gap-3">
      <button className="btn-secondary">Cancel</button>
      <button className="btn-danger">Delete Course</button>
    </div>
  </div>
</div>
```

**Archive Course Confirmation**:
```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
    <h3 className="text-xl font-semibold text-gray-900 mb-4">Archive Course?</h3>
    <p className="text-gray-600 mb-6">
      Archiving this course will:
    </p>
    <ul className="text-gray-600 list-disc list-inside space-y-1 mb-6">
      <li>Close all assignments and quizzes</li>
      <li>Prevent new enrollments</li>
      <li>Make the course read-only</li>
    </ul>
    <p className="text-gray-600 mb-6">
      Students will still be able to view their grades and materials.
    </p>
    <div className="flex justify-end gap-3">
      <button className="btn-secondary">Cancel</button>
      <button className="btn-primary">Archive Course</button>
    </div>
  </div>
</div>
```

**Submit Quiz Confirmation**:
```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
    <h3 className="text-xl font-semibold text-gray-900 mb-4">Submit Quiz?</h3>
    <p className="text-gray-600 mb-4">
      You have answered 8 out of 10 questions.
    </p>
    <p className="text-gray-600 mb-6">
      Once submitted, you cannot change your answers. Are you sure you want to submit?
    </p>
    <div className="flex justify-end gap-3">
      <button className="btn-secondary">Review Answers</button>
      <button className="btn-primary">Submit Quiz</button>
    </div>
  </div>
</div>
```

**Design Principles**:
- Modal overlay with semi-transparent backdrop
- Centered dialog with max-width
- Clear heading and description
- Warning icon for destructive actions
- Two buttons: Cancel (secondary) and Confirm (primary/danger)
- Escape key to cancel
- Click outside to cancel (optional)

---

## Accessibility Considerations

### Keyboard Navigation

**All interactive elements must be keyboard accessible:**
- Tab: Move to next element
- Shift+Tab: Move to previous element
- Enter/Space: Activate button or link
- Escape: Close modal or dialog
- Arrow keys: Navigate within lists or menus

**Focus Indicators**:
```tsx
className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
```

### Screen Reader Support

**ARIA Labels**:
```tsx
<button aria-label="Delete course">
  <span aria-hidden="true">🗑️</span>
</button>

<div role="alert" aria-live="polite">
  Grade saved successfully
</div>

<nav aria-label="Course navigation">
  {/* Navigation items */}
</nav>
```

**Semantic HTML**:
- Use `<button>` for actions, not `<div>` with onClick
- Use `<a>` for navigation, not `<button>`
- Use proper heading hierarchy (H1 → H2 → H3)
- Use `<form>` for form submissions

### Color Contrast

**All text must meet WCAG 2.1 AA standards:**
- Normal text: 4.5:1 contrast ratio
- Large text (18pt+): 3:1 contrast ratio
- UI components: 3:1 contrast ratio

**Test with tools:**
- Chrome DevTools Lighthouse
- WebAIM Contrast Checker
- axe DevTools extension

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
