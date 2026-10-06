import { AnimeItem, Comment, Post, Topic } from '../types';

export const TOPICS: ('All' | Topic)[] = [
  'All', 'Episode Talk', 'Theories', 'Recommendations',
  'Art & Cosplay', 'News', 'Hot Takes', 'Help', 'General',
];

const h = (n: number) => Date.now() - n * 3600 * 1000;
const d = (n: number) => Date.now() - n * 24 * 3600 * 1000;

export const SEED_POSTS: Post[] = [
  {
    id: 'seed-1', author: 'SakuraSenpai', authorColor: '#F472B6', topic: 'Episode Talk',
    title: 'Frieren episode 28 absolutely broke me (spoilers)',
    body: 'The scene with the flowers and the promise... I have watched 400+ anime and nothing prepared me for how this show handles grief. Fern carrying on Frieren\'s lessons has me in tears every single week.',
    spoiler: true, animeTag: 'Frieren: Beyond Journey\'s End',
    createdAt: h(2), likes: 214,
  },
  {
    id: 'seed-2', author: 'WeebCommander', authorColor: '#8B5CF6', topic: 'Hot Takes',
    title: 'Dub is better than sub and I\'m tired of pretending otherwise',
    body: 'Modern dubs (Cyberpunk Edgerunners, Frieren, Solo Leveling) have genuinely elite voice acting. Sub purists are living in 2008. Fight me.',
    spoiler: false, createdAt: h(5), likes: 189,
    poll: {
      id: 'poll-seed-2', question: 'Sub or dub?',
      options: [
        { text: 'Sub forever, no contest', votes: 412 },
        { text: 'Dub has caught up honestly', votes: 388 },
        { text: 'Depends on the show', votes: 506 },
      ],
    },
  },
  {
    id: 'seed-3', author: 'ChibiNinja', authorColor: '#22D3EE', topic: 'Recommendations',
    title: 'Just finished Cowboy Bebop for the first time. What do I watch now that nothing will ever compare?',
    body: 'That ending left a hole in me. I need something with the same vibes — jazzy, melancholic, adult. I\'ve seen Champloo already. Help a brother out.',
    spoiler: false, animeTag: 'Cowboy Bebop', createdAt: h(8), likes: 156,
  },
  {
    id: 'seed-4', author: 'OtakuPrime', authorColor: '#FFC94D', topic: 'News',
    title: 'Demon Slayer: Infinity Castle just crossed $800M worldwide',
    body: 'First anime film to do it that fast. Ufotable is playing a different sport at this point. Who\'s seen it — did the Akaza fight live up to the manga?',
    spoiler: false, animeTag: 'Demon Slayer', createdAt: h(11), likes: 342,
  },
  {
    id: 'seed-5', author: 'RamenRider', authorColor: '#4ADE80', topic: 'Theories',
    title: 'One Piece final saga theory: the One Piece is a story, and Laughtale is a library',
    body: 'Roger laughed because the "treasure" was the true history of the world. The Straw Hats aren\'t finding gold — they\'re finding the truth the World Government erased. Every poneglyph is a chapter.',
    spoiler: true, animeTag: 'One Piece', createdAt: h(14), likes: 278,
  },
  {
    id: 'seed-6', author: 'PixelRonin', authorColor: '#FB7185', topic: 'Art & Cosplay',
    title: 'My Gojo cosplay is 90% done — blindfold vs glasses?',
    body: 'Finished the jacket and the wig styling last night. Can\'t decide between the blindfold (iconic) or the round glasses (more comfortable for a full con day). Photos drop Friday.',
    spoiler: false, animeTag: 'Jujutsu Kaisen', createdAt: h(19), likes: 98,
  },
  {
    id: 'seed-7', author: 'MangaMama', authorColor: '#A78BFA', topic: 'Help',
    title: 'Where does a total newbie even START with Gundam?',
    body: 'There are like 40 series and my friend just said "watch Gundam" with zero further instructions. I like character drama more than mecha battles. Where do I begin?',
    spoiler: false, createdAt: d(1), likes: 87,
  },
  {
    id: 'seed-8', author: 'TsundereTom', authorColor: '#F472B6', topic: 'General',
    title: 'What got YOU into anime? Be honest.',
    body: 'No judgment zone. Was it Toonami after school? A friend forcing Naruto on you? Netflix autoplay? A TikTok edit? I need the origin stories.',
    spoiler: false, createdAt: d(1) - h(4), likes: 265,
    poll: {
      id: 'poll-seed-8', question: 'How did you fall down the rabbit hole?',
      options: [
        { text: 'Toonami / TV as a kid', votes: 689 },
        { text: 'A friend showed me one show', votes: 534 },
        { text: 'Netflix / streaming autoplay', votes: 377 },
        { text: 'TikTok / YouTube edits', votes: 298 },
      ],
    },
  },
  {
    id: 'seed-9', author: 'IsekaiIke', authorColor: '#22D3EE', topic: 'Episode Talk',
    title: 'Solo Leveling S2 finale — that Jeju Island raid was PEAK animation',
    body: 'A-1 Pictures went absolutely feral on the Beru fight. The sound design when Jinwoo... you know. If you dropped this show after S1, the finale is your sign to come back.',
    spoiler: true, animeTag: 'Solo Leveling', createdAt: d(2), likes: 301,
  },
  {
    id: 'seed-10', author: 'WaifuWatcher', authorColor: '#FF4D6D', topic: 'Hot Takes',
    title: 'Filler episodes are good, actually',
    body: 'Some of my favorite anime memories are filler: the G-8 arc in One Piece, the beach episodes, the random festival episodes where everyone just vibes. Canon-only watchers are missing the soul of a long series.',
    spoiler: false, createdAt: d(2) - h(6), likes: 143,
  },
  {
    id: 'seed-11', author: 'ShonenSean', authorColor: '#FFC94D', topic: 'Recommendations',
    title: 'Underrated romance anime that will destroy you (in a good way)',
    body: 'Everyone says Your Name and A Silent Voice. I\'m talking: March Comes in Like a Lion, Natsume\'s Book of Friends, Anohana. Slow, quiet, devastating. Add yours below.',
    spoiler: false, createdAt: d(3), likes: 176,
  },
  {
    id: 'seed-12', author: 'MechaMia', authorColor: '#8B5CF6', topic: 'Theories',
    title: 'JJK theory: Gojo\'s "nah, I\'d win" was the most important line in the series',
    body: 'It wasn\'t arrogance — it was the thesis of his entire character. The strongest sorcerer had to believe it absolutely, and the moment he doubted, even for a second against Sukuna... well. You know. (Manga spoilers)',
    spoiler: true, animeTag: 'Jujutsu Kaisen', createdAt: d(3) - h(8), likes: 224,
  },
  {
    id: 'seed-13', author: 'SakuraSenpai', authorColor: '#F472B6', topic: 'News',
    title: 'Chainsaw Man movie announces global release date + new trailer',
    body: 'The Reze arc is finally getting the big screen treatment. MAPPA dropped a 2-minute trailer and the animation looks disgusting (complimentary). Day one, obviously.',
    spoiler: false, animeTag: 'Chainsaw Man', createdAt: d(4), likes: 198,
  },
  {
    id: 'seed-14', author: 'PixelRonin', authorColor: '#FB7185', topic: 'Art & Cosplay',
    title: 'Fanart Friday thread — drop your latest pieces! 🎨',
    body: 'Weekly thread! Post your drawings, edits, AMVs, cosplay pics — WIPs welcome. Be kind, credit artists, and remember: no AI-generated art in this thread per community vote.',
    spoiler: false, createdAt: d(4) - h(3), likes: 132,
  },
];

