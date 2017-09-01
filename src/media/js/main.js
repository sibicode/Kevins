// Слайдер преимущества
$slick_slider = $('.about__list');
settings = {
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    arrows: false,
    dots: true,
    dotsClass: 'about-dots',
    mobileFirst: true,
    responsive: [{
        breakpoint: 767,
        settings: 'unslick'
    }]
}
$slick_slider.slick(settings);

function windowSize() {
    if ($(window).width() > 767) {

        if ($slick_slider.hasClass('slick-initialized')) {
            $slick_slider.slick('unslick');
        }
    }
}
$(window).on('load', windowSize);

$(window).on('resize', function () {
    if ($(window).width() > 767) {
        if ($slick_slider.hasClass('slick-initialized')) {
            $slick_slider.slick('unslick');
        }
        return
    }

    if (!$slick_slider.hasClass('slick-initialized')) {
        return $slick_slider.slick(settings);
    }
});


var checkBoxes = $('.reg-form__checkbox');
checkBoxes.change(function () {
    $('#reg-form-btn').prop('disabled', checkBoxes.filter(':checked').length < 1);
});
checkBoxes.change();