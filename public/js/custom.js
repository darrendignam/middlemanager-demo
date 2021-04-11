// SCROLL BG COLOR
$(window).scroll(function() {
    var $window = $(window),
        $body = $('body'),
        $panel = $('section, footer, header');

    var scroll = $window.scrollTop() + ($window.height() / 3);

    $panel.each(function () {
        var $this = $(this);
        if ($this.position().top <= scroll && $this.position().top + $this.height() > scroll) {

            $body.removeClass(function (index, css) {
                return (css.match (/(^|\s)color-\S+/g) || []).join(' ');
            });

            $body.addClass('color-' + $(this).data('color'));
        }
    });    

}).scroll();

// data-color="dark"

/** GENERALS */
/** ===================== */

var win = $(window);

// viewport dimensions
var ww = win.width();
var wh = win.height();

$(document).ready(function() {

    // load functions
    imageBG();
   

});

win.on('load', function() {

    setTimeout(function() {
        $('#preloader').addClass('hide');
    }, 500);

    // load functions
   

});



/** BACKGROUND IMAGES */
/** ===================== */

function imageBG() {

    $('.imageBG').each(function() {
        var image = $(this).data('img');

        $(this).css({
            backgroundImage: 'url(' + image + ')',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
        });
    });

}







