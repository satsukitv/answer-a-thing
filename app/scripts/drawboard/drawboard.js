'use strict';

angular.module('answerAThingApp')
  .directive('drawboard', function ($document) {
    return {
      restrict: 'E',
      scope: {
        onSubmit: '=',
        onProgress: '=?'
      },
      templateUrl: '/views/drawboard.html',
      controller: function($scope) {
        $scope.aspectRatio = 4 / 3;
        $scope.painting = false;
        $scope.lastFrame = true;
        
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

        canvas.width = parseInt($(row).innerWidth());
        canvas.height = parseInt($(row).innerWidth() * (1/scope.aspectRatio));

        var resizeTimer;

        $(window).on('resize', function() {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(function() {
            var newWidth = parseInt($(row).innerWidth());
            var newHeight = parseInt($(row).innerWidth() * (1/scope.aspectRatio));
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
        };
        scope.clear();

        var mouse = {x: 0, y: 0};
         
        /* Mouse Capturing Work */
        canvas.addEventListener('mousemove', function(e) {
          mouse.x = e.pageX - cumulativeOffset(canvas).left;
          mouse.y = e.pageY - cumulativeOffset(canvas).top;
        }, false);
        
        /* Drawing on Paint App */
        function initialize() {
          ctx.lineWidth = 5;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.strokeStyle = 'blue';
        }
        initialize();
        canvas.addEventListener('mousedown', function() {
          ctx.beginPath();
          scope.painting = true;
          ctx.moveTo(mouse.x, mouse.y);
       
          canvas.addEventListener('mousemove', onPaint, false);
        }, false);
         
        canvas.addEventListener('mouseup', function() {
          scope.painting = false;
          scope.lastFrame = true;
          canvas.removeEventListener('mousemove', onPaint, false);
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
          return canvasCopy.toDataURL('image/png');
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
          return canvasCopy.toDataURL('image/jpeg', 0.5);
        }

        var lastFrameCounterMax = 10;
        var lastFrameCounter = 0;

        setInterval(function() {
          if (scope.painting || scope.lastFrame) {
            if (scope.painting || (scope.lastFrame && lastFrameCounter === 0)) {
              lastFrameCounter = 0;
              if (scope.onProgress) {
                scope.$apply(scope.onProgress(lowQualityCopy()));
              }
            }
            if (scope.lastFrame && lastFrameCounter >= lastFrameCounterMax) {
              lastFrameCounter = 0;
              scope.lastFrame = false;
              if (scope.onProgress) {
                scope.$apply(scope.onProgress(highQualityCopy()));
              }
            }
            else if (scope.lastFrame) {
              lastFrameCounter++;
            }
          }
        },300);
         
        var onPaint = function() {
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        };
      }
    };
  });