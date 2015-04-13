(function (global) {/**
 * Yandex DataSync JS API
 *
 * Copyright 2014-2015 Yandex LLC and contributors https://yandex.com/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
var ns = {
        cloud: {}
    };

(function(ns){var module = { exports: {} }, exports = {};
/**
 * Modules
 *
 * Copyright (c) 2013 Filatov Dmitry (dfilatov@yandex-team.ru)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 * @version 0.1.0
 */

(function(global) {

var undef,

    DECL_STATES = {
        NOT_RESOLVED : 'NOT_RESOLVED',
        IN_RESOLVING : 'IN_RESOLVING',
        RESOLVED     : 'RESOLVED'
    },

    /**
     * Creates a new instance of modular system
     * @returns {Object}
     */
    create = function() {
        var curOptions = {
                trackCircularDependencies : true,
                allowMultipleDeclarations : true
            },

            modulesStorage = {},
            waitForNextTick = false,
            pendingRequires = [],

            /**
             * Defines module
             * @param {String} name
             * @param {String[]} [deps]
             * @param {Function} declFn
             */
            define = function(name, deps, declFn) {
                if(!declFn) {
                    declFn = deps;
                    deps = [];
                }

                var module = modulesStorage[name];
                if(!module) {
                    module = modulesStorage[name] = {
                        name : name,
                        decl : undef
                    };
                }

                module.decl = {
                    name       : name,
                    prev       : module.decl,
                    fn         : declFn,
                    state      : DECL_STATES.NOT_RESOLVED,
                    deps       : deps,
                    dependents : [],
                    exports    : undef
                };
            },

            /**
             * Requires modules
             * @param {String|String[]} modules
             * @param {Function} cb
             * @param {Function} [errorCb]
             */
            require = function(modules, cb, errorCb) {
                if(typeof modules === 'string') {
                    modules = [modules];
                }

                if(!waitForNextTick) {
                    waitForNextTick = true;
                    nextTick(onNextTick);
                }

                pendingRequires.push({
                    deps : modules,
                    cb   : function(exports, error) {
                        error?
                            (errorCb || onError)(error) :
                            cb.apply(global, exports);
                    }
                });
            },

            /**
             * Returns state of module
             * @param {String} name
             * @returns {String} state, possible values are NOT_DEFINED, NOT_RESOLVED, IN_RESOLVING, RESOLVED
             */
            getState = function(name) {
                var module = modulesStorage[name];
                return module?
                    DECL_STATES[module.decl.state] :
                    'NOT_DEFINED';
            },

            /**
             * Returns whether the module is defined
             * @param {String} name
             * @returns {Boolean}
             */
            isDefined = function(name) {
                return !!modulesStorage[name];
            },

            /**
             * Sets options
             * @param {Object} options
             */
            setOptions = function(options) {
                for(var name in options) {
                    if(options.hasOwnProperty(name)) {
                        curOptions[name] = options[name];
                    }
                }
            },

            onNextTick = function() {
                waitForNextTick = false;
                applyRequires();
            },

            applyRequires = function() {
                var requiresToProcess = pendingRequires,
                    i = 0, require;

                pendingRequires = [];

                while(require = requiresToProcess[i++]) {
                    requireDeps(null, require.deps, [], require.cb);
                }
            },

            requireDeps = function(fromDecl, deps, path, cb) {
                var unresolvedDepsCnt = deps.length;
                if(!unresolvedDepsCnt) {
                    cb([]);
                }

                var decls = [],
                    i = 0, len = unresolvedDepsCnt,
                    dep, decl;

                while(i < len) {
                    dep = deps[i++];
                    if(typeof dep === 'string') {
                        if(!modulesStorage[dep]) {
                            cb(null, buildModuleNotFoundError(dep, fromDecl));
                            return;
                        }

                        decl = modulesStorage[dep].decl;
                    }
                    else {
                        decl = dep;
                    }

                    if(decl.state === DECL_STATES.IN_RESOLVING &&
                            curOptions.trackCircularDependencies &&
                            isDependenceCircular(decl, path)) {
                        cb(null, buildCircularDependenceError(decl, path));
                        return;
                    }

                    decls.push(decl);

                    startDeclResolving(
                        decl,
                        path,
                        function(_, error) {
                            if(error) {
                                cb(null, error);
                                return;
                            }

                            if(!--unresolvedDepsCnt) {
                                var exports = [],
                                    i = 0, decl;
                                while(decl = decls[i++]) {
                                    exports.push(decl.exports);
                                }
                                cb(exports);
                            }
                        });
                }
            },

            startDeclResolving = function(decl, path, cb) {
                if(decl.state === DECL_STATES.RESOLVED) {
                    cb(decl.exports);
                    return;
                }
                else {
                    decl.dependents.push(cb);
                }

                if(decl.state === DECL_STATES.IN_RESOLVING) {
                    return;
                }

                if(decl.prev && !curOptions.allowMultipleDeclarations) {
                    provideError(decl, buildMultipleDeclarationError(decl));
                    return;
                }

                curOptions.trackCircularDependencies && (path = path.slice()).push(decl);

                var isProvided = false,
                    deps = decl.prev? decl.deps.concat([decl.prev]) : decl.deps;

                decl.state = DECL_STATES.IN_RESOLVING;
                requireDeps(
                    decl,
                    deps,
                    path,
                    function(depDeclsExports, error) {
                        if(error) {
                            provideError(decl, error);
                            return;
                        }

                        depDeclsExports.unshift(function(exports, error) {
                            if(isProvided) {
                                cb(null, buildDeclAreadyProvidedError(decl));
                                return;
                            }

                            isProvided = true;
                            error?
                                provideError(decl, error) :
                                provideDecl(decl, exports);
                        });

                        decl.fn.apply(
                            {
                                name   : decl.name,
                                deps   : decl.deps,
                                global : global
                            },
                            depDeclsExports);
                    });
            },

            provideDecl = function(decl, exports) {
                decl.exports = exports;
                decl.state = DECL_STATES.RESOLVED;

                var i = 0, dependent;
                while(dependent = decl.dependents[i++]) {
                    dependent(exports);
                }

                decl.dependents = undef;
            },

            provideError = function(decl, error) {
                decl.state = DECL_STATES.NOT_RESOLVED;

                var i = 0, dependent;
                while(dependent = decl.dependents[i++]) {
                    dependent(null, error);
                }

                decl.dependents = [];
            };

        return {
            create     : create,
            define     : define,
            require    : require,
            getState   : getState,
            isDefined  : isDefined,
            setOptions : setOptions
        };
    },

    onError = function(e) {
        nextTick(function() {
            throw e;
        });
    },

    buildModuleNotFoundError = function(name, decl) {
        return Error(decl?
            'Module "' + decl.name + '": can\'t resolve dependence "' + name + '"' :
            'Required module "' + name + '" can\'t be resolved');
    },

    buildCircularDependenceError = function(decl, path) {
        var strPath = [],
            i = 0, pathDecl;
        while(pathDecl = path[i++]) {
            strPath.push(pathDecl.name);
        }
        strPath.push(decl.name);

        return Error('Circular dependence has been detected: "' + strPath.join(' -> ') + '"');
    },

    buildDeclAreadyProvidedError = function(decl) {
        return Error('Declaration of module "' + decl.name + '" has already been provided');
    },

    buildMultipleDeclarationError = function(decl) {
        return Error('Multiple declarations of module "' + decl.name + '" have been detected');
    },

    isDependenceCircular = function(decl, path) {
        var i = 0, pathDecl;
        while(pathDecl = path[i++]) {
            if(decl === pathDecl) {
                return true;
            }
        }
        return false;
    },

    nextTick = (function() {
        var fns = [],
            enqueueFn = function(fn) {
                return fns.push(fn) === 1;
            },
            callFns = function() {
                var fnsToCall = fns, i = 0, len = fns.length;
                fns = [];
                while(i < len) {
                    fnsToCall[i++]();
                }
            };

        if(typeof process === 'object' && process.nextTick) { // nodejs
            return function(fn) {
                enqueueFn(fn) && process.nextTick(callFns);
            };
        }

        if(global.setImmediate) { // ie10
            return function(fn) {
                enqueueFn(fn) && global.setImmediate(callFns);
            };
        }

        if(global.postMessage && !global.opera) { // modern browsers
            var isPostMessageAsync = true;
            if(global.attachEvent) {
                var checkAsync = function() {
                        isPostMessageAsync = false;
                    };
                global.attachEvent('onmessage', checkAsync);
                global.postMessage('__checkAsync', '*');
                global.detachEvent('onmessage', checkAsync);
            }

            if(isPostMessageAsync) {
                var msg = '__modules' + (+new Date()),
                    onMessage = function(e) {
                        if(e.data === msg) {
                            e.stopPropagation && e.stopPropagation();
                            callFns();
                        }
                    };

                global.addEventListener?
                    global.addEventListener('message', onMessage, true) :
                    global.attachEvent('onmessage', onMessage);

                return function(fn) {
                    enqueueFn(fn) && global.postMessage(msg, '*');
                };
            }
        }

        var doc = global.document;
        if('onreadystatechange' in doc.createElement('script')) { // ie6-ie8
            var head = doc.getElementsByTagName('head')[0],
                createScript = function() {
                    var script = doc.createElement('script');
                    script.onreadystatechange = function() {
                        script.parentNode.removeChild(script);
                        script = script.onreadystatechange = null;
                        callFns();
                    };
                    head.appendChild(script);
                };

            return function(fn) {
                enqueueFn(fn) && createScript();
            };
        }

        return function(fn) { // old browsers
            enqueueFn(fn) && setTimeout(callFns, 0);
        };
    })();

if(typeof exports === 'object') {
    module.exports = create();
}
else {
    global.modules = create();
}

})(this);

ns.modules = module.exports; })(ns);

