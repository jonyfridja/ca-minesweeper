'use strict';
const MINE = '💣';
const EMPTY = '';
const FLAG = '🚩';
const keyToEmojiMap = {
    regular: '🙂',
    start: '🙂',
    scared: '😮',
    hurt: '😫', // hurt isnt currently used
    victory: '😎',
    lost: '😱'
};

var gBoardSizes = [
    { name: 'Easy', size: 4 * 4, minesCount: 2 },
    { name: 'Medium', size: 8 * 8, minesCount: 12 },
    { name: 'Hard', size: 12 * 12, minesCount: 30 }
];

// CR: all in all a very good project.
// CR: there are some processes that could've been simplified.
// CR: also, a clean up for unused code would have made it a lot better.

var gBoard;
var gGameStatus;
var gHP;
var gDifficultyIdx = 2;
var gHintsLeft;
var gTimerInterval;
var gTimeStarted;
var gLocalStorageKey = 'high-score';

function initGame() {
    document.querySelector('.timer').innerText = '--:--';
    document.querySelector('.replay').classList.add('hidden');
    gGameStatus = 'start';
    gHP = 3;
    updateLife(0);
    clearInterval(gTimerInterval);
    gBoard = emptyBoard();
    renderDifficulties();
    renderBoard();
    updateEmoji(gGameStatus);
    displayStoredScore();
}

function renderDifficulties() {
    var strHTML = ''
    for (var i = 0; i < gBoardSizes.length; i++) {
        var diff = gBoardSizes[i];
        var cssClass = (gDifficultyIdx === i) ? 'selected' : '';
        strHTML += `<div onclick="changeDiff(${i})" class="${cssClass}">
                        ${diff.name}
                    </div>`
    }
    document.querySelector('.diff').innerHTML = strHTML;
}

function changeDiff(diffIdx) {
    gDifficultyIdx = diffIdx;
    initGame();
}

function buildBoard(posClicked) {
    var board = [];
    var boardSize = gBoardSizes[gDifficultyIdx];
    var rowSize = Math.sqrt(boardSize.size);
    var colSize = rowSize;
    var mines = getShuffledMines(posClicked);
    for (var i = 0; i < rowSize; i++) {
        var row = [];
        for (var j = 0; j < colSize; j++) {
            var mineIdx = (i * rowSize) + j;
            var cellInPrevBoard = gBoard[i][j];
            var cell = {
                value: mines[mineIdx],
                isShown: false,
                isMakred: cellInPrevBoard.isMarked
            };
            row.push(cell);
        }
        board.push(row);
    }
    setMinesNegsCount(board);
    return board;
}

function emptyBoard() {
    var board = [];
    var boardSize = gBoardSizes[gDifficultyIdx];
    var rowSize = Math.sqrt(boardSize.size);
    var colSize = rowSize;
    for (var i = 0; i < rowSize; i++) {
        var row = [];
        for (var j = 0; j < colSize; j++) {
            var mine = {
                value: EMPTY,
                isShown: false,
                isMakred: false
            };
            row.push(mine);
        }
        board.push(row);
    }
    return board;
}

function renderBoard() {
    var strHTML = '';
    for (var i = 0  ; i < gBoard.length; i++) {
        var row = '<div class="row">'
        for (var j = 0; j < gBoard[0].length; j++) {
            var mine = gBoard[i][j];
            var squareClass = `square cell${i}-${j}`;
            var squareContent = '';
            if (mine.isMarked) squareContent = FLAG;
            else if (mine.isShown) {
                squareContent = mine.value;
                if (mine.value === MINE) squareClass += ' exploded';
                else squareClass += ' revealed';
            }
            // oncontextmenu="cellMarked(event, ${i}, ${j})">
            var cell = `<div class="${squareClass}" onmouseup="cellClicked(event, ${i}, ${j})"
                            onmousedown="updateEmoji('scared')" oncontextmenu="return false;">
                            ${squareContent}
                        </div>`;
            row += cell;
        }
        row += '</div>';
        strHTML += row;
    }
    strHTML += '';

    document.querySelector('.board').innerHTML = strHTML;
}

function cellClicked(ev, i, j) {
    var pos = { i: i, j: j };
    var cell = gBoard[i][j];
    if (cell.isShown) {
        updateEmoji('regular');
        return;
    }
    if (ev.which === 3) {
        console.log('rightclicked');
        markCell(pos);
    } else if (ev.which === 1) {
        if (gGameStatus === 'start') {
            gBoard = buildBoard(pos);
            showCells(pos);
            gGameStatus = 'started';
            gTimeStarted = new Date();
            gTimerInterval = setInterval(updateTimer, 1000);
        } else if (!cell.isMarked) {
            var isHurt = cell.value === MINE;
            if (isHurt) {
                showNeg(pos);
                updateLife(-1);
            } else showCells(pos);
        }
    }

    // console.log('cellClicked', ev);
    // if (gGameStatus === 'start') {
    //     gBoard = buildBoard(pos);
    //     showCells(pos);
    //     gGameStatus = 'started';
    //     gTimeStarted = new Date();
    //     gTimerInterval = setInterval(updateTimer, 1000);
    // } else {
    //     var cell = gBoard[i][j];
    //     if (cell.isShown) return;
    //     if (ev.which === 3) {
    //         markCell(i, j);
    //     } else if (ev.which === 1 && !cell.isMarked) {
    //         var isHurt = cell.value === MINE;
    //         if (isHurt) {
    //             showNeg(pos);
    //             updateLife(-1);
    //         } else showCells(pos);
    //     }
    // }
    checkGameOver();
    updateEmoji('regular');
    renderBoard();
}

