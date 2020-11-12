const { group } = require("console");
const e = require("express");
const { remove } = require("fs-extra");
const { array } = require("yargs");

function arrayRemove(array, element) {
  return array.filter(elem => elem != element);
}

function arrayRemoveSet(array, removeArray) {
  var arrayCopy = array;
  removeArray.forEach((element) => {
    arrayCopy = arrayCopy.filter(elem => elem != element);
  });

  return arrayCopy;
}


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

function findStudentPrefs(student, prefs) {
  var studentPrefs = false;
  prefs.forEach((pref) => {
    if (pref[0] == student) {
      studentPrefs = pref;
    }
  });

  return studentPrefs;
}

function pushIntoGroups(studentSet, groups, groupSize) {
  var groupToPush = groups.find(group => (group.length + studentSet.length) <= groupSize);
  studentSet.forEach((student) => {
    groupToPush.push(student);
  });  
}


function findOptimum(prefs, studentList, groupSize) {
  var bestGroups = [];

  var numGroups = Math.ceil(studentList.length / groupSize);
  for (var i = 0; i < numGroups; i++) {
    bestGroups.push([]); //initialize groups with empty arrays (to be pushed later)
  }
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
  var arrayCopy = array;
  arrayCopy.splice(-1 * newArray.length);
  newArray.forEach((element) => {
    arrayCopy.push(element);
  });
  return arrayCopy;
}


console.log("FINAL: ");

var testPrefs = [[1, [4, 3]], [2, [7, 1]], [3, [1]], [4, [5, 2]], [5, [3, 7]], [6, [1]], [7, [2]]];
var testList = [1, 2, 3, 4, 5, 6, 7, 8, 9];
var sampleGroupArray = [];
const final = [];
var i = 0;
var nG = 3;
function pickSlot(index, list, groupSize) {

  generateCombinations(list, groupSize).forEach((set) => {
    // console.log("set: ")
    // console.log(set);

    sampleGroupArray.push(set);
    var newSource = arrayRemoveSet(list, set);
    // console.log("new :")
    // console.log(newSource);
    if (newSource.length > 0) {
      pickSlot(index++, newSource, groupSize);
    }

    if (newSource.length == 0) {
      if (sampleGroupArray.length >= nG) {
        console.log("yay!");
        console.log(sampleGroupArray);
        final.push(sampleGroupArray);
        sampleGroupArray = [];
      }

      else {
        console.log("bruh");
        console.log(sampleGroupArray);
        var lastOutput = final[final.length-1];
        var newOutput = endSwap(lastOutput, sampleGroupArray);
        console.log(lastOutput);
        console.log(newOutput);
        sampleGroupArray = [];

        final.push(newOutput);

      }
    }
  });
  return final;
} 
console.log(pickSlot(0, testList, 3));

// // findOptimum(testPrefs, testList, 4);