import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {

    const { prompt, apiKey: userApiKey } = await req.json()
    


    const apiKey = userApiKey || Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) {
      throw new Error('No Gemini API Key provided. Please add one in Settings.')
    }


    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
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


    if (!response.ok) {
      console.error('Gemini API Error:', data)
      const errorMessage = data.error?.message || 'Failed to generate content from Gemini'
      throw new Error(errorMessage)
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''


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