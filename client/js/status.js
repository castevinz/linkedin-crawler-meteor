var prev = {};

setInterval(function () {
    Meteor.call('status', function (err, data) {

      // Display values in status block
      ['log', 'log2', 'loop', 'added'].forEach(function (tag) {
        if (prev[tag] !== data[tag]) {
          prev[tag] = data[tag];
          $('#' + tag).text(data[tag]);
        }
      });

      // class on div depending on status
      ['loaded', 'loading'].forEach(function (tag) {
        if (prev[tag] !== data[tag]) {
          prev[tag] = data[tag];
          $('#status, #search').toggleClass(tag, data[tag]);
        }
      });

      // gauge bars
      ['rtotal', 'rviewed'].forEach(function (tag) {
        var $ratio,
          tag2 = tag === 'rtotal' ? 'rviewed' : 'rtotal';
        if (prev[tag] !== data[tag]) {
          $ratio = $("#ratio");
          prev[tag] = data[tag];
          $ratio.find("." + tag).width(data[tag] + '%');
          if (data[tag] > data[tag2]) {
            $ratio.find("span").text((Math.round(data[tag] * 100) / 100) + "%");
            $ratio.addClass("big_" + tag).removeClass("big_" + tag2);
          }
        }
      });

    });
}, 350);


Template.status.events({
  'click button': function () {
    Meteor.call("stop");
  }
});