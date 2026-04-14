-- Allow assignments.status to keep legacy simple values and richer encoded metadata.
-- This matches the app-side serializer used for timed assignments and scheduled reviews.

alter table public.assignments
drop constraint if exists assignments_status_check;

alter table public.assignments
add constraint assignments_status_check
check (
  status is not null
  and status <> ''
  and (
    status ~ '^(pending|completed|incomplete)([|][a-z_]+=[^|]*)*$'
    or status ~ '^scheduled_review([|][a-z_]+=[^|]*)*$'
  )
);
