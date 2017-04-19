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
 * @returns {Promise} Объект-Promise, который будет либо подтверждён
 * при успешной аутентификации, либо отклонён в противном случае.
 * @static
 */
Client.prototype.initialize = function (options) {
    return new ns.Promise(function(resolve, reject) {
        ns.modules.require([
            'cloud.dataSyncApi.config',
            'component.util',
            'cloud.Error',
            'Promise',
            'global'
        ], (function (config, util, Error, Promise, global) {
            if (!options) {
                reject(new Error({
                    message: '`options` Parameter Required'
                }));
            } else if (!options.key && !options.token && !options.with_credentials) {
                reject(new Error({
                    message: 'Either `options.key` or `options.token` Parameter Required'
                }));
            } else {
                if (options.token) {
                    this._token = options.token;
                    this._initialized = true;
                    resolve();
                } else if (options.with_credentials) {
                    this._withCredentials = true;
                    this._initialized = true;
                    resolve();
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
                                reject(new Error({
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
                                        resolve(this._token);
                                    }
                                } catch (e) {
                                    // do nothing
                                }
                            }
                        }.bind(this), 100);
                    } else {
                        reject(new Error({
                            code: 401
                        }));
                    }
                }
            }
        }).bind(this));
    }.bind(this));
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
