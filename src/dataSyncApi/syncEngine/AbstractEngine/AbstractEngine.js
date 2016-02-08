ns.modules.define('cloud.dataSyncApi.syncEngine.AbstractEngine', [
    'global',
    'vow',
    'component.util',
    'cloud.dataSyncApi.http',
    'cloud.Error'
], function (provide, global, vow, util, http, Error) {
    var AbstractEngine = function (options) {
            this._options = options;
            this._databases = {};
            this._cancelOnFail = [];
        };

    AbstractEngine.isSupported = function () {
        return true;
    };

    util.defineClass(AbstractEngine, {
        addDatabase: function (database) {
            this._databases[this.getDatabaseKey(database)] = {
                database: database,
                lastKnownRevision: database.getRevision()
            };
            this.restart();
        },

        removeDatabase: function (database) {
            delete this._databases[this.getDatabaseKey(database)];
            this.restart();
        },

        getDatabases: function () {
            return this._databases;
        },

        addFailableCallback: function (callback) {
            this._cancelOnFail.push(callback);
        },

        removeFailableCallback: function (callback) {
            var index = this._cancelOnFail.indexOf(callback);
            if (index != -1) {
                this._cancelOnFail.splice(index, 1);
            }
        },

        restart: function () {
            throw new Error('Abstract Method');
        },

        fail: function (e) {
            this._databases = [];
            this._cancelOnFail.forEach(function (callback) {
                callback.cancel();
            });
            this._cancelOnFail = [];

            this._options.onFail(e);
        },

        updateRevisions: function () {
            return vow.all(Object.keys(this._databases).map(function (key) {
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
            if (this._databases[key].lastKnownRevision != revision) {
                this._databases[key].lastKnownRevision = revision;
                this._options.onUpdate(key, revision);
            }
        },

        getDatabaseKey: function (database) {
            return database.getContext() + ':' + database.getDatabaseId();
        }
    });

    provide(AbstractEngine);
});