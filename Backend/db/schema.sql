CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    photo_path      TEXT,
    audio_text      TEXT,
    description     TEXT,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    address         TEXT,
    issue_type      TEXT,
    severity_score  INTEGER,
    severity_level  TEXT,
    severity_reason TEXT,
    department      TEXT,
    status          TEXT NOT NULL DEFAULT 'received',
    duplicate_of    UUID REFERENCES reports(id),
    confirmations   INTEGER NOT NULL DEFAULT 1,
    deadline_at     TIMESTAMPTZ,
    ai_result       JSONB,
    context         JSONB
);

CREATE TABLE IF NOT EXISTS status_events (
    id          BIGSERIAL PRIMARY KEY,
    report_id   UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    status      TEXT NOT NULL,
    note        TEXT
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_location
    ON reports USING GIST ((ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography));
