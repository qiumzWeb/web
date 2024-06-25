var Cookie = {
  domain: '.cainiao.com',
  path: '/',
  get: function (n) {
      var m = document.cookie.match(new RegExp("(^| )" + n + "=([^;]*)(;|$)"));
      return !m ? "" : decodeURIComponent(m[2]);
  },
  set: function (name, value, _a = {}) {
      this.del(name)
      var _b = _a === void 0 ? undefined : _a, domain = _b.domain || this.domain, path = _b.path || this.path, hour = _b.hour, expireTime = _b.expireTime;
      var cookie = [
          name + "=" + encodeURIComponent(value) + ";"
      ];
      if (domain && domain != "/") {
          cookie.push("domain =" + domain);
      }
      else {
          cookie.push("domain =" + document.domain);
      }
      if (path) {
          cookie.push("path =" + path);
      }
      if (hour) {
          var expire = new Date();
          expire.setTime(expire.getTime() + (hour ? 3600000 * hour : 30 * 24 * 60 * 60 * 1000));
          cookie.push("expires=" + expire.toUTCString());
      }
      if (expireTime) {
          var expire = new Date(expireTime);
          if (expire.toString() !== 'Invalid Date') {
              cookie.push("expires=" + expire.toUTCString());
          }
      }
      document.cookie = cookie.join(";");
  },
  del: function (name, domain, path) {
      if (domain === void 0) { domain = this.domain; }
      if (path === void 0) { path = ''; }
      document.cookie = name +
          "=; expires=Mon, 26 Jul 1997 05:00:00 GMT; path=" +
          (path ? path : "/") + "; " +
          (domain && domain != '/' ? ("domain=" + domain + ";") : "domain=" + document.domain);
      //旧数据清理
      document.cookie = name + "=; expires=Mon, 26 Jul 1997 05:00:00 GMT; path=" + (path ? path : "/") + "; " + "domain=";
  }
};
export default Cookie;
//# sourceMappingURL=index.js.map