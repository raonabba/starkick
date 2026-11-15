// 별까기 카드배틀 엔진 테스트: node card-battle/test-engine.js
// index.html 안의 ENGINE 블록을 꺼내서 문제 생성기와 게임 규칙을 검사합니다.
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const src = html.split('// ===ENGINE START===')[1].split('// ===ENGINE END===')[0];
const E = new Function(src + '; return { DIFFS, CARDS, makeProblem, wrongDamage, damageFor, newGame, endTurn, playMinion, spendSpell, resolveAttack, resolveSpell, aiNextAction };')();
let fails = 0;
const fail = (...m) => { fails++; if (fails < 10) console.log('FAIL', ...m); };

// 1) 문제: 보기 4개, 값이 모두 다르고, 정답이 정확히 하나, 계산이 맞는지
const evalQ = q => (/의 최|…/.test(q) ? null : Function('return (' + q.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-') + ')')());
for (const d of Object.keys(E.DIFFS)) for (let i = 0; i < 5000; i++) {
  const p = E.makeProblem(d, Math.random);
  const vals = p.choices.map(c => c.v.toFixed(6));
  if (p.choices.length !== 4 || new Set(vals).size !== 4) fail(d, 'choices', p.q, p.choices.map(c => c.s));
  if (vals.filter(v => v === p.ans.v.toFixed(6)).length !== 1) fail(d, 'answer', p.q);
  const ev = evalQ(p.q); if (ev !== null && Math.abs(ev - p.ans.v) > 1e-9) fail(d, 'wrong answer', p.q, p.ans.s);
  if (d !== 'super' && p.time !== E.DIFFS[d].time) fail(d, 'time', p.time);
}
// 2) 오답 피해: 카드 공격력의 10~50%, 정답은 100%
for (const id of Object.keys(E.CARDS)) { const atk = E.CARDS[id].atk; if (!atk) continue;
  if (E.damageFor(atk, true, Math.random) !== atk) fail('correct dmg', id);
  for (let i = 0; i < 2000; i++) { const w = E.wrongDamage(atk, Math.random); if (w < Math.max(1, Math.round(atk * 0.1)) || w > Math.round(atk * 0.5)) fail('wrong dmg', id, w); } }
// 3) 컴퓨터끼리 500판: 오류 없이 끝나는지
let stalls = 0;
for (let g = 0; g < 500; g++) {
  const st = E.newGame('leo', 'pisces', ['easy', 'normal', 'hard', 'super'][g % 4], Math.random);
  while (!st.winner && st.turnNo < 150) { const side = st.turn; let a, n = 0;
    while (!st.winner && (a = E.aiNextAction(st, side)).type !== 'end' && n++ < 50) { const c = Math.random() < 0.7;
      if (a.type === 'play') E.playMinion(st, side, a.idx);
      else if (a.type === 'spell') { const id = E.spendSpell(st, side, a.idx); E.resolveSpell(st, side, id, a.target, c, Math.random); }
      else E.resolveAttack(st, side, a.uid, a.target, c, Math.random); }
    E.endTurn(st); }
  if (!st.winner) stalls++;
}
if (stalls) fail('stalled games', stalls);
console.log(fails ? `실패 ${fails}건` : '모든 검사 통과 (문제 20,000개 · 피해 계산 · 500판 시뮬레이션)');
process.exit(fails ? 1 : 0);