export const SEED_COMMENTS: Record<string, Comment[]> = {
  'seed-1': [
    { id: 'c1-1', postId: 'seed-1', author: 'WeebCommander', authorColor: '#8B5CF6', body: 'The way this show makes you grieve for characters you met 10 minutes ago is actually unfair.', createdAt: h(1), likes: 45 },
    { id: 'c1-2', postId: 'seed-1', author: 'MangaMama', authorColor: '#A78BFA', body: 'I put off watching Frieren for a year because "fantasy slice of life" sounded boring. Biggest mistake of my anime life.', createdAt: h(1) - 1800 * 1000, likes: 62 },
  ],
  'seed-2': [
    { id: 'c2-1', postId: 'seed-2', author: 'ChibiNinja', authorColor: '#22D3EE', body: 'Counterpoint: some dubs still sound like they recorded in a bathroom. But the good ones? Genuinely elite now.', createdAt: h(4), likes: 51 },
    { id: 'c2-2', postId: 'seed-2', author: 'OtakuPrime', authorColor: '#FFC94D', body: 'It depends on the show is the only correct answer and the poll proves it.', createdAt: h(3), likes: 88 },
  ],
  'seed-3': [
    { id: 'c3-1', postId: 'seed-3', author: 'RamenRider', authorColor: '#4ADE80', body: 'Samurai Champloo you already saw... try Trigun (98), then Cowboy Bebop: The Movie, then settle in for Monster. Thank me later.', createdAt: h(7), likes: 73 },
    { id: 'c3-2', postId: 'seed-3', author: 'MechaMia', authorColor: '#8B5CF6', body: 'Michiko & Hatchin. Same director energy, criminally underwatched.', createdAt: h(6), likes: 41 },
  ],
  'seed-8': [
    { id: 'c8-1', postId: 'seed-8', author: 'IsekaiIke', authorColor: '#22D3EE', body: 'My older brother made me watch DBZ on Toonami in 2002 and I never recovered. No regrets.', createdAt: d(1) - h(2), likes: 56 },
  ],
};

