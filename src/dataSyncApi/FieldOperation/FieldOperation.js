ns.modules.define('cloud.dataSyncApi.FieldOperation', [
    'component.util',
    'cloud.dataSyncApi.Value'
], function (provide, util, Value) {
    /**
     * @class Операция над полями отдельной записи БД.
     * @name cloud.dataSyncApi.FieldOperation
     * @param {Object} properties Параметры операции.
     * @param {String} properties.type <p>Тип операции. Возможны следующие значения:</p>
     * <ul>
     *     <li>set — изменение значения поля;</li>
     *     <li>delete — удаление поля;</li>
     *     <li>list_item_set — изменение значения элемента списка;</li>
     *     <li>list_item_move — перемещение элемента в списке;</li>
     *     <li>list_item_delete — удаление элемента в списке;</li>
     *     <li>list_item_insert — вставка элемента в список.</li>
     * </ul>
     * @param {String} properties.field_id Имя поля.
     * @param {*|cloud.dataSyncApi.Value} [properties.value] Новое значение
     * поля или элемента списка для операций set, list_item_set, list_item_insert.
     * Задаётся в виде экземпляра класса {@link cloud.dataSyncApi.Value}
     * либо любым объектом, приводимым к нему.
     * @param {Integer} [properties.index] Индекс элемента списка, к которому
     * применяется операция, для операций list_item_set, list_item_insert,
     * list_item_delete, list_item_move.
     * @param {Integer} [properties.new_index] Новый индекс для операции list_item_move.
     */
    var FieldOperation = function (properties) {
        this._type = properties.type;
        this._fieldId = properties.field_id;
        if (['set', 'list_item_set', 'list_item_insert'].indexOf(this._type) != -1) {
            this._value = properties.value instanceof Value ?
                properties.value :
                new Value(properties.value);
        } else {
            this._value = null;
        }
        if (['list_item_set', 'list_item_delete', 'list_item_insert', 'list_item_move'].indexOf(this._type) != -1) {
            this._index = Math.floor(properties.index);
        } else {
            this._index = null;
        }
        if (this._type == 'list_item_move') {
            this._newIndex = Math.floor(properties.new_index);
        } else {
            this._newIndex = null;
        }
    };

    FieldOperation.json = {
        serialize: function (operation) {
            var type = operation.getType(),
                res = {
                    field_id: operation.getFieldId(),
                    change_type: type
                };

            if (type == 'set' || type == 'list_item_set' || type == 'list_item_insert') {
                res.value = Value.json.serialize(operation.getValue());
            }

            if (type == 'list_item_move') {
                res.list_item_dest = operation.getNewIndex();
            }

            if (type.indexOf('list_item_') == 0) {
                res.list_item = operation.getIndex();
            }

            return res;
        },

        deserialize: function (serialized) {
            var type = serialized.change_type,
                properties = {
                    type: type,
                    field_id: serialized.field_id
                };

            if (type == 'set' || type == 'list_item_set' || type == 'list_item_insert') {
                properties.value = Value.json.deserialize(serialized.value);
            }

            if (type == 'list_item_move') {
                properties.new_index = serialized.list_item_dest;
            }

            if (type.indexOf('list_item_') == 0) {
                properties.index = serialized.list_item;
            }

            return new FieldOperation(properties);
        }
    };

    util.defineClass(FieldOperation, /** @lends cloud.dataSyncApi.FieldOperation.prototype */ {
        /**
         * @returns {String} Тип операции.
         */
        getType: function () {
            return this._type;
        },

        /**
         * @returns {String} Имя поля.
         */
        getFieldId: function () {
            return this._fieldId;
        },

        /**
         * @returns {cloud.dataSyncApi.Value} Новое значение поля.
         */
        getValue: function () {
            return this._value;
        },

        /**
         * @returns {Integer|null} Индекс элемента списка.
         */
        getIndex: function () {
            return this._index;
        },

        /**
         * @returns {Integer|null} Новую позицию элемента списка.
         */
        getNewIndex: function () {
            return this._newIndex;
        }
    });

    provide(FieldOperation);
});