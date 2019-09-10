// helps loop through neighbors in a board
// returns the range to iterate through
function getRange(board, pos, ringCount) {
    var range = {
        iStart: pos.i - ringCount,
        iEnd: pos.i + ringCount,
        jStart: pos.j - ringCount,
        jEnd: pos.j + ringCount
    };
    if (range.iStart < 0) range.iStart = 0;
    if (range.iEnd >= board.length) range.iEnd = board.length - 1;
    if (range.jStart < 0) range.jStart = 0;
    if (range.jEnd >= board[0].length) range.jEnd = board[0].length - 1;
    return range;
}

function getNegs(board, pos) {
    var range = getRange(board, pos, 1);
    var negs = [];
    for (var i = range.iStart; i <= range.iEnd; i++) {
        for (var j = range.jStart; j <= range.jEnd; j++) {
            // uninclude itself
            if (pos.i === i && pos.j === j) continue;
            var negPos = { i: i, j: j }
            negs.push(negPos);
        }
    }
    return negs;
}


// this is borrowed code, link: https://javascript.info/task/shuffle
// even though I've tried understanding the weird array command, I remain in the dark
function shuffle(nums) {
    for (var i = nums.length - 1; i > 0; i--) {
        var j = getRandomInt(0, i);
        [nums[i], nums[j]] = [nums[j], nums[i]];
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}