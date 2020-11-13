// const { group } = require("console");
// const e = require("express");
// const { remove } = require("fs-extra");
// const { array } = require("yargs");

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


var testPrefs = [[1, [4, 3]], [2, [7, 1]], [3, [1]], [4, [5, 2]], [5, [3, 7]], [6, [1]], [7, [2]]];
var testList = [1, 2, 3, 4, 5, 6, 7, 8, 9];
var sampleGroupArray = [];
const final = [];
function pickSlot(index, list, groupSize, nG) { //nG = num groups

  generateCombinations(list, groupSize).forEach((set) => {

    sampleGroupArray.push(set);
    var newSource = arrayRemoveSet(list, set);
    if (newSource.length > 0) {
      pickSlot(index++, newSource, groupSize, nG);
    }

    if (newSource.length == 0) {
      if (sampleGroupArray.length >= nG) {
        // final[index] = sampleGroupArray;
        final.push(sampleGroupArray);
        // console.log(sampleGroupArray);
        sampleGroupArray = [];
      }

      else {
        var lastOutput = final[final.length-1];
        // var lOC = JSON.parse(JSON.stringify(lastOutput));
        // console.log(lOC);
        var newOutput = endSwap(lastOutput, sampleGroupArray);
        sampleGroupArray = [];
        final.push(newOutput);

      }
    }
  });
  // console.log(final);
  return final;
} 

function possibleGroups(index, list, groupSize) {
  var numGroups = Math.ceil(list.length / groupSize);
  return pickSlot(index, list, groupSize, numGroups);
}
// console.log(possibleGroups(0, testList, 3));
possibleGroups(0, testList, 3).forEach((group) => {
  console.log(group);
})
// console.log(possibleGroups(0, testList, 3).length);

// // findOptimum(testPrefs, testList, 4);