(function (ns) {
var module = { exports: {} }, exports = {};
/**
 * @module vow
 * @author Filatov Dmitry <dfilatov@yandex-team.ru>
 * @version 0.4.9
 * @license
 * Dual licensed under the MIT and GPL licenses:
 *   * http://www.opensource.org/licenses/mit-license.php
 *   * http://www.gnu.org/licenses/gpl.html
 */

(function(global) {

var undef,
    nextTick = (function() {
        var fns = [],
            enqueueFn = function(fn) {
                return fns.push(fn) === 1;
            },
            callFns = function() {
                var fnsToCall = fns, i = 0, len = fns.length;
                fns = [];
                while(i < len) {
                    fnsToCall[i++]();
                }
            };

        if(typeof setImmediate === 'function') { // ie10, nodejs >= 0.10
            return function(fn) {
                enqueueFn(fn) && setImmediate(callFns);
            };
        }

        if(typeof process === 'object' && process.nextTick) { // nodejs < 0.10
            return function(fn) {
                enqueueFn(fn) && process.nextTick(callFns);
            };
        }

        if(global.postMessage) { // modern browsers
            var isPostMessageAsync = true;
            if(global.attachEvent) {
                var checkAsync = function() {
                        isPostMessageAsync = false;
                    };
                global.attachEvent('onmessage', checkAsync);
                global.postMessage('__checkAsync', '*');
                global.detachEvent('onmessage', checkAsync);
            }

            if(isPostMessageAsync) {
                var msg = '__promise' + +new Date,
                    onMessage = function(e) {
                        if(e.data === msg) {
                            e.stopPropagation && e.stopPropagation();
                            callFns();
                        }
                    };

                global.addEventListener?
                    global.addEventListener('message', onMessage, true) :
                    global.attachEvent('onmessage', onMessage);

                return function(fn) {
                    enqueueFn(fn) && global.postMessage(msg, '*');
                };
            }
        }

        var doc = global.document;
        if('onreadystatechange' in doc.createElement('script')) { // ie6-ie8
            var createScript = function() {
                    var script = doc.createElement('script');
                    script.onreadystatechange = function() {
                        script.parentNode.removeChild(script);
                        script = script.onreadystatechange = null;
                        callFns();
                };
                (doc.documentElement || doc.body).appendChild(script);
            };

            return function(fn) {
                enqueueFn(fn) && createScript();
            };
        }

        return function(fn) { // old browsers
            enqueueFn(fn) && setTimeout(callFns, 0);
        };
    })(),
    throwException = function(e) {
        nextTick(function() {
            throw e;
        });
    },
    isFunction = function(obj) {
        return typeof obj === 'function';
    },
    isObject = function(obj) {
        return obj !== null && typeof obj === 'object';
    },
    toStr = Object.prototype.toString,
    isArray = Array.isArray || function(obj) {
        return toStr.call(obj) === '[object Array]';
    },
    getArrayKeys = function(arr) {
        var res = [],
            i = 0, len = arr.length;
        while(i < len) {
            res.push(i++);
        }
        return res;
    },
    getObjectKeys = Object.keys || function(obj) {
        var res = [];
        for(var i in obj) {
            obj.hasOwnProperty(i) && res.push(i);
        }
        return res;
    },
    defineCustomErrorType = function(name) {
        var res = function(message) {
            this.name = name;
            this.message = message;
        };

        res.prototype = new Error();

        return res;
    },
    wrapOnFulfilled = function(onFulfilled, idx) {
        return function(val) {
            onFulfilled.call(this, val, idx);
        };
    };

/**
 * @class Deferred
 * @exports vow:Deferred
 * @description
 * The `Deferred` class is used to encapsulate newly-created promise object along with functions that resolve, reject or notify it.
 */

/**
 * @constructor
 * @description
 * You can use `vow.defer()` instead of using this constructor.
 *
 * `new vow.Deferred()` gives the same result as `vow.defer()`.
 */
var Deferred = function() {
    this._promise = new Promise();
};

Deferred.prototype = /** @lends Deferred.prototype */{
    /**
     * Returns corresponding promise.
     *
     * @returns {vow:Promise}
     */
    promise : function() {
        return this._promise;
    },

    /**
     * Resolves corresponding promise with given `value`.
     *
     * @param {*} value
     *
     * @example
     * ```js
     * var defer = vow.defer(),
     *     promise = defer.promise();
     *
     * promise.then(function(value) {
     *     // value is "'success'" here
     * });
     *
     * defer.resolve('success');
     * ```
     */
    resolve : function(value) {
        this._promise.isResolved() || this._promise._resolve(value);
    },

    /**
     * Rejects corresponding promise with given `reason`.
     *
     * @param {*} reason
     *
     * @example
     * ```js
     * var defer = vow.defer(),
     *     promise = defer.promise();
     *
     * promise.fail(function(reason) {
     *     // reason is "'something is wrong'" here
     * });
     *
     * defer.reject('something is wrong');
     * ```
     */
    reject : function(reason) {
        if(this._promise.isResolved()) {
            return;
        }

        if(vow.isPromise(reason)) {
            reason = reason.then(function(val) {
                var defer = vow.defer();
                defer.reject(val);
                return defer.promise();
            });
            this._promise._resolve(reason);
        }
        else {
            this._promise._reject(reason);
        }
    },

    /**
     * Notifies corresponding promise with given `value`.
     *
     * @param {*} value
     *
     * @example
     * ```js
     * var defer = vow.defer(),
     *     promise = defer.promise();
     *
     * promise.progress(function(value) {
     *     // value is "'20%'", "'40%'" here
     * });
     *
     * defer.notify('20%');
     * defer.notify('40%');
     * ```
     */
    notify : function(value) {
        this._promise.isResolved() || this._promise._notify(value);
    }
};

var PROMISE_STATUS = {
    PENDING   : 0,
    RESOLVED  : 1,
    FULFILLED : 2,
    REJECTED  : 3
};

/**
 * @class Promise
 * @exports vow:Promise
 * @description
 * The `Promise` class is used when you want to give to the caller something to subscribe to,
 * but not the ability to resolve or reject the deferred.
 */

/**
 * @constructor
 * @param {Function} resolver See https://github.com/domenic/promises-unwrapping/blob/master/README.md#the-promise-constructor for details.
 * @description
 * You should use this constructor directly only if you are going to use `vow` as DOM Promises implementation.
 * In other case you should use `vow.defer()` and `defer.promise()` methods.
 * @example
 * ```js
 * function fetchJSON(url) {
 *     return new vow.Promise(function(resolve, reject, notify) {
 *         var xhr = new XMLHttpRequest();
 *         xhr.open('GET', url);
 *         xhr.responseType = 'json';
 *         xhr.send();
 *         xhr.onload = function() {
 *             if(xhr.response) {
 *                 resolve(xhr.response);
 *             }
 *             else {
 *                 reject(new TypeError());
 *             }
 *         };
 *     });
 * }
 * ```
 */
var Promise = function(resolver) {
    this._value = undef;
    this._status = PROMISE_STATUS.PENDING;

    this._fulfilledCallbacks = [];
    this._rejectedCallbacks = [];
    this._progressCallbacks = [];

    if(resolver) { // NOTE: see https://github.com/domenic/promises-unwrapping/blob/master/README.md
        var _this = this,
            resolverFnLen = resolver.length;

        resolver(
            function(val) {
                _this.isResolved() || _this._resolve(val);
            },
            resolverFnLen > 1?
                function(reason) {
                    _this.isResolved() || _this._reject(reason);
                } :
                undef,
            resolverFnLen > 2?
                function(val) {
                    _this.isResolved() || _this._notify(val);
                } :
                undef);
    }
};

Promise.prototype = /** @lends Promise.prototype */ {
    /**
     * Returns value of fulfilled promise or reason in case of rejection.
     *
     * @returns {*}
     */
    valueOf : function() {
        return this._value;
    },

    /**
     * Returns `true` if promise is resolved.
     *
     * @returns {Boolean}
     */
    isResolved : function() {
        return this._status !== PROMISE_STATUS.PENDING;
    },

    /**
     * Returns `true` if promise is fulfilled.
     *
     * @returns {Boolean}
     */
    isFulfilled : function() {
        return this._status === PROMISE_STATUS.FULFILLED;
    },

    /**
     * Returns `true` if promise is rejected.
     *
     * @returns {Boolean}
     */
    isRejected : function() {
        return this._status === PROMISE_STATUS.REJECTED;
    },

    /**
     * Adds reactions to promise.
     *
     * @param {Function} [onFulfilled] Callback that will to be invoked with the value after promise has been fulfilled
     * @param {Function} [onRejected] Callback that will to be invoked with the reason after promise has been rejected
     * @param {Function} [onProgress] Callback that will to be invoked with the value after promise has been notified
     * @param {Object} [ctx] Context of callbacks execution
     * @returns {vow:Promise} A new promise, see https://github.com/promises-aplus/promises-spec for details
     */
    then : function(onFulfilled, onRejected, onProgress, ctx) {
        var defer = new Deferred();
        this._addCallbacks(defer, onFulfilled, onRejected, onProgress, ctx);
        return defer.promise();
    },

    /**
     * Adds rejection reaction only. It is shortcut for `promise.then(undefined, onRejected)`.
     *
     * @param {Function} onRejected Callback to be called with the value after promise has been rejected
     * @param {Object} [ctx] Context of callback execution
     * @returns {vow:Promise}
     */
    'catch' : function(onRejected, ctx) {
        return this.then(undef, onRejected, ctx);
    },

    /**
     * Adds rejection reaction only. It is shortcut for `promise.then(null, onRejected)`. It's alias for `catch`.
     *
     * @param {Function} onRejected Callback to be called with the value after promise has been rejected
     * @param {Object} [ctx] Context of callback execution
     * @returns {vow:Promise}
     */
    fail : function(onRejected, ctx) {
        return this.then(undef, onRejected, ctx);
    },

    /**
     * Adds resolving reaction (to fulfillment and rejection both).
     *
     * @param {Function} onResolved Callback that to be called with the value after promise has been resolved
     * @param {Object} [ctx] Context of callback execution
     * @returns {vow:Promise}
     */
    always : function(onResolved, ctx) {
        var _this = this,
            cb = function() {
                return onResolved.call(this, _this);
            };

        return this.then(cb, cb, ctx);
    },

    /**
     * Adds progress reaction.
     *
     * @param {Function} onProgress Callback to be called with the value when promise has been notified
     * @param {Object} [ctx] Context of callback execution
     * @returns {vow:Promise}
     */
    progress : function(onProgress, ctx) {
        return this.then(undef, undef, onProgress, ctx);
    },

    /**
     * Like `promise.then`, but "spreads" the array into a variadic value handler.
     * It is useful with `vow.all` and `vow.allResolved` methods.
     *
     * @param {Function} [onFulfilled] Callback that will to be invoked with the value after promise has been fulfilled
     * @param {Function} [onRejected] Callback that will to be invoked with the reason after promise has been rejected
     * @param {Object} [ctx] Context of callbacks execution
     * @returns {vow:Promise}
     *
     * @example
     * ```js
     * var defer1 = vow.defer(),
     *     defer2 = vow.defer();
     *
     * vow.all([defer1.promise(), defer2.promise()]).spread(function(arg1, arg2) {
     *     // arg1 is "1", arg2 is "'two'" here
     * });
     *
     * defer1.resolve(1);
     * defer2.resolve('two');
     * ```
     */
    spread : function(onFulfilled, onRejected, ctx) {
        return this.then(
            function(val) {
                return onFulfilled.apply(this, val);
            },
            onRejected,
            ctx);
    },

    /**
     * Like `then`, but terminates a chain of promises.
     * If the promise has been rejected, throws it as an exception in a future turn of the event loop.
     *
     * @param {Function} [onFulfilled] Callback that will to be invoked with the value after promise has been fulfilled
     * @param {Function} [onRejected] Callback that will to be invoked with the reason after promise has been rejected
     * @param {Function} [onProgress] Callback that will to be invoked with the value after promise has been notified
     * @param {Object} [ctx] Context of callbacks execution
     *
     * @example
     * ```js
     * var defer = vow.defer();
     * defer.reject(Error('Internal error'));
     * defer.promise().done(); // exception to be thrown
     * ```
     */
    done : function(onFulfilled, onRejected, onProgress, ctx) {
        this
            .then(onFulfilled, onRejected, onProgress, ctx)
            .fail(throwException);
    },

    /**
     * Returns a new promise that will be fulfilled in `delay` milliseconds if the promise is fulfilled,
     * or immediately rejected if promise is rejected.
     *
     * @param {Number} delay
     * @returns {vow:Promise}
     */
    delay : function(delay) {
        var timer,
            promise = this.then(function(val) {
                var defer = new Deferred();
                timer = setTimeout(
                    function() {
                        defer.resolve(val);
                    },
                    delay);

                return defer.promise();
            });

        promise.always(function() {
            clearTimeout(timer);
        });

        return promise;
    },

    /**
     * Returns a new promise that will be rejected in `timeout` milliseconds
     * if the promise is not resolved beforehand.
     *
     * @param {Number} timeout
     * @returns {vow:Promise}
     *
     * @example
     * ```js
     * var defer = vow.defer(),
     *     promiseWithTimeout1 = defer.promise().timeout(50),
     *     promiseWithTimeout2 = defer.promise().timeout(200);
     *
     * setTimeout(
     *     function() {
     *         defer.resolve('ok');
     *     },
     *     100);
     *
     * promiseWithTimeout1.fail(function(reason) {
     *     // promiseWithTimeout to be rejected in 50ms
     * });
     *
     * promiseWithTimeout2.then(function(value) {
     *     // promiseWithTimeout to be fulfilled with "'ok'" value
     * });
     * ```
     */
    timeout : function(timeout) {
        var defer = new Deferred(),
            timer = setTimeout(
                function() {
                    defer.reject(new vow.TimedOutError('timed out'));
                },
                timeout);

        this.then(
            function(val) {
                defer.resolve(val);
            },
            function(reason) {
                defer.reject(reason);
            });

        defer.promise().always(function() {
            clearTimeout(timer);
        });

        return defer.promise();
    },

    _vow : true,

    _resolve : function(val) {
        if(this._status > PROMISE_STATUS.RESOLVED) {
            return;
        }

        if(val === this) {
            this._reject(TypeError('Can\'t resolve promise with itself'));
            return;
        }

        this._status = PROMISE_STATUS.RESOLVED;

        if(val && !!val._vow) { // shortpath for vow.Promise
            val.isFulfilled()?
                this._fulfill(val.valueOf()) :
                val.isRejected()?
                    this._reject(val.valueOf()) :
                    val.then(
                        this._fulfill,
                        this._reject,
                        this._notify,
                        this);
            return;
        }

        if(isObject(val) || isFunction(val)) {
            var then;
            try {
                then = val.then;
            }
            catch(e) {
                this._reject(e);
                return;
            }

            if(isFunction(then)) {
                var _this = this,
                    isResolved = false;

                try {
                    then.call(
                        val,
                        function(val) {
                            if(isResolved) {
                                return;
                            }

                            isResolved = true;
                            _this._resolve(val);
                        },
                        function(err) {
                            if(isResolved) {
                                return;
                            }

                            isResolved = true;
                            _this._reject(err);
                        },
                        function(val) {
                            _this._notify(val);
                        });
                }
                catch(e) {
                    isResolved || this._reject(e);
                }

                return;
            }
        }

        this._fulfill(val);
    },

    _fulfill : function(val) {
        if(this._status > PROMISE_STATUS.RESOLVED) {
            return;
        }

        this._status = PROMISE_STATUS.FULFILLED;
        this._value = val;

        this._callCallbacks(this._fulfilledCallbacks, val);
        this._fulfilledCallbacks = this._rejectedCallbacks = this._progressCallbacks = undef;
    },

    _reject : function(reason) {
        if(this._status > PROMISE_STATUS.RESOLVED) {
            return;
        }

        this._status = PROMISE_STATUS.REJECTED;
        this._value = reason;

        this._callCallbacks(this._rejectedCallbacks, reason);
        this._fulfilledCallbacks = this._rejectedCallbacks = this._progressCallbacks = undef;
    },

    _notify : function(val) {
        this._callCallbacks(this._progressCallbacks, val);
    },

    _addCallbacks : function(defer, onFulfilled, onRejected, onProgress, ctx) {
        if(onRejected && !isFunction(onRejected)) {
            ctx = onRejected;
            onRejected = undef;
        }
        else if(onProgress && !isFunction(onProgress)) {
            ctx = onProgress;
            onProgress = undef;
        }

        var cb;

        if(!this.isRejected()) {
            cb = { defer : defer, fn : isFunction(onFulfilled)? onFulfilled : undef, ctx : ctx };
            this.isFulfilled()?
                this._callCallbacks([cb], this._value) :
                this._fulfilledCallbacks.push(cb);
        }

        if(!this.isFulfilled()) {
            cb = { defer : defer, fn : onRejected, ctx : ctx };
            this.isRejected()?
                this._callCallbacks([cb], this._value) :
                this._rejectedCallbacks.push(cb);
        }

        if(this._status <= PROMISE_STATUS.RESOLVED) {
            this._progressCallbacks.push({ defer : defer, fn : onProgress, ctx : ctx });
        }
    },

    _callCallbacks : function(callbacks, arg) {
        var len = callbacks.length;
        if(!len) {
            return;
        }

        var isResolved = this.isResolved(),
            isFulfilled = this.isFulfilled();

        nextTick(function() {
            var i = 0, cb, defer, fn;
            while(i < len) {
                cb = callbacks[i++];
                defer = cb.defer;
                fn = cb.fn;

                if(fn) {
                    var ctx = cb.ctx,
                        res;
                    try {
                        res = ctx? fn.call(ctx, arg) : fn(arg);
                    }
                    catch(e) {
                        defer.reject(e);
                        continue;
                    }

                    isResolved?
                        defer.resolve(res) :
                        defer.notify(res);
                }
                else {
                    isResolved?
                        isFulfilled?
                            defer.resolve(arg) :
                            defer.reject(arg) :
                        defer.notify(arg);
                }
            }
        });
    }
};

/** @lends Promise */
var staticMethods = {
    /**
     * Coerces given `value` to a promise, or returns the `value` if it's already a promise.
     *
     * @param {*} value
     * @returns {vow:Promise}
     */
    cast : function(value) {
        return vow.cast(value);
    },

    /**
     * Returns a promise to be fulfilled only after all the items in `iterable` are fulfilled,
     * or to be rejected when any of the `iterable` is rejected.
     *
     * @param {Array|Object} iterable
     * @returns {vow:Promise}
     */
    all : function(iterable) {
        return vow.all(iterable);
    },

    /**
     * Returns a promise to be fulfilled only when any of the items in `iterable` are fulfilled,
     * or to be rejected when the first item is rejected.
     *
     * @param {Array} iterable
     * @returns {vow:Promise}
     */
    race : function(iterable) {
        return vow.anyResolved(iterable);
    },

    /**
     * Returns a promise that has already been resolved with the given `value`.
     * If `value` is a promise, returned promise will be adopted with the state of given promise.
     *
     * @param {*} value
     * @returns {vow:Promise}
     */
    resolve : function(value) {
        return vow.resolve(value);
    },

    /**
     * Returns a promise that has already been rejected with the given `reason`.
     *
     * @param {*} reason
     * @returns {vow:Promise}
     */
    reject : function(reason) {
        return vow.reject(reason);
    }
};

for(var prop in staticMethods) {
    staticMethods.hasOwnProperty(prop) &&
        (Promise[prop] = staticMethods[prop]);
}

var vow = /** @exports vow */ {
    Deferred : Deferred,

    Promise : Promise,

    /**
     * Creates a new deferred. This method is a factory method for `vow:Deferred` class.
     * It's equivalent to `new vow.Deferred()`.
     *
     * @returns {vow:Deferred}
     */
    defer : function() {
        return new Deferred();
    },

    /**
     * Static equivalent to `promise.then`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @param {Function} [onFulfilled] Callback that will to be invoked with the value after promise has been fulfilled
     * @param {Function} [onRejected] Callback that will to be invoked with the reason after promise has been rejected
     * @param {Function} [onProgress] Callback that will to be invoked with the value after promise has been notified
     * @param {Object} [ctx] Context of callbacks execution
     * @returns {vow:Promise}
     */
    when : function(value, onFulfilled, onRejected, onProgress, ctx) {
        return vow.cast(value).then(onFulfilled, onRejected, onProgress, ctx);
    },

    /**
     * Static equivalent to `promise.fail`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @param {Function} onRejected Callback that will to be invoked with the reason after promise has been rejected
     * @param {Object} [ctx] Context of callback execution
     * @returns {vow:Promise}
     */
    fail : function(value, onRejected, ctx) {
        return vow.when(value, undef, onRejected, ctx);
    },

    /**
     * Static equivalent to `promise.always`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @param {Function} onResolved Callback that will to be invoked with the reason after promise has been resolved
     * @param {Object} [ctx] Context of callback execution
     * @returns {vow:Promise}
     */
    always : function(value, onResolved, ctx) {
        return vow.when(value).always(onResolved, ctx);
    },

    /**
     * Static equivalent to `promise.progress`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @param {Function} onProgress Callback that will to be invoked with the reason after promise has been notified
     * @param {Object} [ctx] Context of callback execution
     * @returns {vow:Promise}
     */
    progress : function(value, onProgress, ctx) {
        return vow.when(value).progress(onProgress, ctx);
    },

    /**
     * Static equivalent to `promise.spread`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @param {Function} [onFulfilled] Callback that will to be invoked with the value after promise has been fulfilled
     * @param {Function} [onRejected] Callback that will to be invoked with the reason after promise has been rejected
     * @param {Object} [ctx] Context of callbacks execution
     * @returns {vow:Promise}
     */
    spread : function(value, onFulfilled, onRejected, ctx) {
        return vow.when(value).spread(onFulfilled, onRejected, ctx);
    },

    /**
     * Static equivalent to `promise.done`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @param {Function} [onFulfilled] Callback that will to be invoked with the value after promise has been fulfilled
     * @param {Function} [onRejected] Callback that will to be invoked with the reason after promise has been rejected
     * @param {Function} [onProgress] Callback that will to be invoked with the value after promise has been notified
     * @param {Object} [ctx] Context of callbacks execution
     */
    done : function(value, onFulfilled, onRejected, onProgress, ctx) {
        vow.when(value).done(onFulfilled, onRejected, onProgress, ctx);
    },

    /**
     * Checks whether the given `value` is a promise-like object
     *
     * @param {*} value
     * @returns {Boolean}
     *
     * @example
     * ```js
     * vow.isPromise('something'); // returns false
     * vow.isPromise(vow.defer().promise()); // returns true
     * vow.isPromise({ then : function() { }); // returns true
     * ```
     */
    isPromise : function(value) {
        return isObject(value) && isFunction(value.then);
    },

    /**
     * Coerces given `value` to a promise, or returns the `value` if it's already a promise.
     *
     * @param {*} value
     * @returns {vow:Promise}
     */
    cast : function(value) {
        return value && !!value._vow?
            value :
            vow.resolve(value);
    },

    /**
     * Static equivalent to `promise.valueOf`.
     * If given `value` is not an instance of `vow.Promise`, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @returns {*}
     */
    valueOf : function(value) {
        return value && isFunction(value.valueOf)? value.valueOf() : value;
    },

    /**
     * Static equivalent to `promise.isFulfilled`.
     * If given `value` is not an instance of `vow.Promise`, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @returns {Boolean}
     */
    isFulfilled : function(value) {
        return value && isFunction(value.isFulfilled)? value.isFulfilled() : true;
    },

    /**
     * Static equivalent to `promise.isRejected`.
     * If given `value` is not an instance of `vow.Promise`, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @returns {Boolean}
     */
    isRejected : function(value) {
        return value && isFunction(value.isRejected)? value.isRejected() : false;
    },

    /**
     * Static equivalent to `promise.isResolved`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @returns {Boolean}
     */
    isResolved : function(value) {
        return value && isFunction(value.isResolved)? value.isResolved() : true;
    },

    /**
     * Returns a promise that has already been resolved with the given `value`.
     * If `value` is a promise, returned promise will be adopted with the state of given promise.
     *
     * @param {*} value
     * @returns {vow:Promise}
     */
    resolve : function(value) {
        var res = vow.defer();
        res.resolve(value);
        return res.promise();
    },

    /**
     * Returns a promise that has already been fulfilled with the given `value`.
     * If `value` is a promise, returned promise will be fulfilled with fulfill/rejection value of given promise.
     *
     * @param {*} value
     * @returns {vow:Promise}
     */
    fulfill : function(value) {
        var defer = vow.defer(),
            promise = defer.promise();

        defer.resolve(value);

        return promise.isFulfilled()?
            promise :
            promise.then(null, function(reason) {
                return reason;
            });
    },

    /**
     * Returns a promise that has already been rejected with the given `reason`.
     * If `reason` is a promise, returned promise will be rejected with fulfill/rejection value of given promise.
     *
     * @param {*} reason
     * @returns {vow:Promise}
     */
    reject : function(reason) {
        var defer = vow.defer();
        defer.reject(reason);
        return defer.promise();
    },

    /**
     * Invokes a given function `fn` with arguments `args`
     *
     * @param {Function} fn
     * @param {...*} [args]
     * @returns {vow:Promise}
     *
     * @example
     * ```js
     * var promise1 = vow.invoke(function(value) {
     *         return value;
     *     }, 'ok'),
     *     promise2 = vow.invoke(function() {
     *         throw Error();
     *     });
     *
     * promise1.isFulfilled(); // true
     * promise1.valueOf(); // 'ok'
     * promise2.isRejected(); // true
     * promise2.valueOf(); // instance of Error
     * ```
     */
    invoke : function(fn, args) {
        var len = Math.max(arguments.length - 1, 0),
            callArgs;
        if(len) { // optimization for V8
            callArgs = Array(len);
            var i = 0;
            while(i < len) {
                callArgs[i++] = arguments[i];
            }
        }

        try {
            return vow.resolve(callArgs?
                fn.apply(global, callArgs) :
                fn.call(global));
        }
        catch(e) {
            return vow.reject(e);
        }
    },

    /**
     * Returns a promise to be fulfilled only after all the items in `iterable` are fulfilled,
     * or to be rejected when any of the `iterable` is rejected.
     *
     * @param {Array|Object} iterable
     * @returns {vow:Promise}
     *
     * @example
     * with array:
     * ```js
     * var defer1 = vow.defer(),
     *     defer2 = vow.defer();
     *
     * vow.all([defer1.promise(), defer2.promise(), 3])
     *     .then(function(value) {
     *          // value is "[1, 2, 3]" here
     *     });
     *
     * defer1.resolve(1);
     * defer2.resolve(2);
     * ```
     *
     * @example
     * with object:
     * ```js
     * var defer1 = vow.defer(),
     *     defer2 = vow.defer();
     *
     * vow.all({ p1 : defer1.promise(), p2 : defer2.promise(), p3 : 3 })
     *     .then(function(value) {
     *          // value is "{ p1 : 1, p2 : 2, p3 : 3 }" here
     *     });
     *
     * defer1.resolve(1);
     * defer2.resolve(2);
     * ```
     */
    all : function(iterable) {
        var defer = new Deferred(),
            isPromisesArray = isArray(iterable),
            keys = isPromisesArray?
                getArrayKeys(iterable) :
                getObjectKeys(iterable),
            len = keys.length,
            res = isPromisesArray? [] : {};

        if(!len) {
            defer.resolve(res);
            return defer.promise();
        }

        var i = len;
        vow._forEach(
            iterable,
            function(value, idx) {
                res[keys[idx]] = value;
                if(!--i) {
                    defer.resolve(res);
                }
            },
            defer.reject,
            defer.notify,
            defer,
            keys);

        return defer.promise();
    },

    /**
     * Returns a promise to be fulfilled only after all the items in `iterable` are resolved.
     *
     * @param {Array|Object} iterable
     * @returns {vow:Promise}
     *
     * @example
     * ```js
     * var defer1 = vow.defer(),
     *     defer2 = vow.defer();
     *
     * vow.allResolved([defer1.promise(), defer2.promise()]).spread(function(promise1, promise2) {
     *     promise1.isRejected(); // returns true
     *     promise1.valueOf(); // returns "'error'"
     *     promise2.isFulfilled(); // returns true
     *     promise2.valueOf(); // returns "'ok'"
     * });
     *
     * defer1.reject('error');
     * defer2.resolve('ok');
     * ```
     */
    allResolved : function(iterable) {
        var defer = new Deferred(),
            isPromisesArray = isArray(iterable),
            keys = isPromisesArray?
                getArrayKeys(iterable) :
                getObjectKeys(iterable),
            i = keys.length,
            res = isPromisesArray? [] : {};

        if(!i) {
            defer.resolve(res);
            return defer.promise();
        }

        var onResolved = function() {
                --i || defer.resolve(iterable);
            };

        vow._forEach(
            iterable,
            onResolved,
            onResolved,
            defer.notify,
            defer,
            keys);

        return defer.promise();
    },

    allPatiently : function(iterable) {
        return vow.allResolved(iterable).then(function() {
            var isPromisesArray = isArray(iterable),
                keys = isPromisesArray?
                    getArrayKeys(iterable) :
                    getObjectKeys(iterable),
                rejectedPromises, fulfilledPromises,
                len = keys.length, i = 0, key, promise;

            if(!len) {
                return isPromisesArray? [] : {};
            }

            while(i < len) {
                key = keys[i++];
                promise = iterable[key];
                if(vow.isRejected(promise)) {
                    rejectedPromises || (rejectedPromises = isPromisesArray? [] : {});
                    isPromisesArray?
                        rejectedPromises.push(promise.valueOf()) :
                        rejectedPromises[key] = promise.valueOf();
                }
                else if(!rejectedPromises) {
                    (fulfilledPromises || (fulfilledPromises = isPromisesArray? [] : {}))[key] = vow.valueOf(promise);
                }
            }

            if(rejectedPromises) {
                throw rejectedPromises;
            }

            return fulfilledPromises;
        });
    },

    /**
     * Returns a promise to be fulfilled only when any of the items in `iterable` is fulfilled,
     * or to be rejected when all the items are rejected (with the reason of the first rejected item).
     *
     * @param {Array} iterable
     * @returns {vow:Promise}
     */
    any : function(iterable) {
        var defer = new Deferred(),
            len = iterable.length;

        if(!len) {
            defer.reject(Error());
            return defer.promise();
        }

        var i = 0, reason;
        vow._forEach(
            iterable,
            defer.resolve,
            function(e) {
                i || (reason = e);
                ++i === len && defer.reject(reason);
            },
            defer.notify,
            defer);

        return defer.promise();
    },

    /**
     * Returns a promise to be fulfilled only when any of the items in `iterable` is fulfilled,
     * or to be rejected when the first item is rejected.
     *
     * @param {Array} iterable
     * @returns {vow:Promise}
     */
    anyResolved : function(iterable) {
        var defer = new Deferred(),
            len = iterable.length;

        if(!len) {
            defer.reject(Error());
            return defer.promise();
        }

        vow._forEach(
            iterable,
            defer.resolve,
            defer.reject,
            defer.notify,
            defer);

        return defer.promise();
    },

    /**
     * Static equivalent to `promise.delay`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @param {Number} delay
     * @returns {vow:Promise}
     */
    delay : function(value, delay) {
        return vow.resolve(value).delay(delay);
    },

    /**
     * Static equivalent to `promise.timeout`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @param {Number} timeout
     * @returns {vow:Promise}
     */
    timeout : function(value, timeout) {
        return vow.resolve(value).timeout(timeout);
    },

    _forEach : function(promises, onFulfilled, onRejected, onProgress, ctx, keys) {
        var len = keys? keys.length : promises.length,
            i = 0;

        while(i < len) {
            vow.when(
                promises[keys? keys[i] : i],
                wrapOnFulfilled(onFulfilled, i),
                onRejected,
                onProgress,
                ctx);
            ++i;
        }
    },

    TimedOutError : defineCustomErrorType('TimedOut')
};

var defineAsGlobal = true;
if(typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = vow;
    defineAsGlobal = false;
}

if(typeof modules === 'object' && isFunction(modules.define)) {
    modules.define('vow', function(provide) {
        provide(vow);
    });
    defineAsGlobal = false;
}

if(typeof define === 'function') {
    define(function(require, exports, module) {
        module.exports = vow;
    });
    defineAsGlobal = false;
}

defineAsGlobal && (global.vow = vow);

})(this);

ns.vow = module.exports; ns.modules.define('vow', function (provide) { provide(ns.vow); }); })(ns);

