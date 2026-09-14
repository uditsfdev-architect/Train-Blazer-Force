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
    if (!el || el.charAt(0) !== '#') {
      return;
    }
    var elWrapped = $(el);
    if (!elWrapped.length) {
      return false;
    }
    var header_height = $('.navbar-glass').height() || $('.navbar').height() || 0;

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
  // REGISTRATION WIZARD + FORM
  // =====================================================

  let selectedCourses = [];
  let currentWizardStep = 1;
  let step1Complete = false;
  let step2Complete = false;
  let emailAlreadyRegistered = false;
  let isSubmittingRegistration = false;

  const form = document.getElementById("registrationForm");
  const emailInput = document.getElementById("Email__c");
  const submitButton = document.getElementById("registerBtn");
  const formMessage = document.getElementById("formMessage");
  const acceptGuidelines = document.getElementById("acceptGuidelines");
  const continueToStep2Btn = document.getElementById("continueToStep2");
  const continueToStep3Btn = document.getElementById("continueToStep3");
  const backToStep1Btn = document.getElementById("backToStep1");
  const backToStep2Btn = document.getElementById("backToStep2");
  const step1Hint = document.getElementById("step1Hint");
  const wizardSubmitStatus = document.getElementById("wizardSubmitStatus");
  const loaderOverlay = document.getElementById("loaderOverlay");
  const wizardTabs = {
    1: document.getElementById("wizardTab1"),
    2: document.getElementById("wizardTab2"),
    3: document.getElementById("wizardTab3")
  };
  const wizardPanels = {
    1: document.getElementById("wizard-step-1"),
    2: document.getElementById("wizard-step-2"),
    3: document.getElementById("wizard-step-3")
  };
  const batchTypeSelect = document.getElementById("Batch_Type__c");
  const trainingModeSelect = document.getElementById("Training_Mode__c");
  const courseFeeInput = document.getElementById("Course_Fee__c");
  const preferredTimeSlotField = document.getElementById("preferredTimeSlotField");
  const preferredTimeSlotOptions = document.getElementById("preferredTimeSlotOptions");
  const preferredTimeSlotHint = document.getElementById("preferredTimeSlotHint");
  const preferredTimeSlotInput = document.getElementById("Preferred_Time_Slot__c");
  const DAY_START_MINUTES = 7 * 60;
  const DAY_END_MINUTES = 21 * 60;
  const WEEKDAY_SLOT_MINUTES = 90;
  const WEEKEND_SLOT_MINUTES = 210;

  function formatClockLabel(totalMinutes) {
    const hours24 = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
  }

  function buildTimeSlots(intervalMinutes) {
    const slots = [];
    for (
      let start = DAY_START_MINUTES;
      start + intervalMinutes <= DAY_END_MINUTES;
      start += intervalMinutes
    ) {
      slots.push(`${formatClockLabel(start)} - ${formatClockLabel(start + intervalMinutes)}`);
    }
    return slots;
  }

  function getBatchSlotInterval(batchType) {
    if (!batchType) {
      return null;
    }
    if (batchType.includes("Weekend")) {
      return WEEKEND_SLOT_MINUTES;
    }
    if (batchType.includes("Weekday")) {
      return WEEKDAY_SLOT_MINUTES;
    }
    return null;
  }

  function syncPreferredTimeSlotValue() {
    if (!preferredTimeSlotInput || !preferredTimeSlotOptions) {
      return;
    }

    const selected = Array.from(
      preferredTimeSlotOptions.querySelectorAll('input[type="checkbox"]:checked')
    ).map((input) => input.value);

    preferredTimeSlotInput.value = selected.join(";");

    preferredTimeSlotOptions.querySelectorAll(".time-slot-pill").forEach((option) => {
      const checkbox = option.querySelector('input[type="checkbox"]');
      option.classList.toggle("is-selected", Boolean(checkbox && checkbox.checked));
    });
  }

  function renderPreferredTimeSlots(batchType) {
    if (!preferredTimeSlotField || !preferredTimeSlotOptions || !preferredTimeSlotInput) {
      return;
    }

    const intervalMinutes = getBatchSlotInterval(batchType);
    preferredTimeSlotOptions.innerHTML = "";
    preferredTimeSlotInput.value = "";

    if (!intervalMinutes) {
      preferredTimeSlotField.hidden = true;
      return;
    }

    const slots = buildTimeSlots(intervalMinutes);
    const intervalLabel = intervalMinutes === WEEKEND_SLOT_MINUTES ? "3.5-hour" : "1.5-hour";

    if (preferredTimeSlotHint) {
      preferredTimeSlotHint.textContent = `Select one or more ${intervalLabel} slots between 7:00 AM and 9:00 PM.`;
    }

    slots.forEach((slot, index) => {
      const optionId = `preferred_time_slot_${index}`;
      const [startLabel, endLabel] = slot.split(" - ");

      const label = document.createElement("label");
      label.className = "time-slot-pill";
      label.setAttribute("for", optionId);

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = optionId;
      checkbox.className = "time-slot-pill-input";
      checkbox.value = slot;
      checkbox.addEventListener("change", syncPreferredTimeSlotValue);

      const face = document.createElement("span");
      face.className = "time-slot-pill-face";
      face.setAttribute("aria-hidden", "true");

      const check = document.createElement("span");
      check.className = "time-slot-pill-check";

      const text = document.createElement("span");
      text.className = "time-slot-pill-text";

      const start = document.createElement("span");
      start.className = "time-slot-pill-start";
      start.textContent = startLabel;

      const separator = document.createElement("span");
      separator.className = "time-slot-pill-sep";
      separator.textContent = "–";

      const end = document.createElement("span");
      end.className = "time-slot-pill-end";
      end.textContent = endLabel;

      text.appendChild(start);
      text.appendChild(separator);
      text.appendChild(end);
      face.appendChild(check);
      face.appendChild(text);
      label.appendChild(checkbox);
      label.appendChild(face);
      preferredTimeSlotOptions.appendChild(label);
    });

    preferredTimeSlotField.hidden = false;
  }

  if (batchTypeSelect) {
    batchTypeSelect.addEventListener("change", function () {
      renderPreferredTimeSlots(this.value);
    });
    renderPreferredTimeSlots(batchTypeSelect.value);
  }

  function showFormMessage(type, message) {
    if (!formMessage) {
      return;
    }

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

    formMessage.timeoutId = setTimeout(() => {
      showFormMessage(type, "");
    }, 5000);
  }

  function setSubmittingState(isSubmitting) {
    isSubmittingRegistration = isSubmitting;

    if (wizardSubmitStatus) {
      wizardSubmitStatus.hidden = !isSubmitting;
    }

    if (backToStep2Btn) {
      backToStep2Btn.disabled = isSubmitting;
    }

    if (loaderOverlay) {
      loaderOverlay.hidden = !isSubmitting;
      loaderOverlay.style.display = isSubmitting ? "flex" : "none";
    }

    if (submitButton) {
      submitButton.classList.toggle("is-submitting", isSubmitting);
      if (isSubmitting) {
        submitButton.disabled = true;
        submitButton.setAttribute("aria-busy", "true");
        submitButton.textContent = "Registering…";
      } else {
        submitButton.removeAttribute("aria-busy");
      }
    }
  }

  function setSubmitButtonState() {
    if (!submitButton) {
      return;
    }

    if (isSubmittingRegistration) {
      submitButton.disabled = true;
      submitButton.textContent = "Registering…";
      return;
    }

    const guidelinesAccepted = !!(acceptGuidelines && acceptGuidelines.checked);
    const canSubmit =
      step1Complete &&
      step2Complete &&
      currentWizardStep === 3 &&
      guidelinesAccepted &&
      !emailAlreadyRegistered;

    submitButton.disabled = !canSubmit;
    submitButton.textContent = emailAlreadyRegistered
      ? "Email Already Registered"
      : "Register Now";
  }

  function updateWizardProgressUI() {
    [1, 2, 3].forEach((step) => {
      const tab = wizardTabs[step];
      const panel = wizardPanels[step];
      if (!tab || !panel) {
        return;
      }

      const isActive = currentWizardStep === step;
      const isComplete =
        (step === 1 && step1Complete && currentWizardStep > 1) ||
        (step === 2 && step2Complete && currentWizardStep > 2);
      const isLocked =
        (step === 2 && !step1Complete) ||
        (step === 3 && !(step1Complete && step2Complete));

      tab.classList.toggle("is-active", isActive);
      tab.classList.toggle("is-complete", isComplete);
      tab.classList.toggle("is-locked", isLocked);
      tab.disabled = isLocked || isSubmittingRegistration;

      panel.hidden = !isActive;
      panel.classList.toggle("is-active", isActive);
      panel.classList.toggle("is-locked", isLocked);
    });

    if (continueToStep2Btn) {
      continueToStep2Btn.disabled = !step1Complete || isSubmittingRegistration;
      continueToStep2Btn.setAttribute(
        "aria-disabled",
        continueToStep2Btn.disabled ? "true" : "false"
      );
    }

    if (continueToStep3Btn) {
      continueToStep3Btn.disabled = isSubmittingRegistration;
    }

    if (backToStep1Btn) {
      backToStep1Btn.disabled = isSubmittingRegistration;
    }

    if (backToStep2Btn && !isSubmittingRegistration) {
      backToStep2Btn.disabled = false;
    }

    if (step1Hint) {
      if (step1Complete) {
        step1Hint.textContent = `${selectedCourses.length} program${selectedCourses.length > 1 ? "s" : ""} selected. Continue when ready.`;
        step1Hint.classList.add("is-ready");
      } else {
        step1Hint.textContent = "Select at least one program to continue.";
        step1Hint.classList.remove("is-ready");
      }
    }

    setSubmitButtonState();
  }

  function goToWizardStep(step) {
    if (isSubmittingRegistration) {
      return;
    }
    if (step === 2 && !step1Complete) {
      showFormMessage("error", "Please select at least one course before continuing.");
      return;
    }
    if (step === 3 && !(step1Complete && step2Complete)) {
      return;
    }

    currentWizardStep = step;
    updateWizardProgressUI();

    const target = wizardPanels[step] || document.getElementById("section_2");
    if (target) {
      const header_height = $(".navbar").height() || 0;
      scrollToDiv($(target), header_height);
    }
  }

  function validateRegistrationForm() {
    if (!form) {
      return false;
    }

    if (emailAlreadyRegistered) {
      showFormMessage("error", "This email is already registered. Please use a different email.");
      return false;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      showFormMessage("error", "Please complete all required fields before continuing.");
      return false;
    }

    if (!selectedCourses.length) {
      showFormMessage("error", "Please select at least one interested course in Step 1.");
      return false;
    }

    if (
      batchTypeSelect &&
      batchTypeSelect.value &&
      preferredTimeSlotInput &&
      !preferredTimeSlotInput.value.trim()
    ) {
      showFormMessage("error", "Please select at least one preferred time slot.");
      return false;
    }

    return true;
  }

  function resetWizardAfterSuccess() {
    step1Complete = false;
    step2Complete = false;
    emailAlreadyRegistered = false;
    if (acceptGuidelines) {
      acceptGuidelines.checked = false;
    }
    currentWizardStep = 1;
    updateWizardProgressUI();
  }

  if (form) {
    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      if (isSubmittingRegistration) {
        return;
      }

      if (!(step1Complete && step2Complete && currentWizardStep === 3)) {
        showFormMessage("error", "Please complete all steps before submitting.");
        return;
      }

      if (!acceptGuidelines || !acceptGuidelines.checked) {
        showFormMessage("error", "Please accept the program guidelines to continue.");
        setSubmitButtonState();
        return;
      }

      if (!validateRegistrationForm()) {
        goToWizardStep(2);
        return;
      }

      if (!submitButton) {
        return;
      }

      showFormMessage("success", "");
      setSubmittingState(true);

      try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        delete data.acceptGuidelines;
        data.Referral_Code__c = generateReferralCode();
        data.Enrolled_Courses__c = selectedCourses.join(";");
        data.Preferred_Time_Slot__c = preferredTimeSlotInput
          ? preferredTimeSlotInput.value.trim()
          : "";
        data.Course_Fee__c = getCourseFeeTotal();

        saveToSalesforce(data).catch((error) => {
          console.error("Salesforce save failed:", error);
        });

        showFormMessage(
          "success",
          "Registration successful. You will receive updates on your email and WhatsApp shortly."
        );

        form.reset();
        clearStoredReferral();
        selectedCourses = [];
        resetCourseButtons();
        renderPreferredTimeSlots("");
        resetCourseFeeState();
        resetWizardAfterSuccess();
        setSubmittingState(false);
        showReferralModal(data.Referral_Code__c);
      } catch (error) {
        console.error(error);
        showFormMessage("error", error.message || "Registration failed. Please try again.");
        setSubmittingState(false);
      } finally {
        setSubmitButtonState();
      }
    });

    if (emailInput) {
      emailInput.addEventListener("blur", async function () {
        const email = this.value;
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
          return;
        }

        try {
          const isRegistered = await checkEmailInSalesforce(email);
          emailAlreadyRegistered = isRegistered;

          if (isRegistered) {
            showFormMessage(
              "error",
              "This email is already registered. Please use a different email."
            );
          } else if (formMessage && formMessage.textContent.includes("already registered")) {
            showFormMessage("error", "");
          }

          setSubmitButtonState();
        } catch (error) {
          console.error("Email check failed:", error);
        }
      });
    }
  }

  if (continueToStep2Btn) {
    continueToStep2Btn.addEventListener("click", function () {
      if (!step1Complete || isSubmittingRegistration) {
        showFormMessage("error", "Please select at least one course before continuing.");
        return;
      }
      populateReferralFromUrl();
      goToWizardStep(2);
    });
  }

  if (continueToStep3Btn) {
    continueToStep3Btn.addEventListener("click", function () {
      if (isSubmittingRegistration) {
        return;
      }
      if (!step1Complete) {
        goToWizardStep(1);
        return;
      }
      if (!validateRegistrationForm()) {
        return;
      }
      if (!isCourseFeeConfirmed()) {
        openFeeSheet({ proceedOnConfirm: true });
        return;
      }
      step2Complete = true;
      goToWizardStep(3);
    });
  }

  if (backToStep1Btn) {
    backToStep1Btn.addEventListener("click", function () {
      if (isSubmittingRegistration) {
        return;
      }
      goToWizardStep(1);
    });
  }

  if (backToStep2Btn) {
    backToStep2Btn.addEventListener("click", function () {
      if (isSubmittingRegistration || !step1Complete) {
        return;
      }
      goToWizardStep(2);
    });
  }

  if (acceptGuidelines) {
    acceptGuidelines.addEventListener("change", function () {
      setSubmitButtonState();
    });
  }

  Object.keys(wizardTabs).forEach((key) => {
    const tab = wizardTabs[key];
    if (!tab) {
      return;
    }
    tab.addEventListener("click", function () {
      goToWizardStep(Number(key));
    });
  });

  updateWizardProgressUI();

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

      const copyBtn = document.getElementById("copyReferralCodeBtn");
      const copyLabel = copyBtn ? copyBtn.querySelector("span") : null;

      const markCopied = () => {
          if (!copyBtn || !copyLabel) return;
          copyLabel.textContent = "Copied";
          copyBtn.classList.add("is-copied");
          window.setTimeout(() => {
              copyLabel.textContent = "Copy";
              copyBtn.classList.remove("is-copied");
          }, 1600);
      };

      navigator.clipboard.writeText(modalInput.value).then(markCopied).catch(() => {
          modalInput.select();
          document.execCommand('copy');
          markCopied();
      });
  }

  const REFERRAL_STORAGE_KEY = "tbf_referral_code";

  function getReferralLandingUrl(code) {
      const baseUrl = `${window.location.origin}${window.location.pathname.replace(/[^/]+$/, "") || "/"}index.html`;
      return `${baseUrl}?referral=${encodeURIComponent(code)}`;
  }

  function shareReferralLink() {
      const modalInput = document.getElementById("generatedReferralCode");
      if (!modalInput) return;
      const code = modalInput.value;
      const shareUrl = getReferralLandingUrl(code);

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

  function readStoredReferral() {
      try {
          return sessionStorage.getItem(REFERRAL_STORAGE_KEY) || "";
      } catch (e) {
          return "";
      }
  }

  function storeReferral(code) {
      try {
          if (code) {
              sessionStorage.setItem(REFERRAL_STORAGE_KEY, code);
          }
      } catch (e) {
          // Ignore storage failures (private mode, etc.)
      }
  }

  function clearStoredReferral() {
      try {
          sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
      } catch (e) {
          // Ignore storage failures
      }
  }

  function populateReferralFromUrl() {
      const params = new URLSearchParams(window.location.search);
      // Prefer ?referral= from the URL; fall back to sessionStorage so
      // links like index.html#section_2 (which drop the query string) still work.
      const referralFromUrl = (params.get("referral") || "").trim();
      const storedReferral = readStoredReferral();
      const referralValue = referralFromUrl || storedReferral;

      if (!referralValue) {
          return;
      }

      if (referralFromUrl) {
          storeReferral(referralFromUrl);
      }

      const referralInput = document.getElementById("Referral_Name__c");
      if (!referralInput) {
          return;
      }

      // URL always wins; storage only fills an empty field.
      if (referralFromUrl || !referralInput.value) {
          referralInput.value = referralValue;
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

      body: JSON.stringify(data),

      keepalive: true

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

  // Form fields already exist (script is at end of body). Run immediately so
  // referral is filled even if something later delays or skips the load event.
  populateReferralFromUrl();

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
  // COURSE SELECTION + DETAIL SHEET
  // =====================================================
  const courseTracker = document.getElementById("course-tracker");
  const courseCountEl = document.getElementById("course-count");
  const courseTrackerBadge = document.getElementById("course-tracker-badge");
  const enrolledCoursesInput = document.getElementById("Enrolled_Courses__c");
  const courseTrackerIcon = document.getElementById("course-tracker-icon");
  const coursesView = document.getElementById("tracker-courses-view");
  const courseSheet = document.getElementById("courseSheet");
  const courseSheetOverlay = document.getElementById("courseSheetOverlay");
  const courseSheetBack = document.getElementById("courseSheetBack");
  const courseSheetClose = document.getElementById("courseSheetClose");
  const courseSheetInterestBtn = document.getElementById("courseSheetInterestBtn");
  const courseSheetTitle = document.getElementById("courseSheetTitle");
  const courseSheetDesc = document.getElementById("courseSheetDesc");
  const courseSheetDuration = document.getElementById("courseSheetDuration");
  const courseSheetOffer = document.getElementById("courseSheetOffer");
  const courseSheetRegular = document.getElementById("courseSheetRegular");
  const courseSheetFeatures = document.getElementById("courseSheetFeatures");
  const courseSheetIcon = document.getElementById("courseSheetIcon");

  const COURSE_CATALOG = {
    "Campus-to-Career Program": {
      title: "Campus-to-Career Program",
      tone: "student",
      icon: "bi-mortarboard-fill",
      duration: "60 Days",
      offer: "₹3999",
      regular: "₹5999",
      description:
        "For UG/PG students (B.Tech, BCA, MCA, B.Sc and more) building Salesforce Admin, Developer, and AI fundamentals.",
      features: [
        "Salesforce Admin",
        "Salesforce Developer",
        "AI & Agentforce Basics",
        "Assignments & Quizzes",
        "Study Materials",
        "Certificate of Completion"
      ]
    },
    "Career Switch Program": {
      title: "Career Switch Program",
      tone: "career",
      icon: "bi-people-fill",
      duration: "70 Days",
      offer: "₹4999",
      regular: "₹7999",
      description:
        "For working professionals who want to switch into Salesforce / upgrade Salesforce skills with Admin, Developer, and modern AI tools.",
      features: [
        "Salesforce Admin + Developer",
        "Apex, SOQL & LWC",
        "Git, VS Code & SFDX",
        "AI Tools (Copilot / Cursor)",
        "Integrations Basics",
        "Certificate of Completion"
      ]
    },
    "Job Ready Program": {
      title: "Job Ready Program",
      tone: "interview",
      icon: "bi-chat-dots-fill",
      duration: "90 Days",
      offer: "₹5999",
      regular: "₹9999",
      description:
        "Structured Salesforce + AI learning path with interview preparation topics to strengthen confidence before interviews.",
      features: [
        "Admin + Developer Coverage",
        "Interview Preparation Topics",
        "Technical Q&A Practice",
        "LinkedIn Branding Tips",
        "Assignments & Guidance",
        "Certificate of Completion"
      ]
    }
  };

  const ONLINE_FEE_ADDON = 2000;
  const WEEKEND_FEE_ADDON = 2000;
  const feeSummary = document.getElementById("feeSummary");
  const feeSummaryTotal = document.getElementById("feeSummaryTotal");
  const feeSummaryCombo = document.getElementById("feeSummaryCombo");
  const feeSummaryChips = document.getElementById("feeSummaryChips");
  const feeSummaryCourses = document.getElementById("feeSummaryCourses");
  const reviewFeeBtn = document.getElementById("reviewFeeBtn");
  const feeSheet = document.getElementById("feeSheet");
  const feeSheetOverlay = document.getElementById("feeSheetOverlay");
  const feeSheetClose = document.getElementById("feeSheetClose");
  const feeSheetStayBtn = document.getElementById("feeSheetStayBtn");
  const feeSheetConfirmBtn = document.getElementById("feeSheetConfirmBtn");
  const feeSheetMode = document.getElementById("feeSheetMode");
  const feeSheetBatch = document.getElementById("feeSheetBatch");
  const feeSheetCourses = document.getElementById("feeSheetCourses");
  const feeBaseAmount = document.getElementById("feeBaseAmount");
  const feeBaseLabel = document.getElementById("feeBaseLabel");
  const feeOnlineRow = document.getElementById("feeOnlineRow");
  const feeWeekendRow = document.getElementById("feeWeekendRow");
  const feeTotalAmount = document.getElementById("feeTotalAmount");
  let lastConfirmedFeeKey = "";
  let hasAutoOpenedFeeSheet = false;
  let proceedToStep3AfterFeeConfirm = false;
  let isSyncingFeeSelects = false;

  function parseRupeeAmount(value) {
    const amount = Number(String(value || "").replace(/[^\d]/g, ""));
    return Number.isFinite(amount) ? amount : 0;
  }

  function formatRupeeAmount(amount) {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  }

  function getCatalogCourseNames() {
    return Object.keys(COURSE_CATALOG);
  }

  function courseOptionId(container, courseName) {
    return `${container.id}_${String(courseName).replace(/[^a-z0-9]+/gi, "_")}`;
  }

  function renderCourseFeeOptions(container) {
    if (!container) {
      return;
    }

    container.innerHTML = getCatalogCourseNames()
      .map((name) => {
        const course = COURSE_CATALOG[name];
        const selected = selectedCourses.includes(name);
        const optionId = courseOptionId(container, name);
        return `
          <label class="fee-course-option${selected ? " is-selected" : ""}" for="${optionId}">
            <input type="checkbox" id="${optionId}" value="${name}" ${selected ? "checked" : ""}>
            <span class="fee-course-option-copy">
              <strong>${course.title}</strong>
              <small>${course.duration} · Launch ${course.offer}</small>
            </span>
          </label>
        `;
      })
      .join("");

    container.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.addEventListener("change", function () {
        onFeeCourseOptionChange(container, this);
      });
    });
  }

  function syncCourseFeeOptions() {
    [feeSummaryCourses, feeSheetCourses].forEach((container) => {
      if (!container) {
        return;
      }
      if (!container.children.length) {
        renderCourseFeeOptions(container);
        return;
      }
      container.querySelectorAll('input[type="checkbox"]').forEach((input) => {
        const selected = selectedCourses.includes(input.value);
        input.checked = selected;
        const option = input.closest(".fee-course-option");
        if (option) {
          option.classList.toggle("is-selected", selected);
        }
      });
    });
  }

  function onFeeCourseOptionChange(container, input) {
    const nextCourses = Array.from(
      container.querySelectorAll('input[type="checkbox"]:checked')
    ).map((item) => item.value);

    if (!nextCourses.length) {
      input.checked = true;
      const option = input.closest(".fee-course-option");
      if (option) {
        option.classList.add("is-selected");
      }
      showFormMessage("error", "Please keep at least one course selected.");
      return;
    }

    selectedCourses = nextCourses;
    updateCourseTracker();
  }

  function getSelectedTrainingMode() {
    return trainingModeSelect ? trainingModeSelect.value : "";
  }

  function getSelectedBatchType() {
    return batchTypeSelect ? batchTypeSelect.value : "";
  }

  function getCourseFeeBreakdown(mode, batchType) {
    const selectedMode = mode == null ? getSelectedTrainingMode() : mode;
    const selectedBatch = batchType == null ? getSelectedBatchType() : batchType;
    const base = selectedCourses.reduce((sum, name) => {
      const course = COURSE_CATALOG[name];
      return sum + (course ? parseRupeeAmount(course.offer) : 0);
    }, 0);
    const onlineAddon = selectedMode === "Online" ? ONLINE_FEE_ADDON : 0;
    const weekendAddon = selectedBatch === "Weekend" ? WEEKEND_FEE_ADDON : 0;

    return {
      mode: selectedMode,
      batchType: selectedBatch,
      base,
      onlineAddon,
      weekendAddon,
      total: base + onlineAddon + weekendAddon
    };
  }

  function getCourseFeeKey(breakdown) {
    const fee = breakdown || getCourseFeeBreakdown();
    return [selectedCourses.slice().sort().join(";"), fee.mode, fee.batchType, fee.total].join("|");
  }

  function getCourseFeeTotal() {
    return getCourseFeeBreakdown().total;
  }

  function isFeeSheetOpen() {
    return Boolean(feeSheet && !feeSheet.hidden);
  }

  function isCourseFeeConfirmed() {
    const fee = getCourseFeeBreakdown();
    return Boolean(fee.mode && fee.batchType && lastConfirmedFeeKey === getCourseFeeKey(fee));
  }

  function confirmCourseFee() {
    const fee = getCourseFeeBreakdown();
    if (!selectedCourses.length) {
      showFormMessage("error", "Please select at least one course.");
      return false;
    }

    if (!fee.mode || !fee.batchType) {
      showFormMessage("error", "Please select a training mode and batch type.");
      return false;
    }

    lastConfirmedFeeKey = getCourseFeeKey(fee);
    if (courseFeeInput) {
      courseFeeInput.value = String(fee.total);
    }
    refreshCourseFeeDisplay({ autoOpen: false });
    return true;
  }

  function syncFeeSheetSelectsFromForm() {
    if (!feeSheetMode || !feeSheetBatch) {
      return;
    }

    isSyncingFeeSelects = true;
    feeSheetMode.value = getSelectedTrainingMode();
    feeSheetBatch.value = getSelectedBatchType();
    isSyncingFeeSelects = false;
  }

  function applyFeeSheetSelectionsToForm() {
    if (!trainingModeSelect || !batchTypeSelect || !feeSheetMode || !feeSheetBatch) {
      return;
    }

    const previousBatch = batchTypeSelect.value;
    isSyncingFeeSelects = true;
    trainingModeSelect.value = feeSheetMode.value;
    batchTypeSelect.value = feeSheetBatch.value;
    isSyncingFeeSelects = false;
    if (previousBatch !== batchTypeSelect.value) {
      renderPreferredTimeSlots(batchTypeSelect.value);
    }
  }

  function refreshCourseFeeDisplay(options) {
    const autoOpen = Boolean(options && options.autoOpen);
    const fee = getCourseFeeBreakdown();
    const hasPreferences = Boolean(fee.mode && fee.batchType);
    const hasCourses = selectedCourses.length > 0;
    const addonParts = [];

    if (fee.onlineAddon) {
      addonParts.push("Online +₹2,000");
    }
    if (fee.weekendAddon) {
      addonParts.push("Weekend +₹2,000");
    }

    if (courseFeeInput) {
      courseFeeInput.value = hasPreferences ? String(fee.total) : "";
    }

    if (feeSummary) {
      feeSummary.hidden = !(hasPreferences && hasCourses);
    }

    if (feeSummaryTotal) {
      feeSummaryTotal.textContent = formatRupeeAmount(fee.total);
    }

    if (feeSummaryCombo) {
      feeSummaryCombo.textContent = hasPreferences ? `${fee.mode} · ${fee.batchType}` : "";
    }

    if (feeSummaryChips) {
      feeSummaryChips.innerHTML = addonParts
        .map((part) => `<span class="fee-summary-chip">${part}</span>`)
        .join("");
    }

    if (feeBaseLabel) {
      if (selectedCourses.length === 1) {
        feeBaseLabel.textContent = `${selectedCourses[0]} launch fee`;
      } else if (selectedCourses.length > 1) {
        feeBaseLabel.textContent = "Combined program launch fee";
      } else {
        feeBaseLabel.textContent = "Program launch fee";
      }
    }

    if (feeBaseAmount) {
      feeBaseAmount.textContent = formatRupeeAmount(fee.base);
    }

    if (feeTotalAmount) {
      feeTotalAmount.textContent = formatRupeeAmount(fee.total);
    }

    if (feeOnlineRow) {
      feeOnlineRow.hidden = !fee.onlineAddon;
    }

    if (feeWeekendRow) {
      feeWeekendRow.hidden = !fee.weekendAddon;
    }

    if (feeSheetConfirmBtn) {
      feeSheetConfirmBtn.textContent = proceedToStep3AfterFeeConfirm
        ? "Confirm and continue"
        : "Confirm fee";
    }

    if (
      autoOpen &&
      hasPreferences &&
      hasCourses &&
      !hasAutoOpenedFeeSheet &&
      !isFeeSheetOpen() &&
      !isSyncingFeeSelects
    ) {
      hasAutoOpenedFeeSheet = true;
      openFeeSheet({ proceedOnConfirm: false });
    }
  }

  function closeFeeSheet() {
    if (!feeSheet || !feeSheetOverlay) {
      return;
    }

    proceedToStep3AfterFeeConfirm = false;
    feeSheet.classList.remove("is-open");
    document.body.classList.remove("fee-sheet-open");

    window.setTimeout(() => {
      if (!feeSheet.classList.contains("is-open")) {
        feeSheet.hidden = true;
        feeSheetOverlay.hidden = true;
      }
    }, 220);
  }

  function openFeeSheet(options) {
    if (!feeSheet || !feeSheetOverlay) {
      return;
    }

    proceedToStep3AfterFeeConfirm = Boolean(options && options.proceedOnConfirm);
    syncFeeSheetSelectsFromForm();
    syncCourseFeeOptions();
    refreshCourseFeeDisplay({ autoOpen: false });

    feeSheetOverlay.hidden = false;
    feeSheet.hidden = false;
    document.body.classList.add("fee-sheet-open");

    requestAnimationFrame(() => {
      feeSheet.classList.add("is-open");
    });
  }

  function resetCourseFeeState() {
    lastConfirmedFeeKey = "";
    hasAutoOpenedFeeSheet = false;
    proceedToStep3AfterFeeConfirm = false;
    if (courseFeeInput) {
      courseFeeInput.value = "";
    }
    refreshCourseFeeDisplay({ autoOpen: false });
    closeFeeSheet();
  }

  function handleFeeConfirmation() {
    if (!confirmCourseFee()) {
      return;
    }

    const shouldContinue = proceedToStep3AfterFeeConfirm;
    closeFeeSheet();

    if (!shouldContinue) {
      return;
    }

    if (!validateRegistrationForm()) {
      return;
    }

    step2Complete = true;
    goToWizardStep(3);
  }

  function onTrainingPreferenceChanged(source) {
    if (isSyncingFeeSelects) {
      refreshCourseFeeDisplay({ autoOpen: false });
      return;
    }

    if (source === "sheet") {
      applyFeeSheetSelectionsToForm();
    } else {
      syncFeeSheetSelectsFromForm();
    }

    refreshCourseFeeDisplay({ autoOpen: source === "form" });
  }

  function syncProgramListCards() {
    document.querySelectorAll(".program-list-card").forEach((card) => {
      const courseName = card.getAttribute("data-course");
      const selected = selectedCourses.includes(courseName);
      card.classList.toggle("is-selected", selected);
    });
  }

  function syncSheetInterestButton(courseName) {
    if (!courseSheetInterestBtn || !courseName) {
      return;
    }

    const selected = selectedCourses.includes(courseName);
    courseSheetInterestBtn.dataset.course = courseName;
    courseSheetInterestBtn.classList.toggle("enrolled", selected);
    courseSheetInterestBtn.textContent = selected ? "Selected" : "Yes, Interested";
  }

  function closeCourseSheet() {
    if (!courseSheet || !courseSheetOverlay) {
      return;
    }

    courseSheet.classList.remove("is-open");
    document.body.classList.remove("course-sheet-open");

    window.setTimeout(() => {
      courseSheet.hidden = true;
      courseSheetOverlay.hidden = true;
    }, 220);
  }

  function openCourseSheet(courseName) {
    const course = COURSE_CATALOG[courseName];
    if (!course || !courseSheet || !courseSheetOverlay) {
      return;
    }

    courseSheetTitle.textContent = course.title;
    courseSheetDesc.textContent = course.description;
    courseSheetDuration.textContent = course.duration;
    courseSheetOffer.textContent = course.offer;
    courseSheetRegular.innerHTML = `<del>${course.regular}</del>`;
    courseSheetFeatures.innerHTML = course.features
      .map((item) => `<li>${item}</li>`)
      .join("");

    courseSheetIcon.className = `course-sheet-icon tone-${course.tone}`;
    courseSheetIcon.innerHTML = `<i class="bi ${course.icon}"></i>`;

    syncSheetInterestButton(courseName);

    courseSheetOverlay.hidden = false;
    courseSheet.hidden = false;
    document.body.classList.add("course-sheet-open");

    requestAnimationFrame(() => {
      courseSheet.classList.add("is-open");
    });
  }

  function toggleCourseSelection(courseName) {
    if (!courseName) {
      return;
    }

    const courseIndex = selectedCourses.indexOf(courseName);
    if (courseIndex > -1) {
      selectedCourses.splice(courseIndex, 1);
    } else {
      selectedCourses.push(courseName);
    }

    updateCourseTracker();
    syncSheetInterestButton(courseName);
  }

  function updateCourseTracker() {
    const count = selectedCourses.length;
    step1Complete = count > 0;

    if (!step1Complete) {
      step2Complete = false;
      if (currentWizardStep > 1) {
        currentWizardStep = 1;
      }
      if (acceptGuidelines) {
        acceptGuidelines.checked = false;
      }
    }

    if (coursesView && courseCountEl && courseTrackerBadge) {
      if (count > 0) {
        coursesView.style.display = "flex";
        courseCountEl.textContent = count;
        courseTrackerBadge.textContent = `${count} Course${count > 1 ? "s" : ""} Selected`;
      } else {
        coursesView.style.display = "none";
      }
    }

    if (enrolledCoursesInput) {
      enrolledCoursesInput.value = count > 0 ? selectedCourses.join(";") : "";
    }

    if (courseTracker) {
      courseTracker.style.display = "flex";
    }

    syncProgramListCards();
    syncCourseFeeOptions();
    refreshCourseFeeDisplay({ autoOpen: false });
    updateWizardProgressUI();
  }

  function resetCourseButtons() {
    syncProgramListCards();
    if (courseSheetInterestBtn) {
      courseSheetInterestBtn.classList.remove("enrolled");
      courseSheetInterestBtn.textContent = "Yes, Interested";
    }
    updateCourseTracker();
  }

  document.querySelectorAll("[data-open-course]").forEach((card) => {
    card.addEventListener("click", function () {
      openCourseSheet(this.getAttribute("data-open-course"));
    });
  });

  if (courseSheetInterestBtn) {
    courseSheetInterestBtn.addEventListener("click", function (e) {
      e.preventDefault();
      const courseName = this.getAttribute("data-course");
      toggleCourseSelection(courseName);
      closeCourseSheet();
    });
  }

  if (courseSheetOverlay) {
    courseSheetOverlay.addEventListener("click", closeCourseSheet);
  }

  if (courseSheetBack) {
    courseSheetBack.addEventListener("click", closeCourseSheet);
  }

  if (courseSheetClose) {
    courseSheetClose.addEventListener("click", closeCourseSheet);
  }

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") {
      return;
    }
    if (feeSheet && !feeSheet.hidden) {
      closeFeeSheet();
      return;
    }
    if (courseSheet && !courseSheet.hidden) {
      closeCourseSheet();
    }
  });

  if (trainingModeSelect) {
    trainingModeSelect.addEventListener("change", function () {
      onTrainingPreferenceChanged("form");
    });
  }

  if (batchTypeSelect) {
    batchTypeSelect.addEventListener("change", function () {
      onTrainingPreferenceChanged("form");
    });
  }

  if (feeSheetMode) {
    feeSheetMode.addEventListener("change", function () {
      onTrainingPreferenceChanged("sheet");
    });
  }

  if (feeSheetBatch) {
    feeSheetBatch.addEventListener("change", function () {
      onTrainingPreferenceChanged("sheet");
    });
  }

  if (reviewFeeBtn) {
    reviewFeeBtn.addEventListener("click", function () {
      openFeeSheet({ proceedOnConfirm: false });
    });
  }

  if (feeSheetOverlay) {
    feeSheetOverlay.addEventListener("click", closeFeeSheet);
  }

  if (feeSheetClose) {
    feeSheetClose.addEventListener("click", closeFeeSheet);
  }

  if (feeSheetStayBtn) {
    feeSheetStayBtn.addEventListener("click", function () {
      if (!confirmCourseFee()) {
        return;
      }
      closeFeeSheet();
    });
  }

  if (feeSheetConfirmBtn) {
    feeSheetConfirmBtn.addEventListener("click", handleFeeConfirmation);
  }

  renderCourseFeeOptions(feeSummaryCourses);
  renderCourseFeeOptions(feeSheetCourses);

  if (courseTrackerIcon) {
    courseTrackerIcon.addEventListener("click", function () {
      if (selectedCourses.length > 0) {
        const registrationSection = document.getElementById("section_2");
        if (registrationSection) {
          const header_height = $(".navbar-glass").height() || $(".navbar").height() || 0;
          scrollToDiv($(registrationSection), header_height);
        }
      } else {
        window.location.href = "mailto:support@trainblazerforce.com";
      }
    });
  }

})(window.jQuery);
