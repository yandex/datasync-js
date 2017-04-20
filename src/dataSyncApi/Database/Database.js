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
