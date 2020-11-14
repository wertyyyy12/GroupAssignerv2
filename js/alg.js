var testList = [1, 2, 3, 4, 5, 6, 7, 8];
var testPrefs = [
  [1, [5]],
  [2, [7]],
  [3, [5]],
  [4, [3]],
  [5, [1]],
  [6, [2, 1]],
  [7, [2]],
  [8, [4, 6]]
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

function swapTwoPeople(sG, studentA, studentB) { 

  var splitGroups = JSON.parse(JSON.stringify(sG));
  var Agroup = splitGroups.find(group => group.includes(studentA));
  var Bgroup = splitGroups.find(group => group.includes(studentB));

  if (Agroup == Bgroup) {
    return splitGroups;
  }
  console.log("SG:");
  console.log(splitGroups);

  console.log("students: ");
  console.log(studentA, studentB);

  console.log("groups:");
  console.log(Agroup, Bgroup);

  // console.log(Agroup);
  // console.log(Bgroup);
  var Aindex = splitGroups.indexOf(Agroup);
  var Bindex = splitGroups.indexOf(Bgroup);

  
  Agroup = arrayRemove(Agroup, studentA); //remove the students from their groups
  console.log(Agroup);
  Bgroup = arrayRemove(Bgroup, studentB);
  console.log(Bgroup[Bindex]);

  Bgroup.push(studentA); //shove them in different groups
  Agroup.push(studentB);

  splitGroups[Aindex] = Agroup;
  splitGroups[Bindex] = Bgroup;


  console.log("FINAL");
  console.log(splitGroups);
  return splitGroups;
}

// console.log(T);

//A swaps with B

function findOptimum(sG, prefs) {
  var splitGroups = JSON.parse(JSON.stringify(sG));
  prefs.forEach((pref) => {
    var student = pref[0];
    var studentPrefs = pref[1];
    var studentGroup = splitGroups.find(group => group.includes(student));

    studentPrefs.forEach((person) => {
      var personGroup = splitGroups.find(group => group.includes(person));

      //the person wants a swap; "student" wants to be in "person"'s group | "student" may swap with "swapPerson" in order to do so
        var swapPeople = arrayRemove(personGroup, person);

        swapPeople.forEach((swapPerson) => { //for every person to swap with
          var gain = 0;
          //student -> A, swapPerson -> B 
          //A group = studentGroup, B group = personGroup (same as swap group)
          //Aprefs = studentPrefs, Bprefs = Bprefs
          var wantingA = findWanting(student, prefs);
          var wantingB = findWanting(swapPerson, prefs);
          var Bprefs = findStudentPrefs(swapPerson, prefs)[1];

          personGroup.forEach((Bperson) => {
            if (wantingB.includes(Bperson)) { //someone in B's group wanted B
              gain--;
              console.log(`${Bperson} wanted ${swapPerson}`);
            }

            if (wantingA.includes(Bperson)) { //somone in B's group wants A
              gain++;
            }

            if (Bprefs.includes(Bperson)) { //B wanted someone in group B
              gain--;
              console.log(`${swapPerson} wanted ${Bperson}`);
            }

            if (studentPrefs.includes(Bperson)) { //A wants someone in B group
              gain++;
            }
          });

          studentGroup.forEach((Aperson) => {
            if (wantingA.includes(Aperson)) { //someone in A's group wanted A
              gain--;
              console.log(`${Aperson} wanted ${student}`);
            }

            if (wantingB.includes(Aperson)) { //somone in A's group wants B
              gain++;
            }

            if (studentPrefs.includes(Aperson)) { //A wanted someoen in their group
              gain--;
              console.log(`${student} wanted ${Aperson}`);
            }

            if (Bprefs.includes(Aperson)) { //B wants someone in A group
              gain++;
            }
          });

          if (gain > 0) {
            console.log("SWAPPING!");

            console.log(swapPerson);
            console.log(student);
            splitGroups = swapTwoPeople(splitGroups, swapPerson, student);
            //swap
          }

          // studentGroup.forEach((Aperson) => {
          //   if (wantingA.includes(Aperson)) { //someone in A's group wanted A
          //     gain--;
          //   }
          // });
          

          console.log("SWAP COST: ");
          console.log(student);
          console.log(swapPerson);
          console.log(gain);
          console.log("");

        });
        
    });
  });

  return splitGroups;
}


var testSplitGroups = splitIntoGroups(3, testList);
console.log(testSplitGroups);
console.log(findOptimum(splitIntoGroups(4, testList), testPrefs));