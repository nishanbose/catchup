angular.module('starter.controllers', ['starter.services']).controller('IntroCtrl', function($scope, $state, $localstorage, userService) {
  // if ($localstorage.get("device") === "web") {
  //   $scope.loggingIn = false;
  //   $scope.login = function() {
  //     if (!$scope.loggingIn) {
  //       $scope.loggingIn = true;
  //       userService.loginUser().then(function() {
  //         $scope.loggingIn = false;
  //         $state.go('tab.friends');
  //       });
  //     }
  //   }
  // } else {
  //   $scope.login = function() {
  //     console.log('nativeLogin')
  //     userService.nativeLogin().then(function() {
  //       $state.go('tab.friends');
  //     });
  //   }
  // }

    $scope.loggingIn = false;
    $scope.login = function() {
      if (!$scope.loggingIn) {
        $scope.loggingIn = true;
        userService.loginUser().then(function() {
          $scope.loggingIn = false;
          $state.go('tab.friends');
        });
      }
    }

})
.controller('ChatsCtrl', function($scope, Chats) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  $scope.$on('$ionicView.enter', function(e) {
  });

  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  };
})
.controller('FrndsCtrl', function($scope, $state) {

  // openFB.api({
  //   path: '/me/taggable_friends',
  //   params: {
  //       fields : "picture.width(500), first_name",
  //       limit: 1,
  //   },
  //   success: function(result) {
  //       console.log(JSON.stringify(result));
  //       $scope.friends = result.data;
  //       //console.log(data.name);
  //       //console.log('http://graph.facebook.com/' + data.id + '/picture?type=small');
  // },
  // error:  errorHandler });

  console.log('CARDS CTRL');

  var items = [];

  openFB.api({
    path: '/me',
    params: {
      fields: "photos{tags{name}, images}"
    },
    success: function(result) {
      //console.log(result.photos.data);
      //console.log(result.photos.data.length)
      for (var i = 0; i < result.photos.data.length; i++) {
        if (result.photos.data[i].tags.data.length > 1 && result.photos.data[i].tags.data.length < 6) {
          // if (result.photos.data[i].tags.data.length > 1) {
          console.log(result.photos.data[i]);
          console.log(result.photos.data[i].tags.data[0].name);
          console.log(result.photos.data[i].images[0].source);
          items.push(result.photos.data[i]);
        }
      }
      //$scope.friends = items;
      //console.log(items);
    },
    error: errorHandler
  });

  //$scope.cards = Array.prototype.slice.call(cardTypes, 0);
  $scope.cards = items;
  $scope.cardDestroyed = function(index) {
    $scope.cards.splice(index, 1);
  };

  $scope.addCard = function() {
    var newCard = items[Math.floor(Math.random() * items.length)];
    newCard.id = Math.random();
    $scope.cards.push(angular.extend({}, newCard));
  }

  $scope.yesCard = function() {
    console.log('YES');
    $state.go('demo');
    // $scope.addCard();
  };

  $scope.noCard = function() {
    console.log('NO');
    $scope.addCard();
  };

  // $scope.toggleLeft = function() {
  //   $ionicSideMenuDelegate.toggleLeft();
  // };

  function errorHandler(error) {
    console.log(error.message);
  };
})

.controller('topicsCtrl', function($scope, $rootScope, $state) {
  // Call a "LoadFeed" method from another controller (browseCtrl) ////
  $scope.loadBrowseFeed = function() {
    $rootScope.$emit("LoadFeed", {});
  };
  // Topic Selection //
  $scope.setSelectedTopic = function(topic) {
    window.localStorage.setItem("selectedTopic", topic);
  };
  //After user pushes "Start" button, topics navigation is cleared and start from the beginning
  $scope.clearNavHistory = function() {
    $state.go('tab.topics');
  };
})

.filter('internalreverse', function() {
  return function(input) {
    input = input || [];
    input.sort(function(a, b) {
      if (a.id > b.id) {
        return -1;
      }
      if (a.id < b.id) {
        return 1;
      }
      // a must be equal to b
      return 0;
    });
    return input;
  };
})

.controller('chatCtrl', function($scope) {

  $scope.setChatRoomName = function(name) {
    window.localStorage.setItem("chatroomName", name);
  };


})

