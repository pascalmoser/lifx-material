(function () {
    'use strict';

    angular
    .module('LifxMaterial',['ngMaterial'])
    .config(function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
    .primaryPalette('blue-grey')
    .accentPalette('deep-purple')
    .warnPalette('pink')
    })
    .controller('AppCtrl', AppCtrl);

    function AppCtrl ( $scope ) {

    }

})();