// ---------------------------------------------------------------------------
// Offline fallback catalog — used when the anime API can't be reached.
// ids are real MyAnimeList IDs so live detail fetches still work when online.
// ---------------------------------------------------------------------------
export const FALLBACK_ANIME: AnimeItem[] = [
  { id: 52991, title: 'Frieren: Beyond Journey\'s End', image: '', score: 8.88, synopsis: 'An elven mage outlives her hero party and journeys to understand humanity, grief, and the time she took for granted.', genres: ['Adventure', 'Drama', 'Fantasy'], episodes: 28, status: 'Finished Airing', year: 2023 },
  { id: 52299, title: 'Solo Leveling', image: '', score: 8.27, synopsis: 'The weakest hunter alive gains a mysterious system that lets him level up without limits — and the world isn\'t ready.', genres: ['Action', 'Adventure', 'Fantasy'], episodes: 25, status: 'Finished Airing', year: 2024 },
  { id: 5114, title: 'Fullmetal Alchemist: Brotherhood', image: '', score: 9.10, synopsis: 'Two brothers who broke alchemy\'s greatest taboo search for the Philosopher\'s Stone to restore what they lost.', genres: ['Action', 'Adventure', 'Drama'], episodes: 64, status: 'Finished Airing', year: 2009 },
  { id: 40748, title: 'Jujutsu Kaisen', image: '', score: 8.55, synopsis: 'A kind-hearted teen swallows a cursed finger and is thrust into a brutal war between sorcerers and curses.', genres: ['Action', 'Supernatural'], episodes: 47, status: 'Finished Airing', year: 2020 },
  { id: 38000, title: 'Demon Slayer: Kimetsu no Yaiba', image: '', score: 8.45, synopsis: 'Tanjiro joins the Demon Slayer Corps to cure his sister Nezuko and avenge his family.', genres: ['Action', 'Supernatural'], episodes: 55, status: 'Finished Airing', year: 2019 },
  { id: 16498, title: 'Attack on Titan', image: '', score: 8.55, synopsis: 'Humanity hides behind walls from man-eating Titans — until Eren Yeager vows to wipe every last one out.', genres: ['Action', 'Drama'], episodes: 89, status: 'Finished Airing', year: 2013 },
  { id: 21, title: 'One Piece', image: '', score: 8.72, synopsis: 'Monkey D. Luffy sails the Grand Line with his pirate crew to find the legendary One Piece treasure.', genres: ['Action', 'Adventure', 'Comedy'], episodes: 1100, status: 'Currently Airing', year: 1999 },
  { id: 20, title: 'Naruto', image: '', score: 8.01, synopsis: 'A loudmouthed ninja outcast dreams of becoming Hokage and earning his village\'s respect.', genres: ['Action', 'Adventure'], episodes: 220, status: 'Finished Airing', year: 2002 },
  { id: 1535, title: 'Death Note', image: '', score: 8.62, synopsis: 'A genius student finds a notebook that kills anyone whose name is written in it — and decides to play god.', genres: ['Supernatural', 'Suspense'], episodes: 37, status: 'Finished Airing', year: 2006 },
  { id: 1, title: 'Cowboy Bebop', image: '', score: 8.75, synopsis: 'Bounty hunters Spike and Jet drift through space chasing bounties and outrunning their pasts.', genres: ['Action', 'Sci-Fi'], episodes: 26, status: 'Finished Airing', year: 1998 },
  { id: 44510, title: 'Chainsaw Man', image: '', score: 8.31, synopsis: 'A broke devil hunter fuses with his chainsaw devil-dog and becomes the government\'s wildest weapon.', genres: ['Action', 'Gore'], episodes: 12, status: 'Finished Airing', year: 2022 },
  { id: 50265, title: 'Spy x Family', image: '', score: 8.45, synopsis: 'A spy, an assassin, and a telepath form a fake family — each hiding their secret from the others.', genres: ['Action', 'Comedy'], episodes: 37, status: 'Finished Airing', year: 2022 },
  { id: 52034, title: 'Oshi no Ko', image: '', score: 8.25, synopsis: 'Reincarnated as the children of a murdered idol, twins chase stardom and revenge through Japan\'s dark entertainment industry.', genres: ['Drama', 'Supernatural'], episodes: 24, status: 'Finished Airing', year: 2023 },
  { id: 37521, title: 'Vinland Saga', image: '', score: 8.75, synopsis: 'A Viking boy consumed by revenge slowly learns what it means to be a true warrior.', genres: ['Action', 'Adventure', 'Drama'], episodes: 48, status: 'Finished Airing', year: 2019 },
  { id: 11061, title: 'Hunter x Hunter (2011)', image: '', score: 9.04, synopsis: 'Gon leaves home to become a Hunter like his father — and finds a world of deadly exams, crime syndicates, and chimera ants.', genres: ['Action', 'Adventure'], episodes: 148, status: 'Finished Airing', year: 2011 },
  { id: 31964, title: 'My Hero Academia', image: '', score: 7.90, synopsis: 'In a world of superpowers, quirkless Izuku inherits the greatest power of all and enrolls in hero school.', genres: ['Action'], episodes: 138, status: 'Finished Airing', year: 2016 },
  { id: 32182, title: 'Mob Psycho 100', image: '', score: 8.48, synopsis: 'The world\'s most powerful esper just wants a normal life — but his emotions keep hitting 100%.', genres: ['Action', 'Comedy', 'Supernatural'], episodes: 37, status: 'Finished Airing', year: 2016 },
  { id: 31240, title: 'Re:Zero', image: '', score: 8.25, synopsis: 'Subaru is trapped in a fantasy world where death rewinds time — and every loop costs him a piece of himself.', genres: ['Drama', 'Fantasy', 'Suspense'], episodes: 66, status: 'Finished Airing', year: 2016 },
  { id: 30276, title: 'One Punch Man', image: '', score: 8.50, synopsis: 'Saitama can defeat anyone with one punch — and it has made him profoundly, hilariously bored.', genres: ['Action', 'Comedy'], episodes: 24, status: 'Finished Airing', year: 2015 },
  { id: 269, title: 'Bleach', image: '', score: 8.10, synopsis: 'Ichigo becomes a Soul Reaper and defends the living world from Hollows — then takes the fight to the afterlife.', genres: ['Action', 'Supernatural'], episodes: 366, status: 'Finished Airing', year: 2004 },
  { id: 813, title: 'Dragon Ball Z', image: '', score: 8.15, synopsis: 'Goku defends Earth from ever-stronger villains across sagas that defined shonen anime.', genres: ['Action', 'Adventure'], episodes: 291, status: 'Finished Airing', year: 1989 },
  { id: 30, title: 'Neon Genesis Evangelion', image: '', score: 8.35, synopsis: 'Traumatized teens pilot bio-mechs against apocalyptic Angels in anime\'s most famous deconstruction.', genres: ['Drama', 'Mecha', 'Sci-Fi'], episodes: 26, status: 'Finished Airing', year: 1995 },
  { id: 32281, title: 'Your Name', image: '', score: 8.84, synopsis: 'Two teens who have never met start swapping bodies across time — and race to find each other.', genres: ['Drama', 'Romance', 'Supernatural'], episodes: 1, status: 'Finished Airing', year: 2016 },
  { id: 28851, title: 'A Silent Voice', image: '', score: 8.94, synopsis: 'A former bully seeks redemption with the deaf girl he tormented in elementary school.', genres: ['Drama', 'Romance'], episodes: 1, status: 'Finished Airing', year: 2016 },
];

