// Este arquivo é uma cópia simplificada dos dados para uso exclusivo do backend.
// Ele usa module.exports para ser compatível com o ambiente Node.js.

const musicHistoryData = [
  {
    id: 'medieval',
    name: 'Música Medieval',
    composers: [
        { name: 'Hildegarda de Bingen', majorWorks: ['Ordo Virtutum'] },
        { name: 'Guillaume de Machaut', majorWorks: ['Messe de Nostre Dame'] },
        { name: 'Pérotin', majorWorks: ['Viderunt omnes'] }
    ]
  },
  {
    id: 'renascentista',
    name: 'Música Renascentista',
    composers: [
        { name: 'Josquin des Prez', majorWorks: ['Missa Pange Lingua'] },
        { name: 'Palestrina', majorWorks: ['Missa Papae Marcelli'] },
        { name: 'Orlando di Lasso', majorWorks: ['Lagrime di San Pietro'] }
    ]
  },
  {
    id: 'barroco',
    name: 'Música Barroca',
    composers: [
      { name: 'J. S. Bach', majorWorks: ['Concertos de Brandemburgo'] },
      { name: 'G. F. Handel', majorWorks: ['Messias'] },
      { name: 'Antonio Vivaldi', majorWorks: ['As Quatro Estações'] }
    ]
  },
  {
    id: 'classico',
    name: 'Música Clássica',
    composers: [
        { name: 'W. A. Mozart', majorWorks: ['Sinfonia "Júpiter"'] },
        { name: 'Joseph Haydn', majorWorks: ['Sinfonia "Surpresa"'] },
        { name: 'L. van Beethoven', majorWorks: ['Sinfonia "Eroica"'] }
    ]
  },
  {
    id: 'romantico',
    name: 'Música Romântica',
    composers: [
        { name: 'Frédéric Chopin', majorWorks: ['Noturnos'] },
        { name: 'Richard Wagner', majorWorks: ['O Anel do Nibelungo'] },
        { name: 'Pyotr Ilyich Tchaikovsky', majorWorks: ['O Lago dos Cisnes'] }
    ]
  },
  {
    id: 'moderno',
    name: 'Música Moderna e Contemporânea',
    composers: [
        { name: 'Claude Debussy', majorWorks: ['Prélude à l\'après-midi d\'un faune'] },
        { name: 'Igor Stravinsky', majorWorks: ['A Sagração da Primavera'] },
        { name: 'Arnold Schoenberg', majorWorks: ['Pierrot Lunaire'] }
    ]
  }
];

module.exports = { musicHistoryData };