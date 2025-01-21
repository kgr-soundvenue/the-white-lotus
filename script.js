/*************************************************
 * 1) Define page order for horizontal transitions
 *************************************************/
const pageOrder = [
  "residents",
  "library",
  "meme-lounge",
  "poolside-pod",
  "gift-shop",
];

/**
 * Helper: Get the index of a slug in the pageOrder.
 */
function getPageIndex(urlString) {
  return pageOrder.indexOf(urlString.replace(/^\/+|\/+$/g, ""));
}

/*****************************************************
 * 2) Minimal "resetWebflow"
 *    - re-init interactions
 *    - skip .w--current re-assignment (we handle that)
 *****************************************************/
function resetWebflow(data) {
  let dom = $(new DOMParser().parseFromString(data.next.html, "text/html")).find("html");
  $("html").attr("data-wf-page", dom.attr("data-wf-page"));

  // Re-init Webflow
  window.Webflow && window.Webflow.destroy();
  window.Webflow && window.Webflow.ready();
  window.Webflow && window.Webflow.require("ix2").init();

  // (Optional) Remove .w--current logic
  // $(".w--current").removeClass("w--current");
  // $("a").each(function () {
  //   if ($(this).attr("href") === window.location.pathname) {
  //     $(this).addClass("w--current");
  //   }
  // });

  // Re-inject scripts
  dom.find("[data-barba-script]").each(function () {
    let codeString = $(this).text();
    if (codeString.includes("DOMContentLoaded")) {
      let newCodeString = codeString.replace(
        /window\.addEventListener\("DOMContentLoaded",\s*\(\s*event\s*\)\s*=>\s*{\s*/,
        ""
      );
      codeString = newCodeString.replace(/\s*}\s*\);\s*$/, "");
    }
    let script = document.createElement("script");
    script.type = "text/javascript";
    if ($(this).attr("src")) script.src = $(this).attr("src");
    script.text = codeString;
    document.body.appendChild(script).remove();
  });
}

/**************************************************************
 * 3) setHighlight: measure & set/animate the highlight in one
 *    .nav_menu_wrap for a given slug
 **************************************************************/
function setHighlight(tl, navWrap, slug, highlightPadding = 8, animate = true) {
  // 1) Find .nav-highlight & matching link in *this* nav_wrap
  const highlight = navWrap.querySelector(".nav-highlight");
  const newLink   = navWrap.querySelector(`.nav_menu_list .nav_menu_link[href="/${slug}"]`);
  if (!highlight || !newLink) return;

  // 2) Mark link as current
  newLink.classList.add("w--current");

  // 3) Measure bounding rects relative to .nav_menu_wrap
  const linkRect = newLink.getBoundingClientRect();
  const wrapRect = navWrap.getBoundingClientRect();
  
  const x = linkRect.left - wrapRect.left - highlightPadding;
  const y = linkRect.top  - wrapRect.top  - highlightPadding;
  const w = linkRect.width  + highlightPadding * 2;
  const h = linkRect.height + highlightPadding * 2;

  // 4) Animate or set
  if (animate && tl) {
    tl.to(highlight, {
      x, y,
      width: w,
      height: h,
      duration: 1, // adjust as needed
      ease: "power2.out"
    }, 0);
  } else {
    gsap.set(highlight, { x, y, width: w, height: h });
  }
}

/*************************************************************
 * 4) animateHighlightToLink
 *    Removes old .w--current + animates highlight
 *************************************************************/
function animateHighlightToLink(tl, slug, highlightPadding = 8) {
  // Remove old .w--current
  document.querySelectorAll(".w--current").forEach(el => el.classList.remove("w--current"));

  // For each .nav_menu_wrap, set or animate
  document.querySelectorAll(".nav_menu_wrap").forEach(navWrap => {
    setHighlight(tl, navWrap, slug, highlightPadding, true);
  });
}

/*******************************************
 * 5) Barba Hooks
 *******************************************/
barba.hooks.enter((data) => {
  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
  });
});

barba.hooks.after((data) => {
  gsap.set(data.next.container, { position: "relative" });
  window.scrollTo(0, 0);
  resetWebflow(data);
});

/********************************************
 * 6) Barba Transitions
 ********************************************/
barba.init({
  preventRunning: true,
  transitions: [
    {
      name: "directional-scroll",
      sync: true,

      // Decide direction
      beforeLeave({ current, next }) {
        const fromIndex = getPageIndex(current.url.path);
        const toIndex   = getPageIndex(next.url.path);
        next.direction  = fromIndex < toIndex ? "right" : "left";
      },

      leave() {
        // We'll handle old container in timeline
      },

      enter({ current, next }) {
        const direction = next.direction;
        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

        // Slide old/new containers
        if (direction === "right") {
          tl.to(current.container, { x: "-100vw", duration: 2 }, 0);
          gsap.set(next.container, { x: "100vw", zIndex: 10 });
          tl.to(next.container, { x: 0, duration: 1.8 }, 0);
        } else {
          tl.to(current.container, { x: "100vw", duration: 2 }, 0);
          gsap.set(next.container, { x: "-100vw", zIndex: 10 });
          tl.to(next.container, { x: 0, duration: 1.8 }, 0);
        }

        // Animate highlight for next slug
        const slug = next.url.path.replace(/^\/+|\/+$/g, "");
        animateHighlightToLink(tl, slug, 8);

        return tl; // Return timeline so Barba waits for it
      }
    }
  ]
});

/*************************************************************
 * 7) DOMContentLoaded
 *    - Desktop nav highlight set immediately (if visible)
 *    - Mobile nav highlight set only after user opens menu
 *************************************************************/
document.addEventListener("DOMContentLoaded", () => {
  const slug = window.location.pathname.replace(/^\/+|\/+$/g, "");

  // Remove any old .w--current
  document.querySelectorAll(".w--current").forEach(el => el.classList.remove("w--current"));

  // 7a) Immediately highlight the "desktop" nav (if that's visible)
  document.querySelectorAll(".nav_menu_wrap.is-desktop").forEach(navWrap => {
    setHighlight(null, navWrap, slug, 8, false);
  });

  // 7b) On mobile menu button click, set highlight
  const mobileButton = document.querySelector(".nav_btn_wrap");
  if (mobileButton) {
    mobileButton.addEventListener("click", () => {
      // Your code that reveals the mobile nav goes here.
      // Then measure & place highlight after it's visible:
      const mobileNavWrap = document.querySelector(".nav_menu_wrap.is-mobile");
      if (mobileNavWrap) {
        // Might need a short delay if there's an open animation
        setTimeout(() => {
          setHighlight(null, mobileNavWrap, slug, 8, false);
        }, 50);
      }
    });
  }
});