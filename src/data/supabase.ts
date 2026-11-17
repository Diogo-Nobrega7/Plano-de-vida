import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const chave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

/** Sem as variáveis, o app roda em modo local (dados só neste navegador). */
export const supabase: SupabaseClient | null = url && chave ? createClient(url, chave) : null
export const modoLocal = !supabase
