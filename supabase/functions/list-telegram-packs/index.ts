// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { DOMParser } from "npm:linkedom@0.16.8";
Deno.serve(async (req)=>{
  const { source, page } = await req.json();
  try {
    let url = "https://tlgrm.eu/stickers";
    if (source == 1) {
      url = "https://combot.org/stickers";
    }
    const res = await fetch(`${url}?page=${page}`);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) {
      return new Response(JSON.stringify({
        error: "Parse error"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const links = doc.querySelectorAll("a[href^='/stickers/']");
    const shortnames = new Set();
    links.forEach((link)=>{
      const href = link.getAttribute("href");
      if (href) {
        const parts = href.split("/");
        const name = parts[parts.length - 1];
        const exclude = [
          "trending",
          "top30"
        ];
        if (name && !exclude.includes(name)) shortnames.add(name);
      }
    });
    return new Response(JSON.stringify(Array.from(shortnames)), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" // CORS support
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
