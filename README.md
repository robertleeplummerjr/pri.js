# PRI - Persistent Request Interceptor
## Why?
Mostly for front end, end to end testing, at least that is why it was originally written.  We needed a way to listen to any request being made to a window.

## What does PRI do?
* opens child windows from a parent window and listens to them for you
* detects navigation by setting a timeout to fire just after the `onbeforeunload` event, which is just before the new window's `onready` event... easy
* replaces XMLHttpRequest safely and communicates directly with it for ajax events so that more may be made known about the state of the child window
* any time the new window has navigation triggered, PRI calls itself onto the new window with your settings, causing it to persist


## Usage
on existing window
```javascript
pri(window);
```
or
```javascript
pri(window, settings);
```

create new window
```javascript
pri.newWindow('http://url.here.com');
```
or
```javascript
pri.newWindow('http://url.here.com', settings);
```

## Settings
* allRequestsDone(inactiveRequests, window) - fires when all ajax requests in new window, `this` being the last called request
* beforeLoad(window) - fires just before a window's `ready` event.  Though does not load as the first script in the page.  This is sort of the mythical `window.onbeforeload` event... it isn't a myth anymore.
* load - synonymous with `new XMLHttpRequest.onload`, fires just after all `XMLHttpRequest`'s `onload` events, `this` being the request that loaded, arguments are transferred from the request using apply
* error - synonymous with `new XMLHttpRequest.onerror`, fires just after all `XMLHttpRequest`'s `onerror` events, `this` being the request with the error, arguments are transferred from the request using apply
* close(window) - fires just after the child window closes

## Properties
For instantiated XMLHttpRequest
* onload
* onerror
* onallrequestsdone


## Property Examples
```javascript
pri(window); //<- causes rewrite of XMLHttpRequest and setup of PRI

//request here isn't the real XMLHttpRequest, but an imposter, designed to listen to the real request object
var request = new XMLHttpRequest();

//these property methods are not the real XMLHttpRequest methods, but will be fired just after the real request object methods fire
request.onload = function() {};
request.onerror = function() {};

//NEW PROPERTY METHODS!
request.onallrequestsdone = function(inactiveRequests, window) {};
```
