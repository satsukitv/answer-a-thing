'use strict';

/**
 * @ngdoc function
 * @name answerAThingApp.controller:LobbyController
 * @description
 * # LobbyController
 * Controller of the answerAThingApp
 */
angular.module('answerAThingApp')
  .controller('LobbyController', function ($scope, drawSocket, gameState, $location, $interval) {
    $scope.slots = [0, 1, 2, 3, 4, 5];
    $scope.$location = $location;
    $scope.gameState = gameState;
    $scope.user = gameState.user;
    $scope.data = { password: '', form: '' };
    $scope.logout = function() {
      drawSocket.emit('user.logout', {});
    };
    var getRoomsInterval = $interval(function getRooms() {
      drawSocket.emit('rooms', {});
    }, 5000);
    $scope.$on('$destroy', function() {
      $interval.cancel(getRoomsInterval);
    })
    $scope.joinRoom = function(room) {
      if (room.password && !$scope.data.password) {
        $scope.data.form = room.name;
        $("#pw-"+room.$$hashKey).focus();
      }
      else if (room.password && $scope.data.password) {
        drawSocket.emit('room.join', angular.extend({}, room, $scope.data)); 
      }
      else {
        drawSocket.emit('room.join', room);  
      }
    };
  });
