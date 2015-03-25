var expect = expect || require('expect.js'),
    ya = ya || require('../build/cloud-data-sync-api.js');

ya.modules.define('test.cloud.dataSyncApi.Record', [
    'cloud.dataSyncApi.Record',
    'cloud.dataSyncApi.FieldOperation',
    'cloud.dataSyncApi.Value'
], function (provide, Record, FieldOperation, Value) {
    describe('cloud.dataSyncApi.Record', function () {
        var record, json,

            snapshotJson = {
                record_id: 'rec',
                collection_id: 'col',
                revision: 0,
                fields: [
                    {"field_id": "field_0", "value": {"double": 3.14, "type": "double"}},
                    {"field_id": "field_list", "value": {"list": [
                        {"double": 3.14, "type": "double"},
                        {"integer": 123, "type": "integer"}
                    ], "type": "list"}}
                ]
            },

            deltasJson = {
                record_id: 'rec',
                collection_id: 'col',
                change_type: 'set',
                changes:[
                    {"field_id": "field_0", "change_type": "set", "value": {"double": 3.14, "type": "double"}},
                    {"field_id": "field_list", "change_type": "set", "value": {"list": [
                        {"double": 3.14, "type": "double"},
                        {"integer": 123, "type": "integer"}
                    ], "type": "list"}}
                ]
            };

        it('getters', function () {
            record = new Record({
                collection_id: 'col',
                record_id: 'rec',
                fields: {
                    id1: null,
                    id2: new Value({
                        type: 'double',
                        value: 3.14
                    })
                }
            });

            expect(record.getCollectionId()).to.be('col');
            expect(record.getRecordId()).to.be('rec');
            expect(record.getFieldIds().sort()).eql(['id1', 'id2']);

            var index = record.getFields();
            expect(index.id1.getType()).to.be('null');
            expect(index.id1.valueOf()).to.be(null);
            expect(index.id2.getType()).to.be('double');
            expect(index.id2.valueOf()).to.be(3.14);

            expect(record.getFieldValue('id1').getType()).to.be('null');
            expect(record.getFieldValue('id1').valueOf()).to.be(null);
            expect(record.getFieldValue('id2').getType()).to.be('double');
            expect(record.getFieldValue('id2').valueOf()).to.be(3.14);
        });

        it('json.deserialize', function () {
            record = Record.json.deserialize(snapshotJson);

            expect(record.getCollectionId()).to.be('col');
            expect(record.getRecordId()).to.be('rec');
            expect(record.getFieldIds().sort()).eql(['field_0', 'field_list']);

            record = Record.json.deserialize(deltasJson, true);
            expect(record.getCollectionId()).to.be('col');
            expect(record.getRecordId()).to.be('rec');
            expect(record.getFieldIds().sort()).eql(['field_0', 'field_list']);
        });

        it('json.serialize', function () {
            json = Record.json.serialize(new Record({
                record_id: 'rec',
                collection_id: 'col',
                fields: {
                    field_0: 0,
                    field_1: '1'
                }
            }));
            expect(json).to.eql({
                record_id: 'rec',
                collection_id: 'col',
                change_type: 'set',
                changes:[
                    {"field_id": "field_0", "change_type": "set", "value": {"double": 0, "type": "double"}},
                    {"field_id": "field_1", "change_type": "set", "value": {"string": "1", "type": "string"}}
                ]
            });
        });

        function checkFieldValues(record, values) {
            expect(record.getFieldIds().sort()).to.eql(Object.keys(values).sort());
            record.getFieldIds().forEach(function (key) {
                var value = record.getFieldValue(key);
                if (Array.isArray(values[key])) {
                    expect(value.getType()).to.be('list');
                    var list = value.valueOf();
                    expect(list.length).to.be(values[key].length);
                    list.forEach(function (item, index) {
                        expect(item.valueOf()).to.be(values[key][index]);
                    });
                } else {
                    expect(value.valueOf()).to.be(values[key]);
                }
            })
        }

        it('applyFieldOperation.set', function () {
            record = new Record({
                collection_id: 'col',
                record_id: 'rec',
                fields: {
                    id1: null,
                    id2: new Value({
                        type: 'double',
                        value: 3.14
                    })
                }
            });

            expect(record.dryRun(new FieldOperation({
                type: 'set',
                field_id: 'id3',
                value: 'trololo'
            }))).to.be(null);
            expect(record.applyFieldOperation(new FieldOperation({
                type: 'set',
                field_id: 'id3',
                value: 'trololo'
            }))).to.be(record);
            checkFieldValues(record, {
                id1: null,
                id2: 3.14,
                id3: 'trololo'
            });

            expect(record.dryRun(new FieldOperation({
                type: 'set',
                field_id: 'id1',
                value: 'trolololo'
            }))).to.be(null);
            expect(record.applyFieldOperation(new FieldOperation({
                type: 'set',
                field_id: 'id1',
                value: 'trolololo'
            }))).to.be(record);
            checkFieldValues(record, {
                id1: 'trolololo',
                id2: 3.14,
                id3: 'trololo'
            });
        });

        it('applyFieldOperation.delete', function () {
            record = new Record({
                collection_id: 'col',
                record_id: 'rec',
                fields: {
                    id1: null,
                    id2: new Value({
                        type: 'double',
                        value: 3.14
                    })
                }
            });
            expect(record.dryRun(new FieldOperation({
                type: 'delete',
                field_id: 'id3'
            }))).to.be('delete_non_existent_field');

            expect(record.dryRun(new FieldOperation({
                type: 'delete',
                field_id: 'id1'
            }))).to.be(null);
            expect(record.applyFieldOperation(new FieldOperation({
                type: 'delete',
                field_id: 'id1'
            }))).to.be(record);
            checkFieldValues(record, {
                id2: 3.14
            });
        });

        it('applyFieldOperation.list', function () {
            record = new Record({
                collection_id: 'col',
                record_id: 'rec',
                fields: {
                    id1: null,
                    id2: new Value({
                        type: 'list',
                        value: [3.14, 6.28]
                    })
                }
            });
            expect(record.dryRun(new FieldOperation({
                type: 'list_item_move',
                field_id: 'id3',
                index: -1,
                new_index: -1
            }))).to.be('modify_non_existent_field');
            expect(record.dryRun(new FieldOperation({
                type: 'list_item_move',
                field_id: 'id1',
                index: -1,
                new_index: -1
            }))).to.be('modify_not_a_list_field');
            expect(record.dryRun(new FieldOperation({
                type: 'list_item_move',
                field_id: 'id2',
                index: -1,
                new_index: -1
            }))).to.be('incorrect_list_index');

            expect(record.dryRun(new FieldOperation({
                type: 'list_item_move',
                field_id: 'id2',
                index: 0,
                new_index: 1
            }))).to.be(null);
            expect(record.applyFieldOperation(new FieldOperation({
                type: 'list_item_move',
                field_id: 'id2',
                index: 0,
                new_index: 1
            }))).to.be(record);
            checkFieldValues(record, {
                id1: null,
                id2: [6.28, 3.14]
            });
        });

        it('applyFieldOperation.unknown', function () {
            record = new Record({
                collection_id: 'col',
                record_id: 'rec',
                fields: {
                    id1: null,
                    id2: new Value({
                        type: 'list',
                        value: [3.14, 6.28]
                    })
                }
            });
            expect(record.dryRun(new FieldOperation({
                type: 'list_itemmove',
                field_id: 'id3',
                index: -1,
                new_index: -1
            }))).to.be('unknown_type');
        });
    });

    provide();
});