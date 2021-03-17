
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

  function shuffleArray(array) {
    let arrayCopy = array.slice(0);
    for (let i = arrayCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
    }

    return arrayCopy;
  }

  function evaluateGroupSet(groups, prefs) {
    let cost = 0; //# of student prefrences NOT fulfilled
    prefs.forEach((pref) => {

      let student = pref[0];
      let studentGroup = groups.find(group => group.includes(student));
      pref[1].forEach((person) => {
        if (!studentGroup.includes(person)) {
          cost++;
        }
      });
      
    });

    return cost;
  }


  //MAIN LOOP
  let bestCost = 9999;
  let bestGroup;
  let iteration;
  for (let j = 0; j <= studentList.length*2; j++) {
    let randStudentList = shuffleArray(studentList);
    // console.log(`using list: ${randStudentList}`);
    splitGroups = splitIntoGroups(constraintType, constraint, randStudentList);
    for (let i = 0; i < 2; i++) { //twice for good measure
      prefs.forEach((pref) => { //for every student prefrence
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
    
    groupCost = evaluateGroupSet(splitGroups, prefs);
    if (evaluateGroupSet(splitGroups, prefs) < bestCost) {
      // console.log("good group found. cost was " + groupCost + " on iteration " + (j+1));
      iteration = j+1;
      bestCost = groupCost;
      bestGroup = splitGroups;
    }

  }

  return {
    best: bestGroup,
    iter: iteration,
    cost: bestCost
  };
}




let iters = [];
for (i = 0; i < 50; i++) {
  //randomly generate a set of prefrences to use

  let numberOfStudents = Math.floor(Math.random() * 10) + 20;
  let finalPrefs = [];
  let studentList = [];
  for (let i = 1; i <= numberOfStudents; i++) {
    studentList.push(i);
    let chosen = [];
    let numberOfPrefs = Math.floor(Math.random() * (numberOfStudents / 2)) + 1;
    let pref = [i, []];
    for (let i = 0; i <= numberOfPrefs; i++) {
      picked = Math.floor(Math.random() * numberOfStudents) + 1;
      if (!chosen.includes(picked)) {
        chosen.push(picked);
        pref[1].push(picked);
      }

    }

    finalPrefs.push(pref);
  }
  console.time("opt");
  optimum = findOptimum("numGroups", 8, studentList, finalPrefs);
  console.timeEnd("opt");
  itersTook = optimum.iter;
  cost = optimum.cost;
  iters.push(itersTook);
  console.log(`took ${itersTook} iterations for best group, cost: ${cost}. Size: ${numberOfStudents}`);
}

const avg = arr => {
  const sum = arr.reduce((acc, cur) => acc + cur);
  const average = sum/arr.length;
  return average;
}



console.log(`Mean iterations: ${avg(iters)}.`);
console.log(`Max iterations: ${Math.max.apply(null, iters)}.`);

let testList = [1, 2, 3, 4];


let testPrefs = [
  [1, [2]],
  [2, [3]],
  [3, [4]],
  [4, [3]]
];
