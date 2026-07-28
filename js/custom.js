
  (function ($) {
  
  "use strict";

    // MENU
    $('.navbar-collapse a').on('click',function(){
      $(".navbar-collapse").collapse('hide');
    });
    
    // CUSTOM LINK
    $('.smoothscroll').click(function(){
      var el = $(this).attr('href');
      var elWrapped = $(el);
      var header_height = $('.navbar').height();
  
      scrollToDiv(elWrapped,header_height);
      return false;
  
      function scrollToDiv(element,navheight){
        var offset = element.offset();
        var offsetTop = offset.top;
        var totalScroll = offsetTop-navheight;
  
        $('body,html').animate({
        scrollTop: totalScroll
        }, 300);
      }
    });

    $(window).on('scroll', function(){
      function isScrollIntoView(elem, index) {
        var docViewTop = $(window).scrollTop();
        var docViewBottom = docViewTop + $(window).height();
        var elemTop = $(elem).offset().top;
        var elemBottom = elemTop + $(window).height()*.5;
        if(elemBottom <= docViewBottom && elemTop >= docViewTop) {
          $(elem).addClass('active');
        }
        if(!(elemBottom <= docViewBottom)) {
          $(elem).removeClass('active');
        }
        var MainTimelineContainer = $('#vertical-scrollable-timeline')[0];
        var MainTimelineContainerBottom = MainTimelineContainer.getBoundingClientRect().bottom - $(window).height()*.5;
        $(MainTimelineContainer).find('.inner').css('height',MainTimelineContainerBottom+'px');
      }
      var timeline = $('#vertical-scrollable-timeline li');
      Array.from(timeline).forEach(isScrollIntoView);
    });

    document
    .getElementById("registrationForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();

        const data = {
            firstName: document.getElementById("firstName").value,
            lastName: document.getElementById("lastName").value,
            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value,
            gender: document.getElementById("gender").value,
            graduationType: document.getElementById("graduationType").value,
            course: document.getElementById("course").value,
            year: document.getElementById("year").value,
            college: document.getElementById("college").value,
            salesforceLevel: document.getElementById("salesforceLevel").value
        };

        console.log("Registration Data");
        console.table(data);

        // Call Salesforce
        await saveToSalesforce(data);

    });

    async function saveToSalesforce(data) {
      console.log('data---',data);
      // const accessToken = "YOUR_ACCESS_TOKEN";
  
      // const instanceUrl = "https://your-org.my.salesforce.com";
  
      // const body = {
      //     First_Name__c: data.firstName,
      //     Last_Name__c: data.lastName,
      //     Email__c: data.email,
      //     Phone__c: data.phone,
      //     Gender__c: data.gender,
      //     Graduation_Type__c: data.graduationType,
      //     Course__c: data.course,
      //     Year__c: data.year,
      //     College__c: data.college,
      //     Salesforce_Level__c: data.salesforceLevel
      // };
  
      // try {
  
      //     const response = await fetch(
      //         `${instanceUrl}/services/data/v65.0/sobjects/Student_Registration__c/`,
      //         {
      //             method: "POST",
      //             headers: {
      //                 Authorization: `Bearer ${accessToken}`,
      //                 "Content-Type": "application/json"
      //             },
      //             body: JSON.stringify(body)
      //         }
      //     );
  
      //     const result = await response.json();
  
      //     console.log(result);
  
      //     if (response.ok) {
      //         alert("Registration Successful");
      //     } else {
      //         console.error(result);
      //         alert("Registration Failed");
      //     }
  
      // } catch (error) {
      //     console.error(error);
      // }
  }
  
  })(window.jQuery);

