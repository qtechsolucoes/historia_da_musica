import { Users } from 'lucide-react';

export const classicoData = {
 id: 'classico',
    name: 'Música Clássica',
    years: 'c. 1730 - 1820',
    icon: Users,
     referenceSong: 'assets/audio/periodo_classico/Mozart - Eine Kleine Nachtmusik [DOVER QUARTET].MP3',
      referenceSongTitle: 'Mozart - Eine Kleine Nachtmusik',
    overviewImages: ['https://placehold.co/600x400/4a3a2a/a38b71?text=Salão+Aristocrático', 'https://placehold.co/600x400/4a3a2a/a38b71?text=Pintura+Neoclássica'],
    historicalContext: "O período Clássico coincide com o Iluminismo, a 'Era da Razão'. Filósofos como Voltaire e Rousseau defendiam a razão, a liberdade individual e o conhecimento universal. Houve um declínio do poder da igreja e uma ascensão da burguesia, que passou a frequentar concertos públicos e a consumir música. O patrocínio musical, embora ainda dependente da aristocracia (como na corte dos Esterházy, que empregou Haydn), começou a se deslocar para o público em geral. O ideal estético valorizava a clareza, a simplicidade, o equilíbrio e a 'nobre simplicidade', em contraste com a ornamentação barroca.",
    description: 'A música clássica busca a clareza, o equilíbrio e a elegância formal. A melodia torna-se o elemento principal, com frases claras e simétricas, apoiada por um acompanhamento harmônico mais simples. A Forma Sonata torna-se a estrutura mais importante, usada em sinfonias, sonatas e quartetos de cordas. A orquestra se padroniza, com uma seção de cordas bem definida como sua base.',
    composers: [
      { name: 'C. P. E. Bach', lifespan: '1714-1788', image: 'https://placehold.co/200x200/5a3a22/FFFFFF?text=C.P.E.+Bach', bio: 'Filho de J. S. Bach, foi uma figura de transição chave. Seu estilo "empfindsamer Stil" (estilo sensível) explorava contrastes súbitos de humor e uma expressividade surpreendente, antecipando o Romantismo.', majorWorks: ['Sonatas Prussianas', 'Sinfonias de Hamburgo'] },
      { name: 'Joseph Haydn', lifespan: '1732-1809', image: 'https://placehold.co/200x200/5a3a22/FFFFFF?text=Haydn', bio: 'Conhecido como o "Pai da Sinfonia" e do "Quarteto de Cordas". Passou a maior parte da carreira a serviço da família Esterházy, onde desenvolveu e consolidou essas formas. Sua música é conhecida pelo humor, surpresa e maestria formal.', majorWorks: ['Sinfonia "Surpresa"', 'Sinfonia "Despedida"', 'Quartetos "Sol"', 'A Criação (oratório)'] },
      { name: 'W. A. Mozart', lifespan: '1756-1791', image: 'https://placehold.co/200x200/5a3a22/FFFFFF?text=Mozart', bio: 'Um prodígio que compôs em todos os gêneros de sua época com uma perfeição inigualável. Sua música combina a clareza e o equilíbrio clássicos com uma profunda complexidade emocional e sofisticação contrapontística. Mestre da ópera, do concerto para piano e da sinfonia.', majorWorks: ['Sinfonia n.º 40', 'Sinfonia "Júpiter"', 'Don Giovanni', 'A Flauta Mágica', 'Réquiem'] },
      { name: 'L. van Beethoven (Início)', lifespan: '1770-1827', image: 'https://placehold.co/200x200/5a3a22/FFFFFF?text=Beethoven', bio: 'Suas primeiras obras estão firmemente enraizadas no estilo clássico de Haydn e Mozart, mas já demonstram uma força rítmica, contrastes dinâmicos e uma urgência emocional que prenunciam sua futura revolução romântica.', majorWorks: ['Sonata "Patética"', 'Sinfonias n.º 1 e 2', 'Primeiros quartetos de cordas'] },
    ],
    instruments: [
        { name: 'Pianoforte', image: 'https://placehold.co/200x200/5a3a22/FFFFFF?text=Pianoforte', description: 'O ancestral do piano moderno. Sua capacidade de variar a dinâmica (tocar piano e forte) o tornou o instrumento de teclado preferido, superando o cravo. Foi o veículo ideal para a nova sensibilidade expressiva.' },
        { name: 'Clarinete', image: 'https://placehold.co/200x200/5a3a22/FFFFFF?text=Clarinete', description: 'Instrumento de sopro de palheta simples que se tornou um membro padrão da orquestra clássica. Mozart, em particular, explorou seu timbre aveludado e sua agilidade em concertos e música de câmara.' },
    ],
    genresAndForms: [
        { name: 'Sinfonia', description: 'A forma orquestral mais prestigiosa. Tipicamente em quatro movimentos: um Allegro em forma sonata, um movimento lento (Adagio/Andante), um Minueto e Trio, e um Finale rápido (Rondo ou Sonata).' },
        { name: 'Forma Sonata', description: 'A estrutura fundamental do período. Consiste em três seções principais: Exposição (apresenta dois temas contrastantes), Desenvolvimento (explora e fragmenta os temas) e Recapitulação (reapresenta os temas na tônica).' },
        { name: 'Quarteto de Cordas', description: 'Composição para dois violinos, viola e violoncelo. Considerado o gênero de câmara mais sofisticado, um "diálogo a quatro vozes inteligentes". Haydn e Mozart foram seus primeiros grandes mestres.' },
        { name: 'Ópera Buffa', description: 'Ópera cômica, com personagens e enredos do cotidiano, em contraste com a ópera séria mitológica. As óperas de Mozart, como "As Bodas de Fígaro", elevaram o gênero a um alto nível de complexidade musical e psicológica.' },
    ],
    stylesAndTechniques: [
        { name: 'Melodia Acompanhada', description: 'A textura dominante. Uma melodia clara, cantabile e periódica na voz superior, apoiada por um acompanhamento subordinado. O foco está na elegância e na clareza da linha melódica.' },
        { name: 'Baixo de Alberti', description: 'Um padrão de acompanhamento muito comum, especialmente em música para teclado, onde os acordes da mão esquerda são arpejados em um padrão rítmico simples (ex: tônica-quinta-terça-quinta). Cria uma textura leve e fluida.' },
        { name: 'Periodicidade', description: 'As melodias são construídas a partir de frases curtas e bem definidas (geralmente de 2 ou 4 compassos), que se combinam para formar períodos maiores. Isso cria uma sensação de equilíbrio, ordem e clareza.' },
    ],
    ensembles: [
        { name: 'Orquestra Clássica', image: 'https://placehold.co/200x200/5a3a22/FFFFFF?text=Orquestra+Clássica', description: 'A orquestra se padroniza em torno de um núcleo de cordas, com pares de sopros (flautas, oboés, clarinetes, fagotes), trompas e trompetes, além dos tímpanos. O baixo contínuo do cravo desaparece gradualmente.' },
    ],
    works: [
        { title: 'Sinfonia n.º 94, "Surpresa"', composer: 'Joseph Haydn', year: '1791', analysis: 'Famosa pelo súbito acorde fortíssimo no segundo movimento, esta sinfonia é um exemplo perfeito do humor e da maestria formal de Haydn. A obra demonstra a clareza estrutural e o desenvolvimento temático característicos do estilo clássico.', youtubeId: 'tF5kr251BRs' },
        { title: 'Sinfonia n.º 41, "Júpiter"', composer: 'W. A. Mozart', year: '1788', analysis: 'A última sinfonia de Mozart é uma obra grandiosa que culmina em um finale espetacular, onde cinco temas diferentes são combinados em um contraponto magistral. É a síntese perfeita da forma sonata clássica com a complexidade contrapontística barroca.', youtubeId: 'zK5295yKGpo' },
        { title: 'Sonata para Piano n.º 8, "Patética"', composer: 'L. van Beethoven', year: '1798', analysis: 'Esta sonata abre com uma introdução lenta e dramática (Grave) que retorna ao longo do movimento, uma inovação para a época. A obra demonstra a intensidade emocional e os contrastes dinâmicos que se tornariam a marca registrada de Beethoven.', youtubeId: 'SrcOcKYRYYA' },
    ]
};