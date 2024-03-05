import $ from "jquery";

const topImage = document.querySelectorAll('.img-comp-img')[1];
  const slider = document.querySelector('#Custom_slider');    
  const resizeImg = (e) => {  
    topImage.style.width = `${e.target.value}px`
  }

  //slider.addEventListener('mousemove', resizeImg)

  $('#Custom_slider_desktop').mousemove(function(e){
      var max_width = $(this).attr('max');
      var width = e.target.value;
      var wid = width+'px';
      $('.img-comp-img.img-comp-overlay').css('width',wid);

   }); 

$('#Custom_slider_mobile').bind('touchmove', function(e) {
      var max_width = $(this).attr('max');
      var width = e.target.value;
      var wid = width+'px';
      $('.img-comp-img.img-comp-overlay').css('width',wid);
   }); 