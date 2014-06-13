var cheerio = Meteor.require('cheerio'),
  sleep = Meteor.require('sleep');

var stop = false;

var status = {
  log: '',
  log2: '',
  resultCount: 0,
  count: 0,
  added: 0,
  loading: false,
  loaded: false,
  quota: null
};

/**
 * Return truthy if loading new profile is allowed
 * @returns {int|boolean}
 */
function canContinue() {
  return !stop && (status.quota === null || status.quota !== status.added);
}

/**
 * Extract all inputs fields and set in the output object
 * @param $ {jQuery}
 * @param container {jQuery}
 * @param output {Object}
 */
function getInputs($, container, output) {
  container.find("input").each(function () {
    var input = $(this);
    output[input.attr("name")] = input.val();
  });
}


/**
 * Extract a JSON from an html comment in a node
 * @param node {jQuery}
 * @returns {Object}
 */
function uncomment(node) {
  var json = {};
  try {
    json = EJSON.parse(unescape(node.html().replace(/^\s*<!--\s*(.*)\s*-->\s*$/g, "$1")));
  } catch (e) {
    console.error("Parsing error:", e);
  }
  return json;
}

/**
 * Test if a path exist in an object
 * @param object {object}
 * @param path {string}
 * @returns {boolean}
 */
function exist(object , path) {
  var cursor = object;
  return path.split(".").every(function (key) {
    var result = cursor && typeof cursor === "object" && cursor.hasOwnProperty(key);
    if (result) {
      cursor = cursor[key];
    }
    return result;
  });
}

function extractPersons(json, cookie) {
  var person, result = [];
  if (exist(json, "content.page.voltron_unified_search_json.search.results") && json.content.page.voltron_unified_search_json.search.results) {
    json.content.page.voltron_unified_search_json.search.results.forEach(function (data) {
      if (canContinue() && data && data.person) {
        person = data.person;
        status.count++;
        result.push(person);
        if (!Persons.findOne({"person.id": person.id})) {
          status.added++;
          status.log = "downloading";
          status.log2 = person.lastName + ", " + person.firstName;
          sleep.usleep(1500 + Math.floor(Math.random() * 500) * 1000);
          HTTP.get("https://www.linkedin.com/profile/view?id=" + person.id + "&snapshotID=&authType=" + person.authType + "&authToken=" + person.authToken + "&ref=NUS&trk=NUS-body-member-name", new Options(cookie));
          Persons.insert({person: person, date: Date()});
        }
      }
    });
  }
  return result;
}

function crawl(email, password, text, limit) {
  var res, $, options, json,
    cookie = new Cookie();

  stop = false;

  status.loading = true;
  status.quota = parseInt(limit, 10) || null;

  status.resultCount = status.log = status.log2 = "";
  status.count = status.added = 0;

  status.log = "Connected to LinkedIn...";

  /**
   * Step 1: Call login page to get cookie and headers
   */
  $ = get("https://www.linkedin.com/uas/login", new Options(), cookie);

  /**
   * Step 2: Submit login
   */
  status.log = "Signing to LinkedIn...";

  options = new Options(cookie);
  options.headers["Content-Type"] = "application/x-www-form-urlencoded";
  options.headers.Host = "www.linkedin.com";
  options.headers.Origin = "https://www.linkedin.com";
  options.headers.Referer = "https://www.linkedin.com/uas/login?goback=&trk=hb_signin";
  options.headers["X-IsAJAXForm"] = 1;
  options.headers["X-Requested-With"] = "XMLHttpRequest";
  options.params.trk = "";
  options.params.isJsEnabled = "true";
  options.headers["X-LinkedIn-traceDataContext"] = 'X-LI-ORIGIN-UUID=' + $("meta[name=treeID]").attr("content");

  getInputs($, $("#login"), options.params);
  options.params.session_key = email;
  options.params.session_password = password;

  addLinkedInChecksums(options.params);

  json = post("https://www.linkedin.com/uas/login-submit", options, cookie, true);

  if (!json || json.status === "fail") {
    status.log = "Error, exiting";
    status.log2 = "";
    status.loading = false;
    return json;
  }


  /**
   * Step 3: get the connected page
   */

  status.log = "Getting session informations...";

  options = new Options(cookie);
  options.headers.Accept = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,* /*;q=0.8';
  options.headers.Referer = 'https://www.linkedin.com/uas/login?goback=&trk=hb_signin';

  $ = get(json.redirectUrl + "hb_signin", options, cookie);


  /**
   * Step 4; Submit search
   */

  status.log = "Submitting research...";

  options = new Options(cookie);
  getInputs($, $("#global-search"), options.params);
  options.params.keywords = text;
  $ = get("https://www.linkedin.com/vsearch/f", options, cookie);

  json = uncomment($("#voltron_srp_main-content"));

  status.resultCount = json.content.page.voltron_unified_search_json.search.baseData.resultCount;

  while (canContinue() && extractPersons(json, cookie).length) {
    if (canContinue()  && exist(json, "content.page.voltron_unified_search_json.search.baseData.resultPagination.nextPage.pageURL")) {
      status.log = "Loading page " + json.content.page.voltron_unified_search_json.search.baseData.resultPagination.nextPage.pageNum + "...";
      status.log2 = "";

      // keep current options
      options.headers["Content-Type"] = "application/x-www-form-urlencoded";
      options.headers["X-IsAJAXForm"] = 1;
      options.headers["X-Requested-With"] = "XMLHttpRequest";
      options.params.page_num = json.content.page.voltron_unified_search_json.search.baseData.resultPagination.nextPage.pageNum;

      // cookie not updated (useless)
      res = HTTP.get("https://www.linkedin.com/vsearch/fj", options);
      json = res.data;

    } else {
      json = null;
    }
  }
  status.log2 = status.log = "";
  status.loading = false;
  status.loaded = true;
  status.count = status.added = status.resultCount = 0;
  return true;
}

//-------------------------------------------------------------------------------------//
// PUBLISH METHODS TO THE CLIENT
//-------------------------------------------------------------------------------------//

Meteor.methods({
    crawl: function (email, password, text, limit) {
      this.unblock();
      return crawl(email, password, text, limit);
    },
    stop: function () {
      stop = true;
    },
    status: function () {
      return {
        log: status.log,
        log2: status.log2,
        loop: status.count ? 'Ttem: ' + status.count + (status.resultCount ? ' / ' + status.resultCount  : '') : '',
        rviewed: status.resultCount ? status.added * 100 / Math.min(status.quota, status.resultCount || status.quota) : 0,
        rtotal: status.resultCount ? status.count * 100 / status.resultCount : 0,
        added: status.added ? 'Person added: ' + status.added + (status.quota ? ' / ' + status.quota : ''): '',
        loading: status.loading,
        loaded: status.loaded
      };
    }
});