-- Allow authenticated users to read their weekly report preference.
-- Without this grant, profile queries that include weekly_report_enabled fail entirely.

GRANT SELECT (weekly_report_enabled) ON TABLE public.profiles TO authenticated;