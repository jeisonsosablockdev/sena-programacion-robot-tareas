---
name: typescript-dev
description: "TypeScript engineering skill for building type-safe applications, CLI utilities, and robust modular libraries. Use when designing TypeScript interfaces, strict tsconfig configurations, generics, utility types, Zod schemas, or compiling TS modules for the harness. For Node.js runtime, see node-dev. For code quality and refactoring, see code-quality."
metadata:
  version: 1.0.0
---

# TypeScript Development Skill

> [!NOTE] Purpose
> Professional guidelines, type-system patterns, and best practices for developing type-safe applications, CLI utilities, and backend modules in TypeScript for course projects and the Academic-Engine harness.

---

## 1. Core Principles & Strictness Standards

1. **Zero Implicit Any**: Never use `any` as an escape hatch. Use `unknown` for unchecked inputs and narrow with type guards.
2. **Strict Compiler Baseline**: All TypeScript projects and utilities must enable strict compiler flags.
3. **Parse, Don't Validate**: Validate external inputs at the boundaries (using Zod or type guards) into strongly typed domain objects.
4. **DRY Types with Single Source of Truth**: Derive types from schemas or constants using `typeof`, `keyof`, `ReturnType`, and indexed access rather than duplicating type definitions.

### Recommended `tsconfig.json` Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  }
}
```

---

## 2. Advanced Type System Patterns

### A. Discriminated Unions for State & Result Modeling

Model domain entities, command results, and state machines with explicit discriminating literals:

```typescript
export type TaskResult<T> =
  | { status: 'success'; data: T; timestamp: number }
  | { status: 'error'; error: Error; code: string }
  | { status: 'pending'; progressPercentage: number };

export function handleResult<T>(result: TaskResult<T>): void {
  switch (result.status) {
    case 'success':
      console.log('Completed:', result.data);
      break;
    case 'error':
      console.error(`[${result.code}]`, result.error.message);
      break;
    case 'pending':
      console.log(`In progress: ${result.progressPercentage}%`);
      break;
  }
}
```

### B. Exhaustiveness Checking with `never`

Ensure exhaustive pattern matching in switches:

```typescript
export function assertNever(x: never, message = 'Unexpected object in exhaustive check'): never {
  throw new Error(`${message}: ${JSON.stringify(x)}`);
}
```

### C. Branded (Nominal) Types

Prevent accidental primitive type mixing (e.g., student IDs vs task IDs):

```typescript
export type Brand<K, T> = K & { readonly __brand: T };

export type StudentId = Brand<string, 'StudentId'>;
export type TaskSlug = Brand<string, 'TaskSlug'>;

export function makeTaskSlug(raw: string): TaskSlug {
  if (!/^[a-z0-9-]+$/.test(raw)) {
    throw new Error(`Invalid slug format: ${raw}`);
  }
  return raw as TaskSlug;
}
```

### D. Utility Types in Action

- `Readonly<T>` / `as const`: Immutable state and configurations.
- `Pick<T, K>` & `Omit<T, K>`: Subsetting domain entities for creation/update DTOs.
- `Record<K, V>`: Safe mapping tables.
- `Extract<T, U>` & `Exclude<T, U>`: Filtering union variants.

---

## 3. Boundary Validation with Zod

When reading external data (JSON files, CLI arguments, API responses), enforce runtime contracts:

```typescript
import { z } from 'zod';

export const TaskSpecSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(3),
  targetFolder: z.string(),
  subagents: z.array(z.string()).nonempty(),
  targetAudience: z.string().default('Aprendices SENA'),
  goal: z.string(),
  estimatedHours: z.number().positive().optional(),
});

export type TaskSpec = z.infer<typeof TaskSpecSchema>;

export function parseTaskSpec(rawJson: string): TaskSpec {
  const parsed = JSON.parse(rawJson);
  return TaskSpecSchema.parse(parsed);
}
```

---

## 4. Execution & Packaging for the Harness

In the Academic-Engine environment:
- Use `tsx` (TypeScript Execute) for running TypeScript files directly without a manual compilation step:
  ```bash
  npx tsx script.ts
  ```
- For libraries and reusable modules, build with `tsup` or `tsc`:
  ```bash
  npx tsup src/index.ts --format esm,cjs --dts
  ```
- Use native ESM imports with file extensions when using `"moduleResolution": "NodeNext"`:
  ```typescript
  import { parseConfig } from './config.js';
  ```

---

## 5. Testing with Vitest or Node Test Runner

```typescript
import { describe, it, expect } from 'vitest';
import { makeTaskSlug } from './slug.js';

describe('makeTaskSlug', () => {
  it('should accept valid kebab-case slugs', () => {
    const slug = makeTaskSlug('valid-task-slug');
    expect(slug).toBe('valid-task-slug');
  });

  it('should throw an error for uppercase characters', () => {
    expect(() => makeTaskSlug('INVALID_SLUG')).toThrow();
  });
});
```

---

## 6. Development Checklist

- [ ] `tsconfig.json` has `strict: true` and `noImplicitAny: true`.
- [ ] No `any` types present without explicit documented justification.
- [ ] Public functions and exported interfaces have clear JSDoc comments.
- [ ] Input data from files or APIs is validated with Zod schemas.
- [ ] Error states and edge cases are typed with discriminated unions.
- [ ] Code formats cleanly with Prettier and passes ESLint/typescript-eslint.
