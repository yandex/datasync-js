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