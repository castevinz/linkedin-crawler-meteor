var cheerio = Meteor.require('cheerio');

/**
 * Send an HTTP request
 * @param url {string}
 * @param options {Options}
 * @param cookie {Cookie}
 * @param isJson {Boolean}
 * @returns {jQuery|Object}
 */
function request(method, url, options, cookie, isJson) {
  var res = HTTP[method](url, options);
  if (res.headers && res.headers["set-cookie"]) {
    cookie.set(res.headers["set-cookie"]);
  }
  return isJson ? EJSON.parse(res.content) : cheerio.load(res.content);
}

/**
 * Send an HTTP POST request
 * @param url {string}
 * @param options {Options}
 * @param cookie {Cookie}
 * @param isJson {Boolean}
 * @returns {jQuery|Object}
 */
post = function (url, options, cookie, isJson) {
  return request("post", url, options, cookie, isJson);
};

/**
 * Send an HTTP GET request
 * @param url {string}
 * @param options {Options}
 * @param cookie {Cookie}
 * @returns {jQuery|Object}
 */
get = function (url, options, cookie) {
  return request("get", url, options, cookie);
};