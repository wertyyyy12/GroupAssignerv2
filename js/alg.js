var testList = [1, 2, 3, 4, 5, 6, 7, 8, 9];
var testPrefs = [
  [1, [3, 6]],
  [2, [3, 9]],
  [3, [5]],
  [4, [3]],
  [5, [2]],
  [6, [2, 1]],
  [7, [4, 6, 5]],
  [8, [4, 6]],
  [9, [5]]
];

function splitIntoGroups(groupSize, studentList) {
  var numGroups = Math.ceil(studentList.length / groupSize);
  var splitGroups = [];
  for (var i = 0; i < numGroups; i++) {
    splitGroups.push([]);
  }

  var j = 0;
  for (var i = 0; i < studentList.length; i++) {
    if (splitGroups[j].length >= groupSize) {
      j++;
    }
    splitGroups[j].push(studentList[i]);
  }

  return splitGroups;
}

function arrayRemove(array, element) {
  var arrayCopy = JSON.parse(JSON.stringify(array));
  return arrayCopy.filter(elem => elem != element);
}

function findWanting(person, prefs) { //find who wants a certain person in their group
  var people = [];
  prefs.forEach((pref) => {
    var student = pref[0];
    var studentPrefs = pref[1];

    if (studentPrefs.includes(person)) {
      people.push(student);    
    }
  });

  return people;

}

function findStudentPrefs(student, prefs) {
  var studentPrefs = false;
  prefs.forEach((pref) => {
    if (pref[0] == student) {
      studentPrefs = pref;
    }
  });

  return studentPrefs;
}

//A swaps with B

function findOptimum(sG, prefs) {
  var splitGroups = JSON.parse(JSON.stringify(sG));
  prefs.forEach((pref) => {
    var student = pref[0];
    var studentPrefs = pref[1];
    var studentGroup = splitGroups.find(group => group.includes(student));

    studentPrefs.forEach((person) => {
      var personGroup = splitGroups.find(group => group.includes(person));
      var gain = 0;
      if (personGroup != studentGroup) { //the person wants a swap; "student" wants to swap with "person" (student = A, person = B)
        //COST calculations (anything that violates prefrences)
        var swapPeople = arrayRemove(personGroup, person);
        var wantingPersonB = findWanting(person, prefs);
        var wantingPersonA = findWanting(student, prefs);
        swapPeople.forEach((swapPerson) => { //for every person to swap with
          if (wantingPersonB.includes(swapPerson)) { //then a swap person (a person in pB's group) wanted B
            gain--;
          }
        });

        //check if person B wanted anyone in their group
        var personBprefs = findStudentPrefs(person, prefs);
        personGroup.forEach((BgroupMember) => {
          if (personBprefs[1].includes(BgroupMember)) {
            gain--;
          }
        });

        //check if any person in group A wanted A
        studentGroup.forEach((AgroupPerson) => { //for every person to swap with
          if (wantingPersonA.includes(AgroupPerson)) { //then a swap person (a person in pB's group) wanted B
            gain--;
          }
        });

        var personAprefs = findStudentPrefs(student, prefs); //check if A wanted anyone in their group
        studentGroup.forEach((AgroupMember) => {
          if (personAprefs[1].includes(AgroupMember)) {
            gain--;
          }
        });
        
        console.log(gain);

        //GAIN calculations
        


      }
    });
  });
}


var testSplitGroups = splitIntoGroups(3, testList);
console.log(testSplitGroups);
findOptimum(splitIntoGroups(3, testList), testPrefs);