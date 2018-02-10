(function () {
    'use strict';

    angular
        .module('LifxMaterial', ['ngMaterial', 'ngStorage'])
        .config(function ($mdThemingProvider) {
            $mdThemingProvider
                .theme('default')
                .primaryPalette('blue-grey')
                .accentPalette('deep-purple')
                .warnPalette('pink');
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
            var request = function ($scope, method, selector, action, token, data, showMsg) {
                return $http({
                    method: method,
                    url: 'https://api.lifx.com/v1/lights/' + selector + '/' + action,
                    headers: {'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'},
                    data: JSON.stringify(data)
                }).then(
                    function (response) {
                        var toastMsg = "Status " + response.status + " " + response.statusText + " ";
                        var curl = 'curl -X ' + method + ' "https://api.lifx.com/v1/lights/' + selector + '/' + action + '" '
                            + '-H "Authorization: Bearer ' + token + '" '
                            + '-H "Content-Type: application/json" ';
                        if (data !== '') {
                            curl += '-d \'' + JSON.stringify(data) + '\'';
                        }

                        if (window.console && showMsg) {
                            console.log('%c ' + curl, 'background: #333; color: #bada55; padding: 4px 2px; line-height: 1.8;');
                        }

                        if (response.status == 207) {
                            angular.forEach(response.data.results, function (value, key) {
                                toastMsg += "(" + value.label + ": " + value.status + ") ";
                            });
                        }

                        if (showMsg) {
                            showToast($mdToast, toastMsg);
                        }

                        $scope.submitProgress = false;
                        return response.data;

                    }, function (response) {
                        var toastMsg = "Error " + response.status + ": " + response.data.error + " ";
                        showToast($mdToast, toastMsg);

                        $scope.submitProgress = false;
                        return false;
                    }
                )
            };
            return {
                request: request
            };

        }]);

    function AppCtrl($scope, $localStorage, $filter, apiService) {

        $scope.color = {
            red: 96,
            green: 125,
            blue: 139
        };

        $scope.effect = {
            period: 1,
            cycles: 4,
            type: 'breathe'
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
                selector = $scope.groupselector ? 'group_id:' + $scope.groupselector : 'all',
                action = !$scope.effectsOn ? 'state' : 'effects/' + $scope.effect.type,
                color = 'rgb:' + $scope.color.red + ',' + $scope.color.green + ',' + $scope.color.blue,
                data = {'color': color},
                multipleSelector = false,
                multipleSelectorId = [];

            if ($scope.effectsOn) {
                data.period = $scope.effect.period;
                data.cycles = $scope.effect.cycles;
            }

            angular.forEach($scope.bulbs, function (bulb) {
                if (!bulb.disconnected && !bulb.send) {
                    multipleSelector = true;
                } else if (!bulb.disconnected && bulb.send) {
                    multipleSelectorId.push(bulb.id);
                }
            });

            if (multipleSelector) {
                selector = multipleSelectorId.join(',');
            }

            apiService.request($scope, method, selector, action, $scope.apitoken, data, true).then(function (response) {
                if (response !== false) {
                    getBulbs();
                }
            });

        };

        $scope.changeState = function () {
            var data = {'power': this.bulb.state ? 'off' : 'on'};
            apiService.request($scope, 'PUT', this.bulb.id, 'state', $scope.apitoken, data, true);
        };

        function getBulbs() {
            var bulbs = [],
                existingBulbs = $scope.bulbs,
                existingBulb = null,
                selector = $scope.groupselector ? 'group_id:' + $scope.groupselector : 'all';

            apiService.request($scope, 'GET', selector, '', $scope.apitoken, '', false).then(function (response) {
                angular.forEach(response, function (value, key) {
                    existingBulb = $filter('filter')(existingBulbs, {id: value.id}, true)[0];

                    bulbs.push({
                        id: value.id,
                        name: value.label,
                        color: hsvToRgb(value.color.hue, value.color.saturation * 100, value.brightness * 100),
                        location: value.location.name,
                        group: value.group.name,
                        state: value.power === 'on',
                        disconnected: !value.connected,
                        send: existingBulb ? existingBulb.send : true,
                        sendChange: true
                    });
                });

                $scope.bulbs = bulbs;
            });
        }

        function getGroups() {
            var groups = {
                0: {
                    id: 0,
                    name: 'All'
                }
            };

            apiService.request($scope, 'GET', 'all', '', $scope.apitoken, '', true).then(function (response) {
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
