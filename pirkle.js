var Pirkle = (function (Pirkle) {

  Pirkle.emptyFn = function () {};

  Pirkle.Cookie = {
      get: function (name) {
        var pairs = document.cookie.split('; '),
            pair,
            i;

        for(i = 0; i < pairs.length; i++) {
          pair = pairs[i].split('=');

          if (pair[0] === name) {
            return pair[1];
          }
        }
      },
      set: function (name, value, path, domain) {
        var newCookie = name + '=' + value;

        if (path !== undefined) {
          newCookie += ";path=" + path;
        }
        if (domain !== undefined) {
          newCookie += ";domain=." + domain;
        }

        document.cookie = newCookie;
      },
      expire: function (name, path, domain) {
        var newCookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT';

        if (path !== undefined) {
          newCookie += ";path=" + path;
        }
        if (domain !== undefined) {
          newCookie += ";domain=." + domain;
        }

        document.cookie = newCookie;
      }
  };

  Pirkle.Form = {
    select: {
      setValue: function (selectEl, value) {
        var options = selectEl.childNodes,
            i;

        for(i = 0; i < options.length; i++) {
          if (options[i].value == value) {
            break;
          }
        }

        selectEl.selectedIndex = i;

        return i;
      }
    },
    getValues: function (form) {
      var fields = form.elements,
          length = form.elements.length,
          data = {},
          i;

      for(i = 0; i < length; i++) {
        if (fields[i].name) {
          data[fields[i].name] = fields[i].value;
        }
      }

      return data;
    },
    setValues: function (form, data) {
      var fields = form.elements,
          length = form.elements.length,
          field,
          name,
          i;

      for(i = 0; i < length; i++) {
        field = fields[i];
        name = field.name;

        if (name) {
          if (data[name] !== undefined) {
            field.value = data[name];
          } else {
            delete field.value;
          }
        }
      }

      return data;
    },
    clearValues: function (form) {
      var fields = form.elements,
          length = form.elements.length,
          field,
          name,
          i;

      for(i = 0; i < length; i++) {
        field = fields[i];
        name = field.name;

        if (name) {
          field.value = null;
        }
      }
    }
  };

  Pirkle.Ajax = {
    request: function (options) {
      var request,
          me = this,
          useAsync = options.async === false ? false : true;

      if (window.XMLHttpRequest) {
        request = new XMLHttpRequest();
      } else if(window.ActiveXObject) {
        try {
          request = new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e) {
          try {
            request = new ActiveXObject("Microsoft.XMLHTTP");
          } catch (e) {
            request = false;
          }
        }
      }

      if (request === false) {
        return false;
      }

      request.callback = options.callback || Pirkle.emptyFn;
      request.options = options;

      if (request.addEventListener) {
        request.addEventListener("load", this.transferComplete, false);
        request.addEventListener("error", this.transferFailed, false);
        request.addEventListener("abort", this.transferCanceled, false);
      } else if (request.attachEvent) {
        request.attachEvent("onload", this.transferComplete);
        request.attachEvent("onerror", this.transferFailed);
        request.attachEvent("onabort", this.transferCanceled);
      } else {
        request.onreadystatechange = function() {
          if (request.readyState !== 4) {
            return false;
          }
          if (request.status !== 200) {
            request.callback(
              {
              success: false,
              response: null,
              request: request
              }
            );
            return false;
          }
          request.callback(
            {
              success: true,
              response: request.responseText,
              request: request
            }
          );
          return true;
        };
      }

      request.open(options.method, options.url, useAsync);
      if (options.headers) {
        for (var header in options.headers) {
          if(options.headers.hasOwnProperty(header)){
            request.setRequestHeader(header, options.headers[header]);
          }
        }
      } else {
        request.setRequestHeader("Content-Type", "application/json");
      }
      request.send(options.data);

      return request;
    },
    post: function (options) {
      options.method = "POST";

      return this.request(options);
    },
    get: function (options) {
      options.method = "GET";

      return this.request(options);
    },
    transferComplete: function () {
      this.callback({
        success: true,
        response: this.responseText,
        request: this
      });
    },
    transferFailed: function () {
      this.callback({
        success: false,
        response: null,
        request: this
      });
    },
    transferCanceled: function () {
      this.callback({
        success: false,
        response: null,
        request: this
      });
    }
  };

  Pirkle.Object = {
    serialize: function (values) {
      var data = [],
          key;

      for(key in values) {
        if (values.hasOwnProperty(key)) {
          data.push(encodeURIComponent(key) + '=' + encodeURIComponent(values[key]));
        }
      }

      return data.join('&');
    }
  };

  Pirkle.Array = {
    filterBy: function (data, key, value) {
      return data.filter(function (element) {
        return (element[key] == value);
      });
    },
    find: function (data, value, key) {
      var result;

      data.forEach(function (item) {
        if (key && item[key] == value) {
          result = item;
        } else if (item == value) {
          result = item;
        }
      });

      return result;
    },
    search: function (data, value) {
      var results = [],
          searchRe = new RegExp(value, 'i');

      data.forEach(function (item) {
        var key;

        if (typeof item === "object") {
          for (key in item) {
            if (item.hasOwnProperty(key) && item[key] && searchRe.test(item[key].toString())) {
              results.push(item);
              break;
            }
          }
        } else if (item && searchRe.test(item.toString())) {
          results.push(item);
        }
      });

      return results;
    }
  };

  Pirkle.String = {
    upperAtIndex: function (string, index) {
      return string.slice(index, 1).toUpperCase() + string.substring(index + 1);
    }
  };

  Pirkle.Dom = {
    eventHandlerCache: {},
    removeNodes: function (el) {
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }
    },
    bindOne: function (node, eventName, handler, capture) {
      if (!node || !eventName || !handler) {
        return false;
      }

      var cache = this.eventHandlerCache[eventName],
          i;

      if (cache) {
        for(i=0; i < cache.length; i++) {
          if (cache[i].node === node) {
            node.removeEventListener(eventName, cache[i].handler, cache[i].useCapture);
          }
        }
      }

      this.bind(node, eventName, handler, capture);
    },
    bind: function (node, eventName, handler, capture) {
      if (!node || !eventName || !handler) {
        return false;
      }

      // Handle an array of nodes
      if (node instanceof HTMLCollection) {
        var i;

        for (i = 0; i < node.length; i++) {
          this.bind(node[i], eventName, handler, capture);
        }

        return;
      }

      if (!this.eventHandlerCache[eventName]) {
        this.eventHandlerCache[eventName] = [];
      }

      this.eventHandlerCache[eventName].push({
        node: node,
        handler: handler,
        useCapture: capture
      });

      if (node.addEventListener) {
        node.addEventListener(eventName, handler, capture);
      } else if (node.attachEvent) {
        node.attachEvent("on" + eventName, handler);
      }
    }
  };

  return Pirkle;

}(window.Pirkle || {}));