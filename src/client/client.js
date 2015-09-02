var Client = function () {
    this._initialized = false;
    this._key = null;
    this._token = null;
};

/**
 * Инициализирует сессию, авторизует пользователя.
 * @name cloud.client.initialize
 * @function
 * @param {Object} options Опции.
 * @param {String} [options.key] Публичный ключ приложения.
 * @param {String} [options.token] OAuth-токен. Если
 * не передан, будет показано окно с диалогом авторизации;
 * в этом случае параметр key обязателен.
 * @returns {vow.Promise} Объект-Promise, который будет либо подтверждён
 * при успешной аутентификации, либо отклонён в противном случае.
 * @static
 */
Client.prototype.initialize = function (options) {
    var deferred = ns.vow.defer();

    ns.modules.require([
        'cloud.dataSyncApi.config',
        'component.util',
        'cloud.Error',
        'vow',
        'global'
    ], (function (config, util, Error, vow, global) {
        if (!options) {
            deferred.reject(new Error({
                message: '`options` Parameter Required'
            }));
        } else if (!options.key && !options.token && !options.with_credentials) {
            deferred.reject(new Error({
                message: 'Either `options.key` or `options.token` Parameter Required'
            }));
        } else {
            if (options.token) {
                this._token = options.token;
                this._initialized = true;
                deferred.resolve();
            } else if (options.with_credentials) {
                this._withCredentials = true;
                this._initialized = true;
                deferred.resolve();
            } else {
                var oauthWindow = global.open(
                    config.oauthLoginPage.replace(/{{\s*key\s*}}/g, options.key),
                    'oauth',
                    config.oauthWindowParameters
                );

                if (oauthWindow) {
                    var intervalId = global.setInterval(function () {
                        if (oauthWindow.closed) {
                            global.clearInterval(intervalId);
                            deferred.reject(new Error({
                                code: 401
                            }));
                        } else {
                            try {
                                var match = oauthWindow.location.hash.match(/access_token=([0-9a-f]+)/);
                                if (match) {
                                    this._token = match[1];
                                    this._initialized = true;
                                    oauthWindow.close();
                                    global.clearInterval(intervalId);
                                    deferred.resolve(this._token);
                                }
                            } catch (e) {}
                        }
                    }.bind(this), 100);
                } else {
                    deferred.reject(new Error({
                        code: 401
                    }));
                }
            }
        }
    }).bind(this));

    return deferred.promise();
};

/**
 * @name cloud.client.isInitialized
 * @function
 * @returns {Boolean} true - сессия инициализирована, клиент
 * аутентифицирован, false в противном случае.
 * @static
 */
Client.prototype.isInitialized = function () {
    return this._initialized;
};

// #12 — оставлено для обратной совместимости.
Client.prototype.isInitiaized = Client.prototype.isInitialized

/**
 * @name cloud.client.getToken
 * @function
 * @returns {String|null} OAuth-токен или null, если сессия
 * не была инициализирована.
 * @static
 */
Client.prototype.getToken = function () {
    return this._token;
};

Client.prototype.withCredentials = function () {
    return this._withCredentials;
}

ns.cloud.client = new Client();

ns.modules.define('cloud.client', [], function (provide) {
    /**
     * @class OAuth-клиент, позволяющий аутентифицировать пользователя.
     * @name cloud.client
     * @static
     */
    provide(ns.cloud.client);
});
