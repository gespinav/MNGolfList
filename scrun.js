// Scrape GolfLink course page + parse hole grid. Usage: node scrun.js <targets.json> <start> <count>
const puppeteer=require('puppeteer-core');const fs=require('fs');
const CHROME='/usr/bin/google-chrome';
const UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36';
function strip18(a){if(a.length>=20)return[...a.slice(0,9),...a.slice(10,19)];return a.slice(0,18);}
function parse(text,scKey,source){
  const lines=text.split('\n').map(l=>l.replace(/\r/,''));
  const hi=lines.findIndex(l=>/^HOLE\t/.test(l)&&/TOT/.test(l));
  if(hi<0)return{err:'no-grid'};
  const tees=[];let par18=null;
  for(let i=hi+1;i<lines.length;i++){const L=lines[i].trim();if(!L)continue;
    if(/^Par$/i.test(L)){const nums=(lines[i+1].match(/\d+/g)||[]).map(Number);par18=strip18(nums);break;}
    if(lines[i].includes('\t')){const nums=(lines[i].match(/\d+/g)||[]).map(Number);
      if(nums.length>=20&&nums.length<=21){const rs=(lines[i-1].match(/(\d{2}\.\d+)\/(\d{2,3})/)||[]);
        tees.push({name:(lines[i-2]||'').trim(),rating:rs[1]||null,slope:rs[2]?Number(rs[2]):null,yards:strip18(nums),tot:nums.at(-1)});}}}
  if(!par18||par18.length!==18)return{err:'no-par'};if(!tees.length)return{err:'no-tees'};
  let lng=tees[0];for(const t of tees)if(t.tot>lng.tot)lng=t;
  if(lng.yards.length!==18)return{err:'short-tee'};
  const holes=lng.yards.map((y,i)=>[y,par18[i]]);
  const col=n=>/black|championship|tournament|pro|silver|tips/i.test(n)?'#222':/blue/i.test(n)?'#1a4a8a':/white/i.test(n)?'#ddd':/gold/i.test(n)?'#b8860b':/red|forward/i.test(n)?'#8a1a1a':'#446644';
  const seen=new Set();
  const teeStr=tees.filter(t=>t.rating&&!seen.has(t.name)&&seen.add(t.name)).slice(0,6)
    .map(t=>`{name:${JSON.stringify(t.name)},yds:${t.tot},rating:"${(+t.rating).toFixed(1)}",slope:${t.slope},color:"${col(t.name)}"}`).join(',');
  if(!teeStr)return{err:'no-rated-tees'};
  return{entry:`  ${scKey}:{source:${JSON.stringify(source)},tees:[${teeStr}],\n    holes:${JSON.stringify(holes)}},`,parTot:par18.reduce((a,b)=>a+b,0),longest:lng.name,tot:lng.tot};
}
(async()=>{
  const targets=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
  const start=parseInt(process.argv[3]||'0'),count=parseInt(process.argv[4]||'99');
  const slice=targets.slice(start,start+count);
  const prof='/tmp/chrome-prof-'+process.pid+'-'+Date.now();
  const browser=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--window-size=1366,2400','--user-data-dir='+prof]});
  for(const t of slice){const page=await browser.newPage();
    try{await page.setUserAgent(UA);await page.setViewport({width:1366,height:2400});
      let status='n/a';try{const r=await page.goto(t.url,{waitUntil:'networkidle2',timeout:38000});status=r?r.status():'no-resp';}catch(e){status='goto-err';}
      await new Promise(r=>setTimeout(r,3500));
      const text=await page.evaluate(()=>document.body?document.body.innerText:'').catch(()=> '');
      const res=parse(text,t.scKey,"GolfLink verified 2026");
      if(res.entry){console.log(`/*#${t.id} ${t.scKey} | ${res.longest} ${res.tot}y par${res.parTot}*/`);console.log(res.entry);console.error(`OK ${t.id} ${t.scKey}`);}
      else console.error(`FAIL ${t.id} ${t.scKey} | HTTP ${status} | ${res.err} | ${t.url}`);
    }catch(e){console.error(`ERR ${t.id} ${t.scKey} ${e.message.split('\n')[0]}`);}
    finally{await page.close().catch(()=>{});}}
  await browser.close();
})();
