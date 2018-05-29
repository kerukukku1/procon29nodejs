var clickcnt = 1;
document.addEventListener("DOMContentLoaded", function(){
  var elem = document.getElementById('master');
  elem.addEventListener('click', function(){
    anime({
      targets: mass0_0,
      backgroundColor:(clickcnt%2==0)?"#FF0000":"#0000FF",
      duration:3000
    })
    clickcnt++;
  });
  // var elem = document.getElementById('elem');
  // elem.
  //   anime({
  //     targets: elem,
  //     backgroundColor:(clickcnt%2==0)?"#FF0000":"#0000FF",
  //     duration:3000
  //   })
  //   clickcnt++;
  // });
}, false);
