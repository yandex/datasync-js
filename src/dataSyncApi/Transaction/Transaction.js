ns.modules.define('cloud.dataSyncApi.Transaction', [
    'cloud.dataSyncApi.Record',
    'cloud.dataSyncApi.Operation',
    'cloud.dataSyncApi.FieldOperation',
    'component.util'
], function (provide, Record, Operation, FieldOperation, util) {
        /**
         * @noconstructor
         * @class Транзакция БД. Позволяет модифицировать
         * данные и отправить изменения на удалённый сервер.
         * @see cloud.dataSyncApi.Database.createTransaction
         * @name cloud.dataSyncApi.Transaction
         */
    var Transaction = function (database, patchCallback, collectionId) {
            this._database = database;
            this._patchCallback = patchCallback;
            this._deltaId = 'ya_cloud_data_js_api_1_' + Math.random().toString();
            this._baseRevision = database.getRevision();
            this._operations = [];
            this._collectionId = collectionId;
        };

    util.defineClass(Transaction, /** @lends cloud.dataSyncApi.Transaction.prototype */ {
        /**
         * Добавляет произвольный набор операций к транзакции.
         * @param {cloud.dataSyncApi.Operation|cloud.dataSyncApi.Operation[]|Object|Object[]} operations Операция
         * или массив операций для добавления в виде экземпляров класса {@link cloud.dataSyncApi.Operation}
         * либо приводимых к нему json-объектов.
         * @returns {cloud.dataSyncApi.Transaction} Ссылку на себя.
         */
        addOperations: function (operations) {
            var collectionId = this._collectionId;
            this._operations = this._operations.concat([].concat(operations).map(function (operation) {
                if (!(operation instanceof Operation)) {
                    if (collectionId && !operation.collectionId) {
                        operation = util.extend({
                            collection_id: collectionId
                        }, operation);
                    }
                    operation = new Operation(operation);
                }
                if (collectionId && operation.getCollectionId() != collectionId) {
                    throw new Error('`collection_id` Parameter Value Must Match Current Filter');
                }
                return operation;
            }));
            return this;
        },

        /**
         * Применяет транзакцию к базе данных и пересылает изменения
         * на удалённый сервер.
         * @param {String} [politics] Политика разрешения конфликтов.
         * Если указана политика 'theirs', то, в случае конфликта, будет
         * произведено обновление БД и повторная попытка переслать
         * те из локальных изменений, которые не конфликтуют с текущим
         * состоянием БД, и, таким образом, автоматически
         * разрешить конфликт.
         * @see cloud.dataSyncApi.Conflict
         * @returns {vow.Promise} Объект-Promise, который будет подтверждён
         * в случае успеха операции списком выполненных операций
         * или отклонён с одной из следующих ошибок:
         * <ul>
         *     <li>400 — запрос некорректен;</li>
         *     <li>401 — пользователь не авторизован;</li>
         *     <li>403 — доступ запрещён;</li>
         *     <li>409 — произошёл конфликт, в поле conflicts объекта-ошибки
         * будет содержаться описание конфликтующих изменений в виде
         * массива json-объектов с полями index и conflict;</li>
         *     <li>429 — превышен лимит количества запросов;</li>
         *     <li>500 — невозможно выполнить запрос.</li>
         * </ul>
         */
        push: function (politics) {
            return this._patchCallback({
                delta_id: this._deltaId,
                base_revision: this._baseRevision,
                operations: this._operations
            }, politics);
        },

        /**
         * @returns {cloud.dataSyncApi.Database} Базу данных, к которой
         * создана транзакция.
         */
        getDatabase: function () {
            return this._database;
        },

        /**
         * @returns {String} Номер ревизии, актуальной на момент
         * создания транзации.
         */
        getBaseRevision: function () {
            return this._baseRevision;
        },

        /**
         * @returns {cloud.dataSyncApi.Operation[]} Массив операций,
         * из которых состоит транзакция.
         */
        getOperations: function () {
            return this._operations.slice();
        },

        /**
         * Добавляет новые записи.
         * @param {cloud.dataSyncApi.Record|cloud.dataSyncApi.Record[]|Object|Object[]} records
         * Записи для добавления в виде экземпляров класса {@link cloud.dataSyncApi.Record} либо
         * json-объектов, приводимых к ним.
         * @returns {cloud.dataSyncApi.Transaction} Ссылку на себя.
         */
        insertRecords: function (records) {
            var defaultCollectionId = this._collectionId;
            return this.addOperations([].concat(records).map(function (record) {
                var options = castOperationOptions('insert', record, defaultCollectionId);

                if (record instanceof Record) {
                    options.field_operations = record.getFieldIds().map(function (key) {
                        return new FieldOperation({
                            type: 'set',
                            field_id: key,
                            value: record.getFieldValue(key)
                        });
                    });
                } else {
                    options.field_operations = record.fields ? Object.keys(record.fields).map(function (key) {
                        return new FieldOperation({
                            type: 'set',
                            field_id: key,
                            value: record.fields[key]
                        });
                    }) : [];
                }

                return new Operation(options);
            }));
        },

        /**
         * Удаляет существующие записи.
         * @param {cloud.dataSyncApi.Record|cloud.dataSyncApi.Record[]|Object|Object[]} records
         * Массив записей для удаления, заданных либо ссылками на объекты {@link cloud.dataSyncApi.Record},
         * либо json-объектами с полями record_id и collection_id.
         * @returns {cloud.dataSyncApi.Transaction} Ссылку на себя.
         */
        deleteRecords: function (records) {
            var defaultCollectionId = this._collectionId;
            return this.addOperations([].concat(records).map(function (record) {
                return new Operation(castOperationOptions('delete', record, defaultCollectionId));
            }));
        },

        /**
         * Заменяет поля в записи.
         * @param {Object|cloud.dataSyncApi.Record} record Запись для изменения,
         * заданная в виде объекта {@link cloud.dataSyncApi.Record} или json-объекта
         * с полями record_id и collection_id.
         * @param {Object|cloud.dataSyncApi.FieldOperation[]} fields Новые значения полей
         * в виде JSON-объекта или массива объектов {@link cloud.dataSyncApi.FieldOperation}.
         * @returns {cloud.dataSyncApi.Transaction} Ссылку на себя.
         */
        setRecordFields: function (record, fields) {
            var options = castOperationOptions('set', record, this._collectionId);

            if (Array.isArray(fields)) {
                options.field_operations = fields;
            } else {
                options.field_operations = Object.keys(fields || {}).map(function (key) {
                    return new FieldOperation({
                        type: 'set',
                        field_id: key,
                        value: fields[key]
                    });
                });
            }

            return this.addOperations(new Operation(options));
        },

        /**
         * Изменяет значения полей существующей записи.
         * @param {Object|cloud.dataSyncApi.Record} record Запись для изменения,
         * заданная в виде объекта {@link cloud.dataSyncApi.Record} или json-объекта
         * с полями record_id и collection_id.
         * @param {Object|cloud.dataSyncApi.FieldOperation[]} fields Новые значения полей
         * в виде JSON-объекта или массива объектов {@link cloud.dataSyncApi.FieldOperation}.
         * Если некоторое поле необходимо удалить, укажите для него значение undefined.
         * @returns {cloud.dataSyncApi.Transaction} Ссылку на себя.
         */
        updateRecordFields: function (record, fields) {
            var options = castOperationOptions('update', record, this._collectionId);

            if (Array.isArray(fields)) {
                options.field_operations = fields;
            } else {
                options.field_operations = Object.keys(fields).map(function (key) {
                    if (typeof fields[key] == 'undefined') {
                        return new FieldOperation({
                            type: 'delete',
                            field_id: key
                        });
                    } else {
                        return new FieldOperation({
                            type: 'set',
                            field_id: key,
                            value: fields[key]
                        });
                    }
                });
            }

            return this.addOperations(new Operation(options));
        },

        /**
         * Вставляет новый элемент в список, хранящийся в поле записи.
         * @param {Object|cloud.dataSyncApi.Record} record Запись для изменения,
         * заданная в виде объекта {@link cloud.dataSyncApi.Record} или json-объекта
         * с полями record_id и collection_id.
         * @param {Object} parameters Параметры операции.
         * @param {String} parameters.field_id Имя спискового поля.
         * @param {Integer} parameters.index Индекс позиции, в которую
         * нужно вставить элемент.
         * @param {cloud.dataSyncApi.Value|*} parameters.value Значение для вставки
         * в список, заданное экземпляром класса cloud.dataSyncApi.Value или любым объектом,
         * приводимым к нему.
         * @returns {cloud.dataSyncApi.Transaction} Ссылку на себя.
         */
        insertRecordFieldListItem: function (record, parameters) {
            var options = castOperationOptions('update', record, this._collectionId);

            options.field_operations = [
                new FieldOperation({
                    type: 'list_item_insert',
                    field_id: parameters.field_id,
                    index: parameters.index,
                    value: parameters.value
                })
            ];

            return this.addOperations(new Operation(options));
        },

        /**
         * Изменяет значение элемента списка, хранящегося в поле записи.
         * @param {Object|cloud.dataSyncApi.Record} record Запись для изменения,
         * заданная в виде объекта {@link cloud.dataSyncApi.Record} или json-объекта
         * с полями record_id и collection_id.
         * @param {Object} parameters Параметры операции.
         * @param {String} parameters.field_id Имя спискового поля.
         * @param {Integer} parameters.index Индекс позиции элемента, значение
         * которого необходимо заменить.
         * @param {cloud.dataSyncApi.Value|*} parameters.value Новое значение элемента,
         * заданное экземпляром класса cloud.dataSyncApi.Value или любым объектом,
         * приводимым к нему.
         * @returns {cloud.dataSyncApi.Transaction} Ссылку на себя.
         */
        setRecordFieldListItem: function (record, parameters) {
            var options = castOperationOptions('update', record, this._collectionId);

            options.field_operations = [
                new FieldOperation({
                    type: 'list_item_set',
                    field_id: parameters.field_id,
                    index: parameters.index,
                    value: parameters.value
                })
            ];

            return this.addOperations(new Operation(options));
        },

        /**
         * Перемещает элемент списка, хранящегося в поле записи.
         * @param {Object|cloud.dataSyncApi.Record} record Запись для изменения,
         * заданная в виде объекта {@link cloud.dataSyncApi.Record} или json-объекта
         * с полями record_id и collection_id.
         * @param {Object} parameters Параметры операции.
         * @param {String} parameters.field_id Имя спискового поля.
         * @param {Integer} parameters.index Индекс позиции элемента, положение
         * которого необходимо заменить.
         * @param {Integer} parameters.new_index Индекс новой позиции элемента
         * @returns {cloud.dataSyncApi.Transaction} Ссылку на себя.
         */
        moveRecordFieldListItem: function (record, parameters) {
            var options = castOperationOptions('update', record, this._collectionId);

            options.field_operations = [
                new FieldOperation({
                    type: 'list_item_move',
                    field_id: parameters.field_id,
                    index: parameters.index,
                    new_index: parameters.new_index
                })
            ];

            return this.addOperations(new Operation(options));
        },

        /**
         * Удаляет элемент списка, хранящегося в поле записи.
         * @param {Object|cloud.dataSyncApi.Record} record Запись для изменения,
         * заданная в виде объекта {@link cloud.dataSyncApi.Record} или json-объекта
         * с полями record_id и collection_id.
         * @param {Object} parameters Параметры операции.
         * @param {String} parameters.field_id Имя спискового поля.
         * @param {Integer} parameters.index Индекс позиции элемента, который
         * необходимо удалить.
         * @returns {cloud.dataSyncApi.Transaction} Ссылку на себя.
         */
        deleteRecordFieldListItem: function (record, parameters) {
            var options = castOperationOptions('update', record, this._collectionId);

            options.field_operations = [
                new FieldOperation({
                    type: 'list_item_delete',
                    field_id: parameters.field_id,
                    index: parameters.index
                })
            ];

            return this.addOperations(new Operation(options));
        }
    });

    function castOperationOptions (type, record, defaultCollectionId) {
        var options = {
                type: type
            };

        if (record instanceof Record) {
            options.collection_id = record.getCollectionId();
            options.record_id = record.getRecordId();
        } else {
            options.collection_id = record.collection_id || defaultCollectionId;
            options.record_id = record.record_id;
        }

        if (defaultCollectionId && options.collection_id != defaultCollectionId) {
            throw new Error('`collection_id` Parameter Must Match Current Filter');
        }

        return options;
    }

    provide(Transaction);
});
