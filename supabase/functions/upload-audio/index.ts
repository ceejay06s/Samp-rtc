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
    console.log('🎤 Edge Function: Starting audio upload process')
    
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('🔧 Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseServiceKey?.length || 0
    })
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing environment variables')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('✅ Supabase client created')

    // Parse request body
    let requestBody
    try {
      requestBody = await req.json()
      console.log('📥 Request body parsed:', {
        hasAudioData: !!requestBody.audioData,
        fileName: requestBody.fileName,
        conversationId: requestBody.conversationId,
        userId: requestBody.userId,
        duration: requestBody.duration,
        audioDataLength: requestBody.audioData?.length || 0
      })
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON in request body' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { audioData, fileName, conversationId, userId, duration, metadata } = requestBody

    // Validate required fields
    if (!audioData || !fileName || !conversationId || !userId) {
      console.error('❌ Missing required fields:', { audioData: !!audioData, fileName, conversationId, userId })
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: audioData, fileName, conversationId, userId' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Convert base64 to Uint8Array
    let fileData
    try {
      fileData = Uint8Array.from(atob(audioData), c => c.charCodeAt(0))
      console.log('✅ Base64 converted to Uint8Array, length:', fileData.length)
    } catch (conversionError) {
      console.error('❌ Failed to convert base64 to Uint8Array:', conversionError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid audio data format' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // Check file size (50MB limit)
    const fileSizeInBytes = fileData.length
    const fileSizeInMB = fileSizeInBytes / (1024 * 1024)
    
    console.log('📊 File size check:', { bytes: fileSizeInBytes, mb: fileSizeInMB.toFixed(2) })
    
    if (fileSizeInMB > 50) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `File size (${fileSizeInMB.toFixed(2)} MB) exceeds 50MB limit` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create organized path: voice/conversations/conversation_id/user_id/filename
    const audioPath = `voice/conversations/${conversationId}/${userId}/${fileName}`
    
    console.log(`🎤 Uploading audio: ${audioPath}, size: ${fileSizeInMB.toFixed(2)} MB`)

    // Check if bucket exists and is accessible
    try {
      const { data: bucketInfo, error: bucketError } = await supabase.storage.getBucket('chat-media')
      if (bucketError) {
        console.error('❌ Bucket access error:', bucketError)
        throw new Error(`Bucket access failed: ${bucketError.message}`)
      }
      console.log('✅ Bucket accessible:', bucketInfo?.name)
    } catch (bucketCheckError) {
      console.error('❌ Failed to check bucket:', bucketCheckError)
      throw new Error(`Bucket check failed: ${bucketCheckError.message}`)
    }

    // Upload audio to chat-media bucket
    console.log('📤 Starting storage upload...')
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-media')
      .upload(audioPath, fileData, {
        contentType: 'audio/webm',
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
      })

    if (uploadError) {
      console.error('❌ Audio upload failed:', uploadError)
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    console.log('✅ Storage upload successful:', uploadData)

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('chat-media')
      .getPublicUrl(audioPath)

    console.log('✅ Audio public URL generated:', urlData.publicUrl)

    // Try to create message in the database
    let messageData
    try {
      console.log('📝 Creating database message...')
      const { data: dbMessageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content: 'Voice message',
          message_type: 'voice',
          metadata: {
            audioUrl: urlData.publicUrl,
            audioDuration: duration || 0,
            audioPath: audioPath,
            uploadedVia: 'edge-function',
            ...metadata
          }
        })
        .select()
        .single()

      if (messageError) {
        console.error('❌ Failed to create message:', messageError)
        // Don't throw here, we'll return success with just the upload
        console.log('⚠️ Message creation failed, but upload was successful')
      } else {
        messageData = dbMessageData
        console.log('✅ Message created successfully:', messageData.id)
      }
    } catch (dbError) {
      console.error('❌ Database operation failed:', dbError)
      console.log('⚠️ Database operation failed, but upload was successful')
    }

    // Return success response (even if message creation failed)
    const responseData = {
      success: true,
      message: messageData ? 'Audio uploaded and message created successfully' : 'Audio uploaded successfully (message creation failed)',
      data: {
        messageId: messageData?.id || null,
        audioUrl: urlData.publicUrl,
        audioPath: audioPath,
        fileSize: fileSizeInMB,
        duration: duration || 0,
        uploadOnly: !messageData
      }
    }

    console.log('✅ Returning success response:', responseData)

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Edge function error:', error)
    
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    }
    
    console.error('❌ Error response:', errorResponse)
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
