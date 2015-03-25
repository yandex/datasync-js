var expect = expect || require('expect.js'),
    ya = ya || require('../build/cloud-data-sync-api.js');

ya.modules.define('test.cloud.dataSyncApi.Transaction', [
    'cloud.dataSyncApi.Transaction',
    'cloud.dataSyncApi.Record',
    'cloud.dataSyncApi.Operation',
    'cloud.dataSyncApi.FieldOperation',
    'cloud.dataSyncApi.Value'
], function (provide, Transaction, Record, Operation, FieldOperation, Value) {
    describe('cloud.dataSyncApi.Transaction', function () {
        function compareOperations(operations, refs) {
            expect(operations.length).to.be(refs.length);
            operations.forEach(function (operation, index) {
                var ref = refs[index],
                    fieldsRef = ref.field_operations,
                    fieldOperations = operation.getFieldOperations();

                expect(operation.getType()).to.be(ref.type);
                expect(operation.getCollectionId()).to.be(ref.collection_id);
                expect(operation.getRecordId()).to.be(ref.record_id);

                if (typeof fieldsRef != 'undefined') {
                    expect(fieldOperations.length).to.be(fieldsRef.length);

                    fieldOperations.forEach(function (operation, index) {
                        var ref = fieldsRef[index];

                        expect(operation.getType()).to.be(ref.type);
                        expect(operation.getFieldId()).to.be(ref.field_id);
                        expect(operation.getIndex()).to.be(typeof ref.index == 'undefined' ? null : ref.index);
                        expect(operation.getNewIndex()).to.be(typeof ref.new_index == 'undefined' ? null : ref.new_index);
                        if (typeof ref.value == 'undefined') {
                            expect(operation.getValue()).to.be(null);
                        } else {
                            expect(operation.getValue().valueOf()).to.be(ref.value);
                        }

                    });
                } else {
                    expect(fieldOperations).to.be(null);
                }
            });
        }

        var fakeDb = {
                getRevision: function () { return 0; }
            },
            getFakePatcher = function (callback) {
                return function (options, politics) {
                    expect(options.base_revision).to.be(fakeDb.getRevision());
                    callback(options.operations, politics);
                    return ya.vow.resolve(0);
                }
            },
            transaction;

        it('constructor', function () {
            transaction = new Transaction(
                fakeDb,
                function () { return ya.vow.resolve() }
            );
            expect(transaction.getDatabase()).to.be(fakeDb);
            expect(transaction.getBaseRevision()).to.be(fakeDb.getRevision());
        });

        it('addOperations', function (done) {
            transaction = new Transaction(
                fakeDb,
                getFakePatcher(function (operations, politics) {
                    compareOperations(operations, [
                        {
                            type: 'insert',
                            collection_id: 'col',
                            record_id: 'rec_1',
                            field_operations: []
                        }, {
                            type: 'delete',
                            collection_id: 'col',
                            record_id: 'rec_2'
                        }, {
                            type: 'insert',
                            collection_id: 'col',
                            record_id: 'rec_1',
                            field_operations: [
                                {
                                    field_id: 'a',
                                    type: 'set',
                                    value: 'x'
                                }, {
                                    field_id: 'b',
                                    type: 'delete'
                                }
                            ]
                        }
                    ]);
                    done();
                })
            );

            transaction.addOperations({
                type: 'insert',
                collection_id: 'col',
                record_id: 'rec_1'
            }).addOperations([
                new Operation({
                    type: 'delete',
                    collection_id: 'col',
                    record_id: 'rec_2'
                }), {
                    type: 'insert',
                    collection_id: 'col',
                    record_id: 'rec_1',
                    field_operations: [
                        {
                            field_id: 'a',
                            type: 'set',
                            value: 'x'
                        },
                        new FieldOperation({
                            field_id: 'b',
                            type: 'delete'
                        })
                    ]
                }
            ]).push();
        });

        it('insertRecords', function (done) {
            transaction = new Transaction(
                fakeDb,
                getFakePatcher(function (operations, politics) {
                    compareOperations(operations, [
                        {
                            type: 'insert',
                            collection_id: 'col',
                            record_id: 'rec_1',
                            field_operations: []
                        }, {
                            type: 'insert',
                            collection_id: 'col',
                            record_id: 'rec_2',
                            field_operations: [
                                {
                                    field_id: 'b',
                                    type: 'set',
                                    value: 'y'
                                }
                            ]
                        }, {
                            type: 'insert',
                            collection_id: 'col',
                            record_id: 'rec_3',
                            field_operations: [
                                {
                                    field_id: 'a',
                                    type: 'set',
                                    value: 'x'
                                }
                            ]
                        }
                    ]);
                    done();
                })
            );

            transaction
                .insertRecords({
                    collection_id: 'col',
                    record_id: 'rec_1'
                })
                .insertRecords([
                    new Record({
                        collection_id: 'col',
                        record_id: 'rec_2',
                        fields: {
                            b: 'y'
                        }
                    }), {
                        collection_id: 'col',
                        record_id: 'rec_3',
                        fields: {
                            a: 'x'
                        }
                    }
                ])
                .push();
        });

        it('deleteRecords', function (done) {
            transaction = new Transaction(
                fakeDb,
                getFakePatcher(function (operations, politics) {
                    compareOperations(operations, [
                        {
                            type: 'delete',
                            collection_id: 'col',
                            record_id: 'rec_1'
                        }, {
                            type: 'delete',
                            collection_id: 'col',
                            record_id: 'rec_2'
                        }, {
                            type: 'delete',
                            collection_id: 'col',
                            record_id: 'rec_3'
                        }
                    ]);
                    done();
                })
            );

            transaction
                .deleteRecords({
                    collection_id: 'col',
                    record_id: 'rec_1'
                })
                .deleteRecords([
                    new Record({
                        collection_id: 'col',
                        record_id: 'rec_2'
                    }), {
                        collection_id: 'col',
                        record_id: 'rec_3'
                    }
                ])
                .push();
        });

        it('setRecordFields', function (done) {
            transaction = new Transaction(
                fakeDb,
                getFakePatcher(function (operations, politics) {
                    compareOperations(operations, [
                        {
                            type: 'set',
                            collection_id: 'col',
                            record_id: 'rec_1',
                            field_operations: [{
                                type: 'set',
                                field_id: 'a',
                                value: 1
                            }, {
                                type: 'set',
                                field_id: 'b',
                                value: true
                            }]
                        }, {
                            type: 'set',
                            collection_id: 'col',
                            record_id: 'rec_2',
                            field_operations: [{
                                type: 'set',
                                field_id: 'c',
                                value: null
                            }]
                        }, {
                            type: 'set',
                            collection_id: 'col',
                            record_id: 'rec_3',
                            field_operations: []
                        }
                    ]);
                    done();
                })
            );

            transaction
                .setRecordFields({
                    collection_id: 'col',
                    record_id: 'rec_1'
                }, {
                    a: 1,
                    b: new Value(true)
                })
                .setRecordFields(
                    new Record({
                        collection_id: 'col',
                        record_id: 'rec_2'
                    }), [
                        new FieldOperation({
                            type: 'set',
                            field_id: 'c',
                            value: null
                        })
                    ]
                )
                .setRecordFields({
                    collection_id: 'col',
                    record_id: 'rec_3'
                })
                .push();
        });

        it('updateRecordFields', function (done) {
            transaction = new Transaction(
                fakeDb,
                getFakePatcher(function (operations, politics) {
                    compareOperations(operations, [
                        {
                            type: 'update',
                            collection_id: 'col',
                            record_id: 'rec_1',
                            field_operations: [{
                                type: 'set',
                                field_id: 'a',
                                value: 1
                            }, {
                                type: 'set',
                                field_id: 'b',
                                value: true
                            }]
                        }, {
                            type: 'update',
                            collection_id: 'col',
                            record_id: 'rec_2',
                            field_operations: [{
                                type: 'set',
                                field_id: 'c',
                                value: null
                            }]
                        }, {
                            type: 'update',
                            collection_id: 'col',
                            record_id: 'rec_3',
                            field_operations: [{
                                field_id: 'd',
                                type: 'delete'
                            }]
                        }
                    ]);
                    done();
                })
            );

            transaction
                .updateRecordFields({
                    collection_id: 'col',
                    record_id: 'rec_1'
                }, {
                    a: 1,
                    b: new Value(true),
                })
                .updateRecordFields(
                    new Record({
                        collection_id: 'col',
                        record_id: 'rec_2'
                    }), [
                        new FieldOperation({
                            type: 'set',
                            field_id: 'c',
                            value: null
                        })
                    ]
                )
                .updateRecordFields({
                    collection_id: 'col',
                    record_id: 'rec_3'
                }, {
                    d: undefined
                })
                .push();
        });

        it('listOperations', function (done) {
            transaction = new Transaction(
                fakeDb,
                getFakePatcher(function (operations, politics) {
                    compareOperations(operations, [
                        {
                            type: 'update',
                            collection_id: 'col',
                            record_id: 'rec_1',
                            field_operations: [{
                                type: 'list_item_insert',
                                field_id: 'a',
                                value: true,
                                index: 0
                            }]
                        }, {
                            type: 'update',
                            collection_id: 'col',
                            record_id: 'rec_2',
                            field_operations: [{
                                type: 'list_item_delete',
                                field_id: 'b',
                                index: 1
                            }]
                        }, {
                            type: 'update',
                            collection_id: 'col',
                            record_id: 'rec_3',
                            field_operations: [{
                                field_id: 'c',
                                index: 2,
                                type: 'list_item_set',
                                value: true
                            }]
                        }, {
                            type: 'update',
                            collection_id: 'col',
                            record_id: 'rec_4',
                            field_operations: [{
                                field_id: 'd',
                                index: 3,
                                new_index: 4,
                                type: 'list_item_move'
                            }]
                        }
                    ]);
                    done();
                })
            );

            transaction
                .insertRecordFieldListItem({
                    collection_id: 'col',
                    record_id: 'rec_1'
                }, {
                    field_id: 'a',
                    index: 0,
                    value: new Value(true)
                })
                .deleteRecordFieldListItem(
                    new Record({
                        collection_id: 'col',
                        record_id: 'rec_2'
                    }), {
                        field_id: 'b',
                        index: 1
                    }
                )
                .setRecordFieldListItem({
                    collection_id: 'col',
                    record_id: 'rec_3'
                }, {
                    field_id: 'c',
                    index: 2,
                    value: true
                })
                .moveRecordFieldListItem({
                    collection_id: 'col',
                    record_id: 'rec_4'
                }, {
                    field_id: 'd',
                    index: 3,
                    new_index: 4
                })
                .push();
        });
    });

    provide();
});