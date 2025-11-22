// supabase/functions/generate-card/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// Declare Deno for TypeScript type checking environment
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // 1. Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Extract user-provided apiKey (optional) and prompt
    const { prompt, apiKey: userApiKey } = await req.json()
    // Fallback to server env key if user did not provide one
    const apiKey = userApiKey || Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) {
      throw new Error('No Gemini API Key provided. Please add one in Settings.')
    }

    // 3. Call Google Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    )

    const data = await response.json()

    // 4. Parse the response
    if (!response.ok) {
      console.error('Gemini API Error:', data)
      throw new Error(data.error?.message || 'Failed to generate content')
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // 5. Return the text to your React app
    return new Response(
      JSON.stringify({ text: generatedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Function Error:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})