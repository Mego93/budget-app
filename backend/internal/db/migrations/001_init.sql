CREATE TABLE IF NOT EXISTS schema_migrations (
  version    INT PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 1) THEN

    CREATE TABLE users (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      google_id  TEXT UNIQUE NOT NULL,
      email      TEXT NOT NULL,
      name       TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE budgets (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      data       JSONB NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    INSERT INTO schema_migrations (version) VALUES (1);
  END IF;
END $$;
