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
                    this._databases[id] = {
                        database: database,
                        callbacks: []
                    };
                    isNew = true;
                }

                this._databases[id].callbacks.push(callback);

                if (isNew) {
                    if (!this._engine) {
                        this.createEngine();
                    }
                    this._engine.addDatabase(database);
                }
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
                    if (Object.keys(this._databases).length) {
                        this._engine.removeDatabase(database);
                    } else {
                        this._engine.removeAll();
                        this._engine = null;
                    }
                }
            },

            createEngine: function () {
                var engineClass = PushEngine.isSupported() ? PushEngine : PollEngine;
                this._engine = new engineClass({
                    onUpdate: this._onUpdate.bind(this),
                    onFail: this._onEngineFail.bind(this)
                });
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
                if (!this._restartTimeout) {
                    this._restartTimeout = global.setTimeout(function () {
                        this._restartTimeout = null;
                        this.createEngine(Object.keys(this._databases).map(function (key) {
                            return this._databases[key].database;
                        }.bind(this)));
                    }.bind(this), config.backgroundSyncInterval);
                }
            }
        };

    provide(watcher);
});