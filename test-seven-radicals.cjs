// Run: node test-seven-radicals.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(`${__dirname}/index.html`, 'utf8');
for (const [,script] of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(script);
const start = html.indexOf('{id:"seven-radicals"');
const end = html.indexOf('{id:"leonhard"', start);
const test = vm.runInNewContext(`(${html.slice(start, end).trim().replace(/,$/, '')})`, {o: String});
assert.equal(test.questions.length, 42);
assert.equal(test.scales.length, 7);
assert.ok(html.includes('tests:["thinking","leonhard","seven-radicals","temperament"'));
const items = test.scales.flatMap(s => [...s.direct, ...s.reverse]);
assert.equal(new Set(items).size, 42);
assert.ok(items.every(n => n >= 1 && n <= 42));
const answers = value => Object.fromEntries(test.questions.map((q,i) => {
  assert.equal(q.options.length, 4);
  return [i,value];
}));
for (const value of [0,1,2,3]) {
  const result = test.compute(answers(value));
  assert.ok(result.scales.every(s => s.value >= 0 && s.value <= 18));
  assert.equal(result.lead.name, 'Равные показатели всех радикалов');
}
for (const scale of test.scales) {
  const low = answers(0), high = answers(3);
  scale.direct.forEach(n => {low[n-1] = 3; high[n-1] = 0;});
  scale.reverse.forEach(n => {low[n-1] = 0; high[n-1] = 3;});
  assert.equal(test.compute(low).scales.find(s => s.key === scale.key).value, 0);
  assert.equal(test.compute(high).scales.find(s => s.key === scale.key).value, 18);
  assert.equal(test.compute(high).lead.name, scale.name);
}
for (const invalid of [{}, {...answers(0), 0:-1}, {...answers(0), 0:4}, {...answers(0), 0:'0'}, {...answers(0), 0:null}]) {
  assert.throws(() => test.compute(invalid), /Ответьте на все 42 вопроса/);
}
console.log('OK: scripts parse; 42 questions; 7 scales; scoring, ties, validation, category.');
