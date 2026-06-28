import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

interface CustomMatchers<R = unknown> extends TestingLibraryMatchers<R, string> {}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
