import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { Button, Campo, Input, NumberInput, Progress } from '@/components/ui'
import { usePerfil } from '@/app/PerfilContext'
import { NOTAS } from '@/lib/enem'

/** Primeiro acesso em 3 etapas. Tudo pode ser mudado depois em Perfil. */
export function Onboarding() {
  const { perfil, salvarPerfil } = usePerfil()
  const [etapa, setEtapa] = useState(0)
  const [p, setP] = useState(perfil)
  const etapas = ['Sobre você', 'Seu objetivo', 'Suas metas de nota']

  async function concluir() {
    await salvarPerfil({ ...p, onboarding_ok: true }, 'Tudo pronto!')
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-night/60 backdrop-blur-sm p-4">
      <div className="surgir w-full max-w-lg card shadow-lg p-6 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-brand">Etapa {etapa + 1} de 3 · {etapas[etapa]}</span>
          <Progress valor={(etapa + 1) / 3} />
        </div>
        {etapa === 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="titulo text-2xl">Bem-vindo ao Rumo 👋</h2>
            <p className="text-muted -mt-2">Três perguntas rápidas para montar seu painel.</p>
            <Campo rotulo="Como quer ser chamado?">{(id) => <Input id={id} value={p.nome} onChange={(e) => setP({ ...p, nome: e.target.value })} />}</Campo>
            <Campo rotulo="Data de nascimento">{(id) => <Input id={id} type="date" value={p.nascimento ?? ''} onChange={(e) => setP({ ...p, nascimento: e.target.value || null })} />}</Campo>
          </div>
        )}
        {etapa === 1 && (
          <div className="flex flex-col gap-4">
            <h2 className="titulo text-2xl">Onde você quer chegar?</h2>
            <Campo rotulo="Curso dos sonhos">{(id) => <Input id={id} value={p.curso} onChange={(e) => setP({ ...p, curso: e.target.value })} />}</Campo>
            <Campo rotulo="Faculdade (opcional)">{(id) => <Input id={id} placeholder="Ex.: UFRN" value={p.faculdade} onChange={(e) => setP({ ...p, faculdade: e.target.value })} />}</Campo>
            <Campo rotulo="Data do ENEM">{(id) => <Input id={id} type="date" value={p.data_enem} onChange={(e) => setP({ ...p, data_enem: e.target.value })} />}</Campo>
          </div>
        )}
        {etapa === 2 && (
          <div className="flex flex-col gap-4">
            <h2 className="titulo text-2xl">Metas de nota</h2>
            <p className="text-muted -mt-2 text-sm">Média perto de 800 costuma ser competitiva para Medicina em federais. Confira a nota de corte do seu curso no SISU.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {NOTAS.map((a) => (
                <Campo key={a.chave} rotulo={a.nome}>{(id) => <NumberInput id={id} min={0} max={1000} step={10} value={p.metas_nota[a.chave]} onValor={(v) => setP({ ...p, metas_nota: { ...p.metas_nota, [a.chave]: v ?? 0 } })} />}</Campo>
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <Button variante="fantasma" onClick={() => (etapa ? setEtapa(etapa - 1) : concluir())}>{etapa ? 'Voltar' : 'Pular'}</Button>
          {etapa < 2
            ? <Button onClick={() => setEtapa(etapa + 1)} icone={<ArrowRight size={16} />}>Continuar</Button>
            : <Button onClick={concluir} icone={<Check size={16} />}>Começar</Button>}
        </div>
      </div>
    </div>
  )
}
