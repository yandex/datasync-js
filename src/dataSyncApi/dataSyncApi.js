/**
 * @class Основной неймпспейс для работы с Data API Диска.
 * @name cloud.dataSyncApi
 * @static
 * @noconstructor
 */
ns.cloud.dataSyncApi = /** @lends cloud.dataSyncApi.prototype */ {
    /**
     * Открывает указанную базу данных.
     * @static
     * @param {Object} options Опции.
     * @param {String} options.context Контекст. Может принимать значения
     * 'user' (общий контекст пользователя, доступный всем приложениям) или
     * 'app' (приватный контекст приложения).
     * @param {String} options.database_id Идентификатор базы данных.
     * @param {Boolean} [options.authorize_if_needed = true] Автоматически
     * авторизовать пользователя посредством вызова метода
     * {@link cloud.client.initialize}, если пользователь в момент вызова
     * функции не авторизован в Диске.
     * @param {String} [options.key] Ключ приложения для авторизации.
     * @param {String} [options.token] Token для авторизации.
     * @param {Boolean} [options.create_if_not_exists = true] true —
     * создать базу с указанным идентификатором, если она не существует,
     * false — не создавать.
     * @param {Boolean} [options.background_sync = true] true — автоматически
     * синхронизировать базу данных в фоновом режиме, false — не синхронизировать.
     * @returns {vow.Promise} Объект-Promise, который будет либо подтверждён экземпляром
     * класса {@link cloud.dataSyncApi.Database} при успешном открытии базы данных, либо отклонён
     * с одной из следующих ошибок:
     * <ul>
     *     <li>400 — запрос некорректен;</li>
     *     <li>401 — пользователь не авторизован;</li>
     *     <li>403 — доступ запрещён;</li>
     *     <li>404 — база данных не найдена;</li>
     *     <li>423 — ресурс доступен только для чтения;</li>
     *     <li>429 — превышен лимит количества запросов;</li>
     *     <li>500 — невозможно выполнить запрос.</li>
     * </ul>
     * @example
     * var success = console.log.bind(console, 'Success'),
     *     fail = console.error.bind(console);
     * // Пример 1. Создаём базу данных и кладём в неё пару записей.
     * ya.cloud.dataSyncApi.openDatabase({
     *     context: 'app',
     *     database_id: 'favorites',
     *     key: 'my_app_key'
     * }).then(function (db) {
     *     var transaction = db.createTransaction();
     *
     *     transaction.insertRecords([{
     *         collection_id: 'cities',
     *         record_id: '0',
     *         fields: {
     *             name: "Moscow",
     *             attractions: ["Kremlin", "Mausoleum"],
     *             visited: Date.now()
     *         }
     *     }, {
     *         collection_id: 'cities',
     *         record_id: '1',
     *         fields: {
     *             name: "Saint Petersburg",
     *             visited: new Date(2014, 01, 01)
     *         }
     *     }]);
     *
     *     transaction.push().then(success, fail);
     * }, fail);
     *
     * // Пример 2. Выводим список записей из базы.
     * ya.cloud.dataSyncApi.openDatabase({
     *     context: 'app',
     *     database_id: 'favorites',
     *     key: 'my_app_key'
     * }).then(function (db) {
     *     db.forEach(function (record) {
     *         console.log(record.getFieldValue('name'));
     *     });
     * }, fail);
     *
     * // Пример 3. Работа с конфликтами.
     * var transaction = db.createTransaction();
     *
     * // Найдём все города, посещённые в 2014 году
     * db.filter(function (record) {
     *     return record.getCollectionId() == 'cities' &amp;&amp;
     *            record.getFieldValue('visited').getFullYear() == '2014';
     * }, function (record) {
     *     // Добавим в список 'attractions' новый элемент
     *     transaction.insertRecordFieldListItem(record, {
     *         field_id: 'attractions',
     *         index: 0,
     *         value: 'Happy new year'
     *     });
     * });
     *
     * // При попытке применить эту транзакцию произойдёт
     * // ошибка: у второй записи нет поля 'attractions'
     * transaction.push().then(success, function (e) {
     *     // 409 Conflict
     *     console.log(e.toString());
     *     if (e.code == 409) {
     *         // Тип ошибки — неправильная операция над полями записи
     *         // с record_id == '1'
     *         var operations = transaction.getOperations(),
     *             conflict = e.conflicts[0].conflict,
     *             conflictedOperation = operations[e.conflicts[0].index];
     *
     *         console.log(
     *             conflict.getType(),
     *             conflictedOperation.getCollectionId(),
     *             conflictedOperation.getRecordId()
     *         );
     *
     *         // Ошибка при модификации поля attractions — у записи
     *         // с record_id == '1' такого поля не существует
     *         var fieldConflicts = conflict.getFieldChangeConflicts(),
     *             conflictedFieldOperation = fieldConflicts[0].conflict;
     *
     *         console.log(fieldConflicts[0].index);
     *         console.log(conflictedFieldOperation.getType());
     *
     *         // Создадим новую транзакцию, в которой сначала
     *         // инициализируем поле attractions у записи record_id = '1',
     *         // а потом выполним все те же операции.
     *         var correctedTransaction = db.createTransaction(),
     *             values = {};
     *
     *         values[conflictedFieldOperation.getFieldId()] = [];
     *
     *         // Сначала создадим операцию на добавление поля
     *         correctedTransaction.setRecordFields({
     *             collection_id: conflictedOperation.getCollectionId(),
     *             record_id: conflictedOperation.getRecordId()
     *         }, values);
     *
     *         // Теперь скопируем остальные операции
     *         correctedTransaction.addOperations(transaction.getOperations());
     *
     *         correctedTransaction.push().then(success, fail);
     *     }
     * });
     */
    openDatabase: function (options) {
        return this._require(['cloud.dataSyncApi.Database']).spread(function (Database) {
            return new Database(options);
        });
    },

    /**
     * Возвращает количество баз данных.
     * @param {Object|String} options Опции запроса в виде
     * JSON-объекта либо опция database_id.
     * @param {String} options.context Контекст. Может принимать значения
     * 'user' (общий контекст пользователя, доступный всем приложениям) или
     * 'app' (приватный контекст приложения).
     * @param {String} options.database_id Идентификатор базы данных.
     * @param {Boolean} [options.authorize_if_needed = true] Автоматически
     * авторизовать пользователя посредством вызова метода
     * {@link cloud.client.initialize}, если пользователь в момент вызова
     * функции не авторизован в Диске.
     * @param {String} [options.key] Ключ приложения для авторизации.
     * @param {String} [options.token] Token для авторизации.
     * @returns {vow.Promise} Объект-Promise, который будет либо подтверждён
     * числом баз данных, либо отклонён с одной из следующих ошибок:
     * <ul>
     *     <li>400 — запрос некорректен;</li>
     *     <li>401 — пользователь не авторизован;</li>
     *     <li>403 — доступ запрещён;</li>
     *     <li>429 — превышен лимит количества запросов;</li>
     *     <li>500 — невозможно выполнить запрос.</li>
     * </ul>
     * @static
     */
    getDatabaseCount: function (options) {
        return this._require(['component.util', 'cloud.dataSyncApi.http']).spread(function (util, http) {
            return http.getDatabases(util.extend({
                limit: 0,
                offset: 0
            }, options)).then(function (res) {
                return res.data.total;
            });
        });
    },

    /**
     * Возвращает метаданные конкретной БД.
     * @param {Object} options Опции запроса в виде
     * JSON-объекта.
     * @param {String} options.context Контекст. Может принимать значения
     * 'user' (общий контекст пользователя, доступный всем приложениям) или
     * 'app' (приватный контекст приложения).
     * @param {String} options.database_id Идентификатор базы данных.
     * @param {Boolean} [options.authorize_if_needed = true] Автоматически
     * авторизовать пользователя посредством вызова метода
     * {@link cloud.client.initialize}, если пользователь в момент вызова
     * функции не авторизован в Диске.
     * @param {String} [options.key] Ключ приложения для авторизации.
     * @param {String} [options.token] Token для авторизации.
     * @returns {vow.Promise} Объект-Promise, который будет либо подтверждён
     * метаданными БД, либо отклонён с ошибкой.
     * Метаданные БД представляют собой JSON-объект со следующими полями:
     * <ul>
     *     <li>database_id — идентификатор БД;</li>
     *     <li>revision — ревизия БД;</li>
     *     <li>title — заголовок БД;</li>
     *     <li>records_count — количество записей в БД;</li>
     *     <li>size — размер БД в байтах;</li>
     *     <li>created — timestamp создания БД;</li>
     *     <li>modified — timestamp последней модификации БД.</li>
     * </ul>
     * Возможные ошибки при выполнении операции:
     * <ul>
     *     <li>400 — запрос некорректен;</li>
     *     <li>401 — пользователь не авторизован;</li>
     *     <li>403 — доступ запрещён;</li>
     *     <li>429 — превышен лимит количества запросов;</li>
     *     <li>500 — невозможно выполнить запрос.</li>
     * </ul>
     * @static
     */
    getDatabaseMetadata: function (options) {
        if (!options || !options.database_id) {
            return this._fail('`options.database_id` Parameter Required');
        }

        var castMetadata = this._castMetadata.bind(this);
        return this._require(['cloud.dataSyncApi.http']).spread(function (http) {
            return http.getDatabases(options).then(function (res) {
                return castMetadata(res.data);
            });
        });
    },

    /**
     * Возвращает выборку метаданных БД по указанному диапазону порядковых номеров.
     * @param {Object} options Опции запроса в виде
     * JSON-объекта.
     * @param {String} options.context Контекст. Может принимать значения
     * 'user' (общий контекст пользователя, доступный всем приложениям) или
     * 'app' (приватный контекст приложения).
     * @param {Integer} options.offset Порядковый номер БД, с которого начинать
     * выборку.
     * @param {Integer} options.limit Количество БД в выборке
     * @param {Boolean} [options.authorize_if_needed = true] Автоматически
     * авторизовать пользователя посредством вызова метода
     * {@link cloud.client.initialize}, если пользователь в момент вызова
     * функции не авторизован в Диске.
     * @param {String} [options.key] Ключ приложения для авторизации.
     * @param {String} [options.token] Token для авторизации.
     * @returns {vow.Promise} Объект-Promise, который будет либо подтверждён
     * массивом метаданных БД, либо отклонён с одной из следующих ошибок:
     * <ul>
     *     <li>400 — запрос некорректен;</li>
     *     <li>401 — пользователь не авторизован;</li>
     *     <li>403 — доступ запрещён;</li>
     *     <li>429 — превышен лимит количества запросов;</li>
     *     <li>500 — невозможно выполнить запрос.</li>
     * </ul>
     * @see cloud.dataSyncApi.getDatabaseMetadata
     * @static
     */
    listDatabaseMetadata: function (options) {
        if (!options || typeof options.offset == 'undefined' || typeof options.limit == 'undefined') {
            return this._fail('`options.offset` and `options.limit` Parameters Required');
        }

        var castMetadata = this._castMetadata.bind(this);
        return this._require(['cloud.dataSyncApi.http']).spread(function (http) {
            return http.getDatabases(options).then(function (res) {
                return res.data.items.map(castMetadata);
            });
        });
    },

    /**
     * Создаёт новую базу данных.
     * @param {Object} options Опции запроса в виде
     * JSON-объекта.
     * @param {String} options.context Контекст. Может принимать значения
     * 'user' (общий контекст пользователя, доступный всем приложениям) или
     * 'app' (приватный контекст приложения).
     * @param {String} options.database_id Идентификатор создаваемой БД.
     * @param {Boolean} [options.authorize_if_needed = true] Автоматически
     * авторизовать пользователя посредством вызова метода
     * {@link cloud.client.initialize}, если пользователь в момент вызова
     * функции не авторизован в Диске.
     * @param {String} [options.key] Ключ приложения для авторизации.
     * @param {String} [options.token] Token для авторизации.
     * @param {Boolean} [options.ignore_existing = false] true — не генерировать
     * исключение, если база данных с таким идентфикатором уже существует, false —
     * сгенерировать исключение с кодом 409.
     * @returns {vow.Promise} Объект-Promise, который будет либо подтверждён
     * ревизией созданной БД, либо отклонён с одной из следующих ошибок:
     * <ul>
     *     <li>400 — запрос некорректен;</li>
     *     <li>401 — пользователь не авторизован;</li>
     *     <li>403 — доступ запрещён;</li>
     *     <li>423 — ресурс доступен только для чтения;</li>
     *     <li>429 — превышен лимит количества запросов;</li>
     *     <li>500 — невозможно выполнить запрос.</li>
     * </ul>
     * @see cloud.dataSyncApi.getDatabaseMetadata
     * @static
     */
    createDatabase: function (options) {
        var fail = this._fail.bind(this);

        return this._require(['cloud.dataSyncApi.http']).spread(function (http) {
            return http.putDatabase(options).then(function (res) {
                if (options && !options.ignore_existing && res.code == 200) {
                    return fail(
                        409,
                        'Database "' + options.database_id + '" Already Exists'
                    );
                }
                return Number(res.headers.etag);
            }, this);
        });
    },

    /**
     * Удаляет существующую базу данных.
     * @param {Object} options Опции запроса в виде
     * JSON-объекта.
     * @param {String} options.context Контекст. Может принимать значения
     * 'user' (общий контекст пользователя, доступный всем приложениям) или
     * 'app' (приватный контекст приложения).
     * @param {String} options.database_id Идентификатор удаляемой БД.
     * @param {Boolean} [options.authorize_if_needed = true] Автоматически
     * авторизовать пользователя посредством вызова метода
     * {@link cloud.client.initialize}, если пользователь в момент вызова
     * функции не авторизован в Диске.
     * @param {String} [options.key] Ключ приложения для авторизации.
     * @param {String} [options.token] Token для авторизации.
     * @returns {vow.Promise} Объект-Promise, который будет либо подтверждён
     * массивом метаданных созданной БД, либо отклонён с одной из следующих ошибок:
     * <ul>
     *     <li>400 — запрос некорректен;</li>
     *     <li>401 — пользователь не авторизован;</li>
     *     <li>403 — доступ запрещён;</li>
     *     <li>404 — ресурс не найден;</li>
     *     <li>423 — ресурс доступен только для чтения;</li>
     *     <li>429 — превышен лимит количества запросов;</li>
     *     <li>500 — невозможно выполнить запрос.</li>
     * </ul>
     * @see cloud.dataSyncApi.getDatabaseMetadata
     * @static
     */
    deleteDatabase: function (options) {
        return this._require(['cloud.dataSyncApi.http']).spread(function (http) {
            return http.deleteDatabase(options).then(function () {
                return null;
            });
        });
    },

    _require: function (modules) {
        var deferred = ns.vow.defer();

        ns.modules.require(modules, function () {
            deferred.resolve([].slice.call(arguments));
        });

        return deferred.promise();
    },

    _castMetadata: function (data) {
        return {
            database_id: data.database_id,
            revision: data.revision,
            title: data.title,
            created: new Date(data.created),
            modified: new Date(data.modified),
            records_count: data.records_count,
            size: data.size
        };
    },

    _fail: function (code, message) {
        if (!message) {
            message = code;
            code = 400;
        }

        var deferred = ns.vow.defer();

        ns.modules.require(['cloud.Error'], function (Error) {
            deferred.reject(new Error({
                code: code,
                message: message
            }));
        });

        return deferred.promise();
    }
};

ns.modules.define('cloud.dataSyncApi', [], function (provide) {
    provide(ns.cloud.dataSyncApi);
});
