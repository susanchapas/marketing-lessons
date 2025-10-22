// Accessible JS for animations and interactions
// - Smooth scrolling for anchor links
// - Header becomes solid on scroll
// - Reveal on scroll for elements with .reveal
// - Scroll progress indicator
// - Slogan rotator
// - Year injection

(function(){
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Smooth anchor scrolling (keyboard & mouse)
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const href = a.getAttribute('href');
      if(href.length>1 && document.querySelector(href)){
        e.preventDefault();
        document.querySelector(href).scrollIntoView({behavior: prefersReduced? 'auto':'smooth'});
        // move focus for keyboard users
        setTimeout(()=>{document.querySelector(href).focus({preventScroll:true})}, prefersReduced?0:400);
      }
    });
  });

  // Header background toggle
  const header = document.getElementById('site-header');
  const hero = document.getElementById('hero');
  function updateHeader(){
    if(window.scrollY>hero.clientHeight-80){
      header.classList.add('solid');
    } else {
      header.classList.remove('solid');
    }
  }
  updateHeader();
  window.addEventListener('scroll', updateHeader, {passive:true});

  // Ensure hero video plays; if autoplay is blocked, try to play after first user interaction
  const heroVideo = document.querySelector('.hero-video');
  function tryPlayVideo(){
    if(!heroVideo) return;
    const p = heroVideo.play();
    if(p && p.then) p.catch(()=>{
      const onFirst = ()=>{ heroVideo.play().catch(()=>{}); window.removeEventListener('click', onFirst); window.removeEventListener('keydown', onFirst); };
      window.addEventListener('click', onFirst, {once:true});
      window.addEventListener('keydown', onFirst, {once:true});
    });
  }
  tryPlayVideo();

  // Fade-in on play, fade-out on end
  if(heroVideo){
    heroVideo.addEventListener('playing', ()=>{
      heroVideo.classList.add('play-visible');
      heroVideo.classList.remove('play-hidden');
    });

    heroVideo.addEventListener('ended', ()=>{
      // ensure video stays on last frame by pausing
      heroVideo.pause();
      videoCompleted = true;
      // Do NOT fade out on end — keep the final frame visible.
      heroVideo.classList.add('play-visible');
      heroVideo.classList.remove('play-hidden');
    });
  }

  // Reveal on scroll using IntersectionObserver
  const reveals = document.querySelectorAll('.reveal');
  if(!prefersReduced && 'IntersectionObserver' in window){
    const obs = new IntersectionObserver((entries,inst)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('visible');
          // if it's a card, add pop-in
          if(entry.target.classList.contains('card')) entry.target.classList.add('pop-in');
          inst.unobserve(entry.target);
        }
      })
    },{rootMargin:'0px 0px -10% 0px',threshold:0.08});
    reveals.forEach(r=>obs.observe(r));
  } else {
    // fallback: show all
    reveals.forEach(r=>{ r.classList.add('visible'); if(r.classList.contains('card')) r.classList.add('pop-in'); });
  }

  // Scroll progress
  const progress = document.getElementById('scroll-progress');
  function updateProgress(){
    const h = document.documentElement;
    const total = h.scrollHeight - h.clientHeight;
    const pct = total>0? (window.scrollY/total)*100:0;
    progress.style.width = pct + '%';
  }
  updateProgress();
  window.addEventListener('scroll', updateProgress, {passive:true});

  // Slogan rotator (CSS-driven classes for consistent timing)
  (function rotator(){
    const slogans = Array.from(document.querySelectorAll('.slogan-rotator .slogan'));
    if(!slogans.length) return;
    let idx = 0;
    // initialize
    slogans.forEach((s,i)=> s.classList.remove('active'));
    slogans[0].classList.add('active');
    if(prefersReduced) return; // don't animate

    const displayMs = 1800; // time each word stays visible
    const transitionMs = 420; // matches CSS
    const total = displayMs + transitionMs;

    setInterval(()=>{
      const current = slogans[idx];
      current.classList.remove('active');
      idx = (idx+1) % slogans.length;
      const next = slogans[idx];
      next.classList.add('active');
    }, total);
  })();

  // Video end handling: freeze on final frame and allow replay when scrolling back up
  let videoCompleted = false;
  if(heroVideo){
    // Require the user to have scrolled at least one viewport height before allowing replay.
    let hasScrolledOneViewport = false;

    window.addEventListener('scroll', ()=>{
      if(!heroVideo) return;
      // mark that user has scrolled down far enough at least once
      if(window.scrollY >= window.innerHeight) hasScrolledOneViewport = true;

      // when the user scrolls back up to near top, if the video finished and user previously scrolled down, replay
      if(window.scrollY < 120 && videoCompleted && hasScrolledOneViewport){
        try{
          heroVideo.currentTime = 0;
          // fade in before play
          heroVideo.classList.add('play-visible');
          heroVideo.classList.remove('play-hidden');
          heroVideo.play();
        }catch(e){}
        videoCompleted = false;
        // reset the gate until they scroll down again
        hasScrolledOneViewport = false;
      }
    }, {passive:true});
  }

  // Inject current year
  const year = document.getElementById('year');
  if(year) year.textContent = new Date().getFullYear();

  // Accessibility: ensure focusable sections
  document.querySelectorAll('main section').forEach(sec=>{
    sec.setAttribute('tabindex','-1');
  });

  // Simple A/B toggle for implementation variants
  (function implVariants(){
    const buttons = Array.from(document.querySelectorAll('.impl-variant-btn'));
    const callouts = Array.from(document.querySelectorAll('.impl-callout'));
    if(!buttons.length || !callouts.length) return;

    function setVariant(v){
      // persist
      try{ localStorage.setItem('implVariant', v); }catch(e){}
  buttons.forEach(b=> b.setAttribute('aria-pressed', b.dataset.variant===v ? 'true':'false'));
      // activate variants inside each callout
      callouts.forEach(c=>{
        // mark active to control display
        c.classList.add('active');
        Array.from(c.querySelectorAll('.variant')).forEach(el=>{
          el.style.display = el.dataset.variant===v ? 'block':'none';
        });
      });
    }

    buttons.forEach(b=> b.addEventListener('click', ()=> setVariant(b.dataset.variant)));

    // init
    const saved = (function(){try{return localStorage.getItem('implVariant')}catch(e){return null}})() || 'A';
    setVariant(saved);
  })();

})();
