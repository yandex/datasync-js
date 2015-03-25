ns.modules.define('cloud.dataSyncApi.http', [
    'cloud.dataSyncApi.config',
    'cloud.client',
    'component.xhr',
    'vow',
    'cloud.Error'
], function (provide, config, client, xhr, vow, Error) {
    var check = function (options) {
            if (!options) {
                return fail('`options` Parameter Required');
            }
            if (!allowedContext(options.context)) {
                return fail('Invalid `options.context` Value');
            }
        },
        allowedContext = function (context) {
            return context && config.contexts[context];
        },
        fail = function (code, message) {
            if (!message) {
                message = code;
                code = 400;
            }
            return vow.reject(new Error({
                code: code,
                message: message
            }));
        },
        authorizeIfNeeded = function (options) {
            if (options.token) {
                return vow.resolve(options.token);
            } else if (client.isInitiaized()) {
                return vow.resolve(client.getToken());
            } else {
                if (options && (options.authorize_if_needed || typeof options.authorize_if_needed == 'undefined')) {
                    return client.initialize(options);
                } else {
                    return vow.reject(new Error({
                        code: 401
                    }));
                }
            }
        };

    provide({
        getDatabases: function (options) {
            var url = config.apiHost + 'v1/data/' + options.context + '/databases',
                queryParams;

            if (options && options.database_id) {
                url += '/' + options.database_id;
            } else {
                queryParams = {
                    limit: Number(options && options.limit),
                    offset: Number(options && options.offset)
                };
            }

            return check(options) || authorizeIfNeeded(options).then(function (token) {
                return xhr(url, {
                    queryParams: queryParams,
                    headers: {
                        Authorization: 'OAuth ' + token
                    },
                    parse: true
                });
            });
        },

        putDatabase: function (options) {
            var error = check(options);
            if (!error && typeof options.database_id != 'string') {
                error = fail('`options.database_id` Parameter Required');
            }

            return error || authorizeIfNeeded(options).then(function (token) {
                return xhr(
                    config.apiHost + 'v1/data/' +
                    options.context + '/databases/' + encodeURIComponent(options.database_id), {
                        method: 'PUT',
                        headers: {
                            Authorization: 'OAuth ' + token
                        },
                        parse: true
                    }
                );
            });
        },

        deleteDatabase: function (options) {
            var error = check(options);
            if (!error && typeof options.database_id != 'string') {
                error = fail('`options.database_id` Parameter Required');
            }

            return error || authorizeIfNeeded(options).then(function (token) {
                return xhr(
                    config.apiHost + 'v1/data/' +
                    options.context + '/databases/' + encodeURIComponent(options.database_id), {
                        method: 'DELETE',
                        headers: {
                            Authorization: 'OAuth ' + token
                        },
                        // NB: DELETE database отдаёт пустой ответ при успехе
                        parse: false
                    }
                );
            });
        },

        getSnapshot: function (options) {
            return check(options) || authorizeIfNeeded(options).then(function (token) {
                return xhr(
                    config.apiHost + 'v1/data/' +
                    options.context + '/databases/' +
                    encodeURIComponent(options.database_id) + '/snapshot', {
                        headers: {
                            Authorization: 'OAuth ' + token
                        },
                        parse: true
                    }
                );
            });
        },

        getDeltas: function (options) {
            var error = check(options);

            if (!error && typeof options.database_id != 'string') {
                error = fail('`options.database_id` Parameter Required');
            }

            if (!error && typeof options.base_revision != 'number') {
                error = fail('`options.base_revision` Parameter Required');
            }

            return error || authorizeIfNeeded(options).then(function (token) {
                return xhr(
                    config.apiHost + 'v1/data/' +
                    options.context + '/databases/' +
                    encodeURIComponent(options.database_id) + '/deltas', {
                        method: 'GET',
                        headers: {
                            Authorization: 'OAuth ' + token
                        },
                        queryParams: {
                            base_revision: options.base_revision,
                            limit: typeof options.limit == 'undefined' ? 100 : options.limit
                        },
                        parse: true
                    }
                );
            });
        },

        postDeltas: function (options) {
            var error = check(options);

            if (!error && typeof options.database_id != 'string') {
                error = fail('`options.database_id` Parameter Required');
            }

            if (!error && typeof options.base_revision != 'number') {
                error = fail('`options.base_revision` Parameter Required');
            }

            if (!error && typeof options.data != 'object') {
                error = fail('`options.data` Parameter Required');
            }

            return error || authorizeIfNeeded(options).then(function (token) {
                return xhr(
                    config.apiHost + 'v1/data/' +
                    options.context + '/databases/' +
                    encodeURIComponent(options.database_id) + '/deltas', {
                        method: 'POST',
                        headers: {
                            Authorization: 'OAuth ' + token,
                            'If-Match': options.base_revision
                        },
                        parse: true,
                        data: options.data
                    }
                );
            });
        }
    });
});