// ---------------------------------------------------------------------------
// v2: vibe tags for the fallback catalog (ids are MAL ids from FALLBACK_ANIME)
// ---------------------------------------------------------------------------
export const VIBES = ['Epic', 'Emotional', 'Dark', 'Funny', 'Cozy', 'Mind-bending', 'Romantic', 'Wholesome'] as const;
export type Vibe = (typeof VIBES)[number];

export const ANIME_VIBES: Record<number, Vibe[]> = {
  52991: ['Emotional', 'Cozy', 'Epic'],
  52299: ['Epic', 'Dark'],
  5114: ['Epic', 'Emotional', 'Dark'],
  40748: ['Epic', 'Dark'],
  38000: ['Epic', 'Emotional'],
  16498: ['Epic', 'Dark', 'Mind-bending'],
  21: ['Epic', 'Funny', 'Emotional'],
  20: ['Epic', 'Funny'],
  1535: ['Dark', 'Mind-bending'],
  1: ['Cozy', 'Epic'],
  44510: ['Dark', 'Funny', 'Epic'],
  50265: ['Funny', 'Wholesome', 'Cozy'],
  52034: ['Dark', 'Emotional'],
  37521: ['Epic', 'Emotional', 'Dark'],
  11061: ['Epic', 'Emotional'],
  31964: ['Epic', 'Wholesome'],
  32182: ['Funny', 'Emotional', 'Epic'],
  31240: ['Dark', 'Emotional', 'Mind-bending'],
  30276: ['Funny', 'Epic'],
  269: ['Epic'],
  813: ['Epic', 'Funny'],
  30: ['Dark', 'Mind-bending'],
  32281: ['Romantic', 'Emotional'],
  28851: ['Emotional', 'Romantic'],
};

