
  // 1) Page order for horizontal transitions
  const pageOrder = [
    'residents',
    'library',
    'meme-lounge',
    'poolside-pod',
    'gift-shop'
  ];

  function getPageIndex(urlString) {
    return pageOrder.indexOf(urlString.replace(/^\/+|\/+$/g, ''));
  }

  // 2) Minimal “resetWebflow” to re-init interactions, but comment out .w--current re-assignment
  //    since we’re now handling that in the transition itself.
  function resetWebflow(data) {
    let dom = $(new DOMParser().parseFromString(data.next.html, "text/html")).find("html");
    $("html").attr("data-wf-page", dom.attr("data-wf-page"));

    // Re-init Webflow
    window.Webflow && window.Webflow.destroy();
    window.Webflow && window.Webflow.ready();
    window.Webflow && window.Webflow.require("ix2").init();

    // --- If desired, you can REMOVE or COMMENT OUT the .w--current logic here ---
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

  // 3) A helper to manually assign .w--current to the new link
  //    Then measure & animate the highlight in the same timeline.
  function animateHighlightToLink(tl, slug, highlightPadding = 8) {
    // 1) Remove .w--current from any existing links
    document.querySelectorAll(".w--current").forEach(el => el.classList.remove("w--current"));

    // 2) Find the new link by slug
    const newLink = document.querySelector(`.nav_menu_list .nav_menu_link[href="/${slug}"]`);
    const highlight = document.querySelector(".nav-highlight");
    const navContainer = document.querySelector(".nav_menu_list");
    if (!newLink || !highlight || !navContainer) return;

    // Add .w--current to the new link
    newLink.classList.add("w--current");

    // 3) Measure position
    const linkRect = newLink.getBoundingClientRect();
    const navRect  = navContainer.getBoundingClientRect();
    const leftOffset = linkRect.left - navRect.left;
    const topOffset  = linkRect.top  - navRect.top;

    // Animate .nav-highlight in the same timeline (tl)
    tl.to(highlight, {
      x: leftOffset - highlightPadding,
      y: topOffset - highlightPadding,
      width: linkRect.width + highlightPadding * 2,
      height: linkRect.height + highlightPadding * 2,
      duration: 1, // match or complement your page transition duration
      ease: "power2.out"
    }, 0); 
    // ^ start at the same time as the page transition (time = 0)
  }

  // 4) Barba hooks (position fix + re-init Webflow)
  barba.hooks.enter((data) => {
    gsap.set(data.next.container, { position: "fixed", top: 0, left: 0, width: "100%" });
  });
  barba.hooks.after((data) => {
    gsap.set(data.next.container, { position: "relative" });
    window.scrollTo(0, 0);

    // Re-init Webflow interactions, but not re-assigning .w--current (we did that manually).
    resetWebflow(data);
  });

  // 5) Barba transitions
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
        },

        leave() {
          // We'll handle the old container in the timeline below
        },

        enter({ current, next }) {
          const direction = next.direction;
          const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

          // 1) Animate the old/new container in the same timeline
          if (direction === "right") {
            // old slides left
            tl.to(current.container, {
              x: "-100vw",
              duration: 2
            }, 0);

            // new slides in from right
            gsap.set(next.container, { x: "100vw", zIndex: 10 });
            tl.to(next.container, {
              x: 0,
              duration: 1.8
            }, 0);
          } else {
            // old slides right
            tl.to(current.container, {
              x: "100vw",
              duration: 2
            }, 0);

            // new slides in from left
            gsap.set(next.container, { x: "-100vw", zIndex: 10 });
            tl.to(next.container, {
              x: 0,
              duration: 1.8
            }, 0);
          }

          // 2) Animate the highlight behind the new link DURING the same timeline
          //    We'll figure out the next slug and manually assign .w--current
          const slug = next.url.path.replace(/^\/+|\/+$/g, "");
          animateHighlightToLink(tl, slug, 8);

          // Return the timeline to let Barba wait for it
          return tl;
        }
      }
    ]
  });

  // 6) On the very first load, set highlight to the current link
  //    in case user is landing on a specific page for the first time.
  document.addEventListener("DOMContentLoaded", () => {
    // If you want to do it “manually”:
    const slug = window.location.pathname.replace(/^\/+|\/+$/g, "");
    // We won't animate here in a timeline; we'll just do an immediate set with GSAP
    // so there's no flicker.
    
    const newLink = document.querySelector(`.nav_menu_list .nav_menu_link[href="/${slug}"]`);
    const highlight = document.querySelector(".nav-highlight");
    const navContainer = document.querySelector(".nav_menu_list");
    if (!newLink || !highlight || !navContainer) return;

    // Mark it .w--current
    newLink.classList.add("w--current");

    // Measure & set highlight (no animation for page load, or do a 0.5s tween if you prefer)
    const linkRect = newLink.getBoundingClientRect();
    const navRect  = navContainer.getBoundingClientRect();
    const highlightPadding = 1;

    const leftOffset = linkRect.left - navRect.left;
    const topOffset  = linkRect.top  - navRect.top;

    gsap.set(highlight, {
      x: leftOffset - highlightPadding,
      y: topOffset - highlightPadding,
      width: linkRect.width + highlightPadding * 2,
      height: linkRect.height + highlightPadding * 2
    });
  });