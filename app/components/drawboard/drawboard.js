'use strict';

angular.module('answerAThingApp')
  .controller('EditTextModal', function() {

  })
  .component('pickColorModal', {
    templateUrl: '/components/drawboard/pickColorModal.html',
    bindings: {
      close: '&'
    },
    controller: function PickColorController() {
      var $ctrl = this;
      $ctrl.allColors = [
        '#f00',
        '#f90',
        '#cf0',
        '#3f0',
        '#0f6',
        '#0ff',
        '#06f',
        '#30f',
        '#c0f',
        '#f09',
        "#fff",
        "#ccc",
        "#999",
        "#666",
        "#333",
        "#000"
      ];
    }
  })
  .directive('drawboard', function ($document, $window, $uibModal) {
    return {
      restrict: 'E',
      scope: {
        text: '=?',
        onSubmit: '=',
        onProgress: '=?'
      },
      templateUrl: '/components/drawboard/drawboard.html',
      controller: function($scope) {
        $scope.allColors = [
          '#f00',
          '#f90',
          '#cf0',
          '#3f0',
          '#0f6',
          '#0ff',
          '#06f',
          '#30f',
          '#c0f',
          '#f09',
          "#fff",
          "#ccc",
          "#999",
          "#666",
          "#333",
          "#000"
        ];
        $scope.aspectRatio = 3/2;
        $scope.painting = false;
        $scope.lastFrame = true;
        $scope.color=$window.localStorage.getItem('color');
        $scope.setColor = function(colorToSet) {
          $scope.color = colorToSet;
        };
        $scope.setTextColor = function(colorToSet) {
          $scope.text.color = colorToSet;
        };
        if (!$scope.color) {
          $scope.color= '#'+Math.floor(Math.random()*16777215).toString(16);
          $window.localStorage.setItem('color', $scope.color);
        }
        $scope.size = 5;
        $scope.mode = 'paint';
        $scope.text = { content: '', color: '#000000'};
        $scope.cachedImageData = '';
        $scope.editText = function() {
          $uibModal.open({
            templateUrl: '/components/drawboard/editTextModal.html',
            controller: 'EditTextModal',
            scope: $scope
          });
        }
        $scope.openColorPicker = function(callback) {
          var modal = $uibModal.open({
            component: 'pickColorModal'
          });
          modal.result.then(callback);
        }
      },
      link: function(scope, element) {
        var cumulativeOffset = function(element) {
          var top = 0, left = 0;
          do {
              top += element.offsetTop  || 0;
              left += element.offsetLeft || 0;
              element = element.offsetParent;
          } while(element);

          return {
              top: top,
              left: left
          };
        };

        var canvas = element[0].querySelector('canvas');
        var row = element[0].querySelector('.drawboard');

        var ctx = canvas.getContext('2d');

        canvas.width = parseInt($(row).innerWidth())-1;
        canvas.height = parseInt($(row).innerWidth()/scope.aspectRatio);

        var resizeTimer;
        
        $(window).on('resize', function() {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(function() {
            var newWidth = parseInt($(row).innerWidth())-1;
            var newHeight = parseInt($(row).innerWidth()/scope.aspectRatio);
            var data = resize(newWidth, newHeight);
            canvas.width = newWidth;
            canvas.height= newHeight;
            ctx = canvas.getContext('2d');
            initialize();
            var img = new Image();
            img.onload = function(){
              ctx.drawImage(img,0,0);
            };
            img.src = data;
          }, 250);

        });
        
        scope.clear = function() {
          ctx.fillStyle='#ffffff';
          ctx.fillRect(0,0,canvas.width,canvas.height);
          scope.onProgress(createPayload(lowQualityCopy()));
        };
        scope.clear();

        /* Drawing on Paint App */
        function initialize() {
          ctx.lineWidth = scope.size;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.strokeStyle = scope.color;
        }
        initialize();

        scope.$watch('color', function() {
          ctx.strokeStyle = scope.color;
          $window.localStorage.setItem('color', scope.color);
        });
        scope.$watch('size', function() {
          ctx.lineWidth = scope.size;
        });

        function onPaint() {
          if (scope.mode === 'paint') {
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }

        var mouse = {x: 0, y: 0};
        /* Mouse Capturing Work */
        canvas.addEventListener('mousemove', function(e) {
          mouse.x = e.pageX - cumulativeOffset(canvas).left;
          mouse.y = e.pageY - cumulativeOffset(canvas).top;
          if (scope.painting) {
            onPaint();
          }
        }, false);
        
        canvas.addEventListener('mousedown', function() {
          ctx.beginPath();
          scope.painting = true;
          ctx.moveTo(mouse.x, mouse.y);
        }, false);
         
        canvas.addEventListener('mouseup', function() {
          scope.painting = false;
          scope.lastFrame = true;
        }, false);

        /* Touch Capturing Work */
        canvas.addEventListener('touchmove', function(e) {
          e.preventDefault();
          mouse.x = e.touches[0].pageX - cumulativeOffset(canvas).left;
          mouse.y = e.touches[0].pageY - cumulativeOffset(canvas).top;
          if (scope.painting) {
            onPaint();
          }
        }, false);
        
        canvas.addEventListener('touchstart', function(e) {
          ctx.beginPath();
          scope.painting = true;
          mouse.x = e.touches[0].pageX - cumulativeOffset(canvas).left;
          mouse.y = e.touches[0].pageY - cumulativeOffset(canvas).top;
          ctx.moveTo(mouse.x-0.5, mouse.y-0.5);
          if (scope.painting) {
            onPaint();
          }
        }, false);

        canvas.addEventListener('click', function(e) {
          ctx.beginPath();
          mouse.x = e.pageX - cumulativeOffset(canvas).left;
          mouse.y = e.pageY - cumulativeOffset(canvas).top;
          ctx.moveTo(mouse.x-0.5, mouse.y-0.5);
          onPaint();
          scope.lastFrame = true;
        });
         
        canvas.addEventListener('touchend', function() {
          scope.painting = false;
          scope.lastFrame = true;
        }, false);

        scope.submit = function() {
          scope.$apply(scope.onSuccess(highQualityCopy()));
        };

        function resize(width, height) {
          var canvasCopy = $document[0].createElement('canvas');
          canvasCopy.width = width;
          canvasCopy.height = height;
          var copyContext = canvasCopy.getContext('2d');
          copyContext.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, canvasCopy.width, canvasCopy.height);
          scope.cachedImageData = canvasCopy.toDataURL('image/png');
          return scope.cachedImageData;
        }

        function highQualityCopy() {
          return resize(480 * scope.aspectRatio, 480);
        }
        function lowQualityCopy() {
          var canvasCopy = $document[0].createElement('canvas');
          canvasCopy.height = 480;
          canvasCopy.width = 480 * scope.aspectRatio;
          var copyContext = canvasCopy.getContext('2d');
          copyContext.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, canvasCopy.width, canvasCopy.height);
          scope.cachedImageData = canvasCopy.toDataURL('image/jpeg', 0.5);
          return scope.cachedImageData;
        }
        function createPayload(imageData) {
          return { text: scope.text, image: imageData };
        }

        var lastFrameCounterMax = 10;
        var lastFrameCounter = 0;

        setInterval(function() {
          if (scope.painting || scope.lastFrame) {
            if (scope.painting || (scope.lastFrame && lastFrameCounter === 0)) {
              lastFrameCounter = 0;
              if (scope.onProgress) {
                scope.$apply(scope.onProgress(createPayload(lowQualityCopy())));
              }
            }
            if (scope.lastFrame && lastFrameCounter >= lastFrameCounterMax) {
              lastFrameCounter = 0;
              scope.lastFrame = false;
              if (scope.onProgress) {
                scope.$apply(scope.onProgress(createPayload(highQualityCopy())));
              }
            }
            else if (scope.lastFrame) {
              lastFrameCounter++;
            }
          }
        },300);

        scope.$watch('text.content', _.debounce(function () {
          // This code will be invoked after 1 second from the last time 'id' has changed.
          scope.$apply(function(){
            scope.onProgress(createPayload(scope.cachedImageData));
          });
        }, 1000));
      }
    };
  });