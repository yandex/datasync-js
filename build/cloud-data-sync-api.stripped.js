(function (global) {
/**
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
var vow = global.ya && global.ya.vow || global.vow,
    ns = {
        cloud: {},
        Promise: vow && vow.Promise,
        modules: global.ya && global.ya.modules || global.modules
    };
ns.modules.define('Promise', function (provide) {
    provide(ns.Promise);
});

/* eslint-disable */(function (ns) {
var module = { exports: {} }, exports = {}, Promise = ns.Promise;
/*!
    localForage -- Offline Storage, Improved
    Version 1.3.0
    https://mozilla.github.io/localForage
    (c) 2013-2015 Mozilla, Apache License 2.0
*/
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["localforage"] = factory();
	else
		root["localforage"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	exports.__esModule = true;

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	(function () {
	    'use strict';

	    // Custom drivers are stored here when `defineDriver()` is called.
	    // They are shared across all instances of localForage.
	    var CustomDrivers = {};

	    var DriverType = {
	        INDEXEDDB: 'asyncStorage',
	        LOCALSTORAGE: 'localStorageWrapper',
	        WEBSQL: 'webSQLStorage'
	    };

	    var DefaultDriverOrder = [DriverType.INDEXEDDB, DriverType.WEBSQL, DriverType.LOCALSTORAGE];

	    var LibraryMethods = ['clear', 'getItem', 'iterate', 'key', 'keys', 'length', 'removeItem', 'setItem'];

	    var DefaultConfig = {
	        description: '',
	        driver: DefaultDriverOrder.slice(),
	        name: 'localforage',
	        // Default DB size is _JUST UNDER_ 5MB, as it's the highest size
	        // we can use without a prompt.
	        size: 4980736,
	        storeName: 'keyvaluepairs',
	        version: 1.0
	    };

	    // Check to see if IndexedDB is available and if it is the latest
	    // implementation; it's our preferred backend library. We use "_spec_test"
	    // as the name of the database because it's not the one we'll operate on,
	    // but it's useful to make sure its using the right spec.
	    // See: https://github.com/mozilla/localForage/issues/128
	    var driverSupport = (function (self) {
	        // Initialize IndexedDB; fall back to vendor-prefixed versions
	        // if needed.
	        var indexedDB = indexedDB || self.indexedDB || self.webkitIndexedDB || self.mozIndexedDB || self.OIndexedDB || self.msIndexedDB;

	        var result = {};

	        result[DriverType.WEBSQL] = !!self.openDatabase;
	        result[DriverType.INDEXEDDB] = !!(function () {
	            // We mimic PouchDB here; just UA test for Safari (which, as of
	            // iOS 8/Yosemite, doesn't properly support IndexedDB).
	            // IndexedDB support is broken and different from Blink's.
	            // This is faster than the test case (and it's sync), so we just
	            // do this. *SIGH*
	            // http://bl.ocks.org/nolanlawson/raw/c83e9039edf2278047e9/
	            //
	            // We test for openDatabase because IE Mobile identifies itself
	            // as Safari. Oh the lulz...
	            if (typeof self.openDatabase !== 'undefined' && self.navigator && self.navigator.userAgent && /Safari/.test(self.navigator.userAgent) && !/Chrome/.test(self.navigator.userAgent)) {
	                return false;
	            }
	            try {
	                return indexedDB && typeof indexedDB.open === 'function' &&
	                // Some Samsung/HTC Android 4.0-4.3 devices
	                // have older IndexedDB specs; if this isn't available
	                // their IndexedDB is too old for us to use.
	                // (Replaces the onupgradeneeded test.)
	                typeof self.IDBKeyRange !== 'undefined';
	            } catch (e) {
	                return false;
	            }
	        })();

	        result[DriverType.LOCALSTORAGE] = !!(function () {
	            try {
	                return self.localStorage && 'setItem' in self.localStorage && self.localStorage.setItem;
	            } catch (e) {
	                return false;
	            }
	        })();

	        return result;
	    })(this);

	    var isArray = Array.isArray || function (arg) {
	        return Object.prototype.toString.call(arg) === '[object Array]';
	    };

	    function callWhenReady(localForageInstance, libraryMethod) {
	        localForageInstance[libraryMethod] = function () {
	            var _args = arguments;
	            return localForageInstance.ready().then(function () {
	                return localForageInstance[libraryMethod].apply(localForageInstance, _args);
	            });
	        };
	    }

	    function extend() {
	        for (var i = 1; i < arguments.length; i++) {
	            var arg = arguments[i];

	            if (arg) {
	                for (var key in arg) {
	                    if (arg.hasOwnProperty(key)) {
	                        if (isArray(arg[key])) {
	                            arguments[0][key] = arg[key].slice();
	                        } else {
	                            arguments[0][key] = arg[key];
	                        }
	                    }
	                }
	            }
	        }

	        return arguments[0];
	    }

	    function isLibraryDriver(driverName) {
	        for (var driver in DriverType) {
	            if (DriverType.hasOwnProperty(driver) && DriverType[driver] === driverName) {
	                return true;
	            }
	        }

	        return false;
	    }

	    var LocalForage = (function () {
	        function LocalForage(options) {
	            _classCallCheck(this, LocalForage);

	            this.INDEXEDDB = DriverType.INDEXEDDB;
	            this.LOCALSTORAGE = DriverType.LOCALSTORAGE;
	            this.WEBSQL = DriverType.WEBSQL;

	            this._defaultConfig = extend({}, DefaultConfig);
	            this._config = extend({}, this._defaultConfig, options);
	            this._driverSet = null;
	            this._initDriver = null;
	            this._ready = false;
	            this._dbInfo = null;

	            this._wrapLibraryMethodsWithReady();
	            this.setDriver(this._config.driver);
	        }

	        // The actual localForage object that we expose as a module or via a
	        // global. It's extended by pulling in one of our other libraries.

	        // Set any config values for localForage; can be called anytime before
	        // the first API call (e.g. `getItem`, `setItem`).
	        // We loop through options so we don't overwrite existing config
	        // values.

	        LocalForage.prototype.config = function config(options) {
	            // If the options argument is an object, we use it to set values.
	            // Otherwise, we return either a specified config value or all
	            // config values.
	            if (typeof options === 'object') {
	                // If localforage is ready and fully initialized, we can't set
	                // any new configuration values. Instead, we return an error.
	                if (this._ready) {
	                    return new Error("Can't call config() after localforage " + 'has been used.');
	                }

	                for (var i in options) {
	                    if (i === 'storeName') {
	                        options[i] = options[i].replace(/\W/g, '_');
	                    }

	                    this._config[i] = options[i];
	                }

	                // after all config options are set and
	                // the driver option is used, try setting it
	                if ('driver' in options && options.driver) {
	                    this.setDriver(this._config.driver);
	                }

	                return true;
	            } else if (typeof options === 'string') {
	                return this._config[options];
	            } else {
	                return this._config;
	            }
	        };

	        // Used to define a custom driver, shared across all instances of
	        // localForage.

	        LocalForage.prototype.defineDriver = function defineDriver(driverObject, callback, errorCallback) {
	            var promise = new Promise(function (resolve, reject) {
	                try {
	                    var driverName = driverObject._driver;
	                    var complianceError = new Error('Custom driver not compliant; see ' + 'https://mozilla.github.io/localForage/#definedriver');
	                    var namingError = new Error('Custom driver name already in use: ' + driverObject._driver);

	                    // A driver name should be defined and not overlap with the
	                    // library-defined, default drivers.
	                    if (!driverObject._driver) {
	                        reject(complianceError);
	                        return;
	                    }
	                    if (isLibraryDriver(driverObject._driver)) {
	                        reject(namingError);
	                        return;
	                    }

	                    var customDriverMethods = LibraryMethods.concat('_initStorage');
	                    for (var i = 0; i < customDriverMethods.length; i++) {
	                        var customDriverMethod = customDriverMethods[i];
	                        if (!customDriverMethod || !driverObject[customDriverMethod] || typeof driverObject[customDriverMethod] !== 'function') {
	                            reject(complianceError);
	                            return;
	                        }
	                    }

	                    var supportPromise = Promise.resolve(true);
	                    if ('_support' in driverObject) {
	                        if (driverObject._support && typeof driverObject._support === 'function') {
	                            supportPromise = driverObject._support();
	                        } else {
	                            supportPromise = Promise.resolve(!!driverObject._support);
	                        }
	                    }

	                    supportPromise.then(function (supportResult) {
	                        driverSupport[driverName] = supportResult;
	                        CustomDrivers[driverName] = driverObject;
	                        resolve();
	                    }, reject);
	                } catch (e) {
	                    reject(e);
	                }
	            });

	            promise.then(callback, errorCallback);
	            return promise;
	        };

	        LocalForage.prototype.driver = function driver() {
	            return this._driver || null;
	        };

	        LocalForage.prototype.getDriver = function getDriver(driverName, callback, errorCallback) {
	            var self = this;
	            var getDriverPromise = (function () {
	                if (isLibraryDriver(driverName)) {
	                    switch (driverName) {
	                        case self.INDEXEDDB:
	                            return new Promise(function (resolve, reject) {
	                                resolve(__webpack_require__(1));
	                            });
	                        case self.LOCALSTORAGE:
	                            return new Promise(function (resolve, reject) {
	                                resolve(__webpack_require__(2));
	                            });
	                        case self.WEBSQL:
	                            return new Promise(function (resolve, reject) {
	                                resolve(__webpack_require__(4));
	                            });
	                    }
	                } else if (CustomDrivers[driverName]) {
	                    return Promise.resolve(CustomDrivers[driverName]);
	                }

	                return Promise.reject(new Error('Driver not found.'));
	            })();

	            getDriverPromise.then(callback, errorCallback);
	            return getDriverPromise;
	        };

	        LocalForage.prototype.getSerializer = function getSerializer(callback) {
	            var serializerPromise = new Promise(function (resolve, reject) {
	                resolve(__webpack_require__(3));
	            });
	            if (callback && typeof callback === 'function') {
	                serializerPromise.then(function (result) {
	                    callback(result);
	                });
	            }
	            return serializerPromise;
	        };

	        LocalForage.prototype.ready = function ready(callback) {
	            var self = this;

	            var promise = self._driverSet.then(function () {
	                if (self._ready === null) {
	                    self._ready = self._initDriver();
	                }

	                return self._ready;
	            });

	            promise.then(callback, callback);
	            return promise;
	        };

	        LocalForage.prototype.setDriver = function setDriver(drivers, callback, errorCallback) {
	            var self = this;

	            if (!isArray(drivers)) {
	                drivers = [drivers];
	            }

	            var supportedDrivers = this._getSupportedDrivers(drivers);

	            function setDriverToConfig() {
	                self._config.driver = self.driver();
	            }

	            function initDriver(supportedDrivers) {
	                return function () {
	                    var currentDriverIndex = 0;

	                    function driverPromiseLoop() {
	                        while (currentDriverIndex < supportedDrivers.length) {
	                            var driverName = supportedDrivers[currentDriverIndex];
	                            currentDriverIndex++;

	                            self._dbInfo = null;
	                            self._ready = null;

	                            return self.getDriver(driverName).then(function (driver) {
	                                self._extend(driver);
	                                setDriverToConfig();

	                                self._ready = self._initStorage(self._config);
	                                return self._ready;
	                            })['catch'](driverPromiseLoop);
	                        }

	                        setDriverToConfig();
	                        var error = new Error('No available storage method found.');
	                        self._driverSet = Promise.reject(error);
	                        return self._driverSet;
	                    }

	                    return driverPromiseLoop();
	                };
	            }

	            // There might be a driver initialization in progress
	            // so wait for it to finish in order to avoid a possible
	            // race condition to set _dbInfo
	            var oldDriverSetDone = this._driverSet !== null ? this._driverSet['catch'](function () {
	                return Promise.resolve();
	            }) : Promise.resolve();

	            this._driverSet = oldDriverSetDone.then(function () {
	                var driverName = supportedDrivers[0];
	                self._dbInfo = null;
	                self._ready = null;

	                return self.getDriver(driverName).then(function (driver) {
	                    self._driver = driver._driver;
	                    setDriverToConfig();
	                    self._wrapLibraryMethodsWithReady();
	                    self._initDriver = initDriver(supportedDrivers);
	                });
	            })['catch'](function () {
	                setDriverToConfig();
	                var error = new Error('No available storage method found.');
	                self._driverSet = Promise.reject(error);
	                return self._driverSet;
	            });

	            this._driverSet.then(callback, errorCallback);
	            return this._driverSet;
	        };

	        LocalForage.prototype.supports = function supports(driverName) {
	            return !!driverSupport[driverName];
	        };

	        LocalForage.prototype._extend = function _extend(libraryMethodsAndProperties) {
	            extend(this, libraryMethodsAndProperties);
	        };

	        LocalForage.prototype._getSupportedDrivers = function _getSupportedDrivers(drivers) {
	            var supportedDrivers = [];
	            for (var i = 0, len = drivers.length; i < len; i++) {
	                var driverName = drivers[i];
	                if (this.supports(driverName)) {
	                    supportedDrivers.push(driverName);
	                }
	            }
	            return supportedDrivers;
	        };

	        LocalForage.prototype._wrapLibraryMethodsWithReady = function _wrapLibraryMethodsWithReady() {
	            // Add a stub for each driver API method that delays the call to the
	            // corresponding driver method until localForage is ready. These stubs
	            // will be replaced by the driver methods as soon as the driver is
	            // loaded, so there is no performance impact.
	            for (var i = 0; i < LibraryMethods.length; i++) {
	                callWhenReady(this, LibraryMethods[i]);
	            }
	        };

	        LocalForage.prototype.createInstance = function createInstance(options) {
	            return new LocalForage(options);
	        };

	        return LocalForage;
	    })();

	    var localForage = new LocalForage();

	    exports['default'] = localForage;
	}).call(typeof window !== 'undefined' ? window : self);
	module.exports = exports['default'];

/***/ },
/* 1 */
/***/ function(module, exports) {

	// Some code originally from async_storage.js in
	// [Gaia](https://github.com/mozilla-b2g/gaia).
	'use strict';

	exports.__esModule = true;
	(function () {
	    'use strict';

	    var globalObject = this;
	    // Initialize IndexedDB; fall back to vendor-prefixed versions if needed.
	    var indexedDB = indexedDB || this.indexedDB || this.webkitIndexedDB || this.mozIndexedDB || this.OIndexedDB || this.msIndexedDB;

	    // If IndexedDB isn't available, we get outta here!
	    if (!indexedDB) {
	        return;
	    }

	    var DETECT_BLOB_SUPPORT_STORE = 'local-forage-detect-blob-support';
	    var supportsBlobs;
	    var dbContexts;

	    // Abstracts constructing a Blob object, so it also works in older
	    // browsers that don't support the native Blob constructor. (i.e.
	    // old QtWebKit versions, at least).
	    function _createBlob(parts, properties) {
	        parts = parts || [];
	        properties = properties || {};
	        try {
	            return new Blob(parts, properties);
	        } catch (e) {
	            if (e.name !== 'TypeError') {
	                throw e;
	            }
	            var BlobBuilder = globalObject.BlobBuilder || globalObject.MSBlobBuilder || globalObject.MozBlobBuilder || globalObject.WebKitBlobBuilder;
	            var builder = new BlobBuilder();
	            for (var i = 0; i < parts.length; i += 1) {
	                builder.append(parts[i]);
	            }
	            return builder.getBlob(properties.type);
	        }
	    }

	    // Transform a binary string to an array buffer, because otherwise
	    // weird stuff happens when you try to work with the binary string directly.
	    // It is known.
	    // From http://stackoverflow.com/questions/14967647/ (continues on next line)
	    // encode-decode-image-with-base64-breaks-image (2013-04-21)
	    function _binStringToArrayBuffer(bin) {
	        var length = bin.length;
	        var buf = new ArrayBuffer(length);
	        var arr = new Uint8Array(buf);
	        for (var i = 0; i < length; i++) {
	            arr[i] = bin.charCodeAt(i);
	        }
	        return buf;
	    }

	    // Fetch a blob using ajax. This reveals bugs in Chrome < 43.
	    // For details on all this junk:
	    // https://github.com/nolanlawson/state-of-binary-data-in-the-browser#readme
	    function _blobAjax(url) {
	        return new Promise(function (resolve, reject) {
	            var xhr = new XMLHttpRequest();
	            xhr.open('GET', url);
	            xhr.withCredentials = true;
	            xhr.responseType = 'arraybuffer';

	            xhr.onreadystatechange = function () {
	                if (xhr.readyState !== 4) {
	                    return;
	                }
	                if (xhr.status === 200) {
	                    return resolve({
	                        response: xhr.response,
	                        type: xhr.getResponseHeader('Content-Type')
	                    });
	                }
	                reject({ status: xhr.status, response: xhr.response });
	            };
	            xhr.send();
	        });
	    }

	    //
	    // Detect blob support. Chrome didn't support it until version 38.
	    // In version 37 they had a broken version where PNGs (and possibly
	    // other binary types) aren't stored correctly, because when you fetch
	    // them, the content type is always null.
	    //
	    // Furthermore, they have some outstanding bugs where blobs occasionally
	    // are read by FileReader as null, or by ajax as 404s.
	    //
	    // Sadly we use the 404 bug to detect the FileReader bug, so if they
	    // get fixed independently and released in different versions of Chrome,
	    // then the bug could come back. So it's worthwhile to watch these issues:
	    // 404 bug: https://code.google.com/p/chromium/issues/detail?id=447916
	    // FileReader bug: https://code.google.com/p/chromium/issues/detail?id=447836
	    //
	    function _checkBlobSupportWithoutCaching(idb) {
	        return new Promise(function (resolve, reject) {
	            var blob = _createBlob([''], { type: 'image/png' });
	            var txn = idb.transaction([DETECT_BLOB_SUPPORT_STORE], 'readwrite');
	            txn.objectStore(DETECT_BLOB_SUPPORT_STORE).put(blob, 'key');
	            txn.oncomplete = function () {
	                // have to do it in a separate transaction, else the correct
	                // content type is always returned
	                var blobTxn = idb.transaction([DETECT_BLOB_SUPPORT_STORE], 'readwrite');
	                var getBlobReq = blobTxn.objectStore(DETECT_BLOB_SUPPORT_STORE).get('key');
	                getBlobReq.onerror = reject;
	                getBlobReq.onsuccess = function (e) {

	                    var storedBlob = e.target.result;
	                    var url = URL.createObjectURL(storedBlob);

	                    _blobAjax(url).then(function (res) {
	                        resolve(!!(res && res.type === 'image/png'));
	                    }, function () {
	                        resolve(false);
	                    }).then(function () {
	                        URL.revokeObjectURL(url);
	                    });
	                };
	            };
	        })['catch'](function () {
	            return false; // error, so assume unsupported
	        });
	    }

	    function _checkBlobSupport(idb) {
	        if (typeof supportsBlobs === 'boolean') {
	            return Promise.resolve(supportsBlobs);
	        }
	        return _checkBlobSupportWithoutCaching(idb).then(function (value) {
	            supportsBlobs = value;
	            return supportsBlobs;
	        });
	    }

	    // encode a blob for indexeddb engines that don't support blobs
	    function _encodeBlob(blob) {
	        return new Promise(function (resolve, reject) {
	            var reader = new FileReader();
	            reader.onerror = reject;
	            reader.onloadend = function (e) {
	                var base64 = btoa(e.target.result || '');
	                resolve({
	                    __local_forage_encoded_blob: true,
	                    data: base64,
	                    type: blob.type
	                });
	            };
	            reader.readAsBinaryString(blob);
	        });
	    }

	    // decode an encoded blob
	    function _decodeBlob(encodedBlob) {
	        var arrayBuff = _binStringToArrayBuffer(atob(encodedBlob.data));
	        return _createBlob([arrayBuff], { type: encodedBlob.type });
	    }

	    // is this one of our fancy encoded blobs?
	    function _isEncodedBlob(value) {
	        return value && value.__local_forage_encoded_blob;
	    }

	    // Open the IndexedDB database (automatically creates one if one didn't
	    // previously exist), using any options set in the config.
	    function _initStorage(options) {
	        var self = this;
	        var dbInfo = {
	            db: null
	        };

	        if (options) {
	            for (var i in options) {
	                dbInfo[i] = options[i];
	            }
	        }

	        // Initialize a singleton container for all running localForages.
	        if (!dbContexts) {
	            dbContexts = {};
	        }

	        // Get the current context of the database;
	        var dbContext = dbContexts[dbInfo.name];

	        // ...or create a new context.
	        if (!dbContext) {
	            dbContext = {
	                // Running localForages sharing a database.
	                forages: [],
	                // Shared database.
	                db: null
	            };
	            // Register the new context in the global container.
	            dbContexts[dbInfo.name] = dbContext;
	        }

	        // Register itself as a running localForage in the current context.
	        dbContext.forages.push(this);

	        // Create an array of readiness of the related localForages.
	        var readyPromises = [];

	        function ignoreErrors() {
	            // Don't handle errors here,
	            // just makes sure related localForages aren't pending.
	            return Promise.resolve();
	        }

	        for (var j = 0; j < dbContext.forages.length; j++) {
	            var forage = dbContext.forages[j];
	            if (forage !== this) {
	                // Don't wait for itself...
	                readyPromises.push(forage.ready()['catch'](ignoreErrors));
	            }
	        }

	        // Take a snapshot of the related localForages.
	        var forages = dbContext.forages.slice(0);

	        // Initialize the connection process only when
	        // all the related localForages aren't pending.
	        return Promise.all(readyPromises).then(function () {
	            dbInfo.db = dbContext.db;
	            // Get the connection or open a new one without upgrade.
	            return _getOriginalConnection(dbInfo);
	        }).then(function (db) {
	            dbInfo.db = db;
	            if (_isUpgradeNeeded(dbInfo, self._defaultConfig.version)) {
	                // Reopen the database for upgrading.
	                return _getUpgradedConnection(dbInfo);
	            }
	            return db;
	        }).then(function (db) {
	            dbInfo.db = dbContext.db = db;
	            self._dbInfo = dbInfo;
	            // Share the final connection amongst related localForages.
	            for (var k in forages) {
	                var forage = forages[k];
	                if (forage !== self) {
	                    // Self is already up-to-date.
	                    forage._dbInfo.db = dbInfo.db;
	                    forage._dbInfo.version = dbInfo.version;
	                }
	            }
	        });
	    }

	    function _getOriginalConnection(dbInfo) {
	        return _getConnection(dbInfo, false);
	    }

	    function _getUpgradedConnection(dbInfo) {
	        return _getConnection(dbInfo, true);
	    }

	    function _getConnection(dbInfo, upgradeNeeded) {
	        return new Promise(function (resolve, reject) {
	            if (dbInfo.db) {
	                if (upgradeNeeded) {
	                    dbInfo.db.close();
	                } else {
	                    return resolve(dbInfo.db);
	                }
	            }

	            var dbArgs = [dbInfo.name];

	            if (upgradeNeeded) {
	                dbArgs.push(dbInfo.version);
	            }

	            var openreq = indexedDB.open.apply(indexedDB, dbArgs);

	            if (upgradeNeeded) {
	                openreq.onupgradeneeded = function (e) {
	                    var db = openreq.result;
	                    try {
	                        db.createObjectStore(dbInfo.storeName);
	                        if (e.oldVersion <= 1) {
	                            // Added when support for blob shims was added
	                            db.createObjectStore(DETECT_BLOB_SUPPORT_STORE);
	                        }
	                    } catch (ex) {
	                        if (ex.name === 'ConstraintError') {
	                            globalObject.console.warn('The database "' + dbInfo.name + '"' + ' has been upgraded from version ' + e.oldVersion + ' to version ' + e.newVersion + ', but the storage "' + dbInfo.storeName + '" already exists.');
	                        } else {
	                            throw ex;
	                        }
	                    }
	                };
	            }

	            openreq.onerror = function () {
	                reject(openreq.error);
	            };

	            openreq.onsuccess = function () {
	                resolve(openreq.result);
	            };
	        });
	    }

	    function _isUpgradeNeeded(dbInfo, defaultVersion) {
	        if (!dbInfo.db) {
	            return true;
	        }

	        var isNewStore = !dbInfo.db.objectStoreNames.contains(dbInfo.storeName);
	        var isDowngrade = dbInfo.version < dbInfo.db.version;
	        var isUpgrade = dbInfo.version > dbInfo.db.version;

	        if (isDowngrade) {
	            // If the version is not the default one
	            // then warn for impossible downgrade.
	            if (dbInfo.version !== defaultVersion) {
	                globalObject.console.warn('The database "' + dbInfo.name + '"' + ' can\'t be downgraded from version ' + dbInfo.db.version + ' to version ' + dbInfo.version + '.');
	            }
	            // Align the versions to prevent errors.
	            dbInfo.version = dbInfo.db.version;
	        }

	        if (isUpgrade || isNewStore) {
	            // If the store is new then increment the version (if needed).
	            // This will trigger an "upgradeneeded" event which is required
	            // for creating a store.
	            if (isNewStore) {
	                var incVersion = dbInfo.db.version + 1;
	                if (incVersion > dbInfo.version) {
	                    dbInfo.version = incVersion;
	                }
	            }

	            return true;
	        }

	        return false;
	    }

	    function getItem(key, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                var store = dbInfo.db.transaction(dbInfo.storeName, 'readonly').objectStore(dbInfo.storeName);
	                var req = store.get(key);

	                req.onsuccess = function () {
	                    var value = req.result;
	                    if (value === undefined) {
	                        value = null;
	                    }
	                    if (_isEncodedBlob(value)) {
	                        value = _decodeBlob(value);
	                    }
	                    resolve(value);
	                };

	                req.onerror = function () {
	                    reject(req.error);
	                };
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Iterate over all items stored in database.
	    function iterate(iterator, callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                var store = dbInfo.db.transaction(dbInfo.storeName, 'readonly').objectStore(dbInfo.storeName);

	                var req = store.openCursor();
	                var iterationNumber = 1;

	                req.onsuccess = function () {
	                    var cursor = req.result;

	                    if (cursor) {
	                        var value = cursor.value;
	                        if (_isEncodedBlob(value)) {
	                            value = _decodeBlob(value);
	                        }
	                        var result = iterator(value, cursor.key, iterationNumber++);

	                        if (result !== void 0) {
	                            resolve(result);
	                        } else {
	                            cursor['continue']();
	                        }
	                    } else {
	                        resolve();
	                    }
	                };

	                req.onerror = function () {
	                    reject(req.error);
	                };
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);

	        return promise;
	    }

	    function setItem(key, value, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = new Promise(function (resolve, reject) {
	            var dbInfo;
	            self.ready().then(function () {
	                dbInfo = self._dbInfo;
	                return _checkBlobSupport(dbInfo.db);
	            }).then(function (blobSupport) {
	                if (!blobSupport && value instanceof Blob) {
	                    return _encodeBlob(value);
	                }
	                return value;
	            }).then(function (value) {
	                var transaction = dbInfo.db.transaction(dbInfo.storeName, 'readwrite');
	                var store = transaction.objectStore(dbInfo.storeName);

	                // The reason we don't _save_ null is because IE 10 does
	                // not support saving the `null` type in IndexedDB. How
	                // ironic, given the bug below!
	                // See: https://github.com/mozilla/localForage/issues/161
	                if (value === null) {
	                    value = undefined;
	                }

	                var req = store.put(value, key);
	                transaction.oncomplete = function () {
	                    // Cast to undefined so the value passed to
	                    // callback/promise is the same as what one would get out
	                    // of `getItem()` later. This leads to some weirdness
	                    // (setItem('foo', undefined) will return `null`), but
	                    // it's not my fault localStorage is our baseline and that
	                    // it's weird.
	                    if (value === undefined) {
	                        value = null;
	                    }

	                    resolve(value);
	                };
	                transaction.onabort = transaction.onerror = function () {
	                    var err = req.error ? req.error : req.transaction.error;
	                    reject(err);
	                };
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function removeItem(key, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                var transaction = dbInfo.db.transaction(dbInfo.storeName, 'readwrite');
	                var store = transaction.objectStore(dbInfo.storeName);

	                // We use a Grunt task to make this safe for IE and some
	                // versions of Android (including those used by Cordova).
	                // Normally IE won't like `.delete()` and will insist on
	                // using `['delete']()`, but we have a build step that
	                // fixes this for us now.
	                var req = store['delete'](key);
	                transaction.oncomplete = function () {
	                    resolve();
	                };

	                transaction.onerror = function () {
	                    reject(req.error);
	                };

	                // The request will be also be aborted if we've exceeded our storage
	                // space.
	                transaction.onabort = function () {
	                    var err = req.error ? req.error : req.transaction.error;
	                    reject(err);
	                };
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function clear(callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                var transaction = dbInfo.db.transaction(dbInfo.storeName, 'readwrite');
	                var store = transaction.objectStore(dbInfo.storeName);
	                var req = store.clear();

	                transaction.oncomplete = function () {
	                    resolve();
	                };

	                transaction.onabort = transaction.onerror = function () {
	                    var err = req.error ? req.error : req.transaction.error;
	                    reject(err);
	                };
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function length(callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                var store = dbInfo.db.transaction(dbInfo.storeName, 'readonly').objectStore(dbInfo.storeName);
	                var req = store.count();

	                req.onsuccess = function () {
	                    resolve(req.result);
	                };

	                req.onerror = function () {
	                    reject(req.error);
	                };
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function key(n, callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            if (n < 0) {
	                resolve(null);

	                return;
	            }

	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                var store = dbInfo.db.transaction(dbInfo.storeName, 'readonly').objectStore(dbInfo.storeName);

	                var advanced = false;
	                var req = store.openCursor();
	                req.onsuccess = function () {
	                    var cursor = req.result;
	                    if (!cursor) {
	                        // this means there weren't enough keys
	                        resolve(null);

	                        return;
	                    }

	                    if (n === 0) {
	                        // We have the first key, return it if that's what they
	                        // wanted.
	                        resolve(cursor.key);
	                    } else {
	                        if (!advanced) {
	                            // Otherwise, ask the cursor to skip ahead n
	                            // records.
	                            advanced = true;
	                            cursor.advance(n);
	                        } else {
	                            // When we get here, we've got the nth key.
	                            resolve(cursor.key);
	                        }
	                    }
	                };

	                req.onerror = function () {
	                    reject(req.error);
	                };
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function keys(callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                var store = dbInfo.db.transaction(dbInfo.storeName, 'readonly').objectStore(dbInfo.storeName);

	                var req = store.openCursor();
	                var keys = [];

	                req.onsuccess = function () {
	                    var cursor = req.result;

	                    if (!cursor) {
	                        resolve(keys);
	                        return;
	                    }

	                    keys.push(cursor.key);
	                    cursor['continue']();
	                };

	                req.onerror = function () {
	                    reject(req.error);
	                };
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function executeCallback(promise, callback) {
	        if (callback) {
	            promise.then(function (result) {
	                callback(null, result);
	            }, function (error) {
	                callback(error);
	            });
	        }
	    }

	    var asyncStorage = {
	        _driver: 'asyncStorage',
	        _initStorage: _initStorage,
	        iterate: iterate,
	        getItem: getItem,
	        setItem: setItem,
	        removeItem: removeItem,
	        clear: clear,
	        length: length,
	        key: key,
	        keys: keys
	    };

	    exports['default'] = asyncStorage;
	}).call(typeof window !== 'undefined' ? window : self);
	module.exports = exports['default'];

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	// If IndexedDB isn't available, we'll fall back to localStorage.
	// Note that this will have considerable performance and storage
	// side-effects (all data will be serialized on save and only data that
	// can be converted to a string via `JSON.stringify()` will be saved).
	'use strict';

	exports.__esModule = true;
	(function () {
	    'use strict';

	    var globalObject = this;
	    var localStorage = null;

	    // If the app is running inside a Google Chrome packaged webapp, or some
	    // other context where localStorage isn't available, we don't use
	    // localStorage. This feature detection is preferred over the old
	    // `if (window.chrome && window.chrome.runtime)` code.
	    // See: https://github.com/mozilla/localForage/issues/68
	    try {
	        // If localStorage isn't available, we get outta here!
	        // This should be inside a try catch
	        if (!this.localStorage || !('setItem' in this.localStorage)) {
	            return;
	        }
	        // Initialize localStorage and create a variable to use throughout
	        // the code.
	        localStorage = this.localStorage;
	    } catch (e) {
	        return;
	    }

	    // Config the localStorage backend, using options set in the config.
	    function _initStorage(options) {
	        var self = this;
	        var dbInfo = {};
	        if (options) {
	            for (var i in options) {
	                dbInfo[i] = options[i];
	            }
	        }

	        dbInfo.keyPrefix = dbInfo.name + '/';

	        if (dbInfo.storeName !== self._defaultConfig.storeName) {
	            dbInfo.keyPrefix += dbInfo.storeName + '/';
	        }

	        self._dbInfo = dbInfo;

	        return new Promise(function (resolve, reject) {
	            resolve(__webpack_require__(3));
	        }).then(function (lib) {
	            dbInfo.serializer = lib;
	            return Promise.resolve();
	        });
	    }

	    // Remove all keys from the datastore, effectively destroying all data in
	    // the app's key/value store!
	    function clear(callback) {
	        var self = this;
	        var promise = self.ready().then(function () {
	            var keyPrefix = self._dbInfo.keyPrefix;

	            for (var i = localStorage.length - 1; i >= 0; i--) {
	                var key = localStorage.key(i);

	                if (key.indexOf(keyPrefix) === 0) {
	                    localStorage.removeItem(key);
	                }
	            }
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Retrieve an item from the store. Unlike the original async_storage
	    // library in Gaia, we don't modify return values at all. If a key's value
	    // is `undefined`, we pass that value to the callback function.
	    function getItem(key, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = self.ready().then(function () {
	            var dbInfo = self._dbInfo;
	            var result = localStorage.getItem(dbInfo.keyPrefix + key);

	            // If a result was found, parse it from the serialized
	            // string into a JS object. If result isn't truthy, the key
	            // is likely undefined and we'll pass it straight to the
	            // callback.
	            if (result) {
	                result = dbInfo.serializer.deserialize(result);
	            }

	            return result;
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Iterate over all items in the store.
	    function iterate(iterator, callback) {
	        var self = this;

	        var promise = self.ready().then(function () {
	            var dbInfo = self._dbInfo;
	            var keyPrefix = dbInfo.keyPrefix;
	            var keyPrefixLength = keyPrefix.length;
	            var length = localStorage.length;

	            // We use a dedicated iterator instead of the `i` variable below
	            // so other keys we fetch in localStorage aren't counted in
	            // the `iterationNumber` argument passed to the `iterate()`
	            // callback.
	            //
	            // See: github.com/mozilla/localForage/pull/435#discussion_r38061530
	            var iterationNumber = 1;

	            for (var i = 0; i < length; i++) {
	                var key = localStorage.key(i);
	                if (key.indexOf(keyPrefix) !== 0) {
	                    continue;
	                }
	                var value = localStorage.getItem(key);

	                // If a result was found, parse it from the serialized
	                // string into a JS object. If result isn't truthy, the
	                // key is likely undefined and we'll pass it straight
	                // to the iterator.
	                if (value) {
	                    value = dbInfo.serializer.deserialize(value);
	                }

	                value = iterator(value, key.substring(keyPrefixLength), iterationNumber++);

	                if (value !== void 0) {
	                    return value;
	                }
	            }
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Same as localStorage's key() method, except takes a callback.
	    function key(n, callback) {
	        var self = this;
	        var promise = self.ready().then(function () {
	            var dbInfo = self._dbInfo;
	            var result;
	            try {
	                result = localStorage.key(n);
	            } catch (error) {
	                result = null;
	            }

	            // Remove the prefix from the key, if a key is found.
	            if (result) {
	                result = result.substring(dbInfo.keyPrefix.length);
	            }

	            return result;
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function keys(callback) {
	        var self = this;
	        var promise = self.ready().then(function () {
	            var dbInfo = self._dbInfo;
	            var length = localStorage.length;
	            var keys = [];

	            for (var i = 0; i < length; i++) {
	                if (localStorage.key(i).indexOf(dbInfo.keyPrefix) === 0) {
	                    keys.push(localStorage.key(i).substring(dbInfo.keyPrefix.length));
	                }
	            }

	            return keys;
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Supply the number of keys in the datastore to the callback function.
	    function length(callback) {
	        var self = this;
	        var promise = self.keys().then(function (keys) {
	            return keys.length;
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Remove an item from the store, nice and simple.
	    function removeItem(key, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = self.ready().then(function () {
	            var dbInfo = self._dbInfo;
	            localStorage.removeItem(dbInfo.keyPrefix + key);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Set a key's value and run an optional callback once the value is set.
	    // Unlike Gaia's implementation, the callback function is passed the value,
	    // in case you want to operate on that value only after you're sure it
	    // saved, or something like that.
	    function setItem(key, value, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = self.ready().then(function () {
	            // Convert undefined values to null.
	            // https://github.com/mozilla/localForage/pull/42
	            if (value === undefined) {
	                value = null;
	            }

	            // Save the original value to pass to the callback.
	            var originalValue = value;

	            return new Promise(function (resolve, reject) {
	                var dbInfo = self._dbInfo;
	                dbInfo.serializer.serialize(value, function (value, error) {
	                    if (error) {
	                        reject(error);
	                    } else {
	                        try {
	                            localStorage.setItem(dbInfo.keyPrefix + key, value);
	                            resolve(originalValue);
	                        } catch (e) {
	                            // localStorage capacity exceeded.
	                            // TODO: Make this a specific error/event.
	                            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
	                                reject(e);
	                            }
	                            reject(e);
	                        }
	                    }
	                });
	            });
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function executeCallback(promise, callback) {
	        if (callback) {
	            promise.then(function (result) {
	                callback(null, result);
	            }, function (error) {
	                callback(error);
	            });
	        }
	    }

	    var localStorageWrapper = {
	        _driver: 'localStorageWrapper',
	        _initStorage: _initStorage,
	        // Default API, from Gaia/localStorage.
	        iterate: iterate,
	        getItem: getItem,
	        setItem: setItem,
	        removeItem: removeItem,
	        clear: clear,
	        length: length,
	        key: key,
	        keys: keys
	    };

	    exports['default'] = localStorageWrapper;
	}).call(typeof window !== 'undefined' ? window : self);
	module.exports = exports['default'];

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';

	exports.__esModule = true;
	(function () {
	    'use strict';

	    // Sadly, the best way to save binary data in WebSQL/localStorage is serializing
	    // it to Base64, so this is how we store it to prevent very strange errors with less
	    // verbose ways of binary <-> string data storage.
	    var BASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	    var BLOB_TYPE_PREFIX = '~~local_forage_type~';
	    var BLOB_TYPE_PREFIX_REGEX = /^~~local_forage_type~([^~]+)~/;

	    var SERIALIZED_MARKER = '__lfsc__:';
	    var SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER.length;

	    // OMG the serializations!
	    var TYPE_ARRAYBUFFER = 'arbf';
	    var TYPE_BLOB = 'blob';
	    var TYPE_INT8ARRAY = 'si08';
	    var TYPE_UINT8ARRAY = 'ui08';
	    var TYPE_UINT8CLAMPEDARRAY = 'uic8';
	    var TYPE_INT16ARRAY = 'si16';
	    var TYPE_INT32ARRAY = 'si32';
	    var TYPE_UINT16ARRAY = 'ur16';
	    var TYPE_UINT32ARRAY = 'ui32';
	    var TYPE_FLOAT32ARRAY = 'fl32';
	    var TYPE_FLOAT64ARRAY = 'fl64';
	    var TYPE_SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER_LENGTH + TYPE_ARRAYBUFFER.length;

	    // Get out of our habit of using `window` inline, at least.
	    var globalObject = this;

	    // Abstracts constructing a Blob object, so it also works in older
	    // browsers that don't support the native Blob constructor. (i.e.
	    // old QtWebKit versions, at least).
	    function _createBlob(parts, properties) {
	        parts = parts || [];
	        properties = properties || {};

	        try {
	            return new Blob(parts, properties);
	        } catch (err) {
	            if (err.name !== 'TypeError') {
	                throw err;
	            }

	            var BlobBuilder = globalObject.BlobBuilder || globalObject.MSBlobBuilder || globalObject.MozBlobBuilder || globalObject.WebKitBlobBuilder;

	            var builder = new BlobBuilder();
	            for (var i = 0; i < parts.length; i += 1) {
	                builder.append(parts[i]);
	            }

	            return builder.getBlob(properties.type);
	        }
	    }

	    // Serialize a value, afterwards executing a callback (which usually
	    // instructs the `setItem()` callback/promise to be executed). This is how
	    // we store binary data with localStorage.
	    function serialize(value, callback) {
	        var valueString = '';
	        if (value) {
	            valueString = value.toString();
	        }

	        // Cannot use `value instanceof ArrayBuffer` or such here, as these
	        // checks fail when running the tests using casper.js...
	        //
	        // TODO: See why those tests fail and use a better solution.
	        if (value && (value.toString() === '[object ArrayBuffer]' || value.buffer && value.buffer.toString() === '[object ArrayBuffer]')) {
	            // Convert binary arrays to a string and prefix the string with
	            // a special marker.
	            var buffer;
	            var marker = SERIALIZED_MARKER;

	            if (value instanceof ArrayBuffer) {
	                buffer = value;
	                marker += TYPE_ARRAYBUFFER;
	            } else {
	                buffer = value.buffer;

	                if (valueString === '[object Int8Array]') {
	                    marker += TYPE_INT8ARRAY;
	                } else if (valueString === '[object Uint8Array]') {
	                    marker += TYPE_UINT8ARRAY;
	                } else if (valueString === '[object Uint8ClampedArray]') {
	                    marker += TYPE_UINT8CLAMPEDARRAY;
	                } else if (valueString === '[object Int16Array]') {
	                    marker += TYPE_INT16ARRAY;
	                } else if (valueString === '[object Uint16Array]') {
	                    marker += TYPE_UINT16ARRAY;
	                } else if (valueString === '[object Int32Array]') {
	                    marker += TYPE_INT32ARRAY;
	                } else if (valueString === '[object Uint32Array]') {
	                    marker += TYPE_UINT32ARRAY;
	                } else if (valueString === '[object Float32Array]') {
	                    marker += TYPE_FLOAT32ARRAY;
	                } else if (valueString === '[object Float64Array]') {
	                    marker += TYPE_FLOAT64ARRAY;
	                } else {
	                    callback(new Error('Failed to get type for BinaryArray'));
	                }
	            }

	            callback(marker + bufferToString(buffer));
	        } else if (valueString === '[object Blob]') {
	            // Conver the blob to a binaryArray and then to a string.
	            var fileReader = new FileReader();

	            fileReader.onload = function () {
	                // Backwards-compatible prefix for the blob type.
	                var str = BLOB_TYPE_PREFIX + value.type + '~' + bufferToString(this.result);

	                callback(SERIALIZED_MARKER + TYPE_BLOB + str);
	            };

	            fileReader.readAsArrayBuffer(value);
	        } else {
	            try {
	                callback(JSON.stringify(value));
	            } catch (e) {
	                console.error("Couldn't convert value into a JSON string: ", value);

	                callback(null, e);
	            }
	        }
	    }

	    // Deserialize data we've inserted into a value column/field. We place
	    // special markers into our strings to mark them as encoded; this isn't
	    // as nice as a meta field, but it's the only sane thing we can do whilst
	    // keeping localStorage support intact.
	    //
	    // Oftentimes this will just deserialize JSON content, but if we have a
	    // special marker (SERIALIZED_MARKER, defined above), we will extract
	    // some kind of arraybuffer/binary data/typed array out of the string.
	    function deserialize(value) {
	        // If we haven't marked this string as being specially serialized (i.e.
	        // something other than serialized JSON), we can just return it and be
	        // done with it.
	        if (value.substring(0, SERIALIZED_MARKER_LENGTH) !== SERIALIZED_MARKER) {
	            return JSON.parse(value);
	        }

	        // The following code deals with deserializing some kind of Blob or
	        // TypedArray. First we separate out the type of data we're dealing
	        // with from the data itself.
	        var serializedString = value.substring(TYPE_SERIALIZED_MARKER_LENGTH);
	        var type = value.substring(SERIALIZED_MARKER_LENGTH, TYPE_SERIALIZED_MARKER_LENGTH);

	        var blobType;
	        // Backwards-compatible blob type serialization strategy.
	        // DBs created with older versions of localForage will simply not have the blob type.
	        if (type === TYPE_BLOB && BLOB_TYPE_PREFIX_REGEX.test(serializedString)) {
	            var matcher = serializedString.match(BLOB_TYPE_PREFIX_REGEX);
	            blobType = matcher[1];
	            serializedString = serializedString.substring(matcher[0].length);
	        }
	        var buffer = stringToBuffer(serializedString);

	        // Return the right type based on the code/type set during
	        // serialization.
	        switch (type) {
	            case TYPE_ARRAYBUFFER:
	                return buffer;
	            case TYPE_BLOB:
	                return _createBlob([buffer], { type: blobType });
	            case TYPE_INT8ARRAY:
	                return new Int8Array(buffer);
	            case TYPE_UINT8ARRAY:
	                return new Uint8Array(buffer);
	            case TYPE_UINT8CLAMPEDARRAY:
	                return new Uint8ClampedArray(buffer);
	            case TYPE_INT16ARRAY:
	                return new Int16Array(buffer);
	            case TYPE_UINT16ARRAY:
	                return new Uint16Array(buffer);
	            case TYPE_INT32ARRAY:
	                return new Int32Array(buffer);
	            case TYPE_UINT32ARRAY:
	                return new Uint32Array(buffer);
	            case TYPE_FLOAT32ARRAY:
	                return new Float32Array(buffer);
	            case TYPE_FLOAT64ARRAY:
	                return new Float64Array(buffer);
	            default:
	                throw new Error('Unkown type: ' + type);
	        }
	    }

	    function stringToBuffer(serializedString) {
	        // Fill the string into a ArrayBuffer.
	        var bufferLength = serializedString.length * 0.75;
	        var len = serializedString.length;
	        var i;
	        var p = 0;
	        var encoded1, encoded2, encoded3, encoded4;

	        if (serializedString[serializedString.length - 1] === '=') {
	            bufferLength--;
	            if (serializedString[serializedString.length - 2] === '=') {
	                bufferLength--;
	            }
	        }

	        var buffer = new ArrayBuffer(bufferLength);
	        var bytes = new Uint8Array(buffer);

	        for (i = 0; i < len; i += 4) {
	            encoded1 = BASE_CHARS.indexOf(serializedString[i]);
	            encoded2 = BASE_CHARS.indexOf(serializedString[i + 1]);
	            encoded3 = BASE_CHARS.indexOf(serializedString[i + 2]);
	            encoded4 = BASE_CHARS.indexOf(serializedString[i + 3]);

	            /*jslint bitwise: true */
	            bytes[p++] = encoded1 << 2 | encoded2 >> 4;
	            bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
	            bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
	        }
	        return buffer;
	    }

	    // Converts a buffer to a string to store, serialized, in the backend
	    // storage library.
	    function bufferToString(buffer) {
	        // base64-arraybuffer
	        var bytes = new Uint8Array(buffer);
	        var base64String = '';
	        var i;

	        for (i = 0; i < bytes.length; i += 3) {
	            /*jslint bitwise: true */
	            base64String += BASE_CHARS[bytes[i] >> 2];
	            base64String += BASE_CHARS[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
	            base64String += BASE_CHARS[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
	            base64String += BASE_CHARS[bytes[i + 2] & 63];
	        }

	        if (bytes.length % 3 === 2) {
	            base64String = base64String.substring(0, base64String.length - 1) + '=';
	        } else if (bytes.length % 3 === 1) {
	            base64String = base64String.substring(0, base64String.length - 2) + '==';
	        }

	        return base64String;
	    }

	    var localforageSerializer = {
	        serialize: serialize,
	        deserialize: deserialize,
	        stringToBuffer: stringToBuffer,
	        bufferToString: bufferToString
	    };

	    exports['default'] = localforageSerializer;
	}).call(typeof window !== 'undefined' ? window : self);
	module.exports = exports['default'];

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/*
	 * Includes code from:
	 *
	 * base64-arraybuffer
	 * https://github.com/niklasvh/base64-arraybuffer
	 *
	 * Copyright (c) 2012 Niklas von Hertzen
	 * Licensed under the MIT license.
	 */
	'use strict';

	exports.__esModule = true;
	(function () {
	    'use strict';

	    var globalObject = this;
	    var openDatabase = this.openDatabase;

	    // If WebSQL methods aren't available, we can stop now.
	    if (!openDatabase) {
	        return;
	    }

	    // Open the WebSQL database (automatically creates one if one didn't
	    // previously exist), using any options set in the config.
	    function _initStorage(options) {
	        var self = this;
	        var dbInfo = {
	            db: null
	        };

	        if (options) {
	            for (var i in options) {
	                dbInfo[i] = typeof options[i] !== 'string' ? options[i].toString() : options[i];
	            }
	        }

	        var dbInfoPromise = new Promise(function (resolve, reject) {
	            // Open the database; the openDatabase API will automatically
	            // create it for us if it doesn't exist.
	            try {
	                dbInfo.db = openDatabase(dbInfo.name, String(dbInfo.version), dbInfo.description, dbInfo.size);
	            } catch (e) {
	                return self.setDriver(self.LOCALSTORAGE).then(function () {
	                    return self._initStorage(options);
	                }).then(resolve)['catch'](reject);
	            }

	            // Create our key/value table if it doesn't exist.
	            dbInfo.db.transaction(function (t) {
	                t.executeSql('CREATE TABLE IF NOT EXISTS ' + dbInfo.storeName + ' (id INTEGER PRIMARY KEY, key unique, value)', [], function () {
	                    self._dbInfo = dbInfo;
	                    resolve();
	                }, function (t, error) {
	                    reject(error);
	                });
	            });
	        });

	        return new Promise(function (resolve, reject) {
	            resolve(__webpack_require__(3));
	        }).then(function (lib) {
	            dbInfo.serializer = lib;
	            return dbInfoPromise;
	        });
	    }

	    function getItem(key, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                dbInfo.db.transaction(function (t) {
	                    t.executeSql('SELECT * FROM ' + dbInfo.storeName + ' WHERE key = ? LIMIT 1', [key], function (t, results) {
	                        var result = results.rows.length ? results.rows.item(0).value : null;

	                        // Check to see if this is serialized content we need to
	                        // unpack.
	                        if (result) {
	                            result = dbInfo.serializer.deserialize(result);
	                        }

	                        resolve(result);
	                    }, function (t, error) {

	                        reject(error);
	                    });
	                });
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function iterate(iterator, callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;

	                dbInfo.db.transaction(function (t) {
	                    t.executeSql('SELECT * FROM ' + dbInfo.storeName, [], function (t, results) {
	                        var rows = results.rows;
	                        var length = rows.length;

	                        for (var i = 0; i < length; i++) {
	                            var item = rows.item(i);
	                            var result = item.value;

	                            // Check to see if this is serialized content
	                            // we need to unpack.
	                            if (result) {
	                                result = dbInfo.serializer.deserialize(result);
	                            }

	                            result = iterator(result, item.key, i + 1);

	                            // void(0) prevents problems with redefinition
	                            // of `undefined`.
	                            if (result !== void 0) {
	                                resolve(result);
	                                return;
	                            }
	                        }

	                        resolve();
	                    }, function (t, error) {
	                        reject(error);
	                    });
	                });
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function setItem(key, value, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                // The localStorage API doesn't return undefined values in an
	                // "expected" way, so undefined is always cast to null in all
	                // drivers. See: https://github.com/mozilla/localForage/pull/42
	                if (value === undefined) {
	                    value = null;
	                }

	                // Save the original value to pass to the callback.
	                var originalValue = value;

	                var dbInfo = self._dbInfo;
	                dbInfo.serializer.serialize(value, function (value, error) {
	                    if (error) {
	                        reject(error);
	                    } else {
	                        dbInfo.db.transaction(function (t) {
	                            t.executeSql('INSERT OR REPLACE INTO ' + dbInfo.storeName + ' (key, value) VALUES (?, ?)', [key, value], function () {
	                                resolve(originalValue);
	                            }, function (t, error) {
	                                reject(error);
	                            });
	                        }, function (sqlError) {
	                            // The transaction failed; check
	                            // to see if it's a quota error.
	                            if (sqlError.code === sqlError.QUOTA_ERR) {
	                                // We reject the callback outright for now, but
	                                // it's worth trying to re-run the transaction.
	                                // Even if the user accepts the prompt to use
	                                // more storage on Safari, this error will
	                                // be called.
	                                //
	                                // TODO: Try to re-run the transaction.
	                                reject(sqlError);
	                            }
	                        });
	                    }
	                });
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function removeItem(key, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                dbInfo.db.transaction(function (t) {
	                    t.executeSql('DELETE FROM ' + dbInfo.storeName + ' WHERE key = ?', [key], function () {
	                        resolve();
	                    }, function (t, error) {

	                        reject(error);
	                    });
	                });
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Deletes every item in the table.
	    // TODO: Find out if this resets the AUTO_INCREMENT number.
	    function clear(callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                dbInfo.db.transaction(function (t) {
	                    t.executeSql('DELETE FROM ' + dbInfo.storeName, [], function () {
	                        resolve();
	                    }, function (t, error) {
	                        reject(error);
	                    });
	                });
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Does a simple `COUNT(key)` to get the number of items stored in
	    // localForage.
	    function length(callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                dbInfo.db.transaction(function (t) {
	                    // Ahhh, SQL makes this one soooooo easy.
	                    t.executeSql('SELECT COUNT(key) as c FROM ' + dbInfo.storeName, [], function (t, results) {
	                        var result = results.rows.item(0).c;

	                        resolve(result);
	                    }, function (t, error) {

	                        reject(error);
	                    });
	                });
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Return the key located at key index X; essentially gets the key from a
	    // `WHERE id = ?`. This is the most efficient way I can think to implement
	    // this rarely-used (in my experience) part of the API, but it can seem
	    // inconsistent, because we do `INSERT OR REPLACE INTO` on `setItem()`, so
	    // the ID of each key will change every time it's updated. Perhaps a stored
	    // procedure for the `setItem()` SQL would solve this problem?
	    // TODO: Don't change ID on `setItem()`.
	    function key(n, callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                dbInfo.db.transaction(function (t) {
	                    t.executeSql('SELECT key FROM ' + dbInfo.storeName + ' WHERE id = ? LIMIT 1', [n + 1], function (t, results) {
	                        var result = results.rows.length ? results.rows.item(0).key : null;
	                        resolve(result);
	                    }, function (t, error) {
	                        reject(error);
	                    });
	                });
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function keys(callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                dbInfo.db.transaction(function (t) {
	                    t.executeSql('SELECT key FROM ' + dbInfo.storeName, [], function (t, results) {
	                        var keys = [];

	                        for (var i = 0; i < results.rows.length; i++) {
	                            keys.push(results.rows.item(i).key);
	                        }

	                        resolve(keys);
	                    }, function (t, error) {

	                        reject(error);
	                    });
	                });
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function executeCallback(promise, callback) {
	        if (callback) {
	            promise.then(function (result) {
	                callback(null, result);
	            }, function (error) {
	                callback(error);
	            });
	        }
	    }

	    var webSQLStorage = {
	        _driver: 'webSQLStorage',
	        _initStorage: _initStorage,
	        iterate: iterate,
	        getItem: getItem,
	        setItem: setItem,
	        removeItem: removeItem,
	        clear: clear,
	        length: length,
	        key: key,
	        keys: keys
	    };

	    exports['default'] = webSQLStorage;
	}).call(typeof window !== 'undefined' ? window : self);
	module.exports = exports['default'];

/***/ }
/******/ ])
});
;
var localForage = module.exports;
ns.modules.define('localForage', [], function (provide) { provide(localForage); }); })(ns);
/* eslint-enable */
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

            // http://stackoverflow.com/questions/1382107/whats-a-good-way-to-extend-error-in-javascript
            if (Error.captureStackTrace) {
                Error.captureStackTrace(this, CloudError);
            } else {
                this.stack = (new Error()).stack;
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
 * @returns {Promise} Объект-Promise, который будет либо подтверждён
 * при успешной аутентификации, либо отклонён в противном случае.
 * @static
 */
Client.prototype.initialize = function (options) {
    return new ns.Promise(function(resolve, reject) {
        ns.modules.require([
            'cloud.dataSyncApi.config',
            'component.util',
            'cloud.Error',
            'Promise',
            'global'
        ], (function (config, util, Error, Promise, global) {
            if (!options) {
                reject(new Error({
                    message: '`options` Parameter Required'
                }));
            } else if (!options.key && !options.token && !options.with_credentials) {
                reject(new Error({
                    message: 'Either `options.key` or `options.token` Parameter Required'
                }));
            } else {
                if (options.token) {
                    this._token = options.token;
                    this._initialized = true;
                    resolve();
                } else if (options.with_credentials) {
                    this._withCredentials = true;
                    this._initialized = true;
                    resolve();
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
                                reject(new Error({
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
                                        resolve(this._token);
                                    }
                                } catch (e) {
                                    // do nothing
                                }
                            }
                        }.bind(this), 100);
                    } else {
                        reject(new Error({
                            code: 401
                        }));
                    }
                }
            }
        }).bind(this));
    }.bind(this));
};

/**
 * @name cloud.client.isInitialized
 * @function
 * @returns {Boolean} true - сессия инициализирована, клиент
 * аутентифицирован, false в противном случае.
 * @static
 */
Client.prototype.isInitialized = function () {
    return this._initialized;
};

// #12 — оставлено для обратной совместимости.
Client.prototype.isInitiaized = Client.prototype.isInitialized

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

Client.prototype.withCredentials = function () {
    return this._withCredentials;
}

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
 * @class Основной неймпспейс для работы с DataSync API.
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
     * @param {Boolean} [options.use_client_storage = false] true — закэшировать
     * снапшот базы в клиентском браузере (используя indexedDb или сходные технологии),
     * false — не кэшировать.
     * @param {String} [options.collection_id] Фильтр по имени коллекции. При установке
     * этого фильтра база будет содержать только объекты с указанным collection_id, все
     * объекты с отличным от collection_id идентификатором коллекции будут пропускаться.
     * @returns {Promise} Объект-Promise, который будет либо подтверждён экземпляром
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
     * @returns {Promise} Объект-Promise, который будет либо подтверждён
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
     * @returns {Promise} Объект-Promise, который будет либо подтверждён
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
     * @returns {Promise} Объект-Promise, который будет либо подтверждён
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
     * @returns {Promise} Объект-Promise, который будет либо подтверждён
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
     * @returns {Promise} Объект-Promise, который будет либо подтверждён
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

    /**
     * Закрывает все текущие открытые соединения со всеми
     * базами данных.
     * @returns {Promise} Объект-promise, который будет
     * подтверждён по завершении операции.
     */
    closeAllDatabases: function () {
        return this._require(['cloud.dataSyncApi.Database']).spread(function (Database) {
            Database.closeAll();
            return null;
        });
    },

    _require: function (modules) {
        return new ns.Promise(function(resolve) {
            ns.modules.require(modules, function () {
                resolve([].slice.call(arguments));
            });
        });
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

        return new ns.Promise(function(resolve, reject) {
            ns.modules.require(['cloud.Error'], function (Error) {
                reject(new Error({
                    code: code,
                    message: message
                }));
            });
        });
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
            },

            cancelableCallback: function (callback) {
                var canceled = false,
                    result = function () {
                        if (!canceled) {
                            callback.apply(null, [].slice.call(arguments));
                        }
                    };

                result.cancel = function () {
                    canceled = true;
                };

                return result;
            }
        };

    provide(util);
});
ns.modules.define('component.xhr', [
    'global',
    'Promise',
    'cloud.Error'
], function (provide, global, Promise, Error) {
    var XMLHttpRequest = global.XMLHttpRequest,
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
     * @returns {Promise} Объект-Promise, который будет либо подтверждён
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

        var xhr = new XMLHttpRequest(),
            headers = options.headers || {},
            method = options.method || 'GET';

        if (method != 'GET' && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
        if (!headers['X-Requested-With']) {
            headers['X-Requested-With'] = 'XMLHttpRequest';
        }

        return new Promise(function(resolve, reject) {
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
                        reject(new Error({
                            message: 'JSON Parse Error ' + result.data
                        }));
                    }
                }
                resolve(result);
            };

            xhr.onerror = function () {
                reject(new Error({
                    code: 500
                }));
            };

            xhr.open(method, baseUrl, true);

            Object.keys(headers).forEach(function (key) {
                xhr.setRequestHeader(key, headers[key]);
            });
            if (options.withCredentials) {
                xhr.withCredentials = true;
            }

            if (typeof options.data != 'undefined') {
                xhr.send(typeof options.data == 'string' ?
                    options.data :
                    JSON.stringify(options.data)
                );
            } else {
                xhr.send();
            }

            setTimeout(function() {
                reject(new Error({
                    message: 'ERRTIMEOUT'
                }));
            }, options.timeout || 30000);
        }).catch(function (e) {
            if (e && e.message === 'ERRTIMEOUT') {
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
ns.modules.define('cloud.dataSyncApi.Database', [
    'cloud.dataSyncApi.config',
    'cloud.dataSyncApi.http',
    'cloud.client',
    'cloud.dataSyncApi.DatasetController',
    'cloud.dataSyncApi.watcher',
    'cloud.dataSyncApi.Transaction',
    'cloud.dataSyncApi.Operation',
    'cloud.dataSyncApi.politics',
    'cloud.Error',
    'component.util',
    'Promise'
], function (provide,
    config, http, client,
    DatasetController, watcher,
    Transaction, Operation, politics,
    Error, util, Promise) {

    var databases = [];
        /**
         * @class Класс, представляющий методы для работы с базой данных.
         * Возвращается функцией {@link cloud.dataSyncApi.openDatabase}.
         * @see cloud.dataSyncApi.openDatabase
         * @name cloud.dataSyncApi.Database
         * @noconstructor
         */
    var Database = function (options) {
            this._id = options.database_id;
            this._context = options.context;
            this._token = options.token;
            this._locked = true;
            this._datasetController = null;
            this._pendingCallbacks = [];
            this._possiblyMissedDelta = null;
            this._missedDelta = null;
            this._datasetController = null;
            this._collectionId = options.collection_id;

            this._listeners = {
                update: []
            };

            databases.push(this);

            return DatasetController.create(options).then(function (controller) {
                this._datasetController = controller;
                this._locked = false;
                if (options.background_sync || typeof options.background_sync == 'undefined') {
                    this._watchCallback = this.update.bind(this);
                    watcher.subscribe(this, this._watchCallback);
                }
                return this;
            }, null, this);
        };

    Database.closeAll = function () {
        databases.slice().forEach(function (database) {
            database.close();
        });
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
         * @returns {Promise} Объект-Promise, который будет либо подтверждён
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

        close: function () {
            if (this._watchCallback) {
                watcher.unsubscribe(this, this._watchCallback);
                this._watchCallback = null;
            }
            if (this._datasetController) {
                this._datasetController.close();
                this._datasetController = null;
            }
            this._locked = true;

            var index = databases.indexOf(this);
            if (index != -1) {
                databases.splice(index, 1);
            }
        },

        _explicitUpdate: function () {
            var oldRevision = this.getRevision();
            return this._datasetController.update({
                possiblyMissedDelta: this._possiblyMissedDelta
            }).then(function (res) {
                if (res.missedDeltaFound) {
                    this._missedDelta = this._possiblyMissedDelta;
                    this._possiblyMissedDelta = null;
                }
                if (res.revision != oldRevision) {
                    this._notify('update', res.revision);
                }
                return res.revision;
            }, null, this);
        },

        _executeExclusiveTask: function (callback) {
            var gone = this._datasetController.isGone();

            if (gone) {
                return gone;
            }   

            return new Promise(function(resolve, reject) {
                this._pendingCallbacks.push([callback, resolve, reject]);
                if (!this._locked) {
                    this._proceedPendingQueue();
                }
            }.bind(this));

        },

        _proceedPendingQueue: function () {
            var parameters = this._pendingCallbacks.shift(),
                callback = parameters[0],
                resolve = parameters[1],
                reject = parameters[2];

            this._locked = true;

            callback().then(function (res) {
                resolve(res);
                this._locked = false;
                if (this._pendingCallbacks.length) {
                    this._proceedPendingQueue();
                }
            }, function (e) {
                reject(e);
                this._locked = false;
                if (this._pendingCallbacks.length) {
                    this._proceedPendingQueue();
                }
            }, this);
        },

        /**
         * @returns {Integer} Текущую (получшенную при последнем обновлении)
         * версию БД.
         */
        getRevision: function () {
            return this._datasetController.getDataset().getRevision();
        },

        /**
         * @returns {String} Идентификатор БД.
         */
        getDatabaseId: function () {
            return this._id;
        },

        /**
         * @returns {String} Контекст БД (app или user).
         */
        getContext: function () {
            return this._context;
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
                }).bind(this),
                this._collectionId
            );
        },

        _patch: function (parameters, politicsKey) {
            return new Promise(function(resolve, reject) {
                var dataset = this._datasetController.getDataset(),
                    delta_id = parameters.delta_id,

                    success = function () {
                        resolve(dataset.getRevision());
                    },

                    fail = (function (e) {
                        if (e.postDeltaFail) {
                            this._possiblyMissedDelta = e.postDeltaFail;
                        }

                        reject(e);
                    }).bind(this);

                if (this._missedDelta && delta_id == this._missedDelta) {
                    this._missedDelta = null;
                    success();
                } else {
                    var preparedOperation = prepareOperation(dataset, parameters, politicsKey),
                        operations = preparedOperation.operations,
                        conflicts = preparedOperation.conflicts,
                        revisionHistory = preparedOperation.revisionHistory,
                        delta = {
                            base_revision: this.getRevision(),
                            delta_id: parameters.delta_id,
                            changes: operations.map(Operation.json.serialize)
                        };

                    if (conflicts.length) {
                        fail(new Error({
                            code: 409,
                            conflicts: conflicts,
                            revisionHistory: revisionHistory
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
                                    dataset.applyDeltas([delta]);
                                    success();
                                    this._notify('update', revision);
                                },
                                function (e) {
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
            }.bind(this));
        },

        _postDeltas: function (delta) {
            return new Promise(function(resolve, reject) {
                http.postDeltas(delta).then(function (res) {
                    if (res.code == 200 || res.code == 201) {
                        resolve(Number(res.headers.etag));
                    } else {
                        if (res.code >= 500) {
                            res.postDeltaFail = delta.delta_id;
                        }
                        reject(new Error(res));
                    }
                }, function (e) {
                    e.postDeltaFail = delta.delta_id;
                    reject(e);
                }, this);
            });
        },

        /**
         * @param {String} [collection_id] Идентификатор коллекции. Необязателен,
         * если задан фильтр по коллекции.
         * @param {String} record_id Идентификатор записи.
         * @returns {cloud.dataSyncApi.Record} Запись.
         */
        getRecord: function (collection_id, record_id) {
            return this._datasetController.getDataset().getRecord(collection_id, record_id);
        },

        /**
         * @returns {Integer} Число записей в базе.
         */
        getRecordsCount: function () {
            return this._datasetController.getDataset().getLength();
        },

        /**
         * @param {String} [collection_id] Фильтр по идентификатору коллекции.
         * @returns {cloud.dataSyncApi.Iterator} Возвращает итератор по записям в БД.
         */
        iterator: function (collection_id) {
            return this._datasetController.getDataset().iterator(collection_id);
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

            var it = this._datasetController.getDataset().iterator(collection_id),
                item = it.next(),
                index = 0;

            while (!item.done) {
                callback.call(context || null, item.value, index++);
                item = it.next();
            }

            return this;
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
            result = dataset.dryRun(parameters.base_revision, operations),
            conflicts = result.conflicts;

        if (conflicts.length && politicsKey) {
            operations = politics[politicsKey](operations, conflicts);
            result = dataset.dryRun(parameters.base_revision, operations);
            conflicts = result.conflicts;
        }
        return {
            operations: operations,
            conflicts: conflicts,
            revisionHistory: result.revisionHistory
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
    var Dataset = function (revision, records, parameters) {
            var index = this._index = {},
                collectionId = this._collectionId = parameters && parameters.collection_id,
                collectionPolicy = parameters && parameters.collection_policy || 'restrict';

            this._revision = Number(revision);
            this._revisionHistory = [];

            this._records = records.map(function (record) {
                if (!(record instanceof Record)) {
                    if (collectionId && !record.collection_id) {
                        record = util.extend({
                            collection_id: collectionId
                        }, record);
                    }
                    record = new Record(record);
                }
                return record;
            });

            if (collectionId) {
                this._records = this._records.filter(function (record) {
                    if (record.getCollectionId() != collectionId) {
                        if (collectionPolicy == 'restrict') {
                            throw new Error({
                                message: '`collection_id` Must Match Current Filter'
                            });
                        }
                        return false;
                    }
                    return true;
                });
            }

            this._records.forEach(function (record) {
                var collection_id = record.getCollectionId(),
                    record_id = record.getRecordId();
                if (!index[collection_id]) {
                    index[collection_id] = {};
                }
                if (index[collection_id][record_id]) {
                    throw new Error ({
                        message: 'Record with `collection_id` and `record_id` Provided Already Exists',
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
        deserialize: function (json, parameters) {
            return new Dataset(
                json.revision,
                json.records.items.map(function (item) {
                    return Record.json.deserialize(item);
                }),
                parameters
            );
        },

        serialize: function (dataset) {
            var items = [],
                it = dataset.iterator(),
                item = it.next();

            while (!item.done) {
                items.push(Record.json.serialize(item.value));
                item = it.next();
            }

            return {
                revision: dataset.getRevision(),
                records: {
                    items: items
                }
            };
        }
    };

    util.defineClass(Dataset, {
        getRecord: function (collection_id, record_id) {
            if (this._collectionId) {
                if (!record_id) {
                    record_id = collection_id;
                    collection_id = this._collectionId;
                } else {
                    if (collection_id != this._collectionId) {
                        throw new Error({
                            message: '`collection_id` Parameter Must Match Collection Filter'
                        });
                    }
                }
            }
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

        getCollectionId: function () {
            return this._collectionId;
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
                revision = this._revision,
                collectionIdFilter = this._collectionId;

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

                    if (!collectionIdFilter || collection_id == collectionIdFilter) {
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
                    }
                });

                revisionHistory.push({
                    base_revision: delta.base_revision,
                    delta_id: delta.delta_id,
                    revision: delta.revision,
                    alteredRecords: alteredRecords,
                    changes: delta.changes
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
            var collection_id = options.collection_id || this._collectionId,
                record_id = options.record_id,
                revision = options.revision,
                position = this._locateRevision(revision);

            if (position != -1) {
                for (var i = position; i < this._revisionHistory.length; i++) {
                    var item = this._revisionHistory[i];

                    if (item.alteredRecords[collection_id] && item.alteredRecords[collection_id][record_id]) {
                        return true;
                    }
                }
            }

            return false;
        },

        _locateRevision: function (revision) {
            for (var i = 0; i < this._revisionHistory.length; i++) {
                if (this._revisionHistory[i].base_revision == revision) {
                    return i;
                }
            }
            return -1;
        },

        dryRun: function (revision, operations) {
            var conflicts = [],
                index = copyIndex(this._index),
                originalIndex = this._index,
                collectionIdFilter = this._collectionId;

            operations.forEach(function (operation, i) {
                var collection_id = operation.getCollectionId(),
                    record_id = operation.getRecordId();

                if (!collectionIdFilter || collection_id == collectionIdFilter) {
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
                }
            }, this);

            return {
                conflicts: conflicts,
                revisionHistory: conflicts.length ? this._getRevisionHistory(revision) : []
            };
        },

        _getRevisionHistory: function (fromRevision) {
            var position = this._locateRevision(fromRevision);
            if (position != -1) {
                var result = [];

                for (var i = position; i < this._revisionHistory.length; i++) {
                    var item = this._revisionHistory[i];

                    result.push({
                        base_revision: item.base_revision,
                        revision: item.revision,
                        delta_id: item.delta_id,
                        operations: makeOperations(item.changes)
                    });
                }

                return result;
            } else {
                return [];
            }
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

    function makeOperations (changes) {
        return changes.map(function (change) {
            return Operation.json.deserialize(change);
        });
    }

    provide(Dataset);
});
ns.modules.define('cloud.dataSyncApi.DatasetController', [
    'cloud.dataSyncApi.config',
    'cloud.dataSyncApi.http',
    'cloud.dataSyncApi.Dataset',
    'cloud.dataSyncApi.cache',
    'cloud.Error',
    'component.util',
    'Promise'
], function (provide,
     config, http, Dataset, cache, Error,
     util, Promise) {

    /**
     * @ignore
     * @class Контроллер набора данных, создаёт и обновляет
     * {@link cloud.dataSyncApi.Dataset} и следит за локальным кэшированием.
     * @name cloud.dataSyncApi.DatasetController
     */
    var DatasetController = function (options) {
            this._options = options || {};
            this._gone = false;
            this._updatePromise = null;
            this._dataset = null;
            return this._createDataset().then(function () {
                return this;
            }, null, this);
        };

    DatasetController.create = function (options) {
        return new DatasetController(options);
    };

    util.defineClass(DatasetController, /** @lends cloud.dataSyncApi.DatasetController */{
        getDataset: function () {
            return this._dataset;
        },

        isGone: function () {
            return this._gone;
        },

        close: function () {
            this._onGone();
        },

        _createDataset: function () {
            return http.putDatabase(this._options).then(function (res) {
                if (res.code != 200 && res.code != 201) {
                    throw new Error({
                        code: res.code
                    });
                } else {
                    return this._getSnapshot(res.data);
                }
            }, null, this);
        },

        _getSnapshot: function (metadata) {
            var options = this._options,
                handle = this._databaseHandle = metadata.handle;

            if (handle && options.use_client_storage) {
                return cache.getDataset(options.context, handle, options.collection_id).then(function (dataset) {
                    return this._initDataset(dataset, {
                        need_update: true
                    });
                }, function () {
                    return this._getHttpSnapshot();
                }, this);
            } else {
                return this._getHttpSnapshot();
            }
        },

        _getHttpSnapshot: function () {
            var options = this._options;

            return http.getSnapshot(this._options).then(function (res) {
                if (res.code == 200) {
                    return this._initDataset(Dataset.json.deserialize(
                        res.data, {
                            collection_id: options.collection_id
                        }
                    ));
                } else {
                    throw new Error({
                        code: res.code
                    });
                }
            }, null, this);
        },

        _initDataset: function (dataset, parameters) {
            var options = this._options;

            this._dataset = dataset;

            if (parameters && parameters.need_update) {
                return this.update().fail(function (e) {
                    if (e.code == 410) {
                        return this._getHttpSnapshot(options);
                    } else {
                        throw e;
                    }
                }, this);
            } else {
                return this._saveSnapshot().always(function () {
                    return Promise.resolve();
                });
            }
        },

        _saveSnapshot: function () {
            if (this._options.use_client_storage && this._databaseHandle) {
                return cache.saveDataset(
                    this._options.context,
                    this._databaseHandle,
                    this._dataset
                );
            } else {
                return Promise.resolve();
            }
        },

        update: function (parameters) {
            if (this._gone) {
                return this._gone;
            } else if (!this._updatePromise) {
                this._updatePromise = this._applyDeltas(parameters).then(function (res) {
                    return this._saveSnapshot().always(function () {
                        this._updatePromise = null;
                        return res;
                    }, this);
                }, function (e) {
                    if (e.code == 410) {
                        this._onGone();
                    }
                    this._updatePromise = null;
                    throw e;
                }, this);
            }

            return this._updatePromise;
        },

        _applyDeltas: function (parameters) {
            var dataset = this._dataset;

            return getDeltas(this._options, dataset.getRevision()).then(function (deltas) {
                if (deltas.length) {
                    dataset.applyDeltas(deltas);
                }

                var missedDeltaFound = false;
                if (parameters && parameters.possiblyMissedDelta) {
                    deltas.forEach(function (delta) {
                        if (delta.delta_id == parameters.possiblyMissedDelta) {
                            missedDeltaFound = true;
                        }
                    })
                }

                return {
                    revision: dataset.getRevision(),
                    missedDeltaFound: missedDeltaFound
                };
            });
        },

        _onGone: function () {
            this._gone = Promise.reject({
                code: 410,
                message: 'Database snapshot outdated'
            });
        }
    });

    function getDeltas (options, baseRevision) {
        var deltas = [],

            getChunk = function (baseRevision) {
                return http.getDeltas(util.extend({}, options, {
                    base_revision: baseRevision,
                    limit: config.deltaLimit
                })).then(function (res) {
                    if (res.code != 200) {
                        return Promise.reject(new Error({
                            code: res.code
                        }));
                    }

                    return res.data;
                });
            },

            onChunk = function (data) {
                var targetRevision = data.revision;
                deltas.push(data.items);

                var recievedRevision = data.items.length ?
                        data.items[data.items.length - 1].revision :
                        targetRevision;

                if (recievedRevision == targetRevision) {
                    return [].concat.apply([], deltas);
                }

                return getChunk(recievedRevision).then(onChunk);
            };

        return getChunk(baseRevision).then(onChunk);
    }

    provide(DatasetController);
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
            if (asDelta || !json.fields) {
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
         * @returns {cloud.dataSyncApi.Value|undefined} Значение поля.
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
    var Transaction = function (database, patchCallback, collectionId) {
            this._database = database;
            this._patchCallback = patchCallback;
            this._deltaId = 'ya_cloud_data_js_api_1_' + Math.random().toString();
            this._baseRevision = database.getRevision();
            this._operations = [];
            this._collectionId = collectionId;
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
            var collectionId = this._collectionId;
            this._operations = this._operations.concat([].concat(operations).map(function (operation) {
                if (!(operation instanceof Operation)) {
                    if (collectionId && !operation.collectionId) {
                        operation = util.extend({
                            collection_id: collectionId
                        }, operation);
                    }
                    operation = new Operation(operation);
                }
                if (collectionId && operation.getCollectionId() != collectionId) {
                    throw new Error('`collection_id` Parameter Value Must Match Current Filter');
                }
                return operation;
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
            var defaultCollectionId = this._collectionId;
            return this.addOperations([].concat(records).map(function (record) {
                var options = castOperationOptions('insert', record, defaultCollectionId);

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
            var defaultCollectionId = this._collectionId;
            return this.addOperations([].concat(records).map(function (record) {
                return new Operation(castOperationOptions('delete', record, defaultCollectionId));
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
            var options = castOperationOptions('set', record, this._collectionId);

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
            var options = castOperationOptions('update', record, this._collectionId);

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
            var options = castOperationOptions('update', record, this._collectionId);

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
            var options = castOperationOptions('update', record, this._collectionId);

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
            var options = castOperationOptions('update', record, this._collectionId);

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
            var options = castOperationOptions('update', record, this._collectionId);

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

    function castOperationOptions (type, record, defaultCollectionId) {
        var options = {
                type: type
            };

        if (record instanceof Record) {
            options.collection_id = record.getCollectionId();
            options.record_id = record.getRecordId();
        } else {
            options.collection_id = record.collection_id || defaultCollectionId;
            options.record_id = record.record_id;
        }

        if (defaultCollectionId && options.collection_id != defaultCollectionId) {
            throw new Error('`collection_id` Parameter Must Match Current Filter');
        }

        return options;
    }

    provide(Transaction);
});

ns.modules.define('cloud.dataSyncApi.Value', [
    'component.util',
    'cloud.Error',
    'global'
], function (provide, util, Error, global) {
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

    util.defineClass(Value, /** @lends cloud.dataSyncApi.Value.prototype */ {
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
                        value instanceof global.ArrayBuffer ||
                        (value.buffer && value.buffer instanceof global.ArrayBuffer)
                    )) {
                    return 'binary'
                } else if (value instanceof Date) {
                    return 'datetime';
                } else if (value instanceof Boolean) {
                    return 'boolean';
                } else if (value instanceof Number) {
                    return 'double';
                } else if (global.Array.isArray(value)) {
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
                    if (value instanceof global.ArrayBuffer) {
                        return global.btoa(String.fromCharCode.apply(null, new global.Uint8Array(value)));
                    } else if (value.buffer && value.buffer instanceof global.ArrayBuffer) {
                        return global.btoa(String.fromCharCode.apply(null, new global.Uint8Array(value.buffer)));
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
            result = new global.Uint8Array(outLength),
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

ns.modules.define('cloud.dataSyncApi.cache', [
    'localForage',
    'Promise',
    'cloud.Error',
    'cloud.dataSyncApi.config',
    'cloud.dataSyncApi.Dataset'
], function (provide, localForage, Promise, Error, config, Dataset) {
    localForage.config({
        name: config.prefix,
        storeName: config.prefix
    });

    var cache = {
            getDatasetKey: function (context, handle, collectionId) {
                if (collectionId) {
                    return 'dataset_' + context + '_' + handle + '|' + collectionId;
                } else {
                    return 'dataset_' + context + '_' + handle;
                }
            },

            getDataset: function (context, handle, collectionId) {
                if (collectionId) {
                    return getDatasetFromStorage(
                        this.getDatasetKey(context, handle, collectionId),
                        collectionId
                    ).then(
                        null,
                        function (e) {
                            if (e.code == 404) {
                                return getDatasetFromStorage(
                                    this.getDatasetKey(context, handle),
                                    collectionId
                                );
                            } else {
                                throw e;
                            }
                        },
                        this
                    );

                } else {
                    return getDatasetFromStorage(
                        this.getDatasetKey(context, handle)
                    );
                }
            },

            saveDataset: function (context, handle, dataset) {
                return this.saveItem(
                    this.getDatasetKey(context, handle, dataset.getCollectionId()),
                    JSON.stringify(Dataset.json.serialize(dataset))
                );
            },

            saveItem: function (key, value) {
                return localForage.setItem(key, value).fail(function () {
                        return cache.clear().always(function () {
                            return Promise.reject(new Error({
                                code: 500
                            }));
                        });
                });
            },

            clear: function () {
                return localForage.clear();
            }
        };

    function getDatasetFromStorage (key, collectionId) {
        var parameters = collectionId ? {
                collection_id: collectionId,
                collection_policy: 'skip'
            } : null;

        return localForage.getItem(key).then(function (data) {
            if (!data) {
                return Promise.reject(new Error({
                    code: 404
                }));
            } else {
                try {
                    data = Dataset.json.deserialize(
                        JSON.parse(data),
                        parameters
                    );
                } catch (e) {
                    data = null;
                    // Something went wrong, cache is corrupted
                    return cache.clear().always(function () {
                        return Promise.reject(new Error({
                            code: 500
                        }));
                    });
                }
            }

            return data;
        });
    }

    provide (cache);
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
        prefix: 'yandex_data_sync_api_v1',
        deltaLimit: 100,
        backgroundSyncInterval: 5000
    });
});
ns.modules.define('cloud.dataSyncApi.http', [
    'cloud.dataSyncApi.config',
    'cloud.client',
    'component.xhr',
    'component.util',
    'global',
    'Promise',
    'cloud.Error'
], function (provide, config, client, xhr, util, global, Promise, Error) {
    var check = function (options) {
            if (!options) {
                return fail('`options` Parameter Required');
            }
            if (!allowedContext(options.context)) {
                return fail('Invalid `options.context` Value');
            }
            return null;
        },
        allowedContext = function (context) {
            return context && config.contexts[context];
        },
        fail = function (code, message) {
            if (!message) {
                message = code;
                code = 400;
            }
            return Promise.reject(new Error({
                code: code,
                message: message
            }));
        },
        addAuthorization = function (options, rawParams) {
            var params = util.extend({}, rawParams);
            if (!params.headers) {
                params.headers = {};
            } else {
                params.headers = util.extend({}, params.headers);
            }

            if (options.token) {
                params.headers.Authorization = 'OAuth ' + options.token;
                return Promise.resolve(params);
            } else if (client.isInitialized()) {
                if (client.withCredentials()) {
                    params.withCredentials = true;
                } else {
                    params.headers.Authorization = 'OAuth ' + client.getToken();
                }
                return Promise.resolve(params);
            } else {
                if (options && (options.authorize_if_needed || typeof options.authorize_if_needed == 'undefined')) {
                    return client.initialize(options).then(function () {
                        if (client.withCredentials()) {
                            params.withCredentials = true;
                        } else {
                            params.headers.Authorization = 'OAuth ' + client.getToken();
                        }
                        return params;
                    })
                } else {
                    return Promise.reject(new Error({
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

            return check(options) || addAuthorization(options, {
                queryParams: queryParams,
                parse: true
            }).then(function (params) {
                return xhr(url, params);
            });
        },

        putDatabase: function (options) {
            var error = check(options);
            if (!error && typeof options.database_id != 'string') {
                error = fail('`options.database_id` Parameter Required');
            }

            return error || addAuthorization(options, {
                method: 'PUT',
                parse: true
            }).then(function (params) {
                return xhr(
                    config.apiHost + 'v1/data/' +
                        options.context + '/databases/' + options.database_id,
                    params
                );
            });
        },

        deleteDatabase: function (options) {
            var error = check(options);
            if (!error && typeof options.database_id != 'string') {
                error = fail('`options.database_id` Parameter Required');
            }

            return error || addAuthorization(options, {
                method: 'DELETE',
                // NB: DELETE database отдаёт пустой ответ при успехе
                parse: false
            }).then(function (params) {
                return xhr(
                    config.apiHost + 'v1/data/' +
                        options.context + '/databases/' + options.database_id,
                    params
                );
            });
        },

        getSnapshot: function (options) {
            return check(options) || addAuthorization(options, {
                parse: true,
                queryParams: {
                    collection_id: options && options.collection_id
                }
            }).then(function (params) {
                return xhr(
                    config.apiHost + 'v1/data/' +
                        options.context + '/databases/' +
                        options.database_id + '/snapshot',
                    params
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

            return error || addAuthorization(options, {
                method: 'GET',
                queryParams: {
                    base_revision: options.base_revision,
                    limit: typeof options.limit == 'undefined' ? 100 : options.limit
                },
                parse: true
            }).then(function (params) {
                return xhr(
                    config.apiHost + 'v1/data/' +
                        options.context + '/databases/' +
                        options.database_id + '/deltas',
                    params
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

            return error || addAuthorization(options, {
                method: 'POST',
                headers: {
                    'If-Match': options.base_revision
                },
                parse: true,
                data: options.data
            }).then(function (params) {
                return xhr(
                    config.apiHost + 'v1/data/' +
                        options.context + '/databases/' +
                        options.database_id + '/deltas',
                    params
                );
            });
        },

        subscribe: function (options) {
            return addAuthorization(options, {
                parse: true
            }).then(function (params) {
                return xhr(
                    config.apiHost + 'v1/data/subscriptions/web?databases_ids=' +
                        encodeURIComponent(options.database_ids.join(',')),
                    params
                );
            });
        }
    });
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
ns.modules.define('cloud.dataSyncApi.watcher', [
    'global',
    'cloud.dataSyncApi.config',
    'cloud.dataSyncApi.syncEngine.PushEngine',
    'cloud.dataSyncApi.syncEngine.PollEngine'
], function (provide, global, config, PushEngine, PollEngine) {
    var watcher = {
            _engine: null,

            _restartTimeout: null,

            _databases: {},

            subscribe: function (database, callback) {
                var id = database.getContext() + ':' + database.getDatabaseId(),
                    isNew = false;

                if (!this._databases[id]) {
                    isNew = true;
                }

                if (isNew) {
                    this.getEngine().addDatabase(database);
                    this._databases[id] = {
                        database: database,
                        callbacks: []
                    };
                }
                this._databases[id].callbacks.push(callback);
            },

            unsubscribe: function (database, callback) {
                var id = database.getContext() + ':' + database.getDatabaseId(),
                    params = this._databases[id],
                    isLast = false,
                    index = params ? params.callbacks.indexOf(callback) : -1;

                if (index != -1) {
                    params.callbacks.splice(index, 1);
                    if (!params.callbacks.length) {
                        delete this._databases[id];
                        isLast = true;
                    }
                }

                if (isLast) {
                    this.getEngine().removeDatabase(database);
                }
            },

            getEngine: function () {
                if (!this._engine) {
                    this.setupEngine();
                }
                return this._engine;
            },

            setupEngine: function () {
                if (this._restartTimeout) {
                    global.clearTimeout(this._restartTimeout);
                    this._restartTimeout = null;
                }

                this._engine = this.createEngine(
                    this._onUpdate.bind(this),
                    this._onEngineFail.bind(this)
                );

                var databases = this._databases,
                    keys = Object.keys(databases);
                if (keys.length) {
                    this._engine.addDatabase(keys.map(function (key) {
                        return databases[key].database;
                    }));
                }
            },

            createEngine: function (onUpdate, onEngineFail) {
                var engineClass = PushEngine.isSupported() ? PushEngine : PollEngine;
                return new engineClass({
                    onUpdate: onUpdate,
                    onFail: onEngineFail
                });
            },

            teardownEngine: function () {
                if (this._engine) {
                    this._engine.removeAll();
                    this._engine = null;
                }
            },

            _onUpdate: function (key, revision) {
                var db = this._databases[key];
                if (db.database.getRevision() != revision) {
                    db.callbacks.slice().forEach(function (callback) {
                        try {
                            callback(revision);
                        } catch (e) {
                            // do nothing
                        }
                    });
                }
            },

            _onEngineFail: function () {
                this.teardownEngine();
                if (!this._restartTimeout) {
                    this._restartTimeout = global.setTimeout(function () {
                        this._restartTimeout = null;
                        this.setupEngine();
                    }.bind(this), config.backgroundSyncInterval);
                }
            }
        };

    provide(watcher);
});
ns.modules.define('cloud.dataSyncApi.syncEngine.AbstractEngine', [
    'global',
    'Promise',
    'component.util',
    'cloud.dataSyncApi.http'
], function (provide, global, Promise, util, http) {
    var AbstractEngine = function (options) {
            this._options = options || {};
            this._databases = {};
            this._cancelableCallbacks = [];
        };

    AbstractEngine.isSupported = function () {
        return true;
    };

    util.defineClass(AbstractEngine, {
        addDatabase: function (databases) {
            databases = [].concat(databases);
            databases.forEach(function (database) {
                this._databases[this.getDatabaseKey(database)] = {
                    database: database,
                    lastKnownRevision: database.getRevision()
                };
            }, this);
            this.restart();
        },

        removeDatabase: function (databases) {
            databases = [].concat(databases);
            databases.forEach(function (database) {
                delete this._databases[this.getDatabaseKey(database)];
            }, this);
            this.restart();
        },

        removeAll: function () {
            this._databases = {};
            this._cancelCallbacks();
        },

        getDatabases: function () {
            return this._databases;
        },

        addFailableCallback: function (callback) {
            this._cancelableCallbacks.push(callback);
        },

        removeFailableCallback: function (callback) {
            var index = this._cancelableCallbacks.indexOf(callback);
            if (index != -1) {
                this._cancelableCallbacks.splice(index, 1);
            }
        },

        restart: function () {
            this._cancelCallbacks();
        },

        fail: function (e) {
            this._databases = [];
            this._cancelCallbacks();
            this._options.onFail(e);
        },

        updateRevisions: function () {
            return Promise.all(Object.keys(this._databases).map(function (key) {
                var database = this._databases[key].database,
                    callback = util.cancelableCallback(function (response) {
                        if (response.code != 200) {
                            this.fail(response);
                        } else {
                            this.removeFailableCallback(callback);
                            this.checkDatabaseRevision(key, response.data.revision);
                        }
                    }.bind(this));

                this.addFailableCallback(callback);
                return http.getDatabases({
                    context: database.getContext(),
                    database_id: database.getDatabaseId()
                }).then(callback, this.fail, this);
            }.bind(this)));
        },

        checkDatabaseRevision: function (key, revision) {
            if (Number(this._databases[key].lastKnownRevision) < Number(revision)) {
                this._databases[key].lastKnownRevision = revision;
                this._options.onUpdate(key, revision);
            }
        },

        getDatabaseKey: function (database) {
            return database.getContext() + ':' + database.getDatabaseId();
        },

        getOptions: function () {
            return this._options;
        },

        _cancelCallbacks: function () {
            this._cancelableCallbacks.slice().forEach(function (callback) {
                callback.cancel();
            });
            this._cancelableCallbacks = [];
        }
    });

    provide(AbstractEngine);
});
ns.modules.define('cloud.dataSyncApi.syncEngine.PollEngine', [
    'global',
    'component.util',
    'cloud.dataSyncApi.config',
    'cloud.dataSyncApi.syncEngine.AbstractEngine'
], function (provide, global, util, config, AbstractEngine) {
    var PollEngine = function (options) {
            PollEngine.superclass.constructor.call(this, options);
            this._updateTimeout = null;
        };

    PollEngine.isSupported = function () {
        return true;
    };

    util.defineClass(PollEngine, AbstractEngine, {
        removeAll: function () {
            if (this._updateTimeout) {
                global.clearTimeout(this._updateTimeout);
                this._updateTimeout = null;
            }
            PollEngine.superclass.removeAll.call(this);
        },

        restart: function () {
            if (this._updateTimeout) {
                global.clearTimeout(this._updateTimeout);
                this._updateTimeout = null;
            }

            this.updateRevisions().then(function () {
                this._updateTimeout = global.setTimeout(
                    this.restart.bind(this),
                    this.getOptions().backgroundSyncInterval || config.backgroundSyncInterval
                );
            }, this);
        },

        fail: function (e) {
            if (this._updateTimeout) {
                global.clearTimeout(this._updateTimeout);
                this._updateTimeout = null;
            }
            PollEngine.superclass.fail.call(this, e);
        }
    });

    provide(PollEngine);
});
ns.modules.define('cloud.dataSyncApi.syncEngine.PushEngine', [
    'global',
    'component.util',
    'cloud.dataSyncApi.http',
    'cloud.dataSyncApi.syncEngine.AbstractEngine',
    'cloud.Error'
], function (provide, global, util, http, AbstractEngine, Error) {
    var PushEngine = function (options) {
            PushEngine.superclass.constructor.call(this, options);
            this._getSubscriptionCallback = null;
        };

    PushEngine.isSupported = function () {
        return typeof global.WebSocket == 'function';
    };

    util.defineClass(PushEngine, AbstractEngine, {
        removeAll: function () {
            this._teardownSocket();
            PushEngine.superclass.removeAll.call(this);
        },

        restart: function () {
            this._teardownSocket();
            PushEngine.superclass.restart.call(this);

            var ids = Object.keys(this.getDatabases());
            this._getSubscriptionCallback = util.cancelableCallback(function (response) {
                this.removeFailableCallback(this._getSubscriptionCallback);
                this._getSubscriptionCallback = null;
                if (response.code == 200) {
                    this._setupSocket(response.data.href);
                    this.updateRevisions();
                } else {
                    this.fail(new Error(response));
                }
            }.bind(this));

            this.addFailableCallback(this._getSubscriptionCallback);

            http.subscribe({
                database_ids: ids
            }).then(this._getSubscriptionCallback, this._fail, this);
        },

        fail: function (e) {
            this._teardownSocket();
            PushEngine.superclass.fail.call(this, e);
        },

        _setupSocket: function (href) {
            try {
                this._ws = new global.WebSocket(href.replace(/^http(s)?\:/, 'wss:'));
            } catch (e) {
                this._ws = null;
                this.fail(e);
            }
            if (this._ws) {
                this._ws.onmessage = this._onPush.bind(this);
                this._ws.onerror = this.fail.bind(this);
            }
        },

        _teardownSocket: function () {
            if (this._ws) {
                this._ws.onmessage = this._ws.onerror = null;
                this._ws.close();
                this._ws = null;
            }
        },

        _onPush: function (e) {
            var data = JSON.parse(e.data);
            if (data.operation == 'datasync_database_changed') {
                var message = JSON.parse(data.message);

                this.checkDatabaseRevision(
                    message.context + ':' + message.database_id,
                    message.revision
                );
            }
        }
    });

    provide(PushEngine);
});
ns.modules.define('global', function (provide) {
    provide(global);
});
if (typeof global.module == 'object') {
    global.module.exports = ns;
} else {
    var ya = global.ya || (global.ya = {
            modules: ns.modules,
            Promise: ns.Promise
        });
    ya.cloud = ns.cloud;
}
})(this);