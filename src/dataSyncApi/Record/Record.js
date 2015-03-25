ns.modules.define('cloud.dataSyncApi.Record', [
    'cloud.Error',
    'component.util',
    'cloud.dataSyncApi.Value'
], function (provide, Error, util, Value) {
        /**
         * @class Запись в БД.
         * @name cloud.dataSyncApi.Record
         * @param {Object} properties Данные записи.
         * @param {String} properties.collection_id Идентификатор коллекции.
         * @param {String} properties.record_id Идентификатор записи.
         * @param {Object} properties.fields Ключи и значения полей
         * в виде JSON-объекта. Значения могут задаться либо
         * экземлпярами класса {@link cloud.dataSyncApi.Value}, либо
         * любыми значениями, приводимыми к нему.
         */
    var Record = function (properties) {
            this._collectionId = properties.collection_id;
            this._recordId = properties.record_id;
            this._fields = Object.keys(properties.fields || {})
                .reduce(function (fields, key) {
                    fields[key] = properties.fields[key] instanceof Value ?
                        properties.fields[key] :
                        new Value(properties.fields[key]);
                    return fields;
                }, {});
        };

    Record.json = {
        deserialize: function (json, asDelta) {
            if (asDelta) {
                return new Record({
                    collection_id: json.collection_id,
                    record_id: json.record_id,
                    fields: (json.changes || []).reduce(function (fields, change) {
                        if (change.change_type != 'set') {
                            throw new Error({
                                message: 'Field change type is not supported',
                                type: change.change_type
                            });
                        }
                        fields[change.field_id] = Value.json.deserialize(change.value);
                        return fields;
                    }, {})
                });
            } else {
                return new Record({
                    collection_id: json.collection_id,
                    record_id: json.record_id,
                    fields: json.fields.reduce(function (fields, field) {
                        fields[field.field_id] = Value.json.deserialize(field.value);
                        return fields;
                    }, {})
                });
            }
        },

        serialize: function (record) {
            return {
                record_id: record.getRecordId(),
                collection_id: record.getCollectionId(),
                change_type: 'set',
                changes: record.getFieldIds().map(function (fieldId) {
                    return {
                        field_id: fieldId,
                        change_type: 'set',
                        value: Value.json.serialize(record.getFieldValue(fieldId))
                    };
                })
            };
        }
    };

    util.defineClass(Record, /** @lends cloud.dataSyncApi.Record.prototype */ {

        /**
         * @returns {String} Идентификатор коллекции.
         */
        getCollectionId: function () {
            return this._collectionId;
        },

        /**
         * @returns {String} Идентификатор записи.
         */
        getRecordId: function () {
            return this._recordId;
        },

        /**
         * @returns {String[]} Возвращает список полей записи.
         */
        getFieldIds: function () {
            return Object.keys(this._fields);
        },

        /**
         * @param {String} field_id Имя поля.
         * @returns {cloud.dataSyncApi.Value} Значение поля.
         */
        getFieldValue: function (field_id) {
            return this._fields[field_id];
        },

        /**
         * @returns {Object} Значения полей записи в виде JSON-объекта,
         * ключами которого являются имена полей.
         * @see cloud.dataSyncApi.Record.getFieldIds
         * @see cloud.dataSyncApi.Record.getFieldValue
         */
        getFields: function () {
            return util.extend({}, this._fields);
        },

        /**
         * @ignore
         * Применят операцию к полю записи.
         * @param {cloud.dataSyncApi.FieldOperation} operation Операция.
         * @returns {cloud.dataSyncApi.Record} Ссылку на себя.
         */
        applyFieldOperation: function (operation) {
            var error = this.dryRun(operation);
            if (error) {
                throw new Error({
                    code: 409,
                    type: error
                });
            }

            var fieldId = operation.getFieldId(),
                type = operation.getType(),
                fields = this._fields,
                currentValue = fields[fieldId];

            if (type == 'set') {
                this._fields[fieldId] = operation.getValue();
            } else if (type == 'delete') {
                delete this._fields[fieldId];
            } else if (['list_item_set', 'list_item_delete', 'list_item_insert', 'list_item_move'].indexOf(type) != -1) {
                currentValue.applyListOperation(operation);
            }

            return this;
        },

        /**
         * @ignore
         * @returns {cloud.dataSyncApi.Record} Копию записи.
         */
        copy: function () {
            var model = this._fields;

            return new Record({
                collection_id: this.getCollectionId(),
                record_id: this.getRecordId(),
                fields: Object.keys(this._fields).reduce(function (fields, key) {
                    fields[key] = model[key].copy();
                    return fields;
                }, {})
            });
        },

        /**
         * @ignore
         * Проверяет, выполнима ли данная операция над записью.
         * @returns {String|null} <p>null — операция прошла без конфликта,
         * тип конфликта в противном случае. Возможные типы конфликтов:</p>
         * <ul>
         *     <li>delete_non_existent_field — возникает при попытке
         * удалить несуществующее поле;</li>
         *     <li>modify_non_existent_field — возникает при попытке
         * применить списковую операцию к несуществующему полю;</li>
         *     <li>modify_not_a_list_field — возникает при попытке
         * вставки, удаления, изменения или перемещения элемента в несписковом
         * поле;</li>
         *     <li>incorrect_list_index — возникает при попытке
         * вставки, удаления, изменения или перемещения элемента
         * с некорректным индексом;</li>
         *     <li>unknown_type — неизвестный тип операции.</li>
         * </ul>
         */
        dryRun: function (operation) {
            var fieldId = operation.getFieldId(),
                type = operation.getType(),
                fields = this._fields,
                currentValue = fields[fieldId];

            if (type == 'set') {
                return null;
            } else if (type == 'delete') {
                if (typeof currentValue == 'undefined') {
                    return 'delete_non_existent_field';
                }
            } else if (['list_item_set', 'list_item_delete', 'list_item_insert', 'list_item_move'].indexOf(type) != -1) {
                if (typeof currentValue == 'undefined') {
                    return 'modify_non_existent_field';
                }
                if (currentValue.getType() != 'list') {
                    return 'modify_not_a_list_field';
                }
                return currentValue.dryRun(operation);
            } else {
                return 'unknown_type';
            }

            return null;
        }
    });

    provide(Record);
});