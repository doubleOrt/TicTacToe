const TicTacToe = (function() {
  // returns the index of an element within its parent
  const elementIndex = function elementIndex(el) {
    return Array.from(el.parentNode.children).indexOf(el);
  };

  const mapFunctionToAsync = function mapFunctionToAsync(func) {
    return function(...args) {
      setTimeout( func, 0, ...args );
    };
  };

  const checkMovesHasCombination =
    function checkMovesHasCombination(combination, moves) {
      return combination.every((num) => moves.includes(num));
    };

  /* returns the winning combinations for the specified table-size in a
  2d array. */
  const getWinningCombinations = function getWinningCombinations(tableSize) {
    return getHorizontalWinningCombinations(tableSize)
      .concat( getVerticalWinningCombinations(tableSize) )
      .concat( getDiagonalWinningCombinations(tableSize) );
  };

  const getHorizontalWinningCombinations =
    function getHorizontalWinningCombinations(tableSize) {
      const combinations = [];
      for (let i = 0; i < tableSize; i++) {
        const combination = [];
        for (let a = 0; a < tableSize; a++) {
          combination.push( a + (i * tableSize) );
        }
        combinations.push(combination);
      }
      return combinations;
    };

  const getVerticalWinningCombinations =
    function getVerticalWinningCombinations(tableSize) {
      const combinations = [];
      for (let i = 0; i < tableSize; i++) {
        const combination = [];
        for (let a = 0; a < tableSize; a++) {
          combination.push( i + (a * tableSize) );
        }
        combinations.push(combination);
      }
      return combinations;
    };

  const getDiagonalWinningCombinations =
    function getDiagonalWinningCombinations(tableSize) {
      const combinations = [[], []];
      for (let i = 0; i < tableSize; i++) {
        combinations[0].push( i + (i * tableSize) );
        combinations[1].push( (tableSize - 1 - i) + (i * tableSize) );
      }
      return combinations;
    };

  // generates an HTML table of the specified size (size X size)
  const generateTable = function generateTable(size) {
    const table = document.createElement('table');
    for ( let i = 0; i < size; i++ ) {
      const tr = table.appendChild( document.createElement('tr') );
      for ( let a = 0; a < size; a++ ) {
        tr.appendChild( document.createElement('td') );
      }
    }
    return table;
  };

  const mapPlayer = function mapPlayer(player) {
    const playerCopy = Object.assign(player);
    playerCopy.moves = [];
    return playerCopy;
  };

  /* calculates the 'num' attribute for a cell, which represents
  the cell's position in the grid. */
  const getCellPosition = function getCellPosition(el) {
    return elementIndex(el) + (
      elementIndex(el.parentNode) * el.parentNode.children.length
    );
  };

  const Cell = function Cell(el, num) {
    this.el = el;
    this.setNumAttribute(num);
    this.player = null;
  };

  Cell.clearAll = function clearAll(cells) {
    cells.forEach((cell) => cell.clear());
  };

  Cell.allOccupied = function allOccupied(cells) {
    return cells.every( (cell) => cell.player );
  };

  Cell.prototype.getNumAttribute = function getNumAttribute() {
    return parseInt(this.el.getAttribute('data-num'));
  };

  Cell.prototype.setNumAttribute = function setNumAttribute(num) {
    this.el.setAttribute('data-num', num);
    return this.el;
  };

  Cell.prototype.select = function select(player) {
    // if not empty, return 'false'.
    if (this.player) {
      return false;
    }
    this.player = player;
    this.el.innerHTML = this.player.char;
    if ( this.player.className ) {
      this.el.classList.add( this.player.className );
    }
    return true;
  };

  Cell.prototype.clear = function clear() {
    // if already empty, return.
    if (!this.player) {
      return;
    }
    this.el.innerHTML = '';
    if ( this.player.className ) {
      this.el.classList.remove( this.player.className );
    }
    this.player = null;
  };

  /*
  * 'size': an integer representing the number of both the columns and rows of
  * the game grid.
  * 'players': an object that has a 'char' (specifying the symbol to mark cells
  * with for the player) and a 'className' property (specifying the className
  * to be added to cells occupied by a player).
  *
  */
  const TicTacToe = function TicTacToe(size0, players0) {
    if ( !Number.isInteger(size0) ) {
      throw new Error('You have to pass an integer for the "size" argument.');
    } else if ( !Array.isArray(players0) || !players0.length >= 2 ) {
      throw new Error(
        `You have to pass an array that has at least 2 elements for the
        "players" argument.`
      );
    } else {
      players0.forEach( (player) => {
        if ( !(typeof player.char === 'string') ) {
          throw new Error(
            `Each element in the "players" argument must have a string
            "char" property.`
          );
        }
      } );
    }

    const size = size0;
    let players = players0.map( (player) => mapPlayer(player) );
    const playersInitial = players.slice();
    const winningCombinations = getWinningCombinations(size);
    let gameResolved = false;
    const table = generateTable(size);
    const cells = Array.from( table.getElementsByTagName('td') )
      .map( (el) => new Cell( el, getCellPosition(el) ) );

    const events = {
      'select': null,
      'turn': null,
      'win': null,
      'draw': null,
    };

    for ( let key in events ) {
      if ( events.hasOwnProperty(key) ) {
        let handler = events[key];
        Object.defineProperty(events, key, {
          get() {
            return handler;
          },
          set(newHandler) {
            /* The handlers should be called asynchronously so they don't
              terminate our code as well in case they throw an exception */
            handler = mapFunctionToAsync( newHandler );
          },
          enumerable: true,
          configurable: false,
        });
      }
    }

    /* checks if a player has won, if they have, it returns that player's
      object. */
    const checkForWin = function checkForWin() {
      return players.find(
        (player) => winningCombinations.some(
          (combination) => checkMovesHasCombination(
            combination, player.moves
          )
        )
      );
    };

    /* checks if the game is a draw (draw == all cells occupied && no one
      has won) */
    const checkForDraw = function checkForDraw() {
      return Cell.allOccupied(cells) && !checkForWin();
    };

    const resolveGame = function resolveGame() {
      const winner = checkForWin();
      if ( winner && typeof events['win'] === 'function' ) {
        events['win'](winner);
      } else if ( checkForDraw() && typeof events['draw'] === 'function' ) {
        events['draw']();
      } else {
        return;
      }
      gameResolved = true;
    };

    const handlePlayerTurns = function handlePlayerTurns() {
      players.push( players.shift() );
      if ( typeof events['turn'] === 'function' && !gameResolved === true ) {
        events['turn'](players[0]);
      }
      return players[0];
    };

    const TicTacToe = {};

    TicTacToe.selectCell = function selectCell(el) {
      if ( gameResolved === true ) {
        return;
      }
      const cell = cells.find( (cell) => cell.el === el );
      if ( cell && cell.select(players[0]) ) {
        players[0].moves.push( cell.getNumAttribute() );
        resolveGame();
        if ( typeof events['select'] === 'function' ) {
          events['select'](players[0]);
        }
        handlePlayerTurns();
      }
    };

    TicTacToe.getBoard = function getBoard() {
      return table;
    };

    TicTacToe.reset = function reset() {
      Cell.clearAll(cells);
      players = playersInitial.map(
        (player) => mapPlayer(player)
      );
      gameResolved = false;
    };

    TicTacToe.addEvent = function addEvent(eventName, listener) {
      if ( events.hasOwnProperty(eventName) && typeof listener === 'function') {
        events[eventName] = listener;
      }
    };

    return TicTacToe;
  };

  return TicTacToe;
})();