ns.modules.define('cloud.Error', ['component.util'], function (provide, util) {
    var messages = {
            400: 'Bad Request',
            401: 'Not Authorized',
            403: 'Forbidden',
            404: 'Not Found',
            409: 'Conflict',
            410: 'Gone',
            421: 'Locked',
            423: 'Too Many Requests',
            500: 'Internal Server Error'
        };
        /**
         * @class Ошибка API Диска.
         * @augments Error
         * @param {Object} [parameters] Описание ошибки в виде JSON-объекта.
         * Все поля JSON-объекта будут скопированы в созданный экземпляр
         * ошибки.
         * @param {Integer} [parameters.code = 400] HTTP-код ошибки.
         * @param {String} [parameters.message] Сообщение об ошибке.
         * Если не передано, заполнится автоматически для стандартных
         * HTTP-ошибок.
         */
    var CloudError = function (parameters) {
            util.extend(this, {
                code: 400
            }, parameters);

            if (!this.message) {
                this.message = messages[this.code];
            }
        };

    util.defineClass(CloudError, Error, {
        toString: function () {
            return this.code + ' ' + this.message;
        }
    });

    provide(CloudError);
});
var Client = function () {
    this._initialized = false;
    this._key = null;
    this._token = null;
};

/**
 * Инициализирует сессию, авторизует пользователя.
 * @name cloud.client.initialize
 * @function
 * @param {Object} options Опции.
 * @param {String} [options.key] Публичный ключ приложения.
 * @param {String} [options.token] OAuth-токен. Если
 * не передан, будет показано окно с диалогом авторизации;
 * в этом случае параметр key обязателен.
 * @returns {vow.Promise} Объект-Promise, который будет либо подтверждён
 * при успешной аутентификации, либо отклонён в противном случае.
 * @static
 */
Client.prototype.initialize = function (options) {
    var deferred = ns.vow.defer();

    ns.modules.require([
        'cloud.dataSyncApi.config',
        'component.util',
        'cloud.Error',
        'vow',
        'global'
    ], (function (config, util, Error, vow, global) {
        if (!options) {
            deferred.reject(new Error({
                message: '`options` Parameter Required'
            }));
        } else if (!options.key && !options.token) {
            deferred.reject(new Error({
                message: 'Either `options.key` or `options.token` Parameter Required'
            }));
        } else {
            if (options.token) {
                this._token = options.token;
                deferred.resolve();
            } else {
                var oauthWindow = global.open(
                    config.oauthLoginPage.replace(/{{\s*key\s*}}/g, options.key),
                    'oauth',
                    config.oauthWindowParameters
                );

                if (oauthWindow) {
                    var intervalId = global.setInterval(function () {
                        if (oauthWindow.closed) {
                            global.clearInterval(intervalId);
                            deferred.reject(new Error({
                                code: 401
                            }));
                        } else {
                            try {
                                var match = oauthWindow.location.hash.match(/access_token=([0-9a-f]+)/);
                                if (match) {
                                    this._token = match[1];
                                    this._initialized = true;
                                    oauthWindow.close();
                                    global.clearInterval(intervalId);
                                    deferred.resolve(this._token);
                                }
                            } catch (e) {}
                        }
                    }.bind(this), 100);
                } else {
                    deferred.reject(new Error({
                        code: 401
                    }));
                }
            }
        }
    }).bind(this));

    return deferred.promise();
};

/**
 * @name cloud.client.isInitialized
 * @function
 * @returns {Boolean} true - сессия инициализирована, клиент
 * аутентифицирован, false в противном случае.
 * @static
 */
Client.prototype.isInitiaized = function () {
    return this._initialized;
};

/**
 * @name cloud.client.getToken
 * @function
 * @returns {String|null} OAuth-токен или null, если сессия
 * не была инициализирована.
 * @static
 */
Client.prototype.getToken = function () {
    return this._token;
};

ns.cloud.client = new Client();

ns.modules.define('cloud.client', [], function (provide) {
    /**
     * @class OAuth-клиент, позволяющий аутентифицировать пользователя.
     * @name cloud.client
     * @static
     */
    provide(ns.cloud.client);
});

/**
 * @class Основной неймпспейс для работы с Data API Диска.
 * @name cloud.dataSyncApi
 * @static
 * @noconstructor
 */
