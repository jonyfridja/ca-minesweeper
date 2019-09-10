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
    renderEmoji(gGameStatus);
    displayStoredScore();
}

function renderDifficulties() {
    var strHTML = '<ul>';
    for (var i = 0; i < gBoardSizes.length; i++) {
        var diff = gBoardSizes[i];
        var cssClass = (gDifficultyIdx === i) ? 'selected' : '';
        strHTML += `<li onclick="changeDiff(${i})" class="${cssClass}">
                        ${diff.name}
                    </li>`;
    }
    strHTML += '</ul>';
    document.querySelector('.diff').innerHTML = strHTML;
}

function changeDiff(diffIdx) {
    gDifficultyIdx = diffIdx;
    initGame();
}

// setting this with css is imposible
function renderExplosion(pos) {
    var animationDuration = 500;
    var fps = 60;
    var cellEl;
    var propertiesThatChange = {
        min: -6,
        max: 6,
        interval: null
    }
    var interval;

    // delay for a ms so this runs after the renderBoard function is done
    setTimeout(() => {
        console.log('after 3ms');
        // taking a better
        cellEl = document.querySelector(`.cell${pos.i}-${pos.j}`);
    }, 1);

    interval = setInterval(function () {
        var cssTop = getRandomInt(propertiesThatChange.min, propertiesThatChange.max);
        var cssLeft = getRandomInt(propertiesThatChange.min, propertiesThatChange.max);
        cellEl.style.top = cssTop + 'px';
        cellEl.style.left = cssLeft + 'px';
    }, animationDuration / fps);
    // ending animation
    setTimeout(function () {
        clearInterval(interval);
        cellEl.style.top = 0;
        cellEl.style.left = 0;
    }, animationDuration);
    // stages of exposion
    for (let i = 3; i >= 1; i--) {
        setTimeout(() => {
            propertiesThatChange.max = i;
            propertiesThatChange.min = -i;
        }, (animationDuration / 4) * i);
    }
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
    for (var i = 0; i < gBoard.length; i++) {
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
            var cell = `<div class="${squareClass}" onmouseup="cellClicked(event, ${i}, ${j})"
                            onmousedown="renderEmoji('scared')" oncontextmenu="return false;">
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
        renderEmoji('regular');
        return;
    }
    if (ev.which === 3) {
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
                renderExplosion(pos);
                console.log('hurt and explosion time!');
                showNeg(pos);
                updateLife(-1);
            } else showCells(pos);
        }
    }
    checkGameOver();
    renderEmoji('regular');
    renderBoard();
}

function buildBoard(posClicked) {
    var board = [];
    var boardSize = gBoardSizes[gDifficultyIdx];
    var rowSize = Math.sqrt(boardSize.size);
    var colSize = rowSize;
    var mines = getShuffledMines(posClicked);
    console.log(mines);
    var mineIdx = 0;
    for (var i = 0; i < rowSize; i++) {
        var row = [];
        for (var j = 0; j < colSize; j++) {
            var pos = { i: i, j: j };
            var cellValue = EMPTY;
            var filtered = mines.filter(function (filterPos) {
                return isSamePos(pos, filterPos);
            });
            var isMine = filtered.length !== 0;
            // part of the new implementation
            // console.log('filtered', filtered);
            // console.log('isPosExists', isMine);
            // console.log('mineIdx < mines.length && !isPosExists', mineIdx < mines.length && !isMine);
            // console.log('-------');
            if (mineIdx < mines.length && isMine) {
                // console.log('adding MINE');
                cellValue = MINE;
                mineIdx++;
            }

            var cellInPrevBoard = gBoard[i][j];
            var cell = {
                value: cellValue,
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

function getShuffledMines(clickedPos) {
    var mines = [];
    var minesCount = gBoardSizes[gDifficultyIdx].minesCount;
    var boardSize = gBoardSizes[gDifficultyIdx].size;
    var rowSize = Math.sqrt(boardSize);
    var colSize = rowSize;

    while (minesCount > 0) {
        var rndPos = {
            i: getRandomInt(0, rowSize),
            j: getRandomInt(0, colSize)
        }
        if(!isSamePos(clickedPos, rndPos)) {
            var filtered = mines.filter(function (pos) {
                return isSamePos(pos, rndPos);
            });
            var isMineExists = filtered.length !== 0;
            if (!isMineExists) {
                mines.push(rndPos);
                minesCount--;
            }
        }
    }
    return mines;
}

function isSamePos(pos1, pos2) {
    return pos1.i === pos2.i && pos1.j === pos2.j;
}

// an older implementation
// function getShuffledMines(pos) {
//     var mines = [];
//     var boardSize = gBoardSizes[gDifficultyIdx];
//     var rowSize = Math.sqrt(boardSize.size);
//     var minesCount = boardSize.minesCount;
//     for (var i = 0; i < boardSize.size; i++) {
//         if (minesCount > 0) {
//             mines.push(MINE);
//             minesCount--;
//         } else mines.push(EMPTY);
//     }
//     shuffle(mines);
//     while (mines[(pos.i * rowSize) + pos.j] === MINE) {
//         shuffle(mines);
//     }

//     return mines;
// }


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
    }

    for (var i = 0; i < showCellsAgain.length; i++) {
        showCells(showCellsAgain[i]);
    }
}

function showNeg(pos) {
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
    if (gHP === 0) {
        gGameStatus = 'lost';
        gameOver();
    } else if (markedMinesCount - shownMinesCount === 0) {
        gGameStatus = 'victory';
        gameOver();
    }
}

function gameOver() {
    showAllBombs();
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

function renderEmoji(key) {
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
