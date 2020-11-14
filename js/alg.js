// const { group } = require("console");
// const e = require("express");
// const { remove } = require("fs-extra");
// const { array } = require("yargs");

const { group } = require("console");
const { completion } = require("yargs");

function arrayRemoveSet(array, removeArray) {
  var arrayCopy = array;
  removeArray.forEach((element) => {
    arrayCopy = arrayCopy.filter(elem => elem != element);
  });

  return arrayCopy;
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

function generateCombinations(sourceArray, comboLength) {
  const sourceLength = sourceArray.length;
  if (comboLength > sourceLength) return [];

  const combos = []; // Stores valid combinations as they are generated.

  const makeNextCombos = (workingCombo, currentIndex, remainingCount) => {
    const oneAwayFromComboLength = remainingCount == 1;

    for (let sourceIndex = currentIndex; sourceIndex < sourceLength; sourceIndex++) {
      const next = [ ...workingCombo, sourceArray[sourceIndex] ];

      if (oneAwayFromComboLength) {
        combos.push(next);
      }
      else {
        makeNextCombos(next, sourceIndex + 1, remainingCount - 1);
      }
        }
  }

  makeNextCombos([], 0, comboLength);
  return combos;
}

function endSwap(array, newArray) {
	var copy = JSON.parse(JSON.stringify(array)); 
	Array.prototype.splice.apply(copy, [copy.length-newArray.length, newArray.length].concat(newArray));
  return copy;
}


// console.log(endSwap([1, 2, 3, 4], [4234, 23234]));


var testPrefs = [
  [1, [7, 3]], 
  [2, [7, 1]], 
  [3, [1]], 
  [4, [5, 2]], 
  [5, [3, 7]], 
  [6, [1]], 
  [7, [1]],
  [8, [1]],
  [9, [1]],
  [10, [1]],
  [11, [1]],
  [12, [1]],
  [13, [1]],
  [14, [1]],
  [15, [1]],
  [16, [1]],
  [17, [1]]
];
var testList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
var sampleGroupArray = [];


function possibleGroups(list, groupSize, prefs) {
  var numGroups = Math.ceil(list.length / groupSize);
  // console.log(pickSlot(list, groupSize, numGroups).length);
  var final;
  function evaluate(groupSet, prefs) {
    var cost = 0;
    prefs.forEach((pref) => {
      var studentGroup = groupSet.find(group => group.includes(pref[0]));
      if (studentGroup) {
        pref[1].forEach((person) => {
          if (!studentGroup.includes(person)) {
            cost++;
          };
        });

      }
      // console.log(cost);
    });
    // console.log(cost);

    return cost;

  }

  var minCost = 99999999999999999999;
  function pickSlot(list, groupSize, nG, prefs) { //nG = num groups
    var prefs = testPrefs;
    generateCombinations(list, groupSize).forEach((set) => {

      sampleGroupArray.push(set);
      var newSource = arrayRemoveSet(list, set);
      if (newSource.length > 0) {
        if (newSource.length >= groupSize) {
          pickSlot(newSource, groupSize, nG);
        }
        else {
          sampleGroupArray.push(newSource);
          var currentCost = evaluate(sampleGroupArray, prefs);
          if (currentCost < minCost) {
            console.log(currentCost);
            minCost = currentCost;
            final = sampleGroupArray;
          }
          // final.push(sampleGroupArray);
          sampleGroupArray = [];
        }
      }


      if (newSource.length == 0) {
        if (sampleGroupArray.length >= nG) {
          // final[index] = sampleGroupArray;
          // final.push(sampleGroupArray);
          var currentCost = evaluate(sampleGroupArray, prefs);

          if (currentCost < minCost) {
            console.log(currentCost);
            minCost = currentCost;
            final = sampleGroupArray;
          }
          // console.log(sampleGroupArray);
          sampleGroupArray = [];
        }

        else {
          var lastOutput = final[final.length-1];
          // var lOC = JSON.parse(JSON.stringify(lastOutput));
          // console.log(lOC);
          var newOutput = endSwap(lastOutput, sampleGroupArray);
          sampleGroupArray = [];
          var currentCost = evaluate(newOutput, prefs);

          if (currentCost < minCost) {
            console.log(currentCost);
            minCost = currentCost;
            final = sampleGroupArray;
          }
          // final.push(newOutput);

        }
      }
    });
    // console.log(final);
    return final;
  } 
  return pickSlot(list, groupSize, numGroups, prefs);
}
// console.log(possibleGroups(0, testList, 3));
// possibleGroups(testList, 4).forEach((group) => {
//   console.log(group);
// })
// console.log(possibleGroups(testList, 4, testPrefs));



// // findOptimum(testPrefs, testList, 4);