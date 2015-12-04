ns.modules.define('cloud.dataSyncApi.DatasetController', [
    'cloud.dataSyncApi.config',
    'cloud.dataSyncApi.http',
    'cloud.dataSyncApi.Dataset',
    'cloud.Error',
    'component.util',
    'vow',
    'localForage'
], function (provide,
     config, http, Dataset, Error,
     util, vow, localForage) {

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
            this._prefix = config.storagePrefix + '_' + this._options.context + '_';
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
                getHttpSnapshot = this._getHttpSnapshot.bind(this),
                initDataset = this._initDataset.bind(this),
                deferred = vow.defer();

            if (metadata.handle && options.use_client_storage) {
                this._databaseHandle = metadata.handle;

                localForage.getItem(
                    this._prefix + metadata.handle,
                    function (error, data) {
                        try {
                            data = JSON.parse(data);
                        } catch (e) {
                            data = null;
                        }

                        if (error || !data) {
                            deferred.resolve(getHttpSnapshot(options));
                        } else {
                            deferred.resolve(initDataset(data, {
                                needUpdate: true
                            }));
                        }
                    }
                );
            } else {
                deferred.resolve(getHttpSnapshot(options));
            }

            return deferred.promise();
        },

        _getHttpSnapshot: function () {
            return http.getSnapshot(this._options).then(function (res) {
                if (res.code == 200) {
                    return this._initDataset(res.data);
                } else {
                    if (res.code == 410) {
                        this._onGone();
                    }
                    throw new Error({
                        code: res.code
                    });
                }
            }, null, this);
        },

        _initDataset: function (data, parameters) {
            var deferred = vow.defer();

            this._dataset = Dataset.json.deserialize(data);

            if (parameters && parameters.need_update) {
                this.update().then(function () {
                    deferred.resolve();
                }, function (e) {
                    if (e.code == 410) {
                        deferred.resolve(this._getHttpSnapshot(options));
                    } else {
                        deferred.reject(e);
                    }
                }, this);
            } else {
                if (this._options.use_client_storage) {
                    this._saveSnapshot();
                }
                deferred.resolve();
            }

            return deferred.promise();
        },

        _saveSnapshot: function () {
            if (this._options.use_client_storage && this._databaseHandle) {
                localForage.setItem(
                    this._prefix + this._databaseHandle,
                    JSON.stringify(Dataset.json.serialize(this._dataset))
                );
            }
        },

        update: function (parameters) {
            if (this._gone) {
                return this._gone;
            } else if (!this._updatePromise) {
                this._updatePromise = this._applyDeltas(parameters).then(function (res) {
                    this._saveSnapshot();
                    this._updatePromise = null;
                    return res;
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
            this._gone = vow.reject({
                code: 410,
                message: 'Database snapshot outdated'
            });
        }
    });

    function getDeltas (options, baseRevision) {
        var deltas = [],
            deferred = vow.defer(),

            fail = function (e) {
                deferred.reject(e);
            },

            getChunk = function (baseRevision) {
                return http.getDeltas(util.extend({}, options, {
                    base_revision: baseRevision,
                    limit: config.deltaLimit
                })).then(function (res) {
                    if (res.code == 200) {
                        return res.data;
                    } else {
                        throw new Error({
                            code: res.code
                        });
                    }
                });
            },

            onChunk = function (data) {
                var targetRevision = data.revision;
                deltas.push(data.items);

                var recievedRevision = data.items.length ?
                        data.items[data.items.length - 1].revision :
                        targetRevision;

                if (recievedRevision == targetRevision) {
                    onEnd();
                } else {
                    getChunk(recievedRevision).then(onChunk, fail);
                }
            },

            onEnd = function () {
                deltas = [].concat.apply([], deltas);
                deferred.resolve(deltas);
            };

        getChunk(baseRevision).then(onChunk, fail);

        return deferred.promise();
    }

    provide(DatasetController);
});
