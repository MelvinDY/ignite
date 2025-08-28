// Main entry point for Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { pathname } = new URL(req.url)
  
  // Route to different functions based on pathname
  switch (pathname) {
    case "/hello":
      return new Response(
        JSON.stringify({ message: "Hello from Supabase Edge Functions!" }),
        { headers: { "Content-Type": "application/json" } }
      )
    default:
      return new Response(
        JSON.stringify({ error: "Function not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
  }
})