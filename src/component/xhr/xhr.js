ns.modules.define('component.xhr', [
    'global',
    'Promise',
    'cloud.Error'
], function (provide, global, Promise, Error) {
    var XMLHttpRequest = global.XMLHttpRequest,
        parseHeaders = function (headers) {
            return headers.split('\u000d\u000a').reduce(function (result, line) {
                var parts = line.split('\u003a\u0020');
                if (parts.length == 2) {
                    result[parts[0].toLowerCase()] = parts[1].trim();
                }
                return result;
            }, {});
        };
    /**
     * @ignore
     * Шлёт запрос посредством кросс-доменного XMLHttpRequest.
     * @name component.util.xhr
     * @function
     * @statuc
     * @param {String} baseUrl Базовый URL
     * @param {Object} [options] Опции.
     * @param {String} [options.method = 'GET'] HTTP-метод.
     * @param {Object} [options.queryParams] Дополнительные query-параметры.
     * @param {Object} [options.data] Данные.
     * @param {Object} [options.headers] Дополнительные заголовки.
     * @param {Boolean} [options.parse = false] true — автоматически
     * применить JSON.parse к ответу сервера, false - не применять.
     * @param {Boolean} [options.parseResponseHeaders = true] true —
     * автоматически разобрать заголовки ответа и сформировать JSON-объект,
     * false — оставить строкой.
     * @param {Number} [options.timeout = 30000] Время ожидания ответа, в мс.
     * @returns {Promise} Объект-Promise, который будет либо подтверждён
     * полученными данными, либо отклонён с ошибкой.
     */
    provide(function (baseUrl, options) {
        options = options || {};
        if (options.queryParams) {
            baseUrl += (baseUrl.indexOf('?') == -1 ? '?' : '&') +
                Object.keys(options.queryParams).map(function (key) {
                    return key + '=' + global.encodeURIComponent(options.queryParams[key]);
                }).join('&');
        }

        var xhr = new XMLHttpRequest(),
            headers = options.headers || {},
            method = options.method || 'GET';

        if (method != 'GET' && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
        if (!headers['X-Requested-With']) {
            headers['X-Requested-With'] = 'XMLHttpRequest';
        }

        return new Promise(function(resolve, reject) {
            xhr.onload = function () {
                var result = {
                        code: this.status,
                        data: this.responseText,
                        headers: typeof options.parseResponseHeaders != 'undefined' && !options.parseResponseHeaders ?
                            this.getAllResponseHeaders() :
                            parseHeaders(this.getAllResponseHeaders())
                    };

                if (options.parse) {
                    try {
                        result.data = JSON.parse(result.data);
                    } catch (e) {
                        reject(new Error({
                            message: 'JSON Parse Error ' + result.data
                        }));
                    }
                }
                resolve(result);
            };

            xhr.onerror = function () {
                reject(new Error({
                    code: 500
                }));
            };

            xhr.open(method, baseUrl, true);

            Object.keys(headers).forEach(function (key) {
                xhr.setRequestHeader(key, headers[key]);
            });
            if (options.withCredentials) {
                xhr.withCredentials = true;
            }

            if (typeof options.data != 'undefined') {
                xhr.send(typeof options.data == 'string' ?
                    options.data :
                    JSON.stringify(options.data)
                );
            } else {
                xhr.send();
            }

            global.setTimeout(function() {
                reject(new Error({
                    message: 'ERRTIMEOUT'
                }));
            }, options.timeout || 30000);
        }).catch(function (e) {
            if (e && e.message === 'ERRTIMEOUT') {
                throw new Error({
                    code: 500,
                    message: 'Timeout Exceeded'
                });
            } else {
                throw e;
            }
        });
    });
});
