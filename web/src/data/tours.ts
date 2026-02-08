export interface TourStop {
  title: string
  composerName: string
  year: number
  description: string
  possibleKeys: string[]
}

export interface Tour {
  id: string
  name: string
  tagline: string
  icon: string
  stops: TourStop[]
}

export const TOURS: Tour[] = [
  {
    id: 'big-5',
    name: 'The Big 5',
    tagline: 'The five operas every newcomer should know',
    icon: '\u2B50',
    stops: [
      {
        title: 'La Traviata',
        composerName: 'Giuseppe Verdi',
        year: 1853,
        description: 'A courtesan falls in love with a nobleman. The most performed opera in the world -- heartbreaking, gorgeous, and the perfect starting point.',
        possibleKeys: ['Q1350'],
      },
      {
        title: 'La Boh\u00e8me',
        composerName: 'Giacomo Puccini',
        year: 1896,
        description: 'Starving artists in Paris fall in love and lose each other. If you cried at RENT, this is where it all came from.',
        possibleKeys: ['Q1347'],
      },
      {
        title: 'Carmen',
        composerName: 'Georges Bizet',
        year: 1875,
        description: 'A free-spirited woman, a jealous soldier, and the most famous opera melody ever written. Raw, dangerous, unforgettable.',
        possibleKeys: ['Q1351'],
      },
      {
        title: 'The Magic Flute',
        composerName: 'Wolfgang Amadeus Mozart',
        year: 1791,
        description: 'A fairy tale with talking birds, an evil queen, and some of the most beautiful music ever composed. Mozart at his most magical.',
        possibleKeys: ['Q5765'],
      },
      {
        title: 'Tosca',
        composerName: 'Giacomo Puccini',
        year: 1900,
        description: 'A singer, a painter, and a sadistic police chief in a thriller set during the Napoleonic wars. Edge-of-your-seat opera.',
        possibleKeys: ['Q1348'],
      },
    ],
  },
  {
    id: 'mozart',
    name: 'Mozart for Beginners',
    tagline: 'The genius who made opera fun',
    icon: '\uD83C\uDFB9',
    stops: [
      {
        title: 'The Marriage of Figaro',
        composerName: 'Wolfgang Amadeus Mozart',
        year: 1786,
        description: 'A servant outwits his master in the funniest opera ever written. Mozart turned a banned play into a masterpiece.',
        possibleKeys: ['Q5765'],
      },
      {
        title: 'Don Giovanni',
        composerName: 'Wolfgang Amadeus Mozart',
        year: 1787,
        description: 'The original bad boy gets his comeuppance. Part comedy, part horror, entirely brilliant.',
        possibleKeys: ['Q5794'],
      },
      {
        title: 'Cos\u00ec fan tutte',
        composerName: 'Wolfgang Amadeus Mozart',
        year: 1790,
        description: "Two men bet their girlfriends won't be faithful. Spoiler: it gets complicated. Mozart's most psychologically sharp opera.",
        possibleKeys: ['Q5799'],
      },
      {
        title: 'The Magic Flute',
        composerName: 'Wolfgang Amadeus Mozart',
        year: 1791,
        description: "Mozart's final opera -- a fantastical journey through trials of love and wisdom, with the Queen of the Night's legendary high notes.",
        possibleKeys: ['Q5765'],
      },
    ],
  },
  {
    id: 'italian',
    name: 'Italian Romance',
    tagline: 'Bel canto to verismo -- the Italian opera tradition',
    icon: '\uD83C\uDDEE\uD83C\uDDF9',
    stops: [
      {
        title: 'The Barber of Seville',
        composerName: 'Gioachino Rossini',
        year: 1816,
        description: 'The original rom-com. Figaro helps a young count win the girl, with some of the fastest and funniest singing in opera.',
        possibleKeys: ['Q7515'],
      },
      {
        title: 'Lucia di Lammermoor',
        composerName: 'Gaetano Donizetti',
        year: 1835,
        description: 'A woman forced into marriage loses her mind. The famous "Mad Scene" is one of the most demanding vocal showcases ever written.',
        possibleKeys: ['Q1249'],
      },
      {
        title: 'Rigoletto',
        composerName: 'Giuseppe Verdi',
        year: 1851,
        description: "A hunchbacked jester's curse comes back to destroy him. Contains \"La donna \u00e8 mobile\" -- you definitely know this tune.",
        possibleKeys: ['Q1349'],
      },
      {
        title: 'Aida',
        composerName: 'Giuseppe Verdi',
        year: 1871,
        description: 'Love and duty collide in ancient Egypt. Grand opera at its grandest -- written for the opening of the Suez Canal.',
        possibleKeys: ['Q1345'],
      },
      {
        title: 'Madama Butterfly',
        composerName: 'Giacomo Puccini',
        year: 1904,
        description: 'A Japanese woman waits for an American naval officer who may never return. Devastating and beautiful in equal measure.',
        possibleKeys: ['Q1346'],
      },
    ],
  },
  {
    id: 'wagner',
    name: "Wagner's World",
    tagline: 'Epic music dramas that changed everything',
    icon: '\uD83C\uDFD4\uFE0F',
    stops: [
      {
        title: 'The Flying Dutchman',
        composerName: 'Richard Wagner',
        year: 1843,
        description: "A ghost ship captain cursed to sail forever seeks redemption through love. Wagner's first great opera.",
        possibleKeys: ['Q1353'],
      },
      {
        title: 'Tannh\u00e4user',
        composerName: 'Richard Wagner',
        year: 1845,
        description: 'A knight torn between sacred and profane love. The overture alone is worth the price of admission.',
        possibleKeys: ['Q1354'],
      },
      {
        title: 'Tristan und Isolde',
        composerName: 'Richard Wagner',
        year: 1865,
        description: 'The love story that broke music theory. The "Tristan chord" opened the door to modern harmony.',
        possibleKeys: ['Q1355'],
      },
      {
        title: 'Die Walk\u00fcre',
        composerName: 'Richard Wagner',
        year: 1870,
        description: 'Part 2 of the Ring Cycle. The "Ride of the Valkyries" -- yes, that helicopter scene in Apocalypse Now -- comes from here.',
        possibleKeys: ['Q1356'],
      },
    ],
  },
  {
    id: 'modern',
    name: 'Opera Today',
    tagline: 'Living composers pushing opera forward',
    icon: '\uD83D\uDD2E',
    stops: [
      {
        title: 'Nixon in China',
        composerName: 'John Adams',
        year: 1987,
        description: "Nixon's 1972 trip to China, set to minimalist music. Proof that opera can be about anything.",
        possibleKeys: [],
      },
      {
        title: "L'amour de loin",
        composerName: 'Kaija Saariaho',
        year: 2000,
        description: "A medieval troubadour falls in love with a woman he's never met. Shimmering, otherworldly music.",
        possibleKeys: [],
      },
      {
        title: 'Doctor Atomic',
        composerName: 'John Adams',
        year: 2005,
        description: 'The creation of the atomic bomb at Los Alamos. Oppenheimer sings poetry as the world changes forever.',
        possibleKeys: [],
      },
      {
        title: 'Fire Shut Up in My Bones',
        composerName: 'Terence Blanchard',
        year: 2019,
        description: 'The first opera by a Black composer at the Met. A memoir of growing up in the American South.',
        possibleKeys: [],
      },
    ],
  },
]
