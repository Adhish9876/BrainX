import sharp from 'sharp';

async function makePerfectBubble() {
  const svg = `<svg width="740" height="740" viewBox="0 0 740 740" xmlns="http://www.w3.org/2000/svg">
    <!-- Cloud main body: center at (365, 275), rx=250, ry=185 -->
    <ellipse cx="365" cy="275" rx="250" ry="185" fill="white"/>
    <!-- Upper trailing circle: center around (255, 560), r=44 -->
    <circle cx="255" cy="560" r="44" fill="white"/>
    <!-- Bottom trailing circle: center around (175, 645), r=32 -->
    <circle cx="175" cy="645" r="32" fill="white"/>
  </svg>`;

  await sharp('public/assets/bubble.png')
    .composite([{ input: Buffer.from(svg), blend: 'dest-over' }])
    .toFile('public/assets/bubble-white.png');

  console.log('Successfully generated accurate bubble-white.png');
}

makePerfectBubble();
