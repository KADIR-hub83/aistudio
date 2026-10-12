(function(){
  var mqDesk=window.matchMedia('(min-width: 981px) and (hover: hover)');
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mega menu ---------- */
  var items=[].slice.call(document.querySelectorAll('.nav-item[data-panel]'));
  function setOpen(item,open){
    item.classList.toggle('open',open);
    var b=item.querySelector('.nav-btn'); b.setAttribute('aria-expanded',open?'true':'false');
    if(!open) item.removeAttribute('data-pinned');
  }
  function closeAll(except){items.forEach(function(i){if(i!==except)setOpen(i,false)})}
  items.forEach(function(item){
    var btn=item.querySelector('.nav-btn');
    btn.addEventListener('click',function(){
      var open=item.classList.contains('open');
      if(open&&item.getAttribute('data-pinned')==='1'){setOpen(item,false);return}
      closeAll(item); setOpen(item,true); item.setAttribute('data-pinned','1');
    });
    item.addEventListener('mouseenter',function(){
      if(!mqDesk.matches)return; closeAll(item); setOpen(item,true);
    });
    item.addEventListener('mouseleave',function(){
      if(!mqDesk.matches)return; if(item.getAttribute('data-pinned')!=='1')setOpen(item,false);
    });
  });
  document.addEventListener('click',function(e){
    if(!e.target.closest('.site-header'))closeAll(null);
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){
      var open=items.filter(function(i){return i.classList.contains('open')})[0];
      closeAll(null); if(open)open.querySelector('.nav-btn').focus();
      closeNav();
    }
  });
  var toggle=document.querySelector('.nav-toggle'), nav=document.getElementById('site-nav');
  function closeNav(){ if(nav&&nav.classList.contains('open')){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false')} }
  if(toggle) toggle.addEventListener('click',function(){
    var o=nav.classList.toggle('open'); toggle.setAttribute('aria-expanded',o?'true':'false');
  });

  /* ---------- Hero slider ---------- */
  var hero=document.querySelector('.hero');
  if(hero){
    var slides=[].slice.call(hero.querySelectorAll('.slide')), dots=[].slice.call(hero.querySelectorAll('.dot'));
    var count=hero.querySelector('.slide-count'), idx=0, timer=null, DUR=7000;
    hero.style.setProperty('--dur',(DUR/1000)+'s');
    function show(n){
      idx=(n+slides.length)%slides.length;
      slides.forEach(function(s,i){
        var a=i===idx; s.classList.toggle('is-active',a); s.setAttribute('aria-hidden',a?'false':'true');
        [].forEach.call(s.querySelectorAll('a,button'),function(el){el.tabIndex=a?0:-1});
      });
      dots.forEach(function(d,i){
        d.classList.remove('is-active'); void d.offsetWidth; d.classList.toggle('is-active',i===idx);
        d.setAttribute('aria-selected',i===idx?'true':'false');
      });
      if(count)count.textContent=('0'+(idx+1)).slice(-2)+' / '+('0'+slides.length).slice(-2);
    }
    function play(){ if(reduce)return; stop(); timer=setInterval(function(){show(idx+1)},DUR) }
    function stop(){ if(timer){clearInterval(timer);timer=null} }
    if(reduce)hero.classList.add('static');
    dots.forEach(function(d,i){d.addEventListener('click',function(){show(i);play()})});
    var prev=hero.querySelector('[data-prev]'), next=hero.querySelector('[data-next]');
    if(prev)prev.addEventListener('click',function(){show(idx-1);play()});
    if(next)next.addEventListener('click',function(){show(idx+1);play()});
    hero.addEventListener('mouseenter',function(){hero.classList.add('paused');stop()});
    hero.addEventListener('mouseleave',function(){hero.classList.remove('paused');show(idx);play()});
    hero.addEventListener('focusin',function(){hero.classList.add('paused');stop()});
    hero.addEventListener('focusout',function(){hero.classList.remove('paused');play()});
    show(0); play();

    /* neural network canvas */
    var cv=document.getElementById('net');
    if(cv&&cv.getContext){
      var ctx=cv.getContext('2d'), W=0,H=0,dpr=Math.min(window.devicePixelRatio||1,2), nodes=[], mouse={x:-999,y:-999};
      function size(){
        var r=hero.getBoundingClientRect(); W=r.width;H=r.height;
        cv.width=W*dpr;cv.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
        var n=Math.round(Math.min(90,Math.max(28,W*H/16000)));
        nodes=[]; for(var i=0;i<n;i++)nodes.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35,r:1+Math.random()*1.8,h:Math.random()});
        draw(true);
      }
      function col(h,a){ return h<.5?'rgba(49,214,255,'+a+')':(h<.85?'rgba(80,130,255,'+a+')':'rgba(232,114,255,'+a+')') }
      function draw(still){
        ctx.clearRect(0,0,W,H);
        for(var i=0;i<nodes.length;i++){
          var a=nodes[i];
          if(!still){a.x+=a.vx;a.y+=a.vy;if(a.x<0||a.x>W)a.vx*=-1;if(a.y<0||a.y>H)a.vy*=-1}
          for(var j=i+1;j<nodes.length;j++){
            var b=nodes[j],dx=a.x-b.x,dy=a.y-b.y,d=dx*dx+dy*dy;
            if(d<16000){ctx.strokeStyle=col(a.h,(1-d/16000)*.28);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
          }
          var mx=a.x-mouse.x,my=a.y-mouse.y,md=mx*mx+my*my,glow=md<22000?1-md/22000:0;
          ctx.fillStyle=col(a.h,.55+glow*.45);ctx.beginPath();ctx.arc(a.x,a.y,a.r+glow*2.2,0,6.283);ctx.fill();
        }
      }
      var raf, visible=true;
      function loop(){ if(visible)draw(false); raf=requestAnimationFrame(loop) }
      hero.addEventListener('mousemove',function(e){var r=hero.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top});
      hero.addEventListener('mouseleave',function(){mouse.x=mouse.y=-999});
      window.addEventListener('resize',size);
      if('IntersectionObserver' in window)new IntersectionObserver(function(en){visible=en[0].isIntersecting}).observe(hero);
      size(); if(!reduce)loop();
    }
  }

  /* ---------- Workshop tabs ---------- */
  var tabs=[].slice.call(document.querySelectorAll('.ws-tab'));
  if(tabs.length){
    function pick(t){
      tabs.forEach(function(x){var on=x===t;x.setAttribute('aria-selected',on?'true':'false');x.tabIndex=on?0:-1;
        document.getElementById(x.getAttribute('aria-controls')).hidden=!on});
    }
    tabs.forEach(function(t,i){
      t.addEventListener('click',function(){pick(t)});
      t.addEventListener('keydown',function(e){
        var n=null; if(e.key==='ArrowDown'||e.key==='ArrowRight')n=tabs[(i+1)%tabs.length];
        if(e.key==='ArrowUp'||e.key==='ArrowLeft')n=tabs[(i-1+tabs.length)%tabs.length];
        if(n){e.preventDefault();pick(n);n.focus()}
      });
    });
  }

/* Seamless infinite talent-card animation */
document.querySelectorAll(".hero-role-wall .role-track").forEach((track) => {
  if (track.dataset.duplicated === "true") return;

  const originalCards = Array.from(track.children);

  originalCards.forEach((card) => {
    const clone = card.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    track.appendChild(clone);
  });

  track.dataset.duplicated = "true";
});


  /* ---------- Submit Request form ---------- */
  var form=document.getElementById('req-form');
  if(form){
    var areas=JSON.parse(document.getElementById('area-data').textContent);
    var type=document.getElementById('f-type'), area=document.getElementById('f-area');
    function fillAreas(){
      var list=areas[type.value]||[]; area.innerHTML='';
      var o=document.createElement('option'); o.value='';o.textContent=list.length?'Select an area or program':'Not applicable'; area.appendChild(o);
      list.forEach(function(a){var p=document.createElement('option');p.value=a;p.textContent=a;area.appendChild(p)});
      area.disabled=!list.length;
    }
    type.addEventListener('change',fillAreas); fillAreas();
    function check(el){
      var f=el.closest('.field'); var v=el.value.trim(); var bad=false;
      if(el.required&&!v)bad=true;
      if(el.type==='email'&&v&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))bad=true;
      f.classList.toggle('bad',bad); el.setAttribute('aria-invalid',bad?'true':'false'); return !bad;
    }
    [].forEach.call(form.querySelectorAll('input,select,textarea'),function(el){el.addEventListener('blur',function(){check(el)})});
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var ok=true,first=null;
      [].forEach.call(form.querySelectorAll('input,select,textarea'),function(el){if(!check(el)){ok=false;if(!first)first=el}});
      if(!ok){first.focus();return}
      var s=document.getElementById('done-summary');
      s.textContent=document.getElementById('f-name').value.trim()+' · '+type.options[type.selectedIndex].text+(area.value?' · '+area.value:'');
      document.getElementById('done').classList.add('show');
      document.getElementById('done').scrollIntoView({behavior:reduce?'auto':'smooth',block:'nearest'});
    });
  }
})();
