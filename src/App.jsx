import { useState, useRef, useEffect, useCallback } from "react";

// ─── 스킬 이미지 URL (PDF 문서의 이미지를 AI 생성 이미지로 대체) ────
// 실제 배포 시 public/skills/ 폴더에 이미지를 넣고 경로를 교체하세요.
// 현재는 스킬 컨셉에 맞는 Unsplash/공개 이미지를 임시로 사용합니다.
const SKILL_IMAGES = {
  aries:       "https://images.unsplash.com/photo-1636955816868-fcb881e57954?w=600&q=80", // 황금빛 불꽃
  taurus:      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80", // 방어 쉴드
  gemini:      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&q=80", // 쌍둥이 은하
  cancer:      "https://images.unsplash.com/photo-1579566346927-c68383817156?w=600&q=80", // 얼음 결정
  leo:         "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&q=80", // 사자
  virgo:       "https://images.unsplash.com/photo-1490750967868-88df5691cc29?w=600&q=80", // 꽃/씨앗
  libra:       "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=600&q=80", // 우주/균형
  scorpio:     "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=600&q=80", // 보라 에너지
  sagittarius: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80", // 황금 화살/빛
  capricorn:   "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80", // 포털/우주
  aquarius:    "https://images.unsplash.com/photo-1614854262318-831574f15f1f?w=600&q=80", // 물/우주
  pisces:      "https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=600&q=80", // 물고기/바다
};

// ─── 스킬 발동 시 화면 효과 설정 ────────────────────────────────────
const SKILL_FX = {
  power_shot:   { shake: true,  flash: "#FF6B6B", particles: "fire",  screenTint: "rgba(255,107,107,0.15)" },
  shield:       { shake: false, flash: "#4ECDC4", particles: "ice",   screenTint: "rgba(78,205,196,0.18)"  },
  clone:        { shake: false, flash: "#FFE66D", particles: "spark", screenTint: "rgba(255,230,109,0.15)" },
  freeze:       { shake: true,  flash: "#A8E6CF", particles: "ice",   screenTint: "rgba(168,230,207,0.2)"  },
  revive:       { shake: false, flash: "#FFB347", particles: "fire",  screenTint: "rgba(255,179,71,0.18)"  },
  respawn:      { shake: false, flash: "#DDA0DD", particles: "spark", screenTint: "rgba(221,160,221,0.18)" },
  reset:        { shake: true,  flash: "#87CEEB", particles: "spark", screenTint: "rgba(135,206,235,0.25)" },
  double_power: { shake: true,  flash: "#FF4757", particles: "fire",  screenTint: "rgba(255,71,87,0.2)"    },
  piercing:     { shake: true,  flash: "#FFA07A", particles: "fire",  screenTint: "rgba(255,160,122,0.18)" },
  teleport:     { shake: true,  flash: "#98D8C8", particles: "spark", screenTint: "rgba(152,216,200,0.2)"  },
  heal:         { shake: false, flash: "#7EC8E3", particles: "ice",   screenTint: "rgba(126,200,227,0.18)" },
  relocate:     { shake: false, flash: "#B8A9C9", particles: "spark", screenTint: "rgba(184,169,201,0.18)" },
};

