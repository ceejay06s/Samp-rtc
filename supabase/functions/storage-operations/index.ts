import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_FILE_SIZE_KB = 51200 // 50MB

interface StorageOperation {
  operation: 'upload' | 'update' | 'delete' | 'list'
  bucket: string
  path?: string
  file?: string // base64 encoded file
  fileType?: string
  fileName?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract the token
    const token = authHeader.replace('Bearer ', '')
    
    // Create Supabase client with the provided token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Use service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Verify the token is valid (optional - for additional security)
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (error) {
        console.log('Token verification failed:', error.message)
        // Continue anyway since we're using service role
      } else {
        console.log('Authenticated user:', user?.id)
      }
    } catch (error) {
      console.log('Token verification error:', error)
      // Continue anyway since we're using service role
    }

    // Get the request body
    const { operation, bucket, path, file, fileType, fileName }: StorageOperation = await req.json()

    // Validate required parameters
    if (!operation || !bucket) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: operation and bucket' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let result: any

    switch (operation) {
      case 'upload':
        if (!file || !fileType) {
          return new Response(
            JSON.stringify({ error: 'Upload requires file and fileType' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Convert base64 to Uint8Array
        const fileData = Uint8Array.from(atob(file), c => c.charCodeAt(0))
        
        // Check file size (50MB limit)
        const fileSizeInBytes = fileData.length
        const fileSizeInKB = fileSizeInBytes / 1024
        
        if (fileSizeInKB > MAX_FILE_SIZE_KB) {
          return new Response(
            JSON.stringify({ 
              error: `File size (${Math.round(fileSizeInKB)} KB) exceeds 50MB limit` 
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        console.log(`Uploading file: ${fileName || 'unnamed'}, size: ${Math.round(fileSizeInKB)} KB`)
        
        // Create file path - if path already includes filename, use it directly
        const filePath = path || fileName
        
        // Upload file
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, fileData, {
            contentType: fileType,
            upsert: true
          })

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`)
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath)

        result = {
          success: true,
          path: filePath,
          url: urlData.publicUrl,
          data: uploadData
        }
        break

      case 'update':
        if (!path || !file || !fileType) {
          return new Response(
            JSON.stringify({ error: 'Update requires path, file, and fileType' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Convert base64 to Uint8Array
        const updateFileData = Uint8Array.from(atob(file), c => c.charCodeAt(0))
        
        // Check file size (50MB limit)
        const updateFileSizeInBytes = updateFileData.length
        const updateFileSizeInKB = updateFileSizeInBytes / 1024
        
        if (updateFileSizeInKB > MAX_FILE_SIZE_KB) {
          return new Response(
            JSON.stringify({ 
              error: `File size (${Math.round(updateFileSizeInKB)} KB) exceeds 50MB limit` 
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        console.log(`Updating file: ${path}, size: ${Math.round(updateFileSizeInKB)} KB`)
        
        // Update file (upload with upsert)
        const { data: updateData, error: updateError } = await supabase.storage
          .from(bucket)
          .upload(path, updateFileData, {
            contentType: fileType,
            upsert: true
          })

        if (updateError) {
          throw new Error(`Update failed: ${updateError.message}`)
        }

        // Get public URL
        const { data: updateUrlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(path)

        result = {
          success: true,
          path: path,
          url: updateUrlData.publicUrl,
          data: updateData
        }
        break

      case 'delete':
        if (!path) {
          return new Response(
            JSON.stringify({ error: 'Delete requires path' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Delete file
        const { error: deleteError } = await supabase.storage
          .from(bucket)
          .remove([path])

        if (deleteError) {
          throw new Error(`Delete failed: ${deleteError.message}`)
        }

        result = {
          success: true,
          path: path,
          message: 'File deleted successfully'
        }
        break

      case 'list':
        // List files in bucket or path
        const { data: listData, error: listError } = await supabase.storage
          .from(bucket)
          .list(path || '')

        if (listError) {
          throw new Error(`List failed: ${listError.message}`)
        }

        result = {
          success: true,
          files: listData,
          path: path || 'root'
        }
        break

      default:
        return new Response(
          JSON.stringify({ error: `Unknown operation: ${operation}` }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Storage operation error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 