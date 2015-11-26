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
    'vow',
    'localForage'
], function (provide,
             config, http, client,
             Dataset, Transaction, Operation, politics,
             Error, util, vow, localForage) {
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
            this._useClientStorage = options.use_client_storage;
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
                    this._getSnapshot(res.data, options).then(function () {
                        this._locked = false;
                        deferred.resolve(this);
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
         * @ignore
         * Читает снапшот базы по HTTP или из локального хранилица.
         * @param {Object} metadata Метаданные базы.
         * @param {Object} options Опции открытия базы.
         * @returns {vow.Promise} Объект-Promise.
         */
        _getSnapshot: function (metadata, options) {
            var deferred = vow.defer(),
                getHttpSnapshot = this._getHttpSnapshot.bind(this),
                createDataset = this._createDataset.bind(this);

            if (metadata.handle && this._useClientStorage) {
                this._databaseHandle = metadata.handle;

                localForage.getItem(
                    'yandex_cloud_data_sync_v1_' + metadata.handle,
                    function (error, data) {
                        try {
                            data = JSON.parse(data);
                        } catch (e) {
                            data = null;
                        }

                        if (error || !data) {
                            deferred.resolve(getHttpSnapshot(options));
                        } else {
                            deferred.resolve(createDataset(data, {
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

        _getHttpSnapshot: function (options) {
            return http.getSnapshot(options).then(function (res) {
                if (res.code == 200) {
                    this._createDataset(res.data);
                } else {
                    throw new Error({
                        code: res.code
                    });
                }
            }, null, this);
        },

        _createDataset: function (data, options) {
            var deferred = vow.defer();

            this._dataset = Dataset.json.deserialize(data);

            if (options && options.need_update) {
                this._explicitUpdate().then(function () {
                    deferred.resolve();
                }, function (e) {
                    if (e.code == 410) {
                        deferred.resolve(this._getHttpSnapshot(options));
                    } else {
                        deferred.reject(e);
                    }
                }, this);
            } else {
                if (this._useClientStorage) {
                    this._saveSnapshot();
                }
                deferred.resolve();
            }

            return deferred.promise();
        },

        _saveSnapshot: function () {
            if (this._useClientStorage && this._databaseHandle) {
                localForage.setItem(
                    'yandex_cloud_data_sync_v1_' + this._databaseHandle,
                    JSON.stringify(Dataset.json.serialize(this._dataset))
                );
            }
        },

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
                this._saveSnapshot();
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
            result = dataset.dryRun(parameters.base_revision, operations);
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
