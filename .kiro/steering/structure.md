# Project Structure

## Root Configuration
- `package.json` - Dependencies and npm scripts
- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript project references
- `tsconfig.app.json` - App-specific TypeScript config
- `tsconfig.node.json` - Node/build tooling TypeScript config
- `eslint.config.js` - ESLint configuration
- `index.html` - Entry HTML file

## Source Code (`src/`)
- `main.tsx` - Application entry point, renders root component
- `App.tsx` - Main application component
- `App.css` - App-specific styles
- `index.css` - Global styles
- `assets/` - Static assets (images, icons)

## Public Assets (`public/`)
- Static files served directly (e.g., `vite.svg`)

## Build Output
- `dist/` - Production build output (gitignored)
- `node_modules/` - Dependencies (gitignored)

## Conventions
- React components use `.tsx` extension
- Functional components with hooks (modern React patterns)
- StrictMode enabled in production
- Component files typically export default
