load_scripts = new Set();
async function cirosantilli_load_scripts(script_urls) {
    function load(script_url) {
        return new Promise(function(resolve, reject) {
            if (load_scripts.has(script_url)) {
                resolve();
            } else {
                var script = document.createElement('script');
                script.onload = resolve;
                script.src = script_url
                document.head.appendChild(script);
            }
        });
    }
    var promises = [];
    for (const script_url of script_urls) {
        promises.push(load(script_url));
    }
    await Promise.all(promises);
    for (const script_url of script_urls) {
        load_scripts.add(script_url);
    }
}

function extend_jquery_with_polarlib($) {

  $.fn.polartimer = function(method) {
    // Method calling logic
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    }
    else if (typeof method === 'object' || ! method) {
      return methods.init.apply(this, arguments);
    }
    else {
      $.error('Method ' + method + ' does not exist on jQuery.polartimer');
    }
  };

  var methods = {
    init : function(options) {
      var state = {
        timerSeconds : 10,
        callback : function() {
        },
        color : '#CCC',
        opacity : 1
      };
      state = $.extend(state, options);

      return this.each(function() {
        var $this = $(this);
        var data = $this.data('polartimer');
        if (! data) {
          $this.addClass('polartimer');
          $this.height($this.width());
          state.timer = null;
          state.timerCurrent = 0;
          state.pi2 = Math.PI * 2;
          state.piOver2 = Math.PI / 2;
          state.width = $this.width();
          state.height = $this.height();
          if (Snap) {
            state.paper = Snap(state.width, state.height);
            state.paper.node.style = 'overflow: hidden; position: relative;';
            $($this.context).append(state.paper.node);
          } else {
            state.paper = Raphael($this.context, state.width, state.height);
          }
          $this.data('polartimer', state);
        }
      });
    },

    stopWatch : function() {
      return this.each(function() {
        var data = $(this).data('polartimer');
        if (data) {
          var seconds = (data.timerFinish - (new Date().getTime())) / 1000;
          if(seconds <= 0) {
            clearInterval(data.timer);
            $(this).polartimer('drawTimer', 100);
            data.callback();
          }
          else {
            var percent = 100 - ((seconds / (data.timerSeconds)) * 100);
            $(this).polartimer('drawTimer', percent);
          }
        }
      });
    },

    drawTimer : function(percent) {
      return this.each(function() {
        $this = $(this);
        var data = $this.data('polartimer');
        if (data) {
          var w = data.width;
          var h = data.height;
          var cx = w / 2;

          data.paper.clear();

          if (percent == 100) {
            data.paper.circle(cx, cx, cx).attr({
              fill : data.color,
              stroke : 'none',
              opacity : data.opacity
            });
          }
          else {
            var theta = data.pi2 * percent / 100 - data.piOver2;
            var x1 = Math.cos(theta) * cx + cx;
            var y1 = Math.sin(theta) * cx + cx;

            var longArcFlag = (percent <= 50) ? 0 : 1;

            var path = "M" + cx + "," + cx + " L" + cx + ",0 ";
            path += "A" + cx + "," + cx + " 0 " + longArcFlag + ",1 " + x1 + "," + y1 + " ";
            path += "L" + cx + "," + cx + "z";

            var frame = data.paper.path(path);
            frame.attr({
              fill : data.color,
              stroke : 'none',
              opacity : data.opacity
            });
          }
        }
      });
    },

    start : function(percent) {
      return this.each(function() {
        var data = $(this).data('polartimer');
        if (data) {
          if (percent < 0 || !percent) percent = 0;
          if (percent > 100) percent = 100;
          clearInterval(data.timer);
          data.resumeSeconds = null; // clears paused state
          data.timerFinish = new Date().getTime() + (data.timerSeconds * 1000) * (1 - percent / 100);
          $(this).polartimer('drawTimer', percent);
          var id = $this.attr('id');
          data.timer = (! id || id === "") ?
            setInterval("$this.polartimer('stopWatch')", 50) :
            setInterval("$('#"+id+"').polartimer('stopWatch')", 50);
        }
      });
    },

    pause : function() {
      return this.each(function() {
        var data = $(this).data('polartimer');
        if (data && ! data.resumeSeconds) {
          data.resumeSeconds = (data.timerFinish - (new Date().getTime())) / 1000;
          clearInterval(data.timer);
        }
      });
    },

    resume : function() {
      return this.each(function() {
        var data = $(this).data('polartimer');
        if (data && data.resumeSeconds) {
          clearInterval(data.timer);
          data.timerFinish = new Date().getTime() + (data.resumeSeconds * 1000);
          $(this).polartimer('drawTimer', 100 * (data.timerSeconds - data.resumeSeconds) / data.timerSeconds);
          data.resumeSeconds = null;
          var id = $this.attr('id');
          data.timer = (! id || id === "") ?
            setInterval("$this.polartimer('stopWatch')", 50) :
            setInterval("$('#"+id+"').polartimer('stopWatch')", 50);
        }
      });
    },

    reset : function() {
      return this.each(function() {
        var data = $(this).data('polartimer');
        if (data) {
          clearInterval(data.timer);
          data.resumeSeconds = null; // clears paused state
          $(this).polartimer('drawTimer', 0);
        }
      });
    },

    destroy : function() {
      return this.each(function() {
        var $this = $(this);
        var data = $this.data('polartimer');
        if (data) {
          clearInterval(data.timer);
          data.paper.remove();
          $this.removeData('polartimer');
        }
      });
    }

  };
}

var sheet = window.document.styleSheets[0];
sheet.insertRule('#javascript_timer { width: 150px; height: 150px; padding: 0.5em; border-style: solid;}');

(async () => {
    await cirosantilli_load_scripts([
        'https://code.jquery.com/jquery-1.12.4.js',
        'https://code.jquery.com/ui/1.12.1/jquery-ui.js',
        'https://cdnjs.cloudflare.com/ajax/libs/snap.svg/0.5.1/snap.svg-min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/raphael/2.3.0/raphael.min.js'
    ]);

    extend_jquery_with_polarlib($);

    var myDiv = document.createElement("div");
 
	//Set its unique ID.
	myDiv.id = 'javascript_timer';
	 
	//Add your content to the DIV
	// myDiv.innerHTML = "<p>Drag me Around</p>";
	myDiv.setAttribute("class", "ui-widget-content");
	//Finally, append the element to the HTML body
	document.body.appendChild(myDiv);

	$( function() {
		$( "#javascript_timer" ).draggable();
	} );

	$('#javascript_timer').polartimer({
  		timerSeconds: 6
	});

	$('#javascript_timer').polartimer('start');

	console.log("loaded");
})();
