import '@testing-library/jest-dom/vitest'

// The unit suite exercises the demo driver, which is exactly the mode a
// developer runs locally: no external credentials, no encryption key. The
// production guard in config/server-env.ts is asserted separately in
// src/tests/unit/security.test.ts.
process.env.NEXT_PUBLIC_DEMO_MODE ??= 'true'
