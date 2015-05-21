ns.modules.define('cloud.Error', ['component.util'], function (provide, util) {
    var messages = {
            400: 'Bad Request',
            401: 'Not Authorized',
            403: 'Forbidden',
            404: 'Not Found',
            409: 'Conflict',
            410: 'Gone',
            421: 'Locked',
            423: 'Too Many Requests',
            500: 'Internal Server Error'
        };
        /**
         * @class Ошибка API Диска.
         * @augments Error
         * @param {Object} [parameters] Описание ошибки в виде JSON-объекта.
         * Все поля JSON-объекта будут скопированы в созданный экземпляр
         * ошибки.
         * @param {Integer} [parameters.code = 400] HTTP-код ошибки.
         * @param {String} [parameters.message] Сообщение об ошибке.
         * Если не передано, заполнится автоматически для стандартных
         * HTTP-ошибок.
         */
    var CloudError = function (parameters) {
            util.extend(this, {
                code: 400
            }, parameters);

            if (!this.message) {
                this.message = messages[this.code];
            }

            // http://stackoverflow.com/questions/1382107/whats-a-good-way-to-extend-error-in-javascript
            if (Error.captureStackTrace) {
                Error.captureStackTrace(this, CloudError);
            } else {
                this.stack = (new Error()).stack;
            }
        };

    util.defineClass(CloudError, Error, {
        toString: function () {
            return this.code + ' ' + this.message;
        }
    });

    provide(CloudError);
});
