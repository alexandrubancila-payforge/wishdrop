-- Lists show on their owner's profile by default ('public'); owners can switch
-- a list to 'followers' or 'link' in the list editor. New lists are created public.
UPDATE wishlists SET visibility = 'public';
