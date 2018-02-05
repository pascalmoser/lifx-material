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

        getGroups();

        $scope.apichange = function () {
            getGroups();
        };

        $scope.groupchange = function () {
            getBulbs();
        };

        $scope.submitLight = function () {
            $scope.submitProgress = true;
            var method = !$scope.effectsOn ? 'PUT' : 'POST',
                selector = $scope.groupselector ? 'group_id:'+$scope.groupselector : 'all',
                action = !$scope.effectsOn ? 'state' : 'effects/' + $scope.effect.type,
                color = 'rgb:' + $scope.color.red + ',' + $scope.color.green + ',' + $scope.color.blue,
                data = {'color': color},
                statesSelector = [];

            if ($scope.effectsOn) {
                data.period = $scope.effect.period;
                data.cycles = $scope.effect.cycles;
            }

            angular.forEach($scope.bulbs, function (bulb) {
                if(!bulb.disconnected && !bulb.send) {
                    statesSelector.push(bulb);
                }
            });

            if(statesSelector.length > 0 && !$scope.effectsOn) {
                method = 'PUT';
                selector = '';
                action = 'states';
                data = {states : []};

                angular.forEach(statesSelector, function (bulb) {
                    data.states.push({
                        selector: bulb.id,
                        color: color
                    })

                });
            }

            console.log(data);

            data.defaults = {
                duration: 5.0
            };

            apiService.request($scope, method, selector, action, $scope.apitoken, data).then(function (response) {
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
            var bulbs = [],
                selector = $scope.groupselector ? 'group_id:'+$scope.groupselector : 'all';


            apiService.request($scope, 'GET', selector, '', $scope.apitoken, '').then(function (response) {
                angular.forEach(response, function (value, key) {
                    bulbs.push({
                        id: value.id,
                        name: value.label,
                        color: hsvToRgb(value.color.hue, value.color.saturation * 100, value.brightness * 100),
                        location: value.location.name,
                        group: value.group.name,
                        state: value.power === 'on',
                        disconnected: !value.connected,
                        send: true,
                        sendChange: true
                    });
                });
                $scope.bulbs = bulbs;
            });
        }

        function getGroups() {
            var groups = {
                0 : {
                    id: 0,
                    name: 'All'
                }
            };

            apiService.request($scope, 'GET', 'all', '', $scope.apitoken, '').then(function (response) {
                angular.forEach(response, function (value) {
                    var newGroup = {
                        id: value.group.id,
                        name: value.group.name + ' (' + value.location.name + ')'
                    };
                    groups[value.group.id] = newGroup;
                });
                var groupArray = Object.keys(groups).map(function (key) {
                    return groups[key];
                });
                groupArray.sort(function (a, b) {
                    return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);
                });
                $scope.groups = groupArray;
            });
        }

    }
})();
