App = Ember.Application.create({});
App.Store = DS.Store.extend({
  // Delete this!
  revision: 13
});
App.cards = [];
App.cardCollection = [{bg:'c150',count:0},{bg:'c300',count:0},{bg:'c450',count:0},{bg:'c600',count:0},{bg:'c750',count:0},{bg:'c900',count:0},{bg:'c1050',count:0},{bg:'c1200',count:0}];
App.generateRandomCard = function(){
  var rand = Math.floor((Math.random()*8));
    if(App.cardCollection[rand].count < 2){
      App.cardCollection[rand].count++;
      return App.cardCollection[rand].bg;
    }else{
      return App.generateRandomCard();
    }
};
App.generateGame = function(){
  for(var i=1; i < 17; i++){
    var addCardPosition = App.generateRandomCard();
    App.cards.push({
      id: i,
      cardPosition: addCardPosition
    });
  }
};

App.resetGame = function(){
  App.cards = [];
    for(var i=0; i < App.cardCollection.length; i++){
      App.cardCollection[i].count = 0;
    }
    App.generateGame();
};

App.Router.map(function() {
  this.resource('game');
  this.resource('gameOver');
});

App.mainTemplateRoute = Ember.Route.extend({
  renderTemplate: function() {
    this.render();
    this.render('footer', {             // the template to render into
      outlet: 'footer'       // the controller to use for the template
    });
    this.render('sidebar', {             // the template to render into
      outlet: 'sidebar'       // the controller to use for the template
    });
  }
});

App.gameView = Ember.View.extend({
  templateName: 'gameView'
});

App.IndexRoute = App.mainTemplateRoute.extend();
App.GameRoute = App.mainTemplateRoute.extend({
  model: function(){
    return App.cards;
  },
  beforeModel: function() {
    App.resetGame();
  }
});
App.GameOverRoute = App.mainTemplateRoute.extend();

App.GameCardController = Ember.ObjectController.extend({
  needs:['game'],
  actions:{
    flip: function(obj){
      //dont flip if already flipped or matching process.
      if(!obj.isFlipped && !this.get('controllers.game.matching')){
        if(!this.get('controllers.game.playingGame')){
          this.send('playingGame');
        }
        obj.isFlipped = true;
        var lastCard = this.get('controllers.game.lastCard');
        this.set('controllers.game.lastCard',obj);
        var attr = $('.'+obj.id).attr('alt');
        //jquery flip
        $("."+obj.id).flip({
          direction:'lr',
          content:$("."+obj.id).addClass(obj.cardPosition)
        });
        var passThis = this;
        //Check For Match if second card flipped.
        if(lastCard){
          this.set('controllers.game.matching',true);
          setTimeout(function(){
            passThis.send('checkMatch', obj, lastCard);
          },2000);
        }
      }
    },
    checkMatch : function(obj, lastCard){
      if(obj.cardPosition == lastCard.cardPosition){
        //it's a match
        $('.'+lastCard.id+', .'+obj.id).addClass('matched').removeAttr('style');

        var numberRight = this.get('controllers.game.numberRight');
        numberRight++;
        this.set('controllers.game.numberRight',numberRight);
        if(numberRight == 8){
          this.send('resetGame');
        }
      }else{
        //no match
        $('.'+lastCard.id).revertFlip().removeClass(lastCard.cardPosition);
        $('.'+obj.id).revertFlip().removeClass(obj.cardPosition);
        lastCard.isFlipped = false;
        obj.isFlipped = false;

        var numberWrong = this.get('controllers.game.numberWrong');
        numberWrong++;
        this.set('controllers.game.numberWrong',numberWrong);
      }
      this.set('controllers.game.lastCard',null);
      this.set('controllers.game.matching',false);
    }
  }
});

App.GameController = Ember.ArrayController.extend({
  playingGame : false,
  endGameDisabled : true,
  matching : false,
  lastCard : null,
  numberWrong : 0,
  numberRight : 0,
  actions:{
    playingGame : function(){
      this.set('playingGame',true);
      this.set('endGameDisabled',false);
      this.send('startTimer');
    },
    resetGame: function(){
      this.set('lastCard',null);
      this.set('playingGame',false);
      this.set('endGameDisabled',true);
      this.transitionToRoute('gameOver');
    },
    startTimer:function(){
      var timerObj = $('.bar');
      var setWidth = 1;
      var sendThis = this;
      var timer = self.setInterval(function(){
        if(setWidth < 100){
          timerObj.css('width',setWidth + '%');
          setWidth = setWidth + 0.25;
        }
        else {
          timer = window.clearInterval(timer);
          sendThis.send('resetGame');
        }
      },250);

    }
  },
  numberWrongGamePlay: function () {
      var wrong = this.get('numberWrong');
      var plural = wrong === 1 ? 'match' : 'matches';
      return 'You got <strong>%@</strong> %@ wrong'.fmt(wrong, plural);
    }.property('numberWrong')
});

App.GameOverController = Ember.ArrayController.extend({
  needs : 'game',
  actions:{
    newGame: function(){
      this.set('controllers.game.numberWrong',0);
      this.set('controllers.game.numberRight',0);
      this.transitionToRoute('game');
    }
  },
    numberWrong: function () {
      var wrong = this.get('controllers.game.numberWrong');
      console.log(wrong);
      var plural = wrong === 1 ? 'match' : 'matches';
      return 'You got <strong>%@</strong> %@ wrong'.fmt(wrong, plural);
    }.property('controllers.game.numberWrong'),
    numberRight: function () {
      var numRight = this.get('controllers.game.numberRight');
      var plural = numRight === 1 ? 'match' : 'matches';
      return 'You got <strong>%@</strong> %@ right'.fmt(numRight, plural);
    }.property('controllers.game.numberRight'),
    displayGameEndMessage : function(){
      var right = this.get('controllers.game.numberRight');
      if(right === 0){
        return 'You did not get a single match, you may need some practice!!';
      }else if(right > 0 && right < 8){
        return 'Not too Shabby, keep playing and you could match them all!';
      }else{
        return 'Congrats, You matched them all!! You are a super star.';
      }
    }.property('controllers.game.numberRight')
});

//var showdown = new Showdown.converter();

Ember.Handlebars.helper('format-markdown', function(input) {
  return new Handlebars.SafeString(showdown.makeHtml(input));
});

Ember.Handlebars.helper('format-date', function(date) {
  return moment(date).fromNow();
});