ns.cloud.dataSyncApi = /** @lends cloud.dataSyncApi.prototype */ {
    /**
     * Открывает указанную базу данных.
     * @static
     * @param {Object} options Опции.
     * @param {String} options.context Контекст. Может принимать значения
     * 'user' (общий контекст пользователя, доступный всем приложениям) или
     * 'app' (приватный контекст приложения).
     * @param {String} options.database_id Идентификатор базы данных.
     * @param {Boolean} [options.authorize_if_needed = true] Автоматически
     * авторизовать пользователя посредством вызова метода
     * {@link cloud.client.initialize}, если пользователь в момент вызова
     * функции не авторизован в Диске.
     * @param {String} [options.key] Ключ приложения для авторизации.
     * @param {String} [options.token] Token для авторизации.
     * @param {Boolean} [options.create_if_not_exists = true] true —
     * создать базу с указанным идентификатором, если она не существует,
     * false — не создавать.
     * @param {Boolean} [options.background_sync = true] true — автоматически
     * синхронизировать базу данных в фоновом режиме, false — не синхронизировать.
     * @returns {vow.Promise} Объект-Promise, который будет либо подтверждён экземпляром
     * класса {@link cloud.dataSyncApi.Database} при успешном открытии базы данных, либо отклонён
     * с одной из следующих ошибок:
     * <ul>
     *     <li>400 — запрос некорректен;</li>
     *     <li>401 — пользователь не авторизован;</li>
     *     <li>403 — доступ запрещён;</li>
     *     <li>404 — база данных не найдена;</li>
     *     <li>423 — ресурс доступен только для чтения;</li>
     *     <li>429 — превышен лимит количества запросов;</li>
     *     <li>500 — невозможно выполнить запрос.</li>
     * </ul>
     * @example
     * var success = console.log.bind(console, 'Success'),
     *     fail = console.error.bind(console);
     * // Пример 1. Создаём базу данных и кладём в неё пару записей.
     * ya.cloud.dataSyncApi.openDatabase({
     *     context: 'app',
     *     database_id: 'favorites',
     *     key: 'my_app_key'
     * }).then(function (db) {
     *     var transaction = db.createTransaction();
     *
     *     transaction.insertRecords([{
     *         collection_id: 'cities',
     *         record_id: '0',
     *         fields: {
     *             name: "Moscow",
     *             attractions: ["Kremlin", "Mausoleum"],
     *             visited: Date.now()
     *         }
     *     }, {
     *         collection_id: 'cities',
     *         record_id: '1',
     *         fields: {
     *             name: "Saint Petersburg",
     *             visited: new Date(2014, 01, 01)
     *         }
     *     }]);
     *
     *     transaction.push().then(success, fail);
     * }, fail);
     *
     * // Пример 2. Выводим список записей из базы.
     * ya.cloud.dataSyncApi.openDatabase({
     *     context: 'app',
     *     database_id: 'favorites',
     *     key: 'my_app_key'
     * }).then(function (db) {
     *     db.forEach(function (record) {
     *         console.log(record.getFieldValue('name'));
     *     });
     * }, fail);
     *
     * // Пример 3. Работа с конфликтами.
     * var transaction = db.createTransaction();
     *
     * // Найдём все города, посещённые в 2014 году
     * db.filter(function (record) {
     *     return record.getCollectionId() == 'cities' &amp;&amp;
     *            record.getFieldValue('visited').getFullYear() == '2014';
     * }, function (record) {
     *     // Добавим в список 'attractions' новый элемент
     *     transaction.insertRecordFieldListItem(record, {
     *         field_id: 'attractions',
     *         index: 0,
     *         value: 'Happy new year'
     *     });
     * });
     *
     * // При попытке применить эту транзакцию произойдёт
     * // ошибка: у второй записи нет поля 'attractions'
     * transaction.push().then(success, function (e) {
     *     // 409 Conflict
     *     console.log(e.toString());
     *     if (e.code == 409) {
     *         // Тип ошибки — неправильная операция над полями записи
     *         // с record_id == '1'
     *         var operations = transaction.getOperations(),
     *             conflict = e.conflicts[0].conflict,
     *             conflictedOperation = operations[e.conflicts[0].index];
     *
     *         console.log(
     *             conflict.getType(),
     *             conflictedOperation.getCollectionId(),
     *             conflictedOperation.getRecordId()
     *         );
     *
     *         // Ошибка при модификации поля attractions — у записи
     *         // с record_id == '1' такого поля не существует
     *         var fieldConflicts = conflict.getFieldChangeConflicts(),
     *             conflictedFieldOperation = fieldConflicts[0].conflict;
     *
     *         console.log(fieldConflicts[0].index);
     *         console.log(conflictedFieldOperation.getType());
     *
     *         // Создадим новую транзакцию, в которой сначала
     *         // инициализируем поле attractions у записи record_id = '1',
     *         // а потом выполним все те же операции.
     *         var correctedTransaction = db.createTransaction(),
     *             values = {};
     *
     *         values[conflictedFieldOperation.getFieldId()] = [];
     *
     *         // Сначала создадим операцию на добавление поля
     *         correctedTransaction.setRecordFields({
     *             collection_id: conflictedOperation.getCollectionId(),
     *             record_id: conflictedOperation.getRecordId()
     *         }, values);
     *
     *         // Теперь скопируем остальные операции
     *         correctedTransaction.addOperations(transaction.getOperations());
     *
     *         correctedTransaction.push().then(success, fail);
     *     }
     * });
     */
    openDatabase: function (options) {
        return this._require(['cloud.dataSyncApi.Database']).spread(function (Database) {
            return new Database(options);
        });
    },

    /**
     * Возвращает количество баз данных.
     * @param {Object|String} options Опции запроса в виде
     * JSON-объекта либо опция database_id.
     * @param {String} options.context Контекст. Может принимать значения
     * 'user' (общий контекст пользователя, доступный всем приложениям) или
     * 'app' (приватный контекст приложения).
     * @param {String} options.database_id Идентификатор базы данных.
     * @param {Boolean} [options.authorize_if_needed = true] Автоматически
     * авторизовать пользователя посредством вызова метода
     * {@link cloud.client.initialize}, если пользователь в момент вызова
     * функции не авторизован в Диске.
     * @param {String} [options.key] Ключ приложения для авторизации.
     * @param {String} [options.token] Token для авторизации.
     * @returns {vow.Promise} Объект-Promise, который будет либо подтверждён
     * числом баз данных, либо отклонён с одной из следующих ошибок:
     * <ul>
     *     <li>400 — запрос некорректен;</li>
     *     <li>401 — пользователь не авторизован;</li>
     *     <li>403 — доступ запрещён;</li>
     *     <li>429 — превышен лимит количества запросов;</li>
     *     <li>500 — невозможно выполнить запрос.</li>
     * </ul>
     * @static
     */
    getDatabaseCount: function (options) {
        return this._require(['component.util', 'cloud.dataSyncApi.http']).spread(function (util, http) {
            return http.getDatabases(util.extend({
                limit: 0,
                offset: 0
            }, options)).then(function (res) {
                return res.data.total;
            });
        });
    },

    /**
     * Возвращает метаданные конкретной БД.
     * @param {Object} options Опции запроса в виде
     * JSON-объекта.
     * @param {String} options.context Контекст. Может принимать значения
     * 'user' (общий контекст пользователя, доступный всем приложениям) или
     * 'app' (приватный контекст приложения).
     * @param {String} options.database_id Идентификатор базы данных.
     * @param {Boolean} [options.authorize_if_needed = true] Автоматически
     * авторизовать пользователя посредством вызова метода
     * {@link cloud.client.initialize}, если пользователь в момент вызова
     * функции не авторизован в Диске.
     * @param {String} [options.key] Ключ приложения для авторизации.
     * @param {String} [options.token] Token для авторизации.
     * @returns {vow.Promise} Объект-Promise, который будет либо подтверждён
     * метаданными БД, либо отклонён с ошибкой.
     * Метаданные БД представляют собой JSON-объект со следующими полями:
     * <ul>
     *     <li>database_id — идентификатор БД;</li>
     *     <li>revision — ревизия БД;</li>
     *     <li>title — заголовок БД;</li>
     *     <li>records_count — количество записей в БД;</li>
     *     <li>size — размер БД в байтах;</li>
     *     <li>created — timestamp создания БД;</li>
     *     <li>modified — timestamp последней модификации БД.</li>
     * </ul>
     * Возможные ошибки при выполнении операции:
     * <ul>
     *     <li>400 — запрос некорректен;</li>
     *     <li>401 — пользователь не авторизован;</li>
     *     <li>403 — доступ запрещён;</li>
     *     <li>429 — превышен лимит количества запросов;</li>
     *     <li>500 — невозможно выполнить запрос.</li>
     * </ul>
     * @static
     */
    getDatabaseMetadata: function (options) {
        if (!options || !options.database_id) {
            return this._fail('`options.database_id` Parameter Required');
        }

        var castMetadata = this._castMetadata.bind(this);
        return this._require(['cloud.dataSyncApi.http']).spread(function (http) {
            return http.getDatabases(options).then(function (res) {
                return castMetadata(res.data);
            });
        });
    },

    /**
     * Возвращает выборку метаданных БД по указанному диапазону порядковых номеров.
     * @param {Object} options Опции запроса в виде
     * JSON-объекта.
     * @param {String} options.context Контекст. Может принимать значения
     * 'user' (общий контекст пользователя, доступный всем приложениям) или
     * 'app' (приватный контекст приложения).
     * @param {Integer} options.offset Порядковый номер БД, с которого начинать
     * выборку.
     * @param {Integer} options.limit Количество БД в выборке
     * @param {Boolean} [options.authorize_if_needed = true] Автоматически
     * авторизовать пользователя посредством вызова метода
     * {@link cloud.client.initialize}, если пользователь в момент вызова
     * функции не авторизован в Диске.
     * @param {String} [options.key] Ключ приложения для авторизации.
     * @param {String} [options.token] Token для авторизации.
     * @returns {vow.Promise} Объект-Promise, который будет либо подтверждён
     * массивом метаданных БД, либо отклонён с одной из следующих ошибок:
     * <ul>
     *     <li>400 — запрос некорректен;</li>
     *     <li>401 — пользователь не авторизован;</li>
     *     <li>403 — доступ запрещён;</li>
     *     <li>429 — превышен лимит количества запросов;</li>
     *     <li>500 — невозможно выполнить запрос.</li>
     * </ul>
     * @see cloud.dataSyncApi.getDatabaseMetadata
     * @static
     */
    listDatabaseMetadata: function (options) {
        if (!options || typeof options.offset == 'undefined' || typeof options.limit == 'undefined') {
            return this._fail('`options.offset` and `options.limit` Parameters Required');
        }

        var castMetadata = this._castMetadata.bind(this);
        return this._require(['cloud.dataSyncApi.http']).spread(function (http) {
            return http.getDatabases(options).then(function (res) {
                return res.data.items.map(castMetadata);
            });
        });
    },

    /**
     * Создаёт новую базу данных.
     * @param {Object} options Опции запроса в виде
     * JSON-объекта.
     * @param {String} options.context Контекст. Может принимать значения
     * 'user' (общий контекст пользователя, доступный всем приложениям) или
     * 'app' (приватный контекст приложения).
     * @param {String} options.database_id Идентификатор создаваемой БД.
     * @param {Boolean} [options.authorize_if_needed = true] Автоматически
     * авторизовать пользователя посредством вызова метода
     * {@link cloud.client.initialize}, если пользователь в момент вызова
     * функции не авторизован в Диске.
     * @param {String} [options.key] Ключ приложения для авторизации.
     * @param {String} [options.token] Token для авторизации.
     * @param {Boolean} [options.ignore_existing = false] true — не генерировать
     * исключение, если база данных с таким идентфикатором уже существует, false —
     * сгенерировать исключение с кодом 409.
     * @returns {vow.Promise} Объект-Promise, который будет либо подтверждён
     * ревизией созданной БД, либо отклонён с одной из следующих ошибок:
     * <ul>
     *     <li>400 — запрос некорректен;</li>
     *     <li>401 — пользователь не авторизован;</li>
     *     <li>403 — доступ запрещён;</li>
     *     <li>423 — ресурс доступен только для чтения;</li>
     *     <li>429 — превышен лимит количества запросов;</li>
     *     <li>500 — невозможно выполнить запрос.</li>
     * </ul>
     * @see cloud.dataSyncApi.getDatabaseMetadata
     * @static
     */
    createDatabase: function (options) {
        var fail = this._fail.bind(this);

        return this._require(['cloud.dataSyncApi.http']).spread(function (http) {
            return http.putDatabase(options).then(function (res) {
                if (options && !options.ignore_existing && res.code == 200) {
                    return fail(
                        409,
                        'Database "' + options.database_id + '" Already Exists'
                    );
                }
                return Number(res.headers.etag);
            }, this);
        });
    },

    /**
     * Удаляет существующую базу данных.
     * @param {Object} options Опции запроса в виде
     * JSON-объекта.
     * @param {String} options.context Контекст. Может принимать значения
     * 'user' (общий контекст пользователя, доступный всем приложениям) или
     * 'app' (приватный контекст приложения).
     * @param {String} options.database_id Идентификатор удаляемой БД.
     * @param {Boolean} [options.authorize_if_needed = true] Автоматически
     * авторизовать пользователя посредством вызова метода
     * {@link cloud.client.initialize}, если пользователь в момент вызова
     * функции не авторизован в Диске.
     * @param {String} [options.key] Ключ приложения для авторизации.
     * @param {String} [options.token] Token для авторизации.
     * @returns {vow.Promise} Объект-Promise, который будет либо подтверждён
     * массивом метаданных созданной БД, либо отклонён с одной из следующих ошибок:
     * <ul>
     *     <li>400 — запрос некорректен;</li>
     *     <li>401 — пользователь не авторизован;</li>
     *     <li>403 — доступ запрещён;</li>
     *     <li>404 — ресурс не найден;</li>
     *     <li>423 — ресурс доступен только для чтения;</li>
     *     <li>429 — превышен лимит количества запросов;</li>
     *     <li>500 — невозможно выполнить запрос.</li>
     * </ul>
     * @see cloud.dataSyncApi.getDatabaseMetadata
     * @static
     */
    deleteDatabase: function (options) {
        return this._require(['cloud.dataSyncApi.http']).spread(function (http) {
            return http.deleteDatabase(options).then(function () {
                return null;
            });
        });
    },

    _require: function (modules) {
        var deferred = ns.vow.defer();

        ns.modules.require(modules, function () {
            deferred.resolve([].slice.call(arguments));
        });

        return deferred.promise();
    },

    _castMetadata: function (data) {
        return {
            database_id: data.database_id,
            revision: data.revision,
            title: data.title,
            created: new Date(data.created),
            modified: new Date(data.modified),
            records_count: data.records_count,
            size: data.size
        };
    },

    _fail: function (code, message) {
        if (!message) {
            message = code;
            code = 400;
        }

        var deferred = ns.vow.defer();

        ns.modules.require(['cloud.Error'], function (Error) {
            deferred.reject(new Error({
                code: code,
                message: message
            }));
        });

        return deferred.promise();
    }
};

ns.modules.define('cloud.dataSyncApi', [], function (provide) {
    provide(ns.cloud.dataSyncApi);
});

