import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    // 2. Parse body
    const { prompt, apiKey: userApiKey } = await req.json()
    
    // 3. Validate Key
    // Use user key if provided (BYOK), otherwise fallback to env
    const apiKey = userApiKey || Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) {
      throw new Error('No Gemini API Key provided. Please add one in Settings.')
    }

    // 4. Call Google Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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

    // 5. Handle API Errors
    if (!response.ok) {
      console.error('Gemini API Error:', data)
      const errorMessage = data.error?.message || 'Failed to generate content from Gemini'
      throw new Error(errorMessage)
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // 6. Return Success
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