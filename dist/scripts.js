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

        $scope.apichange = function() {
            $scope.$storage.api = $scope.apitoken;
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
    }
})();
