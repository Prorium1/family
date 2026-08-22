-- Gender on the profile: self-description only.
--
-- It is never read by any policy, question selector, insight prompt or
-- billing rule — it exists so the registration entry can greet someone as
-- they see themselves (docs/BRAND.md §3.1). Pairing has no gender rule:
-- any two accounts can form a couple, which is enforced by the absence of
-- one here and covered by tests in src/tests/unit/flows.integration.test.ts.

create type gender as enum ('male', 'female', 'other');

alter table profiles add column gender gender;

comment on column profiles.gender is
  'Self-described gender. Optional, editable, and never used to vary content or advice.';
