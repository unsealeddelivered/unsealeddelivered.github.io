// ==========================================================================
// Unsealed & Delivered Co. — Site Script
// ==========================================================================

document.addEventListener("DOMContentLoaded", function () {
  // Mobile nav toggle
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
      toggle.classList.toggle("active");
    });

    // Close mobile nav when a link is clicked
    var navLinks = nav.querySelectorAll(".nav-links a");
    navLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
      });
    });
  }

  // Sticky header shadow on scroll
  var header = document.querySelector(".site-header");
  if (header) {
    window.addEventListener("scroll", function () {
      if (window.scrollY > 12) {
        header.style.boxShadow = "0 10px 30px rgba(10,14,28,0.35)";
      } else {
        header.style.boxShadow = "none";
      }
    });
  }

  // Contact form submission is handled by Formspree's AJAX library
  // (see the initForm call and data-fs-* attributes in contact.html).

  // Fire a GA4 event when a Formspree AJAX form actually succeeds, so
  // form submissions (contact, curbside) show up in Analytics as a real
  // conversion event. Formspree's AJAX flow never reloads the page, so
  // GA4's built-in automatic "form_submit" detection never triggers on
  // its own — this watches the existing success message each form
  // already shows/hides, and fires the moment it becomes visible.
  document.querySelectorAll("[data-fs-success]").forEach(function (successEl) {
    var wrapper = successEl.closest(".contact-form");
    var formEl = wrapper ? wrapper.querySelector("form") : null;
    var formName = formEl && formEl.id ? formEl.id : "unknown_form";

    var observer = new MutationObserver(function () {
      if (!successEl.hidden && typeof gtag === "function") {
        gtag("event", "form_submit_success", { form_id: formName });
      }
    });
    observer.observe(successEl, { attributes: true, attributeFilter: ["hidden"] });
  });

  // Emit BreadcrumbList structured data from the visible breadcrumb trail
  // at the top of the page (Home / Shop / Toys & Collectibles, etc.). This
  // reads the same .breadcrumb markup a visitor sees, so there's only one
  // place (the HTML) that ever needs to be right — Google can then use it
  // to show the breadcrumb path in search results instead of a raw URL.
  var breadcrumbEl = document.querySelector(".breadcrumb");
  if (breadcrumbEl) {
    var siteOrigin = "https://unsealeddelivered.com/";
    var items = [];
    var position = 1;
    breadcrumbEl.querySelectorAll("a, span").forEach(function (node) {
      var name = node.textContent.trim();
      if (!name) return;
      var url;
      if (node.tagName === "A") {
        url = new URL(node.getAttribute("href"), siteOrigin).href;
        // Normalize the homepage link to the bare root URL (matching the
        // canonical/sitemap form) rather than the resolved /index.html.
        if (url === siteOrigin + "index.html") url = siteOrigin;
      } else {
        // The current page (the trailing <span>) — use its own canonical
        // URL rather than the raw location, which may carry ?p= params.
        var canonical = document.querySelector('link[rel="canonical"]');
        url = canonical ? canonical.href : siteOrigin + window.location.pathname.split("/").pop();
      }
      items.push({ "@type": "ListItem", "position": position++, "name": name, "item": url });
    });

    if (items.length > 1) {
      var breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items,
      };
      var script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = "breadcrumb-schema";
      script.textContent = JSON.stringify(breadcrumbSchema);
      document.head.appendChild(script);
    }
  }

  // Set active nav link based on current page
  var current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(function (link) {
    var href = link.getAttribute("href");
    if (href === current || (current === "" && href === "index.html")) {
      link.classList.add("active");
    }
  });

  // GOAT Slabs lightbox — clicking (or Enter/Space-ing) a card's photo opens
  // a large detail view with the full card name, grade, and quick ways to
  // inquire (WhatsApp / call). The "Inquire →" link under each card and the
  // bottom-section WhatsApp button are plain links and work on their own,
  // without any of this — this only powers the optional lightbox.
  var goatLightbox = document.getElementById("goat-lightbox");
  if (goatLightbox) {
    var goatImg = document.getElementById("goat-lightbox-img");
    var goatName = document.getElementById("goat-lightbox-name");
    var goatGrade = document.getElementById("goat-lightbox-grade");
    var goatWhatsapp = document.getElementById("goat-lightbox-whatsapp");
    var lastFocused = null;

    function openGoatLightbox(photoEl) {
      var data = photoEl.dataset;
      goatImg.src = data.goatImg;
      goatImg.alt = data.goatName + " — " + data.goatGrade;
      goatName.textContent = data.goatName;
      goatGrade.textContent = data.goatGrade;
      goatWhatsapp.href = data.goatWa;
      lastFocused = photoEl;
      goatLightbox.classList.add("open");
      document.body.classList.add("modal-open");
      goatLightbox.querySelector(".product-modal-close").focus();
    }

    function closeGoatLightbox() {
      goatLightbox.classList.remove("open");
      document.body.classList.remove("modal-open");
      if (lastFocused) lastFocused.focus();
    }

    document.querySelectorAll(".goat-photo[data-goat-wa]").forEach(function (photo) {
      photo.addEventListener("click", function () {
        openGoatLightbox(photo);
      });
      photo.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          openGoatLightbox(photo);
        }
      });
    });

    goatLightbox.querySelectorAll("[data-goat-close]").forEach(function (el) {
      el.addEventListener("click", closeGoatLightbox);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && goatLightbox.classList.contains("open")) {
        closeGoatLightbox();
      }
    });
  }

  // Sell page only: hide the sticky "Ready to sell?" bar while the
  // embedded form (#sell-form) is already on screen, so it isn't
  // fighting with the Get an Offer button right above it.
  var stickyCtaBar = document.getElementById("sticky-cta-bar");
  var sellForm = document.getElementById("sell-form");
  if (stickyCtaBar && sellForm && "IntersectionObserver" in window) {
    var ctaObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          stickyCtaBar.classList.toggle("hidden", entry.isIntersecting);
        });
      },
      { threshold: 0.15 }
    );
    ctaObserver.observe(sellForm);
  }
});
