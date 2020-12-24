
function arrayRemove(array, element) {
  let arrayCopy = JSON.parse(JSON.stringify(array));
  return arrayCopy.filter(elem => JSON.stringify(elem) != JSON.stringify(element)); //watch for json.stringify it doesnt actually compare the elements
}


/*
constraintType can be either:
  "groupSize": the number of people in each group
  "numGroups": the total number of groups to be formed
*/
function findOptimum(constraintType, constraint, studentList, prefs) {

  function splitIntoGroups(constraintType, constraint, studentList) {
    let groupSize;
    let numGroups;
    if (constraintType == "groupSize") {
       groupSize = constraint;
       numGroups = Math.ceil(studentList.length / groupSize);
    }

    if (constraintType == "numGroups") {
       groupSize = Math.ceil(studentList.length / constraint);
       numGroups = constraint;
    }



    let splitGroups = [];

    for (let i = 0; i < numGroups; i++) {
      splitGroups.push([]);
    }

    let j = 0;
    for (let i = 0; i < studentList.length; i++) {
      if (splitGroups[j].length >= groupSize) {
        j++;
      }
      splitGroups[j].push(studentList[i]);
    }

    return splitGroups;
  }


  function findWanting(person, prefs) { //find who wants a certain person in their group
    let people = [];
    prefs.forEach((pref) => {
      let student = pref[0];
      let studentPrefs = pref[1];

      if (studentPrefs.includes(person)) {
        people.push(student);
      }
    });

    return people;

  }

  function findStudentPrefs(student, prefs) {
    let studentPrefs = false;
    prefs.forEach((pref) => {
      if (pref[0] == student) {
        studentPrefs = pref;
      }
    });

    return studentPrefs;
  }

  function swapTwoPeople(sG, studentA, studentB) {

    let splitGroups = JSON.parse(JSON.stringify(sG));
    let Agroup = splitGroups.find(group => group.includes(studentA));
    let Bgroup = splitGroups.find(group => group.includes(studentB));

    if (Agroup == Bgroup) {
      return splitGroups;
    }

    let Aindex = splitGroups.indexOf(Agroup);
    let Bindex = splitGroups.indexOf(Bgroup);


    Agroup = arrayRemove(Agroup, studentA); //remove the students from their groups
    Bgroup = arrayRemove(Bgroup, studentB);

    Bgroup.push(studentA); //shove them in different groups
    Agroup.push(studentB);

    splitGroups[Aindex] = Agroup;
    splitGroups[Bindex] = Bgroup;

    return splitGroups;
  }

  let splitGroups = splitIntoGroups(constraintType, constraint, studentList);
  for (let i = 0; i < 2; i++) {
    prefs.forEach((pref) => {
      let student = pref[0];
      let studentPrefs = pref[1];
      let studentGroup = splitGroups.find(group => group.includes(student));

      studentPrefs.forEach((person) => {
        let personGroup = splitGroups.find(group => group.includes(person));

        //the person wants a swap; "student" wants to be in "person""s group | "student" may swap with "swapPerson" in order to do so
        let swapPeople = arrayRemove(personGroup, person);

        swapPeople.forEach((swapPerson) => { //for every person to swap with
          let gain = 0;
          //student -> A, swapPerson -> B 
          //A group = studentGroup, B group = personGroup (same as swap group)
          //Aprefs = studentPrefs, Bprefs = Bprefs
          let wantingA = findWanting(student, prefs);
          let wantingB = findWanting(swapPerson, prefs);
          let Bprefs = findStudentPrefs(swapPerson, prefs)[1];

          personGroup.forEach((Bperson) => {
            if (wantingB.includes(Bperson)) { //someone in B"s group wanted B
              gain--;
            }

            if (wantingA.includes(Bperson)) { //somone in B"s group wants A
              gain++;
            }

            if (Bprefs.includes(Bperson)) { //B wanted someone in group B
              gain--;
            }

            if (studentPrefs.includes(Bperson)) { //A wants someone in B group
              gain++;
            }
          });

          studentGroup.forEach((Aperson) => {
            if (wantingA.includes(Aperson)) { //someone in A"s group wanted A
              gain--;
            }

            if (wantingB.includes(Aperson)) { //somone in A"s group wants B
              gain++;
            }

            if (studentPrefs.includes(Aperson)) { //A wanted someone in their group
              gain--;
            }

            if (Bprefs.includes(Aperson)) { //B wants someone in A group
              gain++;
            }
          });

          if (gain > 0) {
            splitGroups = swapTwoPeople(splitGroups, swapPerson, student);
            //swap
          }

          // studentGroup.forEach((Aperson) => {
          //   if (wantingA.includes(Aperson)) { //someone in A"s group wanted A
          //     gain--;
          //   }
          // });

        });

      });
    });
  }

  if (splitGroups[splitGroups.length - 1].length < 2) { //shove a lone student into a group
    if (splitGroups[splitGroups.length - 1][0]) { //this will happen if numGroups > studentList.length (aka troll input)
      splitGroups[splitGroups.length - 2].push(splitGroups[splitGroups.length - 1][0]);
      splitGroups.pop();
    }
  }

  splitGroups = splitGroups.filter(group => group.length > 0); //filter out any empty groups
  return splitGroups;
}

let testList = [1, 2, 3, 4];
let testPrefs = [
  [1, [2]],
  [2, [3]],
  [3, [4]],
  [4, [3]]
];


console.log(findOptimum("numGroups", 3, testList, testPrefs));