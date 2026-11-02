// Sub-page hero: cross-fading slideshow with a slow push-in (Ken Burns)
(function () {
  const slides = Array.from(document.querySelectorAll('.lm-slide'));
  if (slides.length < 2) { if (slides[0]) slides[0].classList.add('on'); return; }

  const INTERVAL = 6500;
  let cur = 0;
  let prev = -1;

  const paint = () => slides.forEach((el, i) => {
    el.classList.toggle('on', i === cur);
    el.classList.toggle('out', i === prev);
  });

  // let the first frame render un-zoomed before the first transition starts
  setTimeout(() => {
    paint();
    setInterval(() => { prev = cur; cur = (cur + 1) % slides.length; paint(); }, INTERVAL);
  }, 60);
})();