// ─── 황도 12궁 데이터 ───────────────────────────────────────────────
const ZODIAC = [
  {
    id: "aries", month: "3월", name: "양자리", emoji: "♈",
    color: "#FF6B6B", glowColor: "rgba(255,107,107,0.5)",
    myth: "신들의 왕 제우스가 황금 양을 하늘로 보내 프릭소스 남매를 구했어요. 그 양의 황금빛 털이 황금 양털이 되었고, 영웅 이아손이 찾아 떠난 모험의 시작이에요!",
    skillName: "황금 돌진", skillDesc: "선택한 아군 별 하나를 2배 속도로 강하게 발사해요!",
    skillFlavorText: "황금빛으로 빛나는 양이 강력한 에너지를 내뿜으며 정면을 향해 무서운 속도로 돌진합니다!",
    skillIcon: "🐏", skillType: "power_shot",
    starPositions: [[50,50],[70,35],[85,50],[65,65],[45,65]]
  },
  {
    id: "taurus", month: "4월", name: "황소자리", emoji: "♉",
    color: "#4ECDC4", glowColor: "rgba(78,205,196,0.5)",
    myth: "제우스가 황소로 변신해 아름다운 에우로파 공주를 크레타 섬으로 데려갔어요. 그 황소의 모습이 하늘의 별자리가 되었답니다!",
    skillName: "철벽 방어", skillDesc: "이번 턴에 어떤 공격에도 내 별이 밀려나지 않아요!",
    skillFlavorText: "우직한 거대 황소가 땅에 단단히 발을 붙이고 전신을 감싸는 푸른 무적 쉴드를 생성합니다!",
    skillIcon: "🛡️", skillType: "shield",
    starPositions: [[50,50],[35,40],[65,40],[30,60],[70,60]]
  },
  {
    id: "gemini", month: "5월", name: "쌍둥이자리", emoji: "♊",
    color: "#FFE66D", glowColor: "rgba(255,230,109,0.5)",
    myth: "카스토르와 폴룩스, 사이좋은 쌍둥이 형제예요. 폴룩스는 불사신인데 형을 너무 사랑해서 제우스에게 부탁해 둘 다 별이 되었어요!",
    skillName: "쌍둥이 분신", skillDesc: "아군 별 하나가 두 곳에 동시에 나타나 상대를 혼란에 빠뜨려요!",
    skillFlavorText: "두 명의 빛나는 쌍둥이 형체가 서로의 움직임을 거울처럼 반사하며 나타납니다!",
    skillIcon: "👥", skillType: "clone",
    starPositions: [[35,40],[65,40],[35,60],[65,60],[50,50]]
  },
  {
    id: "cancer", month: "6월", name: "게자리", emoji: "♋",
    color: "#A8E6CF", glowColor: "rgba(168,230,207,0.5)",
    myth: "헤라 여신이 헤라클레스의 발을 물라고 보낸 게예요. 헤라클레스에게 밟혀 죽었지만, 헤라가 고마워서 하늘의 별자리로 만들어 주었어요!",
    skillName: "집게 포착", skillDesc: "상대방 별 하나를 잠깐 얼려서 다음 턴에 움직이지 못하게 해요!",
    skillFlavorText: "거대한 파란 게 집게발이 우주 공간에서 튀어나와 상대 별을 단단히 움켜쥐며 순식간에 얼려버립니다!",
    skillIcon: "🦀", skillType: "freeze",
    starPositions: [[50,45],[35,55],[65,55],[40,70],[60,70]]
  },
  {
    id: "leo", month: "7월", name: "사자자리", emoji: "♌",
    color: "#FFB347", glowColor: "rgba(255,179,71,0.5)",
    myth: "헤라클레스가 12가지 과업 중 첫 번째로 네메아의 사자를 물리쳤어요. 어떤 무기로도 상처 입지 않는 사자를 맨손으로 쓰러뜨렸답니다!",
    skillName: "불사의 포효", skillDesc: "한 턴 동안 내 별이 밀려나도 바로 돌아와요! (1회 부활)",
    skillFlavorText: "붉은 갈기를 휘날리는 위엄 있는 사자가 우주를 향해 포효합니다. 황금빛 음파 에너지가 죽음을 초월하는 불사의 힘을 품고 있어요!",
    skillIcon: "🦁", skillType: "revive",
    starPositions: [[50,40],[30,50],[70,50],[35,65],[65,65]]
  },
  {
    id: "virgo", month: "8월", name: "처녀자리", emoji: "♍",
    color: "#DDA0DD", glowColor: "rgba(221,160,221,0.5)",
    myth: "곡식의 여신 데메테르의 딸 페르세포네예요. 봄이 오면 땅 위로 올라오고, 겨울엔 지하세계로 돌아가는 계절의 비밀을 간직한 별자리예요!",
    skillName: "풍요의 씨앗", skillDesc: "밀려난 내 별 하나를 원하는 자리에 다시 소환해요!",
    skillFlavorText: "천상의 처녀가 부드러운 빛을 뿜어내는 씨앗을 우주 공간에 뿌립니다. 씨앗이 닿은 곳마다 죽은 별들이 다시 빛나는 생명의 존재로 부활해요!",
    skillIcon: "🌾", skillType: "respawn",
    starPositions: [[50,35],[40,50],[60,50],[45,65],[55,65]]
  },
  {
    id: "libra", month: "9월", name: "천칭자리", emoji: "♎",
    color: "#87CEEB", glowColor: "rgba(135,206,235,0.5)",
    myth: "정의의 여신 아스트라이아가 가진 황금 저울이에요. 선한 마음과 나쁜 마음을 달아보는 저울로, 공정함의 상징이에요!",
    skillName: "평형의 저울", skillDesc: "모든 별의 위치를 처음 자리로 초기화해요!",
    skillFlavorText: "거대한 황금 저울이 우주의 중심에서 완벽한 평형을 이룹니다. 빛과 어둠의 에너지가 융합되어 전체 초기화의 마법 파동이 뻗어나가요!",
    skillIcon: "⚖️", skillType: "reset",
    starPositions: [[50,45],[30,55],[70,55],[40,65],[60,65]]
  },
  {
    id: "scorpio", month: "10월", name: "전갈자리", emoji: "♏",
    color: "#FF4757", glowColor: "rgba(255,71,87,0.5)",
    myth: "사냥꾼 오리온이 '모든 동물을 다 잡겠다!'고 뽐내자, 가이아 여신이 전갈을 보내 혼내줬어요. 전갈이 이겨서 하늘의 별자리가 되었답니다!",
    skillName: "독침 공격", skillDesc: "다음 발사 공격이 2배의 힘으로 강력하게 날아가요!",
    skillFlavorText: "어둠 속에서 전갈의 꼬리가 번뜩이며 날카로운 독침을 내뿝니다. 치명적인 자줏빛 독기가 2배의 파괴적 힘으로 폭발해요!",
    skillIcon: "🦂", skillType: "double_power",
    starPositions: [[50,40],[35,50],[65,50],[40,65],[60,70]]
  },
  {
    id: "sagittarius", month: "11월", name: "사수자리", emoji: "♐",
    color: "#FFA07A", glowColor: "rgba(255,160,122,0.5)",
    myth: "켄타우로스 케이론이에요. 반은 사람, 반은 말인 현명한 스승으로 헤라클레스와 아킬레스를 가르쳤어요. 활을 잘 쏘는 것으로 유명해요!",
    skillName: "황금 화살", skillDesc: "별 하나를 직선으로 쭉 날려 지나가는 모든 별을 밀어내요!",
    skillFlavorText: "반인반마 사수가 허공을 향해 시위를 당깁니다. 화살은 순수한 황금빛 에너지로 이루어져 모든 장애물을 뚫고 끝없이 뻗어 나가요!",
    skillIcon: "🏹", skillType: "piercing",
    starPositions: [[50,45],[30,45],[70,45],[40,65],[60,65]]
  },
  {
    id: "capricorn", month: "12월", name: "염소자리", emoji: "♑",
    color: "#98D8C8", glowColor: "rgba(152,216,200,0.5)",
    myth: "판 신이 괴물 티폰을 피해 물고기로 변하려다 반만 변해버렸어요! 물고기 꼬리에 염소 머리를 가진 재미있는 모습이 되었답니다!",
    skillName: "변신 탈출", skillDesc: "상대방 별 하나를 아무도 모르는 랜덤한 위치로 순간이동시켜요!",
    skillFlavorText: "바다-염소가 소용돌이치는 푸른 포털 속으로 사라지며 순간이동을 시도합니다. 기존 위치에는 잔상만이 남고 새로운 좌표로 기습적으로 이동해요!",
    skillIcon: "🐐", skillType: "teleport",
    starPositions: [[50,45],[35,40],[65,40],[40,65],[60,65]]
  },
  {
    id: "aquarius", month: "1월", name: "물병자리", emoji: "♒",
    color: "#7EC8E3", glowColor: "rgba(126,200,227,0.5)",
    myth: "신들에게 물을 날라주던 아름다운 소년 가니메데스예요. 제우스가 독수리로 변해 올림포스로 데려와 신들의 술 따르는 시종이 되었어요!",
    skillName: "생명의 물", skillDesc: "내 별을 하나 랜덤하게 되살려 가장 안전한 곳에 놓아요!",
    skillFlavorText: "천상의 물병에서 푸르고 투명한 생명의 물이 쏟아져 나옵니다. 소멸했던 별들의 잔해를 감싸 안으며 따뜻한 빛의 보호막 속에서 다시 소환해요!",
    skillIcon: "🏺", skillType: "heal",
    starPositions: [[50,45],[35,50],[65,50],[40,65],[60,65]]
  },
  {
    id: "pisces", month: "2월", name: "물고기자리", emoji: "♓",
    color: "#B8A9C9", glowColor: "rgba(184,169,201,0.5)",
    myth: "사랑의 여신 아프로디테와 아들 에로스가 괴물을 피해 물고기로 변해 도망쳤어요. 서로 잃어버리지 않으려고 꼬리를 묶고 헤엄쳤답니다!",
    skillName: "아프로디테의 도망", skillDesc: "내 별 하나를 원하는 위치로 순간이동시켜요!",
    skillFlavorText: "두 마리의 아름다운 물고기가 우주 공간을 헤엄치며 은하수의 소용돌이를 만들어냅니다. 물고기들의 빛의 궤적으로 새로운 전략적 위치로 도달해요!",
    skillIcon: "🐟", skillType: "relocate",
    starPositions: [[40,45],[60,45],[35,60],[65,60],[50,72]]
  }
];

const BOARD_SIZE = 500;
const STAR_RADIUS = 18;
const FRICTION = 0.92;
const SKILL_COOLDOWN = 3;

// ─── 유틸 ────────────────────────────────────────────────────────────
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function initStars(zodiac, player) {
  const isP1 = player === 1;
  return zodiac.starPositions.map((pos, i) => ({
    id: `p${player}_s${i}`,
    player,
    x: isP1 ? pos[0] * BOARD_SIZE / 100 : BOARD_SIZE - pos[0] * BOARD_SIZE / 100,
    y: isP1 ? pos[1] * BOARD_SIZE / 100 : BOARD_SIZE - pos[1] * BOARD_SIZE / 100,
    vx: 0, vy: 0,
    alive: true,
    frozen: false,
    shielded: false,
    revive: false,
    glowing: false,
    starIndex: i,
  }));
}

