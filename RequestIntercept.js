var RequestIntercept = (function() {
  /**
   *
   * @param {Window} window
   * @param settings
   * @constructor
   */
  function RequestIntercept(window, settings) {
    var self = this;

    if (window === undefined) {
      throw new Error('window object is required so as to intercept');
    }
    this.settings = settings;
    this.setSettings();
    this._isDeployed = true;
    window.onbeforeunload = function() {
      var interval = setInterval(function() {
        if (window.XMLHttpRequest.prototype.isDeployed === undefined) {
          new RequestIntercept(window, settings);
          if (settings.scopeChange) {
            settings.scopeChange();
          }
          clearInterval(interval);
        }
      },0);
    };

    var Request = window.XMLHttpRequest;

    function XMLHttpRequest(objParameters) {
      var self = this,
        real = this.real = new Request(objParameters);

      real.onload = function() {
        self.removeActiveRequest();

        if (self.onload !== undefined) {
          self.onload.apply(real, arguments);
        } else if (self.settings.load !== undefined) {
          self.settings.load();
        }

        self.checkActiveRequestsState();

        return self;
      };

      real.onerror = function() {
        if (self.onerror !== undefined) {
          self.onerror.apply(real, arguments);
        } else if (self.settings.error !== undefined) {
          self.settings.error();
        }

        return self;
      };

    }

    XMLHttpRequest.prototype = {
      get status() {
        return this.real.status;
      },
      get statusText() {
        return this.real.statusText;
      },
      get response() {
        return this.real.response
      },
      get responseText() {
        return this.real.responseText
      },
      get responseType() {
        return this.real.responseType
      },
      get responseXML() {
        return this.real.responseXML
      },
      send: function() {
        this.addActiveRequest();
        this.real.send();

        return this;
      },
      open: function(method, url, async, user, password) {
        this.real.open(method, url, async, user, password);

        return this;
      },
      addActiveRequest: function() {
        self._activeRequests.push(this);

        return this;
      },
      removeActiveRequest: function() {
        var i = self._activeRequests.indexOf(this);

        if (i > -1) {
          self._activeRequests.splice(i, 1);
        }

        return this;
      },
      checkActiveRequestsState: function() {
        if (self._activeRequests.length < 1) {
          if (self.alldone !== undefined) {
            self.alldone();
          } else if (self.settings.allDone !== undefined) {
            self.settings.allDone();
          }
        }

        return this;
      },
      isDeployed: function() {
        return self._isDeployed || false;
      }
    };

    window.XMLHttpRequest = XMLHttpRequest;
  }

  RequestIntercept.prototype = {
    _activeRequests: [],
    setSettings: function() {
      var defaults = RequestIntercept.defaultSettings,
        settings = this.settings || {},
        i;
      for (i in defaults) if (defaults.hasOwnProperty(i)) {
        settings[i] = settings.hasOwnProperty(i) ? settings[i] : defaults[i];
      }

      return this;
    }
  };

  RequestIntercept.defaultSettings = {
    allDone: function() {},
    load: function() {},
    error: function() {},
    scopeChange: function() {}
  };

  return RequestIntercept;
})();