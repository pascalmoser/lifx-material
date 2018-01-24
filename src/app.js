(function () {
    'use strict';

    angular
        .module('LifxMaterial', ['ngMaterial', 'ngStorage'])
        .config(function ($mdThemingProvider) {
            $mdThemingProvider.theme('default')
                .primaryPalette('blue-grey')
                .accentPalette('deep-purple')
                .warnPalette('pink')
        })
        .controller('AppCtrl', AppCtrl);

    function AppCtrl($scope, $http, $mdToast, $localStorage) {

        console.log(hsvToRgb(260, 100, 100))

        $scope.color = {
            red: 255,
            green: 255,
            blue: 255
        };

        $scope.effect = {
            period: 1,
            cycles: 4,
            type: 'pulse'
        };

        $scope.$storage = $localStorage;
        $scope.effectsOn = false;
        $scope.apitoken = $scope.$storage.api;
        $scope.submitProgress = false;
        $scope.bulbs = [];

        getBulbs();
        $scope.apichange = function () {
            getBulbs();
        };

        $scope.submitLight = function () {
            $scope.submitProgress = true;
            var color = 'rgb:' + $scope.color.red + ',' + $scope.color.green + ',' + $scope.color.blue;
            var url = !$scope.effectsOn ? 'state' : 'effects/' + $scope.effect.type;
            var data = !$scope.effectsOn ? '{"color":"' + color + '"}' : '{"period":"' + $scope.effect.period + '", "cycles":"' + $scope.effect.cycles + '", "color":"' + color + '"}';
            var method = !$scope.effectsOn ? 'PUT' : 'POST';

            $http({
                method: method,
                url: "https://api.lifx.com/v1/lights/all/" + url,
                headers: {'Authorization': 'Bearer ' + $scope.apitoken, 'Content-Type': 'application/json'},
                data: data
            }).then(
                function (response) {
                    var toastMsg = "Status " + response.status + " " + response.statusText + " ";
                    if (response.status == 207) {
                        angular.forEach(response.data.results, function (value, key) {
                            toastMsg += "(" + value.label + ": " + value.status + ") ";
                        });
                    }
                    showCustomToast($mdToast, toastMsg);
                    $scope.submitProgress = false;
                    getBulbs();
                },
                function (response) {
                    showCustomToast($mdToast, "Status " + response.status + " " + response.statusText + " (" + response.data.error + ")");
                    $scope.submitProgress = false;
                }
            );
        };

        $scope.changeState = function () {
            var data = {"power" : this.bulb.state ? "off" : "on" };
            console.log(data);
            $http({
                method: 'PUT',
                url: "https://api.lifx.com/v1/lights/"+ this.bulb.id +"/" + 'state',
                headers: {'Authorization': 'Bearer ' + $scope.apitoken, 'Content-Type': 'application/json'},
                data: JSON.stringify(data)
            }).then(
                function (response) {
                    console.log(response);
                    var toastMsg = "Status " + response.status + " " + response.statusText + " ";
                    if (response.status == 207) {
                        angular.forEach(response.data.results, function (value, key) {
                            toastMsg += "(" + value.label + ": " + value.status + ") ";
                        });
                    }
                    showCustomToast($mdToast, toastMsg);
                    $scope.submitProgress = false;
                },
                function (response) {
                    showCustomToast($mdToast, "Status " + response.status + " " + response.statusText + " (" + response.data.error + ")");
                    $scope.submitProgress = false;
                }
            );
        };

        $scope.effectsOnSwitch = function() {
            var _ = this;
            console.log(_);
            angular.forEach($scope.bulbs, function(bulb) {
                bulb.send = _.effectsOn;
                bulb.sendChange = _.effectsOn;
            });
        };

        function showCustomToast($mdToast, toastMsg) {
            $mdToast.show(
                $mdToast.simple()
                    .action('OK')
                    .highlightAction(true)
                    .textContent(toastMsg)
                    .position('top right')
                    .hideDelay(6000)
            );
        }

        function getBulbs() {
            $scope.$storage.api = $scope.apitoken;

            $http({
                method: 'GET',
                url: "https://api.lifx.com/v1/lights/all",
                headers: {'Authorization': 'Bearer ' + $scope.apitoken, 'Content-Type': 'application/json'}
            }).then(
                function (response) {
                    console.log(response);
                    if (response.status == 200) {
                        var bulbs = [];
                        angular.forEach(response.data, function (value, key) {
                            console.log(value);
                            bulbs.push({
                                id: value.id,
                                name: value.label,
                                color: hsvToRgb(value.color.hue, value.color.saturation * 100, value.brightness * 100),
                                location: value.location.name,
                                group: value.group.name,
                                state: value.power === 'on',
                                disconnected: !value.connected
                            });
                        });
                        $scope.bulbs = bulbs;

                    }
                },
                function (response) {
                    showCustomToast($mdToast, "Status " + response.status + " " + response.statusText + " (" + response.data.error + ")");
                    $scope.submitProgress = false;
                }
            );
        }
    }
})();
