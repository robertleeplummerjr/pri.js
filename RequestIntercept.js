var RequestIntercept = (function() {
  function RequestIntercept(scope, settings) {
    var self = this;
    if (scope === undefined) {
      throw new Error('scope object is required so as to intercept');
    }
    this.settings = settings;
    this.setSettings();
    this._isDeployed = true;

    var Request = scope.XMLHttpRequest;

    scope.XMLHttpRequest = function XMLHttpRequest(objParameters) {
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

    };

    scope.XMLHttpRequest.prototype = {
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
    error: function() {}
  };

  return RequestIntercept;
})();