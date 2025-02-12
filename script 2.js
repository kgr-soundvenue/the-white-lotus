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
 * A helper to get the page index for a given slug.
 */
function getPageIndex(urlString) {
  // Trim leading/trailing slashes and find the index in pageOrder
  return pageOrder.indexOf(urlString.replace(/^\/+|\/+$/g, ""));
}

/*****************************************************
 * 2) Minimal “resetWebflow”
 *    - re-init interactions
 *    - skip .w--current re-assignment (we handle that)
 *****************************************************/
function resetWebflow(data) {
  // Convert the next page's HTML to a DOM, grab its <html> node
  let dom = $(new DOMParser()
    .parseFromString(data.next.html, "text/html"))
    .find("html");

  // Sync the data-wf-page
  $("html").attr("data-wf-page", dom.attr("data-wf-page"));

  // Re-init Webflow
  if (window.Webflow) {
    window.Webflow.destroy();
    window.Webflow.ready();
    window.Webflow.require("ix2").init();
  }

  // Optionally re-inject scripts
  dom.find("[data-barba-script]").each(function () {
    let codeString = $(this).text();

    // Strip out any extra DOMContentLoaded wrapper if present
    if (codeString.includes("DOMContentLoaded")) {
      codeString = codeString.replace(
        /window\.addEventListener\("DOMContentLoaded".*?\{\s*/,
        ""
      ).replace(/\s*\}\)\s*;\s*$/, "");
    }

    // Create a script in the document
    let script = document.createElement("script");
    script.type = "text/javascript";
    if ($(this).attr("src")) {
      script.src = $(this).attr("src");
    }
    script.text = codeString;
    document.body.appendChild(script).remove();
  });
}

/**************************************************************
 * 3) setHighlight: measure & set/animate the highlight in one
 *    .nav_menu_wrap for a given slug
 **************************************************************/
function setHighlight(tl, navWrap, slug, highlightPadding = 8, animate = true) {
  // 1) Find the highlight & matching link in *this* navWrap
  const highlight = navWrap.querySelector(".nav-highlight");
  const newLink   = navWrap.querySelector(`.nav_menu_list .nav_menu_link[href="/${slug}"]`);

  // If missing either highlight or link, skip
  if (!highlight || !newLink) return;

  // 2) Mark the link as current
  newLink.classList.add("w--current");

  // 3) Measure bounding rectangles (relative to the .nav_menu_wrap)
  const linkRect = newLink.getBoundingClientRect();
  const wrapRect = navWrap.getBoundingClientRect();

  const x = linkRect.left - wrapRect.left - highlightPadding;
  const y = linkRect.top  - wrapRect.top  - highlightPadding;
  const w = linkRect.width  + highlightPadding * 2;
  const h = linkRect.height + highlightPadding * 2;

  // 4) Either animate inside GSAP timeline or just set immediately
  if (animate && tl) {
    tl.to(
      highlight,
      {
        x,
        y,
        width: w,
        height: h,
        duration: 1,     // Adjust to match your transition duration
        ease: "power2.out",
      },
      0
    );
  } else {
    // If no animation or no timeline, just place it
    gsap.set(highlight, { x, y, width: w, height: h });
  }
}

/*************************************************************
 * 4) animateHighlightToLink: loops over all .nav_menu_wraps
 *    to remove old .w--current and set/animate new highlight
 *************************************************************/
function animateHighlightToLink(tl, slug, highlightPadding = 8) {
  // Remove old .w--current from all nav links (desktop + mobile)
  document
    .querySelectorAll(".w--current")
    .forEach(el => el.classList.remove("w--current"));

  // For each .nav_menu_wrap, measure & animate highlight
  document
    .querySelectorAll(".nav_menu_wrap")
    .forEach(navWrap => {
      setHighlight(tl, navWrap, slug, highlightPadding, true);
    });
}

/*******************************************
 * 5) Barba hooks: fix container positioning
 *    + re-init Webflow after transitions
 *******************************************/
barba.hooks.enter(data => {
  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
  });
});

barba.hooks.after(data => {
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
          // Old slides left
          tl.to(current.container, { x: "-100vw", duration: 2 }, 0);

          // New slides in from right
          gsap.set(next.container, { x: "100vw", zIndex: 10 });
          tl.to(next.container, { x: 0, duration: 1.8 }, 0);
        } else {
          // Old slides right
          tl.to(current.container, { x: "100vw", duration: 2 }, 0);

          // New slides in from left
          gsap.set(next.container, { x: "-100vw", zIndex: 10 });
          tl.to(next.container, { x: 0, duration: 1.8 }, 0);
        }

        // Animate highlight for the new link
        const slug = next.url.path.replace(/^\/+|\/+$/g, "");
        animateHighlightToLink(tl, slug, 8);

        // Return the timeline so Barba waits for it
        return tl;
      },
    },
  ],
});

/*************************************************************
 * 7) DOMContentLoaded: on first load, set highlight
 *    with no animation for each .nav_menu_wrap
 *************************************************************/
document.addEventListener("DOMContentLoaded", () => {
  const slug = window.location.pathname.replace(/^\/+|\/+$/g, "");

  // Remove old .w--current
  document
    .querySelectorAll(".w--current")
    .forEach(el => el.classList.remove("w--current"));

  // For each nav wrapper, just set highlight (no animation)
  document
    .querySelectorAll(".nav_menu_wrap")
    .forEach(navWrap => {
      setHighlight(null, navWrap, slug, 8, false);
    });
});