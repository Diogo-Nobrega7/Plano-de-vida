import { useEffect, useState, type ComponentType } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/data/supabase'
import { garantirDadosIniciais } from '@/data/seeds'
import { useRota } from '@/app/useRota'
import { PerfilProvider, usePerfil } from '@/app/PerfilContext'
import { useTema } from '@/app/useTema'
import { AppShell } from '@/components/layout/AppShell'
import { Marca } from '@/components/layout/Marca'
import { Camada, Toaster } from '@/components/ui'
import { LoginPage } from '@/features/auth/LoginPage'
import { Onboarding } from '@/features/perfil/Onboarding'
import { PerfilPage } from '@/features/perfil/PerfilPage'
import { HojePage } from '@/features/hoje/HojePage'
import { DisciplinasPage } from '@/features/estudos/DisciplinasPage'
import { AulasPage } from '@/features/estudos/AulasPage'
import { FocoPage } from '@/features/estudos/FocoPage'
import { RevisoesPage } from '@/features/estudos/RevisoesPage'
import { SimuladosPage } from '@/features/estudos/SimuladosPage'
import { RedacaoPage } from '@/features/redacao/RedacaoPage'
import { ResumoPage } from '@/features/financas/ResumoPage'
import { LiberdadePage } from '@/features/financas/LiberdadePage'
import { InvestirPage } from '@/features/financas/InvestirPage'
import { SalarioPage } from '@/features/financas/SalarioPage'
import { OrcamentoPage } from '@/features/financas/OrcamentoPage'
import { LinhaPage } from '@/features/carreira/LinhaPage'
import { MetasPage } from '@/features/carreira/MetasPage'
import { ComparadorPage } from '@/features/carreira/ComparadorPage'
import { DiarioPage } from '@/features/carreira/DiarioPage'

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
      <Pagina aba={rota.aba} />
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
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSessao(s))
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
