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

  $('.smoothscroll').click(function () {

    var el = $(this).attr('href');
    var elWrapped = $(el);
    var header_height = $('.navbar').height();

    scrollToDiv(elWrapped, header_height);

    return false;

    function scrollToDiv(element, navheight) {

      var offset = element.offset();
      var offsetTop = offset.top;
      var totalScroll = offsetTop - navheight;

      $('body, html').animate({
        scrollTop: totalScroll
      }, 300);
    }
  });

  // ==========================
  // TIMELINE
  // ==========================

  $(window).on('scroll', function () {

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

    var timeline = $('#vertical-scrollable-timeline li');

    Array.from(timeline).forEach(isScrollIntoView);

  });

  // =====================================================
  // REGISTRATION FORM
  // =====================================================

  const form = document.getElementById("registrationForm");
  const formMessage = document.getElementById("formMessage");

  function showFormMessage(type, message) {
    if (!formMessage) {
      return;
    }

    formMessage.className = `message-banner ${type}`;
    formMessage.textContent = message;
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

        //console.log("Salesforce Payload");
        //console.table(data);

        await saveToSalesforce(data);

        showFormMessage("success", "Registration successful. You will receive updates on your email and WhatsApp shortly.");
        showReferralModal(data.Referral_Code__c);
        form.reset();

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
              text: 'Register with my referral code and get connected.',
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

  window.addEventListener("load", async () => {

    populateReferralFromUrl();

    try {

      const response = await fetch(
        "https://d2v000001uzk4eao-dev-ed.my.salesforce-sites.com/services/apexrest/websiteData"
      );

      let data = await response.json();

      if (typeof data === "string") {
        data = JSON.parse(data);
      }

      //console.log(data);

      document.getElementById("registrationCount").textContent =
        data.registrationCount;

      document.getElementById("seatCount").textContent =
        150 - Number(data.registrationCount);

    } catch (e) {

      console.error(e);

    }

  });

  const btn = document.getElementById("toggleWidget");
  const card = document.getElementById("widgetCard");

  btn.addEventListener("click", () => {

    card.classList.toggle("active");

  });
  let visitors = 7;

  const copyReferralCodeBtn = document.getElementById("copyReferralCodeBtn");
  const shareReferralBtn = document.getElementById("shareReferralBtn");

  if (copyReferralCodeBtn) {
    copyReferralCodeBtn.addEventListener("click", copyReferralCode);
  }

  if (shareReferralBtn) {
    shareReferralBtn.addEventListener("click", shareReferralLink);
  }

  setInterval(() => {

    visitors++;

    document.getElementById("visitorCount").textContent = visitors;

  }, 40000);

  document
    .getElementById("toggleWidget")
    .addEventListener("click", function () {

      gtag("event", "widget_click", {
        button_name: "Toggle Widget"
      });

    });

  document
    .getElementById("registerBtn")
    .addEventListener("click", function () {

      gtag("event", "register_click", {
        button_name: "Register Now"
      });

    });

})(window.jQuery);