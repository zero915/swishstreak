const ADJECTIVES = [
  'Swift', 'Mighty', 'Clever', 'Silent', 'Fierce', 'Lucky', 'Golden', 'Brave',
  'Sneaky', 'Crimson', 'Frosty', 'Blazing', 'Jolly', 'Wild', 'Turbo', 'Cosmic',
  'Rusty', 'Shadow', 'Royal', 'Electric',
];

const NOUNS = [
  'Tiger', 'Hawk', 'Wolf', 'Panther', 'Falcon', 'Cobra', 'Eagle', 'Shark',
  'Phoenix', 'Dragon', 'Otter', 'Raven', 'Lynx', 'Bison', 'Comet', 'Rocket',
  'Ninja', 'Wizard', 'Knight', 'Pirate',
];

/** Random "Noun + Adjective + Number" handle, e.g. "TigerSwift482". Used for
 * default player display names and bot opponent names so the two are
 * indistinguishable. */
export function generateRandomUsername(): string {
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const number = Math.floor(Math.random() * 900) + 100;
  return `${noun}${adjective}${number}`;
}