// ---------------------------------------------------------------------------
// v2: reaction emojis + seed reaction counts so the feed feels alive
// ---------------------------------------------------------------------------
export const REACTION_EMOJIS = ['🔥', '❤️', '😭', '🤯', '💀', '✨'];

export const SEED_REACTIONS: Record<string, Record<string, number>> = {
  'seed-1': { '😭': 96, '❤️': 74, '✨': 21 },
  'seed-2': { '🔥': 88, '🤯': 34, '💀': 19 },
  'seed-3': { '❤️': 61, '✨': 28 },
  'seed-4': { '🤯': 102, '🔥': 77 },
  'seed-5': { '🤯': 91, '🔥': 45 },
  'seed-6': { '❤️': 42, '✨': 31 },
  'seed-7': { '❤️': 35, '✨': 12 },
  'seed-8': { '🔥': 70, '❤️': 58, '💀': 15 },
  'seed-9': { '🔥': 120, '🤯': 66 },
  'seed-10': { '💀': 54, '🔥': 40 },
  'seed-11': { '😭': 63, '❤️': 49 },
  'seed-12': { '💀': 88, '😭': 52 },
  'seed-13': { '🔥': 83, '🤯': 37 },
  'seed-14': { '✨': 55, '❤️': 44 },
};

// Taste-quiz picks (top 10 by score from the fallback catalog)
export const QUIZ_ANIME_IDS = [5114, 11061, 28851, 52991, 1, 37521, 21, 16498, 32182, 32281];
