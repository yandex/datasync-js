ns.modules.define('cloud.dataSyncApi.http', [
    'cloud.dataSyncApi.config',
    'cloud.client',
    'component.xhr',
    'component.util',
    'global',
    'Promise',
    'cloud.Error'
], function (provide, config, client, xhr, util, global, Promise, Error) {
    var check = function (options) {
            if (!options) {
                return fail('`options` Parameter Required');
            }
            if (!allowedContext(options.context)) {
                return fail('Invalid `options.context` Value');
            }
            return null;
        },
        allowedContext = function (context) {
            return context && config.contexts[context];
        },
        fail = function (code, message) {
            if (!message) {
                message = code;
                code = 400;
            }
            return Promise.reject(new Error({
                code: code,
                message: message
            }));
        },
        addAuthorization = function (options, rawParams) {
            var params = util.extend({}, rawParams);
            if (!params.headers) {
                params.headers = {};
            } else {
                params.headers = util.extend({}, params.headers);
            }

            if (options.token) {
                params.headers.Authorization = 'OAuth ' + options.token;
                return Promise.resolve(params);
            } else if (client.isInitialized()) {
                if (client.withCredentials()) {
                    params.withCredentials = true;
                } else {
                    params.headers.Authorization = 'OAuth ' + client.getToken();
                }
                return Promise.resolve(params);
            } else {
                if (options && (options.authorize_if_needed || typeof options.authorize_if_needed == 'undefined')) {
                    return client.initialize(options).then(function () {
                        if (client.withCredentials()) {
                            params.withCredentials = true;
                        } else {
                            params.headers.Authorization = 'OAuth ' + client.getToken();
                        }
                        return params;
                    })
                } else {
                    return Promise.reject(new Error({
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

            return check(options) || addAuthorization(options, {
                queryParams: queryParams,
                parse: true
            }).then(function (params) {
                return xhr(url, params);
            });
        },

        putDatabase: function (options) {
            var error = check(options);
            if (!error && typeof options.database_id != 'string') {
                error = fail('`options.database_id` Parameter Required');
            }

            return error || addAuthorization(options, {
                method: 'PUT',
                parse: true
            }).then(function (params) {
                return xhr(
                    config.apiHost + 'v1/data/' +
                        options.context + '/databases/' + options.database_id,
                    params
                );
            });
        },

        deleteDatabase: function (options) {
            var error = check(options);
            if (!error && typeof options.database_id != 'string') {
                error = fail('`options.database_id` Parameter Required');
            }

            return error || addAuthorization(options, {
                method: 'DELETE',
                // NB: DELETE database отдаёт пустой ответ при успехе
                parse: false
            }).then(function (params) {
                return xhr(
                    config.apiHost + 'v1/data/' +
                        options.context + '/databases/' + options.database_id,
                    params
                );
            });
        },

        getSnapshot: function (options) {
            return check(options) || addAuthorization(options, {
                parse: true,
                queryParams: {
                    collection_id: options && options.collection_id
                }
            }).then(function (params) {
                return xhr(
                    config.apiHost + 'v1/data/' +
                        options.context + '/databases/' +
                        options.database_id + '/snapshot',
                    params
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

            return error || addAuthorization(options, {
                method: 'GET',
                queryParams: {
                    base_revision: options.base_revision,
                    limit: typeof options.limit == 'undefined' ? 100 : options.limit
                },
                parse: true
            }).then(function (params) {
                return xhr(
                    config.apiHost + 'v1/data/' +
                        options.context + '/databases/' +
                        options.database_id + '/deltas',
                    params
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

            return error || addAuthorization(options, {
                method: 'POST',
                headers: {
                    'If-Match': options.base_revision
                },
                parse: true,
                data: options.data
            }).then(function (params) {
                return xhr(
                    config.apiHost + 'v1/data/' +
                        options.context + '/databases/' +
                        options.database_id + '/deltas',
                    params
                );
            });
        },

        subscribe: function (options) {
            return addAuthorization(options, {
                parse: true
            }).then(function (params) {
                return xhr(
                    config.apiHost + 'v1/data/subscriptions/web?databases_ids=' +
                        encodeURIComponent(options.database_ids.join(',')),
                    params
                );
            });
        }
    });
});