var expect = expect || require('expect.js'),
    ya = ya || require('../build/cloud-data-sync-api.js');

ya.modules.define('test.util', [
    'Promise',
    'global',
    'cloud.dataSyncApi.Dataset',
    'cloud.dataSyncApi.Database'
], function (provide, Promise, global, Dataset, Database) {
    var util = {
            snapshotJson: {
                revision: 3,
                records: {
                    items: [{
                        record_id: 'rec_1',
                        collection_id: 'col',
                        revision: 0,
                        fields: [
                            {"field_id": "field_0", "value": {"double": 3.14, "type": "double"}},
                            {
                                "field_id": "field_list", "value": {
                                "list": [
                                    {"double": 3.14, "type": "double"},
                                    {"integer": 123, "type": "integer"}
                                ], "type": "list"
                            }
                            }
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
                    }]
                }
            },

            checkDataset: function (dataset, ref, parameters) {
                var keys = [],
                    refKeys = [];

                if (!(dataset instanceof Dataset) && !(dataset instanceof Database)) {
                    dataset = Dataset.json.deserialize(dataset, parameters);
                }
                if (!(ref instanceof Dataset) && !(ref instanceof Database)) {
                    ref = Dataset.json.deserialize(ref, parameters);
                }

                for (var it = dataset.iterator(), value = it.next(); !value.done; value = it.next()) {
                    keys.push(value.value.getCollectionId() + '#' + value.value.getRecordId());
                }

                for (var it = ref.iterator(), value = it.next(); !value.done; value = it.next()) {
                    refKeys.push(value.value.getCollectionId() + '#' + value.value.getRecordId());
                }

                keys.sort();
                refKeys.sort();

                expect(keys).to.eql(refKeys);

                for (var it = dataset.iterator(), value = it.next(); !value.done; value = it.next()) {
                    util.checkRecord(
                        value.value,
                        ref.getRecord(value.value.getCollectionId(), value.value.getRecordId())
                    );
                }
            },

            checkRecord: function (record, ref) {
                expect(record.getFieldIds().sort()).to.eql(ref.getFieldIds().sort());
                record.getFieldIds().forEach(function (key) {
                    expect(record.getFieldValue(key).getType()).to.be(ref.getFieldValue(key).getType());
                    if (record.getFieldValue(key).getType() != 'list') {
                        expect(record.getFieldValue(key).valueOf()).to.be(ref.getFieldValue(key).valueOf());
                    } else {
                        expect(record.getFieldValue(key).valueOf().length).to.be(ref.getFieldValue(key).valueOf().length);

                        var refList = ref.getFieldValue(key).valueOf();
                        record.getFieldValue(key).valueOf().forEach(function (value, index) {
                            expect(value.getType()).to.be(refList[index].getType());
                            expect(value.valueOf()).to.be(refList[index].valueOf());
                        });
                    }
                })
            },

            swapMethod: function (object, key, newValue) {
                var old = object[key];
                object[key] = function () {
                    return newValue.apply(null, [].slice.call(arguments));
                };
                return function () {
                    object[key] = old;
                };
            },

            extractParams: function () {
                return typeof global.process != 'undefined' ?
                    Object.keys(global.process.env).reduce(function (params, key) {
                       if (key.indexOf('npm_config_') == 0) {
                           params[key.slice('npm_config_'.length)] = global.process.env[key];
                       }
                       return params;
                    }, {}) :
                    (global.location.search || '').replace(/^\?/, '').split('&').reduce(function (params, param) {
                       var pair = param.split('=', 2);
                       params[pair[0]] = pair[1];
                       return params;
                    }, {});
            },

            timeouted: function (data, timeout) {
                return new Promise(function(resolve) {
                    global.setTimeout(function () {
                       resolve(data);
                    }, timeout || 0);
                });
            }
        };

    provide(util);
});