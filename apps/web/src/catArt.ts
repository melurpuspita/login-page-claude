// Maskot orisinal "Kucing Kosmik": kucing oranye berhelm astronot dengan jetpack.
export const CAT_W = 130;
export const CAT_H = 84;

const FLAME = `
  <path d="M30 26 Q14 31 4 33 Q14 35 30 40 Z" fill="#ff7a3d">
    <animate attributeName="d" dur="0.3s" repeatCount="indefinite"
      values="M30 26 Q14 31 4 33 Q14 35 30 40 Z;M30 27 Q18 31 11 33 Q18 35 30 39 Z;M30 26 Q14 31 4 33 Q14 35 30 40 Z"/>
  </path>
  <path d="M30 29 Q21 32 15 33 Q21 34 30 37 Z" fill="#ffe066"/>`;

export function catSvg(withFlame: boolean): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CAT_W} ${CAT_H}" width="${CAT_W}" height="${CAT_H}">
  ${withFlame ? FLAME : ""}
  <path d="M34 58 Q18 62 14 52 Q11 44 19 44" fill="none" stroke="#e8902f" stroke-width="7" stroke-linecap="round"/>
  <rect x="30" y="22" width="16" height="22" rx="4" fill="#8f9bb3"/>
  <rect x="33" y="25" width="10" height="5" rx="2" fill="#5ee7ff"/>
  <rect x="40" y="56" width="8" height="13" rx="4" fill="#e8902f"/>
  <rect x="52" y="57" width="8" height="13" rx="4" fill="#e8902f"/>
  <rect x="64" y="57" width="8" height="13" rx="4" fill="#e8902f"/>
  <rect x="75" y="56" width="8" height="13" rx="4" fill="#e8902f"/>
  <ellipse cx="60" cy="50" rx="28" ry="16" fill="#f6a54a"/>
  <ellipse cx="62" cy="57" rx="16" ry="6" fill="#ffe2bf"/>
  <path d="M50 36 q3 7 0 13 M60 35 q3 7 0 13 M70 36 q3 7 0 12" stroke="#d97f26" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M80 24 L83 8 L93 20 Z" fill="#f6a54a"/>
  <path d="M98 19 L108 8 L109 25 Z" fill="#f6a54a"/>
  <path d="M83 21 L84.5 12 L90 19 Z" fill="#ffb3c7"/>
  <path d="M100 19 L106 12 L106.5 22 Z" fill="#ffb3c7"/>
  <circle cx="95" cy="34" r="17" fill="#f6a54a"/>
  <path d="M91 19 v6 M95 18 v7 M99 19 v6" stroke="#d97f26" stroke-width="2.5" stroke-linecap="round"/>
  <ellipse cx="96" cy="41" rx="8" ry="5.5" fill="#ffe2bf"/>
  <ellipse cx="89" cy="33" rx="2.8" ry="3.8" fill="#1d1533"/>
  <ellipse cx="102" cy="33" rx="2.8" ry="3.8" fill="#1d1533"/>
  <circle cx="90" cy="31.6" r="1.1" fill="#fff"/>
  <circle cx="103" cy="31.6" r="1.1" fill="#fff"/>
  <path d="M94 38.5 h4 l-2 2.4 z" fill="#ff7f9f"/>
  <path d="M96 41 q-2 2.5 -4 1 M96 41 q2 2.5 4 1" stroke="#7a4a2a" stroke-width="1.2" fill="none" stroke-linecap="round"/>
  <circle cx="85" cy="40" r="2.6" fill="#ff8fab" opacity=".55"/>
  <circle cx="107" cy="40" r="2.6" fill="#ff8fab" opacity=".55"/>
  <path d="M84 42 l-8 -1 M84 44 l-8 2 M108 42 l8 -1 M108 44 l8 2" stroke="#fff" stroke-width="1" opacity=".8"/>
  <rect x="80" y="53" width="30" height="5" rx="2.5" fill="#8f9bb3"/>
  <circle cx="95" cy="32" r="25" fill="#bfe6ff" fill-opacity=".14" stroke="#d9f1ff" stroke-width="2.5" stroke-opacity=".85"/>
  <path d="M78 22 A20 20 0 0 1 92 11" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>
</svg>`;
}

export function catDataUrl(withFlame: boolean): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(catSvg(withFlame))}`;
}
