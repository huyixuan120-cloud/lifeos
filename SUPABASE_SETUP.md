# Supabase Setup Guide for LifeOS

This guide will walk you through setting up Supabase for the LifeOS Calendar module.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed
- LifeOS project already initialized

## Step 1: Create a Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in the details:
   - **Name**: LifeOS (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
4. Click **"Create new project"**
5. Wait 2-3 minutes for the project to be provisioned

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, navigate to:
   - **Settings** → **API**

2. Copy the following values:
   - **Project URL** (under "Project Configuration")
   - **anon/public key** (under "Project API keys")

3. Create a `.env.local` file in your project root:
   ```bash
   cp .env.local.example .env.local
   ```

4. Edit `.env.local` and paste your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 3: Execute the Database Schema

1. In your Supabase dashboard, navigate to:
   - **SQL Editor** (left sidebar)

2. Click **"New query"**

3. Open the file `supabase_schema.sql` from your project root

4. Copy the **entire contents** of the file

5. Paste it into the SQL Editor

6. Click **"Run"** (or press Cmd/Ctrl + Enter)

7. You should see a success message: ✅ "Success. No rows returned"

## Step 4: Verify the Setup

### Check the Table

1. Navigate to **Table Editor** in your Supabase dashboard
2. You should see a new table called **events**
3. Click on it to see the structure

### Check RLS Policies

1. In the Table Editor, click on **events** table
2. Click the **RLS** tab at the top
3. You should see 4 policies:
   - Allow public read access to events
   - Allow public insert access to events
   - Allow public update access to events
   - Allow public delete access to events

### Test the Connection (Optional)

Run this test in your SQL Editor:

```sql
-- Insert a test event
INSERT INTO public.events (title, start, "end", all_day, status)
VALUES (
  'Test Event',
  NOW(),
  NOW() + INTERVAL '1 hour',
  false,
  'active'
);

-- Query the event
SELECT * FROM public.events;

-- Clean up (optional)
-- DELETE FROM public.events WHERE title = 'Test Event';
```

## Step 5: Test from Next.js

1. Restart your Next.js development server:
   ```bash
   npm run dev
   ```

2. Open your browser console at http://localhost:3000/calendar

3. Check for any Supabase connection errors in the console

## Step 6: Optional - Insert Sample Data

If you want to populate your calendar with sample events for testing:

1. In Supabase SQL Editor, uncomment and run the sample data section from `supabase_schema.sql`
2. Or manually insert events using the Table Editor

## Project Structure

Your Supabase integration files are organized as follows:

```
lifeos/
├── .env.local                    # Your credentials (git-ignored)
├── .env.local.example            # Template for credentials
├── supabase_schema.sql           # Database schema
├── SUPABASE_SETUP.md            # This file
└── src/
    ├── utils/
    │   └── supabase/
    │       ├── client.ts         # Browser client
    │       └── server.ts         # Server client (SSR)
    └── types/
        └── calendar.ts           # TypeScript types
```

## Security Notes

### Current Setup (MVP/Development)
- **RLS is enabled** but policies allow public access
- No authentication required
- Suitable for development and single-user scenarios

### Production Recommendations
When you're ready to deploy:

1. **Enable Authentication:**
   - Set up Supabase Auth (email, OAuth, etc.)
   - Uncomment the production RLS policies in `supabase_schema.sql`

2. **Update RLS Policies:**
   - Replace public policies with user-specific policies
   - Ensure `user_id` is set for all events
   - Test thoroughly

3. **Environment Variables:**
   - Never commit `.env.local` to git
   - Use Vercel/your hosting provider's environment variable settings
   - Keep service role key server-side only

## Next Steps

Now that Supabase is set up, you can:

1. ✅ Update `CalendarView.tsx` to fetch events from Supabase
2. ✅ Implement CRUD operations (Create, Read, Update, Delete)
3. ✅ Add event creation modal
4. ✅ Add event editing functionality
5. ⏳ Implement authentication (when needed)
6. ⏳ Add real-time subscriptions for live updates

## Troubleshooting

### "Invalid API key" error
- Double-check your `.env.local` file
- Ensure you copied the **anon/public** key, not the service role key
- Restart your dev server after changing `.env.local`

### "relation 'events' does not exist"
- The SQL schema wasn't executed successfully
- Go back to Step 3 and run the schema again
- Check the SQL Editor for error messages

### Events not showing in calendar
- Check browser console for errors
- Verify the table has data (Supabase Table Editor)
- Check RLS policies are enabled
- Ensure `.env.local` is in the project root

### Can't insert events
- Check RLS policies in Supabase dashboard
- Verify insert policy allows public access (for MVP)
- Check browser console for error details

## Support

- Supabase Docs: https://supabase.com/docs
- Supabase Community: https://github.com/supabase/supabase/discussions
- Next.js + Supabase Guide: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs

---

**Setup complete!** 🎉 Your Supabase backend is ready for the Calendar module.