ns.modules.define('component.util', function (provide) {
    var util = {
            /**
             * @ignore
             * Базовая функция, реализующая наследование в JavaScript.
             * Реализует наследование прототипа без исполнения конструктора родителя.
             *
             * К дочернему классу добавляется поле 'superclass', указывающее на
             * прототип родительского класса, и поле 'constructor', которое указывает на конструктор класса.
             * Через поле 'constructor' объекта 'superclass' можно обратится к конструктору родительского класса.
             * @name component.util.augment
             * @function
             * @static
             * @param {Function} ChildClass Дочерний класс.
             * @param {Function} ParentClass Родительский класс.
             * @param {Object} override Набор дополнительных полей и функций,
             * которые будут приписаны к прототипу дочернего класса.
             * @returns {Object} Прототип дочернего класса.
             * @example
             *
             * // Родительский класс
             * var ParentClass = function (param1, param2) {
             *     this.param1 = param1;
             *     this.param2 = param2;
             * };
             *
             * ParentClass.prototype = {
             *     foo: function () {
             *         alert('Parent!');
             *     }
             * };
             * // Дочерний класс
             * var ChildClass = function (param1, param2, param3) {
             *     // Вызываем конструктор родителя
             *     ChildClass.superclass.constructor.call(this, param1, param2);
             *     this._param3 = param3;
             * }
             *
             * // наследуем ChildClass от ParentClass
             * augment(ChildClass, ParentClass, {
             *     // переопределяем в наследнике метод foo
             *     foo: function () {
             *         // Вызываем метод родительского класса
             *         ChildClass.superclass.foo.call(this);
             *         alert('Child!');
             *     }
             * });
             */
            augment: function (ChildClass, ParentClass, override) {
                ChildClass.prototype = (Object.create || function (obj) {
                    function F () {
                    }

                    F.prototype = obj;
                    return new F();
                })(ParentClass.prototype);

                ChildClass.prototype.constructor = ChildClass;
                ChildClass.superclass = ParentClass.prototype;
                ChildClass.superclass.constructor = ParentClass;

                if (override) {
                    util.extend(ChildClass.prototype, override);
                }
                return ChildClass.prototype;
            },
            /**
             * @ignore
             * Функция, копирующая свойства из одного или нескольких
             * JavaScript-объектов в другой JavaScript-объект.
             * @param {Object} target Целевой JavaScript-объект. Будет модифицирован
             * в результате работы функции.
             * @param {Object} source JavaScript-объект - источник. Все его свойства
             * будут скопированы. Источников может быть несколько (функция может иметь
             * произвольное число параметров), данные копируются справа налево (последний
             * аргумент имеет наивысший приоритет при копировании).
             * @name component.util.extend
             * @function
             * @static
             *
             * @example
             * var options = extend({
             *      prop1: 'a',
             *      prop2: 'b'
             * }, {
             *      prop2: 'c',
             *      prop3: 'd'
             * }, {
             *      prop3: 'e'
             * });
             * // Получим в итоге: {
             * //     prop1: 'a',
             * //     prop2: 'c',
             * //     prop3: 'e'
             * // }
             */
            extend: function (target) {
                for (var i = 1, l = arguments.length; i < l; i++) {
                    var arg = arguments[i];
                    if (arg) {
                        var keys = Object.keys(arg);
                        for (var j = 0, k = keys.length; j < k; j++) {
                            target[keys[j]] = arg[keys[j]];
                        }
                    }
                }
                return target;
            },
            /**
             * @ignore
             * <p>Базовая функция, реализующая объявление классов.
             * При помощи этой функции можно объявить новый класс, указать у этого класса набор методов и
             * произвести наследование от другого класса.</p>
             * <p>К дочернему классу приписывается поле superclass, указывающее на
             * прототип родительского класса.
             * Через поле 'constructor' объекта 'superclass' можно обратится
             * к конструктору родительского класса.</p>
             * @name component.util.defineClass
             * @function
             * @static
             * @param {Function} constructor Конструктор класса.
             * @param {Function} [parentClass] Родительский класс,
             * от которого необходимо произвести наследование. Этот аргумент может быть пропущен.
             * @param {Object} [override] Набор дополнительных полей и функций,
             * которые будут приписаны к прототипу класса. Источников может быть несколько (функция может иметь
             * произвольное число параметров), данные копируются справа налево (последний
             * аргумент имеет наивысший приоритет при копировании).
             * @returns {Function} Класс.
             */
            defineClass: function (constructor) {
                var argIndex = 1,
                    baseConstructor = typeof arguments[argIndex] == "function" ? arguments[argIndex++] : null;

                if (baseConstructor) {
                    util.augment(constructor, baseConstructor);
                }

                var argLength = arguments.length;
                while (argIndex < argLength) {
                    util.extend(constructor.prototype, arguments[argIndex++]);
                }

                return constructor;
            }
        };

    provide(util);
});
ns.modules.define('cloud.dataSyncApi.Conflict', [
    'component.util'
], function (provide, util) {
    /**
     * @class Описание конфликта, который может произойти
     * при попытке применить некорректную транзакцию.
     * @name cloud.dataSyncApi.Conflict
     * @noconstructor
     */
    var Conflict = function (properties) {
            this._type = properties.type;
            this._fieldChangeConflicts = properties.field_change_conflicts;
        };

    util.defineClass(Conflict, /** @lends cloud.dataSyncApi.Conflict.prototype */ {
        /**
         * <p>Возвращает тип конфликта. Допустимые значения:</p>
         * <ul>
         *     <li>record_already_exists — возникает при попытке
         * создать запись с идентификатором, который уже есть в указанной
         * коллекции;</li>
         *     <li>delete_non_existent_record — возникает при попытке
         * удалить несуществующую запись;</li>
         *     <li>update_non_existent_record — возникает при попытке
         * изменить несуществующую запись;</li>
         *     <li>both_modified — возникает в ситуации, когда
         * запись была изменена на удалённом сервере;</li>
         *     <li>invalid_field_change — возникает при попытке выполнения
         * некорректной операции над отдельным полем записи.</li>
         * </ul>
         * @returns {String} Тип конфликта.
         */
        getType: function () {
            return this._type;
        },

        /**
         * Для конфликтов типа invalid_field_change возвращает детализацию
         * конфликта: какая из операций над полями приводит к ошибке.
         * @returns {Object[]} Конфликты при изменении полей записи
         * в виде массива json-объектов с полями index (индекс операции)
         * и type (тип конфликта).
         */
        getFieldChangeConflicts: function () {
            return this._fieldChangeConflicts;
        }
    });

    provide(Conflict);
});
ns.modules.define('component.xhr', [
    'global',
    'vow',
    'cloud.Error'
], function (provide, global, vow, Error) {
    var XMLHttpRequest = global.XDomainRequest || global.XMLHttpRequest,
        parseHeaders = function (headers) {
            return headers.split('\u000d\u000a').reduce(function (result, line) {
                var parts = line.split('\u003a\u0020');
                if (parts.length == 2) {
                    result[parts[0].toLowerCase()] = parts[1].trim();
                }
                return result;
            }, {});
        };
    /**
     * @ignore
     * Шлёт запрос посредством кросс-доменного XMLHttpRequest.
     * @name component.util.xhr
     * @function
     * @statuc
     * @param {String} baseUrl Базовый URL
     * @param {Object} [options] Опции.
     * @param {String} [options.method = 'GET'] HTTP-метод.
     * @param {Object} [options.queryParams] Дополнительные query-параметры.
     * @param {Object} [options.data] Данные.
     * @param {Object} [options.headers] Дополнительные заголовки.
     * @param {Boolean} [options.parse = false] true — автоматически
     * применить JSON.parse к ответу сервера, false - не применять.
     * @param {Boolean} [options.parseResponseHeaders = true] true —
     * автоматически разобрать заголовки ответа и сформировать JSON-объект,
     * false — оставить строкой.
     * @param {Number} [options.timeout = 30000] Время ожидания ответа, в мс.
     * @returns {vow.Promise} Объект-Promise, который будет либо подтверждён
     * полученными данными, либо отклонён с ошибкой.
     */
    provide(function (baseUrl, options) {
        options = options || {};
        if (options.queryParams) {
            baseUrl += (baseUrl.indexOf('?') == -1 ? '?' : '&') +
                Object.keys(options.queryParams).map(function (key) {
                    return key + '=' + global.encodeURIComponent(options.queryParams[key]);
                }).join('&');
        }

        var deferred = vow.defer(),
            xhr = new XMLHttpRequest(),
            headers = options.headers || {},
            method = options.method || 'GET';

        if (method != 'GET' && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
        if (!headers['X-Requested-With']) {
            headers['X-Requested-With'] = 'XMLHttpRequest';
        }

        xhr.onload = function () {
            var result = {
                    code: this.status,
                    data: this.responseText,
                    headers: typeof options.parseResponseHeaders != 'undefined' && !options.parseResponseHeaders ?
                        this.getAllResponseHeaders() :
                        parseHeaders(this.getAllResponseHeaders())
                };

            if (options.parse) {
                try {
                    result.data = JSON.parse(result.data);
                } catch (e) {
                    deferred.reject(new Error({
                        message: 'JSON Parse Error ' + result.data
                    }));
                }
            }
            deferred.resolve(result);
        };

        xhr.onerror = function () {
            deferred.reject(new Error({
                code: 500
            }));
        };

        xhr.open(method, baseUrl, true);
        Object.keys(headers).forEach(function (key) {
            xhr.setRequestHeader(key, headers[key]);
        });
        xhr.send(typeof options.data != 'undefined' ?
            (typeof options.data == 'string' ?
                options.data :
                JSON.stringify(options.data)) :
            undefined);

        return deferred.promise().timeout(options.timeout || 30000).fail(function (e) {
            if (e instanceof vow.TimedOutError) {
                throw new Error({
                    code: 500,
                    message: 'Timeout Exceeded'
                });
            } else {
                throw e;
            }
        });
    });
});
ns.modules.define('cloud.dataSyncApi.Database', [
    'cloud.dataSyncApi.config',
    'cloud.dataSyncApi.http',
    'cloud.client',
    'cloud.dataSyncApi.Dataset',
    'cloud.dataSyncApi.Transaction',
    'cloud.dataSyncApi.Operation',
    'cloud.dataSyncApi.politics',
    'cloud.Error',
    'component.util',
    'vow'
], function (provide,
             config, http, client,
             Dataset, Transaction, Operation, politics,
             Error, util, vow) {
        /**
         * @class Класс, представляющий методы для работы с базой данных.
         * Возвращается функцией {@link cloud.dataSyncApi.openDatabase}.
         * @see cloud.dataSyncApi.openDatabase
         * @name cloud.dataSyncApi.Database
         * @noconstructor
         */
    var Database = function (options) {
            var deferred = vow.defer(),
                fail = deferred.reject.bind(deferred);

            this._id = options.database_id;
            this._context = options.context;
            this._token = options.token;
            this._locked = true;
            this._gone = null;
            this._dataset = null;
            this._pendingCallbacks = [];
            this._postDeltaFail = null;
            this._possiblyMissedDelta = null;

            this._listeners = {
                update: []
            };

            http.putDatabase(options).then(function (res) {
                if (res.code != 200 && res.code != 201) {
                    fail(new Error({
                        code: res.code
                    }));
                } else {
                    http.getSnapshot(options).then(function (res) {
                        if (res.code == 200) {
                            this._dataset = Dataset.json.deserialize(res.data);
                            this._locked = false;
                            deferred.resolve(this);
                        } else {
                            fail(new Error({
                                code: res.code
                            }));
                        }
                    }, fail, this);
                }
            }, fail, this);

            return deferred.promise();
        };

    /**
     * Событие обновления базы данных.
     * @name cloud.dataSyncApi.Database.update
     * @event
     */

    /**
     * @class Итератор по записям в БД.
     * @name cloud.dataSyncApi.Iterator
     * @noconstructor
     */
    /**
     * @name cloud.dataSyncApi.Iterator.next
     * @returns {Object} Следующая запись в БД в виде JSON-объекта с полями
     * value — экземпляр {@link cloud.dataSyncApi.Record} — и флага done, содержащего
     * true в случае завершения обхода БД.
     * @function
     */

    util.defineClass(Database, /** @lends cloud.dataSyncApi.Database.prototype */ {
        /**
         * Подписывается на событие.
         * @param {String} type Тип события.
         * @param {Function} callback Функция-обработчик.
         * @returns {cloud.dataSyncApi.Database} Ссылку на себя.
         */
        on: function (type, callback) {
            if (typeof this._listeners[type] == 'undefined') {
                throw new Error({
                    message: 'Event `' + type + '` is not supported'
                });
            }

            if (typeof callback != 'function') {
                throw new Error({
                    message: '`callback` parameter must be a function'
                });
            }

            this._listeners[type].push(callback);

            return this;
        },

        /**
         * Отписывается от события.
         * @param {String} type Тип события.
         * @param {Function} callback Функция-обработчик.
         * @returns {cloud.dataSyncApi.Database} Ссылку на себя.
         */
        off: function (type, callback) {
            if (typeof this._listeners[type] == 'undefined') {
                throw new Error({
                    message: 'Event `' + type + '` is not supported'
                });
            }

            var position = this._listeners[type].indexOf(callback);

            if (position == -1) {
                throw new Error({
                    code: 404,
                    message: 'Callback not found'
                });
            }

            this._listeners[type].splice(position, 1);

            return this;
        },

        _notify: function (type, data) {
            var callbacks = (this._listeners[type] || []).slice();
            callbacks.forEach(function (callback) {
                callback(data);
            });
        },

        /**
         * Синхронизирует БД с удалённым сервером.
         * @returns {vow.Promise} Объект-Promise, который будет либо подтверждён
         * новой ревизией БД, либо отклонён с одной из следующих ошибок:
         * <ul>
         *     <li>401 — пользователь не авторизован;</li>
         *     <li>403 — доступ запрещён;</li>
         *     <li>404 — база данных была удалена с удалённого сервера;</li>
         *     <li>410 — база устарела, требуется открыть её снова;</li>
         *     <li>429 — превышен лимит количества запросов;</li>
         *     <li>500 — невозможно выполнить запрос.</li>
         * </ul>
         */
        update: function () {
            return this._executeExclusiveTask(this._explicitUpdate.bind(this));
        },

        _explicitUpdate: function () {
            return this._applyDeltas().then(function (revision) {
                return revision;
            }, function (e) {
                if (e.code == 410) {
                    this._gone = vow.reject({
                        code: 410,
                        message: 'Database snapshot outdated'
                    });
                }
                throw e;
            }, this);
        },

        _applyDeltas: function () {
            var deferred = vow.defer(),
                deltas = [],
                id = this._id,
                context = this._context,
                token = this._token,
                dataset = this._dataset,

                notify = this._notify.bind(this),

                getDeltas = function (revision, checkFailedDelta) {
                    http.getDeltas({
                        database_id: id,
                        base_revision: revision,
                        context: context,
                        token: token,
                        limit: config.deltaLimit
                    }).then(function (res) {
                        if (res.code == 200) {
                            deltas.push(res.data.items);
                            var lastRevision = res.data.items.length ?
                                    res.data.items[res.data.items.length - 1].revision :
                                    res.data.revision;

                            if (lastRevision == res.data.revision) {
                                deltas = [].concat.apply([], deltas);
                                if (deltas.length) {
                                    dataset.applyDeltas(deltas);
                                    checkFailedDelta(deltas[deltas.length - 1].delta_id);
                                }
                                deferred.resolve(dataset.getRevision());
                                notify('update', dataset.getRevision());
                            } else {
                                getDeltas(lastRevision, checkFailedDelta);
                            }
                        } else {
                            deferred.reject(new Error({
                                code: res.code
                            }));
                        }
                    }, function (e) {
                        deferred.reject(e);
                    });
                };

            getDeltas(this._dataset.getRevision(), (function (lastDeltaId) {
                if (this._postDeltaFail && lastDeltaId && this._postDeltaFail == lastDeltaId) {
                    this._postDeltaFail = null;
                    this._possiblyMissedDelta = lastDeltaId;
                }
            }).bind(this));

            return deferred.promise();
        },

        _executeExclusiveTask: function (callback) {
            var deferred = vow.defer();

            this._pendingCallbacks.push([callback, deferred]);
            if (!this._locked) {
                this._proceedPendingQueue();
            }

            return deferred.promise();
        },

        _proceedPendingQueue: function () {
            var parameters = this._pendingCallbacks.shift(),
                callback = parameters[0],
                deferred = parameters[1];

            this._locked = true;

            if (!this._gone) {
                callback().then(function (res) {
                    deferred.resolve(res);
                    this._locked = false;
                    if (this._pendingCallbacks.length) {
                        this._proceedPendingQueue();
                    }
                }, function (e) {
                    deferred.reject(e);
                    this._locked = false;
                    if (this._pendingCallbacks.length) {
                        this._proceedPendingQueue();
                    }
                }, this);
            } else {
                deferred.resolve(this._gone);
            }
        },

        /**
         * @returns {Integer} Текущую (получшенную при последнем обновлении)
         * версию БД.
         */
        getRevision: function () {
            return this._dataset.getRevision();
        },

        /**
         * @returns {String} Идентификатор БД.
         */
        getDatabaseId: function () {
            return this._id;
        },

        /**
         * Создаёт транзакцию для последующего применения к БД.
         * @returns {cloud.dataSyncApi.Transaction} Транзакцию.
         */
        createTransaction: function () {
            return new Transaction(
                this,
                (function (parameters, politics) {
                    return this._executeExclusiveTask(this._patch.bind(this, parameters, politics));
                }).bind(this)
            );
        },

        _patch: function (parameters, politicsKey) {
            var deferred = vow.defer(),
                dataset = this._dataset,
                delta_id = parameters.delta_id,

                success = function () {
                    deferred.resolve(dataset.getRevision());
                },

                fail = (function (e) {
                    if (e.postDeltaFail) {
                        this._postDeltaFail = e.postDeltaFail;
                    }

                    deferred.reject(e);
                }).bind(this);

            if (this._possiblyMissedDelta && parameters.delta_id == this._possiblyMissedDelta) {
                this._possiblyMissedDelta = null;
                success();
            } else {
                var preparedOperation = prepareOperation(this._dataset, parameters, politicsKey),
                    operations = preparedOperation.operations,
                    conflicts = preparedOperation.conflicts,
                    delta = {
                        base_revision: this.getRevision(),
                        delta_id: parameters.delta_id,
                        changes: operations.map(Operation.json.serialize)
                    };

                if (conflicts.length) {
                    fail(new Error({
                        code: 409,
                        conflicts: conflicts
                    }));
                } else {
                    if (operations.length) {
                        this._postDeltas({
                            database_id: this._id,
                            delta_id: delta_id,
                            base_revision: this.getRevision(),
                            context: this._context,
                            token: this._token,
                            data: delta
                        }).then(
                            function (revision) {
                                delta.revision = revision;
                                dataset.applyDeltas([ delta ]);
                                success();
                                this._notify('update', revision);
                            }, function (e) {
                                if (e.code == 409) {
                                    this._explicitUpdate().then(
                                        function () {
                                            this._patch(parameters, politicsKey).then(success, fail);
                                        },
                                        fail,
                                        this
                                    );
                                } else {
                                    fail(e);
                                }
                            },
                            this
                        );
                    } else {
                        success();
                    }
                }
            }

            return deferred.promise();
        },

        _postDeltas: function (delta) {
            var deferred = vow.defer(),
                fail = function (e) {
                    deferred.reject(e);
                };

            http.postDeltas(delta).then(function (res) {
                if (res.code == 200 || res.code == 201) {
                    deferred.resolve(Number(res.headers.etag));
                } else {
                    if (res.code >= 500) {
                        res.postDeltaFail = delta.delta_id;
                    }
                    fail(new Error(res));
                }
            }, function (e) {
                e.postDeltaFail = delta.delta_id;
                fail(e);
            }, this);

            return deferred.promise();
        },

        /**
         * @param {String} collection_id Идентификатор коллекции.
         * @param {String} record_id Идентификатор записи.
         * @returns {cloud.dataSyncApi.Record} Запись.
         */
        getRecord: function (collection_id, record_id) {
            return this._dataset.getRecord(collection_id, record_id);
        },

        /**
         * @returns {Integer} Число записей в базе.
         */
        getRecordsCount: function () {
            return this._dataset.getLength();
        },

        /**
         * @param {String} [collection_id] Фильтр по идентификатору коллекции.
         * @returns {cloud.dataSyncApi.Iterator} Возвращает итератор по записям в БД.
         */
        iterator: function (collection_id) {
            return this._dataset.iterator(collection_id);
        },

        /**
         * Перебирает все записи в БД.
         * @param {String} [collection_id] Фильтр по коллекции.
         * @param {Function} callback Функция-обработчик.
         * @param {Object} [context] Контекст вызова функции-обработчика.
         * @returns {cloud.dataSyncApi.Database} Ссылку на себя.
         */
        forEach: function (collection_id, callback, context) {
            if (typeof collection_id != 'string') {
                context = callback;
                callback = collection_id;
                collection_id = null;
            }

            var it = this._dataset.iterator(collection_id),
                item = it.next(),
                index = 0;

            while (!item.done) {
                callback.call(context || null, item.value, index++);
                item = it.next();
            }
        },

        /**
         * Перебирает все записи в БД, отвечающие заданному условию.
         * @param {Function} filterFunction Функция, фильтрующая записи.
         * @param {Function} callback Функция-обработчик.
         * @param {Object} [context] Контекст вызова функции-обработчика.
         * @returns {cloud.dataSyncApi.Database} Ссылку на себя.
         */
        filter: function (filterFunction, callback, context) {
            this.forEach(function (value, index) {
                if (filterFunction(value, index)) {
                    callback.call(context || null, value, index);
                }
            });
        }
    });

    function prepareOperation (dataset, parameters, politicsKey) {
        var operations = parameters.operations,
            conflicts = dataset.dryRun(parameters.base_revision, operations);

        if (conflicts.length && politicsKey) {
            operations = politics[politicsKey](operations, conflicts);
            conflicts = dataset.dryRun(parameters.base_revision, operations);
        }

        return {
            operations: operations,
            conflicts: conflicts
        };
    }

    provide(Database);
});

ns.modules.define('cloud.dataSyncApi.Dataset', [
    'cloud.dataSyncApi.Record',
    'cloud.dataSyncApi.Operation',
    'cloud.dataSyncApi.FieldOperation',
    'cloud.dataSyncApi.Conflict',
    'cloud.Error',
    'component.util'
], function (provide, Record, Operation, FieldOperation, Conflict, Error, util) {
    var Dataset = function (revision, records) {
            var index = this._index = {};
            this._revision = Number(revision);
            this._revisionHistory = [];
            this._records = records.map(function (record) {
                if (!(record instanceof Record)) {
                    record = new Record(record);
                }
                var collection_id = record.getCollectionId(),
                    record_id = record.getRecordId();
                if (!index[collection_id]) {
                    index[collection_id] = {};
                }
                if (index[collection_id][record_id]) {
                    throw new Error ({
                        message: 'Record with `collection_id` and `record_id` provided already exists',
                        collection_id: collection_id,
                        record_id: record_id
                    });
                } else {
                    index[collection_id][record_id] = record;
                }
                return record;
            });
        };

    Dataset.json = {
        deserialize: function (json) {
            return new Dataset(
                json.revision,
                json.records.items.map(function (item) {
                    return Record.json.deserialize(item);
                })
            );
        }
    };

    util.defineClass(Dataset, {
        getRecord: function (collection_id, record_id) {
            if (!collection_id) {
                throw new Error({
                    message: '`collection_id` Parameter Required'
                });
            }
            if (!record_id) {
                throw new Error({
                    message: '`record_id` Parameter Required'
                });
            }
            return this._index[collection_id] && this._index[collection_id][record_id];
        },

        getRevision: function () {
            return this._revision;
        },

        getLength: function () {
            return this._records.length;
        },

        iterator: function (collection_id) {
            var counter = -1,
                records = this._records;
            return {
                next: function () {
                    if (collection_id) {
                        do {
                            counter++;
                        } while (counter < records.length && records[counter].getCollectionId() != collection_id);
                    } else {
                        counter++;
                    }
                    if (counter < records.length) {
                        return {
                            value: records[counter]
                        };
                    }
                    return {
                        done: true
                    };
                }
            };
        },

        applyDeltas: function (deltas) {
            var index = this._index,
                revisionHistory = this._revisionHistory,
                revision = this._revision;

            deltas.forEach(function (delta) {
                var alteredRecords = {};

                if (delta.base_revision != revision) {
                    throw new Error({
                        message: 'Incorrect delta base_revision'
                    });
                }

                delta.changes.forEach(function (change) {
                    var collection_id = change.collection_id,
                        record_id = change.record_id;

                    if (!alteredRecords[collection_id]) {
                        alteredRecords[collection_id] = {};
                    }
                    alteredRecords[collection_id][record_id] = true;

                    switch (change.change_type) {
                        case 'insert':
                        case 'set':
                            if (!index[collection_id]) {
                                index[collection_id] = {};
                            }
                            index[collection_id][record_id] = Record.json.deserialize(change, true);
                            break;
                        case 'delete':
                            delete index[collection_id][record_id];
                            break;
                        case 'update':
                            var record = index[collection_id][record_id];
                            change.changes.forEach(function (fieldChange) {
                                record.applyFieldOperation(FieldOperation.json.deserialize(fieldChange));
                            });
                            break;
                    }
                });

                revisionHistory.push({
                    base_revision: delta.base_revision,
                    revision: delta.revision,
                    alteredRecords: alteredRecords
                });

                revision = delta.revision;
            });

            var records = this._records = [];
            Object.keys(index).forEach(function (collection_id) {
                Object.keys(index[collection_id]).forEach(function (record_id) {
                    records.push(index[collection_id][record_id]);
                });
            });
            this._revision = revision;
        },

        ifModifiedSince: function (options) {
            var collection_id = options.collection_id,
                record_id = options.record_id,
                revision = options.revision;

            for (var i = 0, after = false; i < this._revisionHistory.length; i++) {
                var item = this._revisionHistory[i];

                if (item.base_revision == revision) {
                        after = true;
                }
                if (after && item.alteredRecords[collection_id] && item.alteredRecords[collection_id][record_id]) {
                    return true;
                }
            }

            return false;
        },

        dryRun: function (revision, operations) {
            var conflicts = [],
                index = copyIndex(this._index),
                originalIndex = this._index;

            operations.forEach(function (operation, i) {
                var collection_id = operation.getCollectionId(),
                    record_id = operation.getRecordId();

                if (this.ifModifiedSince({
                    collection_id: collection_id,
                    record_id: record_id,
                    revision: revision
                })) {
                    conflicts.push({
                        index: i,
                        conflict: new Conflict({
                            type: 'both_modified',
                            operation: operation
                        })
                    });
                } else {
                    switch (operation.getType()) {
                        case 'insert':
                            if (index[collection_id] && index[collection_id][record_id]) {
                                conflicts.push({
                                    index: i,
                                    conflict: new Conflict({
                                        type: 'record_already_exists',
                                        operation: operation
                                    })
                                });
                            } else {
                                if (!index[collection_id]) {
                                    index[collection_id] = {};
                                }
                                index[collection_id][record_id] = Record.json.deserialize(
                                    Operation.json.serialize(operation), true
                                );
                            }
                            break;
                        case 'set':
                            if (!index[collection_id]) {
                                index[collection_id] = {};
                            }
                            index[collection_id][record_id] = Record.json.deserialize(
                                Operation.json.serialize(operation), true
                            );
                            break;
                        case 'delete':
                            if (!index[collection_id] || !index[collection_id][record_id]) {
                                conflicts.push({
                                    index: i,
                                    conflict: new Conflict({
                                        type: 'delete_non_existent_record',
                                        operation: operation
                                    })
                                });
                            } else {
                                delete index[collection_id][record_id];
                            }
                            break;
                        case 'update':
                            if (!index[collection_id] || !index[collection_id][record_id]) {
                                conflicts.push({
                                    index: i,
                                    conflict: new Conflict({
                                        type: 'update_non_existent_record',
                                        operation: operation
                                    })
                                });
                            } else {
                                var record = index[collection_id][record_id],
                                    fieldChangeConflicts = [];

                                if (record === true) {
                                    record = originalIndex[collection_id][record_id].copy();
                                }

                                operation.getFieldOperations().forEach(function (fieldOperation, index) {
                                    var error = record.dryRun(fieldOperation);
                                    if (error) {
                                        fieldChangeConflicts.push({
                                            type: error,
                                            index: index
                                        });
                                    } else {
                                        record.applyFieldOperation(fieldOperation);
                                    }
                                });

                                if (fieldChangeConflicts.length) {
                                    conflicts.push({
                                        index: i,
                                        conflict: new Conflict({
                                            type: 'invalid_field_change',
                                            operation: operation,
                                            field_change_conflicts: fieldChangeConflicts
                                        })
                                    });
                                } else {
                                    index[collection_id][record_id] = record;
                                }
                            }
                            break;
                    }
                }
            }, this);

            return conflicts;
        }
    });

    function copyIndex (index) {
        return Object.keys(index).reduce(function (copy, collection_id) {
            copy[collection_id] = Object.keys(index[collection_id]).reduce(function (collection, record_id) {
                collection[record_id] = true;
                return collection;
            }, {});
            return copy;
        }, {});
    }

    provide(Dataset);
});
ns.modules.define('cloud.dataSyncApi.FieldOperation', [
    'component.util',
    'cloud.dataSyncApi.Value'
], function (provide, util, Value) {
    /**
     * @class Операция над полями отдельной записи БД.
     * @name cloud.dataSyncApi.FieldOperation
     * @param {Object} properties Параметры операции.
     * @param {String} properties.type <p>Тип операции. Возможны следующие значения:</p>
     * <ul>
     *     <li>set — изменение значения поля;</li>
     *     <li>delete — удаление поля;</li>
     *     <li>list_item_set — изменение значения элемента списка;</li>
     *     <li>list_item_move — перемещение элемента в списке;</li>
     *     <li>list_item_delete — удаление элемента в списке;</li>
     *     <li>list_item_insert — вставка элемента в список.</li>
     * </ul>
     * @param {String} properties.field_id Имя поля.
     * @param {*|cloud.dataSyncApi.Value} [properties.value] Новое значение
     * поля или элемента списка для операций set, list_item_set, list_item_insert.
     * Задаётся в виде экземпляра класса {@link cloud.dataSyncApi.Value}
     * либо любым объектом, приводимым к нему.
     * @param {Integer} [properties.index] Индекс элемента списка, к которому
     * применяется операция, для операций list_item_set, list_item_insert,
     * list_item_delete, list_item_move.
     * @param {Integer} [properties.new_index] Новый индекс для операции list_item_move.
     */
    var FieldOperation = function (properties) {
        this._type = properties.type;
        this._fieldId = properties.field_id;
        if (['set', 'list_item_set', 'list_item_insert'].indexOf(this._type) != -1) {
            this._value = properties.value instanceof Value ?
                properties.value :
                new Value(properties.value);
        } else {
            this._value = null;
        }
        if (['list_item_set', 'list_item_delete', 'list_item_insert', 'list_item_move'].indexOf(this._type) != -1) {
            this._index = Math.floor(properties.index);
        } else {
            this._index = null;
        }
        if (this._type == 'list_item_move') {
            this._newIndex = Math.floor(properties.new_index);
        } else {
            this._newIndex = null;
        }
    };

    FieldOperation.json = {
        serialize: function (operation) {
            var type = operation.getType(),
                res = {
                    field_id: operation.getFieldId(),
                    change_type: type
                };

            if (type == 'set' || type == 'list_item_set' || type == 'list_item_insert') {
                res.value = Value.json.serialize(operation.getValue());
            }

            if (type == 'list_item_move') {
                res.list_item_dest = operation.getNewIndex();
            }

            if (type.indexOf('list_item_') == 0) {
                res.list_item = operation.getIndex();
            }

            return res;
        },

        deserialize: function (serialized) {
            var type = serialized.change_type,
                properties = {
                    type: type,
                    field_id: serialized.field_id
                };

            if (type == 'set' || type == 'list_item_set' || type == 'list_item_insert') {
                properties.value = Value.json.deserialize(serialized.value);
            }

            if (type == 'list_item_move') {
                properties.new_index = serialized.list_item_dest;
            }

            if (type.indexOf('list_item_') == 0) {
                properties.index = serialized.list_item;
            }

            return new FieldOperation(properties);
        }
    };

    util.defineClass(FieldOperation, /** @lends cloud.dataSyncApi.FieldOperation.prototype */ {
        /**
         * @returns {String} Тип операции.
         */
        getType: function () {
            return this._type;
        },

        /**
         * @returns {String} Имя поля.
         */
        getFieldId: function () {
            return this._fieldId;
        },

        /**
         * @returns {cloud.dataSyncApi.Value} Новое значение поля.
         */
        getValue: function () {
            return this._value;
        },

        /**
         * @returns {Integer|null} Индекс элемента списка.
         */
        getIndex: function () {
            return this._index;
        },

        /**
         * @returns {Integer|null} Новую позицию элемента списка.
         */
        getNewIndex: function () {
            return this._newIndex;
        }
    });

    provide(FieldOperation);
});
ns.modules.define('cloud.dataSyncApi.Record', [
    'cloud.Error',
    'component.util',
    'cloud.dataSyncApi.Value'
], function (provide, Error, util, Value) {
        /**
         * @class Запись в БД.
         * @name cloud.dataSyncApi.Record
         * @param {Object} properties Данные записи.
         * @param {String} properties.collection_id Идентификатор коллекции.
         * @param {String} properties.record_id Идентификатор записи.
         * @param {Object} properties.fields Ключи и значения полей
         * в виде JSON-объекта. Значения могут задаться либо
         * экземлпярами класса {@link cloud.dataSyncApi.Value}, либо
         * любыми значениями, приводимыми к нему.
         */
    var Record = function (properties) {
            this._collectionId = properties.collection_id;
            this._recordId = properties.record_id;
            this._fields = Object.keys(properties.fields || {})
                .reduce(function (fields, key) {
                    fields[key] = properties.fields[key] instanceof Value ?
                        properties.fields[key] :
                        new Value(properties.fields[key]);
                    return fields;
                }, {});
        };

    Record.json = {
        deserialize: function (json, asDelta) {
            if (asDelta) {
                return new Record({
                    collection_id: json.collection_id,
                    record_id: json.record_id,
                    fields: (json.changes || []).reduce(function (fields, change) {
                        if (change.change_type != 'set') {
                            throw new Error({
                                message: 'Field change type is not supported',
                                type: change.change_type
                            });
                        }
                        fields[change.field_id] = Value.json.deserialize(change.value);
                        return fields;
                    }, {})
                });
            } else {
                return new Record({
                    collection_id: json.collection_id,
                    record_id: json.record_id,
                    fields: json.fields.reduce(function (fields, field) {
                        fields[field.field_id] = Value.json.deserialize(field.value);
                        return fields;
                    }, {})
                });
            }
        },

        serialize: function (record) {
            return {
                record_id: record.getRecordId(),
                collection_id: record.getCollectionId(),
                change_type: 'set',
                changes: record.getFieldIds().map(function (fieldId) {
                    return {
                        field_id: fieldId,
                        change_type: 'set',
                        value: Value.json.serialize(record.getFieldValue(fieldId))
                    };
                })
            };
        }
    };

    util.defineClass(Record, /** @lends cloud.dataSyncApi.Record.prototype */ {

        /**
         * @returns {String} Идентификатор коллекции.
         */
        getCollectionId: function () {
            return this._collectionId;
        },

        /**
         * @returns {String} Идентификатор записи.
         */
        getRecordId: function () {
            return this._recordId;
        },

        /**
         * @returns {String[]} Возвращает список полей записи.
         */
        getFieldIds: function () {
            return Object.keys(this._fields);
        },

        /**
         * @param {String} field_id Имя поля.
         * @returns {cloud.dataSyncApi.Value} Значение поля.
         */
        getFieldValue: function (field_id) {
            return this._fields[field_id];
        },

        /**
         * @returns {Object} Значения полей записи в виде JSON-объекта,
         * ключами которого являются имена полей.
         * @see cloud.dataSyncApi.Record.getFieldIds
         * @see cloud.dataSyncApi.Record.getFieldValue
         */
        getFields: function () {
            return util.extend({}, this._fields);
        },

        /**
         * @ignore
         * Применят операцию к полю записи.
         * @param {cloud.dataSyncApi.FieldOperation} operation Операция.
         * @returns {cloud.dataSyncApi.Record} Ссылку на себя.
         */
        applyFieldOperation: function (operation) {
            var error = this.dryRun(operation);
            if (error) {
                throw new Error({
                    code: 409,
                    type: error
                });
            }

            var fieldId = operation.getFieldId(),
                type = operation.getType(),
                fields = this._fields,
                currentValue = fields[fieldId];

            if (type == 'set') {
                this._fields[fieldId] = operation.getValue();
            } else if (type == 'delete') {
                delete this._fields[fieldId];
            } else if (['list_item_set', 'list_item_delete', 'list_item_insert', 'list_item_move'].indexOf(type) != -1) {
                currentValue.applyListOperation(operation);
            }

            return this;
        },

        /**
         * @ignore
         * @returns {cloud.dataSyncApi.Record} Копию записи.
         */
        copy: function () {
            var model = this._fields;

            return new Record({
                collection_id: this.getCollectionId(),
                record_id: this.getRecordId(),
                fields: Object.keys(this._fields).reduce(function (fields, key) {
                    fields[key] = model[key].copy();
                    return fields;
                }, {})
            });
        },

        /**
         * @ignore
         * Проверяет, выполнима ли данная операция над записью.
         * @returns {String|null} <p>null — операция прошла без конфликта,
         * тип конфликта в противном случае. Возможные типы конфликтов:</p>
         * <ul>
         *     <li>delete_non_existent_field — возникает при попытке
         * удалить несуществующее поле;</li>
         *     <li>modify_non_existent_field — возникает при попытке
         * применить списковую операцию к несуществующему полю;</li>
         *     <li>modify_not_a_list_field — возникает при попытке
         * вставки, удаления, изменения или перемещения элемента в несписковом
         * поле;</li>
         *     <li>incorrect_list_index — возникает при попытке
         * вставки, удаления, изменения или перемещения элемента
         * с некорректным индексом;</li>
         *     <li>unknown_type — неизвестный тип операции.</li>
         * </ul>
         */
        dryRun: function (operation) {
            var fieldId = operation.getFieldId(),
                type = operation.getType(),
                fields = this._fields,
                currentValue = fields[fieldId];

            if (type == 'set') {
                return null;
            } else if (type == 'delete') {
                if (typeof currentValue == 'undefined') {
                    return 'delete_non_existent_field';
                }
            } else if (['list_item_set', 'list_item_delete', 'list_item_insert', 'list_item_move'].indexOf(type) != -1) {
                if (typeof currentValue == 'undefined') {
                    return 'modify_non_existent_field';
                }
                if (currentValue.getType() != 'list') {
                    return 'modify_not_a_list_field';
                }
                return currentValue.dryRun(operation);
            } else {
                return 'unknown_type';
            }

            return null;
        }
    });

    provide(Record);
});
ns.modules.define('cloud.dataSyncApi.Operation', [
    'cloud.dataSyncApi.FieldOperation',
    'cloud.dataSyncApi.Record',
    'component.util'
], function (provide, FieldOperation, Record, util) {
    /**
     * @class Операция над БД.
     * @name cloud.dataSyncApi.Operation
     * @param {Object} properties Параметры операции.
     * @param {String} properties.type <p>Тип операции. Возможны следующие значения:</p>
     * <ul>
     *     <li>insert — добавление записи;</li>
     *     <li>delete — удаление записи;</li>
     *     <li>set — перезадание записи;</li>
     *     <li>update — изменение отдельных полей записи.</li>
     * </ul>
     * @param {String} properties.collection_id Идентфикатор коллекции, над которой
     * выполняется операция.
     * @param {String} properties.record_id Идентификатор записи, над которой выполняется
     * операция.
     * @param {cloud.dataSyncApi.FieldOperation[]|Object[]} [properties.field_operations = []] Для операций
     * insert, set и update задаёт изменения значений полей. Может задаваться массивом
     * экземпляров класса {@link cloud.dataSyncApi.FieldOperation} либо json-объектов, приводимых к нему.
     */
    var Operation = function (properties) {
            this._type = properties.type;
            this._collectionId = properties.collection_id;
            this._recordId = properties.record_id;
            if (['insert', 'update', 'set'].indexOf(this._type) != -1) {
                this._fieldOperations = (properties.field_operations || []).map(function (change) {
                    if (change instanceof FieldOperation) {
                        return change;
                    } else {
                        return new FieldOperation(change);
                    }
                });
            } else {
                this._fieldOperations = null;
            }
        };

    Operation.json = {
        serialize: function (operation) {
            var type = operation.getType(),
                res = {
                    record_id: operation.getRecordId(),
                    collection_id: operation.getCollectionId(),
                    change_type: type
                };

            if (['insert', 'update', 'set'].indexOf(type) != -1) {
                res.changes = operation.getFieldOperations().map(function (change) {
                    return FieldOperation.json.serialize(change);
                });
            }

            return res;
        },

        deserialize: function (serialized) {
            var type = serialized.change_type,
                properties = {
                    type: type,
                    record_id: serialized.record_id,
                    collection_id: serialized.collection_id
                };

            if (['insert', 'update', 'set'].indexOf(this._type) != -1) {
                properties.field_changes = serialized.changes.map(function (change) {
                    return FieldOperation.json.deserialize(change)
                });
            }

            return new Operation(properties);
        }
    };

    util.defineClass(Operation, /** @lends cloud.dataSyncApi.Operation.prototype */ {
        /**
         * @returns {String} Тип операции.
         */
        getType: function () {
            return this._type;
        },

        /**
         * @returns {String} Возвращает идентификатор записи.
         */
        getRecordId: function () {
            return this._recordId;
        },

        /**
         * @returns {String} Возвращает идентификатор коллекции.
         */
        getCollectionId: function () {
            return this._collectionId;
        },

        /**
         * @returns {cloud.dataSyncApi.FieldOperation[]} Возвращает список
         * операций над полями записи.
         */
        getFieldOperations: function () {
            return this._fieldOperations ? this._fieldOperations.slice() : null;
        }
    });

    provide(Operation);
});
ns.modules.define('cloud.dataSyncApi.Transaction', [
    'cloud.dataSyncApi.Record',
    'cloud.dataSyncApi.Operation',
    'cloud.dataSyncApi.FieldOperation',
    'component.util'
], function (provide, Record, Operation, FieldOperation, util) {
        /**
         * @noconstructor
         * @class Транзакция БД. Позволяет модифицировать
         * данные и отправить изменения на удалённый сервер.
         * @see cloud.dataSyncApi.Database.createTransaction
         * @name cloud.dataSyncApi.Transaction
         */
    var Transaction = function (database, patchCallback) {
            this._database = database;
            this._patchCallback = patchCallback;
            this._deltaId = 'ya_cloud_data_js_api_1_' + Math.random().toString();
            this._baseRevision = database.getRevision();
            this._operations = [];
        };

    util.defineClass(Transaction, /** @lends cloud.dataSyncApi.Transaction.prototype */ {
        /**
         * Добавляет произвольный набор операций к транзакции.
         * @param {cloud.dataSyncApi.Operation|cloud.dataSyncApi.Operation[]|Object|Object[]} operations Операция
         * или массив операций для добавления в виде экземпляров класса {@link cloud.dataSyncApi.Operation}
         * либо приводимых к нему json-объектов.
         * @returns {cloud.dataSyncApi.Transaction} Ссылку на себя.
         */
        addOperations: function (operations) {
            [].push.apply(this._operations, [].concat(operations).map(function (operation) {
                return operation instanceof Operation ? operation : new Operation(operation);
            }));
            return this;
        },

        /**
         * Применяет транзакцию к базе данных и пересылает изменения
         * на удалённый сервер.
         * @param {String} [politics] Политика разрешения конфликтов.
         * Если указана политика 'theirs', то, в случае конфликта, будет
         * произведено обновление БД и повторная попытка переслать
         * те из локальных изменений, которые не конфликтуют с текущим
         * состоянием БД, и, таким образом, автоматически
         * разрешить конфликт.
         * @see cloud.dataSyncApi.Conflict
         * @returns {vow.Promise} Объект-Promise, который будет подтверждён
         * в случае успеха операции списком выполненных операций
         * или отклонён с одной из следующих ошибок:
         * <ul>
         *     <li>400 — запрос некорректен;</li>
         *     <li>401 — пользователь не авторизован;</li>
         *     <li>403 — доступ запрещён;</li>
         *     <li>409 — произошёл конфликт, в поле conflicts объекта-ошибки
         * будет содержаться описание конфликтующих изменений в виде
         * массива json-объектов с полями index и conflict;</li>
         *     <li>429 — превышен лимит количества запросов;</li>
         *     <li>500 — невозможно выполнить запрос.</li>
         * </ul>
         */
        push: function (politics) {
            return this._patchCallback({
                delta_id: this._deltaId,
                base_revision: this._baseRevision,
                operations: this._operations
            }, politics);
        },

        /**
         * @returns {cloud.dataSyncApi.Database} Базу данных, к которой
         * создана транзакция.
         */
        getDatabase: function () {
            return this._database;
        },

        /**
         * @returns {String} Номер ревизии, актуальной на момент
         * создания транзации.
         */
        getBaseRevision: function () {
            return this._baseRevision;
        },

        /**
         * @returns {cloud.dataSyncApi.Operation[]} Массив операций,
         * из которых состоит транзакция.
         */
        getOperations: function () {
            return this._operations.slice();
        },

        /**
         * Добавляет новые записи.
         * @param {cloud.dataSyncApi.Record|cloud.dataSyncApi.Record[]|Object|Object[]} records
         * Записи для добавления в виде экземпляров класса {@link cloud.dataSyncApi.Record} либо
         * json-объектов, приводимых к ним.
         * @returns {cloud.dataSyncApi.Transaction} Ссылку на себя.
         */
        insertRecords: function (records) {
            return this.addOperations([].concat(records).map(function (record) {
                var options = castOperationOptions('insert', record);

                if (record instanceof Record) {
                    options.field_operations = record.getFieldIds().map(function (key) {
                        return new FieldOperation({
                            type: 'set',
                            field_id: key,
                            value: record.getFieldValue(key)
                        });
                    });
                } else {
                    options.field_operations = record.fields ? Object.keys(record.fields).map(function (key) {
                        return new FieldOperation({
                            type: 'set',
                            field_id: key,
                            value: record.fields[key]
                        });
                    }) : [];
                }

                return new Operation(options);
            }));
        },

        /**
         * Удаляет существующие записи.
         * @param {cloud.dataSyncApi.Record|cloud.dataSyncApi.Record[]|Object|Object[]} records
         * Массив записей для удаления, заданных либо ссылками на объекты {@link cloud.dataSyncApi.Record},
         * либо json-объектами с полями record_id и collection_id.
         * @returns {cloud.dataSyncApi.Transaction} Ссылку на себя.
         */
        deleteRecords: function (records) {
            return this.addOperations([].concat(records).map(function (record) {
                return new Operation(castOperationOptions('delete', record));
            }));
        },

        /**
         * Заменяет поля в записи.
         * @param {Object|cloud.dataSyncApi.Record} record Запись для изменения,
         * заданная в виде объекта {@link cloud.dataSyncApi.Record} или json-объекта
         * с полями record_id и collection_id.
         * @param {Object|cloud.dataSyncApi.FieldOperation[]} fields Новые значения полей
         * в виде JSON-объекта или массива объектов {@link cloud.dataSyncApi.FieldOperation}.
         * @returns {cloud.dataSyncApi.Transaction} Ссылку на себя.
         */
        setRecordFields: function (record, fields) {
            var options = castOperationOptions('set', record);

            if (Array.isArray(fields)) {
                options.field_operations = fields;
            } else {
                options.field_operations = Object.keys(fields || {}).map(function (key) {
                    return new FieldOperation({
                        type: 'set',
                        field_id: key,
                        value: fields[key]
                    });
                });
            }

            return this.addOperations(new Operation(options));
        },

        /**
         * Изменяет значения полей существующей записи.
         * @param {Object|cloud.dataSyncApi.Record} record Запись для изменения,
         * заданная в виде объекта {@link cloud.dataSyncApi.Record} или json-объекта
         * с полями record_id и collection_id.
         * @param {Object|cloud.dataSyncApi.FieldOperation[]} fields Новые значения полей
         * в виде JSON-объекта или массива объектов {@link cloud.dataSyncApi.FieldOperation}.
         * Если некоторое поле необходимо удалить, укажите для него значение undefined.
         * @returns {cloud.dataSyncApi.Transaction} Ссылку на себя.
         */
        updateRecordFields: function (record, fields) {
            var options = castOperationOptions('update', record);

            if (Array.isArray(fields)) {
                options.field_operations = fields;
            } else {
                options.field_operations = Object.keys(fields).map(function (key) {
                    if (typeof fields[key] == 'undefined') {
                        return new FieldOperation({
                            type: 'delete',
                            field_id: key
                        });
                    } else {
                        return new FieldOperation({
                            type: 'set',
                            field_id: key,
                            value: fields[key]
                        });
                    }
                });
            }

            return this.addOperations(new Operation(options));
        },

        /**
         * Вставляет новый элемент в список, хранящийся в поле записи.
         * @param {Object|cloud.dataSyncApi.Record} record Запись для изменения,
         * заданная в виде объекта {@link cloud.dataSyncApi.Record} или json-объекта
         * с полями record_id и collection_id.
         * @param {Object} parameters Параметры операции.
         * @param {String} parameters.field_id Имя спискового поля.
         * @param {Integer} parameters.index Индекс позиции, в которую
         * нужно вставить элемент.
         * @param {cloud.dataSyncApi.Value|*} parameters.value Значение для вставки
         * в список, заданное экземпляром класса cloud.dataSyncApi.Value или любым объектом,
         * приводимым к нему.
         * @returns {cloud.dataSyncApi.Transaction} Ссылку на себя.
         */
        insertRecordFieldListItem: function (record, parameters) {
            var options = castOperationOptions('update', record);

            options.field_operations = [
                new FieldOperation({
                    type: 'list_item_insert',
                    field_id: parameters.field_id,
                    index: parameters.index,
                    value: parameters.value
                })
            ];

            return this.addOperations(new Operation(options));
        },

        /**
         * Изменяет значение элемента списка, хранящегося в поле записи.
         * @param {Object|cloud.dataSyncApi.Record} record Запись для изменения,
         * заданная в виде объекта {@link cloud.dataSyncApi.Record} или json-объекта
         * с полями record_id и collection_id.
         * @param {Object} parameters Параметры операции.
         * @param {String} parameters.field_id Имя спискового поля.
         * @param {Integer} parameters.index Индекс позиции элемента, значение
         * которого необходимо заменить.
         * @param {cloud.dataSyncApi.Value|*} parameters.value Новое значение элемента,
         * заданное экземпляром класса cloud.dataSyncApi.Value или любым объектом,
         * приводимым к нему.
         * @returns {cloud.dataSyncApi.Transaction} Ссылку на себя.
         */
        setRecordFieldListItem: function (record, parameters) {
            var options = castOperationOptions('update', record);

            options.field_operations = [
                new FieldOperation({
                    type: 'list_item_set',
                    field_id: parameters.field_id,
                    index: parameters.index,
                    value: parameters.value
                })
            ];

            return this.addOperations(new Operation(options));
        },

        /**
         * Перемещает элемент списка, хранящегося в поле записи.
         * @param {Object|cloud.dataSyncApi.Record} record Запись для изменения,
         * заданная в виде объекта {@link cloud.dataSyncApi.Record} или json-объекта
         * с полями record_id и collection_id.
         * @param {Object} parameters Параметры операции.
         * @param {String} parameters.field_id Имя спискового поля.
         * @param {Integer} parameters.index Индекс позиции элемента, положение
         * которого необходимо заменить.
         * @param {Integer} parameters.new_index Индекс новой позиции элемента
         * @returns {cloud.dataSyncApi.Transaction} Ссылку на себя.
         */
        moveRecordFieldListItem: function (record, parameters) {
            var options = castOperationOptions('update', record);

            options.field_operations = [
                new FieldOperation({
                    type: 'list_item_move',
                    field_id: parameters.field_id,
                    index: parameters.index,
                    new_index: parameters.new_index
                })
            ];

            return this.addOperations(new Operation(options));
        },

        /**
         * Удаляет элемент списка, хранящегося в поле записи.
         * @param {Object|cloud.dataSyncApi.Record} record Запись для изменения,
         * заданная в виде объекта {@link cloud.dataSyncApi.Record} или json-объекта
         * с полями record_id и collection_id.
         * @param {Object} parameters Параметры операции.
         * @param {String} parameters.field_id Имя спискового поля.
         * @param {Integer} parameters.index Индекс позиции элемента, который
         * необходимо удалить.
         * @returns {cloud.dataSyncApi.Transaction} Ссылку на себя.
         */
        deleteRecordFieldListItem: function (record, parameters) {
            var options = castOperationOptions('update', record);

            options.field_operations = [
                new FieldOperation({
                    type: 'list_item_delete',
                    field_id: parameters.field_id,
                    index: parameters.index
                })
            ];

            return this.addOperations(new Operation(options));
        }
    });

    function castOperationOptions (type, record) {
        var options = {
                type: type
            };

        if (record instanceof Record) {
            options.collection_id = record.getCollectionId();
            options.record_id = record.getRecordId();
        } else {
            options.collection_id = record.collection_id;
            options.record_id = record.record_id;
        }

        return options;
    }

    provide(Transaction);
});

ns.modules.define('cloud.dataSyncApi.config', function (provide) {
    provide({
        apiHost: 'https://cloud-api.yandex.net/',
        contexts: {
            app: true,
            user: true
        },
        oauthLoginPage: 'https://oauth.yandex.ru/authorize?response_type=token&client_id={{ key }}',
        oauthWindowParameters: 'width=600,height=500',
        deltaLimit: 100
    });
});
ns.modules.define('cloud.dataSyncApi.Value', [
    'component.util',
    'cloud.Error'
], function (provide, util, Error) {
    /**
     * @name cloud.dataSyncApi.Value
     * @class Объект, представляющий значение поля записи.
     * @param {Object|*} properties Описание значения либо само значение.
     * @param {String} [properties.type] Тип поля.
     * <p>В Data API существуют следующие типы полей:</p>
     * <ul>
     *     <li>&apos;string&apos; — строка;</li>
     *     <li>&apos;integer&apos; — целое число;</li>
     *     <li>&apos;double&apos; — вещественное число;</li>
     *     <li>&apos;boolean&apos; — логическое (булево) значение;</li>
     *     <li>&apos;datetime&apos; — время и дата;</li>
     *     <li>&apos;binary&apos; — массив двоичных данных;</li>
     *     <li>&apos;null&apos; — специальное значение null;</li>
     *     <li>&apos;nan&apos; — специальное значение Not Any Number;</li>
     *     <li>&apos;inf&apos; — специальное значение «бесконечность»;</li>
     *     <li>&apos;ninf&apos; — специальное значение «минус бесконечность»;</li>
     *     <li>&apos;list&apos; — список (может состоять из объектов любого
     * из перечисленных выше типов).</li>
     * </ul>
     * <p>Тип может быть не указан, в таком случае параметр value будет приведён
     * к типу Data API автоматически по следующим правилам:</p>
     * <ul>
     *     <li>строки будут преобразованы к типу &apos;string&apos;;</li>
     *     <li>числа (за исключением NaN, Infinity и -Infinity) будут преобразованы
     *     к типу &apos;number&apos;;</li>
     *     <li>значения true и false и объекты типа Boolean будут
     *     преобразованы к типу &apos;boolean&apos;;</li>
     *     <li>значения типа Date будут преобразованы к типу &apos;datetime&apos;;</li>
     *     <li>значения типа ArrayBuffer и типизированные массивы
     *     будут преобразованы к типу &apos;binary&apos;;</li>
     *     <li>null будет преобразован к типу &apos;null&apos;;</li>
     *     <li>NaN будет преобразован к типу &apos;nan&apos;;</li>
     *     <li>Infinity будет преобразован к типу &apos;inf&apos;;</li>
     *     <li>-Infinity будет преобразован к типу &apos;ninf&apos;;</li>
     *     <li>массивы будут преобразованы к типу &apos;list&apos;.</li>
     * </ul>
     * @param {*} [properties.value] <p>Значение поля. Может задаваться:</p>
     * <ul>
     *     <li>для типа &apos;string&apos; — строкой либо любым объектом
     *     с методом toString;</li>
     *     <li>для типов &apos;integer&apos; и &apos;double&apos; — числом
     *     либо строкой;</li>
     *     <li>для типа &apos;boolean&apos; — любым объектом JavaScript,
     *     который приводится к boolean посредством вызова Boolean(value);</li>
     *     <li>для типа &apos;datetime&apos; — объектом типа Date или строкой
     *     в формате ISO 8601;</li>
     *     <li>для типа &apos;binary&apos; — строкой, представляющей собой
     *     base64-закодированные двоичные данные или объектом ArrayBuffer или
     *     типизированным массивом;</li>
     *     <li>для типа &apos;list&apos; — массивом, для каждого элемента которого
     *     будет вызван конструктор {@link cloud.dataSyncApi.Value}.</li>
     * </ul>
     * Для типов &apos;null&apos;, &apos;nan&apos;, &apos;inf&apos; и &apos;ninf&apos;
     * значение не указывается.
     */
    var Value = function (properties) {
            if (properties && properties.type) {
                this._type = properties.type;
                this._value = castValue(this._type, properties.value);
            } else {
                this._type = detectType(properties);
                this._value = castValue(this._type, properties);
            }
        };

    /**
     * @ignore
     * Функции для (де)сериализации значения из/в форматы
     * ответов HTTP API.
     */
    Value.json = {
        serialize: function (value) {
            var result = {};
            result.type = value._type;
            if (['null', 'nan', 'inf', 'ninf'].indexOf(result.type) != -1) {
                result[result.type] = true;
            } else if (result.type == 'list') {
                result.list = value._value.map(Value.json.serialize);
            } else {
                result[result.type] = value._value;
            }

            return result;
        },

        deserialize: function (json) {
            var properties = {
                    type: json.type
                };

            if (json.type == 'list') {
                properties.value = json.list ? json.list.map(Value.json.deserialize) : [];
            } else if (['null', 'nan', 'inf', 'ninf'].indexOf(json.type) == -1) {
                properties.value = json[json.type];
            }

            return new Value (properties);
        }
    };

    util.defineClass(Value, {
        /**
         * @returns {String} Тип значения.
         */
        getType: function () {
            return this._type;
        },

        /**
         * @param {Boolean} [decode = false] true — для binary-значений
         * вернуть ArrayBuffer, false — Base64-закодированную строку.
         * @returns {*|cloud.dataSyncApi.Value[]} Значение, приведённое к одному
         * из стандартных типов JavaScript.
         */
        valueOf: function (decode) {
            return decode && this._type == 'binary' ?
                base64ToArrayBuffer(this._value) :
                    (this._type == 'datetime' ?
                        new Date(this._value) :
                        this._value);
        },

        toString: function () {
            return this._value.toString();
        },

        /**
         * @ignore
         * @returns {cloud.dataSyncApi.Value} Копию значения.
         */
        copy: function () {
            return new Value({
                type: this._type,
                value: copyValue(this._type, this._value)
            });
        },

        /**
         * @ignore
         * Применяет списковую операцию к значению.
         * @param {cloud.dataSyncApi.FieldOperation} operation Операция.
         * @returns {cloud.dataSyncApi.Value} Ссылку на себя.
         */
        applyListOperation: function (operation) {
            var error = this.dryRun(operation);

            if (error) {
                throw new Error({
                    code: 409,
                    type: error
                });
            }

            var type = operation.getType(),
                index = operation.getIndex(),
                list = this._value;

            switch (type) {
                case 'list_item_set':
                    list[index] = operation.getValue();
                    break;
                case 'list_item_move':
                    var item = list[index],
                        newIndex = operation.getNewIndex();

                    if (index != newIndex) {
                        list.splice(index, 1);
                        list.splice(newIndex, 0, item);
                    }
                    break;
                case 'list_item_insert':
                    list.splice(index, 0, operation.getValue());
                    break;
                case 'list_item_delete':
                    list.splice(index, 1);
                    break;
                default:
                    break;
            }

            return this;
        },

        /**
         * @ignore
         * Проверяет, применима ли списковая операция к значению.
         * @param {cloud.dataSyncApi.FieldOperation} operation Операция.
         * @returns {String|null} <p>null — операция прошла без конфликта,
         * тип конфликта в противном случае. Возможные типы конфликтов:</p>
         * <ul>
         *     <li>incorrect_list_index — возникает при попытке
         * вставки, удаления, изменения или перемещения элемента
         * с некорректным индексом;</li>
         *     <li>unknown_type — неизвестный тип операции.</li>
         * </ul>
         */
        dryRun: function (operation) {
            var type = operation.getType(),
                index = operation.getIndex(),
                list = this._value;


            switch (type) {
                case 'list_item_set':
                    if (index >= list.length || index < 0) {
                        return 'incorrect_list_index';
                    }
                    break;
                case 'list_item_move':
                    var newIndex = operation.getNewIndex();

                    if (index >= list.length || index < 0 || newIndex >= list.length || newIndex < 0) {
                        return 'incorrect_list_index';
                    }
                    break;
                case 'list_item_insert':
                    if (index > list.length || index < 0) {
                        return 'incorrect_list_index';
                    }
                    break;
                case 'list_item_delete':
                    if (index >= list.length || index < 0) {
                        return 'incorrect_list_index';
                    }
                    break;
                default:
                    return 'unknown_type';
            }

            return null;
        }
    });

    function detectType (value) {
        switch (typeof value) {
            case 'number':
                if (value == Number.POSITIVE_INFINITY) {
                    return 'inf';
                } else if (value == Number.NEGATIVE_INFINITY) {
                    return 'ninf';
                } else if (global.isNaN(value)) {
                    return 'nan';
                } else {
                    return 'double'
                }
            case 'string':
                return 'string';
            case 'boolean':
                return 'boolean';
            case 'object':
                if (value == null) {
                    return 'null';
                } else if (typeof global.ArrayBuffer != 'undefined' && (
                        value instanceof ArrayBuffer || (value.buffer && value.buffer instanceof ArrayBuffer)
                    )) {
                    return 'binary'
                } else if (value instanceof Date) {
                    return 'datetime';
                } else if (value instanceof Boolean) {
                    return 'boolean';
                } else if (value instanceof Number) {
                    return 'double';
                } else if (Array.isArray(value)) {
                    return 'list';
                } else {
                    return 'string';
                }
            default:
                throw new Error({
                    message: 'Type unknown'
                });
        }
    }

    function castValue (type, value) {
        switch (type) {
            case 'string':
                return value.toString();
            case 'integer':
                return Math.floor(Number(value));
            case 'double':
                return Number(value);
            case 'boolean':
                return value instanceof Boolean ? value.valueOf() : Boolean(value);
            case 'datetime':
                return value instanceof Date ? value.toISOString() : value;
            case 'binary':
                if (typeof global.ArrayBuffer != 'undefined') {
                    if (value instanceof ArrayBuffer) {
                        return global.btoa(String.fromCharCode.apply(null, new Uint8Array(value)));
                    } else if (value.buffer && value.buffer instanceof ArrayBuffer) {
                        return global.btoa(String.fromCharCode.apply(null, new Uint8Array(value.buffer)));
                    } else {
                        return value.toString();
                    }
                } else {
                    return value.toString();
                }
            case 'null':
                return null;
            case 'inf':
                return Number.POSITIVE_INFINITY;
            case 'ninf':
                return Number.NEGATIVE_INFINITY;
            case 'nan':
                return Number.NaN;
            case 'list':
                return value.map(function (item) {
                    return item instanceof Value ? item : new Value(item);
                });
            default:
                throw new Error({
                    message: 'Type unknown'
                });
        }
    }

    function copyValue (type, value) {
        if (type == 'list') {
            return value.map(function (item) {
                return item.copy();
            });
        } else {
            return value;
        }
    }

    function base64ToArrayBuffer (value) {
        value = value.replace(/[^A-Za-z0-9\+\/]/g, '');

        var length = value.length,
            outLength = length * 3 + 1 >> 2,
            result = new Uint8Array(outLength),
            mod3, mod4, int24 = 0;

        for (var outIndex = 0, inIndex = 0; inIndex < length; inIndex++) {
            mod4 = inIndex & 3;
            int24 |= base64ToUint6(value.charCodeAt(inIndex)) << 18 - 6 * mod4;
            if (mod4 == 3 || length - inIndex == 1) {
                for (mod3 = 0; mod3 < 3 && outIndex < outLength; mod3++, outIndex++) {
                    result[outIndex] = int24 >>> (16 >>> mod3 & 24) & 255;
                }
                int24 = 0;
            }
        }

        return result.buffer;
    }

    function base64ToUint6 (char) {
        return char > 64 && char < 91 ?
            char - 65 :
                char > 96 && char < 123 ?
                    char - 71 :
                    char > 47 && char < 58 ?
                        char + 4 :
                        char == 43 ?
                            62:
                            char == 47 ? 63 : 0;
    }

    provide(Value);
});

ns.modules.define('cloud.dataSyncApi.politics', [

], function (provide) {
    provide({
        theirs: function (operations, conflicts) {
            var indexes = conflicts.reduce(function (indexes, conflict) {
                    indexes[conflict.index] = true;
                    return indexes;
                }, {}),
                result = [];

            operations.forEach(function (operation, index) {
                if (!indexes[index]) {
                    result.push(operation);
                }
            });

            return result;
        }
    });
});
ns.modules.define('cloud.dataSyncApi.http', [
    'cloud.dataSyncApi.config',
    'cloud.client',
    'component.xhr',
    'vow',
    'cloud.Error'
], function (provide, config, client, xhr, vow, Error) {
    var check = function (options) {
            if (!options) {
                return fail('`options` Parameter Required');
            }
            if (!allowedContext(options.context)) {
                return fail('Invalid `options.context` Value');
            }
        },
        allowedContext = function (context) {
            return context && config.contexts[context];
        },
        fail = function (code, message) {
            if (!message) {
                message = code;
                code = 400;
            }
            return vow.reject(new Error({
                code: code,
                message: message
            }));
        },
        authorizeIfNeeded = function (options) {
            if (options.token) {
                return vow.resolve(options.token);
            } else if (client.isInitiaized()) {
                return vow.resolve(client.getToken());
            } else {
                if (options && (options.authorize_if_needed || typeof options.authorize_if_needed == 'undefined')) {
                    return client.initialize(options);
                } else {
                    return vow.reject(new Error({
                        code: 401
                    }));
                }
            }
        };

    provide({
        getDatabases: function (options) {
            var url = config.apiHost + 'v1/data/' + options.context + '/databases',
                queryParams;

            if (options && options.database_id) {
                url += '/' + options.database_id;
            } else {
                queryParams = {
                    limit: Number(options && options.limit),
                    offset: Number(options && options.offset)
                };
            }

            return check(options) || authorizeIfNeeded(options).then(function (token) {
                return xhr(url, {
                    queryParams: queryParams,
                    headers: {
                        Authorization: 'OAuth ' + token
                    },
                    parse: true
                });
            });
        },

        putDatabase: function (options) {
            var error = check(options);
            if (!error && typeof options.database_id != 'string') {
                error = fail('`options.database_id` Parameter Required');
            }

            return error || authorizeIfNeeded(options).then(function (token) {
                return xhr(
                    config.apiHost + 'v1/data/' +
                    options.context + '/databases/' + encodeURIComponent(options.database_id), {
                        method: 'PUT',
                        headers: {
                            Authorization: 'OAuth ' + token
                        },
                        parse: true
                    }
                );
            });
        },

        deleteDatabase: function (options) {
            var error = check(options);
            if (!error && typeof options.database_id != 'string') {
                error = fail('`options.database_id` Parameter Required');
            }

            return error || authorizeIfNeeded(options).then(function (token) {
                return xhr(
                    config.apiHost + 'v1/data/' +
                    options.context + '/databases/' + encodeURIComponent(options.database_id), {
                        method: 'DELETE',
                        headers: {
                            Authorization: 'OAuth ' + token
                        },
                        // NB: DELETE database отдаёт пустой ответ при успехе
                        parse: false
                    }
                );
            });
        },

        getSnapshot: function (options) {
            return check(options) || authorizeIfNeeded(options).then(function (token) {
                return xhr(
                    config.apiHost + 'v1/data/' +
                    options.context + '/databases/' +
                    encodeURIComponent(options.database_id) + '/snapshot', {
                        headers: {
                            Authorization: 'OAuth ' + token
                        },
                        parse: true
                    }
                );
            });
        },

        getDeltas: function (options) {
            var error = check(options);

            if (!error && typeof options.database_id != 'string') {
                error = fail('`options.database_id` Parameter Required');
            }

            if (!error && typeof options.base_revision != 'number') {
                error = fail('`options.base_revision` Parameter Required');
            }

            return error || authorizeIfNeeded(options).then(function (token) {
                return xhr(
                    config.apiHost + 'v1/data/' +
                    options.context + '/databases/' +
                    encodeURIComponent(options.database_id) + '/deltas', {
                        method: 'GET',
                        headers: {
                            Authorization: 'OAuth ' + token
                        },
                        queryParams: {
                            base_revision: options.base_revision,
                            limit: typeof options.limit == 'undefined' ? 100 : options.limit
                        },
                        parse: true
                    }
                );
            });
        },

        postDeltas: function (options) {
            var error = check(options);

            if (!error && typeof options.database_id != 'string') {
                error = fail('`options.database_id` Parameter Required');
            }

            if (!error && typeof options.base_revision != 'number') {
                error = fail('`options.base_revision` Parameter Required');
            }

            if (!error && typeof options.data != 'object') {
                error = fail('`options.data` Parameter Required');
            }

            return error || authorizeIfNeeded(options).then(function (token) {
                return xhr(
                    config.apiHost + 'v1/data/' +
                    options.context + '/databases/' +
                    encodeURIComponent(options.database_id) + '/deltas', {
                        method: 'POST',
                        headers: {
                            Authorization: 'OAuth ' + token,
                            'If-Match': options.base_revision
                        },
                        parse: true,
                        data: options.data
                    }
                );
            });
        }
    });
});
ns.modules.define('global', function (provide) {
    provide(global);
});
if (typeof module == 'object') {
    module.exports = ns;
} else {
    var ya = global.ya || (global.ya = {});
    ya.modules = ns.modules;
    ya.vow = ns.vow;
    ya.cloud = ns.cloud;
}})(this);