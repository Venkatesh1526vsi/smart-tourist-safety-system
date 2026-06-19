# Global Configurations

This document covers the implementation-level details of the global configuration files across the Smart Tourist Safety System, specifically detailing dependency management, build processes, and TypeScript environments.

---

## 1. Backend Dependencies (`backend-api/package.json`)

### Purpose
To manage the dependencies, scripts, and runtime configuration for the Node.js backend API server.

### Location
`backend-api/package.json`

### File Level Analysis

#### Core Meta
- **Name:** `backend-api`
- **Version:** `1.0.0`
- **Entry Point:** `index.js`
- **Module System:** CommonJS (`"type": "commonjs"`)

#### Scripts
- `start`: Executed via `node index.js`. Serves as the primary production and development start script.

#### Production Dependencies
The backend relies heavily on the Express ecosystem and MongoDB.
- `express` (^5.1.0): The core web framework handling routing and HTTP requests.
- `mongoose` (^8.19.1): The ODM (Object Document Mapper) for MongoDB, handling schema validation and database interactions.
- `bcrypt` (^6.0.0): Security library used for hashing user passwords before storing them in the database.
- `jsonwebtoken` (^9.0.2): Used for generating and verifying JWTs for stateless authentication.
- `cors` (^2.8.5): Middleware to handle Cross-Origin Resource Sharing, crucial since the frontend runs on a different port/domain.
- `dotenv` (^17.2.3): Loads environment variables from the `.env` file into `process.env`.
- `express-rate-limit` (^8.2.1): Security middleware to prevent brute-force and DDoS attacks by limiting repeated requests.
- `multer` (^2.0.2): Middleware for handling `multipart/form-data`, specifically used for image/file uploads during incident reporting.
- `nodemailer` (^7.0.13): Service library to send email notifications to administrators.
- `twilio` (^5.12.0): SMS service library to send emergency texts.
- `socket.io` & `socket.io-client` (^4.8.3): Enables real-time bidirectional event-based communication for live incident broadcasts and tracking.
- `winston` (^3.19.0): Advanced logging library used for error tracking and system auditing.

#### Developer Notes
- The usage of Express 5.1.0 indicates modern features (like native Promise support in route handlers without needing `express-async-errors`).
- The explicit declaration of `commonjs` ensures backwards compatibility but restricts the use of top-level `await` without an async IIFE.

---

## 2. Frontend Dependencies (`frontend-new/package.json`)

### Purpose
To manage dependencies, build scripts, and the Vite configuration for the React-based web dashboard.

### Location
`frontend-new/package.json`

### File Level Analysis

#### Core Meta
- **Name:** `frontend-new`
- **Type:** `module` (ES Modules)

#### Scripts
- `dev`: `vite` - Starts the Vite development server with HMR.
- `build`: `tsc -b && vite build` - Compiles TypeScript first (checking for errors) and then bundles via Vite.
- `lint`: `eslint .` - Runs linting rules across the codebase.

#### Production Dependencies
- **Core Framework:** `react`, `react-dom`, `react-router-dom` (v7.x for advanced routing).
- **UI Architecture:** 
  - `tailwindcss` (^4.2.1) for utility-first styling.
  - `@radix-ui/*` primitives (dialog, label, scroll-area, select, slot, switch) for accessible headless components.
  - `class-variance-authority` (cva) & `clsx` & `tailwind-merge` for constructing dynamic utility classes safely.
  - `lucide-react` for SVG iconography.
- **Visuals & Maps:**
  - `framer-motion` for complex component animations and transitions.
  - `leaflet` & `react-leaflet` for interactive mapping, risk zones, and live tracking.
  - `recharts` for statistical data visualization on the Admin dashboard.
- **UX Libraries:** `sonner` and `react-hot-toast` for toast notifications.

#### Dev Dependencies
- `@vitejs/plugin-react`: Vite's official React plugin.
- `@tailwindcss/vite`: Tailwind's Vite plugin for v4 integration.
- `vite-plugin-pwa`: Indicates the application is built to function as a Progressive Web App (PWA).

#### Common Errors
- *Dependency conflicts with React 19:* Since the app uses `react@^19.2.0`, certain older libraries (potentially specific map plugins) might throw peer dependency warnings. 

---

## 3. Frontend Bundler Config (`vite.config.ts`)

### Purpose
To configure the Vite bundler, defining path aliases, plugins, and highly specific chunking logic for production builds.

### Location
`frontend-new/vite.config.ts`

### Implementation Details
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
```

#### Path Resolution
Sets up an absolute path alias `@/` mapping to the `./src` directory. This cleans up imports (e.g., `import { Button } from '@/components/ui/button'`).

#### Rollup Options & Manual Chunking
The `build.rollupOptions.output.manualChunks` function is heavily customized to optimize load times and browser caching:
1. **`react-core`**: Bundles `react`, `react-dom`, and `react-router-dom` together. Since these rarely change, caching this chunk is highly effective.
2. **`ui-components`**: Bundles `@radix-ui`, `framer-motion`, and `lucide-react`. Separates heavy UI logic from application logic.
3. **`charts`**: Isolates `recharts`.
4. **`maps`**: Isolates `leaflet` and `react-leaflet`. *Workflow implication:* Users who don't visit the map page don't need to load this heavy chunk immediately.

#### Developer Notes
- `chunkSizeWarningLimit` is raised to `600` kb to suppress warnings from naturally large libraries like Leaflet.
- `sourcemap: false` ensures proprietary code is not easily readable in production.

---

## 4. TypeScript Configurations (`tsconfig.app.json` & `tsconfig.json`)

### Purpose
To define the strict typing rules, module resolution, and target environments for the frontend TypeScript compiler.

### Location
`frontend-new/tsconfig.json` & `frontend-new/tsconfig.app.json`

### Implementation Details
- **Target & Module:** `ES2022` and `ESNext`. Ensures the code is compiled utilizing modern JavaScript features.
- **Module Resolution:** `bundler`. Optimized for Vite.
- **Path Mapping:** Explicitly defines `"@/*": ["./src/*"]` to match the Vite configuration, ensuring the IDE understands the alias.
- **Strictness:** `"strict": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true`. This enforces high code quality, preventing deployment of code with dead variables.
- **JSX:** `"react-jsx"`. Automatically imports React in JSX files, eliminating the need for `import React from 'react'`.

### Developer Notes
The root `tsconfig.json` utilizes project references (`"references": [...]`) to split the configuration between the Node.js context (for Vite config) and the browser context (for App code), preventing type pollution between the two environments.
