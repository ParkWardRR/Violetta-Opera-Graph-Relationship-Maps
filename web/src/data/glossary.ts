export interface GlossaryTerm {
  term: string
  definition: string
  example?: string
}

export const GLOSSARY: GlossaryTerm[] = [
  { term: 'Aria', definition: 'A solo song for one voice -- the opera equivalent of a hit single. This is the part where the singer gets to show off.', example: 'Nessun dorma from Turandot' },
  { term: 'Bel canto', definition: 'Italian for "beautiful singing." A style that prizes pure, smooth vocal technique above all. Think Olympic-level vocal gymnastics.', example: 'Donizetti, Bellini, and Rossini operas' },
  { term: 'Libretto', definition: 'The text/script of an opera. The librettist writes the words; the composer writes the music.', example: 'Da Ponte wrote librettos for Mozart' },
  { term: 'Overture', definition: 'The orchestral introduction played before the curtain rises. Like a movie trailer in music form.', example: 'The Barber of Seville overture' },
  { term: 'Recitative', definition: 'Sung dialogue that moves the plot forward. Less melodic than an aria -- more like musical talking.', example: 'Common in Mozart and Baroque opera' },
  { term: 'Soprano', definition: 'The highest female voice type. Usually plays the heroine, the love interest, or the queen.', example: 'Violetta in La Traviata, Mimi in La Boh\u00e8me' },
  { term: 'Tenor', definition: 'The highest common male voice. Usually the hero, the lover, or the doomed romantic lead.', example: 'Rodolfo in La Boh\u00e8me, Don Jos\u00e9 in Carmen' },
  { term: 'Baritone', definition: 'A male voice between tenor and bass. Often plays the villain, the father figure, or the anti-hero.', example: 'Rigoletto, Figaro in The Barber of Seville' },
  { term: 'Mezzo-soprano', definition: 'A female voice lower than soprano. Often plays the rival, the mother, or the "trouser role" (a woman playing a man).', example: 'Carmen, Rosina in The Barber of Seville' },
  { term: 'Leitmotif', definition: "A musical theme tied to a character, place, or idea. Wagner's signature technique -- like a movie soundtrack cue.", example: 'The Ring Cycle uses over 100 leitmotifs' },
  { term: 'Verismo', definition: 'Italian for "realism." Gritty, emotionally raw operas about everyday people (not gods and kings).', example: "Puccini's La Boh\u00e8me, Mascagni's Cavalleria Rusticana" },
  { term: 'Coloratura', definition: 'Extremely fast, agile vocal passages -- the vocal fireworks of opera. Requires incredible technique.', example: 'Queen of the Night aria in The Magic Flute' },
  { term: 'Duet', definition: 'A piece for two singers. Often the most emotionally charged moments -- declarations of love, confrontations, farewells.', example: 'The love duet in La Boh\u00e8me' },
  { term: 'Chorus', definition: 'The ensemble of singers who play crowds, soldiers, villagers, etc. The opera equivalent of extras, but they SING.', example: 'The Triumphal March in Aida' },
  { term: 'Intermission', definition: 'The break between acts. This is when you get a drink, discuss what just happened, and prepare for your heart to be broken.', example: 'Most operas have 1-2 intermissions' },
  { term: 'Surtitles', definition: "Translated text projected above the stage (like subtitles). Most opera houses provide these -- you won't need to know Italian.", example: 'Available at virtually every major opera house' },
  { term: 'Prima donna', definition: 'The leading female singer. In everyday language it means "diva," but in opera it\'s a mark of supreme artistry.', example: 'Maria Callas was the ultimate prima donna' },
  { term: 'Encore', definition: 'When the audience demands a repeat of an aria or scene. Rare in modern opera, but it still happens for showstoppers.', example: 'High C in "Ah! mes amis" from Daughter of the Regiment' },
]
