-- Create voice_memos table
CREATE TABLE IF NOT EXISTS voice_memos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    duration INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_published BOOLEAN DEFAULT false,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE voice_memos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own voice memos"
    ON voice_memos FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read published voice memos"
    ON voice_memos FOR SELECT
    TO authenticated
    USING (is_published = true);

CREATE POLICY "Users can update their own voice memos"
    ON voice_memos FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create function to increment counters
CREATE OR REPLACE FUNCTION increment()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN COALESCE(likes_count, 0) + 1;
END;
$$; 