.controller('chatroomCtrl', function($scope, FIREBASE_URL, userService, $firebaseArray, $firebaseObject, $localstorage, $ionicScrollDelegate) {

  $scope.chatroomName = window.localStorage.getItem("chatroomName");
  var ChatroomName = window.localStorage.getItem("chatroomName");

  $scope.user = userService;
  $scope.data = {
    messages: [],
    message: '',
    loading: true,
    showInfo: false
  };

  var Content = new Firebase(FIREBASE_URL + "/" + ChatroomName + "/messages");

  //Get current users info
  var userID = $localstorage.get('user', null);
  var userInfo = new Firebase(FIREBASE_URL + "/users/" + userID);
  userInfo = $firebaseObject(userInfo);


  $scope.loadMessages = function() {
    $scope.data.messages = $firebaseArray(Content);
    $scope.data.messages.$loaded().then(function(data) {
      $scope.data.loading = false;
      $ionicScrollDelegate.$getByHandle('chatroom').scrollBottom(true);
    });
  };

  $scope.sendMessage = function() {
    if ($scope.data.message) {
      $scope.data.messages.$add({
        text: $scope.data.message,
        username: userInfo.name,
        userId: userInfo.userId,
        profilePic: userInfo.profilePic,
        //timestamp: new Date().getTime
      });
      $scope.data.message = '';
      $ionicScrollDelegate.$getByHandle('chatroom').scrollBottom(true);
    }
  };

  $scope.loadMessages();
})


.controller('settingsCtrl', function($scope, $state, userService, $ionicPopup, $localstorage, FIREBASE_URL, $firebaseArray, $firebaseObject) {
  $scope.user = userService;


  //Get current users info
  var userID = $localstorage.get('user', null);
  var userInfo = new Firebase(FIREBASE_URL + "/users/" + userID);
  userInfo = $firebaseObject(userInfo);

  $scope.usersname = userInfo.name;
  console.log("my name is " + $scope.usersname);
  //User Logout
  $scope.logout = function() {
    userService.logoutUser();
    $state.go('intro');
  };

  // Delete Account??
  $scope.showConfirm = function() {
    var confirmPopup = $ionicPopup.confirm({
      title: 'Delete Account',
      template: 'Your account & saved cards will be deleted permanently.'
    });

    confirmPopup.then(function(res) {
      if (res) {

        //Get current user's ID & connect firebase & remove the user's node
        var userAccount = new Firebase(FIREBASE_URL + "/users/" + userID);
        userAccount.remove();

        //Delete Local Storage
        window.localStorage.clear();

        //Go to "intro" screen
        $state.go('intro');

        console.log('Account deleted');
      } else {
        console.log('Account not deleted');
      }
    });

  };

})

