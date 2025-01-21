/*************************************************
 * 1) Define page order for horizontal transitionss
 *************************************************/
const pageOrder = [
  "residents",
  "library",
  "meme-lounge",
  "poolside-pod",
  "gift-shop",
];

/** 
 * A helper to figure out the index of a given page slug
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
  let dom = $(new DOMParser().parseFromString(data.next.html, "text/html")).find("html");
  $("html").attr("data-wf-page", dom.attr("data-wf-page"));

  // Re-init Webflow
  window.Webflow && window.Webflow.destroy();
  window.Webflow && window.Webflow.ready();
  window.Webflow && window.Webflow.require("ix2").init();

  // If desired, remove or comment out the .w--current logic:
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
  // 1) Find the .nav-highlight & matching link in *this* .nav_wrapper
  const highlight = navWrapper.querySelector(".nav-highlight");
  const newLink   = navWrapper.querySelector(`.nav_menu_list .nav_menu_link[href="/${slug}"]`);

  // If missing either highlight or link, skip
  if (!highlight || !newLink) return;

  // 2) Mark the link as current
  newLink.classList.add("w--current");

  // 3) Measure bounding rectangles relative to .nav_wrapper
  const linkRect     = newLink.getBoundingClientRect();
  const wrapperRect  = navWrapper.getBoundingClientRect();
  
  const x = linkRect.left - wrapperRect.left - highlightPadding;
  const y = linkRect.top  - wrapperRect.top  - highlightPadding;
  const w = linkRect.width  + highlightPadding * 2;
  const h = linkRect.height + highlightPadding * 2;

  // 4) Either animate inside the GSAP timeline or just set immediately
  if (animate && tl) {
    tl.to(
      highlight,
      {
        x, 
        y,
        width:  w,
        height: h,
        duration: 1, // match your transition duration
        ease: "power2.out",
      },
      0
    );
  } else {
    // If no animation or no timeline, just set it
    gsap.set(highlight, { x, y, width: w, height: h });
  }
}

/*************************************************************
 * 4) animateHighlightToLink: loops over all .nav_wrappers
 *    to remove old .w--current and set/animate new highlight
 *************************************************************/
function animateHighlightToLink(tl, slug, highlightPadding = 8) {
  // Remove old .w--current from all nav links (desktop + mobile)
  document.querySelectorAll(".w--current").forEach((el) => el.classList.remove("w--current"));

  // For each .nav_wrapper, measure & animate the highlight
  document.querySelectorAll(".nav_wrapper").forEach((wrapper) => {
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
});
barba.hooks.after((data) => {
  gsap.set(data.next.container, { position: "relative" });
  window.scrollTo(0, 0);

  // Re-init Webflow
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
      },

      leave() {
        // We'll handle the old container in the timeline
      },

      enter({ current, next }) {
        const direction = next.direction;
        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

        // Animate old/new containers horizontally
        if (direction === "right") {
          // old slides left
          tl.to(current.container, { x: "-100vw", duration: 2 }, 0);
          // new slides in from right
          gsap.set(next.container, { x: "100vw", zIndex: 10 });
          tl.to(next.container, { x: 0, duration: 1.8 }, 0);
        } else {
          // old slides right
          tl.to(current.container, { x: "100vw", duration: 2 }, 0);
          // new slides in from left
          gsap.set(next.container, { x: "-100vw", zIndex: 10 });
          tl.to(next.container, { x: 0, duration: 1.8 }, 0);
        }

        // Animate highlight for the new link
        const slug = next.url.path.replace(/^\/+|\/+$/g, "");
        animateHighlightToLink(tl, slug, 8);

        return tl; // Return timeline so Barba waits for it
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

  // Remove any .w--current
  document.querySelectorAll(".w--current").forEach((el) => el.classList.remove("w--current"));

  // For each .nav_wrapper, just position the highlight (no animation)
  document.querySelectorAll(".nav_wrapper").forEach((wrapper) => {
    setHighlight(null, wrapper, slug, 8, false);
  });
});