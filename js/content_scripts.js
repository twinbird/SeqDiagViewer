(function(document) {
  var DEFAULT_AUTO_RELOAD_INTERVAL = 1000;
  var auto_reload_timer = null;
  
  var render_diag = function(diag_code) {
    // strip html tags in diag code.
    // because of chrome append html tags.
    diag_code = diag_code.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g,'');

    //strip carriage return(for seqdiag.js bug)
    diag_code = diag_code.replace(/\r/g, "");
  
    // drawing graph
    try {
      var ast = SeqdiagParser.parse(diag_code);
      var diagram = Seqdiag.DiagramBuilder.build(ast);
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "1024");
      svg.setAttribute("height", "600");
      var drawer = new Seqdiag.Drawer.SVG(diagram, svg, document);
      drawer.draw();
    } catch (e) {
      $(document.body).empty();
      $(document.body).append("Line " + e.offset + ":" + e.message);

      return;
    }
    var img_area = $('<center></center>').append(svg);
    $(document.body).empty();
    $(document.body).append(img_area);
  };
  
  var render_diag_from_url = function() {
    chrome.storage.sync.get("disable_render", function(items) {
      if ((!chrome.runtime.error) && items.disable_render === false) {
        $.ajax({
          url: location.href,
          cache: false,
          success: function(txt) {
            render_diag(txt);
          }
        });
      }
    });
  };
  
  var render_txt_from_url = function() {
    $.ajax({
      url: location.href,
      cache: false,
      success: function(txt) {
        $(document.body).empty();
        $(document.body).append(txt);
      }
    });
  };
  
  var auto_reload_start = function(interval) {
    auto_reload_stop();
    if (interval === undefined) {
      interval = DEFAULT_AUTO_RELOAD_INTERVAL;
    }
    render_diag_from_url();
    auto_reload_timer = setTimeout(auto_reload_start, interval, interval);
  };
  
  var auto_reload_stop = function() {
    clearTimeout(auto_reload_timer);
  };
  
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === "sync") {
      var dr = changes.disable_render;
      var re = changes.reload_enable;
      var ri = changes.reload_interval;
      if (dr !== undefined) {
        if (dr.oldValue === true && dr.newValue === false) {
          main_process_start();
        }
        if (dr.oldValue === false && dr.newValue === true) {
          auto_reload_stop();
          render_txt_from_url();
        }
      }
      if (re !== undefined) {
        if (re.oldValue === true && re.newValue === false) {
          auto_reload_stop();
        }
        if (re.oldValue === false && re.newValue === true) {
          main_process_start();
        }
      }
      if (ri !== undefined) {
        main_process_start();
      }
    }
  });
  
  var main_process_start = function() {
    chrome.storage.sync.get("reload_enable", function(items) {
      if ((!chrome.runtime.error) && items.reload_enable === true) {
        chrome.storage.sync.get("reload_interval", function(items) {
          if ((!chrome.runtime.error) && items.reload_interval > 0) {
            auto_reload_start(items.reload_interval);
          }
        });
      }
    });
    render_diag_from_url();
  };
 
  $(function() {
    main_process_start();
  });
})(document);
