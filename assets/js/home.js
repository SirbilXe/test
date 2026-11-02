// Home: scrubs the dive footage with page scroll, one resting frame per chapter
(function () {
  const video = document.querySelector('.am-video');
  const poster = document.querySelector('.am-poster');
  const load = document.querySelector('.am-load');
  const loadPct = load && load.querySelector('.pct');
  const secs = Array.from(document.querySelectorAll('[data-ch]'));
  const dots = Array.from(document.querySelectorAll('.am-dot'));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Clip seconds where each chapter rests: boat deck, descent, group with instructor, reef glide, blue water, reef wall
  const K = [0.0, 3.0, 9.6, 12.0, 16.0, 22.0, 32.3, 47.9];
  let cur = K[0];
  let last = performance.now();
  let chapter = -1;

  // chapter rail + header links scroll to their section
  dots.forEach((dot) => dot.addEventListener('click', () => {
    const sec = document.querySelector('[data-ch="' + dot.dataset.go + '"]');
    if (sec) window.scrollTo({ top: sec.offsetTop, behavior: reduced ? 'auto' : 'smooth' });
  }));

  // Load the whole clip into memory first so every scroll seek is instant
  const src = video.dataset.src;
  const RETRIES = 1;
  const ready = () => { video.classList.add('ready'); if (load) load.hidden = true; };
  // last resort: stream the file; seeks are then limited to what the server lets the browser reach
  const useDirect = () => { video.src = src; video.load(); };
  video.muted = true;
  video.addEventListener('loadeddata', ready);

  const download = (attempt) => fetch(src, { cache: attempt ? 'reload' : 'default' }).then((res) => {
    if (!res.ok || !res.body) throw new Error('HTTP ' + res.status);
    const total = Number(res.headers.get('content-length')) || 0;
    const reader = res.body.getReader();
    const chunks = [];
    let got = 0;
    const pump = () => reader.read().then(({ done, value }) => {
      if (done) {
        video.src = URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }));
        video.load();
        return;
      }
      chunks.push(value);
      got += value.length;
      if (total && loadPct) loadPct.textContent = Math.min(99, Math.round(got / total * 100));
      return pump();
    });
    return pump();
  }).catch(() => {
    // a dropped connection mid-download is the usual cause: try once more from scratch
    if (attempt < RETRIES) {
      if (loadPct) loadPct.textContent = 0;
      return new Promise((r) => setTimeout(r, 500)).then(() => download(attempt + 1));
    }
    useDirect();
  });
  download(0);

  // clamp a time into the seekable range nearest to it; null when nothing is seekable yet
  const reachable = (t) => {
    const s = video.seekable;
    let best = null;
    for (let i = 0; i < s.length; i++) {
      const c = Math.min(s.end(i), Math.max(s.start(i), t));
      if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c;
    }
    return best;
  };
  let asked = -1; // last time we seeked to, so a seek the browser can't honour is never repeated

  // scroll position as a fractional chapter index
  const progress = () => {
    const st = window.scrollY;
    let i = 0;
    for (let k = 1; k < secs.length; k++) if (st >= secs[k].offsetTop - 1) i = k;
    if (i >= secs.length - 1) return secs.length - 1;
    const a = secs[i].offsetTop;
    const b = secs[i + 1].offsetTop;
    return i + Math.min(1, Math.max(0, (st - a) / Math.max(1, b - a)));
  };

  const timeAt = (p) => {
    const i = Math.min(K.length - 2, Math.max(0, Math.floor(p)));
    let u = Math.min(1, Math.max(0, p - i));
    u = u * u * u * (u * (u * 6 - 15) + 10); // smootherstep
    return K[i] + (K[i + 1] - K[i]) * u;
  };

  const setChapter = (ch) => {
    if (ch === chapter) return;
    chapter = ch;
    secs.forEach((s, i) => s.classList.toggle('on', i === ch));
    dots.forEach((d, i) => d.classList.toggle('on', i === ch));
  };

  // keep chapter state in step with scroll even when animation frames are throttled
  const syncChapter = () => setChapter(Math.min(secs.length - 1, Math.max(0, Math.round(progress()))));
  window.addEventListener('scroll', syncChapter, { passive: true });
  syncChapter();

  const frame = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const p = progress();
    const k = 1 - Math.exp(-dt * (reduced ? 10 : 3.2));
    cur += (timeAt(p) - cur) * k;
    if (video.readyState >= 1 && !video.seeking) {
      const t = reachable(Math.max(0, Math.min((video.duration || 50) - 0.05, cur)));
      if (t !== null && Math.abs(video.currentTime - t) > 0.03 && Math.abs(asked - t) > 0.03) {
        asked = t;
        try { video.currentTime = t; } catch (err) {}
      }
    }
    // slow push-in that resets toward each chapter, for a camera-move feel
    const zoom = reduced ? 1.04 : 1.04 + 0.05 * Math.sin((p - Math.floor(p)) * Math.PI);
    const tf = 'scale(' + zoom.toFixed(4) + ')';
    video.style.transform = tf;
    poster.style.transform = tf;
    setChapter(Math.min(secs.length - 1, Math.max(0, Math.round(p))));
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})();
