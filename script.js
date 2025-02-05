console.log("v1.1.20");


function showMenuMobile(){
  window.mobileMenuWrap.slideDown(500);
}

function hideMenuMobile(){
  window.mobileMenuWrap.slideUp(500);
}

window.mobileMenuWrap = $('.nav_menu_wrap.is-mobile');

//Set mobile menu button
$('.menu_button').click(function(){
  
  // Hvis elementet er skjult, slidedown, ellers slideup
  if (window.mobileMenuWrap.is(':hidden')) {
    showMenuMobile();
  } else {
    hideMenuMobile();
  }
});

/*************************************************
 * 1) Define page order for horizontal transitions
 *************************************************/
/*const pageOrder = [
  "reception",
  "library",
  "meme-lounge",
  "poolside-pod",
  "gift-shop",
];*/
const pageOrder = $('.nav.is-desktop .nav_menu_list li:not([class*="is-hidden"]) a')
  .map((i, el) => $(el).attr('href').replace(/^\//, ''))
  .get();

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

  // reset scripts
  dom.find("[data-barba-script]").each(function () {
    console.log("running data-barba-script t.ricks function #A");
    let codeString = $(this).text();
    if (codeString.includes("DOMContentLoaded")) {
      console.log("running data-barba-script t.ricks function #B (DOMContentLoaded)");
      let newCodeString = codeString.replace(/window\.addEventListener\("DOMContentLoaded",\s*\(\s*event\s*\)\s*=>\s*{\s*/, "");
      codeString = newCodeString.replace(/\s*}\s*\);\s*$/, "");
    }
    console.log("running data-barba-script t.ricks function #C - ", codeString);    
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
  console.log(navWrap);


  // 1) Find the highlight & matching link in *this* navWrap
  const highlight = navWrap.querySelector(".nav-highlight");
  const newLink   = navWrap.querySelector(`.nav_menu_list .nav_menu_link[href="/${slug}"]`);

  // If missing either highlight or link, skip
  if (!highlight || !newLink){ console.log("Skip highlight - no highlight div or slug not in menu."); return; }

  
  var navWrapJQ = $(navWrap);
  var navWrapContainerJQ = navWrapJQ.closest('.nav')
  var navWrapIsHidden = false;
  var navWrapContainerIsHidden = false;
  //Check if navWrap is display none.
  //if (navWrapJQ.css('display') === 'none'){
  if (navWrapJQ.is(':hidden')){
     navWrapIsHidden = true;
  }
  
  //Check if navWrap is display none.
  //if (navWrapContainerJQ.closest('.nav').css('display') === 'none'){
  if (navWrapContainerJQ.closest('.nav').is(':hidden')){
     navWrapContainerIsHidden = true;
  }

  console.log("navWrapIsHidden: ", navWrapIsHidden);
  console.log("navWrapContainerIsHidden: ", navWrapContainerIsHidden);
    //Hvis navWrap eller Container er skjult, skal vi lave det om til visibility hidden for at kunne beregne størrelsen.
    const navWrapEl = navWrapJQ.get(0);
    // Gem de oprindelige inline-styles, hvis du har brug for at genskabe dem nøjagtigt
      const originalDisplayWrap  = navWrapEl.style.display;
      const originalDisplayWrapPriority = navWrapEl.style.getPropertyPriority('display');
      const originalPositionWrap = navWrapEl.style.position;
      const originalTopWrap      = navWrapEl.style.top;
      const originalLeftWrap     = navWrapEl.style.left;
  
    if (navWrapIsHidden) {
        console.log("Setting navWrap to hidden");
               
      
        // Sæt elementet til at blive vist off-screen
        navWrapEl.style.setProperty('display', 'block', 'important');
        navWrapEl.style.setProperty('position', 'absolute', 'important');
        navWrapEl.style.setProperty('top', '-9999px', 'important');
        navWrapEl.style.setProperty('left', '-9999px', 'important');
    
    }

    const navWrapContainerEl = navWrapContainerJQ.get(0);
    const originalDisplayContainer  = navWrapContainerEl.style.display;
    const originalDisplayContainerPriority = navWrapContainerEl.style.getPropertyPriority('display');
    const originalPositionContainer = navWrapContainerEl.style.position;
    const originalTopContainer      = navWrapContainerEl.style.top;
    const originalLeftContainer     = navWrapContainerEl.style.left;
        
    if (navWrapContainerIsHidden) {
        console.log("Setting navWrapContainer to hidden");
        

        navWrapContainerEl.style.setProperty('display', 'block', 'important');
        navWrapContainerEl.style.setProperty('position', 'absolute', 'important');
        navWrapContainerEl.style.setProperty('top', '-9999px', 'important');
        navWrapContainerEl.style.setProperty('left', '-9999px', 'important');
    
    }


    
  // 2) Mark the link as current
  newLink.classList.add("w--current");

  // 3) Measure bounding rectangles (relative to the .nav_menu_wrap)
  const linkRect = newLink.getBoundingClientRect();
  const wrapRect = navWrap.getBoundingClientRect();

  const x = linkRect.left - wrapRect.left - highlightPadding;
  const y = linkRect.top  - wrapRect.top  - highlightPadding;
  const w = linkRect.width  + highlightPadding * 2;
  const h = linkRect.height + highlightPadding * 2;

    console.log(x,y,w,h);

//Hvis navWrap eller Container er skjult, har vi lavet det om til visibility hidden for at kunne beregne størrelsen og skal nu reverse det.
if (navWrapIsHidden) {
  console.log("Setting navWrap back to display none");
  if (originalDisplayWrap) {
    navWrapEl.style.setProperty('display', originalDisplayWrap, originalDisplayWrapPriority);
  } else {
    navWrapEl.style.removeProperty('display');
  }
  navWrapEl.style.position = originalPositionWrap;
  navWrapEl.style.top      = originalTopWrap;
  navWrapEl.style.left     = originalLeftWrap;
}

if (navWrapContainerIsHidden) {
    console.log("Setting navWrap container back to display none");
    if (originalDisplayContainer) {
      navWrapContainerEl.style.setProperty('display', originalDisplayContainer, originalDisplayContainerPriority);
    } else {
      navWrapContainerEl.style.removeProperty('display');
    }
  navWrapContainerEl.style.position = originalPositionContainer;
  navWrapContainerEl.style.top      = originalTopContainer;
  navWrapContainerEl.style.left     = originalLeftContainer;
}


    
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
  /*gsap.set(data.current.container, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
  });    */
});

barba.hooks.after(data => {
  console.log("After: " + data.current.url.path + " -> " + data.next.url.path);
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
      name: "welcome",
      sync: true,
      from: { namespace: ['welcome'] },
      // Decide direction based on pageOrder indices
      leave({ current }) {
          // Scale up and fade out the current container
          return gsap.to(current.container, {
            opacity: 0,
            scale: 1.5, // Scale up to 150%
            duration: 2,
            ease: "power2.out" // Smooth easing
          });
        },
        enter({ next }) {
          
          //const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
          
         /*
          // Fade in the next container
          tl.set(next.container, { opacity: 0 });
          tl.to(next.container, {
            opacity: 1,
            duration: 2
          });
*/
          // Animate highlight for the new link
          const slug = next.url.path.replace(/^\/+|\/+$/g, "");
          animateHighlightToLink(null, slug, 8);
            
          //return tl;
        },
    },
    {
      name: "directional-scroll",
      sync: true,

      // Decide direction based on pageOrder indices
      beforeLeave({ current, next }) {
        console.log("BeforeLeave: " + current.url.path + " -> " + next.url.path);
        const fromIndex = getPageIndex(current.url.path);
        const toIndex   = getPageIndex(next.url.path);
        next.direction  = fromIndex < toIndex ? "right" : "left";
      },

      enter({ current, next }) {
        console.log("Enter: " + current.url.path + " -> " + next.url.path);
        
        const direction = next.direction;
        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

        // Animate old/new containers horizontally
        if (direction === "right") {
          // Old slides left
            gsap.set(current.container, { zIndex: 9 });
          tl.to(current.container, { x: "-100vw", duration: 2 }, 0);

          // New slides in from right
          gsap.set(next.container, { x: "100vw", zIndex: 10 });
          tl.to(next.container, { x: 0, duration: 1.8 }, 0);
        } else {
          // Old slides right
            gsap.set(current.container, { zIndex: 9 });
          tl.to(current.container, { x: "100vw", duration: 2 }, 0);

          // New slides in from left
          gsap.set(next.container, { x: "-100vw", zIndex: 10 });
          tl.to(next.container, { x: 0, duration: 1.8 }, 0);
        }

        // Animate highlight for the new link
        const slug = next.url.path.replace(/^\/+|\/+$/g, "");
        animateHighlightToLink(tl, slug, 8);

        //Hide the mobile menu
        setTimeout(function(){hideMenuMobile();}, 1400);
        
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

