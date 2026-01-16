# Frontend Folder Structure Rules

## Architecture Philosophy

**Clean separation of concerns.** Each folder has a single, well-defined purpose.  
**No circular dependencies.** Data flows in one direction only.  
**Animation-ready.** Structure supports heavy GSAP/Framer Motion usage.  
**Hackathon → Production.** Built to scale beyond the demo.

---

## Directory Structure

```
src/
├── components/      # Reusable UI components (presentational)
├── routes/          # Page-level components (containers)
├── stores/          # Zustand state management
├── hooks/           # Custom React hooks
├── api/             # API client & endpoint logic
├── types/           # TypeScript type definitions
├── utils/           # Pure utility functions
├── styles/          # Global CSS & Tailwind entry
├── lib/             # Third-party library configs
└── assets/          # Static files (images, fonts, Lottie)
```

---

## Folder Rules

### `components/`
**Purpose:** Reusable, presentational UI components.

**✅ DO:**
- Keep components small and focused (single responsibility)
- Accept props for data, never fetch data directly
- Use TypeScript for all prop types
- Co-locate component-specific styles if needed

**❌ DON'T:**
- Call API endpoints directly
- Manage global state (use stores instead)
- Mix routing logic with components
- Create deeply nested component hierarchies

**Example:**
```tsx
// ✅ GOOD
function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}

// ❌ BAD
function Button() {
  const data = useStore(); // Global state access
  const result = await fetch('/api/data'); // API call
  return <button>{data.label}</button>;
}
```

---

### `routes/`
**Purpose:** Page-level components that compose smaller components.

**✅ DO:**
- One file per route/page
- Orchestrate components from `components/`
- Handle page-level layout
- Connect to stores for data

**❌ DON'T:**
- Put complex UI logic here (extract to components)
- Duplicate component code across routes
- Handle API calls directly (use hooks or API layer)

**Example:**
```tsx
// ✅ GOOD - routes/Landing.tsx
import { Hero } from '@components/landing/Hero';
import { Features } from '@components/landing/Features';

export function Landing() {
  return (
    <>
      <Hero />
      <Features />
    </>
  );
}
```

---

### `stores/`
**Purpose:** Zustand state management (isolated, immutable stores).

**✅ DO:**
- One store per domain (e.g., `uploadStore`, `jobStore`)
- Keep stores flat and simple
- Export typed hooks for TypeScript safety
- Use selectors to prevent unnecessary re-renders

**❌ DON'T:**
- Mix multiple domains in one store
- Store derived data (compute on read)
- Mutate state directly (use immutable updates)
- Call API endpoints inside stores (use `api/` layer)

**Example:**
```tsx
// ✅ GOOD - stores/uploadStore.ts
import { create } from 'zustand';

interface UploadState {
  files: File[];
  addFile: (file: File) => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  files: [],
  addFile: (file) => set((state) => ({ files: [...state.files, file] })),
}));
```

---

### `hooks/`
**Purpose:** Custom React hooks for reusable logic.

**✅ DO:**
- Start hook names with `use` (React convention)
- Keep hooks focused on one concern
- Return consistent data structures
- Handle cleanup properly (useEffect cleanup)

**❌ DON'T:**
- Put business logic here (use utils instead)
- Call hooks conditionally (violates Rules of Hooks)
- Create "god hooks" that do too much

**Example:**
```tsx
// ✅ GOOD - hooks/useJobPolling.ts
export function useJobPolling(jobId: string) {
  const [status, setStatus] = useState('pending');
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const result = await checkJobStatus(jobId);
      setStatus(result.status);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [jobId]);
  
  return { status };
}
```

---

### `api/`
**Purpose:** Centralized API client and endpoint definitions.

**✅ DO:**
- Use a single Axios instance with interceptors
- Group endpoints by domain (upload.ts, jobs.ts)
- Return typed responses
- Handle errors consistently

**❌ DON'T:**
- Scatter fetch calls across components
- Mix API logic with UI logic
- Hardcode URLs (use env vars)

**Example:**
```tsx
// ✅ GOOD - api/upload.ts
import { apiClient } from './client';

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  const { data } = await apiClient.post('/upload', formData);
  return data;
}
```

---

### `types/`
**Purpose:** Shared TypeScript type definitions.

**✅ DO:**
- Co-locate types with their domain (upload.types.ts)
- Export from a central index.ts for convenience
- Use interfaces for objects, types for unions/primitives
- Keep types DRY (reuse common patterns)

**❌ DON'T:**
- Duplicate type definitions across files
- Use `any` (defeats the purpose of TypeScript)
- Create overly complex generic types

---

### `utils/`
**Purpose:** Pure utility functions (no side effects).

**✅ DO:**
- Keep functions pure (same input = same output)
- Write unit-testable functions
- Group by concern (formatters.ts, validators.ts)

**❌ DON'T:**
- Put React hooks here
- Call APIs or access DOM
- Mix React-specific logic with utils

**Example:**
```tsx
// ✅ GOOD - utils/formatters.ts
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}
```

---

### `lib/`
**Purpose:** Third-party library configuration.

**✅ DO:**
- Initialize libraries here (GSAP, React Query)
- Export configured instances
- Document setup choices

**❌ DON'T:**
- Mix library config with business logic

---

### `styles/`
**Purpose:** Global CSS, Tailwind entry point.

**✅ DO:**
- Import Tailwind directives here
- Define global CSS variables
- Keep component styles in component files

---

### `assets/`
**Purpose:** Static files (images, fonts, Lottie JSON).

**✅ DO:**
- Organize by type (images/, fonts/, lottie/)
- Optimize before committing
- Use descriptive filenames

---

## Anti-Patterns to Avoid

### ❌ The "God Component"
**Problem:** Component does everything (API calls, state, logic, rendering).  
**Solution:** Break into smaller components + hooks + API calls.

### ❌ Circular Dependencies
**Problem:** `A` imports `B`, `B` imports `A`.  
**Solution:** Extract shared logic into `utils/` or create a third module.

### ❌ Prop Drilling
**Problem:** Passing props 5+ levels deep.  
**Solution:** Use Zustand stores or React Context.

### ❌ Inline API Calls
**Problem:** `fetch('/api/data')` scattered everywhere.  
**Solution:** Centralize in `api/` layer.

---

## Decision Tree

**Where should this code go?**

1. **Is it a UI element?** → `components/`
2. **Is it a full page?** → `routes/`
3. **Is it global state?** → `stores/`
4. **Is it reusable React logic?** → `hooks/`
5. **Is it an API call?** → `api/`
6. **Is it a type definition?** → `types/`
7. **Is it a pure function?** → `utils/`
8. **Is it library setup?** → `lib/`

---

## Quality Checklist

Before committing code, ask:

- [ ] No circular dependencies?
- [ ] No data fetching in presentational components?
- [ ] No business logic in routes?
- [ ] All types defined in `types/`?
- [ ] API calls centralized in `api/`?
- [ ] Pure functions in `utils/`?
- [ ] Component < 200 lines?
- [ ] File has single responsibility?

---

**REMEMBER:** Clean architecture = fast iteration = better hackathon results.
