import type { historyEn } from './history.en'
import type { Widen } from './en'

/** Copy da página História (Português BR). Deve espelhar history.en.ts. */
export const historyPt: Widen<typeof historyEn> = {
  kicker: 'Aprender · História',
  title: 'A história do',
  titleAccent: 'Cubo Mágico',
  subtitle: 'Descubra como o cubo foi criado e como ele virou um fenômeno mundial do speedcubing.',
  explore: 'Explorar a linha do tempo',
  back: 'Voltar para Aprender',
  cubeLabel: 'Um Cubo Mágico 3D resolvido. Arraste para girar.',
  stats: [
    { value: '50+ anos', label: 'de história' },
    { value: 'Um fenômeno', label: 'mundial' },
    { value: 'Centenas de milhões', label: 'de cubos vendidos' },
  ],
  timelineKicker: 'Uma viagem no tempo',
  timelineTitle: 'A linha do tempo do cubo',
  timelineLabel: 'Linha do tempo do Cubo Mágico, de 1974 até hoje',
  events: [
    {
      id: '1974',
      year: '1974',
      title: 'Ernő Rubik inventa o cubo',
      text: 'O arquiteto e professor de design húngaro Ernő Rubik monta um quebra-cabeça 3D com blocos de madeira para mostrar aos alunos como as partes podem se mover de forma independente. Embaralhar foi fácil. Resolver levou cerca de um mês.',
      art: 'Desenho técnico de um cubo 3x3 com linhas de medida',
    },
    {
      id: '1977',
      year: '1977',
      title: 'O Cubo Mágico chega às lojas',
      text: 'Depois de uma patente húngara pedida em 1975, o quebra-cabeça começa a ser vendido em lojas de brinquedos de Budapeste como Bűvös kocka, o “Cubo Mágico”.',
      art: 'Um cubo numa prateleira de loja com etiqueta Bűvös kocka',
    },
    {
      id: '1980',
      year: '1980',
      title: 'Lançamento mundial',
      text: 'A Ideal Toy Company muda o nome para Rubik’s Cube e o lança em feiras de brinquedos em Londres, Paris, Nuremberg e Nova York. Ele logo vira um dos quebra-cabeças mais vendidos da história.',
      art: 'Um globo com as quatro cidades do lançamento em volta de um cubo',
    },
    {
      id: '1982',
      year: '1982',
      title: 'O primeiro Campeonato Mundial',
      text: 'Em 5 de junho de 1982, Budapeste recebe o primeiro Campeonato Mundial de Cubo Mágico. Minh Thai, dos Estados Unidos, vence com 22,95 segundos. Pouco depois, a febre passa por quase vinte anos.',
      art: 'Um placar retrô mostrando Budapeste 1982 e 22,95',
    },
    {
      id: '1997',
      year: '1997',
      title: 'Os métodos chegam à internet',
      text: 'Jessica Fridrich publica seu método no começo da web. Cruz, F2L, OLL e PLL, hoje conhecido como CFOP, vira o método que a maioria dos speedcubers aprende.',
      art: 'Uma janela de navegador com as quatro etapas do CFOP',
    },
    {
      id: '2004',
      year: '2003–2004',
      title: 'Começa a era da WCA',
      text: 'Um Campeonato Mundial volta a acontecer em Toronto em 2003, e em 2004 nasce a World Cube Association. Ela padroniza regras, modalidades e recordes, e transforma o speedcubing num esporte mundial com competições em todos os continentes.',
      art: 'Um salão de competição com fileiras de timers e um palco',
    },
    {
      id: 'today',
      year: '2010 – hoje',
      title: 'A ascensão do speedcubing moderno',
      text: 'Cubos magnéticos, vídeos e comunidades online derrubam os tempos rapidamente. O primeiro single oficial abaixo de 5 segundos veio em 2015, o primeiro abaixo de 4 em 2018, e em 2026 o recorde mundial caiu para menos de 3 segundos.',
      art: 'Um cubo de speedcubing ao lado do display de um timer de competição',
    },
  ],
  records: {
    kicker: 'Hoje',
    title: 'Recordes mundiais atuais do 3x3',
    single: 'Single',
    average: 'Média de 5',
    seconds: 'segundos',
    china: 'China',
    checked: 'Recordes oficiais da WCA, conferidos em {date}.',
    source: 'Ver todos os recordes da WCA',
  },
  cta: {
    kicker: 'A era competitiva',
    title: 'Competições e speedcubing moderno',
    text: 'Veja como o Cubo Mágico virou um esporte mundial, conheça as lendas e explore os recordes.',
    button: 'Explorar WCA e Lendas',
  },
}
