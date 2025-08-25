import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Malý sanity log (bez kľúča)
if (!url) {
  // eslint-disable-next-line no-console
  console.warn('[supabase] VITE_SUPABASE_URL je prázdne – klient nebude vytvorený')
}

let client: SupabaseClient | null = null
try {
  if (url && key) {
    client = createClient(url, key)
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.error('[supabase] createClient zlyhal:', e)
  client = null
}

export const supabase = client
export const SUPABASE_DEBUG = {
  urlHost: (() => {
    try {
      return url ? new URL(url).host : null
    } catch { return null }
  })(),
  hasUrl: Boolean(url),
  hasKey: Boolean(key),
}
