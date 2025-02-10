console.log("v1.2.7");


function showMenuMobile(){
  // Slide down the mobile menu (using jQuery)
  window.mobileMenuWrap.slideDown(500);
  
  // Immediately set the blur element to be visible with opacity 0,
  // then animate its opacity to 1 over 0.5 seconds using GSAP.
  gsap.set(".blur-on-menu-open", { display: "block", opacity: 0 });
  gsap.to(".blur-on-menu-open", { duration: 0.5, opacity: 1, ease: "power1.inOut" });
}

function hideMenuMobile(){
  // Slide up the mobile menu (using jQuery)
  window.mobileMenuWrap.slideUp(500);
  
  // Animate the blur element's opacity to 0 over 0.5 seconds using GSAP.
  // Once complete, set display to none.
  gsap.to(".blur-on-menu-open", { 
    duration: 0.5, 
    opacity: 0, 
    ease: "power1.inOut", 
    onComplete: function() {
      gsap.set(".blur-on-menu-open", { display: "none" });
    }
  });
}

// Initialize the mobile menu wrap (using jQuery)
window.mobileMenuWrap = $('.nav_menu_wrap.is-mobile');

// Set mobile menu button click event
$('.menu_button').click(function(){
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
function resetWebflow(next) {
  // Convert the next page's HTML to a DOM, grab its <html> node
  let dom = $(new DOMParser()
    .parseFromString(next.html, "text/html"))
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
function nextBefore(next){
  gsap.set(next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
  });

}

function nextAfter(next, boolResetWebflow){
  gsap.set(next.container, { position: "relative" });
  window.scrollTo(0, 0);

  if(boolResetWebflow){
    resetWebflow(next);
  }
}

barba.hooks.after(data => {
  console.log("After: " + data.current.url.path + " -> " + data.next.url.path);
});

/********************************************
 * 6) Barba transitions: slides left or right
 *    + animates the highlight link
 ********************************************/
barba.init({
  preventRunning: true,
  transitions: [
    {
      name: "welcome to reception",
      sync: true,
      from: { namespace: ['welcome'] },
      
      enter({ current, next }) {
        nextBefore(next);
      },
      after({ current, next }) {
        nextAfter(next, true);
      },
      leave({ current, next }) {
          console.log("Leave() - Welcome");

          $('.nav_menu_wrap, .menu_button_wrap, .navbar_background').each(function() {
            this.style.setProperty('display', 'block', 'important');
          });
          $('.nav_menu_wrap.is-mobile').each(function() {
            this.style.setProperty('display', 'none', 'important');
          }); 

          gsap.set('.nav_menu_wrap, .menu_button_wrap', {
            y: "-100%",
            opacity: 0
          });

          gsap.set('.navbar_background', {
            opacity: 0
          });

          const tl = gsap.timeline({
            defaults: { ease: "power2.out" },
          });

          // Forbered next container
          tl.set(next.container, { opacity: 0 });
        
          // Animer current container ud (fade out og zoom ud)
          tl.to(current.container, {
            opacity: 0,
            scale: 1.5,
            duration: 2
          });
      
          // Animer next container ind (fade in)
          tl.to(next.container, {
            opacity: 1,
            duration: 1
          }, "-=0.5");
      
          
          
          tl.to('.nav_menu_wrap, .menu_button_wrap', {
            y: "0%",
            opacity: 1,
            duration: 1.5
          }, "-=0.5");
          tl.to('.navbar_background', {
            opacity: 1,
            duration: 0.5
          }, "-=2"); //start samtidig med ovenstående.
          
          
          

          //$(next.container).find('div.intro_container.is-01').css("opacity", "0");
          

          // Ekstra animation: fremhævning af et link baseret på slug
          const slug = next.url.path.replace(/^\/+|\/+$/g, "");
          animateHighlightToLink(tl, slug, 8);


          return tl;
      }
    },
    {
      name: "back to welcome",
      sync: true,
      to: { namespace: ['welcome'] },
      enter({ current, next }) {
        nextBefore(next);
      },
      after({ current, next }) {
        nextAfter(next, false);
      },
      leave({ current, next }) {
          console.log("Leave() - Welcome - Back");  
        
       
          //Forberedt next container (welcome)
          $(next.container).find('div.intro_container.is-01').css("opacity", "0");
          $(next.container).find('div.intro_container.is-02').css("opacity", "1");

          const tl = gsap.timeline({
            defaults: { ease: "power2.out" },
          });

          // Animer current container ud (fade out)
          tl.to(current.container, {
            opacity: 0,
            duration: 2
          });
        
          // Forbered next container
          tl.set(next.container, { opacity: 0, scale: 1.5});
        
          // Animer next container ind (fade in og zoom in)
          tl.to(next.container, {
            opacity: 1,
            scale: 1,
            duration: 2
          }, "-=0.5");
      
        
          return tl;
      }
    },    
    {
      name: "directional-scroll",
      sync: true,

      // Decide direction based on pageOrder indices
      beforeLeave({ current, next }) {
        console.log("Normal pages - BeforeLeave: " + current.url.path + " -> " + next.url.path);
        const fromIndex = getPageIndex(current.url.path);
        const toIndex   = getPageIndex(next.url.path);
        next.direction  = fromIndex < toIndex ? "right" : "left";
      },
     
      after({ current, next }) {
        nextAfter(next, true);
      },
      enter({ current, next }) {
        console.log("Normal pages - Enter: " + current.url.path + " -> " + next.url.path);
        
        nextBefore(next);

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
    {
      name: "click article",
      sync: true,
      to: { namespace: ['article'] },
      
      enter({ current, next }) {
        nextBefore(next);
      },
      after({ current, next }) {
        nextAfter(next, true);
      },
      leave({ current, next }) {
          console.log("Leave() - article");

          const tl = gsap.timeline({
            defaults: { ease: "power2.out" },
          });


          // Forbered den nye container: placér den under skærmen
          gsap.set(next.container, { y: "100vh", zIndex: 2000 });

          // Animer next.container ind: glid den op fra bunden til sin normale position
          tl.to(next.container, { y: 0, duration: 1.8 }, 0);
                
         
          return tl;
      }
    },   
    {
      name: "back from article",
      sync: true,
      from: { namespace: ['article'] },
      
      enter({ current, next }) {
        nextBefore(next);
      },
      after({ current, next }) {
        nextAfter(next, true);
      },
      leave({ current, next }) {
          console.log("Leave() - article");

          const tl = gsap.timeline({
            defaults: { ease: "power2.out" },
          });


          gsap.set(current.container, { zIndex: 10 });

          tl.to(current.container, { y: "100vh", duration: 1.8 }, 0);
         
          return tl;
      }
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



/*************************************************************
 * 8) Matomo tracking with barba events
 *    
 *************************************************************/
function pad(number, length) {
  var str = '' + number;
  while (str.length < length) {
    str = '0' + str;
  }
  return str;
}

// Initialiser TimeMe med en inaktiv timeout på 30 sekunder
TimeMe.initialize({
  idleTimeoutInSeconds: 30, // stop recording time due to inactivity
  currentPageName: document.title // sætter den aktuelle sides navn til dokumentets title
});


// Vi bruger to tracking-kategorier:
// "TimeSpentPage" til den enkelte side og "TimeSpentSession" til den samlede (globale) tid.
var svTrackEveryXSecond = 10;

// Arrays (her som objekter) til at undgå at sende dublerede events for hver timer
window.svTrackTimeSpentPage = {};
window.svTrackTimeSpentSession = {};

// Send baseline events (0 sekunder) for både side og session
_paq.push(['trackEvent', 'TimeSpentPage', 'Title: ' + document.title, 'Spent ' + pad(0,10), 1]);
_paq.push(['trackEvent', 'TimeSpentSession', 'Global Session', 'Spent ' + pad(0,10), 1]);



setInterval(function () {
        
  // --- SIDETIMER ---
  // Hent tiden for den nuværende side (i sekunder)
  let timeSpentOnPage = TimeMe.getTimeOnCurrentPageInSeconds();
  let timeSpentRoundedSecondsPage = Math.floor(timeSpentOnPage);
  
  // Send event for sidetid hvert 10. sekund (hvis det ikke allerede er sendt)
  if (!window.svTrackTimeSpentPage[document.title]) {
    window.svTrackTimeSpentPage[document.title] = {};
  }
  if (timeSpentRoundedSecondsPage % svTrackEveryXSecond === 0 && timeSpentOnPage > 1 &&  !window.svTrackTimeSpentPage[document.title][timeSpentRoundedSecondsPage.toString()]) {
    window.svTrackTimeSpentPage[document.title][timeSpentRoundedSecondsPage.toString()] = true;
    _paq.push([
      'trackEvent',
      'TimeSpentPage',
      'Title: ' + document.title,
      'Spent ' + pad(timeSpentRoundedSecondsPage, 10),
      1
    ]);
    // console.log('Page Time: Spent ' + pad(timeSpentRoundedSecondsPage,10) + ' seconds');
  }
  
  // --- GLOBAL SESSION TIMER ---
  // Hent alle sider og summer tiden for at få den globale sessiontid
  let allPagesData = TimeMe.getTimeOnAllPagesInSeconds();
  let totalSessionTime = 0;
  
  // Hvis allPagesData er et array af objekter med {pageName, timeOnPage}:
  if (Array.isArray(allPagesData)) {
    allPagesData.forEach(function(pageData) {
      totalSessionTime += pageData.timeOnPage;
    });
  }
  
  
  let timeSpentRoundedSecondsSession = Math.floor(totalSessionTime);
  if (timeSpentRoundedSecondsSession % svTrackEveryXSecond === 0 && timeSpentRoundedSecondsSession > 1 && window.svTrackTimeSpentSession[timeSpentRoundedSecondsSession.toString()] !== true) {
    window.svTrackTimeSpentSession[timeSpentRoundedSecondsSession.toString()] = true;
    _paq.push([
      'trackEvent',
      'TimeSpentSession',
      'Global Session',
      'Spent ' + pad(timeSpentRoundedSecondsSession, 10),
      1
    ]);
    // console.log('Session Time: Spent ' + pad(timeSpentRoundedSecondsSession,10) + ' seconds');
  }
  
}, 500);


function initScrollDepthTracking() {
  // Først fjerner vi eventuelt gamle scroll-event handlers (ved brug af et namespace)
  $(window).off('scroll.scrollDepthTracking');

  // Definer de scroll depths, du vil tracke
  var scrollDepths = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 99];
  // Nulstil arrays for den nye side
  var trackedScrollDepths = new Array(scrollDepths.length).fill(false);
  var pendingEvents = [];

  // Throttle-funktion for at begrænse, hvor ofte vi kalder trackScrollDepth
  function throttle(func, limit) {
      var inThrottle;
      return function () {
          var context = this, args = arguments;
          if (!inThrottle) {
              func.apply(context, args);
              inThrottle = true;
              setTimeout(function () {
                  inThrottle = false;
              }, limit);
          }
      };
  }

  // Funktion til at sende event til Matomo for de scroll depths, der er nået
  function sendPendingEvents() {
      if (pendingEvents.length > 0) {
          console.log('Sending scroll events to Matomo:', pendingEvents);
          var batchEvents = pendingEvents.map(function(depth) {
              return ['trackEvent', 'Scroll Depth', depth + '%'];
          });
          _paq.push.apply(_paq, batchEvents);
          pendingEvents = [];
      }
  }

  // Funktion til at checke scroll depth
  function trackScrollDepth() {
      var scrollTop = $(window).scrollTop();
      var docHeight = $(document).height();
      var winHeight = $(window).height();
      var scrollPercent = (scrollTop / (docHeight - winHeight)) * 100;
      // console.log('Scroll Percent:', scrollPercent.toFixed(2) + '%');

      for (var i = 0; i < scrollDepths.length; i++) {
          if (scrollPercent >= scrollDepths[i] && !trackedScrollDepths[i]) {
              // console.log('Queue scroll event for', scrollDepths[i] + '%');
              pendingEvents.push(scrollDepths[i]);
              trackedScrollDepths[i] = true;
          }
      }

      sendPendingEvents();
  }

  // Bind scroll-eventet med throttling
  $(window).on('scroll.scrollDepthTracking', throttle(trackScrollDepth, 800));
}





function addContentTrackingAttributes($container) {
  // Et objekt til at holde antallet for hver unikke class-streng
  var classCounts = {};

  // Find både <section> og .footer_wrap inden for .page_main
  $container.find('.page_main section, .page_main .footer_wrap').each(function() {
      var $el = $(this);
      
      // Hvis elementet har klassen "is-hidden", spring det over
      if ($el.hasClass('is-hidden')) {
          return; // fortsæt til næste element
      }
      
      // Tilføj data-track-content for at aktivere content tracking
      $el.attr('data-track-content', '');
      // Sæt data-content-name til "Section" for alle
      $el.attr('data-content-name', 'Section');
      
      // Hent elementets class-streng
      var classes = $el.attr('class') || '';
      
      // Hvis denne class-streng ikke er talt endnu, initialiser tælleren
      if (!classCounts[classes]) {
          classCounts[classes] = 0;
      }
      // Øg tælleren for denne class-streng
      classCounts[classes]++;

      // Formatér tælleren med foranstillede nuller til 3 cifre, fx (001), (002) osv.
      var countStr = '(' + ('000' + classCounts[classes]).slice(-3) + ')';

      // Sæt data-content-piece til at være class-strengen efterfulgt af løbenummeret
      $el.attr('data-content-piece', classes + ' ' + countStr);
  });

  setTimeout(function(){ _paq.push(['trackContentImpressionsWithinNode', $('.page_wrap')[0]]);}, 500);
}

// Global array til at gemme YouTube-spillere (kan bruges til debugging eller senere reference)
var ytPlayers = [];

// Funktion der initialiserer YouTube-tracking for alle embeds i en given container (jQuery-objekt)
function initYouTubeTracking($container) {
    // Vælg alle iframes med YouTube embed URL (både standard og no-cookies)
    $container.find('iframe[src*="youtube.com/embed/"], iframe[src*="youtube-nocookie.com/embed/"]').each(function() {
        var $iframe = $(this);
        // Hvis embed allerede er initialiseret, så spring videre
        if ($iframe.data('ytTrackingInitialized')) {
            return;
        }
        $iframe.data('ytTrackingInitialized', true);

        // Opret en YouTube-spiller på denne iframe
        var player = new YT.Player(this, {
            events: {
                'onStateChange': onPlayerStateChange
            }
        });
        // Tilføj et objekt til progress tracking – vi tracker thresholds fra 5% til 100% (kan evt. udelade 100%, da ended bliver tracket)
        player.__progressThresholds = {};
        for (var i = 5; i <= 100; i += 5) {
            player.__progressThresholds[i] = false;
        }
        player.__progressInterval = null;
        ytPlayers.push(player);
    });
}

// Callback der kaldes, når YouTube-spillerens tilstand ændres
function onPlayerStateChange(event) {
    var state = event.data;
    var player = event.target;
    var videoUrl = player.getVideoUrl();

    // Når videoen spiller, start et interval der tjekker progress hvert sekund
    if (state === YT.PlayerState.PLAYING) {
        if (!player.__progressInterval) {
            player.__progressInterval = setInterval(function() {
                var currentTime = player.getCurrentTime();
                var duration = player.getDuration();
                if (duration > 0) {
                    var percent = (currentTime / duration) * 100;
                    // Gennemløb alle thresholds og send event hvis procenten er nået og ikke endnu er tracket
                    for (var threshold in player.__progressThresholds) {
                        if (!player.__progressThresholds[threshold] && percent >= parseFloat(threshold)) {
                            player.__progressThresholds[threshold] = true;
                            _paq.push(['trackEvent', 'YouTube Progress', threshold + '% Viewed', videoUrl]);
                            // Eksempel: [ 'trackEvent', 'YouTube Progress', '5% Viewed', 'https://youtube.com/watch?v=xxx' ]
                        }
                    }
                }
            }, 1000);
        }
        // Send play-event (hvis det ønskes at tracke play separat)
        _paq.push(['trackEvent', 'YouTube', 'Play', videoUrl]);
    }
    // Når videoen sættes på pause, stoppes intervallet og der sendes et pause-event
    else if (state === YT.PlayerState.PAUSED) {
        if (player.__progressInterval) {
            clearInterval(player.__progressInterval);
            player.__progressInterval = null;
        }
        _paq.push(['trackEvent', 'YouTube', 'Pause', videoUrl]);
    }
    // Når videoen er færdig, stoppes intervallet og der sendes et ended-event
    else if (state === YT.PlayerState.ENDED) {
        if (player.__progressInterval) {
            clearInterval(player.__progressInterval);
            player.__progressInterval = null;
        }
        _paq.push(['trackEvent', 'YouTube', 'Ended', videoUrl]);
    }
    // Andre tilstande (som buffering) kan tilpasses efter behov
}

// YouTube API – hvis den ikke allerede er loaded, loader vi den
if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// Når YouTube API er klar, bliver onYouTubeIframeAPIReady kaldt automatisk.
// Hvis du bruger Barba, vil du typisk køre initYouTubeTracking i din after-hook – men hvis siden
// er første load, kan du også initialisere her.
window.onYouTubeIframeAPIReady = function() {
    // Hvis der findes embeds på den aktuelle side (fx i .page_wrap)
    initYouTubeTracking($('.page_wrap'));
};




// Ved page load (uden Barba) kører vi init-funktionen
$(document).ready(function () {
  initScrollDepthTracking();
  
  addContentTrackingAttributes($('.page_wrap'));
});

barba.hooks.after(data => {
    console.log("Running matomo script to change page to " + document.title + " # " + data.next.url.href);

    _paq.push(['setCustomUrl', data.next.url.href]);
    _paq.push(['setDocumentTitle', document.title]);
    _paq.push(['setReferrerUrl', data.current.url.href]);
    _paq.push(['trackPageView']);

    _paq.push(['MediaAnalytics::scanForMedia', document]);
    _paq.push(['FormAnalytics::scanForForms', document]);

    _paq.push(['enableLinkTracking']);


    //Reset content tracking
    addContentTrackingAttributes($(data.next.container));

    var pagesData = TimeMe.getTimeOnAllPagesInSeconds();
    var pageExists = false;

    // Tjek om pagesData er et array (fx [{pageName:'...', timeOnPage:...}, ...])
    if (Array.isArray(pagesData)) {
      for (var i = 0; i < pagesData.length; i++) {
        if (pagesData[i].pageName === document.title) {
          pageExists = true;
          break;
        }
      }
    }

    // Hvis siden ikke allerede findes, send baseline-event (0 sekunder)
    if (!pageExists) {
      _paq.push(['trackEvent', 'TimeSpentPage', 'Title: ' + document.title, 'Spent ' + pad(0,10), 1]);
    }

    // Sæt den nye side som den aktuelle i TimeMe
    TimeMe.setCurrentPageName(document.title);	  


    // Hent de aktuelle stier fra Barba-dataobjektet
    var fromPath = data.current.url.path;
    var toPath = data.next.url.path;

    // Udløs et custom event i Matomo
    // Parametre: [Event Category, Event Action, Event Name/Label, Value]
    _paq.push(['trackEvent', 'Navigation', 'Click', 'From: ' + fromPath + ' -> To: ' + toPath, 1]);


    //Reset scroll
    initScrollDepthTracking();

    //Enable Youtube Tracking
    initYouTubeTracking($(data.next.container));

});



