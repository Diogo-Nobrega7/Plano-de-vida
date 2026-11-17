import { useState } from 'react'
import { Lock } from 'lucide-react'
import { supabase } from '@/data/supabase'
import { Button, Campo, Input } from '@/components/ui'
import { Marca } from '@/components/layout/Marca'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true); setErro('')
    const { error } = await supabase!.auth.signInWithPassword({ email, password: senha })
    if (error) setErro(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message)
    setEnviando(false)
  }

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
        <form onSubmit={entrar} className="w-full max-w-sm flex flex-col gap-5">
          <div className="lg:hidden"><Marca /></div>
          <div>
            <h2 className="titulo text-3xl">Entrar</h2>
            <p className="text-muted mt-1">Use o e-mail e a senha da sua conta.</p>
          </div>
          <Campo rotulo="E-mail">{(id) => <Input id={id} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />}</Campo>
          <Campo rotulo="Senha">{(id) => <Input id={id} type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} />}</Campo>
          {erro && <p role="alert" className="text-sm font-semibold text-bad">{erro}</p>}
          <Button type="submit" disabled={enviando} icone={<Lock size={16} />}>{enviando ? 'Entrando…' : 'Entrar'}</Button>
        </form>
      </div>
    </div>
  )
}
