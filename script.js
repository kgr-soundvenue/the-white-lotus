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
 * Helper: get the index of a slug in the pageOrder
 */
function getPageIndex(urlString) {
  return pageOrder.indexOf(urlString.replace(/^\/+|\/+$/g, ""));
}

/*****************************************************
 * 2) Minimal “resetWebflow”
 *    - re-init interactions
 *    - skip .w--current re-assignment (we handle that)
 *****************************************************/
function resetWebflow(data) {
  console.log("[resetWebflow] Re-initializing Webflow…");

  let dom = $(new DOMParser().parseFromString(data.next.html, "text/html")).find("html");
  $("html").attr("data-wf-page", dom.attr("data-wf-page"));

  // Re-init Webflow
  window.Webflow && window.Webflow.destroy();
  window.Webflow && window.Webflow.ready();
  window.Webflow && window.Webflow.require("ix2").init();

  // If desired, remove or comment out the .w--current logic
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
 *    .nav_wrapper for a given slug
 **************************************************************/
function setHighlight(tl, navWrapper, slug, highlightPadding = 8, animate = true) {
  console.log("[setHighlight] Called for slug:", slug, "on navWrapper:", navWrapper);

  // 1) Find the .nav-highlight & matching link in this .nav_wrapper
  const highlight = navWrapper.querySelector(".nav-highlight");
  const newLink   = navWrapper.querySelector(`.nav_menu_list .nav_menu_link[href="/${slug}"]`);

  console.log("[setHighlight] highlight found:", highlight);
  console.log("[setHighlight] newLink found for slug:", newLink);

  // If missing either highlight or link, skip
  if (!highlight || !newLink) {
    console.warn("[setHighlight] highlight or link NOT found -> skipping this nav.");
    return;
  }

  // 2) Mark the link as current
  newLink.classList.add("w--current");
  console.log("[setHighlight] Marked link as .w--current:", newLink);

  // 3) Measure bounding rectangles relative to .nav_wrapper
  const linkRect    = newLink.getBoundingClientRect();
  const wrapperRect = navWrapper.getBoundingClientRect();

  console.log("[setHighlight] linkRect:", linkRect);
  console.log("[setHighlight] wrapperRect:", wrapperRect);

  // Offsets
  const x = linkRect.left - wrapperRect.left - highlightPadding;
  const y = linkRect.top  - wrapperRect.top  - highlightPadding;
  const w = linkRect.width  + highlightPadding * 2;
  const h = linkRect.height + highlightPadding * 2;

  console.log("[setHighlight] computed x:", x, "y:", y, "width:", w, "height:", h);

  // 4) Either animate in GSAP timeline or just set immediately
  if (animate && tl) {
    console.log("[setHighlight] Animating highlight in timeline…");
    tl.to(
      highlight,
      {
        x,
        y,
        width:  w,
        height: h,
        duration: 1, // match your transition's duration
        ease: "power2.out",
      },
      0
    );
  } else {
    console.log("[setHighlight] Setting highlight (no animation).");
    gsap.set(highlight, { x, y, width: w, height: h });
  }
}

/*************************************************************
 * 4) animateHighlightToLink: loops over all .nav_wrappers
 *    to remove old .w--current and set/animate new highlight
 *************************************************************/
function animateHighlightToLink(tl, slug, highlightPadding = 8) {
  console.log("[animateHighlightToLink] Called with slug:", slug);

  // Remove old .w--current from all nav links (desktop + mobile)
  document.querySelectorAll(".w--current").forEach((el) => {
    el.classList.remove("w--current");
  });

  // For each .nav_wrapper, measure & animate highlight
  const wrappers = document.querySelectorAll(".nav_wrapper");
  console.log("[animateHighlightToLink] Found .nav_wrapper elements:", wrappers);

  wrappers.forEach((wrapper) => {
    setHighlight(tl, wrapper, slug, highlightPadding, true);
  });
}

/*******************************************
 * 5) Barba hooks: fix container positioning
 *    + re-init Webflow after transitions
 *******************************************/
barba.hooks.enter((data) => {
  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
  });
  console.log("[barba.hooks.enter] next.container fixed; old container remains until transition ends.");
});

barba.hooks.after((data) => {
  gsap.set(data.next.container, { position: "relative" });
  window.scrollTo(0, 0);

  console.log("[barba.hooks.after] Re-initializing Webflow…");
  resetWebflow(data);
});

/********************************************
 * 6) Barba transitions: slides left or right
 *    + animates the highlight link
 ********************************************/
barba.init({
  preventRunning: true,
  transitions: [
    {
      name: "directional-scroll",
      sync: true,

      // Decide direction based on pageOrder indices
      beforeLeave({ current, next }) {
        const fromIndex = getPageIndex(current.url.path);
        const toIndex   = getPageIndex(next.url.path);
        next.direction  = fromIndex < toIndex ? "right" : "left";
        console.log("[barba.beforeLeave] fromIndex:", fromIndex, "toIndex:", toIndex, "=> direction:", next.direction);
      },

      // We'll do nothing in leave(), we handle it in the timeline
      leave() {
        console.log("[barba.leave] Handling old container in the timeline…");
      },

      enter({ current, next }) {
        console.log("[barba.enter] Setting up container transitions…");
        const direction = next.direction;
        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

        // 1) Animate the old/new containers
        if (direction === "right") {
          console.log("[barba.enter] Slide old left, new from right.");
          tl.to(current.container, { x: "-100vw", duration: 2 }, 0);

          gsap.set(next.container, { x: "100vw", zIndex: 10 });
          tl.to(next.container, { x: 0, duration: 1.8 }, 0);
        } else {
          console.log("[barba.enter] Slide old right, new from left.");
          tl.to(current.container, { x: "100vw", duration: 2 }, 0);

          gsap.set(next.container, { x: "-100vw", zIndex: 10 });
          tl.to(next.container, { x: 0, duration: 1.8 }, 0);
        }

        // 2) Animate the highlight behind the new link
        const slug = next.url.path.replace(/^\/+|\/+$/g, "");
        console.log("[barba.enter] Animating highlight for slug:", slug);
        animateHighlightToLink(tl, slug, 8);

        // Return the timeline so Barba waits for it
        return tl;
      },
    },
  ],
});

/*************************************************************
 * 7) DOMContentLoaded: on first load, set highlight
 *    with no animation for each .nav_wrapper
 *************************************************************/
document.addEventListener("DOMContentLoaded", () => {
  const slug = window.location.pathname.replace(/^\/+|\/+$/g, "");
  console.log("[DOMContentLoaded] Setting highlight on first load; slug is:", slug);

  // Remove any .w--current
  document.querySelectorAll(".w--current").forEach((el) => {
    el.classList.remove("w--current");
  });

  // For each .nav_wrapper, just position the highlight (no animation)
  const wrappers = document.querySelectorAll(".nav_wrapper");
  console.log("[DOMContentLoaded] Found .nav_wrapper elements:", wrappers);

  wrappers.forEach((wrapper) => {
    console.log("[DOMContentLoaded] Setting highlight in nav wrapper:", wrapper);
    setHighlight(null, wrapper, slug, 8, false);
  });
});