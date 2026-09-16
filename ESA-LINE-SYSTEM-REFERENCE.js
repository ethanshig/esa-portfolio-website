/* ESA LINE SYSTEM — REFERENCE IMPLEMENTATION (from the landing mockup, v12)
   Read with ESA-LINE-SYSTEM-SPEC.md. This is the mockup's sequence code verbatim: it runs inside a
   16:9 demo screen, not the site, so port the ideas and constants rather than dropping it in.
   It expects these globals from the mockup page:
     OCT     = {e:{pieces:[{t:'arc',k:1},...]}, s:{...}, a:{...}, weight:30, caps:'round'}
               arcs on: e = 1-6, s = 1,2,3,5,6,7, a = 0-4,7   (k = octant index, 45° each, anticlockwise from +x)
     el(tag, attrs)   creates an SVG element      ease(p) = 1-(1-p)^3
     reduce  = matchMedia('(prefers-reduced-motion: reduce)').matches
   DOM ids it touches: #svg2 #s2 #logo2 #logoBig #beats2 #p2 #pass2 #r2 #e2 #g2 #depth #depthV, '#s2 .links' */
/* ===================== sequence 2 ===================== */
(function(){
  var svg=document.getElementById('svg2'), screen=document.getElementById('s2');
  var W=OCT.weight, CAP=OCT.caps==='round'?'round':'butt';
  var R=300, GAP=2*R, order=['e','s','a'], TAU=Math.PI*2;
  var X0=-R, X1=(order.length-1)*GAP+R, MW=X1-X0, MCX=(X0+X1)/2;
  var VW=MW/0.34, VH=VW*9/16, VX=MCX-VW/2, VY=-VH/2;
  svg.setAttribute('viewBox', VX+' '+VY+' '+VW+' '+VH);

  function clamp01(v){return v<0?0:v>1?1:v;}
  var gGrid=el('g'), gPage=el('g'), gMain=el('g');
  [gGrid,gPage,gMain].forEach(function(n){svg.appendChild(n);});

  var BEATS=[['Build','Guide circles, arcs, then one bar. The circles fade; the word stands clean.'],
             ['Click','The bar retracts, the circles return, the arcs retract, the circles close.'],
             ['Page','Outlines draw onto the grid, the nav logo first; its bar runs out under the links.'],
             ['After','Outlines keep breathing at 45%. The logo rests, then its circles take turns.']];
  var showGrid=false;
  function paintBeats(){
    document.getElementById('beats2').innerHTML=BEATS.map(function(r){
      return '<div class="beat"><b>'+r[0]+'</b><span>'+r[1]+'</span></div>';}).join('');
  }

  /* ---- arcs: each continuous run of octants is one stroke ---- */
  function arcD(ox,a0,a1){
    var span=a1-a0;
    var x0=ox+R*Math.cos(a0), y0=-R*Math.sin(a0);
    if(span>=TAU-1e-6){
      var xm=ox+R*Math.cos(a0+Math.PI), ym=-R*Math.sin(a0+Math.PI);
      return 'M'+x0.toFixed(2)+' '+y0.toFixed(2)+'A'+R+' '+R+' 0 0 0 '+xm.toFixed(2)+' '+ym.toFixed(2)+
             'A'+R+' '+R+' 0 0 0 '+x0.toFixed(2)+' '+y0.toFixed(2);
    }
    var x1=ox+R*Math.cos(a1), y1=-R*Math.sin(a1);
    return 'M'+x0.toFixed(2)+' '+y0.toFixed(2)+'A'+R+' '+R+' 0 '+(span>Math.PI?1:0)+' 0 '+
           x1.toFixed(2)+' '+y1.toFixed(2);
  }
  function arcRuns(letter){
    var on=[false,false,false,false,false,false,false,false];
    OCT[letter].pieces.forEach(function(p){ if(p.t==='arc') on[p.k]=true; });
    if(on.filter(Boolean).length===8) return [[0,8]];
    var runs=[];
    for(var s0=0;s0<8;s0++){
      if(on[s0] && !on[(s0+7)%8]){ var len=0; while(len<8 && on[(s0+len)%8]) len++; runs.push([s0,len]); }
    }
    return runs;
  }

  /* ================= the logo: circles turn, the bar holds =================
     Each letter is a circle with octants cut away. Turning a circle about its centre moves its gaps round
     while the bar stays put. The circles touch, so they turn like meshed gears: e and a one way, s the other.
     Relay: e turns, hands to s, hands to a, then the word rests. Every line is a filled ribbon, so the same
     renderer can also give the page outlines a breathing weight. */
  var LOGO_W=58;                 /* heavier than the display weight: optical sizing for ~30px */
  var LSTROKES=[];
  order.forEach(function(key,i){
    arcRuns(key).forEach(function(run){
      var ox=i*GAP, a0=run[0]*TAU/8, a1=(run[0]+run[1])*TAU/8, n=Math.max(12,Math.round((a1-a0)*R/14)), pts=[];
      for(var j=0;j<=n;j++){ var a=a0+(a1-a0)*j/n; pts.push([ox+R*Math.cos(a), -R*Math.sin(a)]); }
      LSTROKES.push({pts:pts, len:(a1-a0)*R, li:i, ox:ox});
    });
  });
  function calm(p){ return 0.5-0.5*Math.cos(Math.PI*clamp01(p)); }   /* ease-in-out sine */
  var TURN_DIR=[1,-1,1];
  function turns(t){                     /* relay, 12 s: e 0.6-3.8, s 2.8-6.0, a 5.0-8.2, rest */
    var th=[0,0,0], c=t%12;
    for(var i=0;i<3;i++) th[i]=((TAU*calm((c-0.6-i*2.2)/3.2))%TAU)*TURN_DIR[i];
    return th;
  }
  function turnPts(st, th){
    if(!th) return st.pts;
    var cs=Math.cos(th), sn=Math.sin(th), ox=st.ox;
    /* y is flipped on screen, so a positive angle turns anticlockwise */
    return st.pts.map(function(p){ var dx=p[0]-ox, dy=p[1];
      return [ox + dx*cs + dy*sn, dy*cs - dx*sn]; });
  }

  /* breathing weight: a slow field drifting across the page plus one breath every 7.5 s.
     Smooth in space, so wherever two outlines meet they agree. */
  var outlineDepth=0.45;
  function breathAt(x,y,t){
    var field = 0.55*Math.sin(x*0.0021 + t*0.83)
              + 0.30*Math.sin(y*0.0033 - t*0.61 + 1.7)
              + 0.15*Math.sin((x-y)*0.0015 + t*1.13 + 0.4);
    var breath = Math.sin(t*TAU/7.5);
    return Math.max(0.35, 1 + outlineDepth*(0.70*field + 0.30*breath));
  }
  /* ribbon: offset a sampled centreline by w(x,y)/2 each side. A line that has barely started is also
     barely wide, so it tapers in like a brush and never leaves a dot. */
  function ribbonD(pts, reveal, base, wmul, strokeLen){
    var n=pts.length; if(reveal<=0.002) return {d:'',caps:[]};
    var taper=clamp01((reveal*strokeLen)/(base*2.2));
    var m=Math.max(2, Math.min(n, Math.round(1+(n-1)*reveal)));
    var L=[], Rt=[], wEnd=0, wStart=0;
    for(var i=0;i<m;i++){
      var p=pts[i], a=pts[Math.max(0,i-1)], b=pts[Math.min(n-1,i+1)];
      var tx=b[0]-a[0], ty=b[1]-a[1], len=Math.hypot(tx,ty)||1, nx=-ty/len, ny=tx/len;
      var w=base*(wmul?wmul(p[0],p[1]):1)/2*taper;
      if(i===0) wStart=w; if(i===m-1) wEnd=w;
      L.push((p[0]+nx*w).toFixed(1)+' '+(p[1]+ny*w).toFixed(1));
      Rt.push((p[0]-nx*w).toFixed(1)+' '+(p[1]-ny*w).toFixed(1));
    }
    return { d:'M'+L.join('L')+'L'+Rt.reverse().join('L')+'Z',
             caps:[[pts[0][0],pts[0][1],wStart],[pts[m-1][0],pts[m-1][1],wEnd]] };
  }
  function Ribbon(parent){
    var body=parent.appendChild(el('path',{fill:'#1d1c19'}));
    var caps=[parent.appendChild(el('circle',{fill:'#1d1c19',r:0})), parent.appendChild(el('circle',{fill:'#1d1c19',r:0}))];
    return function(r){
      body.setAttribute('d', r.d);
      caps.forEach(function(c,k){
        if(!r.caps.length || CAP!=='round'){ c.setAttribute('r',0); return; }
        c.setAttribute('cx',r.caps[k][0].toFixed(1)); c.setAttribute('cy',r.caps[k][1].toFixed(1));
        c.setAttribute('r',r.caps[k][2].toFixed(1));
      });
    };
  }

  var LOGO_TOP=-R-80, LOGO_H=2*R+160;
  /* opts.wide: the bar keeps going to the right edge of the host, underlining the nav links */
  function LogoView(host, opts){
    opts=opts||{};
    var sv=el('svg',{preserveAspectRatio:'xMinYMid meet'}), g=el('g'); sv.appendChild(g); host.appendChild(sv);
    var arcsR=LSTROKES.map(function(){ return Ribbon(g); });
    var barR=Ribbon(g), extR=Ribbon(g), barEnd=X1;
    function fit(){
      if(opts.wide){
        var box=host.getBoundingClientRect();
        var upx = box.height>0 ? LOGO_H/box.height : 1;
        var vw = Math.max(MW+160, box.width*upx);
        sv.setAttribute('viewBox',(X0-80)+' '+LOGO_TOP+' '+vw.toFixed(1)+' '+LOGO_H);
        barEnd = X0-80+vw - LOGO_W/2;              /* cap lands flush with the host's right edge */
      } else {
        sv.setAttribute('viewBox',(X0-80)+' '+LOGO_TOP+' '+(MW+160)+' '+LOGO_H);
      }
    }
    fit();
    if(opts.wide && window.ResizeObserver) new ResizeObserver(fit).observe(host);
    /* tp: seconds since the page began drawing (undefined = fully built, turning on the global clock).
       The nav logo is the page's first outline: arcs 0-1.0, bar 0.55-1.25, bar runs out 1.1-2.7,
       then it rests ~3 s before the first relay turn. */
    return function draw(t, tp){
      var built = (tp===undefined);
      var arcP = built?1:calm(tp/1.0), barP = built?1:calm((tp-0.55)/0.7);
      var th = built ? turns(t) : (tp<2.7 ? [0,0,0] : turns(tp-2.7+9.7));
      LSTROKES.forEach(function(st,i){ arcsR[i](ribbonD(turnPts(st, th[st.li]),arcP,LOGO_W,null,st.len)); });
      barR(ribbonD([[X0,0],[X0+MW*barP,0]],barP>0.002?1:0,LOGO_W,null,MW*barP));
      var e=(opts.wide && !built) ? calm((tp-1.1)/1.6) : 0;
      extR(e>0 ? ribbonD([[X1,0],[X1+(barEnd-X1)*e,0]],1,LOGO_W,null,1e6) : {d:'',caps:[]});
    };
  }
  var navT=-1;                             /* set by the sequence: seconds since the page began; -1 before */
  var navLinks=document.querySelector('#s2 .links');
  var drawNavLogo=LogoView(document.getElementById('logo2'), {wide:true});
  var drawBigLogo=LogoView(document.getElementById('logoBig'));
  (function(){
    var lt0=0;
    function tick(now){
      if(!lt0) lt0=now;
      var t=reduce?0:(now-lt0)/1000;
      drawNavLogo(t, navT<0 ? -1 : navT); drawBigLogo(t);
      if(navLinks) navLinks.style.opacity = navT<0 ? '0' : calm((navT-2.1)/0.6).toFixed(3);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    var dp=document.getElementById('depth'), dv=document.getElementById('depthV');
    dp.addEventListener('input',function(){ outlineDepth=parseInt(dp.value,10)/100; dv.textContent=dp.value+'%'; });
  })();

  var guides=[], arcs=[], longbar=null;
  function build(){
    gMain.innerHTML=''; gPage.innerHTML=''; gGrid.innerHTML='';
    guides=[]; arcs=[];
    order.forEach(function(key,i){
      var ox=i*GAP;
      guides.push(gMain.appendChild(el('circle',{cx:ox,cy:0,r:R,fill:'none',stroke:'#1d1c19',
        'stroke-width':3,'stroke-dasharray':'1885','stroke-dashoffset':'1885',opacity:'0'})));
      arcRuns(key).forEach(function(run){
        var a0=run[0]*TAU/8, a1=(run[0]+run[1])*TAU/8;
        var node=gMain.appendChild(el('path',{d:arcD(ox,a0,a1),fill:'none',stroke:'#1d1c19',
          'stroke-width':W,'stroke-linecap':CAP}));
        var len=node.getTotalLength()||1;
        node.setAttribute('stroke-dasharray',len+' '+(len+2)); node.setAttribute('stroke-dashoffset',len);
        arcs.push({el:node,len:len});
      });
    });
    longbar=gMain.appendChild(el('path',{d:'M'+X0+' 0 L'+X1+' 0',fill:'none',stroke:'#1d1c19',
      'stroke-width':W,'stroke-linecap':CAP,'stroke-dasharray':MW+' '+(MW+2),'stroke-dashoffset':MW}));
    for(var y=Math.floor(VY/GAP)*GAP; y<VY+VH+GAP; y+=GAP)
      for(var x=Math.floor(VX/GAP)*GAP; x<VX+VW+GAP; x+=GAP)
        gGrid.appendChild(el('circle',{cx:x,cy:y,r:R,fill:'none',stroke:'#1d1c19','stroke-width':2,
          opacity:showGrid?'0.16':'0'}));
  }
  /* a dash pulled all the way back still paints its round cap as a dot at the path start: hide it instead */
  function dashTo(node,len,p){
    node.setAttribute('visibility', p<=0.0005 ? 'hidden' : 'visible');
    node.setAttribute('stroke-dashoffset',(len*(1-p)).toFixed(1));
  }
  /* ---- the build: scaffold fades out completely once the word stands ---- */
  var T_DOT=0.62, T_ARC=1.15, T_BAR=1.95, T_FADE=2.10, T_END=3.40;
  function drawBuild(e){
    var fade=clamp01((e-T_FADE)/0.75);
    guides.forEach(function(gg,i){
      var p=ease(clamp01((e-i*0.12)/0.70));
      dashTo(gg,1885,p);
      gg.setAttribute('opacity',(0.30*p*(1-fade)).toFixed(3));
    });
    var ap=ease(clamp01((e-T_ARC)/0.70));
    arcs.forEach(function(s){ dashTo(s.el,s.len,ap); });
    dashTo(longbar,MW,ease(clamp01((e-T_BAR)/1.30)));
  }
  /* ---- the unbuild, written forwards so each beat can be timed on its own ---- */
  var U_PAGE=2.10;
  function drawUnbuild(t){
    var bar   = ease(clamp01(t/0.80));                 /* bar retracts */
    var scafIn= ease(clamp01((t-0.30)/0.55));          /* scaffold returns */
    var arcOut= ease(clamp01((t-0.80)/0.60));          /* arcs retract */
    var close = ease(clamp01((t-1.35)/0.70));          /* circles close, last */
    dashTo(longbar,MW,1-bar);
    arcs.forEach(function(s){ dashTo(s.el,s.len,1-arcOut); });
    guides.forEach(function(gg){
      dashTo(gg,1885,1-close);
      gg.setAttribute('opacity',(0.30*scafIn*(1-close)).toFixed(3));
    });
  }

  /* ---- page on the lattice, every outline drawn like a letter ---- */
  var H=R;
  function su(v){return Math.ceil(v/H)*H;} function sd(v){return Math.floor(v/H)*H;}
  var PX0=su(VX+H), PX1=sd(VX+VW-H), PY0=su(VY+H), PY1=sd(VY+VH);
  var COLS=Math.round((PX1-PX0)/H), ROWS=Math.round((PY1-PY0)/H);
  function hx(c){return PX0+c*H;} function hy(r){return PY0+r*H;}
  function corner(x,y,w,h,r){
    return 'M'+(x+r)+' '+y+'H'+(x+w-r)+'A'+r+' '+r+' 0 0 1 '+(x+w)+' '+(y+r)+
           'V'+(y+h-r)+'A'+r+' '+r+' 0 0 1 '+(x+w-r)+' '+(y+h)+
           'H'+(x+r)+'A'+r+' '+r+' 0 0 1 '+x+' '+(y+h-r)+
           'V'+(y+r)+'A'+r+' '+r+' 0 0 1 '+(x+r)+' '+y+'Z';
  }
  function makePage(){
    gPage.innerHTML='';
    gPage.setAttribute('opacity','0.62');            /* on the group, so overlapping caps don't darken */
    var out=[], sw=W*0.72;
    function add(d,wmul){
      var probe=gPage.appendChild(el('path',{d:d,fill:'none'}));
      var len=probe.getTotalLength()||1, n=Math.max(2,Math.ceil(len/18)), pts=[];
      for(var i=0;i<=n;i++){ var q=probe.getPointAtLength(len*i/n); pts.push([q.x,q.y]); }
      gPage.removeChild(probe);
      out.push({pts:pts,len:len,base:sw*(wmul||1),draw:Ribbon(gPage)});
    }
    var split=Math.max(4,Math.round(COLS*0.58)); if(split%2) split-=1;
    var right=split+2, th=2, ty=Math.max(2,ROWS-th), midRow=Math.max(2,ty-1);
    add(corner(hx(0),hy(0),split*H,midRow*H,H));
    for(var i=1;i<midRow;i++) add('M'+hx(right)+' '+hy(i)+'H'+hx(i===midRow-1?COLS-3:COLS),0.7);
    var tw=Math.max(2,Math.floor((split-2)/2));
    add(corner(hx(0),hy(ty),tw*H,th*H,H));
    add(corner(hx(tw+2),hy(ty),tw*H,th*H,H));
    var bx=right+1, bw=Math.min(3,COLS-bx);
    add('M'+hx(bx)+' '+hy(ty)+'H'+hx(bx+bw)+'A'+H+' '+H+' 0 0 1 '+hx(bx+bw)+' '+hy(ty+th)+
        'H'+hx(bx)+'A'+H+' '+H+' 0 0 1 '+hx(bx)+' '+hy(ty)+'Z');
    return out;
  }
  /* each outline draws in like a letter, then keeps breathing: the weight field moves across the page */
  function drawPage(t, clock){
    if(!PAGE) return;
    function wm(x,y){ return breathAt(x,y,clock); }
    PAGE.forEach(function(n,i){
      var p=ease(clamp01((t-i*0.16)/(0.9+n.len/9000)));
      n.draw(ribbonD(n.pts,p,n.base,wm,n.len));
    });
  }
  var PAGE=null;

  var t0=0, pt0=0, phase='build', raf=null;
  function frame(now){
    if(!t0) t0=now;
    if(phase==='build'){ drawBuild((now-t0)/1000); }
    else {
      var pe=(now-pt0)/1000;
      drawUnbuild(pe);
      drawPage(pe-U_PAGE, pe);
      navT=Math.max(0, pe-U_PAGE);                    /* nav logo waits for the page, then builds with it */
    }
    raf=requestAnimationFrame(frame);
  }
  function trigger(){
    if(phase!=='build') return;
    drawBuild(T_END);                                   /* start the exit from a finished word */
    phase='exit'; pt0=performance.now();
    screen.setAttribute('data-entered','1');
    document.getElementById('p2').style.opacity='0';
    document.getElementById('pass2').style.opacity='0';
    PAGE=makePage();
    if(reduce){ drawPage(99,0); navT=99; drawUnbuild(99); }
  }
  function reset(){
    cancelAnimationFrame(raf); build(); PAGE=null; navT=-1;
    t0=0; pt0=0; phase='build';
    gMain.setAttribute('opacity','1');
    screen.setAttribute('data-entered','0');
    document.getElementById('p2').style.opacity='';
    document.getElementById('pass2').style.opacity='';
    paintBeats();
    if(reduce){ drawBuild(T_END); return; }
    raf=requestAnimationFrame(frame);
  }
  screen.addEventListener('click',trigger);
  document.getElementById('r2').addEventListener('click',reset);
  document.getElementById('e2').addEventListener('click',trigger);
  var gb=document.getElementById('g2');
  gb.addEventListener('click',function(){
    showGrid=!showGrid; gb.setAttribute('aria-pressed',showGrid?'true':'false');
    gb.textContent=showGrid?'Hide the grid':'Show the grid';
    [].forEach.call(gGrid.children,function(c){c.setAttribute('opacity',showGrid?'0.16':'0');});
  });
  reset();
})();
