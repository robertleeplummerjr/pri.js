'use strict';

/**
 * Persistent Request Intercept
 * @param {Window} scope
 * @param {Object} settings
 */
var pri = (function(undefined) {
  var activeRequests  = []
    , inactiveRequests= []
    , isDeployed      = false
    , defaultSettings = {
        allRequestsDone: null,
        load           : null,
        error          : null,
        beforeLoad     : null,
        close          : null,
        persist        : true
      }
    ;

  function whenScopeResets(scope, cb, seconds) {
    seconds = seconds || 0;

    var int = setInterval(function() {
      try {
        //here we listen to when the state of XMLHttpRequest changes
        //in IE when the state changes, it throws an error, again indicating that the state has changed
        if (scope.XMLHttpRequest.isDeployed === undefined) {
          clearInterval(int);
          cb();
        }
      } catch(e) {
        clearInterval(int);
        cb();
      }
    }, seconds);
  }

  function pri(scope, _settings) {
    if (scope === undefined) throw new Error('window object is required so as to intercept');
    environmentCorrection(scope);

    var XMLHttpRequest = scope.XMLHttpRequest
      , settings = defaultSettings.extend(_settings)
      ;

    scope.addEventListener('beforeunload', function() {
      //window is about to change into a new window
      whenScopeResets(scope, function() {
        try {
          //because window has not cleaned up XMLHttpRequest, we can infer that it is about to be closed
          //in IE, scope is no longer accessible, throwing an error, thus the try and because we do not have access, we can again infer that it is about to be closed
          if (scope.XMLHttpRequest === RequestListener) {
            if (settings.close) {
              settings.close(scope);
            }
            return;
          }
        } catch (e) {
          if (settings.close) {
            settings.close(scope);
          }
          return;
        }

        if (settings.persist) {
          pri(scope.window, settings);
        }

        if (scope.window.onbeforeload) {
          scope.window.onbeforeload();
        }

        if (settings.beforeLoad !== null) {
          settings.beforeLoad(scope.window);
        }
      });
    });

    function RequestListener(objParameters) {
      var self = this
        , realRequest = this.realRequest = new XMLHttpRequest(objParameters)
        ;

      realRequest.onload = function() {
        self.removeActiveRequest();

        if (self.onload) {
          self.onload.apply(realRequest, arguments);
        }
        if (settings.load) {
          settings.load.apply(realRequest, arguments);
        }

        self.checkActiveRequestsState();

        return self;
      };

      realRequest.onerror = function() {
        if (self.onerror !== null) {
          self.onerror.apply(realRequest, arguments);
        }
        if (settings.error !== null) {
          settings.error.apply(realRequest, arguments);
        }

        return self;
      };
    }

    RequestListener.prototype = {
      //override properties
      get response() {
        return this.realRequest.response;
      },
      get responseText() {
        return this.realRequest.responseText;
      },
      get responseType() {
        return this.realRequest.responseType;
      },
      get responseXML() {
        return this.realRequest.responseXML;
      },
      get status() {
        return this.realRequest.status;
      },
      get statusText() {
        return this.realRequest.statusText;
      },

      //new properties
      get isDeployed() {
        return isDeployed || false;
      },

      //override methods
      abort: function() {
        this.realRequest.abort();

        return this;
      },
      getAllResponseHeaders: function() {
        return this.realRequest.getAllResponseHeaders();
      },
      open: function(method, url, async, user, password) {
        this.realRequest.open(method, url, async, user, password);

        return this;
      },
      send: function() {
        this
          .addActiveRequest()
          .realRequest.send();

        return this;
      },
      setRequestHeader: function(name, value) {
        this.realRequest.setRequestHeader(name, value);

        return this;
      },

      //new methods
      addActiveRequest: function() {
        activeRequests.push(this.realRequest);

        return this;
      },
      removeActiveRequest: function() {
        var i = activeRequests.indexOf(this.realRequest)
          , removed
          ;

        if (i > -1) {
          removed = activeRequests.splice(i, 1);
          inactiveRequests.push(removed.pop());
        }

        return this;
      },
      checkActiveRequestsState: function() {
        if (activeRequests.length < 1) {
          if (this.onallrequestsdone) {
            this.onallrequestsdone.call(this.realRequest, inactiveRequests, scope);
          }
          if (settings.allRequestsDone) {
            settings.allRequestsDone.call(this.realRequest, inactiveRequests, scope);
          }
        }

        return this;
      }
    };

    scope.XMLHttpRequest = RequestListener;
  }

  defaultSettings.extend = function(settings) {
    settings = settings || {};

    var defaults = defaultSettings
      , i
      ;

    for (i in defaults) if (defaults.hasOwnProperty(i)) {
      settings[i] = settings.hasOwnProperty(i) ? settings[i] : defaults[i];
    }

    return settings;
  };

  pri.newWindow = function(url, settings) {
    var childWindow = window.open(url)
      , int = setTimeout(function() {
          if (childWindow.location.toString() !== 'about:blank') {
            clearTimeout(int);
            if (settings.beforeLoad) {
              settings.beforeLoad(childWindow);
            }
          }
        }, 10)
      ;

    pri(childWindow, settings);
  };

  function environmentCorrection(scope) {
    if (scope.attachEvent && !scope.addEventListener) {
      scope.addEventListener = function(event, listener, useCapture) {
        return scope.attachEvent(event, listener, useCapture);
      };
    }
  }

  return pri;
})();