const { chromium } = require('/home/ethan/.codex-cs199/tools/node_modules/playwright-core');
const [port, ...names] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 800, height: 600 } });
p.on('pageerror', e => console.log('ERR', e.message));
for (const n of names) {
  await p.goto(`http://localhost:${port}/prototype/grid/models/_preview.html?m=${n}`);
  await p.waitForFunction(() => document.title.startsWith('done'), null, { timeout: 60000 });
  console.log(n, await p.title());
  await p.screenshot({ path: `${process.env.SHOTS}/model-${n}.png` });
}
await b.close();
