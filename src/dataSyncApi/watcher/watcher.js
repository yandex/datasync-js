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
                        } catch (e) {}
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