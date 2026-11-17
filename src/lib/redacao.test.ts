import { describe, expect, it } from 'vitest'
import { analisar, notaTotal, palavrasChave, promptCorrecao } from './redacao'

export const REDACAO_BOA = `Segundo a Constituição Federal de 1988, a saúde é direito de todos e dever do Estado. Nesse sentido, a valorização do Sistema Único de Saúde como direito universal ainda enfrenta desafios no Brasil, seja pelo subfinanciamento, seja pela desinformação da população. Dessa forma, é fundamental discutir esses entraves.

Em primeiro lugar, o subfinanciamento compromete o atendimento. De acordo com dados do IBGE, milhões de brasileiros dependem exclusivamente do sistema público. Contudo, a falta de recursos gera filas e precariza o serviço, o que reduz a confiança da sociedade. Assim, a universalidade torna-se apenas formal.

Além disso, a desinformação contribui para a desvalorização do sistema. Conforme o sociólogo Zygmunt Bauman, as relações líquidas enfraquecem vínculos coletivos, uma vez que o individualismo afasta o cidadão do que é público. Por conseguinte, muitos ignoram que vacinas e transplantes são garantidos pelo sistema público.

Portanto, o Ministério da Saúde deve ampliar campanhas informativas sobre os serviços oferecidos, por meio de propagandas em redes sociais e na televisão, como vídeos com histórias reais de pacientes atendidos, isto é, relatos que aproximem a população do sistema, a fim de que a sociedade reconheça a importância da saúde pública universal. Além disso, o Congresso precisa garantir financiamento estável, para que a universalidade deixe de ser apenas formal e se torne realidade em todo o país, com atendimento de qualidade e ágil para todos os cidadãos brasileiros.`
const TEMA = 'A valorização do Sistema Único de Saúde (SUS) como direito universal'

describe('redação', () => {
  it('redação bem estruturada', () => {
    const a = analisar(REDACAO_BOA, TEMA)
    expect(a.paragrafos).toBe(4)
    expect(a.repertorios).toBeGreaterThanOrEqual(2)
    expect(a.conectivos.length).toBeGreaterThanOrEqual(8)
    expect(Object.values(a.elementos).every(Boolean)).toBe(true)
    expect(a.alertas.some((x) => x.includes('zero'))).toBe(false)
  })
  it('texto curto e oralidade', () => {
    const a = analisar('Eu acho que o SUS é bom. A gente usa muito.', TEMA)
    expect(a.alertas.some((x) => x.includes('zero'))).toBe(true)
    expect(a.oralidade).toEqual(expect.arrayContaining(['eu', 'a gente']))
  })
  it('tema ausente', () => {
    expect(analisar(REDACAO_BOA, 'Desafios para a preservação da Amazônia').alertas.some((x) => x.includes('tangenciar'))).toBe(true)
  })
  it('palavras-chave, total e prompt', () => {
    const p = palavrasChave('Desafios para a valorização da herança africana no Brasil')
    expect(p).toContain('herança')
    expect(p).not.toContain('desafios')
    expect(notaTotal({ c1: 200, c2: 160, c3: 160, c4: 200, c5: 200 })).toBe(920)
    expect(notaTotal({ c1: 200 })).toBeNull()
    const pr = promptCorrecao(TEMA, 'meu texto')
    expect(pr).toContain(TEMA); expect(pr).toContain('meu texto'); expect(pr).toContain('C5')
  })
})
