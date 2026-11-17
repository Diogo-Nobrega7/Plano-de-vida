import { useEffect, useState } from 'react'
import { lerRota } from './routes'

export function useRota() {
  const [rota, setRota] = useState(() => lerRota(location.hash))
  useEffect(() => {
    const f = () => { setRota(lerRota(location.hash)); window.scrollTo({ top: 0 }) }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return rota
}
