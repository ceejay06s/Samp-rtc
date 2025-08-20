import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request body
    const { userIds, title, body, data, notificationType } = await req.json()

    if (!userIds || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get push tokens for users
    const { data: tokens, error: tokenError } = await supabase
      .from('push_tokens')
      .select('expo_push_token, device_type')
      .in('user_id', userIds)
      .eq('is_active', true)

    if (tokenError) {
      console.error('Error fetching push tokens:', tokenError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active push tokens found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare notification payloads
    const messages = tokens.map(token => ({
      to: token.expo_push_token,
      sound: 'default',
      title,
      body,
      data: {
        ...data,
        type: notificationType,
        timestamp: new Date().toISOString(),
      },
    }))

    // Send notifications via Expo Push API
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    if (!expoResponse.ok) {
      const errorText = await expoResponse.text()
      console.error('Expo Push API error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to send push notifications' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const expoResult = await expoResponse.json()

    // Log notifications to history
    const historyEntries = userIds.map(userId => ({
      user_id: userId,
      title,
      body,
      data,
      notification_type: notificationType,
      status: 'sent',
    }))

    const { error: historyError } = await supabase
      .from('notification_history')
      .insert(historyEntries)

    if (historyError) {
      console.error('Error logging notifications:', historyError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: tokens.length,
        expoResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-push-notification function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
