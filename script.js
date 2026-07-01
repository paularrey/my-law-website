/* ==========================================================================
   THE LAW OFFICES OF JOSEPH A. ODABA - INTERACTIVE FUNCTIONALITY
   ========================================================================== */

(function () {
  "use strict";

  /* --------------------------------------------------------------------------
     CONFIGURATION & STATE
     -------------------------------------------------------------------------- */
  const config = {
    headerOffset: 100, // Offset for smooth scroll (header height)
    scrollThreshold: 50, // When to add "scrolled" class to header
    backToTopThreshold: 400, // When to show back-to-top button
    animationThreshold: 0.15, // 15% visibility triggers animations
  };

  const state = {
    isMobileMenuOpen: false,
    isScrolled: false,
    activeDropdown: null,
  };

  /* --------------------------------------------------------------------------
     DOM ELEMENT REFERENCES (cached for performance)
     -------------------------------------------------------------------------- */
  const dom = {
    header: document.querySelector("header"),
    menuToggle: document.getElementById("menu-toggle"),
    hamburger: document.querySelector(".hamburger"),
    mainNav: document.querySelector(".main-nav"),
    navLinks: document.querySelectorAll('.main-nav a[href^="#"]'),
    dropdowns: document.querySelectorAll(".dropdown"),
    sections: document.querySelectorAll("section[id]"),
    backToTopBtn: document.getElementById("back-to-top"),
    contactForm: document.getElementById("contact-form"),
    animatedElements: document.querySelectorAll("[data-animate]"),
    practiceCards: document.querySelectorAll(".practice-card"),
    reviewCards: document.querySelectorAll(".review-card"),
    footerYear: document.getElementById("footer-year"),
  };

  /* --------------------------------------------------------------------------
     MOBILE MENU FUNCTIONALITY
     -------------------------------------------------------------------------- */
  function initMobileMenu() {
    // Toggle menu on hamburger click
    if (dom.hamburger) {
      dom.hamburger.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleMobileMenu();
      });
    }

    // Close mobile menu when clicking a nav link
    dom.navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (state.isMobileMenuOpen) {
          closeMobileMenu();
        }
      });
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (
        state.isMobileMenuOpen &&
        !dom.mainNav.contains(e.target) &&
        !dom.hamburger.contains(e.target)
      ) {
        closeMobileMenu();
      }
    });

    // Close menu on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && state.isMobileMenuOpen) {
        closeMobileMenu();
      }
    });

    // Close menu on resize to desktop
    window.addEventListener(
      "resize",
      debounce(() => {
        if (window.innerWidth > 768 && state.isMobileMenuOpen) {
          closeMobileMenu();
        }
      }, 250),
    );
  }

  function toggleMobileMenu() {
    if (state.isMobileMenuOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  function openMobileMenu() {
    if (dom.menuToggle) dom.menuToggle.checked = true;
    state.isMobileMenuOpen = true;
    document.body.style.overflow = "hidden"; // prevent background scroll
  }

  function closeMobileMenu() {
    if (dom.menuToggle) dom.menuToggle.checked = false;
    state.isMobileMenuOpen = false;
    document.body.style.overflow = "";
  }

  /* --------------------------------------------------------------------------
     SMOOTH SCROLL WITH HEADER OFFSET
     -------------------------------------------------------------------------- */
  function initSmoothScroll() {
    dom.navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const targetId = link.getAttribute("href");
        if (!targetId || targetId === "#") return;

        const targetElement = document.querySelector(targetId);
        if (!targetElement) return;

        e.preventDefault();
        const targetPosition =
          targetElement.getBoundingClientRect().top +
          window.pageYOffset -
          config.headerOffset;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });
      });
    });
  }

  /* --------------------------------------------------------------------------
     STICKY HEADER & SCROLL EFFECTS
     -------------------------------------------------------------------------- */
  function initScrollEffects() {
    let ticking = false;

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            handleScroll();
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true },
    );
  }

  function handleScroll() {
    const scrollY = window.pageYOffset;

    // Sticky header with shadow
    if (scrollY > config.scrollThreshold && !state.isScrolled) {
      state.isScrolled = true;
      dom.header.classList.add("scrolled");
    } else if (scrollY <= config.scrollThreshold && state.isScrolled) {
      state.isScrolled = false;
      dom.header.classList.remove("scrolled");
    }

    // Back to top button
    if (dom.backToTopBtn) {
      if (scrollY > config.backToTopThreshold) {
        dom.backToTopBtn.classList.add("visible");
      } else {
        dom.backToTopBtn.classList.remove("visible");
      }
    }

    // Update active nav link
    updateActiveNavLink();
  }

  /* --------------------------------------------------------------------------
     ACTIVE NAV LINK ON SCROLL
     -------------------------------------------------------------------------- */
  function updateActiveNavLink() {
    const scrollPos = window.pageYOffset + config.headerOffset + 50;
    let currentSection = "";

    dom.sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;

      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        currentSection = section.getAttribute("id");
      }
    });

    // Special case: near bottom of page
    if (
      window.innerHeight + window.pageYOffset >=
      document.body.offsetHeight - 100
    ) {
      const lastSection = dom.sections[dom.sections.length - 1];
      if (lastSection) currentSection = lastSection.getAttribute("id");
    }

    dom.navLinks.forEach((link) => {
      link.classList.remove("active");
      const href = link.getAttribute("href");
      if (href === `#${currentSection}`) {
        link.classList.add("active");
      }
    });
  }

  /* --------------------------------------------------------------------------
     DROPDOWN CLICK SUPPORT (works on touch devices & mobile)
     -------------------------------------------------------------------------- */
  function initDropdowns() {
    dom.dropdowns.forEach((dropdown) => {
      const trigger = dropdown.querySelector(".dropdown-trigger");
      if (!trigger) return;

      trigger.addEventListener("click", (e) => {
        // Only override on mobile/touch devices
        if (window.innerWidth <= 768) {
          e.preventDefault();
          toggleDropdown(dropdown);
        }
      });
    });
  }

  function toggleDropdown(dropdown) {
    const isOpen = dropdown.classList.contains("open");

    // Close all other dropdowns
    dom.dropdowns.forEach((d) => d.classList.remove("open"));

    // Toggle this one
    if (!isOpen) {
      dropdown.classList.add("open");
      state.activeDropdown = dropdown;
    } else {
      dropdown.classList.remove("open");
      state.activeDropdown = null;
    }
  }

  /* --------------------------------------------------------------------------
     SCROLL ANIMATIONS (Intersection Observer)
     -------------------------------------------------------------------------- */
  function initScrollAnimations() {
    if (!("IntersectionObserver" in window)) {
      // Fallback: show everything immediately
      dom.animatedElements.forEach((el) => el.classList.add("animated"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = entry.target.dataset.delay || 0;
            setTimeout(() => {
              entry.target.classList.add("animated");
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: config.animationThreshold,
        rootMargin: "0px 0px -50px 0px",
      },
    );

    dom.animatedElements.forEach((el) => observer.observe(el));
  }

  /* --------------------------------------------------------------------------
     STAGGERED CARD ANIMATIONS
     -------------------------------------------------------------------------- */
  function initStaggerAnimations() {
    // Practice cards
    dom.practiceCards.forEach((card, index) => {
      card.setAttribute("data-animate", "fade-up");
      card.dataset.delay = index * 100;
    });

    // Review cards
    dom.reviewCards.forEach((card, index) => {
      card.setAttribute("data-animate", "fade-up");
      card.dataset.delay = index * 150;
    });
  }

  /* --------------------------------------------------------------------------
     BACK TO TOP BUTTON
     -------------------------------------------------------------------------- */
  function initBackToTop() {
    if (!dom.backToTopBtn) return;

    dom.backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* --------------------------------------------------------------------------
     CONTACT FORM HANDLING
     -------------------------------------------------------------------------- */
  function initContactForm() {
    if (!dom.contactForm) return;

    dom.contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleFormSubmit();
    });

    // Real-time validation feedback
    const inputs = dom.contactForm.querySelectorAll("input, textarea");
    inputs.forEach((input) => {
      input.addEventListener("blur", () => validateField(input));
      input.addEventListener("input", () => clearFieldError(input));
    });
  }

  function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = "";

    if (field.hasAttribute("required") && !value) {
      isValid = false;
      errorMessage = "This field is required.";
    } else if (field.type === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = "Please enter a valid email address.";
      }
    } else if (field.type === "tel" && value) {
      const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
      if (!phoneRegex.test(value)) {
        isValid = false;
        errorMessage = "Please enter a valid phone number.";
      }
    }

    showFieldError(field, isValid ? "" : errorMessage);
    return isValid;
  }

  function showFieldError(field, message) {
    const errorEl = field.parentElement.querySelector(".form-error");
    if (errorEl) {
      errorEl.textContent = message;
      field.classList.toggle("invalid", !!message);
    }
  }

  function clearFieldError(field) {
    if (field.classList.contains("invalid")) {
      showFieldError(field, "");
    }
  }

  function handleFormSubmit() {
    const formData = new FormData(dom.contactForm);
    const data = Object.fromEntries(formData);

    // Validate all fields
    const inputs = dom.contactForm.querySelectorAll(
      "input[required], textarea[required]",
    );
    let isFormValid = true;
    inputs.forEach((input) => {
      if (!validateField(input)) isFormValid = false;
    });

    if (!isFormValid) {
      showNotification("Please correct the errors above.", "error");
      return;
    }

    // Show success state
    showFormSuccess(data);
  }

  function showFormSuccess(data) {
    const successMsg = dom.contactForm.querySelector(".form-success");
    if (successMsg) {
      dom.contactForm.reset();
      successMsg.classList.add("visible");
      setTimeout(() => successMsg.classList.remove("visible"), 6000);
    }

    // Optionally build a WhatsApp link with the message
    const phone = "13149528447";
    const message = encodeURIComponent(
      `Hello, my name is ${data.name}. ${data.message || "I'd like to schedule a free consultation."}`,
    );
    console.log(`WhatsApp link: https://wa.me/${phone}?text=${message}`);

    showNotification("Thank you! We will contact you shortly.", "success");
  }

  /* --------------------------------------------------------------------------
     NOTIFICATION SYSTEM
     -------------------------------------------------------------------------- */
  function showNotification(message, type = "info") {
    // Remove existing notification
    const existing = document.querySelector(".notification");
    if (existing) existing.remove();

    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button type="button" class="notification-close" aria-label="Close">&times;</button>
    `;
    document.body.appendChild(notification);

    // Trigger animation
    requestAnimationFrame(() => notification.classList.add("show"));

    // Auto-remove after 5s
    const timeout = setTimeout(() => removeNotification(notification), 5000);

    // Manual close
    notification
      .querySelector(".notification-close")
      .addEventListener("click", () => {
        clearTimeout(timeout);
        removeNotification(notification);
      });
  }

  function removeNotification(notification) {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }

  /* --------------------------------------------------------------------------
     PHONE CLICK TRACKING (analytics-ready)
     -------------------------------------------------------------------------- */
  function initPhoneTracking() {
    const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
    phoneLinks.forEach((link) => {
      link.addEventListener("click", () => {
        const phone = link.getAttribute("href").replace("tel:", "");
        console.log(`Phone click tracked: ${phone}`);

        // Hook for Google Analytics / Facebook Pixel
        if (typeof gtag !== "undefined") {
          gtag("event", "phone_click", {
            event_category: "contact",
            event_label: phone,
          });
        }
        if (typeof fbq !== "undefined") {
          fbq("track", "Contact");
        }
      });
    });

    // WhatsApp link tracking
    const whatsappLinks = document.querySelectorAll('a[href*="wa.me"]');
    whatsappLinks.forEach((link) => {
      link.addEventListener("click", () => {
        console.log("WhatsApp click tracked");
        if (typeof gtag !== "undefined") {
          gtag("event", "whatsapp_click", { event_category: "contact" });
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
     DYNAMIC FOOTER YEAR
     -------------------------------------------------------------------------- */
  function setFooterYear() {
    if (dom.footerYear) {
      dom.footerYear.textContent = new Date().getFullYear();
    }
  }

  /* --------------------------------------------------------------------------
     UTILITY: DEBOUNCE
     -------------------------------------------------------------------------- */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /* --------------------------------------------------------------------------
     INITIALIZATION
     -------------------------------------------------------------------------- */
  function init() {
    // Wait for DOM if not ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initialize);
    } else {
      initialize();
    }
  }

  function initialize() {
    initStaggerAnimations(); // Add data-animate attributes first
    initMobileMenu();
    initSmoothScroll();
    initScrollEffects();
    initDropdowns();
    initScrollAnimations();
    initBackToTop();
    initContactForm();
    initPhoneTracking();
    setFooterYear();

    // Run once on load to set initial active state
    updateActiveNavLink();

    console.log("Law Offices of Joseph A. Odaba - Site initialized ✓");
  }

  // Boot it up
  init();
})();
