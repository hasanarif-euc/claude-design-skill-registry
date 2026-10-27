// Capture viewport screenshots of a scroll-driven WebGL page at chosen scene positions.
// Usage: SNAP=1 node scroll-shots.js /abs/path/page.html /abs/path/out-prefix 1440 0,0.3,1.32,2.32
//   width 1440 (900 high) or 375 (812 high); positions are in "scene units" (scrollY / scene height).
// SNAP=1 opens the page with #snap so the scene skips its scroll smoothing; without it,
// SwiftShader renders so slowly that frames are captured before the pill catches up.
// Needs Playwright with Chromium; WebGL runs on SwiftShader in headless mode.
const { chromium } = require('playwright');
(async () => {
  const [,, file, prefix, w, fl] = process.argv;
  const fs = fl.split(',').map(Number);
  const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const vh = +w>800?900:812;
  const p = await b.newPage({ viewport: { width: +w, height: vh } });
  const errs=[]; p.on('pageerror', e=>errs.push(e.message)); p.on('console', m=>{ if(m.type()==='error'||m.type()==='warning') errs.push(m.type()+': '+m.text()) });
  await p.goto('file://' + file + (process.env.SNAP ? '#snap' : '')); await p.waitForTimeout(2500);
  const secH = await p.evaluate(()=>document.querySelector('.scene').offsetHeight);
  let y=0;
  for (let k=0;k<fs.length;k++){
    const target=Math.round(fs[k]*secH);
    while(Math.abs(y-target)>1){ y = y<target? Math.min(target,y+200) : Math.max(target,y-200); await p.evaluate(v=>window.scrollTo(0,v), y); await p.waitForTimeout(50); }
    await p.waitForTimeout(process.env.SNAP ? 1200 : 2200);
    await p.screenshot({ path: `${prefix}-${String(k).padStart(2,'0')}.png` });
  }
  console.log('dbg', JSON.stringify(await p.evaluate(()=>window.__pillDebug&&window.__pillDebug())).slice(0,300));
  console.log('errors:', errs.slice(0,8).join('\n')||'none');
  await b.close();
})();
