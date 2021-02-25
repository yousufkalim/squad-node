// =========================== Final =============================


Date.prototype.addDays = function(days) {
var date = new Date(this.valueOf());
date.setDate(date.getDate() + days);
return date;
}

Date.prototype.addHours = function(h) {
var date = new Date(this.valueOf());
date.setTime(date.getTime() + (h*60*60*1000));
return date;
}

Date.prototype.removeMinutes = function(m) {
var date = new Date(this.valueOf());
date.setTime(date.getTime() - (m*60*1000));
return date;
}

const currentDate = new Date();

const afterTwoDaysDate = currentDate.addDays(2);
const afterTwoDaysDateOneHour = afterTwoDaysDate.addHours(1);
const beforeOneMinsDate = currentDate.removeMinutes(1);

/*=== startTime ==
lessthan: afterTwoDaysDateOneHour
Greatthan: afterTwoDaysDate
==========================*/



//const afterOneDaysDate = currentDate.addDays(1);

//events.find({startTime:afterTwoDaysDate})
console.log("currentDate",currentDate);
console.log("afterTwoDaysDate",afterTwoDaysDate);
console.log("afterTwoDaysDateOneHour",afterTwoDaysDateOneHour);
console.log("beforeOneMinsDate",beforeOneMinsDate);
//console.log("afterOneDaysDate",afterOneDaysDate);