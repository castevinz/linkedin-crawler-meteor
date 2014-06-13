/**
 * Class Option
 * @param cookie {Cookie} optional
 **/
Options = function (cookie) {
  this.headers = {
    "Accept": "*/*",
    "Connection": "keep-alive",
    "User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.132 Safari/537.36"
  };
  this.params = {};
  if (cookie) {
    this.headers.Cookie = cookie.get();
  }
};