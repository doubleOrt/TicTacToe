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
    const combinations = [];
    const diagonalCombinations = [[], []];
    for (let i = 0; i < tableSize; i++) {
      diagonalCombinations[0].push( i + (i * tableSize) );
      diagonalCombinations[1].push( (tableSize - 1 - i) + (i * tableSize) );
      const horizontalCombination = [];
      const verticalCombination = [];
      for (let a = 0; a < tableSize; a++) {
        horizontalCombination.push( a + (i * tableSize) );
        verticalCombination.push( i + (a * tableSize) );
      }
      combinations.push(horizontalCombination, verticalCombination);
    }
    combinations.push( diagonalCombinations[0], diagonalCombinations[1] );
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

  const getCellNum = function getCellNum(el) {
    return elementIndex(el) + (
      elementIndex(el.parentNode) * el.parentNode.children.length
    );
  };

  const Cell = function Cell(el) {
    this.el = el;
    this.num = getCellNum(el);
    this.player = null;
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
    // if already empty, return false.
    if (!this.player) {
      return false;
    }
    this.el.innerHTML = '';
    if ( this.player.className ) {
      this.el.classList.remove( this.player.className );
    }
    this.player = null;
    return true;
  };

  /*
  * 'size': an integer representing the number of both the columns and rows of
  * the game grid.
  * 'players': an object that has a 'char' (specifying the symbol to mark cells
  * with for the player) and an optional 'className' property (specifying the
  * className to be added to cells occupied by a player).
  */
  const TicTacToe = function TicTacToe(size0, players0) {
    if ( !Number.isInteger(size0) ) {
      throw Error('Invalid arguments passed! Please see the documentation.');
    } else if ( !Array.isArray(players0) || !players0.length >= 2 ) {
      throw Error('Invalid arguments passed! Please see the documentation.');
    } else {
      players0.forEach( (player) => {
        if ( !(typeof player.char === 'string') ) {
          throw Error(
            'Invalid arguments passed! Please see the documentation.'
          );
        }
      } );
    }

    // public API object
    const TicTacToeAPI = {};

    const size = size0;
    let players = players0.map( (player) => mapPlayer(player) );
    const playersInitial = players.slice();
    const winningCombinations = getWinningCombinations(size);
    let gameResolved = false;
    const table = generateTable(size);
    const cells = Array.from( table.getElementsByTagName('td') )
      .map( (el) => new Cell(el) );

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
              break our code in case they throw an exception */
            handler = mapFunctionToAsync( newHandler );
          },
          enumerable: true,
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
      return cells.every( (cell) => cell.player ) && !checkForWin();
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

    TicTacToeAPI.selectCell = function selectCell(el) {
      if ( gameResolved === true ) {
        return;
      }
      const cell = cells.find( (cell) => cell.el === el );
      if ( cell && cell.select(players[0]) ) {
        players[0].moves.push( cell.num );
        resolveGame();
        if ( typeof events['select'] === 'function' ) {
          events['select'](players[0]);
        }
        handlePlayerTurns();
      }
    };

    TicTacToeAPI.getBoard = function getBoard() {
      return table;
    };

    TicTacToeAPI.reset = function reset() {
      cells.forEach((cell) => cell.clear());
      players = playersInitial.map(
        (player) => mapPlayer(player)
      );
      gameResolved = false;
    };

    TicTacToeAPI.addEvent = function addEvent(eventName, listener) {
      if ( events.hasOwnProperty(eventName) && typeof listener === 'function') {
        events[eventName] = listener;
      }
    };

    return TicTacToeAPI;
  };

  return TicTacToe;
})();
