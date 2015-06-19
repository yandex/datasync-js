var expect = expect || require('expect.js'),
    ya = ya || require('../build/cloud-data-sync-api.js');

ya.modules.define('test.cloud.dataSyncApi.Dataset', [
    'cloud.dataSyncApi.Dataset',
    'cloud.dataSyncApi.Record',
    'cloud.dataSyncApi.Operation',
    'cloud.dataSyncApi.FieldOperation'
], function (provide, Dataset, Record, Operation, FieldOperation) {
    describe('cloud.dataSyncApi.Dataset', function () {
        var dataset,

            snapshotJson = {
                revision: 3,
                records: { items: [{
                    record_id: 'rec_1',
                    collection_id: 'col',
                    revision: 0,
                    fields: [
                        {"field_id": "field_0", "value": {"double": 3.14, "type": "double"}},
                        {"field_id": "field_list", "value": {"list": [
                            {"double": 3.14, "type": "double"},
                            {"integer": 123, "type": "integer"}
                        ], "type": "list"}}
                    ]
                }, {
                    record_id: 'rec_2',
                    collection_id: 'col',
                    revision: 0,
                    fields: []
                }, {
                    record_id: 'rec_1',
                    collection_id: 'col_2',
                    revision: 3,
                    fields: [{
                        field_id: "f1",
                        value: {
                            type: "integer",
                            integer: 1
                        }
                    }]
                }]}
            };

        function checkDataset(dataset, revision, ref) {
            expect(dataset.getRevision()).to.be(revision);

            var records = ref.reduce(function (records, record) {
                if (!records[record.collection_id]) {
                    records[record.collection_id] = {};
                }
                records[record.collection_id][record.record_id] = record.fields;
                return records;
            }, {});

            for (var it = dataset.iterator(), value = it.next(); !value.done; value = it.next()) {
                var recordRef = records[value.value.getCollectionId()] && records[value.value.getCollectionId()][value.value.getRecordId()];
                expect(recordRef).to.be.ok();
                checkRecord(value.value, recordRef);
            }
        }

        function checkRecord (record, values) {
            expect(record.getFieldIds().sort()).to.eql(Object.keys(values).sort());
            record.getFieldIds().forEach(function (key) {
                if (record.getFieldValue(key).getType() != 'list') {
                    expect(record.getFieldValue(key).valueOf()).to.be(values[key]);
                } else {
                    expect(record.getFieldValue(key).valueOf().length).to.be(values[key].length);
                    record.getFieldValue(key).valueOf().forEach(function (value, index) {
                        expect(value.valueOf()).to.be(values[key][index]);
                    });
                }
            })
        }

        it('constructor', function () {
            dataset = new Dataset(0, [
                new Record({
                    collection_id: 'col',
                    record_id: 'rec_1',
                    fields: { a: 0 }
                }), {
                    collection_id: 'col',
                    record_id: 'rec_2',
                    fields: { b: 1 }
                }
            ]);
            checkDataset(dataset, 0, [{
                collection_id: 'col',
                record_id: 'rec_1',
                fields: { a: 0 }
            }, {
                collection_id: 'col',
                record_id: 'rec_2',
                fields: { b: 1 }
            }]);
        });

        it('json.deserialize', function () {
            checkDataset(Dataset.json.deserialize(snapshotJson), 3, [
                {
                    collection_id: 'col',
                    record_id: 'rec_1',
                    fields: {
                        field_0: 3.14,
                        field_list: [3.14, 123]
                    }
                },
                {
                    record_id: 'rec_2',
                    collection_id: 'col',
                    fields: {}
                }, {
                    record_id: 'rec_1',
                    collection_id: 'col_2',
                    fields: {
                        f1: 1
                    }
                }]);
        });

        it('iterators', function () {
            dataset = new Dataset(0, [
                {
                    collection_id: 'col',
                    record_id: 'rec_1',
                    fields: { a: 0 }
                }, {
                    collection_id: 'col',
                    record_id: 'rec_2',
                    fields: { b: 1 }
                }, {
                    collection_id: 'col_2',
                    record_id: 'rec_2',
                    fields: { b: 1 }
                }
            ]);

            var record_ids = [],
                it,
                item;

            for (it = dataset.iterator('col'), item = it.next(); !item.done; item = it.next()) {
                record_ids.push(item.value.getRecordId());
            }
            expect(record_ids.sort()).to.eql(['rec_1', 'rec_2']);

            record_ids = [];
            for (it = dataset.iterator('col_2'), item = it.next(); !item.done; item = it.next()) {
                record_ids.push(item.value.getRecordId());
            }
            expect(record_ids).to.eql(['rec_2']);
        });

        it('applyDeltas', function () {
            dataset = new Dataset(0, [
                {
                    collection_id: 'col',
                    record_id: 'rec_1',
                    fields: { a: 0 }
                }, {
                    collection_id: 'col',
                    record_id: 'rec_2',
                    fields: { b: 1 }
                }, {
                    collection_id: 'col_2',
                    record_id: 'rec_2',
                    fields: { b: 1, c: 2 }
                }
            ]);

            dataset.applyDeltas([
                {
                    base_revision: 0,
                    revision: 1,
                    changes: [
                        {
                            record_id: 'rec_1',
                            collection_id: 'col',
                            change_type: 'delete'
                        }, {
                            record_id: 'rec_1',
                            collection_id: 'col',
                            change_type: 'insert',
                            changes: [
                                {
                                    field_id: 'b',
                                    change_type: 'set',
                                    value: {
                                        type: 'string',
                                        string: 'trololo'
                                    }
                                }
                            ]
                        }, {
                            record_id: 'rec_2',
                            collection_id: 'col',
                            change_type: 'update',
                            changes: [
                                {
                                    field_id: 'a',
                                    change_type: 'set',
                                    value: {
                                        type: 'double',
                                        double: 3.14
                                    }
                                },
                                {
                                    field_id: 'b',
                                    change_type: 'set',
                                    value: {
                                        type: 'string',
                                        string: 'trololo'
                                    }
                                }
                            ]
                        }
                    ]
                }, {
                    base_revision: 1,
                    revision: 2,
                    changes: [{
                        record_id: 'rec_2',
                        collection_id: 'col_2',
                        change_type: 'update',
                        changes: [
                            {
                                field_id: 'b',
                                change_type: 'set',
                                value: {
                                    type: 'string',
                                    string: 'trololo'
                                }
                            }, {
                                field_id: 'c',
                                change_type: 'delete'
                            }
                        ]
                    }]
                }
            ]);

            checkDataset(dataset, 2, [
                {
                    collection_id: 'col',
                    record_id: 'rec_1',
                    fields: { b: 'trololo' }
                }, {
                    collection_id: 'col',
                    record_id: 'rec_2',
                    fields: { a: 3.14, b: 'trololo' }
                }, {
                    collection_id: 'col_2',
                    record_id: 'rec_2',
                    fields: { b: 'trololo' }
                }
            ]);

            expect(dataset.ifModifiedSince({
                collection_id: 'col',
                record_id: 'rec_1',
                revision: 0
            })).to.be(true);

            expect(dataset.ifModifiedSince({
                collection_id: 'col',
                record_id: 'rec_1',
                revision: 1
            })).to.be(false);

            expect(dataset.ifModifiedSince({
                collection_id: 'col',
                record_id: 'rec_2',
                revision: 0
            })).to.be(true);

            expect(dataset.ifModifiedSince({
                collection_id: 'col',
                record_id: 'rec_2',
                revision: 1
            })).to.be(false);

            expect(dataset.ifModifiedSince({
                collection_id: 'col_2',
                record_id: 'rec_2',
                revision: 0
            })).to.be(true);

            expect(dataset.ifModifiedSince({
                collection_id: 'col_2',
                record_id: 'rec_2',
                revision: 1
            })).to.be(true);
        });

        function prepareDataset () {
            var dataset = new Dataset(0, [
                {
                    collection_id: 'col',
                    record_id: 'rec_reinstated',
                    fields: { a: 0 }
                }, {
                    collection_id: 'col',
                    record_id: 'rec_updated',
                    fields: { b: 1 }
                }, {
                    collection_id: 'col_2',
                    record_id: 'rec_unmodified',
                    fields: { b: 2 }
                }, {
                    collection_id: 'col',
                    record_id: 'rec_deleted',
                    fields: { b: 3 }
                }
            ]);

            dataset.applyDeltas([
                {
                    base_revision: 0,
                    revision: 1,
                    changes: [
                        {
                            record_id: 'rec_reinstated',
                            collection_id: 'col',
                            change_type: 'delete'
                        },
                        {
                            record_id: 'rec_deleted',
                            collection_id: 'col',
                            change_type: 'delete'
                        },
                        {
                            record_id: 'rec_reinstated',
                            collection_id: 'col',
                            change_type: 'insert',
                            changes: [
                                {
                                    field_id: 'b',
                                    change_type: 'set',
                                    value: {
                                        type: 'string',
                                        string: 'trololo'
                                    }
                                }
                            ]
                        }
                    ]
                }, {
                    base_revision: 1,
                    revision: 2,
                    changes: [
                        {
                            record_id: 'rec_updated',
                            collection_id: 'col',
                            change_type: 'update',
                            changes: [
                                {
                                    field_id: 'a',
                                    change_type: 'set',
                                    value: {
                                        type: 'double',
                                        double: 3.14
                                    }
                                },
                                {
                                    field_id: 'b',
                                    change_type: 'set',
                                    value: {
                                        type: 'list',
                                        list: [
                                            { type: 'double', double: 6.28 }
                                        ]
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]);

            return dataset;
        }

        it('dryRun#insert', function () {
            dataset = prepareDataset();

            var conflicts,
                operations = [
                    new Operation({
                        type: 'insert',
                        collection_id: 'col_2',
                        record_id: 'rec_unmodified',
                        field_operations: []
                    })
                ];

            conflicts = dataset.dryRun(0, operations).conflicts;

            expect(conflicts.length).to.be(1);
            expect(conflicts[0].index).to.be(0);
            expect(conflicts[0].conflict.getType()).to.be('record_already_exists');

            operations = [
                new Operation({
                    type: 'insert',
                    collection_id: 'col',
                    record_id: 'rec_reinstated',
                    field_operations: []
                })
            ];
            conflicts = dataset.dryRun(0, operations).conflicts;
            expect(conflicts.length).to.be(1);
            expect(conflicts[0].index).to.be(0);
            expect(conflicts[0].conflict.getType()).to.be('both_modified');

            operations = [
                new Operation({
                    type: 'insert',
                    collection_id: 'col',
                    record_id: 'rec_new',
                    field_operations: []
                }),
                new Operation({
                    type: 'insert',
                    collection_id: 'col',
                    record_id: 'rec_new',
                    field_operations: []
                })
            ];
            conflicts = dataset.dryRun(1, operations).conflicts;
            expect(conflicts.length).to.be(1);
            expect(conflicts[0].index).to.be(1);
            expect(conflicts[0].conflict.getType()).to.be('record_already_exists');

            operations = [
                new Operation({
                    type: 'insert',
                    collection_id: 'col',
                    record_id: 'rec_new',
                    field_operations: []
                })
            ];
            conflicts = dataset.dryRun(1, operations).conflicts;
            expect(conflicts.length).to.be(0);

            operations = [
                new Operation({
                    type: 'insert',
                    collection_id: 'col',
                    record_id: 'rec_deleted',
                    field_operations: []
                })
            ];

            conflicts = dataset.dryRun(1, operations).conflicts;
            expect(conflicts.length).to.be(0);
        });

        it('dryRun#set', function () {
            dataset = prepareDataset();

            var conflicts,
                operations = [
                    new Operation({
                        type: 'set',
                        collection_id: 'col',
                        record_id: 'rec_reinstated',
                        field_operations: []
                    })
                ];

            conflicts = dataset.dryRun(0, operations).conflicts;

            expect(conflicts.length).to.be(1);
            expect(conflicts[0].conflict.getType()).to.be('both_modified');

            operations = [
                new Operation({
                    type: 'set',
                    collection_id: 'col',
                    record_id: 'rec_reinstated',
                    field_operations: []
                })
            ];

            conflicts = dataset.dryRun(1, operations).conflicts;

            expect(conflicts.length).to.be(0);

            operations = [
                new Operation({
                    type: 'set',
                    collection_id: 'col',
                    record_id: 'rec_new',
                    field_operations: []
                }),
                new Operation({
                    type: 'set',
                    collection_id: 'col',
                    record_id: 'rec_new',
                    field_operations: []
                })
            ];
            conflicts = dataset.dryRun(0, operations).conflicts;
            expect(conflicts.length).to.be(0);

        });

        it('dryRun#delete', function () {
            dataset = prepareDataset();

            var conflicts,
                operations = [
                    new Operation({
                        type: 'delete',
                        collection_id: 'col',
                        record_id: 'rec_reinstated',
                        field_operations: []
                    })
                ];

            conflicts = dataset.dryRun(0, operations).conflicts;

            expect(conflicts.length).to.be(1);
            expect(conflicts[0].conflict.getType()).to.be('both_modified');
            expect(conflicts[0].index).to.be(0);

            operations = [
                new Operation({
                    type: 'delete',
                    collection_id: 'col',
                    record_id: 'rec_reinstated',
                    field_operations: []
                })
            ];

            conflicts = dataset.dryRun(1, operations).conflicts;

            expect(conflicts.length).to.be(0);

            operations = [
                new Operation({
                    type: 'delete',
                    collection_id: 'col',
                    record_id: 'rec_new'
                })
            ];

            conflicts = dataset.dryRun(1, operations).conflicts;
            expect(conflicts.length).to.be(1);
            expect(conflicts[0].conflict.getType()).to.be('delete_non_existent_record');

            operations = [
                new Operation({
                    type: 'delete',
                    collection_id: 'col',
                    record_id: 'rec_reinstated'
                }),
                new Operation({
                    type: 'delete',
                    collection_id: 'col',
                    record_id: 'rec_reinstated'
                })
            ];
            conflicts = dataset.dryRun(1, operations).conflicts;
            expect(conflicts.length).to.be(1);
            expect(conflicts[0].conflict.getType()).to.be('delete_non_existent_record');
        });

        it('dryRun#update', function () {
            dataset = prepareDataset();

            var conflicts,
                operations = [
                    new Operation({
                        type: 'update',
                        collection_id: 'col',
                        record_id: 'rec_reinstated',
                        field_operations: []
                    })
                ];

            conflicts = dataset.dryRun(0, operations).conflicts;

            expect(conflicts.length).to.be(1);
            expect(conflicts[0].conflict.getType()).to.be('both_modified');

            operations = [
                new Operation({
                    type: 'update',
                    collection_id: 'col',
                    record_id: 'rec_reinstated',
                    field_operations: []
                })
            ];

            conflicts = dataset.dryRun(1, operations).conflicts;

            expect(conflicts.length).to.be(0);

            operations = [
                new Operation({
                    type: 'update',
                    collection_id: 'col',
                    record_id: 'rec_new',
                    field_operations: []
                }),
                new Operation({
                    type: 'update',
                    collection_id: 'col',
                    record_id: 'rec_new',
                    field_operations: []
                })
            ];
            conflicts = dataset.dryRun(0, operations).conflicts;
            expect(conflicts.length).to.be(2);
            expect(conflicts[0].conflict.getType()).to.be('update_non_existent_record');
            expect(conflicts[0].index).to.be(0);
            expect(conflicts[1].conflict.getType()).to.be('update_non_existent_record');
            expect(conflicts[1].index).to.be(1);
        });

        it('dryRun#fieldConflicts', function () {
            dataset = prepareDataset();

            var conflicts,
                operations = [
                    new Operation({
                        type: 'update',
                        collection_id: 'col',
                        record_id: 'rec_updated',
                        field_operations: [{
                            type: 'delete',
                            field_id: 'b'
                        }, {
                            type: 'list_item_insert',
                            field_id: 'b',
                            index: 0,
                            value: 0
                        }]
                    })
                ];

            conflicts = dataset.dryRun(2, operations).conflicts;
            expect(conflicts.length).to.be(1);
            expect(conflicts[0].conflict.getType()).to.be('invalid_field_change');
            expect(conflicts[0].conflict.getFieldChangeConflicts()).to.eql([{
                index: 1,
                type: 'modify_non_existent_field'
            }]);

            operations = [
                new Operation({
                    type: 'update',
                    collection_id: 'col',
                    record_id: 'rec_updated',
                    field_operations: [{
                        type: 'list_item_insert',
                        field_id: 'b',
                        index: 0,
                        value: 0
                    }, {
                        type: 'list_item_move',
                        field_id: 'b',
                        index: 0,
                        new_index: 1
                    }]
                })
            ];

            conflicts = dataset.dryRun(2, operations).conflicts;
            expect(conflicts.length).to.be(0);
        })
    });

    provide();
});