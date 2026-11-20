import { Suspense, lazy, useEffect, useState, type ComponentType } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/data/supabase'
import { garantirDadosIniciais } from '@/data/seeds'
import { limparCache } from '@/data/hooks'
import { useRota } from '@/app/useRota'
import { PerfilProvider, usePerfil } from '@/app/PerfilContext'
import { useTema } from '@/app/useTema'
import { AppShell } from '@/components/layout/AppShell'
import { Marca } from '@/components/layout/Marca'
import { Camada, Carregando, Toaster } from '@/components/ui'
import { LoginPage } from '@/features/auth/LoginPage'
import { Onboarding } from '@/features/perfil/Onboarding'
import { HojePage } from '@/features/hoje/HojePage'

// Telas carregadas sob demanda: o primeiro acesso baixa só o necessário.
const PerfilPage = lazy(() => import('@/features/perfil/PerfilPage').then((m) => ({ default: m.PerfilPage })))
const DisciplinasPage = lazy(() => import('@/features/estudos/DisciplinasPage').then((m) => ({ default: m.DisciplinasPage })))
const AulasPage = lazy(() => import('@/features/estudos/AulasPage').then((m) => ({ default: m.AulasPage })))
const FocoPage = lazy(() => import('@/features/estudos/FocoPage').then((m) => ({ default: m.FocoPage })))
const RevisoesPage = lazy(() => import('@/features/estudos/RevisoesPage').then((m) => ({ default: m.RevisoesPage })))
const SimuladosPage = lazy(() => import('@/features/estudos/SimuladosPage').then((m) => ({ default: m.SimuladosPage })))
const RedacaoPage = lazy(() => import('@/features/redacao/RedacaoPage').then((m) => ({ default: m.RedacaoPage })))
const ResumoPage = lazy(() => import('@/features/financas/ResumoPage').then((m) => ({ default: m.ResumoPage })))
const LiberdadePage = lazy(() => import('@/features/financas/LiberdadePage').then((m) => ({ default: m.LiberdadePage })))
const InvestirPage = lazy(() => import('@/features/financas/InvestirPage').then((m) => ({ default: m.InvestirPage })))
const SalarioPage = lazy(() => import('@/features/financas/SalarioPage').then((m) => ({ default: m.SalarioPage })))
const OrcamentoPage = lazy(() => import('@/features/financas/OrcamentoPage').then((m) => ({ default: m.OrcamentoPage })))
const LinhaPage = lazy(() => import('@/features/carreira/LinhaPage').then((m) => ({ default: m.LinhaPage })))
const MetasPage = lazy(() => import('@/features/carreira/MetasPage').then((m) => ({ default: m.MetasPage })))
const ComparadorPage = lazy(() => import('@/features/carreira/ComparadorPage').then((m) => ({ default: m.ComparadorPage })))
const DiarioPage = lazy(() => import('@/features/carreira/DiarioPage').then((m) => ({ default: m.DiarioPage })))

/** Cada tela, por "secao/aba". Para criar uma tela nova: registre em app/routes.ts e aqui. */
const PAGINAS: Record<string, ComponentType<{ aba: string }>> = {
  'hoje/': HojePage, 'perfil/': PerfilPage,
  'estudos/disciplinas': DisciplinasPage, 'estudos/aulas': AulasPage, 'estudos/foco': FocoPage,
  'estudos/revisoes': RevisoesPage, 'estudos/simulados': SimuladosPage,
  'redacao/escrever': RedacaoPage, 'redacao/minhas': RedacaoPage, 'redacao/temas': RedacaoPage, 'redacao/guia': RedacaoPage,
  'financas/resumo': ResumoPage, 'financas/liberdade': LiberdadePage, 'financas/investir': InvestirPage,
  'financas/salario': SalarioPage, 'financas/orcamento': OrcamentoPage,
  'carreira/linha': LinhaPage, 'carreira/metas': MetasPage, 'carreira/comparador': ComparadorPage, 'carreira/diario': DiarioPage,
}

function Telas() {
  const rota = useRota()
  const { perfil } = usePerfil()
  const Pagina = PAGINAS[`${rota.secao}/${rota.aba}`] ?? HojePage
  return (
    <AppShell rota={rota}>
      <Suspense fallback={<Carregando />}><Pagina aba={rota.aba} /></Suspense>
      {perfil.id && !perfil.onboarding_ok && <Camada><Onboarding /></Camada>}
    </AppShell>
  )
}

function Abertura() {
  return <div className="min-h-screen grid place-items-center"><div className="animate-pulse"><Marca /></div></div>
}

export function App() {
  useTema()
  const [sessao, setSessao] = useState<Session | null | undefined>(supabase ? undefined : null)
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSessao(data.session))
    const { data } = supabase.auth.onAuthStateChange((evento, s) => {
      if (evento === 'SIGNED_OUT') limparCache()
      setSessao(s)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const logado = !supabase || !!sessao
  useEffect(() => {
    if (!logado) { setPronto(false); return }
    garantirDadosIniciais().catch((e) => console.error(e)).finally(() => setPronto(true))
  }, [logado])

  if (sessao === undefined) return <Abertura />
  if (!logado) return <><LoginPage /><Toaster /></>
  if (!pronto) return <Abertura />
  return <PerfilProvider><Telas /><Toaster /></PerfilProvider>
}
