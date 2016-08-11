var expect = expect || require('expect.js'),
    ya = ya || require('../build/cloud-data-sync-api.js');

ya.modules.define('test.cloud.dataSyncApi.syncEngine', [
    'vow',
    'global',
    'cloud.dataSyncApi.syncEngine.PollEngine',
    'cloud.dataSyncApi.syncEngine.PushEngine',
    'cloud.dataSyncApi.http',
    'cloud.dataSyncApi.config',
    'cloud.dataSyncApi.cache',
    'test.util'
], function (provide, vow, global, PollEngine, PushEngine, http, config, cache, util) {
    var params = util.extractParams(),
        context = params.context || 'app',
        name = params.database_id || 'ya_cloud_api_test',

        db1 = {
            getContext: function () {
                return context;
            },
            getDatabaseId: function () {
                return name + '_1';
            },
            revision: 1,
            getRevision: function () {
                return this.revision;
            },
            close: function () {}
        },

        db2 = {
            getContext: function () {
                return context;
            },
            getDatabaseId: function () {
                return name + '_2';
            },
            revision: 1,
            getRevision: function () {
                return this.revision;
            },
            close: function () {}
        },

        timeouted = util.timeouted,

        prepareWebSocket = function (listener) {
            mocks.push(sinon.stub(global, 'WebSocket', function () {
                var socket = {
                    _closed: false,
                    onmessage: function () {},
                    onerror: function () {},
                    close: function () {
                        this._closed = true;
                    },
                    message: function (data) {
                        if (!this._closed) {
                            this.onmessage({
                                data: JSON.stringify({
                                    operation: 'datasync_database_changed',
                                    message: JSON.stringify(data)
                                })
                            });
                        }
                    }
                };
                listener(socket);
                return socket;
            }));
        },
        prepareHttpMethod = function (method, listener) {
            mocks.push(sinon.stub(http, method, function (parameters) {
                return listener(parameters);
            }));
        },
        setupMocks = function (parameters) {
            if (parameters.WebSocket) {
                prepareWebSocket(parameters.WebSocket);
            }
            if (parameters.http) {
                Object.keys(parameters.http).forEach(function (method) {
                    var options = parameters.http[method];
                    prepareHttpMethod(method, function (params) {
                        return timeouted({
                            code: options.code || 200,
                            data: typeof options.data == 'function' ?
                                options.data(params) :
                                options.data
                        }, options.timeout);
                    });
                });
            }
        },

        restoreMocks = function () {
            mocks.forEach(function (stub) {
                stub.restore();
            });
            mocks = [];
        },
        mocks = [],

        prepareEngine = function (options, ready, done) {
            var log = [],
                onUpdate = function (key, revision) {
                    log.push('update:' + key + ':' + revision);
                },
                engine = options.poll ?
                    new PollEngine({
                        onUpdate: onUpdate,
                        onFail: done,
                        backgroundSyncInterval: options.backgroundSyncInterval
                    }) :
                    new PushEngine({
                        onUpdate: onUpdate,
                        onFail: done
                    }),
                changer,
                key1 = db1.getContext() + ':' + db1.getDatabaseId(),
                key2 = db2.getContext() + ':' + db2.getDatabaseId(),
                httpResponse = {};

            httpResponse[key1] = {
                revision: options.revisions[0]
            };
            httpResponse[key2] = {
                revision: options.revisions[1]
            };

            var mockOptions = {
                    http: {
                        subscribe: {
                            timeout: options.subscribeDelay || 100,
                            data: {"href": ""}
                        },
                        getDatabases: {
                            timeout: options.getDatabasesDelay || 50,
                            data: function (options) {
                                return httpResponse[options.context + ':' + options.database_id];
                            }
                        }
                    }
                };

            if (options.poll) {
                changer = function (data) {
                    httpResponse[data.context + ':' + data.database_id].revision = data.revision;
                }
            } else {
                var socket;
                mockOptions.WebSocket = function (s) {
                    socket = s;
                };
                changer = function (data) {
                    socket.message(data)
                };
            }

            setupMocks(mockOptions);

            engine.addDatabase(db1);
            engine.addDatabase(db2);

            ready(engine, changer, log, function () {
                engine.removeAll();
                done();
            });
        };

    describe('cloud.dataSyncApi.syncEngine', function () {
        it('PushEngine.addDatabase', function (done) {
            prepareEngine({
                    revisions: [1, 2],
                    subscribeDelay: 50,
                    getDatabasesDelay: 100
                },
                function (pushEngine, socket, log, done) {
                    setTimeout(function () {
                        expect(log).to.eql([
                            'update:' + context + ':' + name + '_2:2'
                        ]);
                        done();
                    }, 200);
                },
                function (e) {
                    restoreMocks();
                    done(e);
                }
            );
        });

        it('PushEngine.addDatabase subscription race', function (done) {
            prepareEngine({
                    revisions: [1, 2],
                    subscribeDelay: 100,
                    getDatabasesDelay: 50
                },
                function (pushEngine, socket, log, done) {
                    setTimeout(function () {
                        expect(log).to.eql([
                            'update:' + context + ':' + name + '_2:2'
                        ]);
                        done();
                    }, 200);
                },
                function (e) {
                    restoreMocks();
                    done(e);
                }
            );
        });

        it('PushEngine.removeDatabase', function (done) {
            prepareEngine({
                    revisions: [1, 2],
                    subscribeDelay: 100,
                    getDatabasesDelay: 50
                },
                function (pushEngine, socket, log, done) {
                    pushEngine.removeDatabase(db2);
                    setTimeout(function () {
                        expect(log).to.eql([]);
                        done();
                    }, 200);
                },
                function (e) {
                    restoreMocks();
                    done(e);
                }
            );
        });

        it('PushEngine.addDatabase # push', function (done) {
            prepareEngine({
                    revisions: [1, 1],
                    subscribeDelay: 50,
                    getDatabasesDelay: 150
                },
                function (pushEngine, socket, log, done) {
                    setTimeout(function () {
                        socket({
                            context: context,
                            database_id: name + '_1',
                            revision: 2
                        });

                        setTimeout(function () {
                            expect(log).to.eql([
                                'update:' + context + ':' + name + '_1:2'
                            ]);
                            done();
                        }, 100);
                    }, 100);
                },
                function (e) {
                    restoreMocks();
                    done(e);
                }
            );
        });

        it('PushEngine.removeDatabase # push', function (done) {
            prepareEngine({
                    revisions: [1, 1],
                    subscribeDelay: 50,
                    getDatabasesDelay: 150
                },
                function (pushEngine, socket, log, done) {
                    setTimeout(function () {
                        pushEngine.removeDatabase(db1);

                        socket({
                            context: context,
                            database_id: name + '_1',
                            revision: 2
                        });

                        setTimeout(function () {
                            expect(log).to.eql([]);
                            done();
                        }, 100);
                    }, 100);
                },
                function (e) {
                    restoreMocks();
                    done(e);
                }
            );
        });

        it('PollEngine.addDatabase', function (done) {
            prepareEngine({
                    revisions: [1, 2],
                    poll: true,
                    subscribeDelay: 50,
                    getDatabasesDelay: 100
                },
                function (pushEngine, socket, log, done) {
                    setTimeout(function () {
                        expect(log).to.eql([
                            'update:' + context + ':' + name + '_2:2'
                        ]);
                        done();
                    }, 200);
                },
                function (e) {
                    restoreMocks();
                    done(e);
                }
            );
        });

        it('PollEngine.addDatabase subscription race', function (done) {
            prepareEngine({
                    revisions: [1, 2],
                    poll: true,
                    subscribeDelay: 100,
                    getDatabasesDelay: 50
                },
                function (pushEngine, socket, log, done) {
                    setTimeout(function () {
                        expect(log).to.eql([
                            'update:' + context + ':' + name + '_2:2'
                        ]);
                        done();
                    }, 200);
                },
                function (e) {
                    restoreMocks();
                    done(e);
                }
            );
        });

        it('PollEngine.removeDatabase', function (done) {
            prepareEngine({
                    revisions: [1, 2],
                    poll: true,
                    subscribeDelay: 100,
                    getDatabasesDelay: 50
                },
                function (pushEngine, socket, log, done) {
                    pushEngine.removeDatabase(db2);
                    setTimeout(function () {
                        expect(log).to.eql([]);
                        done();
                    }, 200);
                },
                function (e) {
                    restoreMocks();
                    done(e);
                }
            );
        });

        it('PollEngine.addDatabase # sync', function (done) {
            prepareEngine({
                    revisions: [1, 1],
                    poll: true,
                    backgroundSyncInterval: 50,
                    subscribeDelay: 50,
                    getDatabasesDelay: 150
                },
                function (pushEngine, socket, log, done) {
                    setTimeout(function () {
                        socket({
                            context: context,
                            database_id: name + '_1',
                            revision: 2
                        });

                        setTimeout(function () {
                            expect(log).to.eql([
                                'update:' + context + ':' + name + '_1:2'
                            ]);
                            done();
                        }, 300);
                    }, 100);
                },
                function (e) {
                    restoreMocks();
                    done(e);
                }
            );
        });

        it('PollEngine.removeDatabase # sync', function (done) {
            prepareEngine({
                    revisions: [1, 1],
                    poll: true,
                    subscribeDelay: 50,
                    backgroundSyncInterval: 50,
                    getDatabasesDelay: 150
                },
                function (pushEngine, socket, log, done) {
                    setTimeout(function () {
                        pushEngine.removeDatabase(db1);

                        socket({
                            context: context,
                            database_id: name + '_1',
                            revision: 2
                        });

                        setTimeout(function () {
                            expect(log).to.eql([]);
                            done();
                        }, 300);
                    }, 100);
                },
                function (e) {
                    restoreMocks();
                    done(e);
                }
            );
        });
    });

    provide();
});