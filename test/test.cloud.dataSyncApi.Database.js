var expect = expect || require('expect.js'),
    ya = ya || require('../build/cloud-data-sync-api.js');

if (typeof XMLHttpRequest == 'undefined') {
    XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
}

ya.modules.define('test.cloud.dataSyncApi.Database', [
    'vow',
    'cloud.dataSyncApi.cache',
    'cloud.dataSyncApi.Database',
    'cloud.dataSyncApi.Record',
    'cloud.dataSyncApi.Operation',
    'cloud.dataSyncApi.FieldOperation',
    'cloud.dataSyncApi.Value',
    'cloud.dataSyncApi.http',
    'cloud.Error',
    'cloud.dataSyncApi.config'
], function (provide, vow, cache, Database, Record, Operation, FieldOperation, Value, http, Error, config) {
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
        use_client_storage = params.use_client_storage == 'true',
        name = params.database_id || 'ya_cloud_api_test',

        defaultParams = {
            database_id: name,
            context: context,
            token: token,
            use_client_storage: use_client_storage,
            create_if_not_exists: true
        },

        transaction,

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

    describe('cloud.dataSyncApi.Database', function () {
        var getFailer = function (done) {
                return function (e) {
                    vow.all([
                        http.deleteDatabase(defaultParams),
                        cache.clear()
                    ]).then(function () {
                        done(e || new Error());
                    }, function (e) {
                        done(e);
                    });
                };
            },
            prepareDatabase = function (done, fail) {
                return http.deleteDatabase(defaultParams).then(function () {
                    (new Database(defaultParams)).then(done, fail).fail(fail);
                }, fail).fail(fail);
            };

        this.timeout(30000);

        after(function () {
            Database.closeAll();
            return http.deleteDatabase(defaultParams);
        });

        it('constructor', function (done) {
            var fail = getFailer(done);

            prepareDatabase(function (database) {
                expect(database.getDatabaseId()).to.be(name);
                doneHandler(done);
            }, fail).fail(fail);
        });

        it('local conflicts', function (done) {
            var fail = getFailer(done);

            prepareDatabase(function (database) {
                testLocalConflicts(database);
            }, fail).fail(fail);

            function testLocalConflicts (database) {
                database.createTransaction()
                    .insertRecords({
                        record_id: 'rec',
                        collection_id: 'col',
                        fields: {
                            a: 1
                        }
                    })
                    .insertRecords([
                        new Record({
                            record_id: 'rec',
                            collection_id: 'col',
                            fields: {}
                        })
                    ])
                    .setRecordFieldListItem({
                        record_id: 'rec',
                        collection_id: 'col'
                    }, {
                        field_id: 'a',
                        index: 0,
                        value: null
                    })
                    .push().then(fail, function (e) {
                        expect(e.code).to.be(409);
                        expect(e.conflicts.length).to.be(2);
                        expect(e.conflicts[0].index).to.be(1);
                        expect(e.conflicts[0].conflict.getType()).to.be('record_already_exists');
                        expect(e.conflicts[1].index).to.be(2);
                        expect(e.conflicts[1].conflict.getType()).to.be('invalid_field_change');
                        expect(e.conflicts[1].conflict.getFieldChangeConflicts().length).to.be(1);
                        expect(e.conflicts[1].conflict.getFieldChangeConflicts()[0].index).to.be(0);
                        expect(e.conflicts[1].conflict.getFieldChangeConflicts()[0].type).to.be('modify_not_a_list_field');
                        doneHandler(done);
                    }).fail(fail);
            }
        });

        it('transaction#push', function (done) {
            var fail = getFailer(done);

            prepareDatabase(function (database) {
                testPush(database);
            }, fail).fail(fail);

            function testPush (database) {
                database.createTransaction()
                    .insertRecords([{
                        record_id: 'rec',
                        collection_id: 'col',
                        fields: {
                            b: null
                        }
                    }, new Record({
                        record_id: 'rec_2',
                        collection_id: 'col',
                        fields: {
                            a: [],
                            b: false
                        }
                    })])
                    .setRecordFields({
                        record_id: 'rec',
                        collection_id: 'col'
                    }, {
                        a: 0
                    })
                    .updateRecordFields({
                        record_id: 'rec_2',
                        collection_id: 'col'
                    }, {
                        b: undefined,
                        c: 3.14
                    })
                    .insertRecordFieldListItem({
                        record_id: 'rec_2',
                        collection_id: 'col'
                    }, {
                        field_id: 'a',
                        index: 0,
                        value: 1
                    })
                    .push().then(function (res) {
                        expect(res).to.be(database.getRevision());

                        var dump = {col: {}};
                        database.forEach(function (record) {
                            dump[record.getCollectionId()][record.getRecordId()] = record.getFieldIds().reduce(function (fields, key) {
                                var value = record.getFieldValue(key);
                                if (value.getType() != 'list') {
                                    fields[key] = value.valueOf();
                                } else {
                                    fields[key] = '[' + value.valueOf().join('') + ']';
                                }
                                return fields;
                            }, {});
                        });
                        expect(dump).to.eql({
                            col: {
                                rec: {
                                    a: 0
                                },
                                rec_2: {
                                    a: '[1]',
                                    c: 3.14
                                }
                            }
                        });
                        doneHandler(done);
                    }, fail).fail(fail);
            }
        });

        it('events', function (done) {
            var fail = getFailer(done);

            prepareDatabase(function (database) {
                testEvents(database);
            }, fail).fail(fail);

            function testEvents (database) {
                var counter = 0,
                    listener = function () {
                        counter++;
                    };

                database.on('update', listener);

                database.createTransaction()
                    .insertRecords({
                        collection_id: 'col',
                        record_id: 'rec'
                    })
                    .push().then(function () {
                        expect(counter).to.be(1);
                        database.off('update', listener);

                        database.createTransaction()
                            .insertRecords({
                                collection_id: 'col',
                                record_id: 'rec_2'
                            })
                            .push().then(function () {
                                expect(counter).to.be(1);
                                doneHandler(done);
                            }, fail).fail(fail);

                    }, fail).fail(fail);
            }
        });

        it('update', function (done) {
            var fail = getFailer(done);

            prepareDatabase(function (database) {
                testUpdate(database);
            }, fail).fail(fail);

            function testUpdate (database) {
                database.on('update', function (res) {
                    expect(res).to.be(database.getRevision());
                    expect(database.getRecord('col', 'rec')).to.be.a(Record);
                    doneHandler(done);
                });

                postDelta(database);
            }

            function postDelta (database) {
                http.postDeltas({
                    database_id: database.getDatabaseId(),
                    base_revision: database.getRevision(),
                    token: token,
                    context: context,
                    data: {
                        changes: [
                            {
                                record_id: 'rec',
                                collection_id: 'col',
                                change_type: 'insert'
                            }
                        ]
                    }
                }).then(function (res) {
                    if (res.code != 201) {
                        fail(res);
                    } else {
                        database.update().fail(fail);
                    }
                }, fail).fail(fail);
            }
        });

        it('Tons of deltas', function (done) {
            var fail = getFailer(done),
                number = 4;

            config.deltaLimit = 3;

            prepareDatabase(function (database) {
                testUpdate(database);
            }, fail).fail(fail);

            function testUpdate (database) {
                database.on('update', function (res) {
                    expect(res).to.be(database.getRevision());
                    expect(database.getRecord('col', 'rec').getFieldValue('a').valueOf()).to.be(number);
                    doneHandler(done);
                });

                postDeltas (database);
            }

            function postDeltas (database) {
                var cb = function (rev) {
                        if (rev < number) {
                            postDelta(Number(rev) + 1, cb);
                        } else {
                            database.update().fail(fail);
                        }
                    },
                    revision = database.getRevision();

                postDelta(1, cb);

                function postDelta (rev, callback) {
                    http.postDeltas({
                        database_id: database.getDatabaseId(),
                        base_revision: revision,
                        token: token,
                        context: context,
                        data: {
                            changes: [
                                {
                                    record_id: 'rec',
                                    collection_id: 'col',
                                    change_type: 'set',
                                    changes: [
                                        {
                                            change_type: 'set',
                                            field_id: 'a',
                                            value: {
                                                type: 'double',
                                                double: rev
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    }).then(function (res) {
                        if (res.code != 201) {
                            fail(res);
                        } else {
                            revision = Number(res.headers.etag);
                            callback(rev);
                        }
                    }, fail).fail(fail);
                }
            }
        });

        it('Remote conflicts', function (done) {
            var fail = getFailer(done);

            prepareDatabase(function (database) {
                populate(database);
            }, fail).fail(fail);

            function populate (database) {
                database.createTransaction()
                    .insertRecords([
                        {
                            collection_id: 'col',
                            record_id: 'rec',
                            fields: {
                                a: [0, 1]
                            }
                        }, {
                            collection_id: 'col',
                            record_id: 'rec_2'
                        }
                    ])
                    .push().then(function () {
                        makeConflict(database);
                    }, fail).fail(fail);
            }

            function makeConflict (database) {
                http.postDeltas({
                    database_id: database.getDatabaseId(),
                    base_revision: database.getRevision(),
                    token: token,
                    context: context,
                    data: {
                        delta_id: 'abcd',
                        changes: [
                            {
                                record_id: 'rec',
                                collection_id: 'col',
                                change_type: 'update',
                                changes: [
                                    {
                                        change_type: 'set',
                                        field_id: 'a',
                                        value: {
                                            type: 'double',
                                            double: 0
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                }).then(function (res) {
                    if (res.code != 201) {
                        fail(res);
                    } else {
                        tryPush(database);
                    }
                }, fail).fail(fail);
            }

            function tryPush (database) {
                transaction = database.createTransaction()
                    .setRecordFields({
                        collection_id: 'col',
                        record_id: 'rec_2'
                    }, {
                        a: 1
                    })
                    .insertRecordFieldListItem({
                        collection_id: 'col',
                        record_id: 'rec'
                    }, {
                        field_id: 'a',
                        index: 0,
                        value: 1
                    })
                    .updateRecordFields({
                        collection_id: 'col',
                        record_id: 'rec_2'
                    }, {
                        b: 2
                    });

                transaction.push().then(fail, function (e) {
                    expect(e.code).to.be(409);
                    expect(e.conflicts.length).to.be(1);
                    expect(e.conflicts[0].index).to.be(1);
                    expect(e.conflicts[0].conflict.getType()).to.be('both_modified');

                    tryPolitics(transaction, database);
                }).fail(fail);
            }

            function tryPolitics (transaction, database) {
                transaction.push('theirs').then(function () {
                    expect(database.getRecord('col', 'rec').getFieldValue('a').valueOf()).to.be(0);
                    expect(database.getRecord('col', 'rec_2').getFieldValue('b').valueOf()).to.be(2);

                    doneHandler(done);
                }, fail).fail(fail);
            }
        });

        it('locks', function (done) {
            var fail = getFailer(done);

            prepareDatabase(function (database) {
                runConcurrentUpdates(database);
            }, fail).fail(fail);

            function runConcurrentUpdates (database) {
                var transaction1 = database.createTransaction()
                        .insertRecords({
                            record_id: 'rec',
                            collection_id: 'col',
                            fields: {
                                a: 1
                            }
                        });
                var transaction2 = database.createTransaction()
                    .insertRecords({
                        record_id: 'rec_2',
                        collection_id: 'col',
                        fields: {
                            a: 1
                        }
                    });

                var promises = [
                        transaction1.push(),
                        database.update(),
                        transaction2.push(),
                        database.update()
                    ];

                vow.all(promises).then(function (res) {
                    expect(res[0] > 0).to.be.ok();
                    expect(res[1] <= res[0]).to.be.ok();
                    expect(res[2] > res[1]).to.be.ok();
                    expect(res[3] <= res[2]).to.be.ok();

                    expect(database.getRecord('col', 'rec')).to.be.ok();
                    expect(database.getRecord('col', 'rec_2')).to.be.ok();

                    doneHandler(done);
                }, fail).fail(fail);
            }
        });

        it('Gone', function (done) {
            var failer = getFailer(done),
                old = http.getDeltas,
                fail = function () {
                    http.getDeltas = old;
                    failer();
                },
                number = 15;

            prepareDatabase(function (database) {
                postDeltas(database);
            });

            function postDeltas (database) {
                var i = 0,
                    revision = database.getRevision();

                next();

                function next () {
                    http.postDeltas({
                        database_id: database.getDatabaseId(),
                        base_revision: revision,
                        token: token,
                        context: context,
                        data: {
                            changes: [
                                {
                                    record_id: 'rec_' + i.toString(),
                                    collection_id: 'col',
                                    change_type: 'insert'
                                }
                            ]
                        }
                    }).then(function (res) {
                        revision = Number(res.headers.etag);
                        if (++i < number) {
                            next();
                        } else {
                            testUpdate(database);
                        }
                    }, fail).fail(fail);
                }
            }

            function testUpdate (database) {
                http.getDeltas = function () {
                    return vow.resolve({
                        code: 410
                    });
                };

                database.update().then(fail, function (e) {
                    expect(e.code).to.be(410);
                    database.createTransaction().push().then(fail, function (e) {
                        expect(e.code).to.be(410);
                        http.getDeltas = old;
                        doneHandler(done);
                    }).fail(fail);
                });
            }
        });

        it('Missed delta', function (done) {
            var fail = getFailer(done);

            prepareDatabase(function (database) {
                database.createTransaction()
                    .insertRecords({
                        collection_id: 'col',
                        record_id: 'rec',
                        fields: {
                            a: 1,
                            b: 0
                        }
                    })
                    .push().then(function () {
                        postDeltas(database);
                    }, fail).fail(fail);
            });

            function postDeltas (database) {
                var old = http.postDeltas;
                http.postDeltas = function () {
                    return old.apply(http, [].slice.call(arguments)).then(function (res) {
                        throw new Error({
                            code: 500
                        });
                    });
                };

                var tr = database.createTransaction()
                        .updateRecordFields({
                            collection_id: 'col',
                            record_id: 'rec'
                        }, {
                            a: undefined
                        });

                tr.push().then(fail, function () {
                    http.postDeltas = old;
                    tr.push().then(function () {
                        expect(database.getRecord('col', 'rec').getFieldIds()).to.eql(['b']);
                        doneHandler(done);
                    }, fail).fail(fail);
                }).fail(fail);
            }
        });

        it('Extremely Large Data', function (done) {
            var generateFields = function (num) {
                    var res = [];

                    for (var i = 0; i < num; i++) {
                        var type = ['string', 'datetime', 'double'][Math.floor(Math.random() * 3)],
                            value;

                        switch (type) {
                            case 'string':
                                value = Math.random().toString();
                                break;
                            case 'datetime':
                                value = (new Date()).toISOString();
                                break;
                            case 'double':
                                value = Math.random();
                                break;
                        }

                        var change = {
                                "field_id": Math.random().toString(),
                                "change_type": "set",
                                "value": {
                                    "type": type
                                }
                            };

                        change.value[type] = value;

                        res.push(change);
                    }
                    return res;
                },
                generateRecords = function (num, fieldNum) {
                    var res = [];
                    for (var i = 0; i < num; i++) {
                        res.push({
                            "record_id": Math.random().toString(),
                            "collection_id": "default",
                            "change_type": "set",
                            "changes": generateFields(fieldNum)
                        });
                    }
                    return res;
                },
                largeData = generateRecords(1000, 10),
                fail = getFailer(done);

            prepareDatabase(function () {
                http.postDeltas(Object.assign({}, defaultParams, {
                    base_revision: 0,
                    data: {
                        changes: largeData
                    }
                })).then(function (res) {
                    if (res.code == 201) {
                        testColdCache();
                    } else {
                        fail(new Error(res));
                    }
                }, fail).fail(fail);
            }, fail);

            function testColdCache () {
                var start = Date.now();
                (new Database(defaultParams)).then(function () {
                    console.log(Date.now() - start);
                    testWarmCache();
                }, fail).fail(fail);
            }

            function testWarmCache () {
                var start = Date.now();
                (new Database(defaultParams)).then(function () {
                    console.log(Date.now() - start);
                    doneHandler(done);
                }, fail).fail(fail);
            }
        });
    });

    provide();
});