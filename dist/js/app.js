(function() {
    'use strict';

    var allFlakes = [],
        Entity,
        entity,
        Flake,
        flake,
        WindowPane,
        whiteWindow,
        Room,
        room,
        canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d'),
        lastTime;
    canvas.width = 1100;
    canvas.height = 770;
    canvas.id = 'respondCanvas';
    document.getElementById('snowScene').appendChild(canvas);

    function main() {
        var now = Date.now(),
            dt = (now - lastTime) / 1000.0;
        update(dt);
        render();
        lastTime = now;
        window.requestAnimationFrame(main);
    }

    function init() {
        lastTime = Date.now();
        main();
    }

    function update(dt) {
        updateFlakes(dt);
    }

    function updateFlakes(dt) {
        allFlakes.forEach(function(flake) {
            flake.update(dt);
        });
    }

    function render() {
        room.render();

        whiteWindow.clip();
        allFlakes.forEach(function(flake) {
            flake.render();
        });
        whiteWindow.render();
    }

    Resources.load([
        'images/justWindow.png',
        'images/roomRed2.png',
        'images/northernSky.png',
        'images/livingRoomRedBlack1100.png',
        'images/livingRoom1000.png',
        'images/window1000.png',
        'images/livingRoom2000.png',
        'images/livingRoom3000.png',
        'images/window2000.png'
    ]);

    Resources.onReady(init);


    Entity = function(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    };

    entity = new Entity(0, 0, 0, 0);

    Room = function(x, y, width, height) {
        Entity.call(this, x, y, width, height);
        this.sprite = 'images/livingRoomRedBlack1100.png';
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    };

    Room.prototype = Object.create(Entity.prototype);

    Room.prototype.constructor = Room;

    room = new Room(0, 0, canvas.width, canvas.height);

    Room.prototype.render = function() {
        ctx.drawImage(Resources.get(this.sprite), this.x, this.y, this.width, this.height);
    };

    WindowPane = function(x, y, width, height) {
        Entity.call(this, x, y, width, height);
        this.sprite = 'images/window2000.png';
        this.x = x;
        this.y = y;
        this.width = canvas.width * 0.4;
        this.height = canvas.height * 0.4;
    };

    WindowPane.prototype = Object.create(Entity.prototype);

    WindowPane.prototype.constructor = WindowPane;

    whiteWindow = new WindowPane(305, 30, 1000, 637);

    WindowPane.prototype.render = function() {
        ctx.drawImage(Resources.get(this.sprite), this.x, this.y, this.width, this.height);
    };

    WindowPane.prototype.clip = function() {
        // create clipping region
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.clip();
        // create sky so less than window width and height
        ctx.drawImage(Resources.get('images/northernSky.png'), this.x + 20, this.y, this.width - 40, this.height);
    };

    Flake = function() {
        this.x = Math.round(Math.random() * 800);
        this.y = Math.round(Math.random() * -800);
        this.drift = Math.random();
        this.speed = Math.floor((Math.random() * 100) + 1);
        this.width = (Math.random() * 3) + 2;
        this.height = this.width;
        this.maxFlakes = 200;
    };

    Flake.prototype.render = function() {
        var minFlakeX = whiteWindow.x + 20,
            maxFlakeX = whiteWindow.width + whiteWindow.x - 30;
        ctx.fillStyle = 'white';
        if (this.x > minFlakeX && this.x < maxFlakeX) {
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    };

    flake = new Flake();

    Flake.prototype.createCollection = function() {
        for (var i = 0, m = this.maxFlakes; i < m; i++) {
            // allFlakes starts out as empty array
            allFlakes.push(new Flake());
        }
    };

    flake.createCollection();

    Flake.prototype.update = function(dt) {
        var futureX = this.x,
            futureY = this.y,
            maxY = canvas.height,
            maxX = canvas.width;

        for (var i = 0, f = this.maxFlakes; i < f; i++) {
            if (this.y < maxY) {
                this.y += (this.speed * dt) / 90;
                if (this.y > maxY) {
                    this.y = -5;
                }
                this.x += this.drift / 600;
                if (this.x > maxX) {
                    this.x = 0;
                }
            }
        }
    };

    //Define a container for the game, its variables and its methods.
    var game = {
        score: 0,
        answerPosition: 0, // position of the current answer in the answersList - start at 0
        display: '', // the current dash/guessed letters display - ex '-a-a--r--t'
        wrong: '', // all the wrong letters guessed so far
        answer: '', // the correct answer - one word from game.answersList
        wrongCount: 0, // the number of wrong guesses so far
        over: false, // is the game over?
        answersList: [ // list of answers to cycle through
            'lamp',
            'cat',
            'snow',
            'couch',
            'leaves',
            'moon',
            'northern lights',
            'snowstorm'
        ]
    };

    game.restart = function() {
        // Initialize the game at the beginning or after restart
        // Get the answer position from storage
        // Note that the getItem method and the standard object notation
        // yield different results when the property does not exist:
        // localStorage.getItem("noSuchProperty"); is null if it doesn't exit
        // and Number(null) is 0
        game.answerPosition = Number(localStorage.getItem('Guessing Game Position'));
        game.answer = game.answersList[game.answerPosition].toLowerCase(); // get the word from this round
        // from the answerList by using the updated answerPosition from localStorage.getItem. Looks like
        // you can call it whatever you want even with spaces because its always a string.

        game.display = '-'.repeat(game.answer.length);
        game.wrong = '';
        game.wrongCount = 0;
        game.over = false;

        // Initialize the web page (the view)
        $('progress').val('0'); // initialize the progress bar
        $('#display').text(game.display);
        $('#wrong').text('');
        $('#guess').val('');
        $('#guess').focus();
        game.updateScore(0);
        game.updatePosition();
    };


    game.play = function() {
        // Invoked when the user enters a letter
        if (game.over) { // if the game is over
            $('#wrong').text('Press RESTART to play again.'); // user has to restart
        } else { //if the game is not over yet
            var letter = $('#guess').val().toLowerCase();
            var position = game.answer.indexOf(letter);
            if (position >= 0) {
                // It's a good guess, update the game display in the model
                while (position >= 0) {
                    // update the game display and find all remaining occurrences
                    game.display = game.display.substring(0, position) + letter + game.display.substring(position + 1);
                    // get the next occurrence
                    position = game.answer.indexOf(letter, position + 1);
                }
                // update the dash display in the view
                $('#display').text(game.display);
            } else { // If it's a wrong guess
                game.wrong = letter + ' ' + game.wrong;
                game.wrongCount++;

                $('#wrong').text(game.wrong);
                $('progress').val(game.wrongCount);
            }
            // reinitialize the guess after a delay for usability
            setTimeout(function() {
                $('#guess').val('');
            }, 1000);
            // check for a win or loss
            game.outcome();
        }
    };

    game.outcome = function() {
        // check if the game is won or lost
        if (game.answer === game.display) {
            $('#wrong').text('Congratulations! You win and may leave the house!');
            game.over = true; // game is over.  User has to restart to play again
            game.updateScore(20);
            flake.maxFlakes -= 300;
            flake.speed -= 50;
            flake.createCollection();
        } else if (game.wrongCount > 6) {
            flake.maxFlakes += 300;
            flake.speed += 50;
            flake.createCollection();
            $('#wrong').text('You lose. The snow is getting worse!');
            game.over = true; // game is over.  User has to restart to play again
            // update score in local storage and on page
            game.updateScore(-10);
        }
    };

    game.updateScore = function(increment) {
        // add increment to the score (if any) in local storage
        localStorage['Guessing Game Score'] = Number(localStorage.getItem('Guessing Game Score')) + increment;
        // display the score on the page
        $('#score').text(localStorage.getItem('Guessing Game Score'));
    };

    game.updatePosition = function() {
        // use the modulo operator to cycle through the list, if the number is smaller, it returns
        // that number, unless its the same, so returns 0 and starts over
        game.answerPosition = (game.answerPosition + 1) % game.answersList.length;
        // save it in storage
        localStorage['Guessing Game Position'] = game.answerPosition;
    };

    // Main program starts here
    $(document).ready(function() {
        game.restart();
        $('#guess').on('input', game.play);
        $('a').click(game.restart);
    });
})();