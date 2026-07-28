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

    if (form) {

        form.addEventListener("submit", async function (event) {

            event.preventDefault();

            const submitButton = form.querySelector('input[type="submit"]');

            submitButton.disabled = true;
            submitButton.value = "Registering...";
            document.getElementById("loaderOverlay").style.display = "flex";

            try {

                // Convert form directly into JSON
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());

                console.log("Salesforce Payload");
                console.table(data);

                await saveToSalesforce(data);

                alert("🎉 Registration Successful!");

                form.reset();

            }
            catch (error) {

                console.error(error);

                alert("Registration Failed.\n\n" + error.message);

            }
            finally {

                submitButton.disabled = false;
                submitButton.value = "Register Now";
                document.getElementById("loaderOverlay").style.display = "none";

            }

        });

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

        console.log("Salesforce Response");

        console.log(result);

        return result;

    }

})(window.jQuery);