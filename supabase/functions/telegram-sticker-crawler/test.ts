// Test script for Telegram Sticker Crawler Edge Function
// Run with: deno run --allow-net --allow-env test.ts

import { createClient } from "npm:@supabase/supabase-js@2";

// Test configuration
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "your-supabase-url";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "your-anon-key";
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/telegram-sticker-crawler`;

async function testStickerCrawler() {
  console.log("🧪 Testing Telegram Sticker Crawler Edge Function");
  console.log("=" .repeat(50));
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Test cases
  const testCases = [
    "cattos", // Popular cat stickers
    "doge",   // Doge stickers
    "pepe",   // Pepe stickers
    "anime"   // Anime stickers
  ];
  
  for (const shortname of testCases) {
    console.log(`\n📱 Testing shortname: ${shortname}`);
    
    try {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ shortname })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Success: ${result.message}`);
        console.log(`   📊 Total: ${result.total}, Uploaded: ${result.uploaded}, Animated: ${result.animated}`);
        
        if (result.details && result.details.length > 0) {
          console.log("   📁 File details:");
          result.details.forEach((file: any, index: number) => {
            console.log(`      ${index + 1}. ${file.filename} (${file.isAnimated ? '🎬' : '🖼️'} ${file.contentType}) - ${(file.size / 1024).toFixed(1)}KB`);
          });
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ Error ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.log(`💥 Exception: ${error.message}`);
    }
    
    // Wait between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log("\n" + "=" .repeat(50));
  console.log("🏁 Testing completed!");
}

// Run the test
if (import.meta.main) {
  testStickerCrawler().catch(console.error);
} 