.controller('demoCtrl', function($scope, $state) {

  console.log("hello");

})

  .controller('PlaceCtrl', function($scope, $rootScope) {
    $scope.selected_items = [];
    $scope.items = [{name: 'Comet Coffee', address: '16 Nickels Arcade', class: 'icon ion-coffee', image: '../img/comet.png'},
    {name: 'Sweet Waters Coffee & Tea', address: '604 E Liberty St', class: 'icon ion-coffee', image: '../img/sweet.jpg'},
    {name: 'Jolly Pumpkin & Brewery', address: '311 S Main St', class: 'icon ion-beer', image: '../img/jolly.jpg'},
    {name: 'Arbor Brewing Company', address: '114 E Washington St', class: 'icon ion-beer', image: '../img/abc.png'},
    {name: 'Blue Tracktor BBQ & Brewery', address: '207 E Washington St', class: 'icon ion-fork', image: '../img/blue.jpg'},
    {name: 'Zingerman\'s Delicatessen', address: '422 Detroit St', class: 'icon ion-fork', image: '../img/zing.jpg'}];
    $scope.selectplace = function(item){
      if($scope.selected_items.indexOf(item)>=0) $scope.selected_items.splice($scope.selected_items.indexOf(item), 1);
      $scope.selected_items.push(item);
    }
    $scope.isSelectedPlace = function(item){
      if($scope.selected_items.indexOf(item)>=0) return 1;
      else return 0;
      // return $scope.selected === item;
    }
    $scope.currentLocation = function(){
      $scope.location = {name: '105 S State St', address:'', class: 'icon ion-navigate', image: '../img/loc.png'};
      $scope.items.push($scope.location);
      $scope.selected_items.push($scope.location.name);
    }
    $scope.sendInvitation = function(){

      var d = new Date();
      d = d.toLocaleTimeString().replace(/:\d+ /, ' ');

      $rootScope.messages.push({
        userId: '12345',
        text: 'Here\'s my invitation',
        time: d
      });
      $rootScope.messages.push({
        userId: '12345',
        text: 'When: Monday 2PM~3PM',
        time: d
      });
      $rootScope.messages.push({
        userId: '12345',
        text: 'Where: 105 S State St or Comet Coffee',
        time: d
      });
      $rootScope.messages.push({
        userId: '12345',
        text: 'Tab here to confirm',
        time: d
      });

      delete $rootScope.data.message;
    }
  })

  .controller('ScheduleCtrl', function($scope) {
    $scope.selected_items = [];
    $scope.split_items = [
      [{name: '11', value: ''}, {name: '12', value: '27, Mon'}, {name: '13', value: '28, Tue'}, {name: '14', value: '29, Wed'}],
      [{name: '21', value: '9AM'}, {name: '22', value: 'SI 694'}, {name: '23', value: ''}, {name: '24', value: ''}],
      [{name: '31', value: '10AM'}, {name: '32', value: 'SI 694'}, {name: '33', value: ''}, {name: '34', value: ''}],
      [{name: '41', value: '11AM'}, {name: '42', value: 'SI 694'}, {name: '43', value: 'w/ Jack'}, {name: '44', value: 'w/ Aimee'}],
      [{name: '51', value: '12PM'}, {name: '52', value: ''}, {name: '53', value: ''}, {name: '54', value: ''}],
      [{name: '61', value: '1PM'}, {name: '62', value: ''}, {name: '63', value: 'SI 582'}, {name: '64', value: ''}],
      [{name: '71', value: '2PM'}, {name: '72', value: ''}, {name: '73', value: 'SI 582'}, {name: '74', value: ''}],
      [{name: '81', value: '3PM'}, {name: '82', value: ''}, {name: '83', value: 'SI 582'}, {name: '84', value: 'SI 650'}],
      [{name: '91', value: '4PM'}, {name: '92', value: ''}, {name: '93', value: ''}, {name: '94', value: 'SI 650'}],
      [{name: '101', value: '5PM'}, {name: '102', value: ''}, {name: '103', value: ''}, {name: '104', value: 'SI 650'}],
      [{name: '111', value: '6PM'}, {name: '112', value: ''}, {name: '113', value: ''}, {name: '114', value: ''}],
      [{name: '121', value: '7PM'}, {name: '122', value: ''}, {name: '123', value: ''}, {name: '124', value: ''}],
      [{name: '131', value: '8PM'}, {name: '132', value: ''}, {name: '133', value: ''}, {name: '134', value: ''}],
      [{name: '141', value: '9PM'}, {name: '142', value: ''}, {name: '143', value: ''}, {name: '144', value: ''}],
      [{name: '151', value: '10PM'}, {name: '152', value: ''}, {name: '153', value: ''}, {name: '154', value: ''}],
      [{name: '161', value: '11PM'}, {name: '162', value: ''}, {name: '163', value: ''}, {name: '164', value: ''}]
    ];
    $scope.select = function(item){
      if($scope.selected_items.indexOf(item)>=0) $scope.selected_items.splice($scope.selected_items.indexOf(item), 1);
      else $scope.selected_items.push(item);
      // $scope.selected = item;
    }
    $scope.isSelected = function(item){
      if($scope.selected_items.indexOf(item)>=0) return 1;
      else return 0;
      // return ($scope.selected === item) ;
    }
  })

  // .controller('ScheduleCtrl', function($scope, ionicDatePicker) {
  //   $scope.openDatePicker = function(val) {
  //     var ipObj1 = {
  //       callback: function (val) {  //Mandatory
  //         console.log('Return value from the datepicker popup is : ' + val, new Date(val));
  //       },
  //       disabledDates: [            //Optional
  //         new Date(2016, 2, 16),
  //         new Date(2015, 3, 16),
  //         new Date(2015, 4, 16),
  //         new Date(2015, 5, 16),
  //         new Date('Wednesday, August 12, 2015'),
  //         new Date("08-16-2016"),
  //         new Date(1439676000000)
  //       ],
  //       from: new Date(2012, 1, 1), //Optional
  //       to: new Date(2016, 10, 30), //Optional
  //       inputDate: new Date(),      //Optional
  //       mondayFirst: true,          //Optional
  //       disableWeekdays: [0],       //Optional
  //       closeOnSelect: false,       //Optional
  //       templateType: 'popup'       //Optional
  //     };
  //
  //     ionicDatePicker.openDatePicker(ipObj1);
  //   }
  // })

  //
  // .controller('Messages', ['$scope', '$timeout', '$ionicScrollDelegate', function($scope, ionicDatePicker) {
  .controller('Messages', function($scope, $timeout, $ionicScrollDelegate, $rootScope) {
    $scope.chatorder = 0;
    $scope.hideTime = true;

    var alternate,
      isIOS = ionic.Platform.isWebView() && ionic.Platform.isIOS();

    var counter = 0;

    $scope.sendMessage = function() {
      alternate = !alternate;

      var d = new Date();
      d = d.toLocaleTimeString().replace(/:\d+ /, ' ');

      $rootScope.messages.push({
        userId: alternate ? '12345' : '54321',
        text: $rootScope.data.message,
        time: d
      });

      delete $rootScope.data.message;
      $scope.chatorder += 1;

      if($scope.chatorder==3){
        $timeout(function(){
          var d = new Date();
          d = d.toLocaleTimeString().replace(/:\d+ /, ' ');

          $rootScope.messages.push({
            userId: '54321',
            text: 'Yeah, definitely. Send me an invitation.',
            time: d
          });
        }, 1000);
        alternate = !alternate;
        $scope.chatorder += 1;
      }

      if($scope.chatorder==1){
        $timeout(function(){
          var d = new Date();
          d = d.toLocaleTimeString().replace(/:\d+ /, ' ');

          $rootScope.messages.push({
            userId: '54321',
            text: 'Hey, How are you?',
            time: d
          });
        }, 1000);
        alternate = !alternate;
        $scope.chatorder += 1;
      }



    //   setTimeout(function(){
    //     alternate = !alternate;
    //
    //     var d = new Date();
    //     d = d.toLocaleTimeString().replace(/:\d+ /, ' ');
    //
    //     $scope.messages.push({
    //       userId: alternate ? '12345' : '54321',
    //       text: 'Hey! How are you?',
    //       time: d
    //     });
    //
    //     delete $scope.data.message;
    //   }, 4000);
    //   setTimeout(function(){
    //     alternate = !alternate;
    //
    //     var d = new Date();
    //     d = d.toLocaleTimeString().replace(/:\d+ /, ' ');
    //
    //     $scope.messages.push({
    //       userId: alternate ? '12345' : '54321',
    //       text: 'Hey! We should go for coffee',
    //       time: d
    //     });
    //
    //     delete $scope.data.message;
    //   }, 4000);
    //
    // setTimeout(function(){
    //   alternate = !alternate;
    //
    //   var d = new Date();
    //   d = d.toLocaleTimeString().replace(/:\d+ /, ' ');
    //
    //   $scope.messages.push({
    //     userId: alternate ? '12345' : '54321',
    //     text: 'Yeah! Send me an invitation',
    //     time: d
    //   });
    //
    //   delete $scope.data.message;
    // }, 4000);
    // setTimeout(function(){
    //   alternate = !alternate;
    //
    //   var d = new Date();
    //   d = d.toLocaleTimeString().replace(/:\d+ /, ' ');
    //
    //   $scope.messages.push({
    //     userId: alternate ? '12345' : '54321',
    //     text: 'Invitation sent',
    //     time: d
    //   });
    //
    //   delete $scope.data.message;
    // }, 4000);
    };
    // $rootScope.sendMessage2 = function() {
    //   alternate = !alternate;
    //
    //   var d = new Date();
    //   d = d.toLocaleTimeString().replace(/:\d+ /, ' ');
    //
    //   $scope.messages.push({
    //     userId: alternate ? '12345' : '54321',
    //     text: 'Invitation Sent',
    //     time: d
    //   });
    //
    //   delete $scope.data.message;
    // };
    // $scope.sendMessage2 = function(){
    //   alternate = !alternate;
    //
    //   var d = new Date();
    //   d = d.toLocaleTimeString().replace(/:\d+ /, ' ');
    //
    //   $scope.messages.push({
    //     userId: alternate ? '12345' : '54321',
    //     text: 'Invitation Sent.',
    //     time: d
    //   });
    //
    //   delete $scope.data.message;
    //   $ionicScrollDelegate.scrollBottom(true);
    // };
    // if(ChatSchedule == 1){
    //   alternate = !alternate;
    //
    //   var d = new Date();
    //   d = d.toLocaleTimeString().replace(/:\d+ /, ' ');
    //
    //   $scope.messages.push({
    //     userId: alternate ? '12345' : '54321',
    //     text: 'Invitation Sent',
    //     time: d
    //   });
    //
    //   delete $scope.data.message;
    //   $ionicScrollDelegate.scrollBottom(true);
    // }

    $scope.inputUp = function() {
      //if (isIOS) $scope.data.keyboardHeight = 216;
      $timeout(function() {
        $ionicScrollDelegate.scrollBottom(true);
      }, 300);

    };

    $scope.inputDown = function() {
      //if (isIOS) $scope.data.keyboardHeight = 0;
      $ionicScrollDelegate.resize();
    };

    $scope.closeKeyboard = function() {
      //cordova.plugins.Keyboard.close();
    };

    $scope.confirmInvitation = function() {
      var d = new Date();
      d = d.toLocaleTimeString().replace(/:\d+ /, ' ');

      $rootScope.messages.push({
        userId: '54321',
        text: 'Invitation Confrimed',
        time: d
      });
    };

    // $timeout(function() {
    //   alternate = !alternate;
    //
    //   var d = new Date();
    //   d = d.toLocaleTimeString().replace(/:\d+ /, ' ');
    //
    //   $scope.messages.push({
    //     userId: alternate ? '12345' : '54321',
    //     text: 'Invitation Sent',
    //     time: d
    //   });
    //
    //   delete $scope.data.message;
    // }, 20000);


    $rootScope.data = {};
    $rootScope.myId = '54321';
    $rootScope.messages = [];




  });
