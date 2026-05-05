// Level definitions for Cangaroo Web
export interface LevelTarget {
  x: number;
  y: number;
}

export type ObstacleType = 'tree' | 'rock' | 'water';

export interface LevelObstacle {
  x: number;
  y: number;
  type: ObstacleType;
}

export interface LevelDefinition {
  id: number;
  title: string;
  description: string;
  gridWidth: number;
  gridHeight: number;
  startX: number;
  startY: number;
  startDirection: 'up' | 'down' | 'left' | 'right';
  targets: LevelTarget[];
  obstacles: LevelObstacle[];
  hint: string;
}

export const levels: LevelDefinition[] = [
  {
    id: 1,
    title: 'Primii pași',
    description: 'Învață comanda pas; — fă 3 pași înainte și vopsește celula.',
    gridWidth: 10,
    gridHeight: 10,
    startX: 0,
    startY: 3,
    startDirection: 'right',
    targets: [{ x: 3, y: 3 }],
    obstacles: [],
    hint: 'Folosește: pas; pas; pas; vopseste;'
  },
  {
    id: 2,
    title: 'Viraj la dreapta',
    description: 'Combină pas; cu rotire_dreapta; pentru a ajunge la celula țintă.',
    gridWidth: 10,
    gridHeight: 10,
    startX: 0,
    startY: 0,
    startDirection: 'right',
    targets: [{ x: 3, y: 3 }],
    obstacles: [],
    hint: 'Mergi 3 pași, folosește rotire_dreapta, apoi încă 3 pași.'
  },
  {
    id: 3,
    title: 'Pătrat de culoare',
    description: 'Vopsește 4 celule formând un pătrat folosind viraje.',
    gridWidth: 10,
    gridHeight: 10,
    startX: 2,
    startY: 2,
    startDirection: 'right',
    targets: [
      { x: 2, y: 2 }, { x: 3, y: 2 },
      { x: 3, y: 3 }, { x: 2, y: 3 }
    ],
    obstacles: [],
    hint: 'vopseste; pas; rotire_dreapta; vopseste; pas; rotire_dreapta; ...'
  },
  {
    id: 4,
    title: 'Bucla magică',
    description: 'Folosește repetă (n) { ... } pentru a vopsi o linie.',
    gridWidth: 10,
    gridHeight: 10,
    startX: 0,
    startY: 3,
    startDirection: 'right',
    targets: [
      { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 },
      { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 }
    ],
    obstacles: [],
    hint: 'repetă (6) { vopseste; pas; }'
  },
  {
    id: 5,
    title: 'Evită obstacolele',
    description: 'Folosește dacă (liber) { ... } pentru a evita blocurile.',
    gridWidth: 10,
    gridHeight: 10,
    startX: 0,
    startY: 3,
    startDirection: 'right',
    targets: [
      { x: 1, y: 3 }, { x: 3, y: 3 }, { x: 5, y: 3 },
      { x: 7, y: 3 }
    ],
    obstacles: [
      { x: 2, y: 3, type: 'tree' }, { x: 4, y: 3, type: 'tree' }, { x: 6, y: 3, type: 'tree' }
    ],
    hint: 'repetă (8) { dacă (liber) { vopseste; } pas; }'
  },
  {
    id: 6,
    title: 'Spirală',
    description: 'Creează o spirală folosind bucle imbricate.',
    gridWidth: 10,
    gridHeight: 10,
    startX: 0,
    startY: 0,
    startDirection: 'right',
    targets: [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 },
      { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 3 }, { x: 4, y: 4 },
      { x: 3, y: 4 }, { x: 2, y: 4 }, { x: 1, y: 4 },
      { x: 1, y: 3 }, { x: 1, y: 2 },
      { x: 2, y: 2 }, { x: 3, y: 2 }
    ],
    obstacles: [],
    hint: 'Vopsește și fă pași în formă de spirală cu comanda rotire_dreapta.'
  },
  {
    id: 7,
    title: 'Săritura peste piatră',
    description: 'Pietrele (rândul 2) blochează drumul, dar pot fi sărite cu comanda sari;.',
    gridWidth: 10,
    gridHeight: 10,
    startX: 1,
    startY: 5,
    startDirection: 'right',
    targets: [{ x: 5, y: 5 }],
    obstacles: [
      { x: 3, y: 5, type: 'rock' }
    ],
    hint: 'Folosește pas; apoi sari; peste piatră, și iar pas;.'
  },
  {
    id: 8,
    title: 'Ocolește copacul',
    description: 'Copacii (rândul 1) nu pot fi săriți. Trebuie să îi ocolești.',
    gridWidth: 10,
    gridHeight: 10,
    startX: 2,
    startY: 2,
    startDirection: 'right',
    targets: [{ x: 6, y: 2 }],
    obstacles: [
      { x: 4, y: 2, type: 'tree' }
    ],
    hint: 'Mergi înainte, întoarce la dreapta/stânga pentru a ocoli copacul și revino pe drum.'
  },
  {
    id: 9,
    title: 'Lacul',
    description: 'Apa (rândul 4) poate fi sărită. Treci peste lac pentru a ajunge la țintă.',
    gridWidth: 10,
    gridHeight: 10,
    startX: 1,
    startY: 4,
    startDirection: 'right',
    targets: [{ x: 8, y: 4 }],
    obstacles: [
      { x: 3, y: 4, type: 'water' },
      { x: 6, y: 4, type: 'water' }
    ],
    hint: 'repetă (2) { pas; sari; pas; }'
  },
  {
    id: 10,
    title: 'Pădurea și pietrele',
    description: 'Combină ocolirea copacilor cu săritul peste pietre.',
    gridWidth: 10,
    gridHeight: 10,
    startX: 1,
    startY: 8,
    startDirection: 'right',
    targets: [{ x: 8, y: 2 }],
    obstacles: [
      { x: 4, y: 8, type: 'rock' },
      { x: 8, y: 6, type: 'tree' },
      { x: 5, y: 2, type: 'rock' }
    ],
    hint: 'Sari peste piatră, mergi înainte, ocolește copacul.'
  },
  {
    id: 11,
    title: 'Labirintul',
    description: 'Folosește condiția dacă (liber) pentru a găsi drumul printre obstacole.',
    gridWidth: 10,
    gridHeight: 10,
    startX: 0,
    startY: 0,
    startDirection: 'right',
    targets: [{ x: 9, y: 9 }],
    obstacles: [
      { x: 1, y: 0, type: 'tree' }, { x: 3, y: 1, type: 'tree' },
      { x: 0, y: 2, type: 'rock' }, { x: 2, y: 3, type: 'water' },
      { x: 5, y: 5, type: 'tree' }, { x: 7, y: 6, type: 'tree' },
      { x: 8, y: 8, type: 'tree' }, { x: 9, y: 8, type: 'rock' }
    ],
    hint: 'Gândește-te bine la drum! Nu poți sări peste copaci.'
  },
  {
    id: 12,
    title: 'Testul final',
    description: 'Adună toate țintele evitând copacii și sărind peste apă și pietre.',
    gridWidth: 10,
    gridHeight: 10,
    startX: 2,
    startY: 9,
    startDirection: 'up',
    targets: [{ x: 2, y: 2 }, { x: 7, y: 2 }, { x: 7, y: 7 }],
    obstacles: [
      { x: 2, y: 5, type: 'rock' },
      { x: 5, y: 2, type: 'water' },
      { x: 7, y: 5, type: 'tree' }
    ],
    hint: 'Sari, vopsește, ocolește! Succes!'
  },
  {
    id: 13,
    title: 'Labirintul Întunecat',
    description: 'Nivel super greu! Un labirint strâns cu copaci, unde trebuie să folosești eficient și întoarcerile și săriturile.',
    gridWidth: 10,
    gridHeight: 10,
    startX: 0,
    startY: 0,
    startDirection: 'right',
    targets: [{ x: 9, y: 9 }],
    obstacles: [
      { x: 1, y: 0, type: 'tree' }, { x: 1, y: 1, type: 'tree' }, { x: 1, y: 2, type: 'tree' },
      { x: 0, y: 4, type: 'tree' }, { x: 1, y: 4, type: 'tree' }, { x: 2, y: 4, type: 'tree' },
      { x: 3, y: 2, type: 'rock' }, { x: 3, y: 3, type: 'water' }, { x: 3, y: 6, type: 'tree' },
      { x: 5, y: 0, type: 'tree' }, { x: 5, y: 1, type: 'tree' }, { x: 5, y: 2, type: 'tree' },
      { x: 5, y: 4, type: 'tree' }, { x: 5, y: 5, type: 'water' }, { x: 5, y: 7, type: 'tree' },
      { x: 7, y: 2, type: 'tree' }, { x: 7, y: 3, type: 'tree' }, { x: 7, y: 8, type: 'rock' },
      { x: 8, y: 8, type: 'tree' }
    ],
    hint: 'Trasează-ți drumul mental mai întâi. Fii atent unde folosești pas și unde sari.'
  },
  {
    id: 14,
    title: 'Râul Periculos',
    description: 'Un râu îți taie calea, dar pe maluri cresc copaci deși. Găsește singurul loc prin care poți sări.',
    gridWidth: 10,
    gridHeight: 10,
    startX: 0,
    startY: 5,
    startDirection: 'right',
    targets: [{ x: 9, y: 1 }, { x: 9, y: 8 }],
    obstacles: [
      // Râul
      { x: 4, y: 0, type: 'water' }, { x: 4, y: 1, type: 'water' }, { x: 4, y: 2, type: 'water' },
      { x: 4, y: 3, type: 'water' }, { x: 4, y: 4, type: 'water' }, { x: 4, y: 5, type: 'water' },
      { x: 4, y: 6, type: 'water' }, { x: 4, y: 7, type: 'water' }, { x: 4, y: 8, type: 'water' },
      { x: 4, y: 9, type: 'water' },
      // Copacii de pe malul stâng
      { x: 3, y: 3, type: 'tree' }, { x: 3, y: 4, type: 'tree' }, { x: 3, y: 5, type: 'tree' },
      { x: 3, y: 6, type: 'tree' }, { x: 3, y: 7, type: 'tree' },
      // Copacii de pe malul drept
      { x: 5, y: 1, type: 'tree' }, { x: 5, y: 2, type: 'tree' }, { x: 5, y: 8, type: 'tree' },
      { x: 5, y: 9, type: 'tree' }
    ],
    hint: 'Du-te în sus sau în jos pentru a ocoli copacii înainte de a sări râul!'
  },
  {
    id: 15,
    title: 'Fortăreața',
    description: 'Cea mai grea provocare! Pătrunde în centrul fortăreței ocolind zidurile și sărind obstacolele.',
    gridWidth: 10,
    gridHeight: 10,
    startX: 0,
    startY: 9,
    startDirection: 'right',
    targets: [{ x: 5, y: 5 }],
    obstacles: [
      // Zidul exterior
      { x: 2, y: 2, type: 'tree' }, { x: 3, y: 2, type: 'tree' }, { x: 4, y: 2, type: 'tree' }, 
      { x: 5, y: 2, type: 'tree' }, { x: 6, y: 2, type: 'tree' }, { x: 7, y: 2, type: 'tree' },
      { x: 7, y: 3, type: 'tree' }, { x: 7, y: 4, type: 'tree' }, { x: 7, y: 5, type: 'rock' }, // opening
      { x: 7, y: 6, type: 'tree' }, { x: 7, y: 7, type: 'tree' },
      { x: 6, y: 7, type: 'tree' }, { x: 5, y: 7, type: 'tree' }, { x: 4, y: 7, type: 'tree' },
      { x: 3, y: 7, type: 'tree' }, { x: 2, y: 7, type: 'tree' },
      { x: 2, y: 6, type: 'tree' }, { x: 2, y: 5, type: 'tree' }, { x: 2, y: 4, type: 'tree' }, { x: 2, y: 3, type: 'tree' },
      // Zidul interior
      { x: 4, y: 4, type: 'tree' }, { x: 4, y: 5, type: 'tree' }, { x: 5, y: 4, type: 'water' }, // opening inside
      { x: 6, y: 4, type: 'tree' }, { x: 6, y: 5, type: 'tree' }, { x: 6, y: 6, type: 'tree' },
      { x: 5, y: 6, type: 'tree' }, { x: 4, y: 6, type: 'tree' }
    ],
    hint: 'Găsește spărturile din zid: prima e o piatră pe care poți sări, a doua e o baltă!'
  }
];
