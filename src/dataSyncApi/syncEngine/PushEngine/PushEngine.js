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
        restart: function () {
            var ids = Object.keys(this.getDatabases());

            if (this._getSubscriptionCallback) {
                this.removeFailableCallback(this._getSubscriptionCallback);
                this._getSubscriptionCallback.cancel();
            }

            this._getSubscriptionCallback = util.cancelableCallback(function (response) {
                this.removeFailableCallback(this._getSubscriptionCallback);
                this._getSubscriptionCallback = null;
                if (response.code == 200) {
                    var data = JSON.parse(response.data);
                    this._setupSocket(data.href);
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
            if (this._ws) {
                this._ws.onmessage = this._ws.onerror = null;
                this._ws.close();
                this._ws = null;
            }
            PushEngine.superclass.fail.call(this, e);
        },

        _setupSocket: function (href) {
            try {
                this._ws = new global.WebSocket(href.replace(/^http(s)?\:/, 'wss:'));
            } catch (e) {
                this.fail(e);
            }
            this._ws.onmessage = this._onPush.bind(this);
            this._ws.onerror = this.fail.bind(this);
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