/*jshint esnext: true */

const DEFAULT_WAIT = 5000;

var docReady = function(){
	return document.readyState;
};

var jQuery = function(){
	return window.jQuery === undefined;
};

var angular = function(){
	return window.angular === undefined;
};

var pendingHttp = function(){
  return $.active > 0;
};


/**
 * Function that scans all "angular" nodes within the DOM.
 * After it found all the nodes it will wait untill all pending requests on those nodes are done
 * @param  {Function} callback - this callback will be executed once all pending http calls are finished
 */
var _angularNotifyWhenFinished = function(callback){
	  function hasInjector(el) {
          return angular.element(el).injector() ? true : false;
      }

      function toArray(nodes) {
          return Array.prototype.map.call(nodes, function(value, index, array) {
              return array[index];
          });
      }

      function head(arr) {
        return arr[0];
      }

      function tail(arr) {
        if (arr.length === 0) throw new Error('Empty array');
        return arr.length > 1 ? Array.prototype.slice.apply(arr, [1]) : [];
      }

      function getNodesByPredicate(nodesList, fn) {
          function accum(acc, list) {
              var first = head(list);
              if (!first) return acc;
              else if (fn(first)) {
                  return accum(acc.concat(first), tail(list));
              } else {
                  return accum(accum(acc, toArray(first.children)), tail(list));
              }
          }
          return accum([], toArray(nodesList));
      }

      function validateAngular(){
        if (!window.angular) {
              throw new Error('angular could not be found on the window');
          }
      }

      function callbackCombinator(counter, fn) {
        return function(){
          counter -= 1;
          if (counter === 0) {
            fn();
          }
        };
      }

      function waitForAngular(arr, callback) {
        try {
          validateAngular();
          var originCallBack = callbackCombinator(arr.length, callback);
          arr.forEach(function(el) {
              angular.element(el).injector().get('$browser').
              notifyWhenNoOutstandingRequests(originCallBack);
          });
        } catch (err) {
          callback(err.message);
        }
      }

      function waitOnAngularNodes(callback) {
          waitForAngular(getNodesByPredicate(document.children, hasInjector), callback);
      }

      waitOnAngularNodes(callback);

};


/**
 * Function that indicates wheater the document is in complete state.
 * @return {boolean} - returns false if document is not in "complete" state
 */
var _docReadyPredicate = function() {
		return browser.driver.executeScript(docReady)
		  		 .then(function(result){
		  		 	return result === 'complete';
		  		 });
};

/**
 * Function that indicates wheather the jQuery is present on page.
 * @return {boolean} -  returns false if there is no jQuery present
 */
var _jQueryPredicate = function() {
	  return browser.driver.executeScript(jQuery)
	  		 .then(function(result){
	  		 	return result === false;
	  		 });
};


/**
 * Function that indicates wheather the angular is present on page.
 * @return {boolean} - returns false if there is no angular present
 */
var _angularPredicate = function() {
	  return browser.driver.executeScript(angular)
	  		 .then(function(result){
	  		 	return result === false;
	  		 });
};


/**
 * Function that indicates wheather the jQuery ajax calls are pending
 * @return {boolean} - returns false if there are more then 0 jQuery ajax requests
 */
var _pendingHttpCallsPredicate = function(){
    return browser.driver.executeScript(pendingHttp)
           .then(function(result){
            return result === false;
           });
};

module.exports = {
	
	waitForjQueryPresent : function(timeout){
								browser.wait(_jQueryPredicate, timeout || DEFAULT_WAIT );
	},

	waitForDocReady : function(timeout){
								browser.wait(_docReadyPredicate, timeout || DEFAULT_WAIT);
	},

	waitForAngularPresent : function(timeout){
								browser.wait(_angularPredicate, timeout || DEFAULT_WAIT);
	},

	waitForAngularDone : function(){
		            browser.driver.executeAsyncScript(_angularNotifyWhenFinished);
	},

  waitForJqueryCallsDone : function(timeout){
                browser.wait(_pendingHttpCallsPredicate, timeout || DEFAULT_WAIT);
  }

};


