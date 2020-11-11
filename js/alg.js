var permArr = [],
  usedChars = [];
function permute(input) {
  var i, ch;
  for (i = 0; i < input.length; i++) {
    ch = input.splice(i, 1)[0];
    usedChars.push(ch);
    if (input.length == 0) {
      permArr.push(usedChars.slice());
    }
    permute(input);
    input.splice(i, 0, ch);
    usedChars.pop();
  }
  return permArr
};

var testPrefs = [[1, [4]], [2, [7]], [3, [1, 2]], [4, [5]], [5, [3]], [6, [1]], [7, [2]]];
var testList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

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

function findOptimum(prefs, studentList, groupSize) {
  var shuffled = permute(studentList);
  var possibleGroups = [];
  shuffled.forEach((combination) => {
    possibleGroups.push(splitIntoGroups(groupSize, combination));
  });

  var currentMinCost = 99999999999999999999999999;
  var bestGroup;
  possibleGroups.forEach((groupSet) => {
    var cost = 0;
    prefs.forEach((pref) => {
      var studentGroup = groupSet.find(group => group.indexOf(pref[0]) > -1);
      pref[1].forEach((person) => {
        if (!studentGroup.includes(person)) {
          cost++;
        };
      });
      // console.log(cost);
    });
    // console.log(cost);


    if (cost < currentMinCost) {
      bestGroup = groupSet;
      currentMinCost = cost;
    }
  });
  console.log(bestGroup);
  console.log(currentMinCost);

  
} 


findOptimum(testPrefs, testList, 4);