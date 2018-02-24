const TicTacToe = (function() {
  // returns the index of an element within its parent
  const elementIndex = function elementIndex(el) {
    return Array.from(el.parentNode.children).indexOf(el);
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
  const TicTacToe = function TicTacToe(size, players) {
    if ( !Number.isInteger(size) ) {
      throw new Error('You have to pass an integer for the "size" argument.');
    } else if ( !Array.isArray(players) || !players.length >= 2 ) {
      throw new Error(
        `You have to pass an array that has at least 2 elements for the
        "players" argument.`
      );
    } else {
      players.forEach( (player) => {
        if ( !(typeof player.char === 'string') ) {
          throw new Error(
            `Each element in the "players" argument must have a string
            "char" property.`
          );
        }
      } );
    }

    this.size = size;
    this.players = players.map( (player) => mapPlayer(player) );
    this._playersInitial = players;

    this._winningCombinations = getWinningCombinations(this.size);
    this._gameResolved = false;

    this._table = generateTable(this.size);
    this._cells = Array.from( this._table.getElementsByTagName('td') )
      .map( (el) => new Cell( el, getCellPosition(el) ) );
    this._cells.clearAll = function clearAll() {
      this.forEach((cell) => cell.clear());
    };
    this._cells.allOccupied = function allOccupied() {
      return this.every( (cell) => cell.player );
    };

    this._selectHandler = null;
    this._turnHandler = null;
    this._winHandler = null;
    this._drawHandler = null;
  };

  // checks if a player has won, if they have, it returns that player's object.
  TicTacToe.prototype._checkForWin = function checkForWin() {
    return this.players.find(
      (player) => this._winningCombinations.some(
        (combination) => checkMovesHasCombination(
          combination, player.moves
        )
      ),
      this
    );
  };

  // checks if the game is a draw (draw == all cells occupied && no one has won)
  TicTacToe.prototype._checkForDraw = function checkForDraw() {
    return this._cells.allOccupied() && !this._checkForWin();
  };

  TicTacToe.prototype._resolveGame = function resolveGame() {
    const winner = this._checkForWin();
    if (winner) {
      if ( typeof this._winHandler === 'function' ) {
        this._winHandler(winner);
      }
      this._gameResolved = true;
    } else if ( this._checkForDraw() ) {
      if ( typeof this._drawHandler === 'function') {
        this._drawHandler();
      }
      this._gameResolved = true;
    }
  };

  TicTacToe.prototype._handlePlayerTurns = function _handlePlayerTurns() {
    this.players.push( this.players.shift() );
    if ( typeof this._turnHandler === 'function'
      && !this._gameResolved === true ) {
      this._turnHandler( this.players[0] );
    }
    return this.players[0];
  };

  TicTacToe.prototype.selectCell = function selectCell(el) {
    if ( this._gameResolved === true ) {
      return;
    }
    const cell = this._cells.find( (cell) => cell.el === el );
    if ( cell && cell.select(this.players[0]) ) {
      this.players[0].moves.push( cell.getNumAttribute() );
      this._resolveGame();
      if ( typeof this._selectHandler === 'function' ) {
        this._selectHandler( el, this.players[0] );
      }
      this._handlePlayerTurns();
    }
  };

  TicTacToe.prototype.getBoard = function getBoard() {
    return this._table;
  };

  TicTacToe.prototype.reset = function reset() {
    this._cells.clearAll();
    this.players = this._playersInitial.map(
      (player) => mapPlayer(player)
    );
    this._gameResolved = false;
  };

  TicTacToe.prototype.registerTurnHandler =
    function registerTurnHandler(handler) {
      this._turnHandler = handler;
    };

  TicTacToe.prototype.registerWinHandler =
    function registerWinHandler(handler) {
      this._winHandler = handler;
    };

  TicTacToe.prototype.registerDrawHandler =
    function registerDrawHandler(handler) {
      this._drawHandler = handler;
    };

  TicTacToe.prototype.registerSelectHandler =
    function registerDrawHandler(handler) {
      this._selectHandler = handler;
    };

  return TicTacToe;
})();
