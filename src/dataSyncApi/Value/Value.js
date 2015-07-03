ns.modules.define('cloud.dataSyncApi.Value', [
    'component.util',
    'cloud.Error'
], function (provide, util, Error) {
    /**
     * @name cloud.dataSyncApi.Value
     * @class Объект, представляющий значение поля записи.
     * @param {Object|*} properties Описание значения либо само значение.
     * @param {String} [properties.type] Тип поля.
     * <p>В Data API существуют следующие типы полей:</p>
     * <ul>
     *     <li>&apos;string&apos; — строка;</li>
     *     <li>&apos;integer&apos; — целое число;</li>
     *     <li>&apos;double&apos; — вещественное число;</li>
     *     <li>&apos;boolean&apos; — логическое (булево) значение;</li>
     *     <li>&apos;datetime&apos; — время и дата;</li>
     *     <li>&apos;binary&apos; — массив двоичных данных;</li>
     *     <li>&apos;null&apos; — специальное значение null;</li>
     *     <li>&apos;nan&apos; — специальное значение Not Any Number;</li>
     *     <li>&apos;inf&apos; — специальное значение «бесконечность»;</li>
     *     <li>&apos;ninf&apos; — специальное значение «минус бесконечность»;</li>
     *     <li>&apos;list&apos; — список (может состоять из объектов любого
     * из перечисленных выше типов).</li>
     * </ul>
     * <p>Тип может быть не указан, в таком случае параметр value будет приведён
     * к типу Data API автоматически по следующим правилам:</p>
     * <ul>
     *     <li>строки будут преобразованы к типу &apos;string&apos;;</li>
     *     <li>числа (за исключением NaN, Infinity и -Infinity) будут преобразованы
     *     к типу &apos;number&apos;;</li>
     *     <li>значения true и false и объекты типа Boolean будут
     *     преобразованы к типу &apos;boolean&apos;;</li>
     *     <li>значения типа Date будут преобразованы к типу &apos;datetime&apos;;</li>
     *     <li>значения типа ArrayBuffer и типизированные массивы
     *     будут преобразованы к типу &apos;binary&apos;;</li>
     *     <li>null будет преобразован к типу &apos;null&apos;;</li>
     *     <li>NaN будет преобразован к типу &apos;nan&apos;;</li>
     *     <li>Infinity будет преобразован к типу &apos;inf&apos;;</li>
     *     <li>-Infinity будет преобразован к типу &apos;ninf&apos;;</li>
     *     <li>массивы будут преобразованы к типу &apos;list&apos;.</li>
     * </ul>
     * @param {*} [properties.value] <p>Значение поля. Может задаваться:</p>
     * <ul>
     *     <li>для типа &apos;string&apos; — строкой либо любым объектом
     *     с методом toString;</li>
     *     <li>для типов &apos;integer&apos; и &apos;double&apos; — числом
     *     либо строкой;</li>
     *     <li>для типа &apos;boolean&apos; — любым объектом JavaScript,
     *     который приводится к boolean посредством вызова Boolean(value);</li>
     *     <li>для типа &apos;datetime&apos; — объектом типа Date или строкой
     *     в формате ISO 8601;</li>
     *     <li>для типа &apos;binary&apos; — строкой, представляющей собой
     *     base64-закодированные двоичные данные или объектом ArrayBuffer или
     *     типизированным массивом;</li>
     *     <li>для типа &apos;list&apos; — массивом, для каждого элемента которого
     *     будет вызван конструктор {@link cloud.dataSyncApi.Value}.</li>
     * </ul>
     * Для типов &apos;null&apos;, &apos;nan&apos;, &apos;inf&apos; и &apos;ninf&apos;
     * значение не указывается.
     */
    var Value = function (properties) {
            if (properties && properties.type) {
                this._type = properties.type;
                this._value = castValue(this._type, properties.value);
            } else {
                this._type = detectType(properties);
                this._value = castValue(this._type, properties);
            }
        };

    /**
     * @ignore
     * Функции для (де)сериализации значения из/в форматы
     * ответов HTTP API.
     */
    Value.json = {
        serialize: function (value) {
            var result = {};
            result.type = value._type;
            if (['null', 'nan', 'inf', 'ninf'].indexOf(result.type) != -1) {
                result[result.type] = true;
            } else if (result.type == 'list') {
                result.list = value._value.map(Value.json.serialize);
            } else {
                result[result.type] = value._value;
            }

            return result;
        },

        deserialize: function (json) {
            var properties = {
                    type: json.type
                };

            if (json.type == 'list') {
                properties.value = json.list ? json.list.map(Value.json.deserialize) : [];
            } else if (['null', 'nan', 'inf', 'ninf'].indexOf(json.type) == -1) {
                properties.value = json[json.type];
            }

            return new Value (properties);
        }
    };

    util.defineClass(Value, /** @lends cloud.dataSyncApi.Value.prototype */ {
        /**
         * @returns {String} Тип значения.
         */
        getType: function () {
            return this._type;
        },

        /**
         * @param {Boolean} [decode = false] true — для binary-значений
         * вернуть ArrayBuffer, false — Base64-закодированную строку.
         * @returns {*|cloud.dataSyncApi.Value[]} Значение, приведённое к одному
         * из стандартных типов JavaScript.
         */
        valueOf: function (decode) {
            return decode && this._type == 'binary' ?
                base64ToArrayBuffer(this._value) :
                    (this._type == 'datetime' ?
                        new Date(this._value) :
                        this._value);
        },

        toString: function () {
            return this._value.toString();
        },

        /**
         * @ignore
         * @returns {cloud.dataSyncApi.Value} Копию значения.
         */
        copy: function () {
            return new Value({
                type: this._type,
                value: copyValue(this._type, this._value)
            });
        },

        /**
         * @ignore
         * Применяет списковую операцию к значению.
         * @param {cloud.dataSyncApi.FieldOperation} operation Операция.
         * @returns {cloud.dataSyncApi.Value} Ссылку на себя.
         */
        applyListOperation: function (operation) {
            var error = this.dryRun(operation);

            if (error) {
                throw new Error({
                    code: 409,
                    type: error
                });
            }

            var type = operation.getType(),
                index = operation.getIndex(),
                list = this._value;

            switch (type) {
                case 'list_item_set':
                    list[index] = operation.getValue();
                    break;
                case 'list_item_move':
                    var item = list[index],
                        newIndex = operation.getNewIndex();

                    if (index != newIndex) {
                        list.splice(index, 1);
                        list.splice(newIndex, 0, item);
                    }
                    break;
                case 'list_item_insert':
                    list.splice(index, 0, operation.getValue());
                    break;
                case 'list_item_delete':
                    list.splice(index, 1);
                    break;
                default:
                    break;
            }

            return this;
        },

        /**
         * @ignore
         * Проверяет, применима ли списковая операция к значению.
         * @param {cloud.dataSyncApi.FieldOperation} operation Операция.
         * @returns {String|null} <p>null — операция прошла без конфликта,
         * тип конфликта в противном случае. Возможные типы конфликтов:</p>
         * <ul>
         *     <li>incorrect_list_index — возникает при попытке
         * вставки, удаления, изменения или перемещения элемента
         * с некорректным индексом;</li>
         *     <li>unknown_type — неизвестный тип операции.</li>
         * </ul>
         */
        dryRun: function (operation) {
            var type = operation.getType(),
                index = operation.getIndex(),
                list = this._value;


            switch (type) {
                case 'list_item_set':
                    if (index >= list.length || index < 0) {
                        return 'incorrect_list_index';
                    }
                    break;
                case 'list_item_move':
                    var newIndex = operation.getNewIndex();

                    if (index >= list.length || index < 0 || newIndex >= list.length || newIndex < 0) {
                        return 'incorrect_list_index';
                    }
                    break;
                case 'list_item_insert':
                    if (index > list.length || index < 0) {
                        return 'incorrect_list_index';
                    }
                    break;
                case 'list_item_delete':
                    if (index >= list.length || index < 0) {
                        return 'incorrect_list_index';
                    }
                    break;
                default:
                    return 'unknown_type';
            }

            return null;
        }
    });

    function detectType (value) {
        switch (typeof value) {
            case 'number':
                if (value == Number.POSITIVE_INFINITY) {
                    return 'inf';
                } else if (value == Number.NEGATIVE_INFINITY) {
                    return 'ninf';
                } else if (global.isNaN(value)) {
                    return 'nan';
                } else {
                    return 'double'
                }
            case 'string':
                return 'string';
            case 'boolean':
                return 'boolean';
            case 'object':
                if (value == null) {
                    return 'null';
                } else if (typeof global.ArrayBuffer != 'undefined' && (
                        value instanceof ArrayBuffer || (value.buffer && value.buffer instanceof ArrayBuffer)
                    )) {
                    return 'binary'
                } else if (value instanceof Date) {
                    return 'datetime';
                } else if (value instanceof Boolean) {
                    return 'boolean';
                } else if (value instanceof Number) {
                    return 'double';
                } else if (Array.isArray(value)) {
                    return 'list';
                } else {
                    return 'string';
                }
            default:
                throw new Error({
                    message: 'Type unknown'
                });
        }
    }

    function castValue (type, value) {
        switch (type) {
            case 'string':
                return value.toString();
            case 'integer':
                return Math.floor(Number(value));
            case 'double':
                return Number(value);
            case 'boolean':
                return value instanceof Boolean ? value.valueOf() : Boolean(value);
            case 'datetime':
                return value instanceof Date ? value.toISOString() : value;
            case 'binary':
                if (typeof global.ArrayBuffer != 'undefined') {
                    if (value instanceof ArrayBuffer) {
                        return global.btoa(String.fromCharCode.apply(null, new Uint8Array(value)));
                    } else if (value.buffer && value.buffer instanceof ArrayBuffer) {
                        return global.btoa(String.fromCharCode.apply(null, new Uint8Array(value.buffer)));
                    } else {
                        return value.toString();
                    }
                } else {
                    return value.toString();
                }
            case 'null':
                return null;
            case 'inf':
                return Number.POSITIVE_INFINITY;
            case 'ninf':
                return Number.NEGATIVE_INFINITY;
            case 'nan':
                return Number.NaN;
            case 'list':
                return value.map(function (item) {
                    return item instanceof Value ? item : new Value(item);
                });
            default:
                throw new Error({
                    message: 'Type unknown'
                });
        }
    }

    function copyValue (type, value) {
        if (type == 'list') {
            return value.map(function (item) {
                return item.copy();
            });
        } else {
            return value;
        }
    }

    function base64ToArrayBuffer (value) {
        value = value.replace(/[^A-Za-z0-9\+\/]/g, '');

        var length = value.length,
            outLength = length * 3 + 1 >> 2,
            result = new Uint8Array(outLength),
            mod3, mod4, int24 = 0;

        for (var outIndex = 0, inIndex = 0; inIndex < length; inIndex++) {
            mod4 = inIndex & 3;
            int24 |= base64ToUint6(value.charCodeAt(inIndex)) << 18 - 6 * mod4;
            if (mod4 == 3 || length - inIndex == 1) {
                for (mod3 = 0; mod3 < 3 && outIndex < outLength; mod3++, outIndex++) {
                    result[outIndex] = int24 >>> (16 >>> mod3 & 24) & 255;
                }
                int24 = 0;
            }
        }

        return result.buffer;
    }

    function base64ToUint6 (char) {
        return char > 64 && char < 91 ?
            char - 65 :
                char > 96 && char < 123 ?
                    char - 71 :
                    char > 47 && char < 58 ?
                        char + 4 :
                        char == 43 ?
                            62:
                            char == 47 ? 63 : 0;
    }

    provide(Value);
});