// ─── 별 그리기 컴포넌트 ───────────────────────────────────────────────
function StarShape({ x, y, r, color, glow, glowing, frozen, shielded, pulse }) {
  const pts = Array.from({ length: 5 }, (_, i) => {
    const a = (i * 72 - 90) * Math.PI / 180;
    const ai = a + 36 * Math.PI / 180;
    const or = r, ir = r * 0.45;
    return `${x + or * Math.cos(a)},${y + or * Math.sin(a)} ${x + ir * Math.cos(ai)},${y + ir * Math.sin(ai)}`;
  }).join(" ");

  return (
    <g>
      {glowing && (
        <circle cx={x} cy={y} r={r + 8} fill={glow} opacity={0.6}>
          <animate attributeName="r" values={`${r+6};${r+12};${r+6}`} dur="1s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1s" repeatCount="indefinite"/>
        </circle>
      )}
      {shielded && (
        <circle cx={x} cy={y} r={r + 6} fill="none" stroke="#87CEEB" strokeWidth="2" opacity={0.8}>
          <animate attributeName="r" values={`${r+4};${r+8};${r+4}`} dur="0.8s" repeatCount="indefinite"/>
        </circle>
      )}
      {frozen && (
        <circle cx={x} cy={y} r={r + 4} fill="rgba(100,200,255,0.3)" stroke="rgba(100,200,255,0.8)" strokeWidth="1.5"/>
      )}
      <polygon points={pts}
        fill={color}
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1"
        filter={glowing ? `drop-shadow(0 0 6px ${color})` : `drop-shadow(0 0 3px ${color})`}
        opacity={frozen ? 0.6 : 1}
      >
        {pulse && <animate attributeName="opacity" values="1;0.4;1" dur="0.5s" repeatCount="3"/>}
      </polygon>
      <circle cx={x} cy={y} r={3} fill="white" opacity={0.9}/>
    </g>
  );
}

