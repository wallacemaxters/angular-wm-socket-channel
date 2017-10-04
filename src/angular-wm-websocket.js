(function (angular, WebSocket)  {

    'use strict';

    angular.module('wm.websocket', [])
    
    .service('WmSocket', ['$rootScope', '$q', WmSocketService]);
    
    function WmSocketService($rootScope, $q) {
    
        function WmSocket (url, options) {

            var that = this;
    
            that.options = angular.extend({namespace: 'app'}, options);
    
            that.websocket = new WebSocket(url, that.options.protocols);
    
            that.deferred = $q.defer();
    
            that.websocket.addEventListener('open', that.deferred.resolve);
            that.websocket.addEventListener('error', that.deferred.reject);
    
            that.$$callbacks = {};
    
        }
        
        var prototype = WmSocket.prototype;
        
        prototype.$onOpen = function (callback) {
            this.websocket.addEventListener('open', function (e) {
                callback(e);
                $rootScope.$apply();
            });
        };
    
        prototype.$onClose = function (callback) {
            this.websocket.addEventListener('close', function (e) {
                callback(e);
                $rootScope.$apply();
            });
        };
    
        prototype.$send = function (data) {
    
            var deferred = $q.defer();
    
            var that = this;
    
            deferred.promise.then(function () {
                that.websocket.send(angular.toJson(data));
            });
    
            if (WebSocket.OPEN === this.websocket.readyState) {
                deferred.resolve();
    
                return deferred.promise;
            }
    
            that.websocket.addEventListener('open', function open() {
                deferred.resolve();
                that.websocket.removeEventListener('open', open);
            });
    
            that.websocket.addEventListener('error', function error(e) {
                deferred.reject(e);
                that.websocket.removeEventListener('error', error);
            });
    
            return deferred.promise;
    
        };
    
        prototype.$emit = function (channel, data) {

            var that = this;

            return that.$send({
                '$channel': that.$$buildKey(channel),
                '$message': data
            });
        };
    
        prototype.$on = function (channel, callback) {

            var that = this;
    
            that.$send({
                '$subscribe': that.$$buildKey(channel)
            });
    
            var listener = function (e) {
    
                var message = angular.fromJson(e.data);
    
                message.$channel === that.$$buildKey(channel) && callback(message.$message);
    
                $rootScope.$apply();
            };
    
            that.websocket.addEventListener('message', listener);
    
            that.$$addChannelListener(channel, listener);
    
            return that;
        };
    
        prototype.$off = function (channel) {
    
            var that = this;
    
            that.$send({ '$unsubscribe': that.$$buildKey(channel) }).then(function () {
                
                var listeners = that.$$callbacks[channel];

                angular.isArray(listeners) && angular.forEach(listeners, function (listener) {
                    that.websocket.removeEventListener('message', listener);
                });

                that.$$callbacks[channel] = [];
            });
        };
    
        prototype.$$addChannelListener = function (channel, listener) {
    
            if (!angular.isArray(this.$$callbacks[channel])) {
    
                this.$$callbacks[channel] = [];
            }
    
            this.$$callbacks[channel].push(listener);
    
            return this;
        };

        prototype.$$buildKey = function (key) {
            return this.options.namespace + ':' + key;
        };
    
        prototype.$subscribe = prototype.$listen;
    
        prototype.$unsubscribe = prototype.$off;
    
        return WmSocket;
    }

})(window.angular, window.WebSocket);