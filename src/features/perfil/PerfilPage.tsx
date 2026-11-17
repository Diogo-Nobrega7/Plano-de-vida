import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { Button, Cabecalho, Campo, Card, CardTitulo, Input, NumberInput } from '@/components/ui'
import { usePerfil } from '@/app/PerfilContext'
import { NOTAS } from '@/lib/enem'
import { modoLocal } from '@/data/supabase'

export function PerfilPage() {
  const { perfil, salvarPerfil } = usePerfil()
  const [p, setP] = useState(perfil)
  useEffect(() => setP(perfil), [perfil.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const mis = p.missoes

  return (
    <div className="flex flex-col gap-6">
      <Cabecalho titulo="Perfil e metas" sub="Tudo o que personaliza o seu painel." acao={<Button icone={<Save size={16} />} onClick={() => salvarPerfil(p, 'Perfil salvo')}>Salvar</Button>} />
      <div className="grid gap-5 lg:grid-cols-2 items-start">
        <Card>
          <CardTitulo titulo="Sobre você" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Nome">{(id) => <Input id={id} value={p.nome} onChange={(e) => setP({ ...p, nome: e.target.value })} />}</Campo>
            <Campo rotulo="Nascimento">{(id) => <Input id={id} type="date" value={p.nascimento ?? ''} onChange={(e) => setP({ ...p, nascimento: e.target.value || null })} />}</Campo>
            <Campo rotulo="Curso">{(id) => <Input id={id} value={p.curso} onChange={(e) => setP({ ...p, curso: e.target.value })} />}</Campo>
            <Campo rotulo="Faculdade">{(id) => <Input id={id} value={p.faculdade} onChange={(e) => setP({ ...p, faculdade: e.target.value })} />}</Campo>
            <Campo rotulo="Data do ENEM">{(id) => <Input id={id} type="date" value={p.data_enem} onChange={(e) => setP({ ...p, data_enem: e.target.value })} />}</Campo>
          </div>
        </Card>
        <Card>
          <CardTitulo titulo="Metas de nota no ENEM" sub="Confira as notas de corte do SISU do seu curso" />
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
            {NOTAS.map((a) => <Campo key={a.chave} rotulo={a.nome}>{(id) => <NumberInput id={id} min={0} max={1000} step={10} value={p.metas_nota[a.chave]} onValor={(v) => setP({ ...p, metas_nota: { ...p.metas_nota, [a.chave]: v ?? 0 } })} />}</Campo>)}
          </div>
        </Card>
        <Card>
          <CardTitulo titulo="Missões diárias" sub="As metas do dia na tela Hoje" />
          <div className="grid gap-4 grid-cols-2">
            <Campo rotulo="Questões">{(id) => <NumberInput id={id} min={1} value={mis.questoes} onValor={(v) => setP({ ...p, missoes: { ...mis, questoes: v ?? 1 } })} />}</Campo>
            <Campo rotulo="Minutos de foco">{(id) => <NumberInput id={id} min={5} step={5} value={mis.minutos} onValor={(v) => setP({ ...p, missoes: { ...mis, minutos: v ?? 5 } })} />}</Campo>
            <Campo rotulo="Aulas">{(id) => <NumberInput id={id} min={1} value={mis.aulas} onValor={(v) => setP({ ...p, missoes: { ...mis, aulas: v ?? 1 } })} />}</Campo>
            <Campo rotulo="Revisões">{(id) => <NumberInput id={id} min={1} value={mis.revisoes} onValor={(v) => setP({ ...p, missoes: { ...mis, revisoes: v ?? 1 } })} />}</Campo>
          </div>
        </Card>
        <Card>
          <CardTitulo titulo="Dados" />
          <p className="text-sm text-muted">{modoLocal ? 'Modo local: os dados estão só neste navegador. Para guardar online e acessar de qualquer lugar, configure o Supabase (veja docs/PUBLICAR.md).' : 'Seus dados estão no Supabase, protegidos: só a sua conta consegue ler ou alterar.'}</p>
          <Button variante="secundario" className="mt-4" onClick={() => salvarPerfil({ onboarding_ok: false })}>Refazer boas-vindas</Button>
        </Card>
      </div>
    </div>
  )
}
