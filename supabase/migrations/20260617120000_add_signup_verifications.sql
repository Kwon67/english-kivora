CREATE TABLE public.signup_verifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL,
  email_hash TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  password_ciphertext TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX signup_verifications_expires_at_idx
  ON public.signup_verifications (expires_at);

ALTER TABLE public.signup_verifications ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.signup_verifications FROM anon, authenticated;
GRANT ALL ON public.signup_verifications TO service_role;