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