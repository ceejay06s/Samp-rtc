// Supabase Edge Function: Fetch Telegram sticker set via BOT API & upload to Storage
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
Deno.serve(async (req)=>{
  if (req.method !== "POST") {
    return new Response("Only POST requests allowed", {
      status: 405
    });
  }
  try {
    const { shortname } = await req.json();
    if (!shortname) {
      return new Response("Sticker shortname is required", {
        status: 400
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const bucketName = Deno.env.get("SUPABASE_BUCKET") || "telegram-stickers";
    const telegramApiKey = Deno.env.get("TELEGRAM_API_KEY");
    if (!supabaseUrl || !supabaseKey || !telegramApiKey) {
      return new Response("Missing environment variables", {
        status: 500
      });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    // 1️⃣ Get sticker set info from Telegram
    const setRes = await fetch(`https://api.telegram.org/bot${telegramApiKey}/getStickerSet?name=${encodeURIComponent(shortname)}`);
    const setData = await setRes.json();
    if (!setData.ok) {
      return new Response(`Failed to get sticker set: ${setData.description}`, {
        status: 400
      });
    }
    const stickers = setData.result.stickers;
    if (!stickers || stickers.length === 0) {
      return new Response("No stickers found.", {
        status: 404
      });
    }
    // 2️⃣ Download & upload each sticker
    const uploadResults = await Promise.allSettled(stickers.map(async (sticker, idx)=>{
      try {
        // Get file info from Telegram
        const fileId = sticker.file_id;
        const fileInfoRes = await fetch(`https://api.telegram.org/bot${telegramApiKey}/getFile?file_id=${fileId}`);
        const fileInfoData = await fileInfoRes.json();
        if (!fileInfoData.ok) throw new Error(fileInfoData.description);
        const filePath = fileInfoData.result.file_path;
        const fileUrl = `https://api.telegram.org/file/bot${telegramApiKey}/${filePath}`;
        const ext = filePath.endsWith(".tgs") ? "tgs" : filePath.endsWith(".webp") ? "webp" : "bin";
        const filename = `${shortname}/sticker_${idx + 1}.${ext}`;
        // Download the file
        const fileRes = await fetch(fileUrl);
        if (!fileRes.ok) throw new Error(`Failed to download ${fileUrl}`);
        const fileBuffer = await fileRes.arrayBuffer();
        // Check file size (Supabase free tier limit is typically 50MB)
        const fileSizeMB = fileBuffer.byteLength / (1024 * 1024);
        if (fileSizeMB > 50) {
          console.warn(`Skipping ${filename}: File size ${fileSizeMB.toFixed(2)}MB exceeds 50MB limit`);
          return null;
        }
        // Upload to Supabase Storage
        const { error } = await supabase.storage.from(bucketName).upload(filename, fileBuffer, {
          contentType: ext === "tgs" ? "application/json" : "image/webp",
          upsert: true
        });
        if (error) throw new Error(error.message);
        return filename;
      } catch (err) {
        console.error("Upload error:", err);
        return null;
      }
    }));
    const uploaded = uploadResults.filter((r)=>r.status === "fulfilled" && r.value !== null).length;
    return new Response(JSON.stringify({
      message: `✅ Uploaded ${uploaded}/${stickers.length} stickers from ${shortname}`,
      total: stickers.length,
      uploaded
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("Server error:", err);
    return new Response("Internal Server Error", {
      status: 500
    });
  }
});
