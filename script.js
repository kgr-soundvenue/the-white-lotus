<script>
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
  console.log("[resetWebflow] START ----------------------------------");

  // Convert the next page's HTML to a DOM, grab its <html> node
  let dom = $(new DOMParser().parseFromString(data.next.html, "text/html")).find("html");
  if (!dom || !dom.length) {
    console.warn("[resetWebflow] dom was not found or is empty!");
  }

  // Check the data-wf-page attribute from the new HTML
  const nextDataWfPage = dom.attr("data-wf-page");
  console.log("[resetWebflow] Next page data-wf-page:", nextDataWfPage);

  // Sync the data-wf-page on the current <html>
  if (nextDataWfPage) {
    $("html").attr("data-wf-page", nextDataWfPage);
    console.log("[resetWebflow] Updated <html> with data-wf-page:", nextDataWfPage);
  } else {
    console.warn("[resetWebflow] No data-wf-page found on new page!");
  }

  // Re-inject scripts (data-barba-script)
  const scriptElements = dom.find("[data-barba-script]");
  console.log(`[resetWebflow] Found ${scriptElements.length} script(s) in data.next.html to re-inject.`);

  scriptElements.each(function () {
    const $this = $(this);
    let codeString = $this.text().trim();
    const srcAttr = $this.attr("src");

    console.log("[resetWebflow] Re-injecting script:", srcAttr || "[inline code]");

    // Strip out any extra DOMContentLoaded wrapper if present
    if (codeString.includes("DOMContentLoaded")) {
      codeString = codeString
        .replace(/window\.addEventListener\("DOMContentLoaded".*?\{\s*/, "")
        .replace(/\s*\}\)\s*;\s*$/, "");
    }

    // Create a script in the document
    let script = document.createElement("script");
    script.type = "text/javascript";

    if (srcAttr) {
      script.src = srcAttr;
      console.log("[resetWebflow]  => Setting script src:", srcAttr);
    } else {
      script.text = codeString;
      console.log("[resetWebflow]  => Setting inline script content (length):", codeString.length);
    }

    // Append (NOT removing)
    document.body.appendChild(script);
    console.log("[resetWebflow]  => Script appended to body.");
  });

  // Re-init Webflow
  if (window.Webflow) {
    // ***** IMPORTANT: comment out destroy() *****
    // window.Webflow.destroy();

    console.log("[resetWebflow] window.Webflow found. Calling ready() + ix2.init()...");
    window.Webflow.ready();
    window.Webflow.require("ix2").init();
    console.log("[resetWebflow] Called ix2.init() ✔");
  } else {
    console.warn("[resetWebflow] window.Webflow not found!");
  }

  console.log("[resetWebflow] END ------------------------------------");
}

/**************************************************************
 * 3) setHighlight: measure & set/animate the highlight in one
 *    .nav_menu_wrap for a given slug
 **************************************************************/
function setHighlight(tl, navWrap, slug, highlightPadding = 8, animate = true) {
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
  console.log("[animateHighlightToLink] Removing old .w--current from all nav links...");
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
  console.log("[barba.hooks.enter] Setting next.container position: fixed");
  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
  });
});

barba.hooks.beforeLeave(({ current, next }) => {
  console.log("[barba.hooks.beforeLeave] from:", current.url.path, "to:", next.url.path);
});

barba.hooks.after(data => {
  console.log("[barba.hooks.after] Setting next.container position: relative; scrolling to top");
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
        console.log("[transition.beforeLeave] fromIndex:", fromIndex, "toIndex:", toIndex, "=> direction:", next.direction);
      },

      leave({ current, next }) {
        console.log("[transition.leave] from:", current.url.path, "to:", next.url.path);
        // We'll handle the old container in the timeline
      },

      enter({ current, next }) {
        console.log("[transition.enter] from:", current.url.path, "to:", next.url.path, "direction:", next.direction);

        const direction = next.direction;
        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

        // Animate old/new containers horizontally
        if (direction === "right") {
          console.log("  => sliding old container LEFT, new container from RIGHT");
          tl.to(current.container, { x: "-100vw", duration: 2 }, 0);

          // New slides in from right
          gsap.set(next.container, { x: "100vw", zIndex: 10 });
          tl.to(next.container, { x: 0, duration: 1.8 }, 0);
        } else {
          console.log("  => sliding old container RIGHT, new container from LEFT");
          // Old slides right
          tl.to(current.container, { x: "100vw", duration: 2 }, 0);

          // New slides in from left
          gsap.set(next.container, { x: "-100vw", zIndex: 10 });
          tl.to(next.container, { x: 0, duration: 1.8 }, 0);
        }

        // Animate highlight for the new link
        const slug = next.url.path.replace(/^\/+|\/+$/g, "");
        console.log("[transition.enter] => animateHighlightToLink with slug:", slug);
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
  console.log("[DOMContentLoaded] Setting highlight for initial load...");

  const slug = window.location.pathname.replace(/^\/+|\/+$/g, "");
  console.log("  => current slug:", slug);

  // Remove old .w--current
  document
    .querySelectorAll(".w--current")
    .forEach(el => el.classList.remove("w--current"));

  // For each nav wrapper, just set highlight (no animation)
  document
    .querySelectorAll(".nav_menu_wrap")
    .forEach(navWrap => {
      // Find den nærmeste forælder med klassen .nav
      const navParent = navWrap.closest(".nav");
      let needTrick = false;
      let originalDisplay, originalVisibility;

      // Tjek om forælderens display er none
      if (navParent && window.getComputedStyle(navParent).display === "none") {
        needTrick = true;
        // Gem oprindelige værdier
        originalDisplay = navParent.style.display;
        originalVisibility = navParent.style.visibility;
        // Sæt forælderen til at være usynlig men alligevel medtaget i layout
        navParent.style.display = "block";
        navParent.style.visibility = "hidden";
      }

      // Kør setHighlight som normalt
      setHighlight(null, navWrap, slug, 8, false);

      // Gendan oprindelige værdier hvis nødvendigt
      if (needTrick) {
        navParent.style.display = originalDisplay;
        navParent.style.visibility = originalVisibility;
      }
    });
});
</script>