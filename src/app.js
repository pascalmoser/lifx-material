(function () {
    'use strict';

    angular
    .module('LifxMaterial',['ngMaterial', 'ngStorage'])
    .config(function($mdThemingProvider) {
        $mdThemingProvider.theme('default')
        .primaryPalette('blue-grey')
        .accentPalette('deep-purple')
        .warnPalette('pink')
    })
    .controller('AppCtrl', AppCtrl);

    function AppCtrl ( $scope, $http, $mdToast, $localStorage ) {

        console.log(hsvToRgb(260,100,100))

        $scope.color={
            red: 255,
            green: 255,
            blue: 255
        }
        $scope.effect={
            period:1,
            cycles:4,
            type:'pulse'
        }
        $scope.$storage = $localStorage;
        $scope.effectsOn = false;
        $scope.apitoken=$scope.$storage.api;
        $scope.submitProgress=false;

        getBulbs();
        $scope.apichange = function() {
            getBulbs();
        }

        $scope.submitLight=function() {
            $scope.submitProgress=true;
            var color='rgb:'+$scope.color.red+','+$scope.color.green+','+$scope.color.blue;
            var url= !$scope.effectsOn ? 'state' : 'effects/' + $scope.effect.type;
            var data= !$scope.effectsOn ? '{"color":"'+color+'"}' : '{"period":"'+$scope.effect.period+'", "cycles":"'+$scope.effect.cycles+'", "color":"'+color+'"}';
            var method= !$scope.effectsOn ? 'PUT' : 'POST';
            $http({
                method: method,
                url: "https://api.lifx.com/v1/lights/all/"+url,
                headers: {'Authorization': 'Bearer '+$scope.apitoken, 'Content-Type': 'application/json'},
                data: data
            }).then(
                function(response){
                    var toastMsg = "Status " + response.status + " " + response.statusText + " ";
                    if(response.status==207){
                        angular.forEach(response.data.results, function(value, key) {
                            toastMsg += "(" + value.label + ": " + value.status + ") ";
                        });
                    }
                    showCustomToast( $mdToast, toastMsg );
                    $scope.submitProgress=false;
                    getBulbs();
                },
                function(response){
                    showCustomToast( $mdToast, "Status " + response.status + " " + response.statusText + " (" + response.data.error + ")" );
                    $scope.submitProgress=false;
                }
            );
        }
        function showCustomToast( $mdToast, toastMsg ) {
            $mdToast.show(
                $mdToast.simple()
                .action('OK')
                .highlightAction(true)
                .textContent(toastMsg)
                .position('top right')
                .hideDelay(6000)
            );
        };
        function getBulbs(){
            $scope.$storage.api = $scope.apitoken;

            $http({
                method: 'GET',
                url: "https://api.lifx.com/v1/lights/all",
                headers: {'Authorization': 'Bearer '+$scope.apitoken, 'Content-Type': 'application/json'}
            }).then(
                function(response){
                    console.log(response);
                    if(response.status == 200) {
                        $scope.bulbs = [];
                        angular.forEach(response.data, function(value, key) {
                            console.log(value.label);
                            $scope.bulbs.push({
                                name: value.label,
                                color: hsvToRgb(value.color.hue, value.color.saturation*100, value.brightness*100),
                                location: value.location.name,
                                group: value.group.name
                            });
                        });
                    }
                },
                function(response){
                    showCustomToast( $mdToast, "Status " + response.status + " " + response.statusText + " (" + response.data.error + ")" );
                    $scope.submitProgress=false;
                }
            );
        }
        /**
        * HSV to RGB color conversion
        *
        * H runs from 0 to 360 degrees
        * S and V run from 0 to 100
        *
        * Ported from the excellent java algorithm by Eugene Vishnevsky at:
        * http://www.cs.rit.edu/~ncs/color/t_convert.html
        */
        function hsvToRgb(h, s, v) {
            var r, g, b;
            var i;
            var f, p, q, t;
            // Make sure our arguments stay in-range
            h = Math.max(0, Math.min(360, h));
            s = Math.max(0, Math.min(100, s));
            v = Math.max(0, Math.min(100, v));
            // We accept saturation and value arguments from 0 to 100 because that's
            // how Photoshop represents those values. Internally, however, the
            // saturation and value are calculated from a range of 0 to 1. We make
            // That conversion here.
            s /= 100;
            v /= 100;
            if(s == 0) {
            // Achromatic (grey)
            r = g = b = v;
            return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
            }
            h /= 60; // sector 0 to 5
            i = Math.floor(h);
            f = h - i; // factorial part of h
            p = v * (1 - s);
            q = v * (1 - s * f);
            t = v * (1 - s * (1 - f));
            switch(i) {
            case 0:
            	r = v;
            	g = t;
            	b = p;
            	break;
            case 1:
            	r = q;
            	g = v;
            	b = p;
            	break;
            case 2:
            	r = p;
            	g = v;
            	b = t;
            	break;
            case 3:
            	r = p;
            	g = q;
            	b = v;
            	break;
            case 4:
            	r = t;
            	g = p;
            	b = v;
            	break;
            default: // case 5:
            	r = v;
            	g = p;
            	b = q;
            }
            return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255)};
        }
    }
})();
