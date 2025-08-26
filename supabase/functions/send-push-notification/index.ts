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
      .select('expo_push_token, web_push_subscription, device_type')
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

    // Prepare notification payloads for different device types
    const expoMessages = [];
    const webPushMessages = [];

    tokens.forEach(token => {
      if (token.device_type === 'web' && token.web_push_subscription) {
        // Web push notification
        webPushMessages.push({
          subscription: token.web_push_subscription,
          payload: {
            title,
            body,
            data: {
              ...data,
              type: notificationType,
              timestamp: new Date().toISOString(),
            },
          },
        });
      } else if (token.expo_push_token) {
        // Expo push notification for mobile
        expoMessages.push({
          to: token.expo_push_token,
          sound: 'default',
          title,
          body,
          data: {
            ...data,
            type: notificationType,
            timestamp: new Date().toISOString(),
          },
        });
      }
    });

    let expoResult = null;
    let webPushResult = null;

    // Send Expo notifications if any
    if (expoMessages.length > 0) {
      const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expoMessages),
      });

      if (expoResponse.ok) {
        expoResult = await expoResponse.json();
      } else {
        console.error('Expo Push API error:', await expoResponse.text());
      }
    }

    // Send Web Push notifications if any
    if (webPushMessages.length > 0) {
      // For web push, we need to send to a web push service
      // This is a simplified version - you might want to use a service like Firebase
      console.log('Web push notifications would be sent here:', webPushMessages.length);
      webPushResult = { sent: webPushMessages.length, type: 'web_push' };
    }



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

    const totalSent = (expoResult?.sent || 0) + (webPushResult?.sent || 0);
    
    return new Response(
      JSON.stringify({
        success: true,
        totalTokens: tokens.length,
        expoResult,
        webPushResult,
        totalSent,
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
