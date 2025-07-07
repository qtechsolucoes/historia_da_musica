// Este ficheiro agora é uma cópia completa dos dados do frontend,
// adaptado para ser compatível com o ambiente Node.js usando module.exports.

const musicHistoryData = [
  {
    id: 'medieval',
    name: 'Música Medieval',
    composers: [
        { name: 'Hildegarda de Bingen', lifespan: '1098–1179', majorWorks: ['Ordo Virtutum', 'Symphonia armoniae celestium revelationum'] },
        { name: 'Guillaume de Machaut', lifespan: 'c. 1300–1377', majorWorks: ['Messe de Nostre Dame'] },
        { name: 'Pérotin', lifespan: 'fl. c. 1200', majorWorks: ['Viderunt omnes', 'Sederunt principes'] },
        { name: 'Léonin', lifespan: 'fl. c. 1150–c. 1200', majorWorks: ['Magnus Liber Organi'] },
        { name: 'Philippe de Vitry', lifespan: '1291–1361', majorWorks: ['Motetes do Roman de Fauvel'] },
        { name: 'Francesco Landini', lifespan: 'c. 1325–1397', majorWorks: ['Non avrà ma’ pietà'] },
        { name: 'John Dunstaple', lifespan: 'c. 1390–1453', majorWorks: ['Quam pulchra es'] },
        { name: 'Guillaume Du Fay', lifespan: '1397–1474', majorWorks: ['Nuper rosarum flores', 'Se la face ay pale'] }
    ]
  },
  {
    id: 'renascentista',
    name: 'Música Renascentista',
    composers: [
        { name: 'Josquin des Prez', lifespan: 'c.1450–1521', majorWorks: ['Missa Pange Lingua', 'Ave Maria... virgo serena'] },
        { name: 'Palestrina', lifespan: '1525–1594', majorWorks: ['Missa Papae Marcelli'] },
        { name: 'Orlando di Lasso', lifespan: '1532–1594', majorWorks: ['Lagrime di San Pietro'] },
        { name: 'William Byrd', lifespan: 'c.1540–1623', majorWorks: ['Missa para Quatro Vozes'] },
        { name: 'Tomás Luis de Victoria', lifespan: '1548–1611', majorWorks: ['Officium Defunctorum (Requiem)'] },
        { name: 'Claudio Monteverdi', lifespan: '1567-1643', majorWorks: ["L'Orfeo", 'Vespro della Beata Vergine'] }
    ]
  },
  {
    id: 'barroco',
    name: 'Música Barroca',
    composers: [
      { name: 'J. S. Bach', lifespan: '1685-1750', majorWorks: ['Concertos de Brandemburgo', 'O Cravo Bem Temperado'] },
      { name: 'G. F. Handel', lifespan: '1685-1759', majorWorks: ['Messias', 'Música Aquática'] },
      { name: 'Antonio Vivaldi', lifespan: '1678-1741', majorWorks: ['As Quatro Estações'] },
      { name: 'Henry Purcell', lifespan: '1659-1695', majorWorks: ['Dido and Aeneas'] },
      { name: 'Arcangelo Corelli', lifespan: '1653-1713', majorWorks: ['12 Concerti Grossi, Op. 6'] },
      { name: 'Domenico Scarlatti', lifespan: '1685-1757', majorWorks: ['Essercizi per gravicembalo'] }
    ]
  },
  {
    id: 'classico',
    name: 'Música Clássica',
    composers: [
        { name: 'W. A. Mozart', lifespan: '1756-1791', majorWorks: ['Sinfonia "Júpiter"', 'Don Giovanni', 'A Flauta Mágica'] },
        { name: 'Joseph Haydn', lifespan: '1732-1809', majorWorks: ['Sinfonia "Surpresa"', 'A Criação'] },
        { name: 'L. van Beethoven', lifespan: '1770-1827', majorWorks: ['Sinfonia "Eroica"', 'Sinfonia n.º 5', 'Sonata "Patética"'] },
        { name: 'C. P. E. Bach', lifespan: '1714-1788', majorWorks: ['Sonatas Prussianas'] }
    ]
  },
  {
    id: 'romantico',
    name: 'Música Romântica',
    composers: [
        { name: 'Frédéric Chopin', lifespan: '1810-1849', majorWorks: ['Noturnos', 'Polonaises'] },
        { name: 'Richard Wagner', lifespan: '1813-1883', majorWorks: ['O Anel do Nibelungo', 'Tristão e Isolda'] },
        { name: 'Pyotr Ilyich Tchaikovsky', lifespan: '1840-1893', majorWorks: ['O Lago dos Cisnes', 'Sinfonia n.º 6 "Patética"'] },
        { name: 'Johannes Brahms', lifespan: '1833-1897', majorWorks: ['Sinfonias n.º 1 a 4', 'Um Réquiem Alemão'] },
        { name: 'Franz Liszt', lifespan: '1811-1886', majorWorks: ['Sonata para Piano em Si menor', 'Les Préludes'] },
        { name: 'Giuseppe Verdi', lifespan: '1813-1901', majorWorks: ['Rigoletto', 'La Traviata', 'Aida'] }
    ]
  },
  {
    id: 'moderno',
    name: 'Música Moderna e Contemporânea',
    composers: [
        { name: 'Claude Debussy', lifespan: '1862-1918', majorWorks: ["Prélude à l'après-midi d'un faune", 'La Mer'] },
        { name: 'Igor Stravinsky', lifespan: '1882-1971', majorWorks: ['A Sagração da Primavera', 'O Pássaro de Fogo'] },
        { name: 'Arnold Schoenberg', lifespan: '1874-1951', majorWorks: ['Pierrot Lunaire', 'Verklärte Nacht'] },
        { name: 'Béla Bartók', lifespan: '1881-1945', majorWorks: ['Concerto para Orquestra', 'Música para Cordas, Percussão e Celesta'] },
        { name: 'John Cage', lifespan: '1912-1992', majorWorks: ["4'33\"", 'Sonatas e Interlúdios para Piano Preparado'] },
        { name: 'Philip Glass', lifespan: 'n. 1937', majorWorks: ['Einstein on the Beach', 'Glassworks'] }
    ]
  }
];

module.exports = { musicHistoryData };