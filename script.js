/*************************************************
 * 1) Page order + helper
 *************************************************/
const pageOrder = [
  "residents",
  "library",
  "meme-lounge",
  "poolside-pod",
  "gift-shop",
];

function getPageIndex(urlString) {
  return pageOrder.indexOf(urlString.replace(/^\/+|\/+$/g, ""));
}

/*****************************************************
 * 2) Minimal "resetWebflow" (skip w--current reassign)
 *****************************************************/
function resetWebflow(data) {
  console.log("[resetWebflow] Re-initializing Webflow…");

  let dom = $(new DOMParser().parseFromString(data.next.html, "text/html")).find("html");
  $("html").attr("data-wf-page", dom.attr("data-wf-page"));

  // Re-init Webflow
  window.Webflow && window.Webflow.destroy();
  window.Webflow && window.Webflow.ready();
  window.Webflow && window.Webflow.require("ix2").init();

  // Optional: removing .w--current logic
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

/*****************************************************
 * 3) setHighlight: measure & set/animate highlight
 *****************************************************/
function setHighlight(tl, navWrap, slug, highlightPadding = 8, animate = true) {
  console.log("[setHighlight] Called for navWrap:", navWrap, "slug:", slug, "animate:", animate);

  // 1) Find highlight & link
  const highlight = navWrap.querySelector(".nav-highlight");
  const newLink   = navWrap.querySelector(`.nav_menu_list .nav_menu_link[href="/${slug}"]`);
  console.log("[setHighlight] .nav-highlight found?", highlight);
  console.log("[setHighlight] .nav_menu_link found?", newLink);

  if (!highlight || !newLink) {
    console.warn("[setHighlight] highlight or link not found. Skipping navWrap:", navWrap);
    return;
  }

  // 2) Mark link as current
  newLink.classList.add("w--current");
  console.log("[setHighlight] Marked link .w--current ->", newLink);

  // 3) Measure boundingRect
  const linkRect = newLink.getBoundingClientRect();
  const wrapRect = navWrap.getBoundingClientRect();
  console.log("[setHighlight] linkRect:", linkRect);
  console.log("[setHighlight] wrapRect:", wrapRect);

  const x = linkRect.left - wrapRect.left - highlightPadding;
  const y = linkRect.top  - wrapRect.top  - highlightPadding;
  const w = linkRect.width  + highlightPadding * 2;
  const h = linkRect.height + highlightPadding * 2;

  console.log("[setHighlight] Final highlight dims: x:", x, "y:", y, "w:", w, "h:", h);

  // 4) Animate or set
  if (animate && tl) {
    console.log("[setHighlight] Animating highlight in GSAP timeline…");
    tl.to(highlight, {
      x,
      y,
      width:  w,
      height: h,
      duration: 1,
      ease: "power2.out"
    }, 0);
  } else {
    console.log("[setHighlight] Setting highlight with gsap.set (no animation) …");
    gsap.set(highlight, { x, y, width: w, height: h });
  }
}

/*****************************************************************
 * 4) animateHighlightToLink: loops over all .nav_menu_wrap's
 *****************************************************************/
function animateHighlightToLink(tl, slug, highlightPadding = 8) {
  console.log("[animateHighlightToLink] slug:", slug);

  // Remove old .w--current
  document.querySelectorAll(".w--current").forEach(el => el.classList.remove("w--current"));

  // For each nav wrap
  const allNavWraps = document.querySelectorAll(".nav_menu_wrap");
  console.log("[animateHighlightToLink] .nav_menu_wrap elements found:", allNavWraps);

  allNavWraps.forEach(navWrap => {
    setHighlight(tl, navWrap, slug, highlightPadding, true);
  });
}

/***********************************************
 * 5) Barba Hooks
 ***********************************************/
barba.hooks.enter((data) => {
  console.log("[barba.hooks.enter] Setting position: fixed on next.container");
  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%"
  });
});

barba.hooks.after((data) => {
  console.log("[barba.hooks.after] Setting position: relative on next.container");
  gsap.set(data.next.container, { position: "relative" });
  window.scrollTo(0, 0);
  resetWebflow(data);
});

/***********************************************
 * 6) Barba Transitions
 ***********************************************/
barba.init({
  preventRunning: true,
  transitions: [
    {
      name: "directional-scroll",
      sync: true,

      // Determine direction
      beforeLeave({ current, next }) {
        const fromIndex = getPageIndex(current.url.path);
        const toIndex   = getPageIndex(next.url.path);
        next.direction  = fromIndex < toIndex ? "right" : "left";
        console.log("[barba.beforeLeave] fromIndex:", fromIndex, "toIndex:", toIndex, "direction:", next.direction);
      },

      leave() {
        console.log("[barba.leave] We'll animate old container in timeline.");
      },

      enter({ current, next }) {
        console.log("[barba.enter] Setting up container transitions…");
        const direction = next.direction;
        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

        // Slide old/new containers
        if (direction === "right") {
          console.log("[barba.enter] Old slides left, new from right");
          tl.to(current.container, { x: "-100vw", duration: 2 }, 0);
          gsap.set(next.container, { x: "100vw", zIndex: 10 });
          tl.to(next.container, { x: 0, duration: 1.8 }, 0);
        } else {
          console.log("[barba.enter] Old slides right, new from left");
          tl.to(current.container, { x: "100vw", duration: 2 }, 0);
          gsap.set(next.container, { x: "-100vw", zIndex: 10 });
          tl.to(next.container, { x: 0, duration: 1.8 }, 0);
        }

        // Animate highlight
        const slug = next.url.path.replace(/^\/+|\/+$/g, "");
        console.log("[barba.enter] Next slug:", slug);
        animateHighlightToLink(tl, slug, 8);

        return tl;
      }
    }
  ]
});

/***********************************************
 * 7) DOMContentLoaded: partial highlight logic
 ***********************************************/
document.addEventListener("DOMContentLoaded", () => {
  const slug = window.location.pathname.replace(/^\/+|\/+$/g, "");
  console.log("[DOMContentLoaded] Current slug is:", slug);

  // Remove any existing .w--current
  document.querySelectorAll(".w--current").forEach(el => el.classList.remove("w--current"));

  // 7a) We'll highlight only the .is-desktop nav on load
  console.log("[DOMContentLoaded] Setting highlight for .nav_menu_wrap.is-desktop");
  document.querySelectorAll(".nav_menu_wrap.is-desktop").forEach(navWrap => {
    setHighlight(null, navWrap, slug, 8, false);
  });

  // 7b) Then we wait for the user to open the mobile nav
  //     Here we grab the button by ID instead of a class
  const mobileButton = document.getElementById("mobile-menu-button");
  if (mobileButton) {
    console.log("[DOMContentLoaded] Found #mobile-menu-button. Adding click handler…");
    mobileButton.addEventListener("click", () => {
      console.log("[mobile-menu-button] Clicked! We'll set mobile highlight…");
      // Your code to reveal mobile nav goes here (or Webflow Interaction).
      // Then measure highlight:
      const mobileNavWrap = document.querySelector(".nav_menu_wrap.is-mobile");
      if (mobileNavWrap) {
        // If there's a transition for the menu opening, add a small delay:
        setTimeout(() => {
          console.log("[mobile-menu-button] Setting highlight for mobile nav after open…");
          setHighlight(null, mobileNavWrap, slug, 8, false);
        }, 50);
      } else {
        console.warn("[mobile-menu-button] .nav_menu_wrap.is-mobile not found in DOM!");
      }
    });
  } else {
    console.warn("[DOMContentLoaded] #mobile-menu-button not found. Mobile menu won't be toggled here.");
  }
});