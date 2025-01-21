/**************************************
 * 1) Define your page order
 **************************************/
const pageOrder = [
  "residents",
  "library",
  "meme-lounge",
  "poolside-pod",
  "gift-shop",
];

/**
 * A helper to figure out the index of a given page slug.
 */
function getPageIndex(urlString) {
  return pageOrder.indexOf(urlString.replace(/^\/+|\/+$/g, ""));
}

/**************************************
 * 2) Minimal “resetWebflow” function
 *    Re-init interactions, but skip .w--current re-assignment.
 **************************************/
function resetWebflow(data) {
  console.log("[resetWebflow] re-initializing Webflow…");

  let dom = $(new DOMParser().parseFromString(data.next.html, "text/html")).find("html");
  $("html").attr("data-wf-page", dom.attr("data-wf-page"));

  // Re-init Webflow
  window.Webflow && window.Webflow.destroy();
  window.Webflow && window.Webflow.ready();
  window.Webflow && window.Webflow.require("ix2").init();

  // If desired, you can remove or comment out the .w--current logic
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

/**************************************
 * 3) A small helper to measure & animate
 *    the highlight in one nav container.
 **************************************/
function setHighlight(tl, navContainer, slug, highlightPadding, animate = true) {
  console.log("[setHighlight] Called for slug:", slug, "on navContainer:", navContainer);

  // Find the highlight element and link in *this* nav
  const highlight = navContainer.querySelector(".nav-highlight");
  const newLink   = navContainer.querySelector(`.nav_menu_link[href="/${slug}"]`);

  console.log("[setHighlight] highlight element found:", highlight);
  console.log("[setHighlight] newLink for slug:", newLink);

  if (!highlight || !newLink) {
    console.log("[setHighlight] highlight or link NOT found, aborting.");
    return;
  }

  // Mark the link as current
  newLink.classList.add("w--current");
  console.log("[setHighlight] added .w--current to link:", newLink);

  // Calculate bounding rectangles
  const linkRect = newLink.getBoundingClientRect();
  const navRect  = navContainer.getBoundingClientRect();
  const leftOffset = linkRect.left - navRect.left;
  const topOffset  = linkRect.top  - navRect.top;
  const width  = linkRect.width  + highlightPadding * 2;
  const height = linkRect.height + highlightPadding * 2;

  console.log("[setHighlight] linkRect:", linkRect);
  console.log("[setHighlight] navRect:", navRect);
  console.log("[setHighlight] final highlight width:", width, "height:", height);

  // For the initial load, we can set the highlight with no animation
  // or do a quick tween if you want. For transitions, we animate in the timeline.
  if (animate && tl) {
    console.log("[setHighlight] Animating highlight in timeline…");
    tl.to(
      highlight,
      {
        x: leftOffset - highlightPadding,
        y: topOffset - highlightPadding,
        width,
        height,
        duration: 1, // match or complement your page transition duration
        ease: "power2.out",
      },
      0
    );
  } else {
    console.log("[setHighlight] Setting highlight with GSAP.set (no animation) …");
    gsap.set(highlight, {
      x: leftOffset - highlightPadding,
      y: topOffset - highlightPadding,
      width,
      height,
    });
  }
}

/**************************************
 * 4) The main function that assigns
 *    .w--current & animates highlight for *all* navs
 **************************************/
function animateHighlightToLink(tl, slug, highlightPadding = 8) {
  console.log("[animateHighlightToLink] Called with slug:", slug);

  // Remove .w--current from all existing links (desktop & mobile)
  document.querySelectorAll(".w--current").forEach((el) => el.classList.remove("w--current"));

  // For each nav container, measure & animate the highlight
  const allNavs = document.querySelectorAll(".nav_menu_list");
  console.log("[animateHighlightToLink] Found nav containers:", allNavs);

  allNavs.forEach((nav) => {
    setHighlight(tl, nav, slug, highlightPadding, true);
  });
}

/**************************************
 * 5) Barba Hooks
 **************************************/
// A small fix for container positioning
barba.hooks.enter((data) => {
  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
  });
  console.log("[barba.hooks.enter] Fixed next.container so old remains in flow until transition ends.");
});

barba.hooks.after((data) => {
  gsap.set(data.next.container, { position: "relative" });
  window.scrollTo(0, 0);

  console.log("[barba.hooks.after] Re-init Webflow, skipping .w--current logic.");
  resetWebflow(data);
});

/**************************************
 * 6) Barba Transitions
 **************************************/
barba.init({
  preventRunning: true,
  transitions: [
    {
      name: "directional-scroll",
      sync: true,

      // Determine direction (left or right)
      beforeLeave({ current, next }) {
        const fromIndex = getPageIndex(current.url.path);
        const toIndex   = getPageIndex(next.url.path);
        next.direction  = fromIndex < toIndex ? "right" : "left";
        console.log("[barba.beforeLeave] fromIndex:", fromIndex, "toIndex:", toIndex, "=> direction:", next.direction);
      },

      // We won't do anything in leave() — we'll handle it in the timeline
      leave() {
        console.log("[barba.leave] No direct animation here, everything is in the timeline.");
      },

      // Animate old container out and new container in
      enter({ current, next }) {
        console.log("[barba.enter] Starting container transitions…");
        const direction = next.direction;
        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

        // 1) Animate old/new containers
        if (direction === "right") {
          // Old slides left
          tl.to(current.container, {
            x: "-100vw",
            duration: 2,
          }, 0);

          // New slides in from right
          gsap.set(next.container, { x: "100vw", zIndex: 10 });
          tl.to(next.container, {
            x: 0,
            duration: 1.8,
          }, 0);
        } else {
          // Old slides right
          tl.to(current.container, {
            x: "100vw",
            duration: 2,
          }, 0);

          // New slides in from left
          gsap.set(next.container, { x: "-100vw", zIndex: 10 });
          tl.to(next.container, {
            x: 0,
            duration: 1.8,
          }, 0);
        }

        // 2) Animate the highlight behind the new link in the same timeline
        const slug = next.url.path.replace(/^\/+|\/+$/g, "");
        console.log("[barba.enter] About to animate highlight for slug:", slug);
        animateHighlightToLink(tl, slug, 8);

        // Return timeline to let Barba wait for it
        return tl;
      },
    },
  ],
});

/**************************************
 * 7) On the first load, set highlight
 *    to the current link for all navs
 **************************************/
document.addEventListener("DOMContentLoaded", () => {
  console.log("[DOMContentLoaded] Setting highlight on first load…");
  const slug = window.location.pathname.replace(/^\/+|\/+$/g, "");
  console.log("[DOMContentLoaded] Current slug is:", slug);

  // Remove any old .w--current (in case of SSR/hard reload)
  document.querySelectorAll(".w--current").forEach((el) => el.classList.remove("w--current"));

  // For each nav, just *set* (no animation) the highlight
  document.querySelectorAll(".nav_menu_list").forEach((nav) => {
    setHighlight(null, nav, slug, 8, false);
  });
});