/** Junta os registros de estudo e calcula XP, nível, sequência, missões e conquistas. */
import { useMemo } from 'react'
import { useTabela } from './hooks'
import { hojeISO } from '@/lib/datas'
import { conquistas, missoesDoDia, nivel, sequencia, xpTotal } from '@/lib/gamificacao'
import { usePerfil } from '@/app/PerfilContext'

export function useProgresso() {
  const { perfil } = usePerfil()
  const sessoes = useTabela('sessoes', [{ coluna: 'data', asc: false }])
  const aulas = useTabela('aulas')
  const redacoes = useTabela('redacoes')
  const simulados = useTabela('simulados', [{ coluna: 'data' }])
  const revisoes = useTabela('revisoes')
  const conteudos = useTabela('conteudos')

  return useMemo(() => {
    const hoje = hojeISO()
    const ses = sessoes.dados
    const atividade = {
      sessoes: ses, aulasAssistidas: aulas.dados.filter((a) => a.assistida).length,
      redacoes: redacoes.dados.filter((r) => r.c1 != null).length, simulados: simulados.dados.length,
      revisoesFeitas: revisoes.dados.reduce((s, r) => s + r.feitas, 0), conteudosDominados: conteudos.dados.filter((c) => c.status === 'dominado').length,
    }
    // Dia estudado = qualquer atividade: sessão, aula assistida, revisão, redação ou simulado.
    const datas = [...new Set([
      ...ses.map((s) => s.data),
      ...aulas.dados.map((a) => a.assistida_em).filter(Boolean) as string[],
      ...revisoes.dados.map((r) => r.ultima).filter(Boolean) as string[],
      ...redacoes.dados.map((r) => r.data),
      ...simulados.dados.map((s) => s.data),
    ])]
    const seq = sequencia(datas, hoje)
    const xp = xpTotal(atividade)
    const totalQuestoes = ses.reduce((s, x) => s + (x.questoes ?? 0), 0)
    const totalAcertos = ses.reduce((s, x) => s + (x.acertos ?? 0), 0)
    const sessoesHoje = ses.filter((s) => s.data === hoje)
    const missoes = missoesDoDia(sessoesHoje, aulas.dados.filter((a) => a.assistida_em === hoje).length,
      revisoes.dados.filter((r) => r.ultima === hoje).length, perfil.missoes)
    return {
      carregando: sessoes.carregando, hoje, xp, nivel: nivel(xp), seq, datas, missoes, totalQuestoes, totalAcertos,
      minutosTotal: ses.reduce((s, x) => s + x.minutos, 0),
      conquistas: conquistas({ ...atividade, recorde: seq.recorde, totalQuestoes }),
      sessoes: ses, simulados: simulados.dados, revisoes: revisoes.dados, conteudos: conteudos.dados, aulas: aulas.dados, redacoes: redacoes.dados,
    }
  }, [sessoes.dados, sessoes.carregando, aulas.dados, redacoes.dados, simulados.dados, revisoes.dados, conteudos.dados, perfil.missoes])
}