// ─── 메인 앱 ─────────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase] = useState("select"); // select | game | result
  const [p1Zodiac, setP1Zodiac] = useState(null);
  const [p2Zodiac, setP2Zodiac] = useState(null);
  const [selectStep, setSelectStep] = useState(1);
  const [stars, setStars] = useState([]);
  const [turn, setTurn] = useState(1);
  const [dragging, setDragging] = useState(null); // {id, ox, oy, startX, startY}
  const [dragPos, setDragPos] = useState(null);
  const [constellationLines, setConstellationLines] = useState({ 1: [], 2: [] });
  const [skillCooldown, setSkillCooldown] = useState({ 1: 0, 2: 0 });
  const [skillActive, setSkillActive] = useState(null);
  const [winner, setWinner] = useState(null);
  const [log, setLog] = useState("");
  const [particles, setParticles] = useState([]);
  const [shieldActive, setShieldActive] = useState({ 1: false, 2: false });
  const [doublePower, setDoublePower] = useState({ 1: false, 2: false });
  const [reviveActive, setReviveActive] = useState({ 1: false, 2: false });
  const [skillCinematic, setSkillCinematic] = useState(null); // {zodiac, flavorText}
  const [screenShake, setScreenShake] = useState(false);
  const [screenTint, setScreenTint] = useState(null);
  const svgRef = useRef(null);
  const animRef = useRef(null);
  const starsRef = useRef(stars);
  starsRef.current = stars;
  const audioCtxRef = useRef(null);

  // ── Web Audio 사운드 시스템 ─────────────────────────────────────────
  function getAudioCtx() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    // iOS/iPad: suspended 상태면 resume
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }

  function playSound(type) {
    try {
      const ctx = getAudioCtx();
      const now = ctx.currentTime;

      if (type === "launch") {
        // 발사음: 짧은 whoosh
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now); osc.stop(now + 0.18);

      } else if (type === "hit") {
        // 충돌음: 타악기 느낌의 임팩트
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.5);
        }
        const src = ctx.createBufferSource();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        src.buffer = buf;
        filter.type = "bandpass";
        filter.frequency.value = 800;
        filter.Q.value = 0.8;
        src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        src.start(now);

        // 임팩트 보조음 (낮은 퍽)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2); gain2.connect(ctx.destination);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(200, now);
        osc2.frequency.exponentialRampToValueAtTime(40, now + 0.1);
        gain2.gain.setValueAtTime(0.4, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc2.start(now); osc2.stop(now + 0.1);

      } else if (type === "destroy") {
        // 별 소멸음: 폭발 + 반짝임
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.5) * 0.8;
        }
        const src = ctx.createBufferSource();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        src.buffer = buf;
        filter.type = "lowpass"; filter.frequency.value = 600;
        src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        src.start(now);

        // 별 소멸 반짝 음
        [0, 0.05, 0.1].forEach((delay, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.connect(g); g.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.value = 800 + i * 300;
          g.gain.setValueAtTime(0.15, now + delay);
          g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);
          osc.start(now + delay); osc.stop(now + delay + 0.15);
        });

      } else if (type === "skill") {
        // 스킬 발동음: 웅장한 차징 + 방전
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "square";
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.3);
        gain.gain.setValueAtTime(0.0, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now); osc.stop(now + 0.4);

        // 방전 노이즈
        const buf2 = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
        const d2 = buf2.getChannelData(0);
        for (let i = 0; i < d2.length; i++) d2[i] = (Math.random() * 2 - 1) * 0.3;
        const src2 = ctx.createBufferSource();
        const g2 = ctx.createGain();
        const f2 = ctx.createBiquadFilter();
        src2.buffer = buf2; f2.type = "highpass"; f2.frequency.value = 2000;
        src2.connect(f2); f2.connect(g2); g2.connect(ctx.destination);
        g2.gain.setValueAtTime(0.4, now + 0.25);
        g2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        src2.start(now + 0.25);

      } else if (type === "freeze") {
        // 얼음: 크리스탈 음색
        [0, 0.08, 0.16, 0.22].forEach((delay, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.connect(g); g.connect(ctx.destination);
          osc.type = "triangle";
          osc.frequency.value = 1200 - i * 100;
          g.gain.setValueAtTime(0.2, now + delay);
          g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.3);
          osc.start(now + delay); osc.stop(now + delay + 0.3);
        });

      } else if (type === "victory") {
        // 승리 팡파레
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.connect(g); g.connect(ctx.destination);
          osc.type = "triangle";
          osc.frequency.value = freq;
          g.gain.setValueAtTime(0.25, now + i * 0.12);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.35);
          osc.start(now + i * 0.12); osc.stop(now + i * 0.12 + 0.35);
        });
      }
    } catch(e) { /* 사운드 실패해도 게임은 계속 */ }
  }

  // ── window 레벨 이벤트 (iPad 드래그 버그 완전 차단) ─────────────────
  useEffect(() => {
    const preventDefault = (e) => { if (dragging && e.cancelable) e.preventDefault(); };
    window.addEventListener("touchmove", preventDefault, { passive: false });
    window.addEventListener("touchend", onMouseUp, { passive: true });
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("touchmove", preventDefault);
      window.removeEventListener("touchend", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, onMouseMove, onMouseUp]);

  // 배경 별 (장식용)
  const bgStars = useRef(
    Array.from({ length: 120 }, (_, i) => ({
      x: Math.random() * 100, y: Math.random() * 100,
      r: Math.random() * 1.5 + 0.3,
      delay: Math.random() * 3,
      dur: 2 + Math.random() * 2,
    }))
  ).current;

  // ── 물리 시뮬레이션 ────────────────────────────────────────────────
  const tick = useCallback(() => {
    setStars(prev => {
      let next = prev.map(s => ({ ...s }));
      let moving = false;

      // 속도 적용
      for (let s of next) {
        if (!s.alive) continue;
        s.x += s.vx; s.y += s.vy;
        s.vx *= FRICTION; s.vy *= FRICTION;
        if (Math.abs(s.vx) < 0.05) s.vx = 0;
        if (Math.abs(s.vy) < 0.05) s.vy = 0;
        if (Math.abs(s.vx) > 0.05 || Math.abs(s.vy) > 0.05) moving = true;
      }

      // 충돌 처리
      for (let i = 0; i < next.length; i++) {
        for (let j = i + 1; j < next.length; j++) {
          const a = next[i], b = next[j];
          if (!a.alive || !b.alive) continue;
          const d = dist(a, b);
          if (d < STAR_RADIUS * 2 && d > 0) {
            const nx = (b.x - a.x) / d, ny = (b.y - a.y) / d;
            const overlap = STAR_RADIUS * 2 - d;
            a.x -= nx * overlap / 2; a.y -= ny * overlap / 2;
            b.x += nx * overlap / 2; b.y += ny * overlap / 2;
            const relVx = a.vx - b.vx, relVy = a.vy - b.vy;
            const dot = relVx * nx + relVy * ny;
            if (dot > 0) {
              a.vx -= dot * nx; a.vy -= dot * ny;
              b.vx += dot * nx; b.vy += dot * ny;
              moving = true;
              // 충돌음 (속도가 클수록)
              if (Math.abs(dot) > 3) playSound("hit");
            }
          }
        }
      }

      // 경계 체크 – 밖으로 나가면 제거
      for (let s of next) {
        if (!s.alive) continue;
        if (s.x < -STAR_RADIUS || s.x > BOARD_SIZE + STAR_RADIUS ||
            s.y < -STAR_RADIUS || s.y > BOARD_SIZE + STAR_RADIUS) {
          if (s.revive) {
            s.x = BOARD_SIZE / 2 + (Math.random() - 0.5) * 100;
            s.y = BOARD_SIZE / 2 + (Math.random() - 0.5) * 100;
            s.vx = 0; s.vy = 0; s.revive = false;
          } else {
            s.alive = false;
            playSound("destroy");
          }
          addParticles(s.x, s.y, s.player === 1 ? p1Zodiac?.color : p2Zodiac?.color);
        }
      }

      // 승리 판정
      const p1Alive = next.filter(s => s.player === 1 && s.alive).length;
      const p2Alive = next.filter(s => s.player === 2 && s.alive).length;
      if (p1Alive === 0) { setWinner(2); setPhase("result"); playSound("victory"); }
      if (p2Alive === 0) { setWinner(1); setPhase("result"); playSound("victory"); }

      return next;
    });
  }, [p1Zodiac, p2Zodiac]);

  useEffect(() => {
    if (phase !== "game") return;
    const id = setInterval(tick, 16);
    return () => clearInterval(id);
  }, [phase, tick]);

  // ── 파티클 ─────────────────────────────────────────────────────────
  function addParticles(x, y, color) {
    const ps = Array.from({ length: 10 }, (_, i) => ({
      id: Date.now() + i,
      x, y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      color: color || "#fff",
      life: 1,
    }));
    setParticles(prev => [...prev, ...ps]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !ps.find(pp => pp.id === p.id)));
    }, 800);
  }

  // ── 드래그 & 발사 ──────────────────────────────────────────────────
  function getSVGPos(e) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = BOARD_SIZE / rect.width;
    const scaleY = BOARD_SIZE / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }

  function onStarDown(e, star) {
    e.preventDefault();
    if (star.player !== turn) return;
    if (star.frozen) { setLog("❄️ 얼어있어서 움직일 수 없어요!"); return; }
    const pos = getSVGPos(e.touches ? e.touches[0] : e);
    setDragging({ id: star.id, startX: star.x, startY: star.y });
    setDragPos(pos);
  }

  const onMouseMove = useCallback((e) => {
    if (!dragging) return;
    if (e.cancelable) e.preventDefault();
    const pos = e.touches ? getSVGPos(e.touches[0]) : getSVGPos(e);
    setDragPos(pos);
  }, [dragging]);

  const onMouseUp = useCallback((e) => {
    if (!dragging) return;
    const rawE = e.changedTouches ? e.changedTouches[0] : e;
    const end = getSVGPos(rawE);
    const star = starsRef.current.find(s => s.id === dragging.id);
    if (star) {
      const dx = dragging.startX - end.x;
      const dy = dragging.startY - end.y;
      const speed = Math.min(Math.hypot(dx, dy) * 0.18, 22);
      const mag = Math.hypot(dx, dy);
      if (mag > 5) {
        const power = doublePower[turn] ? 2 : 1;
        const vx = (dx / mag) * speed * power;
        const vy = (dy / mag) * speed * power;
        setStars(prev => prev.map(s => s.id === star.id ? { ...s, vx, vy, glowing: true } : s));
        setTimeout(() => setStars(prev => prev.map(s => s.id === star.id ? { ...s, glowing: false } : s)), 800);
        if (doublePower[turn]) setDoublePower(p => ({ ...p, [turn]: false }));

        // 별자리 선 추가
        setConstellationLines(prev => {
          const cur = prev[turn];
          if (cur.length >= 4) return prev;
          const aliveStars = starsRef.current.filter(s => s.player === turn && s.alive);
          if (aliveStars.length >= 2) {
            const idx = aliveStars.findIndex(s => s.id === star.id);
            const next_star = aliveStars[(idx + 1) % aliveStars.length];
            if (next_star && next_star.id !== star.id) {
              return { ...prev, [turn]: [...cur, { x1: star.x, y1: star.y, x2: next_star.x, y2: next_star.y }] };
            }
          }
          return prev;
        });

        setSkillCooldown(p => ({ ...p, [turn]: Math.max(0, p[turn] - 1) }));
        setShieldActive(p => ({ ...p, [turn]: false }));
        setTurn(t => t === 1 ? 2 : 1);
        setLog("");
        playSound("launch");
      }
    }
    setDragging(null); setDragPos(null);
  }, [dragging, turn, doublePower]);

  // ── 스킬 시네마틱 트리거 ───────────────────────────────────────────
  function triggerCinematic(zodiac, onComplete) {
    const fx = SKILL_FX[zodiac.skillType] || {};
    setSkillCinematic({ zodiac, flavorText: zodiac.skillFlavorText });
    playSound(zodiac.skillType === "freeze" ? "freeze" : "skill");
    if (fx.screenTint) {
      setScreenTint(fx.screenTint);
      setTimeout(() => setScreenTint(null), 1800);
    }
    if (fx.shake) {
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 500);
    }
    // 팝업 표시 후 onComplete 실행
    setTimeout(() => {
      setSkillCinematic(null);
      if (onComplete) onComplete();
    }, 2200);
  }

  // ── 스킬 발동 ──────────────────────────────────────────────────────
  function useSkill() {
    if (skillCooldown[turn] > 0) {
      setLog(`⏳ 스킬 재사용까지 ${skillCooldown[turn]}턴 남았어요!`); return;
    }
    const zodiac = turn === 1 ? p1Zodiac : p2Zodiac;
    const type = zodiac.skillType;

    // 시네마틱 팝업 띄우고, 닫힌 후 실제 효과 적용
    triggerCinematic(zodiac, () => {
      if (type === "shield") {
        setShieldActive(p => ({ ...p, [turn]: true }));
        setStars(prev => prev.map(s => s.player === turn && s.alive ? { ...s, shielded: true } : s));
        setTimeout(() => {
          setShieldActive(p => ({ ...p, [turn]: false }));
          setStars(prev => prev.map(s => s.player === turn ? { ...s, shielded: false } : s));
        }, 3000);
        setLog(`🛡️ ${zodiac.skillName} 발동! 이번 턴 방어!`);
        endSkillTurn();
      } else if (type === "freeze") {
        const enemy = starsRef.current.filter(s => s.player !== turn && s.alive);
        if (enemy.length > 0) {
          const target = enemy[Math.floor(Math.random() * enemy.length)];
          setStars(prev => prev.map(s => s.id === target.id ? { ...s, frozen: true } : s));
          setTimeout(() => setStars(prev => prev.map(s => s.id === target.id ? { ...s, frozen: false } : s)), 4000);
          setLog(`❄️ ${zodiac.skillName} 발동! 상대 별이 얼었어요!`);
        }
        endSkillTurn();
      } else if (type === "reset") {
        const z1 = turn === 1 ? p1Zodiac : p2Zodiac;
        const z2 = turn === 1 ? p2Zodiac : p1Zodiac;
        setStars([...initStars(z1, turn), ...initStars(z2, turn === 1 ? 2 : 1)]);
        setConstellationLines({ 1: [], 2: [] });
        setLog(`⚖️ ${zodiac.skillName} 발동! 초기화!`);
        endSkillTurn();
      } else if (type === "double_power") {
        setDoublePower(p => ({ ...p, [turn]: true }));
        setLog(`🦂 ${zodiac.skillName} 발동! 다음 공격 2배!`);
        endSkillTurn();
      } else if (type === "power_shot") {
        setDoublePower(p => ({ ...p, [turn]: true }));
        setLog(`🐏 ${zodiac.skillName} 발동! 강력 발사 준비!`);
        endSkillTurn();
      } else if (type === "revive") {
        setReviveActive(p => ({ ...p, [turn]: true }));
        setStars(prev => prev.map(s => s.player === turn && s.alive ? { ...s, revive: true } : s));
        setLog(`🦁 ${zodiac.skillName} 발동! 한 번 부활 가능!`);
        endSkillTurn();
      } else if (type === "respawn" || type === "relocate" || type === "heal") {
        const dead = starsRef.current.filter(s => s.player === turn && !s.alive);
        if (dead.length > 0) {
          const target = dead[0];
          setStars(prev => prev.map(s => s.id === target.id ? {
            ...s, alive: true,
            x: turn === 1 ? 50 + Math.random() * 100 : BOARD_SIZE - 150 + Math.random() * 100,
            y: BOARD_SIZE / 2 + (Math.random() - 0.5) * 100,
            vx: 0, vy: 0
          } : s));
          setLog(`✨ ${zodiac.skillName} 발동! 별이 돌아왔어요!`);
        } else { setLog("되살릴 별이 없어요!"); return; }
        endSkillTurn();
      } else if (type === "teleport") {
        const enemy = starsRef.current.filter(s => s.player !== turn && s.alive);
        if (enemy.length > 0) {
          const target = enemy[Math.floor(Math.random() * enemy.length)];
          setStars(prev => prev.map(s => s.id === target.id ? {
            ...s,
            x: STAR_RADIUS + Math.random() * (BOARD_SIZE - STAR_RADIUS * 2),
            y: STAR_RADIUS + Math.random() * (BOARD_SIZE - STAR_RADIUS * 2),
            vx: 0, vy: 0
          } : s));
          setLog(`🐐 ${zodiac.skillName} 발동! 상대 별이 사라졌어요!`);
        }
        endSkillTurn();
      } else if (type === "clone") {
        setLog(`👥 ${zodiac.skillName} - 상대가 혼란에 빠졌어요!`);
        endSkillTurn();
      } else if (type === "piercing") {
        const myStar = starsRef.current.find(s => s.player === turn && s.alive);
        if (myStar) {
          const angle = turn === 1 ? 0 : Math.PI;
          setStars(prev => prev.map(s => s.id === myStar.id ? { ...s, vx: Math.cos(angle) * 20, vy: 0 } : s));
          setLog(`🏹 ${zodiac.skillName} 발동! 황금 화살!`);
          setTurn(t => t === 1 ? 2 : 1);
        }
      }
      setSkillCooldown(p => ({ ...p, [turn]: SKILL_COOLDOWN }));
    });
  }

  function endSkillTurn() {
    setSkillCooldown(p => ({ ...p, [turn]: SKILL_COOLDOWN }));
    setTurn(t => t === 1 ? 2 : 1);
  }

  // ── 게임 시작 ──────────────────────────────────────────────────────
  function startGame() {
    if (!p1Zodiac || !p2Zodiac) return;
    const s1 = initStars(p1Zodiac, 1);
    const s2 = initStars(p2Zodiac, 2);
    setStars([...s1, ...s2]);
    setConstellationLines({ 1: [], 2: [] });
    setTurn(1);
    setSkillCooldown({ 1: 0, 2: 0 });
    setWinner(null);
    setLog("🌟 게임 시작! 별을 드래그해서 발사하세요!");
    setPhase("game");
  }

  // ── 별자리 선 (살아있는 별들 연결) ─────────────────────────────────
  function getLiveLines(playerStars) {
    const alive = playerStars.filter(s => s.alive);
    if (alive.length < 2) return [];
    return alive.slice(0, -1).map((s, i) => ({
      x1: s.x, y1: s.y, x2: alive[i + 1].x, y2: alive[i + 1].y
    }));
  }

  const p1Stars = stars.filter(s => s.player === 1);
  const p2Stars = stars.filter(s => s.player === 2);
  const p1Live = p1Stars.filter(s => s.alive).length;
  const p2Live = p2Stars.filter(s => s.alive).length;
  const curZodiac = turn === 1 ? p1Zodiac : p2Zodiac;

  // ════════════════════════════════════════════════════════════════════
  // 1) 선택 화면
  // ════════════════════════════════════════════════════════════════════
  if (phase === "select") {
    const currentPlayer = selectStep;
    const selected = currentPlayer === 1 ? p1Zodiac : p2Zodiac;

    return (
      <div style={styles.root}>
        <Nebula />
        <BgStars bgStars={bgStars} />
        <div style={styles.selectWrap}>
          <h1 style={styles.title}>✨ 별까기 ✨</h1>
          <p style={styles.subtitle}>바둑알로 즐기는 별자리 대전!</p>

          <div style={{ ...styles.playerBadge, background: currentPlayer === 1 ? "rgba(255,107,107,0.25)" : "rgba(78,205,196,0.25)", borderColor: currentPlayer === 1 ? "#FF6B6B" : "#4ECDC4" }}>
            {currentPlayer === 1 ? "🔴" : "🔵"} 플레이어 {currentPlayer}의 별자리를 선택하세요!
          </div>

          <div style={styles.zodiacGrid}>
            {ZODIAC.map(z => {
              const isDisabled = currentPlayer === 2 && p1Zodiac?.id === z.id;
              const isSelected = selected?.id === z.id;
              return (
                <div
                  key={z.id}
                  style={{
                    ...styles.zodiacCard,
                    borderColor: isSelected ? z.color : "rgba(255,255,255,0.1)",
                    background: isSelected ? `${z.color}22` : "rgba(255,255,255,0.04)",
                    opacity: isDisabled ? 0.3 : 1,
                    transform: isSelected ? "scale(1.06)" : "scale(1)",
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    boxShadow: isSelected ? `0 0 20px ${z.glowColor}` : "none",
                  }}
                  onClick={() => {
                    if (isDisabled) return;
                    if (currentPlayer === 1) setP1Zodiac(z);
                    else setP2Zodiac(z);
                  }}
                >
                  <div style={{ fontSize: 22 }}>{z.emoji}</div>
                  <div style={{ fontSize: 11, color: z.color, fontWeight: 700 }}>{z.name}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>{z.month}</div>
                </div>
              );
            })}
          </div>

          {selected && (
            <div style={{ ...styles.infoBox, borderColor: selected.color, background: `${selected.color}15` }}>
              <div style={styles.infoTitle}>{selected.emoji} {selected.name} — {selected.skillIcon} {selected.skillName}</div>
              <div style={styles.infoMythTitle}>📖 신화 이야기</div>
              <div style={styles.infoText}>{selected.myth}</div>
              <div style={{ ...styles.skillTag, background: `${selected.color}33`, borderColor: selected.color }}>
                ⚡ 특수 스킬: {selected.skillDesc}
              </div>
            </div>
          )}

          {selectStep === 1 ? (
            <button
              style={{ ...styles.btn, opacity: p1Zodiac ? 1 : 0.4, background: p1Zodiac ? p1Zodiac.color : "#555" }}
              onClick={() => { if (p1Zodiac) setSelectStep(2); }}
            >다음 → 플레이어 2 선택</button>
          ) : (
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button style={{ ...styles.btn, background: "#555" }} onClick={() => setSelectStep(1)}>← 뒤로</button>
              <button
                style={{ ...styles.btn, opacity: p2Zodiac ? 1 : 0.4, background: p2Zodiac ? "#FFE66D" : "#555", color: p2Zodiac ? "#111" : "#fff" }}
                onClick={() => { if (p2Zodiac) startGame(); }}
              >🚀 게임 시작!</button>
            </div>
          )}

          <div style={styles.howto}>
            <b>🎮 게임 방법</b><br/>
            별을 드래그해서 당겼다 놓으면 발사! 상대 별을 밖으로 밀어내거나, 내 별자리 선을 먼저 완성하면 승리!
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // 2) 결과 화면
  // ════════════════════════════════════════════════════════════════════
  if (phase === "result") {
    const wz = winner === 1 ? p1Zodiac : p2Zodiac;
    return (
      <div style={styles.root}>
        <Nebula />
        <BgStars bgStars={bgStars} />
        <div style={{ ...styles.selectWrap, textAlign: "center" }}>
          <div style={{ fontSize: 70, marginBottom: 10, animation: "spin 2s linear infinite" }}>{wz?.emoji}</div>
          <h1 style={{ ...styles.title, color: wz?.color }}>플레이어 {winner} 승리!</h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15 }}>{wz?.name}의 신화가 하늘에 새겨졌어요!</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "10px 0 24px" }}>⭐ {wz?.myth}</p>
          <button style={{ ...styles.btn, background: wz?.color, color: "#000" }}
            onClick={() => { setPhase("select"); setSelectStep(1); setP1Zodiac(null); setP2Zodiac(null); setStars([]); }}>
            🔄 다시 하기
          </button>
        </div>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // 3) 게임 화면
  // ════════════════════════════════════════════════════════════════════
  return (
    <div style={{
      ...styles.root,
      animation: screenShake ? "shake 0.4s ease" : "none",
    }}>
      <Nebula />
      <BgStars bgStars={bgStars} />

      {/* 화면 틴트 오버레이 */}
      {screenTint && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50, pointerEvents: "none",
          background: screenTint,
          animation: "tintFlash 1.8s ease forwards",
        }}/>
      )}

      {/* 스킬 시네마틱 팝업 */}
      {skillCinematic && (
        <SkillCinematic
          zodiac={skillCinematic.zodiac}
          flavorText={skillCinematic.flavorText}
          onClose={() => setSkillCinematic(null)}
        />
      )}

      <style>{`
        @keyframes twinkle { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.7)} }
        @keyframes pulse { 0%,100%{box-shadow:0 0 10px currentColor} 50%{box-shadow:0 0 30px currentColor} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          15%{transform:translateX(-8px) rotate(-1deg)}
          30%{transform:translateX(8px) rotate(1deg)}
          45%{transform:translateX(-6px)}
          60%{transform:translateX(6px)}
          75%{transform:translateX(-3px)}
        }
        @keyframes tintFlash {
          0%{opacity:0} 20%{opacity:1} 70%{opacity:0.6} 100%{opacity:0}
        }
        @keyframes cinematicIn {
          from{opacity:0;transform:scale(0.85) translateY(30px)}
          to{opacity:1;transform:scale(1) translateY(0)}
        }
        @keyframes cinematicOut {
          from{opacity:1;transform:scale(1)}
          to{opacity:0;transform:scale(1.05)}
        }
        @keyframes bannerSlide {
          from{opacity:0;transform:translateY(-20px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes glowPulse {
          0%,100%{box-shadow:0 0 30px var(--skill-color), 0 0 60px var(--skill-color)}
          50%{box-shadow:0 0 60px var(--skill-color), 0 0 120px var(--skill-color)}
        }
        @keyframes scanLine {
          from{transform:translateY(-100%)}
          to{transform:translateY(100%)}
        }
      `}</style>

      <div style={styles.gameWrap}>
        {/* 상단 HUD */}
        <div style={styles.hud}>
          <HudCard zodiac={p1Zodiac} liveCount={p1Live} isActive={turn === 1} player={1} />
          <div style={styles.turnBadge}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>현재 차례</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: curZodiac?.color }}>{curZodiac?.emoji} {curZodiac?.name}</div>
          </div>
          <HudCard zodiac={p2Zodiac} liveCount={p2Live} isActive={turn === 2} player={2} />
        </div>

        {/* SVG 게임판 */}
        <div style={styles.boardWrap}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
            style={styles.board}
          >
            <defs>
              <radialGradient id="boardGrad" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="#0d1b3e"/>
                <stop offset="100%" stopColor="#060d1e"/>
              </radialGradient>
              <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <rect width={BOARD_SIZE} height={BOARD_SIZE} fill="url(#boardGrad)" rx="12"/>

            {/* 중앙선 */}
            <line x1={BOARD_SIZE/2} y1={0} x2={BOARD_SIZE/2} y2={BOARD_SIZE} stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="8,8"/>

            {/* 별자리 선 (완성된 것) */}
            {constellationLines[1].map((l, i) => (
              <line key={`cl1_${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={p1Zodiac?.color} strokeWidth="1.5" opacity={0.5} strokeDasharray="4,4"/>
            ))}
            {constellationLines[2].map((l, i) => (
              <line key={`cl2_${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={p2Zodiac?.color} strokeWidth="1.5" opacity={0.5} strokeDasharray="4,4"/>
            ))}

            {/* 살아있는 별들 연결선 */}
            {getLiveLines(p1Stars).map((l, i) => (
              <line key={`ll1_${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={p1Zodiac?.color} strokeWidth="1" opacity={0.3}/>
            ))}
            {getLiveLines(p2Stars).map((l, i) => (
              <line key={`ll2_${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={p2Zodiac?.color} strokeWidth="1" opacity={0.3}/>
            ))}

            {/* 드래그 가이드 */}
            {dragging && dragPos && (() => {
              const star = stars.find(s => s.id === dragging.id);
              if (!star) return null;
              return (
                <>
                  <line x1={star.x} y1={star.y} x2={dragPos.x} y2={dragPos.y}
                    stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeDasharray="6,4"/>
                  <circle cx={dragPos.x} cy={dragPos.y} r={5} fill="rgba(255,255,255,0.3)"/>
                  {/* 발사 방향 화살표 */}
                  {(() => {
                    const dx = star.x - dragPos.x, dy = star.y - dragPos.y;
                    const len = Math.hypot(dx, dy);
                    if (len < 10) return null;
                    const tx = star.x + dx / len * 40, ty = star.y + dy / len * 40;
                    return <line x1={star.x} y1={star.y} x2={tx} y2={ty} stroke="rgba(255,220,100,0.8)" strokeWidth="2.5" markerEnd="url(#arrow)"/>;
                  })()}
                </>
              );
            })()}

            {/* 파티클 */}
            {particles.map(p => (
              <circle key={p.id} cx={p.x} cy={p.y} r={3} fill={p.color} opacity={0.8}>
                <animate attributeName="opacity" from="0.8" to="0" dur="0.8s" fill="freeze"/>
                <animate attributeName="r" from="3" to="1" dur="0.8s" fill="freeze"/>
              </circle>
            ))}

            {/* 별 */}
            {stars.map(star => {
              if (!star.alive) return null;
              const zodiac = star.player === 1 ? p1Zodiac : p2Zodiac;
              const isDragging = dragging?.id === star.id;
              return (
                <g key={star.id}
                  onMouseDown={e => onStarDown(e, star)}
                  onTouchStart={e => { e.preventDefault(); onStarDown(e, star); }}
                  style={{ cursor: star.player === turn ? "grab" : "default" }}
                >
                  <StarShape
                    x={star.x} y={star.y}
                    r={isDragging ? STAR_RADIUS * 1.15 : STAR_RADIUS}
                    color={zodiac?.color || "#fff"}
                    glow={zodiac?.glowColor}
                    glowing={isDragging || star.glowing}
                    frozen={star.frozen}
                    shielded={star.shielded}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* 하단 스킬 & 로그 */}
        <div style={styles.bottom}>
          {log && <div style={styles.logBox}>{log}</div>}
          <div style={styles.skillRow}>
            <div style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
              {curZodiac?.skillIcon} {curZodiac?.skillName}
            </div>
            <button
              style={{
                ...styles.skillBtn,
                background: skillCooldown[turn] === 0 ? `${curZodiac?.color}33` : "rgba(100,100,100,0.3)",
                borderColor: skillCooldown[turn] === 0 ? curZodiac?.color : "#444",
                color: skillCooldown[turn] === 0 ? curZodiac?.color : "#666",
              }}
              onClick={useSkill}
            >
              {skillCooldown[turn] > 0
                ? `🔒 ${skillCooldown[turn]}턴 후 사용 가능`
                : `⚡ 스킬 사용! (${curZodiac?.skillName})`}
            </button>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
              {curZodiac?.skillDesc}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 보조 컴포넌트 ────────────────────────────────────────────────────
// ─── 스킬 시네마틱 팝업 컴포넌트 ─────────────────────────────────────
function SkillCinematic({ zodiac, flavorText, onClose }) {
  const [phase, setPhase] = useState("in"); // in → hold → out
  const imgSrc = SKILL_IMAGES[zodiac.id];
  const fx = SKILL_FX[zodiac.skillType] || {};

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 400);
    const t2 = setTimeout(() => setPhase("out"), 1700);
    const t3 = setTimeout(() => onClose?.(), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.82)",
      animation: phase === "out" ? "cinematicOut 0.5s ease forwards" : "cinematicIn 0.4s ease forwards",
    }}>
      {/* 배경 글로우 */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse at center, ${zodiac.color}22 0%, transparent 70%)`,
      }}/>

      {/* 스캔라인 이펙트 */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", left: 0, right: 0, height: "40%",
          background: `linear-gradient(to bottom, transparent, ${zodiac.color}15, transparent)`,
          animation: "scanLine 1.5s linear infinite",
        }}/>
      </div>

      {/* 메인 카드 */}
      <div style={{
        position: "relative", zIndex: 10,
        width: "min(420px, 92vw)",
        borderRadius: 20,
        border: `2px solid ${zodiac.color}`,
        overflow: "hidden",
        boxShadow: `0 0 40px ${zodiac.color}80, 0 0 80px ${zodiac.color}30`,
        "--skill-color": zodiac.color,
        animation: phase === "hold" ? "glowPulse 0.8s ease infinite" : "none",
      }}>
        {/* 이미지 영역 */}
        <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", overflow: "hidden" }}>
          <img
            src={imgSrc}
            alt={zodiac.skillName}
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              filter: `saturate(1.3) brightness(0.9)`,
              transform: phase === "hold" ? "scale(1.04)" : "scale(1)",
              transition: "transform 0.8s ease",
            }}
            onError={e => { e.target.style.display = "none"; }}
          />
          {/* 이미지 위 그라디언트 */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: "60%",
            background: "linear-gradient(to top, rgba(6,13,30,0.95), transparent)",
          }}/>

          {/* 별자리 뱃지 */}
          <div style={{
            position: "absolute", top: 12, left: 12,
            background: `${zodiac.color}33`,
            border: `1px solid ${zodiac.color}`,
            borderRadius: 20, padding: "4px 12px",
            fontSize: 12, fontWeight: 700, color: zodiac.color,
            backdropFilter: "blur(8px)",
            animation: "bannerSlide 0.4s ease",
          }}>
            {zodiac.emoji} {zodiac.name} · {zodiac.month}
          </div>

          {/* SKILL ACTIVATED 배너 */}
          <div style={{
            position: "absolute", top: 12, right: 12,
            background: "rgba(0,0,0,0.6)",
            border: `1px solid ${zodiac.color}88`,
            borderRadius: 6, padding: "3px 8px",
            fontSize: 9, fontWeight: 800, letterSpacing: 2,
            color: zodiac.color, textTransform: "uppercase",
            animation: "bannerSlide 0.5s ease",
          }}>
            SKILL ACTIVATED
          </div>
        </div>

        {/* 텍스트 영역 */}
        <div style={{
          padding: "16px 20px 20px",
          background: "linear-gradient(to bottom, rgba(6,13,30,0.98), rgba(10,20,50,0.98))",
        }}>
          {/* 스킬 이름 */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
            animation: "bannerSlide 0.5s ease",
          }}>
            <span style={{ fontSize: 28 }}>{zodiac.skillIcon}</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: zodiac.color, lineHeight: 1.1 }}>
                {zodiac.skillName}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 600, letterSpacing: 1 }}>
                {zodiac.name.toUpperCase()} SPECIAL SKILL
              </div>
            </div>
          </div>

          {/* 플레이버 텍스트 */}
          <div style={{
            fontSize: 12.5, color: "rgba(255,255,255,0.8)",
            lineHeight: 1.65, marginBottom: 12,
            borderLeft: `2px solid ${zodiac.color}66`,
            paddingLeft: 12,
            animation: "fadeInUp 0.6s ease",
          }}>
            {flavorText}
          </div>

          {/* 효과 설명 */}
          <div style={{
            padding: "8px 12px",
            background: `${zodiac.color}18`,
            border: `1px solid ${zodiac.color}44`,
            borderRadius: 8, fontSize: 12, color: zodiac.color,
            fontWeight: 700,
            animation: "fadeInUp 0.7s ease",
          }}>
            ⚡ {zodiac.skillDesc}
          </div>
        </div>
      </div>

      {/* 탭하여 닫기 안내 */}
      <div style={{
        position: "absolute", bottom: 24, left: 0, right: 0, textAlign: "center",
        fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 1,
        animation: "fadeInUp 1s ease",
      }}>
        TAP TO SKIP
      </div>

      {/* 클릭으로 닫기 */}
      <div style={{ position: "absolute", inset: 0, cursor: "pointer" }} onClick={() => { setPhase("out"); setTimeout(onClose, 300); }}/>
    </div>
  );
}

function HudCard({ zodiac, liveCount, isActive, player }) {
  if (!zodiac) return <div style={{ width: 130 }}/>;
  const color = player === 1 ? "#FF6B6B" : "#4ECDC4";
  return (
    <div style={{
      ...styles.hudCard,
      borderColor: isActive ? zodiac.color : "rgba(255,255,255,0.1)",
      background: isActive ? `${zodiac.color}18` : "rgba(255,255,255,0.04)",
      boxShadow: isActive ? `0 0 15px ${zodiac.glowColor}` : "none",
    }}>
      <div style={{ fontSize: 10, color, fontWeight: 700 }}>P{player} {zodiac.emoji}</div>
      <div style={{ fontSize: 11, color: zodiac.color, fontWeight: 800 }}>{zodiac.name}</div>
      <div style={{ display: "flex", gap: 4, marginTop: 4, justifyContent: "center" }}>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: "50%",
            background: i < liveCount ? zodiac.color : "rgba(255,255,255,0.1)",
            boxShadow: i < liveCount ? `0 0 4px ${zodiac.color}` : "none",
            transition: "all 0.3s"
          }}/>
        ))}
      </div>
    </div>
  );
}

function Nebula() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
      {[
        { top: "10%", left: "5%", w: 300, h: 200, color: "rgba(100,60,180,0.12)" },
        { top: "60%", right: "5%", w: 250, h: 180, color: "rgba(60,120,200,0.1)" },
        { top: "30%", left: "50%", w: 200, h: 200, color: "rgba(180,60,120,0.08)" },
      ].map((n, i) => (
        <div key={i} style={{
          position: "absolute", top: n.top, left: n.left, right: n.right,
          width: n.w, height: n.h, borderRadius: "50%",
          background: `radial-gradient(ellipse, ${n.color}, transparent)`,
          filter: "blur(30px)",
        }}/>
      ))}
    </div>
  );
}

function BgStars({ bgStars }) {
  return (
    <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} viewBox="0 0 100 100" preserveAspectRatio="none">
      {bgStars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r * 0.3} fill="white" opacity={0.7}>
          <animate attributeName="opacity" values="0.7;0.1;0.7" dur={`${s.dur}s`} begin={`${s.delay}s`} repeatCount="indefinite"/>
        </circle>
      ))}
    </svg>
  );
}

// ─── 스타일 ───────────────────────────────────────────────────────────
const styles = {
  root: {
    minHeight: "100vh", background: "#060d1e",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: "white", padding: 12, boxSizing: "border-box",
    position: "relative",
    // iPad 드래그 버그 방지
    userSelect: "none",
    WebkitUserSelect: "none",
    touchAction: "none",
    WebkitTouchCallout: "none",
    overscrollBehavior: "none",
  },
  selectWrap: {
    position: "relative", zIndex: 10, width: "100%", maxWidth: 520,
    display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
  },
  title: {
    fontSize: "clamp(28px, 7vw, 42px)", fontWeight: 900, margin: 0,
    background: "linear-gradient(135deg, #FFE66D, #FF6B6B, #B8A9C9)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    textShadow: "none", letterSpacing: "-1px",
  },
  subtitle: { fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0 },
  playerBadge: {
    padding: "8px 18px", borderRadius: 20, fontSize: 13, fontWeight: 700,
    border: "1.5px solid", backdropFilter: "blur(10px)",
  },
  zodiacGrid: {
    display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6,
    width: "100%",
  },
  zodiacCard: {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "8px 4px", borderRadius: 10, border: "1.5px solid",
    cursor: "pointer", transition: "all 0.2s", gap: 3,
    userSelect: "none",
  },
  infoBox: {
    width: "100%", padding: 14, borderRadius: 12, border: "1.5px solid",
    display: "flex", flexDirection: "column", gap: 8, backdropFilter: "blur(10px)",
  },
  infoTitle: { fontSize: 14, fontWeight: 800 },
  infoMythTitle: { fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600 },
  infoText: { fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 },
  skillTag: {
    padding: "6px 10px", borderRadius: 8, fontSize: 11, border: "1px solid",
    color: "rgba(255,255,255,0.9)",
  },
  btn: {
    padding: "11px 28px", borderRadius: 24, border: "none", cursor: "pointer",
    fontWeight: 800, fontSize: 14, transition: "all 0.2s", color: "white",
  },
  howto: {
    fontSize: 11, color: "rgba(255,255,255,0.45)", textAlign: "center",
    background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 14px",
    lineHeight: 1.7, width: "100%",
  },
  gameWrap: {
    position: "relative", zIndex: 10, width: "100%", maxWidth: 540,
    display: "flex", flexDirection: "column", gap: 10,
  },
  hud: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  hudCard: {
    flex: 1, padding: "8px 10px", borderRadius: 10, border: "1.5px solid",
    transition: "all 0.3s", textAlign: "center",
  },
  turnBadge: {
    textAlign: "center", padding: "6px 12px", borderRadius: 10,
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    minWidth: 120,
  },
  boardWrap: {
    width: "100%", aspectRatio: "1", borderRadius: 16,
    overflow: "hidden", border: "2px solid rgba(255,255,255,0.08)",
    boxShadow: "0 0 40px rgba(0,0,100,0.5)",
  },
  board: { width: "100%", height: "100%", display: "block", touchAction: "none" },
  bottom: { display: "flex", flexDirection: "column", gap: 8 },
  logBox: {
    textAlign: "center", fontSize: 12, padding: "8px 14px",
    background: "rgba(255,255,255,0.06)", borderRadius: 10,
    color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.08)",
  },
  skillRow: {
    display: "flex", flexDirection: "column", gap: 6,
    background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "10px 14px",
    border: "1px solid rgba(255,255,255,0.07)",
  },
  skillBtn: {
    padding: "10px 18px", borderRadius: 10, border: "1.5px solid",
    fontWeight: 700, fontSize: 13, cursor: "pointer",
    transition: "all 0.2s",
  },
};
