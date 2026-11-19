-- Apply only to the dedicated migration coordinator. No application or student data.
CREATE TABLE IF NOT EXISTS audio_campaign (
  id text PRIMARY KEY,
  ceiling integer NOT NULL CHECK (ceiling BETWEEN 1 AND 20000),
  spent integer NOT NULL DEFAULT 0,
  reserved integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS audio_job (
  key text PRIMARY KEY CHECK (key ~ '^[a-f0-9]{64}$'),
  campaign text REFERENCES audio_campaign,
  reservation integer NOT NULL CHECK (reservation >= 0),
  credits integer,
  audio bytea,
  receipt text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION reserve_audio(p_campaign text, p_key text, p_amount integer, p_limit integer)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE c audio_campaign;
BEGIN
  SELECT * INTO STRICT c FROM audio_campaign WHERE id=p_campaign FOR UPDATE;
  IF EXISTS (SELECT FROM audio_job WHERE key=p_key) THEN RETURN 'existing'; END IF;
  IF c.expires_at <= now() OR p_amount NOT BETWEEN 1 AND 800 OR p_limit NOT BETWEEN 1 AND 20000
    OR c.spent + c.reserved + p_amount > least(c.ceiling,p_limit) THEN RETURN 'limit'; END IF;
  INSERT INTO audio_job(key,campaign,reservation) VALUES(p_key,c.id,p_amount) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN 'existing'; END IF;
  UPDATE audio_campaign SET reserved=reserved+p_amount WHERE id=c.id;
  RETURN 'reserved';
END $$;

CREATE OR REPLACE FUNCTION finish_audio(p_campaign text,p_key text,p_cost integer,p_audio bytea,p_receipt text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE j audio_job;
BEGIN
  PERFORM 1 FROM audio_campaign WHERE id=p_campaign FOR UPDATE;
  SELECT * INTO STRICT j FROM audio_job WHERE key=p_key AND campaign=p_campaign FOR UPDATE;
  IF j.audio IS NOT NULL THEN RETURN; END IF;
  IF p_cost < 0 OR octet_length(p_audio) NOT BETWEEN 100 AND 2097152 THEN RAISE EXCEPTION 'Invalid receipt'; END IF;
  UPDATE audio_job SET credits=p_cost,audio=p_audio,receipt=p_receipt WHERE key=p_key;
  IF p_cost IS NOT NULL THEN
    UPDATE audio_campaign SET reserved=reserved-j.reservation,spent=spent+p_cost,
      expires_at=CASE WHEN p_cost>j.reservation THEN now() ELSE expires_at END WHERE id=p_campaign;
  ELSE
    UPDATE audio_campaign SET expires_at=now() WHERE id=p_campaign;
  END IF;
END $$;
