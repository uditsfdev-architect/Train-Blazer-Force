// Safe section scroll highlighting (legacy TemplateMo helper)
var sectionArray = [1, 2, 5];

$.each(sectionArray, function (index, value) {
  var $section = $("#section_" + value);
  if (!$section.length) {
    return;
  }

  $(document).scroll(function () {
    var offsetSection = $section.offset().top - 75;
    var docScroll1 = $(document).scrollTop() + 1;

    if (docScroll1 >= offsetSection) {
      $(".navbar-nav .nav-item .nav-link").removeClass("active");
      $(".navbar-nav .nav-item .nav-link:link").addClass("inactive");
      $(".navbar-nav .nav-item .nav-link").eq(index).addClass("active");
      $(".navbar-nav .nav-item .nav-link").eq(index).removeClass("inactive");
    }
  });

  $(".click-scroll")
    .eq(index)
    .click(function (e) {
      var offsetClick = $section.offset().top - 75;
      e.preventDefault();
      $("html, body").animate(
        {
          scrollTop: offsetClick
        },
        300
      );
    });
});

$(document).ready(function () {
  if (!$(".navbar-nav .nav-item .nav-link").length) {
    return;
  }
  $(".navbar-nav .nav-item .nav-link:link").addClass("inactive");
  $(".navbar-nav .nav-item .nav-link").eq(0).addClass("active");
  $(".navbar-nav .nav-item .nav-link:link").eq(0).removeClass("inactive");
});
