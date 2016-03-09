var expect = expect || require('expect.js'),
    ya = ya || require('../build/cloud-data-sync-api.js');

ya.modules.define('test.cloud.dataSyncApi.watcher', [
    'global',
    'test.util',
    'cloud.dataSyncApi.watcher'
], function (provide, global, util, watcher) {
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

        StubEngine = function (update, fail) {
            return {
                update: function (key, revision) {
                    update(key, revision);
                },
                fail: function (e) {
                    fail(e);
                },
                keys: [],
                addDatabase: function (dbs) {
                    if (!(dbs instanceof Array)) {
                        dbs = [dbs];
                    }
                    dbs.forEach(function (db) {
                        var key = db.getContext() + ':' + db.getDatabaseId();
                        if (this.keys.indexOf(key) != -1) {
                            throw new Error('Adding database more than once');
                        }
                        this.keys.push(key);
                    }, this);
                },
                removeDatabase: function (dbs) {
                    if (!(dbs instanceof Array)) {
                        dbs = [dbs];
                    }
                    dbs.forEach(function (db) {
                        var key = db.getContext() + ':' + db.getDatabaseId(),
                            index = this.keys.indexOf(key);
                        if (index == -1) {
                            throw new Error('Removing non-existing database');
                        } else {
                            this.keys.splice(index, 1);
                        }
                    }, this);
                }
            };
        },

        mock,
        setupMock = function (callback) {
            mock = sinon.stub(watcher, 'createEngine', function (update, fail) {
                var e = new StubEngine(update, fail);
                global.setTimeout(function () {
                    callback(e);
                }, 0);
                return e;
            });
        },

        restore = function () {
            mock.restore();
        };

    describe('watcher', function () {
        it('Watcher # adding and removing databases', function (done) {
            var end = function (e) {
                    restore();
                    done(e);
                },
                log = [],
                cb1 = function (res) {
                    log.push('1_' + res);
                },
                cb2 = function (res) {
                    log.push('2_' + res);
                },
                id1 = context + ':' + name + '_1',
                id2 = context + ':' + name + '_2',

                stubEngine;


            watcher.teardownEngine();
            setupMock(function (e) {
                stubEngine = e;
            });

            watcher.subscribe(db1, cb1);
            watcher.subscribe(db1, cb2);
            watcher.subscribe(db2, cb1);

            global.setTimeout(makeUpdate, 100);

            function makeUpdate () {
                stubEngine.update(id1, 2);
                global.setTimeout(testUpdate, 100);
            }

            function testUpdate () {
                expect(log).to.eql(['1_2', '2_2']);
                expect(expect(stubEngine.keys).to.eql([id1, id2]));

                testUnsubscribe();
            }

            function testUnsubscribe () {
                watcher.unsubscribe(db1, cb2);
                expect(expect(stubEngine.keys).to.eql([id1, id2]));

                watcher.unsubscribe(db1, cb1);
                expect(expect(stubEngine.keys).to.eql([id2]));

                end();
            }
        });
    });

    provide();
});
