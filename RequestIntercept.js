var RequestIntercept = (function() {
    function RequestIntercept(window, settings) {
        if (window === undefined) {
            throw new Error('window object is required so as to intercept');
        }
        this.settings = settings;
        this.setSettings();

        var Request = window.XMLHttpRequest;

        window.XMLHttpRequest = function(objParameters) {
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
    }
    RequestIntercept.prototype = {
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
        _activeRequests: [],
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
            this._activeRequests.push(this);

            return this;
        },
        removeActiveRequest: function() {
            var i = self._activeRequests.indexOf(self);

            if (i > -1) {
                self._activeRequests.splice(i, 1);
            }

            return this;
        },
        checkActiveRequestsState: function() {
            if (this._activeRequests.length < 1) {
                if (this.alldone !== undefined) {
                    this.alldone();
                } else if (this.settings.allDone !== undefined) {
                    this.settings.allDone();
                }
            }

            return this;
        },
        setSettings: function() {
            var defaults = RequestIntercept.defaultSettings,
                settings = this.settings,
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
});