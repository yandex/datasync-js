var expect = expect || require('expect.js'),
    ya = ya || require('../build/cloud-data-sync-api.js');

if (typeof XMLHttpRequest == 'undefined') {
    XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
}

ya.modules.define('test.cloud.dataSyncApi.DatasetController', [
    'vow',
    'cloud.dataSyncApi.cache',
    'cloud.dataSyncApi.Database',
    'cloud.dataSyncApi.Dataset',
    'cloud.dataSyncApi.DatasetController',
    'cloud.dataSyncApi.http',
    'test.util'
], function (provide, vow, cache, Database, Dataset, DatasetController, http, util) {
    var params = typeof process != 'undefined' ?
             Object.keys(process.env).reduce(function (params, key) {
                 if (key.indexOf('npm_config_') == 0) {
                     params[key.slice('npm_config_'.length)] = process.env[key];
                 }
                 return params;
             }, {}) :
             (window.location.search || '').replace(/^\?/, '').split('&').reduce(function (params, param) {
                 var pair = param.split('=', 2);
                 params[pair[0]] = pair[1];
                 return params;
             }, {}),
        token = params.token,
        context = params.context || 'app',
        name = params.database_id || 'ya_cloud_api_test',

        defaultParams = {
            database_id: name,
            context: context,
            token: token,
            use_client_storage: true
        },

        doneHandler = function (done) {
            function end () {
                window.setTimeout(function () {
                    done();
                }, 100);
            }

            vow.all([
                http.deleteDatabase(defaultParams),
                cache.clear()
            ]).then(end, done);
        };

    describe('cloud.dataSyncApi.DatasetController', function () {
        var getFailer = function (done) {
                return function (e) {
                    vow.all([
                        cache.clear(),
                        http.deleteDatabase(defaultParams)
                    ]).always(function () {
                        done(e || new Error());
                    });
                };
            },

            prepareDatabase = function (dataset, deltas) {
                return http.deleteDatabase(defaultParams).then(function () {
                    return http.putDatabase(defaultParams).then(function (res) {
                        var promises = [];

                        if (dataset) {
                            if (typeof dataset == 'string') {
                                promises.push(
                                    cache.saveItem(cache.getDatasetKey(context, res.data.handle), dataset)
                                );
                            } else {
                                if (!(dataset instanceof Dataset)) {
                                    dataset = Dataset.json.deserialize(dataset);
                                }
                                promises.push(cache.saveDataset(context, res.data.handle, dataset));
                            }
                        }
                        if (deltas) {
                            promises.push(http.postDeltas(deltas));
                        }

                        return vow.all(promises).then(function () {
                            return (new Database(defaultParams));
                        });
                    });
                });
            };

        this.timeout(10000);

        it('Init from cache', function (done) {
            var undoSnapshot = util.swapMethod(http, 'getSnapshot', function () {
                    throw new Error();
                }),
                undoDeltas = util.swapMethod(http, 'getDeltas', function () {
                    return vow.resolve({
                        code: 200,
                        data: {
                            items: []
                        }
                    });
                }),
                fail = getFailer(function (e) {
                    undoSnapshot();
                    undoDeltas();
                    done(e);
                });

            prepareDatabase(util.snapshotJson).then(function (database) {
                undoSnapshot();
                undoDeltas();
                util.checkDataset(database, util.snapshotJson);
                doneHandler(done);
            }, fail).fail(fail);
        });

        it('Init from corrupted cache', function (done) {
            var undoDeltas = util.swapMethod(http, 'getDeltas', function () {
                    return vow.resolve({
                        code: 200,
                        data: {
                            items: []
                        }
                    });
                }),
                fail = getFailer(function (e) {
                    undoDeltas();
                    done(e);
                }),
                corruptedCache = '{|}';

            prepareDatabase(corruptedCache, Object.assign({}, defaultParams, {
                base_revision: 0,
                data: {
                    changes: [
                        {
                            record_id: 'rec',
                            collection_id: 'col',
                            change_type: 'insert'
                        }
                    ]
                }
            })).then(function (database) {
                expect(database.getRevision()).to.be(1);
                util.checkDataset(database, {
                    revision: 0,
                    records: {
                        items: [{
                            record_id: 'rec',
                            collection_id: 'col',
                            revision: 0,
                            fields: []
                        }]
                    }
                });
                doneHandler(done);
            }, fail).fail(fail);
        });


        it('Update from cache', function (done) {
            var undoSnapshot = util.swapMethod(http, 'getSnapshot', function () {
                    throw new Error();
                }),
                undoDeltas = util.swapMethod(http, 'getDeltas', function () {
                    return vow.resolve({
                        code: 200,
                        data: {
                            revision: util.snapshotJson.revision + 1,
                            items: [{
                                base_revision: util.snapshotJson.revision,
                                revision: util.snapshotJson.revision + 1,
                                changes: [{
                                    record_id: 'rec_1',
                                    collection_id: 'col',
                                    change_type: 'delete'
                                }]
                            }]
                        }
                    });
                }),
                fail = getFailer(function (e) {
                    undoSnapshot();
                    undoDeltas();
                    done(e);
                });

            prepareDatabase(util.snapshotJson).then(function (database) {
                expect(database.getRevision()).to.be(util.snapshotJson.revision + 1);
                expect(database.getRecord('col', 'rec_1')).to.be(undefined);
                testSaving();
            }, fail).fail(fail);

            function testSaving () {
                undoDeltas();
                undoDeltas = util.swapMethod(http, 'getDeltas', function () {
                    return vow.resolve({
                        code: 200,
                        data: {
                            items: []
                        }
                    });
                });

                (new Database(defaultParams)).then(function (database) {
                    expect(database.getRevision()).to.be(util.snapshotJson.revision + 1);
                    expect(database.getRecord('col', 'rec_1')).to.be(undefined);

                    undoSnapshot();
                    undoDeltas();
                    done();
                }, fail).fail(fail);
            }
        });
    });

    provide();
});