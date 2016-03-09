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