function showCells(pos) {
    var cell = gBoard[pos.i][pos.j];
    cell.isShown = true;

    var negs = getNegs(gBoard, pos);
    var showCellsAgain = [];
    for (var i = 0; i < negs.length; i++) {
        var negPos = { i: negs[i].i, j: negs[i].j };
        var negCell = gBoard[negPos.i][negPos.j];
        if (negCell.value === EMPTY && !negCell.isShown) showCellsAgain.push(negPos);

        if (cell.value === EMPTY && negCell.value !== MINE) {
            negCell.isShown = true
        }
        // if (cell.value !== MINE && !cell.isShown) {
        //     cell.isShown = true;
        // }
    }

    for (var i = 0; i < showCellsAgain.length; i++) {
        showCells(showCellsAgain[i]);
    }
}

function showNeg(pos) {
    // console.log('showneg with pos:', pos);
    var mine = gBoard[pos.i][pos.j];
    if (!mine.isMarked) mine.isShown = true;
}

function updateLife(num) {
    gHP += num;
    document.querySelector('.life span').innerText = gHP;
}

function showAllBombs() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            var mine = gBoard[i][j];
            if (mine.value === MINE) mine.isShown = true;
        }
    }
    renderBoard();
}

function checkGameOver() {
    var markedMinesCount = gBoardSizes[gDifficultyIdx].minesCount;
    var shownMinesCount = 0;

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            var mine = gBoard[i][j];
            if (mine.value === MINE) {
                if (mine.isMarked) markedMinesCount--;
                if (mine.isShown) shownMinesCount++;
            }
        }
    }
    // console.clear();
    // console.log('markedMinesCount', markedMinesCount);
    // console.log('shownMinesCount', shownMinesCount);
    // console.log('marked - shown', markedMinesCount - shownMinesCount);
    if (gHP === 0) {
        gGameStatus = 'lost';
        gameOver();
    } else if (markedMinesCount - shownMinesCount === 0) {
        gGameStatus = 'victory';
        gameOver();
    }
}

function gameOver() {
    // console.log('game over! ' + gGameStatus);
    showAllBombs();
    // replay button
    document.querySelector('.replay').classList.remove('hidden');
    switch (gGameStatus) {
        case 'victory':
            updateScore();
        case 'lost':
            var emojiEl = document.querySelector('.emoji');
            emojiEl.innerText = keyToEmojiMap[gGameStatus];
            break;
    }
    clearInterval(gTimerInterval);
}



function updateScore() {
    var currScore = getTime() / 1000;
    var storedScore = localStorage.getItem(gLocalStorageKey);
    if (!storedScore || currScore < (+storedScore)) {
        localStorage.setItem(getLocalStorageKey(), currScore);
    }
    displayStoredScore();
}

function displayStoredScore() {
    if (typeof Storage !== "undefined") {
        var score = localStorage.getItem(getLocalStorageKey());
        var highScoreEl = document.querySelector('.high-score');
        if (score) {
            highScoreEl.innerText = ` (Best: ${score} seconds)`;
        } else highScoreEl.innerText = '';
    }
}

function getLocalStorageKey() {
    var diffName = gBoardSizes[gDifficultyIdx].name;
    var key = gLocalStorageKey + '-' + diffName;
    return key.toLowerCase();
}

function updateEmoji(key) {
    // CR: functions that render to the DOM should be named as such. i.e. renderEmoji
    if (gGameStatus === 'lost' || gGameStatus === 'victory') return;
    var emojiEl = document.querySelector('.emoji');
    if (emojiEl) emojiEl.innerText = keyToEmojiMap[key];
}


function updateTimer() {
    var date = getTime();
    var minutes = Math.floor((date / (60 * 1000)) % 60).toString().padStart(2, '0');
    var seconds = Math.floor(((date / 1000)) % 60).toString().padStart(2, '0');
    document.querySelector('.timer').innerText = `${minutes}:${seconds}`;
}

function getTime() {
    var date = new Date() - gTimeStarted;
    // console.log(date);
    return date;
}

function cellSelector(pos) {
    return `cell${pos.i}-${pos.j}`;
}



function markCell(pos) {
    var cell = gBoard[pos.i][pos.j];
    cell.isMarked = !cell.isMarked;
}

function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            var cell = board[i][j];
            if (cell.value === MINE) continue;
            var pos = { i: i, j: j };
            // edit! - can implement better, without looping for each mine
            // can loop through board and whenever you encounter a mine
            // add + 1 to the value of the negs (just n^2 instead)
            var minesCount = getNegs(board, pos).filter((pos) => {
                var cell = board[pos.i][pos.j];
                if (cell.value === MINE) return true;
                return false;
            }).length;
            cell.value = minesCount;
            if (cell.value === 0) cell.value = EMPTY;
        }
    }
}

function getShuffledMines(pos) {
    // CR: there were simpler ways for this idea.
    var mines = [];
    var boardSize = gBoardSizes[gDifficultyIdx];
    var rowSize = Math.sqrt(boardSize.size);
    var minesCount = boardSize.minesCount;
    for (var i = 0; i < boardSize.size; i++) {
        if (minesCount > 0) {
            mines.push(MINE);
            minesCount--;
        } else mines.push(EMPTY);
    }
    shuffle(mines);
    while (mines[(pos.i * rowSize) + pos.j] === MINE) {
        shuffle(mines);
    }

    return mines;
}