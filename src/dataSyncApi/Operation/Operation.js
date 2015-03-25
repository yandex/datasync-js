ns.modules.define('cloud.dataSyncApi.Operation', [
    'cloud.dataSyncApi.FieldOperation',
    'cloud.dataSyncApi.Record',
    'component.util'
], function (provide, FieldOperation, Record, util) {
    /**
     * @class Операция над БД.
     * @name cloud.dataSyncApi.Operation
     * @param {Object} properties Параметры операции.
     * @param {String} properties.type <p>Тип операции. Возможны следующие значения:</p>
     * <ul>
     *     <li>insert — добавление записи;</li>
     *     <li>delete — удаление записи;</li>
     *     <li>set — перезадание записи;</li>
     *     <li>update — изменение отдельных полей записи.</li>
     * </ul>
     * @param {String} properties.collection_id Идентфикатор коллекции, над которой
     * выполняется операция.
     * @param {String} properties.record_id Идентификатор записи, над которой выполняется
     * операция.
     * @param {cloud.dataSyncApi.FieldOperation[]|Object[]} [properties.field_operations = []] Для операций
     * insert, set и update задаёт изменения значений полей. Может задаваться массивом
     * экземпляров класса {@link cloud.dataSyncApi.FieldOperation} либо json-объектов, приводимых к нему.
     */
    var Operation = function (properties) {
            this._type = properties.type;
            this._collectionId = properties.collection_id;
            this._recordId = properties.record_id;
            if (['insert', 'update', 'set'].indexOf(this._type) != -1) {
                this._fieldOperations = (properties.field_operations || []).map(function (change) {
                    if (change instanceof FieldOperation) {
                        return change;
                    } else {
                        return new FieldOperation(change);
                    }
                });
            } else {
                this._fieldOperations = null;
            }
        };

    Operation.json = {
        serialize: function (operation) {
            var type = operation.getType(),
                res = {
                    record_id: operation.getRecordId(),
                    collection_id: operation.getCollectionId(),
                    change_type: type
                };

            if (['insert', 'update', 'set'].indexOf(type) != -1) {
                res.changes = operation.getFieldOperations().map(function (change) {
                    return FieldOperation.json.serialize(change);
                });
            }

            return res;
        },

        deserialize: function (serialized) {
            var type = serialized.change_type,
                properties = {
                    type: type,
                    record_id: serialized.record_id,
                    collection_id: serialized.collection_id
                };

            if (['insert', 'update', 'set'].indexOf(this._type) != -1) {
                properties.field_changes = serialized.changes.map(function (change) {
                    return FieldOperation.json.deserialize(change)
                });
            }

            return new Operation(properties);
        }
    };

    util.defineClass(Operation, /** @lends cloud.dataSyncApi.Operation.prototype */ {
        /**
         * @returns {String} Тип операции.
         */
        getType: function () {
            return this._type;
        },

        /**
         * @returns {String} Возвращает идентификатор записи.
         */
        getRecordId: function () {
            return this._recordId;
        },

        /**
         * @returns {String} Возвращает идентификатор коллекции.
         */
        getCollectionId: function () {
            return this._collectionId;
        },

        /**
         * @returns {cloud.dataSyncApi.FieldOperation[]} Возвращает список
         * операций над полями записи.
         */
        getFieldOperations: function () {
            return this._fieldOperations ? this._fieldOperations.slice() : null;
        }
    });

    provide(Operation);
});