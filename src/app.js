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
        .controller('AppCtrl', AppCtrl)
        .factory('apiService', ['$http', '$mdToast', function ($http, $mdToast) {
            var showToast = function ($mdToast, toastMsg) {
                $mdToast.show(
                    $mdToast.simple()
                        .action('OK')
                        .highlightAction(true)
                        .textContent(toastMsg)
                        .position('top right')
                        .hideDelay(6000)
                );
            };
            var request = function ($scope, method, selector, action, token, data) {
                return $http({
                    method: method,
                    url: 'https://api.lifx.com/v1/lights/' + selector + '/' + action,
                    headers: {'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'},
                    data: JSON.stringify(data)
                }).then(
                    function (response) {
                        var toastMsg = "Status " + response.status + " " + response.statusText + " ";
                        if (response.status == 207) {
                            angular.forEach(response.data.results, function (value, key) {
                                toastMsg += "(" + value.label + ": " + value.status + ") ";
                            });
                        }
                        showToast($mdToast, toastMsg);
                        $scope.submitProgress = false;
                        return response.data;
                    }
                );
            };
            return {
                request: request
            };

        }]);

    function AppCtrl($scope, $localStorage, apiService) {

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
            var method = !$scope.effectsOn ? 'PUT' : 'POST';
            var action = !$scope.effectsOn ? 'state' : 'effects/' + $scope.effect.type;
            var color = 'rgb:' + $scope.color.red + ',' + $scope.color.green + ',' + $scope.color.blue;
            var data = {'color': color};

            if ($scope.effectsOn) {
                data.period = $scope.effect.period;
                data.cycles = $scope.effect.cycles;
            }

            apiService.request($scope, method, 'all', action, $scope.apitoken, data).then(function (response) {
                console.log(response);
            });

        };

        $scope.changeState = function () {
            var data = {'power': this.bulb.state ? 'off' : 'on'};
            apiService.request($scope, 'PUT', this.bulb.id, 'state', $scope.apitoken, data);
        };

        $scope.effectsOnSwitch = function () {
            var _ = this;
            console.log(_);
            angular.forEach($scope.bulbs, function (bulb) {
                bulb.send = _.effectsOn;
                bulb.sendChange = _.effectsOn;
            });
        };

        function getBulbs() {
            var bulbs = [];

            apiService.request($scope, 'GET', 'all', '', $scope.apitoken, '').then(function (response) {
                angular.forEach(response, function (value, key) {
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
            });
        }
    }
})();
