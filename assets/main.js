$(function(){
    $('#carouselExampleCaptions').on('slide.bs.carousel', function (e) {
        // console.log(e);
        $('.news-list button').removeClass('active');
        $('.news-list button[data-bs-slide-to='+e.to+']').addClass('active');
    })
})  