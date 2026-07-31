(function ($) {

  "use strict";

  // ==========================
  // MENU
  // ==========================

  $('.navbar-collapse a').on('click', function () {
    $(".navbar-collapse").collapse('hide');
  });

  // ==========================
  // SMOOTH SCROLL
  // ==========================

  function scrollToDiv(element, navheight) {
    var offset = element.offset();
    var offsetTop = offset.top;
    var totalScroll = offsetTop - navheight;

    $('body, html').animate({
      scrollTop: totalScroll
    }, 300);
  }

  $('.smoothscroll').click(function () {
    var el = $(this).attr('href');
    var elWrapped = $(el);
    var header_height = $('.navbar').height();

    scrollToDiv(elWrapped, header_height);
    return false;
  });

  // ==========================
  // TIMELINE
  // ==========================

  $(window).on('scroll', function () {
    var timeline = $('#vertical-scrollable-timeline li');
    if (timeline.length) {
      Array.from(timeline).forEach(isScrollIntoView);
    }
  });

  function isScrollIntoView(elem) {
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(window).height() * .5;

    if (elemBottom <= docViewBottom && elemTop >= docViewTop) {
      $(elem).addClass('active');
    }

    if (!(elemBottom <= docViewBottom)) {
      $(elem).removeClass('active');
    }

    var MainTimelineContainer = $('#vertical-scrollable-timeline')[0];

    if (MainTimelineContainer) {
      var MainTimelineContainerBottom =
        MainTimelineContainer.getBoundingClientRect().bottom -
        $(window).height() * .5;

      $(MainTimelineContainer)
        .find('.inner')
        .css('height', MainTimelineContainerBottom + 'px');
    }
  }

  // =====================================================
  // REGISTRATION FORM
  // =====================================================

  const form = document.getElementById("registrationForm");
  const emailInput = document.getElementById("Email__c");
  const submitButton = form ? form.querySelector('input[type="submit"]') : null;
  const formMessage = document.getElementById("formMessage");

  function showFormMessage(type, message) {
    if (!formMessage) {
      return;
    }

    // Clear any existing timeout
    if (formMessage.timeoutId) {
      clearTimeout(formMessage.timeoutId);
    }

    formMessage.className = `message-banner ${type}`;
    if (message === "") {
      formMessage.style.display = "none";
    } else {
      formMessage.style.display = "block";
    }
    formMessage.textContent = message;

    // Auto-hide after 5 seconds
    formMessage.timeoutId = setTimeout(() => {
      showFormMessage(type, "");
    }, 5000);
  }

  if (form) {

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const submitButton = form.querySelector('input[type="submit"]');

      showFormMessage("success", "");
      submitButton.disabled = true;
      submitButton.value = "Registering...Do not refresh or close the page.";
      document.getElementById("loaderOverlay").style.display = "flex";

      try {

        // Convert form directly into JSON
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.Referral_Code__c = generateReferralCode();
        data.Enrolled_Courses__c = selectedCourses.join(';');

        showReferralModal(data.Referral_Code__c);
        //console.log("Salesforce Payload");
        //console.table(data);

        await saveToSalesforce(data);

        showFormMessage("success", "Registration successful. You will receive updates on your email and WhatsApp shortly.");

        form.reset();
        selectedCourses = [];
        resetCourseButtons();

      }
      catch (error) {

        console.error(error);

        showFormMessage("error", error.message || "Registration failed. Please try again.");

      }
      finally {

        submitButton.disabled = false;
        submitButton.value = "Register Now";
        document.getElementById("loaderOverlay").style.display = "none";

      }

    });

    if (emailInput) {
      emailInput.addEventListener('blur', async function () {
        const email = this.value;
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
          return; // Don't check invalid emails
        }

        try {
          const isRegistered = await checkEmailInSalesforce(email);
          if (isRegistered) {
            showFormMessage("error", "This email is already registered. Please use a different email.");
            if (submitButton) {
              submitButton.disabled = true;
              submitButton.value = "Email Already Registered";
            }
          } else {
            // Clear message if it was previously shown for this reason
            if (formMessage.textContent.includes("already registered")) {
              showFormMessage("error", "");
            }
            if (submitButton) {
              submitButton.disabled = false;
              submitButton.value = "Register Now";
            }
          }
        } catch (error) {
          console.error("Email check failed:", error);
          // Decide if you want to show a generic error to the user
        }
      });
    }

  }

  // Reset course buttons after successful registration
  function resetCourseButtons() {
    updateCourseTracker();
    document.querySelectorAll('.enroll-btn').forEach(button => {
      button.disabled = false;
      button.textContent = "Enroll Now";
      button.classList.remove('enrolled');
    });
  }

  // =========================================
  // Referral Code Generator
  // Format: TBF + 6 Random Alphanumeric Characters
  // Example: TBFYDGG2, TBF8XK29
  // =========================================

  const REFERRAL_PREFIX = "TBF";
  const REFERRAL_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  function generateReferralCode(length = 6) {
      let code = REFERRAL_PREFIX;

      for (let i = 0; i < length; i++) {
          code += REFERRAL_CHARS.charAt(
              Math.floor(Math.random() * REFERRAL_CHARS.length)
          );
      }

      return code;
  }

  function showReferralModal(code) {
      const modalInput = document.getElementById("generatedReferralCode");
      if (!modalInput) return;

      modalInput.value = code;
      const modalEl = document.getElementById("referralModal");
      if (!modalEl) return;

      const modal = new bootstrap.Modal(modalEl);
      modal.show();
  }

  function copyReferralCode() {
      const modalInput = document.getElementById("generatedReferralCode");
      if (!modalInput) return;

      navigator.clipboard.writeText(modalInput.value).catch(() => {
          modalInput.select();
          document.execCommand('copy');
      });
  }

  function shareReferralLink() {
      const modalInput = document.getElementById("generatedReferralCode");
      if (!modalInput) return;
      const code = modalInput.value;
      const currentUrl = window.location.href.split('#')[0];
      const referralName = encodeURIComponent(code);
      const shareUrl = `${currentUrl}?referral=${referralName}`;

      if (navigator.share) {
          navigator.share({
              title: 'Join Train Blazer Force',
              text: 'Hi! 👋 I\'m learning with Train Blazer Force. Please join using my referral link:',
              url: shareUrl,
          }).catch(() => {
              window.location.href = `https://wa.me/?text=${encodeURIComponent('Join Train Blazer Force: ' + shareUrl)}`;
          });
      } else {
          window.location.href = `https://wa.me/?text=${encodeURIComponent('Join Train Blazer Force: ' + shareUrl)}`;
      }
  }

  function populateReferralFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const referralValue = params.get('referral');
      if (referralValue) {
          const referralInput = document.getElementById('Referral_Name__c');
          const referralCodeInput = document.getElementById('Referral_Code__c');
          if (referralInput) referralInput.value = referralValue;
          if (referralCodeInput && !referralCodeInput.value) referralCodeInput.value = referralValue;
      }
  }

  // =====================================================
  // SEND TO SALESFORCE
  // =====================================================

  async function saveToSalesforce(data) {

    // Replace this with your Salesforce Site URL
    const SALESFORCE_ENDPOINT =
      "https://d2v000001uzk4eao-dev-ed.my.salesforce-sites.com/services/apexrest/register";

    const response = await fetch(SALESFORCE_ENDPOINT, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(data)

    });

    let result = {};

    try {
      result = await response.json();
    }
    catch (e) {
      console.log("Non JSON response");
    }

    if (!response.ok) {

      throw new Error(
        result.message ||
        "Unable to save record in Salesforce."
      );

    }

    //console.log("Salesforce Response");

    //console.log(result);

    return result;

  }
  
  /**
   * NOTE: This function requires a new Apex REST endpoint in Salesforce.
   * The endpoint should accept an email and return whether it exists.
   * 
   * Example Apex Controller:
   * @RestResource(urlMapping='/checkEmail/*')
   * global with sharing class CheckEmail_Controller {
   *   @HttpGet
   *   global static Map<String, Boolean> isEmailRegistered() {
   *     RestRequest req = RestContext.request;
   *     String email = req.params.get('email');
   *     Map<String, Boolean> response = new Map<String, Boolean>();
   *     
   *     if (String.isBlank(email)) {
   *       response.put('isRegistered', false);
   *       return response;
   *     }
   *     
   *     List<Contact> existingContacts = [SELECT Id FROM Contact WHERE Email = :email LIMIT 1];
   *     response.put('isRegistered', !existingContacts.isEmpty());
   *     return response;
   *   }
   * }
   */
  async function checkEmailInSalesforce(email) {
    const response = await fetch(`https://d2v000001uzk4eao-dev-ed.my.salesforce-sites.com/services/apexrest/checkEmail?email=${encodeURIComponent(email)}`);
    const result = await response.json();
    return result.isRegistered === true;
  }

  async function refreshRegistrationStats() {
    console.log("Refreshing registration stats...");
    const registrationCountEl = document.getElementById("registrationCount");
    // const seatCountEl = document.getElementById("seatCount");

    // if (!registrationCountEl || !seatCountEl) {
    if (!registrationCountEl) {
      return;
    }

    try {

      const response = await fetch(
        "https://d2v000001uzk4eao-dev-ed.my.salesforce-sites.com/services/apexrest/websiteData"
      );

      let data = await response.json();

      if (typeof data === "string") {
        data = JSON.parse(data);
      }

      const registrationCount = Number(data?.registrationCount ?? 0);

      registrationCountEl.textContent = registrationCount;
      // seatCountEl.textContent = Math.max(150 - registrationCount, 0);

    } catch (e) {

      console.error("Unable to refresh registration stats:", e);

    }

  }

  window.addEventListener("load", () => {
    populateReferralFromUrl();
    refreshRegistrationStats();

    setInterval(() => {
      refreshRegistrationStats();
    }, 5000);

  });

  const btn = document.getElementById("toggleWidget");
  const card = document.getElementById("widgetCard");

  if (btn && card) {
    btn.addEventListener("click", () => {
      card.classList.toggle("active");
    });
  }

  const copyReferralCodeBtn = document.getElementById("copyReferralCodeBtn");
  const shareReferralBtn = document.getElementById("shareReferralBtn");

  if (copyReferralCodeBtn) {
    copyReferralCodeBtn.addEventListener("click", copyReferralCode);
  }

  if (shareReferralBtn) {
    shareReferralBtn.addEventListener("click", shareReferralLink);
  }

  let visitors = localStorage.getItem("visitorCount") ? parseInt(localStorage.getItem("visitorCount")) : 7;
  const visitorCountEl = document.getElementById("visitorCount");
  if (visitorCountEl) {
    visitorCountEl.textContent = visitors;
  }

  setInterval(() => {
    visitors++;
    localStorage.setItem("visitorCount", visitors);
    if (visitorCountEl) {
      visitorCountEl.textContent = visitors;
    }
  }, 40000);


  const toggleWidgetEl = document.getElementById("toggleWidget");
  if (toggleWidgetEl) {
    toggleWidgetEl.addEventListener("click", function () {
      gtag("event", "widget_click", {
        button_name: "Toggle Widget"
      });
    });
  }

  const registerBtnEl = document.getElementById("registerBtn");
  if (registerBtnEl) {
    registerBtnEl.addEventListener("click", function () {
      gtag("event", "register_click", {
        button_name: "Register Now"
      });
    });
  }

  // =====================================================
  // COURSE SELECTION
  // =====================================================
  let selectedCourses = [];
  const courseTracker = document.getElementById('course-tracker');
  const courseCountEl = document.getElementById('course-count');
  const courseTrackerBadge = document.getElementById('course-tracker-badge');
  const enrolledCoursesInput = document.getElementById('Enrolled_Courses__c');
  const courseTrackerIcon = document.getElementById('course-tracker-icon');
 
  const coursesView = document.getElementById('tracker-courses-view');

  function updateCourseTracker() {
    const count = selectedCourses.length;
    if (count > 0) {
      // Show selected courses view
      coursesView.style.display = 'flex';
      courseCountEl.textContent = count;
      courseTrackerBadge.textContent = `${count} Course${count > 1 ? 's' : ''} Selected`;
      enrolledCoursesInput.value = selectedCourses.join(';');
    } else {
      // Show default view
      coursesView.style.display = 'none';
      enrolledCoursesInput.value = '';
    }
    // Ensure the main tracker is always visible
    courseTracker.style.display = 'flex';
  }
 
  document.querySelectorAll('.enroll-btn').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const courseName = this.getAttribute('data-course');
      if (courseName) {
        const courseIndex = selectedCourses.indexOf(courseName);
        if (courseIndex > -1) {
          // Course is selected, so deselect it
          selectedCourses.splice(courseIndex, 1);
          this.textContent = "Enroll Now";
          this.classList.remove('enrolled');
        } else {
          // Course is not selected, so select it
          selectedCourses.push(courseName);
          this.textContent = "Selected ✔";
          this.classList.add('enrolled');
        }
        updateCourseTracker();
      }
    });
  });
 
  if (courseTrackerIcon) {
    courseTrackerIcon.addEventListener('click', function() {
      if (selectedCourses.length > 0) {
        // If courses are selected, scroll to registration
        const registrationSection = document.getElementById('section_2');
        if (registrationSection) {
          const header_height = $('.navbar').height() || 0;
          scrollToDiv($(registrationSection), header_height);
        }
      } else {
        // Otherwise, open mail
        window.location.href = 'mailto:support@trainblazerforce.com';
      }
    });
  }

})(window.jQuery);