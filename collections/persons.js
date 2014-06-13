// define a new collection using the global scope
Persons = new Meteor.Collection("persons");


if (Meteor.isServer) {
  Meteor.publish('default_db_persons', function(){
    return Persons.find({});
  });

  Meteor.publish('persons');
}

if (Meteor.isClient) {
  Template.persons.count = function () {
    return Persons.find().count();
  };

}