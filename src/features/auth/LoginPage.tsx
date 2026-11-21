import { useState } from 'react'
import { ArrowLeft, KeyRound, Lock, MailCheck } from 'lucide-react'
import { supabase } from '@/data/supabase'
import { Button, Campo, Input } from '@/components/ui'
import { Marca } from '@/components/layout/Marca'

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hero hidden lg:flex flex-col justify-between p-12 text-white">
        <Marca claro />
        <div className="max-w-md">
          <h1 className="titulo text-5xl leading-[1.05]">Estudos, carreira e dinheiro no mesmo rumo.</h1>
          <p className="mt-5 text-lg text-white/80">Plano do dia, ENEM, redação, metas e liberdade financeira, num lugar só.</p>
        </div>
        <p className="text-sm text-white/60">Feito para o Davi.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm flex flex-col gap-5">
          <div className="lg:hidden"><Marca /></div>
          {children}
        </div>
      </div>
    </div>
  )
}

const traduzir = (m: string) => (m === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : /rate limit/i.test(m) ? 'Muitas tentativas. Espere um pouco e tente de novo.' : m)

export function LoginPage() {
  const [modo, setModo] = useState<'entrar' | 'esqueci' | 'enviado'>('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true); setErro('')
    const { error } = await supabase!.auth.signInWithPassword({ email, password: senha })
    if (error) setErro(traduzir(error.message))
    setEnviando(false)
  }

  async function pedirLink(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true); setErro('')
    // O link do e-mail volta para este mesmo endereço; o app abre a tela de nova senha.
    const { error } = await supabase!.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname })
    if (error) setErro(traduzir(error.message)); else setModo('enviado')
    setEnviando(false)
  }

  if (modo === 'enviado') return (
    <Moldura>
      <span className="grid h-12 w-12 place-items-center rounded-lg bg-brand-soft text-brand"><MailCheck size={24} /></span>
      <div><h2 className="titulo text-3xl">Confira seu e-mail</h2><p className="text-muted mt-1">Se <b>{email}</b> tiver conta, chega um link para criar uma senha nova. Veja também o spam.</p></div>
      <Button variante="secundario" icone={<ArrowLeft size={16} />} onClick={() => setModo('entrar')}>Voltar para entrar</Button>
    </Moldura>
  )

  return (
    <Moldura>
      <form onSubmit={modo === 'entrar' ? entrar : pedirLink} className="flex flex-col gap-5">
        <div>
          <h2 className="titulo text-3xl">{modo === 'entrar' ? 'Entrar' : 'Esqueci a senha'}</h2>
          <p className="text-muted mt-1">{modo === 'entrar' ? 'Use o e-mail e a senha da sua conta.' : 'Informe seu e-mail e enviamos um link para criar uma senha nova.'}</p>
        </div>
        <Campo rotulo="E-mail">{(id) => <Input id={id} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />}</Campo>
        {modo === 'entrar' && <Campo rotulo="Senha">{(id) => <Input id={id} type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} />}</Campo>}
        {erro && <p role="alert" className="text-sm font-semibold text-bad">{erro}</p>}
        <Button type="submit" disabled={enviando} icone={modo === 'entrar' ? <Lock size={16} /> : <KeyRound size={16} />}>
          {enviando ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Enviar link'}
        </Button>
        <button type="button" onClick={() => { setModo(modo === 'entrar' ? 'esqueci' : 'entrar'); setErro('') }} className="text-sm font-medium text-brand self-center">
          {modo === 'entrar' ? 'Esqueci minha senha' : 'Voltar para entrar'}
        </button>
      </form>
    </Moldura>
  )
}

/** Aberta pelo link do e-mail de recuperação: define a senha nova. */
export function NovaSenhaPage({ onPronto }: { onPronto: () => void }) {
  const [senha, setSenha] = useState('')
  const [repetir, setRepetir] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (senha.length < 8) return setErro('Use pelo menos 8 caracteres.')
    if (senha !== repetir) return setErro('As senhas não são iguais.')
    setEnviando(true); setErro('')
    const { error } = await supabase!.auth.updateUser({ password: senha })
    setEnviando(false)
    if (error) setErro(traduzir(error.message)); else onPronto()
  }
  return (
    <Moldura>
      <form onSubmit={salvar} className="flex flex-col gap-5">
        <div><h2 className="titulo text-3xl">Nova senha</h2><p className="text-muted mt-1">Crie uma senha que você não usa em outros sites.</p></div>
        <Campo rotulo="Nova senha" dica="Pelo menos 8 caracteres.">{(id) => <Input id={id} type="password" autoComplete="new-password" required value={senha} onChange={(e) => setSenha(e.target.value)} />}</Campo>
        <Campo rotulo="Repita a senha">{(id) => <Input id={id} type="password" autoComplete="new-password" required value={repetir} onChange={(e) => setRepetir(e.target.value)} />}</Campo>
        {erro && <p role="alert" className="text-sm font-semibold text-bad">{erro}</p>}
        <Button type="submit" disabled={enviando} icone={<KeyRound size={16} />}>{enviando ? 'Salvando…' : 'Salvar senha'}</Button>
      </form>
    </Moldura>
  )
}
