(function () {
  'use strict';

  angular
      .module('MyApp',['ngMaterial'])
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
