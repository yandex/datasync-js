var expect = expect || require('expect.js'),
    ya = ya || require('../build/cloud-data-sync-api.js');

if (typeof XMLHttpRequest == 'undefined') {
    XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
}

ya.modules.define('test.cloud.dataSyncApi', ['cloud.dataSyncApi.http'], function (provide, http) {
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
            token: token
        };

    describe('cloud.dataSyncApi Static Namespace', function () {
        var getFailer = function (done) {
                return function (e) {
                    http.deleteDatabase(defaultParams).then(function () {
                        done(e || new Error());
                    }, function (e) {
                        done(e);
                    });
                };
            },
            prepareDatabase = function (done, fail) {
                return http.deleteDatabase(defaultParams).then(done, fail).fail(fail);
            },
            doneHandler = function (done) {
                function end () {
                    window.setTimeout(function () {
                        done();
                    }, 100);
                }

                http.deleteDatabase(defaultParams).then(end);
            };

        this.timeout(10000);

        it('create', function (done) {
            var fail = getFailer(done),
                rev;

            prepareDatabase(function () {
                ya.cloud.dataSyncApi.createDatabase(defaultParams).then(function (res) {
                    rev = res;
                    openDatabase();
                }, fail).fail(fail);
            }, fail);

            function openDatabase () {
                ya.cloud.dataSyncApi.openDatabase(defaultParams).then(function (database) {
                    expect(database.getDatabaseId()).to.be(defaultParams.database_id);
                    expect(database.getRevision()).to.be(rev);
                    tryCreatingAgain();
                }, fail).fail(fail);
            }

            function tryCreatingAgain () {
                ya.cloud.dataSyncApi.createDatabase(defaultParams).then(fail, function (e) {
                    expect(e.code).to.be(409);

                    ya.cloud.dataSyncApi.createDatabase({
                        database_id: defaultParams.database_id,
                        context: defaultParams.context,
                        token: defaultParams.token,
                        ignore_existing: true
                    }).then(function () {
                        doneHandler(done);
                    }, fail).fail(fail);
                }).fail(fail);
            }
        });

        it('listing', function (done) {
            var names = [
                    defaultParams.database_id + '_1',
                    defaultParams.database_id + '_2',
                    defaultParams.database_id + '_3'
                ],
                params = names.map(function (name) {
                    return {
                        context: defaultParams.context,
                        token: defaultParams.token,
                        database_id: name
                    }
                }),
                clean = function (done) {
                    ya.vow.all(params.map(http.deleteDatabase)).then(function () { done() }, done);
                },
                fail = function (e) {
                    clean(done)
                };

            ya.vow.all(params.map(ya.cloud.dataSyncApi.createDatabase.bind(ya.cloud.dataSyncApi))).then(function () {
                ya.cloud.dataSyncApi.getDatabaseMetadata(params[1]).then(function (res) {
                    expect(res.database_id).to.be(params[1].database_id);
                    ya.cloud.dataSyncApi.listDatabaseMetadata({
                        context: defaultParams.context,
                        token: defaultParams.token,
                        limit: 2,
                        offset: 1
                    }).then(function (res) {
                        expect(res.length).to.be(2);
                        expect(names.indexOf(res[0].database_id) != -1).to.be.ok();
                        expect(names.indexOf(res[1].database_id) != -1).to.be.ok();
                        clean(done);
                    }, fail).fail(fail);
                }, fail).fail(fail)
            }, fail).fail(fail);
        })
    });

    provide();
});