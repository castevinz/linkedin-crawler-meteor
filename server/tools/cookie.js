/**
 * Handle a cookie
 * @constructor
 */
Cookie = function  () {
  var pairs = {};

  this.set = function (list) {
    list.forEach(function (value) {
      var spl = value.match(/^([^=]+)="([^"]*)"/) || value.match(/^([^=]+)=([^";]*);/);
      if (spl) {
        if (!value.match(/delete\s*me/i)) {
          pairs[ spl[1] ] = spl[2];
        }
      }
    });
  };

  this.get = function () {
    var k, res = [];
    for (k in pairs) {
      if (pairs.hasOwnProperty(k)) {
        res.push(k + '="' + pairs[k] + '"');
      }
    }
    return res.join("; ");
  };
};