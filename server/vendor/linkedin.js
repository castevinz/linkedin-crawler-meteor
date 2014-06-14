var jsRandomCalculator = (function () {
  function compute(n, email, ts) {
    try {
      var vs = n.split(":"),
        ts = parseInt(ts),
        len = vs.length,
        i, v, f1_out, f2_out;
      for (i = 0; i < len; i++) {
        vs[i] = parseInt(vs[i], 10);
      }
      f1_out = f1(vs, ts);
      f2_out = f2(f1_out, ts);
      if (f1_out[0] % 1000 > f1_out[1] % 1000) {
        v = f1_out[0];
      } else {
        v = f1_out[1];
      }
      return f3(v, f2_out, email);
    } catch (err) {
      return -1;
    }
  }

  function computeJson(input) {
    return compute(input.n, input.email, input.ts);
  }

  function f1(vs, ts) {
    var output = [],
      i;
    output[0] = vs[0] + vs[1] + vs[2];
    output[1] = (vs[0] % 100 + 30) * (vs[1] % 100 + 30) * (vs[2] % 100 + 30);
    for (i = 0; i < 10; i++) {
      output[0] += (output[1] % 1000 + 500) * (ts % 1000 + 500);
      output[1] += (output[0] % 1000 + 500) * (ts % 1000 + 500);
    }
    return output;
  }

  function f2(vs, ts) {
    var sum = vs[0] + vs[1],
      n = sum % 3000,
      m = sum % 10000,
      p = ts % 10000;
    if (n < 1000) {
      return Math.pow(m + 12345, 2) + Math.pow(p + 34567, 2);
    } else if (n < 2000) {
      return Math.pow(m + 23456, 2) + Math.pow(p + 23456, 2);
    } else {
      return Math.pow(m + 34567, 2) + Math.pow(p + 12345, 2);
    }
  }

  function f3(v1, v2, email) {
    var len = email.length,
      v3 = 0,
      i = 0;
    for (; i < len; i++) {
      v3 += email.charCodeAt(i) << ((5 * i) % 32);
    }
    return (v1 * v2 * v3) % 1000000007;
  }
  return {
    compute: compute,
    computeJson: computeJson,
    version: "1.0.1"
  };
}());

function e() {
  var j = [],
    k;
  for (k = 0; k < 3; k++) {
    j[k] = Math.floor(Math.random() * 900000000) + 100000000;
  }
  return j;
}

/**
 * Add LinkedIn Checksum
 * Global scope
 * @param params {Object} in-out - post payload
 */
addLinkedInChecksums = function (params) {
  var p, m, q, l, j,
    s = params.session_key;
  q = Date.now();
  l = e().join(":");
  j = s + ":" + l;
  m = jsRandomCalculator.computeJson({
    ts: q,
    n: l,
    email: s
  });
  p = jsRandomCalculator.version;
  params.client_ts = q;
  params.client_r = j;
  params.client_output = m;
  params.client_n = l;
  params.client_v = p;
};

/**
 * Unescape function simplified from fizzy.js
 */
unescape = function (a) {
  return a.replace(RegExp("\\\\u002d", "gi"), "-").replace(RegExp("&amp;", "gi"), "&");
};