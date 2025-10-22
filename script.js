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

  // Mobile nav toggle (hamburger)
  (function mobileNav(){
    const navToggle = document.querySelector('.nav-toggle');
    const primaryNav = document.getElementById('primary-nav');
    if(!navToggle || !primaryNav) return;

    function open(){ navToggle.setAttribute('aria-expanded','true'); primaryNav.setAttribute('data-open','true'); }
    function close(){ navToggle.setAttribute('aria-expanded','false'); primaryNav.setAttribute('data-open','false'); }

    navToggle.addEventListener('click', (e)=>{
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      if(isOpen) close(); else open();
    });

    // close on outside click
    document.addEventListener('click', (e)=>{
      if(!primaryNav.contains(e.target) && !navToggle.contains(e.target)) close();
    });

    // close on Escape
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') close(); });
  })();

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

  // Ensure fresh loads without a hash land at the top (hero).
  // Prevents browsers from restoring a previous scroll position on refresh/back
  // while preserving normal anchor/hash behavior and back/forward navigation.
  window.addEventListener('load', ()=>{
    try{ if('scrollRestoration' in history) history.scrollRestoration = 'manual'; }catch(e){}
    if(!location.hash){
      // Try to detect back/forward navigations and avoid overriding them
      let navType = null;
      try{
        const entries = performance.getEntriesByType && performance.getEntriesByType('navigation');
        navType = entries && entries[0] && entries[0].type ? entries[0].type : (performance && performance.navigation ? performance.navigation.type : null);
      }catch(e){}
      // If not a back/forward navigation, scroll to top on initial load
      if(navType !== 'back_forward'){
        window.scrollTo({top:0,left:0,behavior: prefersReduced? 'auto':'auto'});
      }
    }
  });

  // Accessibility: ensure focusable sections
  document.querySelectorAll('main section').forEach(sec=>{
    sec.setAttribute('tabindex','-1');
  });

  // immediate snap behavior removed per user request

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

  // Footer research sources dropdown behavior
  (function sourcesDropdown(){
    const btn = document.querySelector('.sources-btn');
    const dropdown = document.querySelector('.sources-dropdown');
    const list = document.querySelector('.sources-list');
    if(!btn || !dropdown || !list) return;

    function open(){
      dropdown.classList.add('open');
      btn.setAttribute('aria-expanded','true');
      list.hidden = false;
    }
    function close(){
      dropdown.classList.remove('open');
      btn.setAttribute('aria-expanded','false');
      list.hidden = true;
    }

    btn.addEventListener('click', (e)=>{
      if(dropdown.classList.contains('open')) close(); else open();
    });

    // close on outside click
    document.addEventListener('click', (e)=>{
      if(!dropdown.contains(e.target)) close();
    });

    // close on Escape
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') close(); });
  })();

  // Focus trap + mobile accordion for sources dropdown
  (function sourcesFocusTrap(){
    const btn = document.querySelector('.sources-btn');
    const dropdown = document.querySelector('.sources-dropdown');
    const list = document.querySelector('.sources-list');
    if(!btn || !dropdown || !list) return;

    // helper: get focusable elements inside list
    function focusableElements(container){
      return Array.from(container.querySelectorAll('a, button, [tabindex]')).filter(el=>!el.hasAttribute('disabled'));
    }

    function trap(e){
      if(!dropdown.classList.contains('open')) return;
      const focusables = focusableElements(dropdown);
      if(!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length-1];

      if(e.key === 'Tab'){
        if(e.shiftKey && document.activeElement === first){
          e.preventDefault(); last.focus();
        } else if(!e.shiftKey && document.activeElement === last){
          e.preventDefault(); first.focus();
        }
      }
    }

    // when opening, focus first link and enable trap; when closing, restore focus to button
    let wasOpen = dropdown.classList.contains('open');
    const observer = new MutationObserver(()=>{
      const isOpen = dropdown.classList.contains('open');
      if(isOpen && !wasOpen){
        // just opened
        const focusables = focusableElements(dropdown);
        if(focusables.length) focusables[0].focus();
        document.addEventListener('keydown', trap);
      } else if(!isOpen && wasOpen){
        // just closed
        document.removeEventListener('keydown', trap);
        // Only restore focus to the button if focus is still inside the dropdown
        // (e.g., user pressed Escape). If the user clicked outside, leave focus
        // where the click occurred to avoid jumping to the footer.
        try{
          const active = document.activeElement;
          if(dropdown.contains(active) || active === document.body || active === null){
            btn.focus();
          }
        }catch(e){}
      }
      wasOpen = isOpen;
    });
    observer.observe(dropdown, {attributes:true, attributeFilter:['class']});

    // Mobile: accordion behavior — toggle expanded state per item on small screens
    function enableAccordion(){
      if(window.innerWidth > 480){
        dropdown.classList.remove('accordion');
        // ensure all items are visible normally
        Array.from(list.querySelectorAll('li')).forEach(li=> li.removeAttribute('aria-expanded'));
        return;
      }
      dropdown.classList.add('accordion');
      Array.from(list.querySelectorAll('li')).forEach((li)=>{
        const link = li.querySelector('a');
        if(!link) return;
        li.setAttribute('role','button');
        li.setAttribute('tabindex','0');
        // click or key activates toggle
        function toggle(){ li.classList.toggle('expanded'); li.setAttribute('aria-expanded', li.classList.contains('expanded')?'true':'false'); }
        li.addEventListener('click', (e)=>{ if(e.target.tagName.toLowerCase() === 'a') return; toggle(); });
        li.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
      });
    }

    // initialize and on resize
    enableAccordion();
    window.addEventListener('resize', enableAccordion, {passive:true});
  })();

  // Swatch copy-to-clipboard and live announcement
  (function swatchCopy(){
    const live = document.getElementById('clipboard-live');
    const buttons = Array.from(document.querySelectorAll('.copy-hex'));
    if(!buttons.length) return;

    function announce(msg){ if(live) live.textContent = msg; }

    buttons.forEach(btn=>{
      btn.addEventListener('click', async (e)=>{
        const hex = btn.dataset.hex;
        try{
          if(navigator.clipboard && navigator.clipboard.writeText){
            await navigator.clipboard.writeText(hex);
          } else {
            // fallback: execCommand
            const ta = document.createElement('textarea'); ta.value = hex; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
          }
          announce(`${hex} copied to clipboard`);
        }catch(err){ announce('Unable to copy color'); }
      });
      // keyboard activation for accessibility
      btn.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); } });
    });
  })();

  // Trait description click-to-toggle for touch devices: toggle .expanded on click
  (function traitToggles(){
    const traits = Array.from(document.querySelectorAll('.trait'));
    if(!traits.length) return;
    traits.forEach(t=>{
      t.addEventListener('click', (e)=>{
        // if click is on a link inside trait, ignore
        if(e.target && (e.target.tagName.toLowerCase() === 'a' || e.target.closest('a'))) return;
        t.classList.toggle('expanded');
      });
      // ensure keyboard users can use Enter/Space
      t.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t.classList.toggle('expanded'); } });
    });
  })();

  // Ticker setup: ensure each ticker-track is long enough for a seamless -50% loop
  (function tickerSetup(){
    if(typeof window === 'undefined') return;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduced) return; // don't animate or measure when reduced motion is requested

    const tracks = Array.from(document.querySelectorAll('.ticker-layer .ticker-track'));
    if(!tracks.length) return;

    function fillTracks(){
      const pxPerSec = 80; // visual speed in pixels per second (changeable)
      tracks.forEach(track=>{
        // cancel any previous WA animation
        try{ if(track._tickerAnim) track._tickerAnim.cancel(); }catch(e){}

        const parent = track.parentElement || track;
        const parentWidth = parent.clientWidth || document.documentElement.clientWidth || window.innerWidth;

        // store original markup so we can rebuild on resize without infinite cloning
        if(!track.dataset.orig){
          // try to detect a doubled sequence and store the minimal base unit
          const children = Array.from(track.children);
          if(children.length > 1 && children.length % 2 === 0){
            const half = children.length / 2;
            const first = children.slice(0, half).map(n => n.outerHTML).join('');
            const second = children.slice(half).map(n => n.outerHTML).join('');
            track.dataset.orig = (first === second) ? first : track.innerHTML;
          } else {
            track.dataset.orig = track.innerHTML;
          }
        }
        // restore canonical original (non-duplicated) before duplicating
        track.innerHTML = track.dataset.orig;

        // duplicate content until track.scrollWidth >= parentWidth * 2 (required for translateX(-50%) seamless loop)
        let guard = 0;
        while(track.scrollWidth < parentWidth * 2 && guard < 60){
          const items = Array.from(track.children).map(n => n.cloneNode(true));
          items.forEach(i => track.appendChild(i));
          guard++;
        }
        track.dataset.filled = 'true';

        // disable any CSS animation on the track so WA controls the transform
        track.style.animation = 'none';

        // compute pixel distance to move (half the track width)
        const distance = Math.round(track.scrollWidth / 2);
        // compute duration so all tracks move at same px/sec speed
        const duration = Math.max(4000, Math.round((distance / pxPerSec) * 1000));

        // create web animation for a seamless loop: translateX(0) -> translateX(-distance px)
        try{
          track._tickerAnim = track.animate([
            { transform: 'translateX(0px)' },
            { transform: `translateX(-${distance}px)` }
          ], { duration: duration, iterations: Infinity, easing: 'linear' });
        }catch(e){
          // fallback: set CSS animation duration proportionally
          track.style.animationDuration = (duration/1000) + 's';
        }
      });
    }

    // debounce helper
    function debounce(fn, wait){ let t; return function(){ clearTimeout(t); t = setTimeout(fn, wait); }; }

    // run on load and resize
    window.addEventListener('load', fillTracks);
    window.addEventListener('resize', debounce(fillTracks, 140));
    // run once now in case content is ready
    fillTracks();
  })();

})();
