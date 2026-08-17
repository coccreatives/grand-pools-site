(function () {
  var menuToggle = document.querySelector("[data-menu-toggle]");
  var closeButton = document.querySelector("[data-menu-close]");
  var overlay = document.querySelector("[data-nav-overlay]");

  if (!menuToggle || !overlay) return;

  function openMenu() {
    overlay.classList.add("is-open");
    menuToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    if (closeButton) closeButton.focus();
  }

  function closeMenu() {
    overlay.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    menuToggle.focus();
  }

  menuToggle.addEventListener("click", openMenu);
  if (closeButton) closeButton.addEventListener("click", closeMenu);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) {
      closeMenu();
    }
  });

  overlay.querySelectorAll(".nav-overlay__links a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });
})();

/* Scroll entrance animations — see .reveal / .reveal-group in style.css.
   Fires once per element, then stops observing it (motion-language skill,
   tier 2: entrances). Skips entirely under prefers-reduced-motion, where
   elements should just render in their resting state immediately. */
(function () {
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var targets = document.querySelectorAll(".reveal, .reveal-group > *");

  if (prefersReduced || !("IntersectionObserver" in window)) {
    targets.forEach(function (el) {
      el.classList.add("is-visible");
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  targets.forEach(function (el) {
    observer.observe(el);
  });
})();

/* Scroll-scrubbed process video — built with the scroll-scrub-video-section
   skill. Scroll position drives ONE eased timeline (currentP, 0..1) that in
   turn drives the video's currentTime, the segmented progress bar, and the
   step title/description — never from separate sources, or they drift out
   of sync. See the skill's SKILL.md for the reasoning behind each FIX below. */
(function () {
  var section = document.querySelector(".process-scrub");
  var wrap = document.getElementById("processScroll");
  var video = document.getElementById("processVideo");
  var bars = document.querySelectorAll("#processBars .process-scrub__seg-fill");
  var stepTitle = document.getElementById("processStepTitle");
  var stepText = document.getElementById("processStepText");
  var panel = document.querySelector(".process-scrub__panel");

  if (!section || !wrap || !video || !bars.length || !stepTitle || !stepText || !panel) return;

  /* EDIT ME: one entry per step; each owns an equal 1/4 slice of the video. */
  var STEPS = [
    {
      title: "Excavation",
      text: "The site is cleared and the pool cut to precise levels — the first line every later measurement follows.",
    },
    {
      title: "Steel & Plumbing",
      text: "Reinforcement is tied and plumbing set in place before a single litre of concrete is poured.",
    },
    {
      title: "Shotcrete & Shell",
      text: "The shell is shot in structural concrete, cured, and checked back against the original drawings.",
    },
    {
      title: "Finishing & Handover",
      text: "Coping, tiling and equipment installed, then filled, balanced, and handed over ready to use.",
    },
  ];

  var targetP = 0; // where the scroll says we should be (0..1)
  var currentP = 0; // eased playhead
  var duration = 0;
  var lastSetTime = -1;
  var stepIdx = 0;
  var swapT = null;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  video.addEventListener("loadedmetadata", function () {
    duration = video.duration;
    video.pause();
  });
  if (video.readyState === 0) video.load();

  /* FIX: mobile decode pipelines want one play() before allowing seeks */
  var primed = false;
  function prime() {
    if (primed) return;
    primed = true;
    var p = video.play();
    if (p && p.then) {
      p.then(function () {
        video.pause();
      }).catch(function () {});
    }
  }
  window.addEventListener("touchstart", prime, { once: true, passive: true });
  window.addEventListener("scroll", prime, { once: true, passive: true });

  /* No sticky pin, no extra scroll runway above the section — the wrapper
     is exactly 100vh (see style.css). Progress is driven by the section's
     own position as it scrolls through the viewport: 0 when its top edge
     touches the bottom of the screen (just entering), 1 when that same top
     edge reaches the top of the screen (fully scrolled past, one full
     section-height of scrolling later). Symmetric either direction, so
     scrolling back up naturally reverses it. */
  function readScroll() {
    var rect = wrap.getBoundingClientRect();
    var total = rect.height;
    if (total <= 0) return;
    var p = (window.innerHeight - rect.top) / total;
    targetP = Math.max(0, Math.min(1, p));
  }
  window.addEventListener("scroll", readScroll, { passive: true });
  window.addEventListener("resize", readScroll, { passive: true });
  readScroll();

  function applyStep(idx) {
    stepIdx = idx;
    panel.classList.add("is-step-swapping");
    section.classList.add("is-step-swapping");
    clearTimeout(swapT); // fast scrolling always lands on the latest step
    swapT = setTimeout(function () {
      stepTitle.textContent = STEPS[stepIdx].title;
      stepText.textContent = STEPS[stepIdx].text;
      panel.classList.remove("is-step-swapping");
      section.classList.remove("is-step-swapping");
    }, 200);
  }

  function frame() {
    currentP += (targetP - currentP) * 0.14; // easing: higher = snappier
    if (Math.abs(targetP - currentP) < 0.0005) currentP = targetP;

    /* FIX: duration race — loadedmetadata may fire before this listener
       attaches (cached video). Without this live read, the video sticks on
       its poster frame forever even though the bar/steps keep moving. */
    if (!duration && video.readyState >= 1 && !isNaN(video.duration) && video.duration > 0) {
      duration = video.duration;
    }

    /* video follows the timeline */
    if (duration && video.readyState >= 2) {
      var t = currentP * (duration - 0.05);
      if (Math.abs(t - lastSetTime) > 1 / 60) {
        // FIX: throttle seeks — setting currentTime every frame regardless causes jank
        video.currentTime = t;
        lastSetTime = t;
      }
    }

    /* progress bar follows the SAME timeline: each bar fills over its own 1/N slice */
    var n = bars.length;
    for (var i = 0; i < n; i++) {
      var frac = Math.max(0, Math.min(1, currentP * n - i));
      bars[i].style.width = frac * 100 + "%";
    }

    /* step copy follows the SAME timeline: N equal slices */
    var idx = Math.max(0, Math.min(STEPS.length - 1, Math.floor(currentP * STEPS.length)));
    if (idx !== stepIdx) applyStep(idx);

    requestAnimationFrame(frame);
  }

  if (reduceMotion) {
    /* Respect prefers-reduced-motion: show the resting first-step state and
       skip the scrubbing loop entirely rather than disabling only the CSS
       transitions (the whole effect is motion, not just its easing). Set the
       first segment's fill so its "01" reveals immediately in that state. */
    if (bars[0]) bars[0].style.width = "100%";
    return;
  }

  requestAnimationFrame(frame);
})();
