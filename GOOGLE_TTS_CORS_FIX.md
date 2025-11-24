# Google TTS CORS Fix - Deployment Instructions

## Changes Made

### 1. Created Supabase Edge Function
**File:** `supabase/functions/text-to-speech/index.ts`
- Proxies Google TTS API calls from server-side, bypassing CORS restrictions
- Accepts text, voice, audioConfig, and API key in request body
- Returns base64-encoded audio content or error

### 2. Updated TTS Service
**File:** `src/services/tts/index.ts`
- Added import: `import { supabase } from '@/lib/supabase'`
- Modified `speakGoogle()` method to call the new Supabase Edge Function
- Function now invokes `supabase.functions.invoke('text-to-speech', { body: payload })`

## Deployment Steps

### Step 1: Deploy the Edge Function
Run this command in your project root:

```bash
npx supabase functions deploy text-to-speech
```

### Step 2: Verify Deployment
Check the Supabase dashboard under **Functions** → **text-to-speech** to confirm it's deployed.

### Step 3: (Optional) Set Environment Variable
If you want the Edge Function to have a default API key, add this to your `.env.local` in Supabase:
```
GOOGLE_TTS_API_KEY=your-api-key-here
```

The function will use the environment variable if no API key is provided in the request body.

### Step 4: Test
1. Run your app: `npm run dev`
2. Set up Google TTS provider in settings with your API key
3. Try to speak text - it should now work without CORS errors!

## How It Works

1. Browser app calls `supabase.functions.invoke('text-to-speech')`
2. Supabase Edge Function executes on the server
3. Edge Function calls Google Cloud TTS API (no CORS because it's server-to-server)
4. Audio response is sent back to browser
5. Browser plays the audio

## Troubleshooting

- **Function not found error:** Make sure you ran `npx supabase functions deploy text-to-speech`
- **API key missing error:** Verify you're providing `googleApiKey` in settings or set `GOOGLE_TTS_API_KEY` env var
- **Google API error:** Check that your API key has TTS enabled in Google Cloud Console
