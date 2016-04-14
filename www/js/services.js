angular.module('starter.services', []).service('userService', function(FIREBASE_URL, $q, $ionicPopup, $firebaseArray, $firebaseAuth, $firebaseObject, $localstorage, $cordovaFacebook) {
    var ref = new Firebase(FIREBASE_URL);
    var usersRef = new Firebase(FIREBASE_URL + "/users");
    var self = {
        /* This contains the currently logged in user */
        current: {},
        /*
         Makes sure the favorites property is preset on the current user.
         firebase REMOVES any empty properties on a save. So we can't
         bootstrap the user object with favorites: {}.
         */
        ensureSaved: function() {
            if (!self.current.savedContent) {
                self.current.savedContent = {};
            }
        },
        /*
         Adds a show to the users favorites shows list
         */
        saveContent: function(card) {
            //console.log("saveContent is called");
            //console.log(card);
            self.ensureSaved();
            //self.current.savedContent[card.id] = card;
            var userID = $localstorage.get('user', null);
            // console.log(userID);
            //self.current.$save();
            var saved = new Firebase(FIREBASE_URL + "/users/" + userID + "/SavedContent");
            var savedCards = $firebaseArray(saved);
            savedCards.$add({
                card
            });
        },
        /*
         Removes a show from the users favorites shows list
         */
        removeContent: function(card) {
            self.ensureSaved();
            var userID = $localstorage.get('user', null);
            var saved = new Firebase(FIREBASE_URL + "/users/" + userID + "/SavedContent/" + card.$id);
            saved.remove();
        },
        /*
         Checks to see if a user has already logged in in a previous session
         by checking localstorage, if so then loads that user up from firebase.
         */
        loadUser: function() {
            var d = $q.defer();
            // UNCOMMENT WHEN GOING THROUGH LECTURES
            // Check local storage to see if there is a user already logged in
            var currentUserId = $localstorage.get('user', null);
            if (currentUserId && currentUserId != "null") {
                // If there is a logged in user then load up the object via firebase
                // and use $firebaseObject to keep it in sync between our
                // application and firebase.
                console.debug("Found previously logged in user, loading from firebase ", currentUserId);
                var user = $firebaseObject(usersRef.child(currentUserId));
                user.$loaded(function() {
                    // When we are sure the object has been completely
                    // loaded from firebase then resolve the promise.
                    self.current = user;
                    d.resolve(self.current);
                });
            } else {
                d.resolve();
            }
            return d.promise;
        },
        /*
         Logout the user
         */
        logoutUser: function() {
            $localstorage.set('user', null);
            self.current = {};
            console.log('logout!')
        },
        /*
         Login the user
         */
        loginUser: function() {
            var d = $q.defer();
            console.log("loginUser is called");
            self.loadUser().then(function(user) {
                if (user) {
                    d.resolve(self.current);
                } else {
                    //
                    // Initiate the facebook login process
                    //
                    console.log('Calling facebook login');
                    openFB.login(function(response) {
                        console.log(response);
                        if (response.status === 'connected') {
                            console.log('Facebook login succeeded');
                            //
                            // Facebook login was a success, get details about the current
                            // user
                            //
                            var token = response.authResponse.accessToken;
                            openFB.api({
                                path: '/me',
                                params: {},
                                success: function(userData) {
                                    console.log('Got data from facebook about current user');
                                    console.log(userData);
                                    //
                                    // We got details of the current user now authenticate via firebase
                                    //
                                    console.log('Authenticating with firebase');
                                    var auth = $firebaseAuth(ref);
                                    // Added for Mauricio for testing purposes
                                    // $localstorage.set("user",userData)
                                    //or
                                    // auth.$authWithOAuthPopup("facebook").then(function(authData) {
                                    auth.$authWithOAuthToken("facebook", token).then(function(authData) {
                                        console.log("Authentication success, logged in as:", authData.uid);
                                        console.log(authData);
                                        //
                                        // We've authenticated, now it's time to either get an existing user
                                        // object or create a new one.
                                        //
                                        usersRef.child(authData.uid).transaction(function(currentUserData) {
                                            if (currentUserData === null) {
                                                //
                                                // If the transaction is a success and the current user data is
                                                // null then this is the first time firebase has seen this user id
                                                // so this user is NEW.
                                                //
                                                // Any object we return from here will be used as the user data
                                                // in firebase
                                                //
                                                return {
                                                    'name': userData.name,
                                                    'profilePic': 'http://graph.facebook.com/' + userData.id + '/picture',
                                                    'userId': userData.id
                                                };
                                            }
                                        }, function(error, committed) {
                                            //
                                            // This second function in the transaction clause is always called
                                            // whether the user was created or is being retrieved.
                                            //
                                            // We want to store the userid in localstorage as well as load the user
                                            // and store it in the self.current property.
                                            //
                                            $localstorage.set('user', authData.uid);
                                            self.current = $firebaseObject(usersRef.child(authData.uid));
                                            self.current.$loaded(function() {
                                                // When we are sure the object has been completely
                                                // loaded from firebase then resolve the promise.
                                                d.resolve(self.current);
                                            });
                                        });
                                    }).catch(function(error) {
                                        console.error("Authentication failed:", error);
                                        //
                                        // We've failed to authenticate, show the user an error message.
                                        //
                                        $ionicPopup.alert({
                                            title: "Error",
                                            template: 'There was an error logging you in with facebook, please try later.'
                                        });
                                        d.reject(error);
                                    });
                                },
                                error: function(error) {
                                    console.error('Facebook error: ' + error.error_description);
                                    //
                                    // There was an error calling the facebook api to get details about the
                                    // current user. Show the user an error message
                                    //
                                    $ionicPopup.alert({
                                        title: "Facebook Error",
                                        template: error.error_description
                                    });
                                    d.reject(error);
                                }
                            });
                        } else {
                            console.error('Facebook login failed');
                            //
                            // There was an error authenticating with facebook
                            // Show the user an error message
                            //
                            $ionicPopup.alert({
                                title: "Facebook Error",
                                template: 'Failed to login with facebook'
                            });
                            d.reject(error);
                        }
                    }, {
                        scope: 'email,public_profile,user_friends,user_photos,user_posts,publish_actions,publish_pages,user_birthday,read_custom_friendlists' // Comma separated list of permissions to request from facebook
                    });
                }
            });
            return d.promise;
        },
        nativeLogin: function () {
            var d = $q.defer();
        	console.log("native FB login")
        	$cordovaFacebook.login(["public_profile", "email", "user_friends"])
	        .then(function(success) {
	            console.log(JSON.stringify(success));
	            var token = success.authResponse.accessToken;
				var auth = $firebaseAuth(ref);
                auth.$authWithOAuthToken("facebook", token).then(function(authData) {
                    console.log("Authentication success, logged in as:", authData.uid);
                    // console.log(authData);
                    usersRef.child(authData.uid).transaction(function(currentUserData) {
                        if (currentUserData === null) {
                            return {
                                'name': authData.facebook.displayName,
                                'profilePic': 'http://graph.facebook.com/' + authData.facebook.id + '/picture',
                                'userId': authData.facebook.id,
                                'email': authData.facebook.email
                            };
                        }
                    }, function(error, committed) {
                        $localstorage.set('user', authData.uid);
                        self.current = $firebaseObject(usersRef.child(authData.uid));
                        self.current.$loaded(function() {
                            d.resolve(self.current);
                        });
                    });
                }).catch(function(error) {
                    console.error("Authentication failed:", error);
                    $ionicPopup.alert({
                        title: "Error",
                        template: 'There was an error logging you in with facebook, please try later.'
                    });
                    d.reject(error);
                });
	        }, function(error) {
	            if (error.authResponse) {
	            	$ionicPopup.alert({
                        title: "Log in error",
                        template: error.authResponse
                    });
	            }
	        });
	        return d.promise
        }
    };
    return self;
})

.service('myService', function(FIREBASE_URL, $firebaseArray) {
    return {
        getContent: function(topic, selectedTopicIndex) {
            var Content = new Firebase(FIREBASE_URL + "/" + topic + "/cards");
            var newIndex = parseInt(selectedTopicIndex, 10);
            //console.log(newIndex);
            var query = Content.orderByChild("contentNumber").startAt(newIndex + 1);
            //console.log(selectedTopicIndex);
            return $firebaseArray(query);
        }
    }
})

.factory('$localstorage', ['$window', function($window) {
    return {
        set: function(key, value) {
            $window.localStorage[key] = value;
        },
        get: function(key, defaultValue) {
            return $window.localStorage[key] || defaultValue;
        },
        setObject: function(key, value) {
            $window.localStorage[key] = JSON.stringify(value);
        },
        getObject: function(key) {
            return JSON.stringify($window.localStorage[key] || '{}');
        }
    }
}])
.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if (event.which === 13) {
                scope.$apply(function () {
                    scope.$eval(attrs.ngEnter);
                });

                event.preventDefault();
            }
        });
    };
})
