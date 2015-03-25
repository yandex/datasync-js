ns.modules.define('cloud.dataSyncApi.Conflict', [
    'component.util'
], function (provide, util) {
    /**
     * @class Описание конфликта, который может произойти
     * при попытке применить некорректную транзакцию.
     * @name cloud.dataSyncApi.Conflict
     * @noconstructor
     */
    var Conflict = function (properties) {
            this._type = properties.type;
            this._fieldChangeConflicts = properties.field_change_conflicts;
        };

    util.defineClass(Conflict, /** @lends cloud.dataSyncApi.Conflict.prototype */ {
        /**
         * <p>Возвращает тип конфликта. Допустимые значения:</p>
         * <ul>
         *     <li>record_already_exists — возникает при попытке
         * создать запись с идентификатором, который уже есть в указанной
         * коллекции;</li>
         *     <li>delete_non_existent_record — возникает при попытке
         * удалить несуществующую запись;</li>
         *     <li>update_non_existent_record — возникает при попытке
         * изменить несуществующую запись;</li>
         *     <li>both_modified — возникает в ситуации, когда
         * запись была изменена на удалённом сервере;</li>
         *     <li>invalid_field_change — возникает при попытке выполнения
         * некорректной операции над отдельным полем записи.</li>
         * </ul>
         * @returns {String} Тип конфликта.
         */
        getType: function () {
            return this._type;
        },

        /**
         * Для конфликтов типа invalid_field_change возвращает детализацию
         * конфликта: какая из операций над полями приводит к ошибке.
         * @returns {Object[]} Конфликты при изменении полей записи
         * в виде массива json-объектов с полями index (индекс операции)
         * и type (тип конфликта).
         */
        getFieldChangeConflicts: function () {
            return this._fieldChangeConflicts;
        }
    });

    provide(Conflict);
});