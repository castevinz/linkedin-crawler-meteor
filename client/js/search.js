var valid = false,
  email = "",
  password = "",
  text = "",
  limit = "",
  previous = "";

/**
 * Enable or disable crawl button depending on entry
 */
function update(event, self) {
  var $button = $(self.find("button"));

  email = $(self.find("#email")).val();
  password = $(self.find("#password")).val();
  text = $(self.find("#text")).val();
  limit = $(self.find("#limit")).val();

  if (text && email && password) {
    $button.removeAttr("disabled");
    if (previous !== text) {
      previous = text;
      valid = true;
    }
  } else {
    $button.attr("disabled", "disabled");
    valid = false;
  }
  $button.toggleClass("btn-primary", valid);
}

/**
 * Click handler on search button
 */
function search(event) {
  update.apply(this, arguments);
  if (valid) {
    $("#error").empty();
    Meteor.call("crawl", email, password, text, limit, function(error, result) {
      var k, errors = [];
      if (result !== true) {
        if (result && result.errors) {
          if (result.errors.globalError) {
            errors.push(result.errors.globalError);
          } else if (result.errors.fieldErrors) {
            for (k in result.errors.fieldErrors) {
              if (result.errors.fieldErrors.hasOwnProperty(k)) {
                errors.push(result.errors.fieldErrors[k]);
              }
            }
          }
        }
        if (!errors.length) {
          errors.push("Unknown error");
        }

        $("#error").html(errors.join("<br />"));
        console.log(result);
      }
    });
  }
}

/**
 * Submit handler on forms
 */
function prevent(event) {
  event.preventDefault();
}

Template.search.events({
  'click button': search,
  'keypress input': update,
  'keyup input': update,
  'submit': prevent
});

/**
 * Remove all html tags
 * @param txt {string}
 * @returns {string}
 */
function rmHTMLTags(txt) {
  return txt.replace(/<[^>]+>/g, "");
}

/**
 * Create the data object required by the Datatable top add a new row
 * @param data {Object} Person item
 * @returns {Array}
 */
function generate(data) {
  var result = [],
    person = data.person;
  result.push(data._id);
  result.push(
    '<a href="http://www.linkedin.com/profile/view?id=' + person.id + '&authType=' + person.authType + '&authToken' + person.authToken + '" target="_blank">' +
      '<img src="' +
      (person.imageUrl ? 'https://media.licdn.com/media' + person.imageUrl : 'https://static.licdn.com/scds/common/u/images/themes/katy/ghosts/person/ghost_person_60x60_v1.png') +
      '" />' +
      '</a>');

  result.push(person.lastName);
  result.push(person.firstName);

  result.push(
    (function (tags) {
      var result = [];
      tags.split(',').forEach(function (tag) {
        if (person[tag]) {
          result.push('<span class="' + tag + '">' + rmHTMLTags(person[tag]) + '</span>');
        }
      });
      return result.join('');
    })("fmt_headline,fmt_industry,fmt_location")
  );

  result.push(data.date);
  return result;
}

// On "persons" template rendered, initialize the datatable
Template.persons.rendered = function () {
  var $persons = $("#persons");

  if (!$persons.hasClass("dataTable")) {
    $persons.dataTable({
      bProcessing: true,
      bDeferRender: true,
      aoColumnDefs: [
        {
          aTargets: [0],
          bVisible: false
        },
        {
          aTargets: [1],
          sType: 'html',
          bSortable: false,
          sWidth: "70px"
        },
        {
          aTargets: [4],
          bSortable: false
        },
        {
          aTargets: [5],
          sType: 'date'
        }
      ]
    })
      .fnSort([[5, 'desc']]);
  }
};


(function () {
  var initialised = false;

  /**
   * Return row index from person id (_id, not linked.id)
   * @param id
   * @returns {*}
   */
  function findRowIndex(id) {
    var rowId = $('#persons').dataTable().fnFindCellRowIndexes(id, 0);
    return rowId && rowId.length  ? rowId.pop() : null;
  }

  // Once create
  Template.persons.created = function() {
    Persons.find({}).observeChanges({
      added: function (id) {
        if (initialised) {
          $('#persons').dataTable().fnAddData(generate(Persons.findOne({_id: id})));
        }
      },
      changed: function (id) {
        var index = findRowIndex(id);
        if (initialised && index !== null) {
          $('#persons').dataTable().fnUpdate(generate(Persons.findOne({_id: id})), index);
        }
      },
      removed: function (id) {
        var index = findRowIndex(id);
        if (initialised && index !== null) {
          $('#persons').dataTable().fnDeleteRow(index);
        }
      }
    });
  };

  Meteor.subscribe('default_db_persons', function() {
    var dt = $("#persons").dataTable();

    Persons.find({}).forEach(function (person) {
      dt.fnAddData(generate(person), false); // false = do not redraw
    });

    dt.fnDraw();

    initialised = true;
  });

}());