-- Profiles are public by default (people can switch to private in Settings).
-- Lists keep their own visibility ('link' unless the owner changed it), so
-- making a profile public shows no gifts by itself.
UPDATE users SET is_private = 0;
-- Requests waiting on profiles that are now public are accepted, as when a user goes public.
UPDATE follows SET status = 'accepted' WHERE status = 'pending';
