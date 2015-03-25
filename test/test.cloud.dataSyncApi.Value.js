var expect = expect || require('expect.js'),
    ya = ya || require('../build/cloud-data-sync-api.js');

ya.modules.define('test.cloud.dataSyncApi.Value', [
    'cloud.dataSyncApi.Value',
    'cloud.dataSyncApi.FieldOperation'
], function (provide, Value, FieldOperation) {

    describe('cloud.dataSyncApi.Value', function () {
        var value, json;

        it('integer.explicit', function () {
            value = new Value({
                type: 'integer',
                value: 3
            });
            expect(value.getType()).to.be('integer');
            expect(value.valueOf()).to.be(3);

            value = new Value({
                type: 'integer',
                value: new Number(3)
            });
            expect(value.getType()).to.be('integer');
            expect(value.valueOf()).to.be(3);
        });

        it('integer.serialize', function () {
            value = new Value({
                type: 'integer',
                value: 3
            });
            json = Value.json.serialize(value);
            expect(json).to.eql({ type: 'integer', integer: 3 });
        });

        it('integer.deserialize', function () {
            value = Value.json.deserialize({
                "integer": 3,
                "type": "integer"
            });
            expect(value.getType()).to.be('integer');
            expect(value.valueOf()).to.be(3);
        });

        it('integer.copy', function () {
            value = new Value({
                type: 'integer',
                value: 3
            });
            value = value.copy();
            expect(value.getType()).to.be('integer');
            expect(value.valueOf()).to.be(3);
        });

        it('double.explicit', function () {
            value = new Value({
                type: 'double',
                value: 3.14
            });
            expect(value.getType()).to.be('double');
            expect(value.valueOf()).to.be(3.14);

            value = new Value({
                type: 'double',
                value: new Number(3.14)
            });
            expect(value.getType()).to.be('double');
            expect(value.valueOf()).to.be(3.14);
        });

        it('double.implicit', function () {
            value = new Value(3.14);
            expect(value.getType()).to.be('double');
            expect(value.valueOf()).to.be(3.14);
        });

        it('double.serialize', function () {
            value = new Value({
                type: 'double',
                value: 3.14
            });
            json = Value.json.serialize(value);
            expect(json).to.eql({ type: 'double', double: 3.14 });
        });

        it('double.deserialize', function () {
            value = Value.json.deserialize({
                "double": 3.14,
                "type": "double"
            });
            expect(value.getType()).to.be('double');
            expect(value.valueOf()).to.be(3.14);
        });

        it('double.copy', function () {
            value = new Value({
                type: 'double',
                value: 3.14
            });
            value = value.copy();
            expect(value.getType()).to.be('double');
            expect(value.valueOf()).to.be(3.14);
        });

        it('string.explicit', function () {
            value = new Value({
                type: 'string',
                value: 'trololo'
            });
            expect(value.getType()).to.be('string');
            expect(value.valueOf()).to.be('trololo');

            value = new Value({
                type: 'string',
                value: new String('trololo')
            });
            expect(value.getType()).to.be('string');
            expect(value.valueOf()).to.be('trololo');

            value = new Value({
                type: 'string',
                value: { toString: function () { return 'trololo'; } }
            });
            expect(value.getType()).to.be('string');
            expect(value.valueOf()).to.be('trololo');
        });

        it('string.implicit', function () {
            value = new Value('trololo');
            expect(value.getType()).to.be('string');
            expect(value.valueOf()).to.be('trololo');

            value = new Value({ toString: function () { return 'trololo'; } });
            expect(value.getType()).to.be('string');
            expect(value.valueOf()).to.be('trololo');
        });

        it('string.serialize', function () {
            value = new Value({
                type: 'string',
                value: 'trololo'
            });
            json = Value.json.serialize(value);
            expect(json).to.eql({ type: 'string', string: 'trololo' });
        });

        it('string.deserialize', function () {
            value = Value.json.deserialize({"type": "string", "string": "trololo"});
            expect(value.getType()).to.be('string');
            expect(value.valueOf()).to.be('trololo');
        });

        it('string.copy', function () {
            value = new Value({
                type: 'string',
                value: 'trololo'
            });
            value = value.copy();
            expect(value.getType()).to.be('string');
            expect(value.valueOf()).to.be('trololo');
        });

        it('boolean.explicit', function () {
            value = new Value({
                type: 'boolean',
                value: true
            });
            expect(value.getType()).to.be('boolean');
            expect(value.valueOf()).to.be(true);

            value = new Value({
                type: 'boolean',
                value: false
            });
            expect(value.getType()).to.be('boolean');
            expect(value.valueOf()).to.be(false);

            value = new Value({
                type: 'boolean',
                value: new Boolean(true)
            });
            expect(value.getType()).to.be('boolean');
            expect(value.valueOf()).to.be(true);

            value = new Value({
                type: 'boolean',
                value: new Boolean(false)
            });
            expect(value.getType()).to.be('boolean');
            expect(value.valueOf()).to.be(false);
        });

        it('boolean.implicit', function () {
            value = new Value(true);
            expect(value.getType()).to.be('boolean');
            expect(value.valueOf()).to.be(true);

            value = new Value(false);
            expect(value.getType()).to.be('boolean');
            expect(value.valueOf()).to.be(false);

            value = new Value(new Boolean(true));
            expect(value.getType()).to.be('boolean');
            expect(value.valueOf()).to.be(true);

            value = new Value(new Boolean(false));
            expect(value.getType()).to.be('boolean');
            expect(value.valueOf()).to.be(false);
        });

        it('boolean.serialize', function () {
            value = new Value({
                type: 'boolean',
                value: true
            });
            json = Value.json.serialize(value);
            expect(json).to.eql({ type: 'boolean', boolean: true });

            value = new Value({
                type: 'boolean',
                value: false
            });
            json = Value.json.serialize(value);
            expect(json).to.eql({ type: 'boolean', boolean: false });
        });

        it('boolean.deserialize', function () {
            value = Value.json.deserialize({"boolean": false, "type": "boolean"});
            expect(value.getType()).to.be('boolean');
            expect(value.valueOf()).to.be(false);

            value = Value.json.deserialize({"boolean": true, "type": "boolean"});
            expect(value.getType()).to.be('boolean');
            expect(value.valueOf()).to.be(true);
        });

        it('boolean.copy', function () {
            value = new Value({
                type: 'boolean',
                value: true
            });
            value = value.copy();
            expect(value.getType()).to.be('boolean');
            expect(value.valueOf()).to.be(true);

            value = new Value({
                type: 'boolean',
                value: false
            });
            value = value.copy();
            expect(value.getType()).to.be('boolean');
            expect(value.valueOf()).to.be(false);
        });

        it('datetime.explicit', function () {
            value = new Value({
                type: 'datetime',
                value: '2014-11-26T14:17:16.504000+00:00'
            });
            expect(value.getType()).to.be('datetime');
            expect(value.valueOf()).to.be.a(Date);
            expect(value.valueOf().getTime()).to.be(+ new Date('2014-11-26T14:17:16.504000+00:00'));

            value = new Value({
                type: 'datetime',
                value: new Date('2014-11-26T14:17:16.504000+00:00')
            });
            expect(value.getType()).to.be('datetime');
            expect(value.valueOf()).to.be.a(Date);
            expect(value.valueOf().getTime()).to.be(+ new Date('2014-11-26T14:17:16.504000+00:00'));
        });

        it('datetime.implicit', function () {
            value = new Value(new Date('2014-11-26T14:17:16.504000+00:00'));
            expect(value.getType()).to.be('datetime');
            expect(value.valueOf()).to.be.a(Date);
            expect(value.valueOf().getTime()).to.be(+ new Date('2014-11-26T14:17:16.504000+00:00'));
        });

        it('datetime.serialize', function () {
            value = new Value({
                type: 'datetime',
                value: '2014-11-26T14:17:16.504000+00:00'
            });
            json = Value.json.serialize(value);
            expect(json).to.eql({ type: 'datetime', datetime: '2014-11-26T14:17:16.504000+00:00' });
        });

        it('datetime.deserialize', function () {
            value = Value.json.deserialize({ "type": "datetime", "datetime": "2014-11-26T14:17:16.504000+00:00" });
            expect(value.getType()).to.be('datetime');
            expect(value.valueOf()).to.be.a(Date);
            expect(value.valueOf().getTime()).to.be(+ new Date('2014-11-26T14:17:16.504000+00:00'));
        });

        it('datetime.copy', function () {
            value = new Value({
                type: 'datetime',
                value: '2014-11-26T14:17:16.504000+00:00'
            });
            var copy = value.copy();
            value.valueOf().setUTCFullYear(1990, 10, 12);
            expect(copy.getType()).to.be('datetime');
            expect(copy.valueOf()).to.be.a(Date);
            expect(copy.valueOf().getTime()).to.be(+ new Date('2014-11-26T14:17:16.504000+00:00'));
        });

        it('binary.explicit', function () {
            value = new Value({
                type: 'binary',
                value: '4oieCg=='
            });
            expect(value.getType()).to.be('binary');
            expect(value.valueOf()).to.be('4oieCg==');
        });

        it('binary.serialize', function () {
            value = new Value({
                type: 'binary',
                value: '4oieCg=='
            });
            json = Value.json.serialize(value);
            expect(json).to.eql({ type: 'binary', binary: '4oieCg==' });
        });

        it('binary.deserialize', function () {
            expect(value.getType()).to.be('binary');
            expect(value.valueOf()).to.be('4oieCg==');
        });

        it('binary.copy', function () {
            value = new Value({
                type: 'binary',
                value: '4oieCg=='
            });
            value = value.copy();
            expect(value.getType()).to.be('binary');
            expect(value.valueOf()).to.be('4oieCg==');
        });

        if (typeof ArrayBuffer != 'undefined') {
            var ref = new Uint8Array([0xf0, 0x9f, 0x9a, 0x80, 0x0a]);

            it('binary.ArrayBuffer.explicit', function () {
                value = new Value({
                    type: 'binary',
                    value: '8J+agAo='
                });
                expect(value.getType()).to.be('binary');
                expect(new Uint8Array(value.valueOf(true))).to.eql(ref);

                value = new Value({
                    type: 'binary',
                    value: new Uint8Array([0xf0, 0x9f, 0x9a, 0x80, 0x0a])
                });
                expect(value.getType()).to.be('binary');
                expect(value.valueOf()).to.eql('8J+agAo=');

                value = new Value({
                    type: 'binary',
                    value: new Uint8Array([0xf0, 0x9f, 0x9a, 0x80, 0x0a]).buffer
                });
                expect(value.getType()).to.be('binary');
                expect(value.valueOf()).to.eql('8J+agAo=');
            });

            it('binary.ArrayBuffer.implicit', function () {
                value = new Value(new Uint8Array([0xf0, 0x9f, 0x9a, 0x80, 0x0a]));
                expect(value.getType()).to.be('binary');
                expect(value.valueOf()).to.eql('8J+agAo=');

                value = new Value(new Uint8Array([0xf0, 0x9f, 0x9a, 0x80, 0x0a]).buffer);
                expect(value.getType()).to.be('binary');
                expect(value.valueOf()).to.eql('8J+agAo=');
            });

            it('binary.ArrayBuffer.copy', function () {
                value = new Value({
                    type: 'binary',
                    value: new Uint8Array([0xf0, 0x9f, 0x9a, 0x80, 0x0a])
                });
                var copy = value.copy();
                value.valueOf(true)[0] = 0;
                expect(copy.getType()).to.be('binary');
                expect(copy.valueOf()).to.eql('8J+agAo=');
            });
        }

        it('inf.explicit', function () {
            value = new Value({
                type: 'inf'
            });
            expect(value.getType()).to.be('inf');
            expect(value.valueOf()).to.be(Number.POSITIVE_INFINITY);
        });

        it('inf.implicit', function () {
            value = new Value(Number.POSITIVE_INFINITY);
            expect(value.getType()).to.be('inf');
            expect(value.valueOf()).to.be(Number.POSITIVE_INFINITY);
        });

        it('inf.serialize', function () {
            value = new Value({
                type: 'inf'
            });
            json = Value.json.serialize(value);
            expect(json).to.eql({ type: 'inf', 'inf': true });
        });

        it('inf.deserialize', function () {
            value = Value.json.deserialize({"inf": true, "type": "inf"});
            expect(value.getType()).to.be('inf');
            expect(value.valueOf()).to.be(Number.POSITIVE_INFINITY);
        });

        it('inf.copy', function () {
            value = new Value({
                type: 'inf'
            });
            value = value.copy();
            expect(value.getType()).to.be('inf');
            expect(value.valueOf()).to.be(Number.POSITIVE_INFINITY);
        });

        it('ninf.explicit', function () {
            value = new Value({
                type: 'ninf'
            });
            expect(value.getType()).to.be('ninf');
            expect(value.valueOf()).to.be(Number.NEGATIVE_INFINITY);
        });

        it('ninf.implicit', function () {
            value = new Value(Number.NEGATIVE_INFINITY);
            expect(value.getType()).to.be('ninf');
            expect(value.valueOf()).to.be(Number.NEGATIVE_INFINITY);
        });

        it('ninf.serialize', function () {
            value = new Value({
                type: 'ninf'
            });
            json = Value.json.serialize(value);
            expect(json).to.eql({ type: 'ninf', 'ninf': true });
        });

        it('ninf.deserialize', function () {
            value = Value.json.deserialize({"ninf": true, "type": "ninf"});
            expect(value.getType()).to.be('ninf');
            expect(value.valueOf()).to.be(Number.NEGATIVE_INFINITY);
        });

        it('ninf.copy', function () {
            value = new Value({
                type: 'ninf'
            });
            value = value.copy();
            expect(value.getType()).to.be('ninf');
            expect(value.valueOf()).to.be(Number.NEGATIVE_INFINITY);
        });

        it('nan.explicit', function () {
            value = new Value({
                type: 'nan'
            });
            expect(value.getType()).to.be('nan');
            expect(isNaN(value.valueOf())).to.be.ok();
        });

        it('nan.implicit', function () {
            value = new Value(0/0);
            expect(value.getType()).to.be('nan');
            expect(isNaN(value.valueOf())).to.be.ok();
        });

        it('nan.serialize', function () {
            value = new Value({
                type: 'nan'
            });
            json = Value.json.serialize(value);
            expect(json).to.eql({ type: 'nan', 'nan': true });
        });

        it('nan.deserialize', function () {
            value = Value.json.deserialize({"nan": true, "type": "nan"});
            expect(value.getType()).to.be('nan');
            expect(isNaN(value.valueOf())).to.be.ok();
        });

        it('nan.copy', function () {
            value = new Value({
                type: 'nan'
            });
            value = value.copy();
            expect(value.getType()).to.be('nan');
            expect(isNaN(value.valueOf())).to.be.ok();
        });

        function compareLists (a, b) {
            expect(a.length).to.be(b.length);
            a.forEach(function (item, index) {
                expect(item.getType()).to.be(b[index].type);
                if (b[index].type == 'nan') {
                    expect(isNaN(item.valueOf())).to.be.ok();
                } else if (b[index].type == 'datetime') {
                    expect(+ item.valueOf()).to.be(+ b[index].value)
                } else {
                    expect(item.valueOf()).to.be(b[index].value);
                }
            });
        }

        var refList = [
            { type: 'double', value: 3.14 },
            { type: 'integer', value: 3 },
            { type: 'boolean', value: false },
            { type: 'string', value: 'trololo' },
            { type: 'binary', value: '8J+agAo=' },
            { type: 'null', value: null },
            { type: 'inf', value: Number.POSITIVE_INFINITY },
            { type: 'ninf', value: Number.NEGATIVE_INFINITY },
            { type: 'nan', value: 0/0 },
            { type: 'datetime', value: new Date('2014-11-26T14:17:16.504000+00:00') }
        ];

        it('list.explicit', function () {
            value = new Value({
                type: 'list',
                value: refList
            });
            expect(value.getType()).to.be('list');
            compareLists(value.valueOf(), refList);

            value = new Value({
                type: 'list',
                value: refList.map(function (item) { return new Value(item); })
            });
            expect(value.getType()).to.be('list');
            compareLists(value.valueOf(), refList);
        });

        it('list.implicit', function () {
            value = new Value(refList);
            expect(value.getType()).to.be('list');
            compareLists(value.valueOf(), refList);

            value = new Value(refList.map(function (item) {
                if (item.type != 'integer' && item.type != 'binary') {
                    return item.value;
                } else {
                    return item;
                }
            }));
            expect(value.getType()).to.be('list');
            compareLists(value.valueOf(), refList);
        });

        it('list.serialize', function () {
            value = new Value({
                type: 'list',
                value: refList
            });

            json = Value.json.serialize(value);
            expect(json.type).to.be('list');
            expect(json.list).to.be.an(Array);

            [
                {"double": 3.14, "type": "double"},
                {"integer": 3, "type": "integer"},
                {"boolean": false, "type": "boolean"},
                {"type": "string", "string": "trololo"},
                {"binary": "8J+agAo=", "type": "binary"},
                {"null": true, "type": "null"},
                {"inf": true, "type": "inf"},
                {"type": "ninf", "ninf": true},
                {"nan": true, "type": "nan"},
                {"type": "datetime", "datetime": "2014-11-26T14:17:16.504000+00:00"}
            ].forEach(function (item, index) {
                    if (item.type != 'datetime') {
                        expect(item).to.eql(json.list[index]);
                    } else {
                        expect(json.list[index].type).to.be('datetime');
                        expect(new Date(json.list[index].datetime)).to.eql(new Date(item.datetime));
                    }
                });
        });

        it('list.deserialize', function () {
            value = Value.json.deserialize({"list": [
                {"double": 3.14, "type": "double"},
                {"integer": 3, "type": "integer"},
                {"boolean": false, "type": "boolean"},
                {"type": "string", "string": "trololo"},
                {"binary": "8J+agAo=", "type": "binary"},
                {"null": true, "type": "null"},
                {"inf": true, "type": "inf"},
                {"type": "ninf", "ninf": true},
                {"nan": true, "type": "nan"},
                {"type": "datetime", "datetime": "2014-11-26T14:17:16.504000+00:00"}
            ], "type": "list"});
            expect(value.getType()).to.be('list');
            compareLists(value.valueOf(), refList);

            value = Value.json.deserialize({"type": "list"});
            expect(value.getType()).to.be('list');
            expect(value.valueOf()).to.eql([]);
        });

        it('list.copy', function () {
            value = new Value({
                type: 'list',
                value: refList.slice()
            });
            var copy = value.copy();
            value.valueOf().splice(2, 3);
            expect(copy.getType()).to.be('list');
            compareLists(copy.valueOf(), refList);
        });

        it('applyListOperation.list_item_set', function () {
            value = new Value({
                type: 'list',
                value: refList
            });

            expect(value.dryRun(new FieldOperation({
                type: 'list_item_set',
                index: -1,
                value: 0
            }))).to.be('incorrect_list_index');

            expect(value.dryRun(new FieldOperation({
                type: 'list_item_set',
                index: refList.length,
                value: 0
            }))).to.be('incorrect_list_index');

            expect(value.dryRun(new FieldOperation({
                type: 'list_item_set',
                index: 1,
                value: 0
            }))).to.be(null);

            expect(value.applyListOperation(new FieldOperation({
                type: 'list_item_set',
                index: 1,
                value: 0
            }))).to.be(value);
            expect(value.valueOf()[1].valueOf()).to.be(0);
        });

        it('applyListOperation.list_item_delete', function () {
            value = new Value({
                type: 'list',
                value: refList
            });

            expect(value.dryRun(new FieldOperation({
                type: 'list_item_delete',
                index: -1
            }))).to.be('incorrect_list_index');

            expect(value.dryRun(new FieldOperation({
                type: 'list_item_delete',
                index: refList.length
            }))).to.be('incorrect_list_index');

            expect(value.dryRun(new FieldOperation({
                type: 'list_item_delete',
                index: 1
            }))).to.be(null);

            expect(value.applyListOperation(new FieldOperation({
                type: 'list_item_delete',
                index: 1
            }))).to.be(value);
            expect(value.valueOf().length).to.be(refList.length - 1);

            var newRef = refList.slice();
            newRef.splice(1, 1);
            compareLists(value.valueOf(), newRef);
        });

        it('applyListOperation.list_item_insert', function () {
            value = new Value({
                type: 'list',
                value: [
                    { type: 'double', value: 3.14 },
                    { type: 'double', value: 5.67e-8 }
                ]
            });

            expect(value.dryRun(new FieldOperation({
                type: 'list_item_insert',
                index: -1,
                value: 0
            }))).to.be('incorrect_list_index');

            expect(value.dryRun(new FieldOperation({
                type: 'list_item_insert',
                index: 3,
                value: 0
            }))).to.be('incorrect_list_index');

            expect(value.dryRun(new FieldOperation({
                type: 'list_item_insert',
                index: 2,
                value: 0
            }))).to.be(null);
            expect(value.applyListOperation(new FieldOperation({
                type: 'list_item_insert',
                index: 2,
                value: 0
            }))).to.be(value);
            expect(value.valueOf().length).to.be(3);

            expect(value.dryRun(new FieldOperation({
                type: 'list_item_insert',
                index: 0,
                value: 0
            }))).to.be(null);
            expect(value.applyListOperation(new FieldOperation({
                type: 'list_item_insert',
                index: 0,
                value: 0
            }))).to.be(value);
            expect(value.valueOf().length).to.be(4);

            compareLists(value.valueOf(), [
                { type: 'double', value: 0 },
                { type: 'double', value: 3.14 },
                { type: 'double', value: 5.67e-8 },
                { type: 'double', value: 0 }
            ]);
        });

        it('applyListOperation.list_item_move', function () {
            value = new Value({
                type: 'list',
                value: [
                    { type: 'double', value: 3.14 },
                    { type: 'double', value: 5.67e-8 }
                ]
            });

            expect(value.dryRun(new FieldOperation({
                type: 'list_item_move',
                index: -1,
                new_index: 0
            }))).to.be('incorrect_list_index');

            expect(value.dryRun(new FieldOperation({
                type: 'list_item_move',
                index: 2,
                new_index: 0
            }))).to.be('incorrect_list_index');

            expect(value.dryRun(new FieldOperation({
                type: 'list_item_move',
                index: 0,
                new_index: -1
            }))).to.be('incorrect_list_index');

            expect(value.dryRun(new FieldOperation({
                type: 'list_item_move',
                index: 0,
                new_index: 2
            }))).to.be('incorrect_list_index');

            expect(value.dryRun(new FieldOperation({
                type: 'list_item_move',
                index: 0,
                new_index: 1
            }))).to.be(null);
            expect(value.applyListOperation(new FieldOperation({
                type: 'list_item_move',
                index: 0,
                new_index: 1
            }))).to.be(value);
            compareLists(value.valueOf(), [
                { type: 'double', value: 5.67e-8 },
                { type: 'double', value: 3.14 }
            ]);

            expect(value.dryRun(new FieldOperation({
                type: 'list_item_move',
                index: 0,
                new_index: 0
            }))).to.be(null);
            expect(value.applyListOperation(new FieldOperation({
                type: 'list_item_move',
                index: 0,
                new_index: 0
            }))).to.be(value);
            compareLists(value.valueOf(), [
                { type: 'double', value: 5.67e-8 },
                { type: 'double', value: 3.14 }
            ]);
        });

        it('applyListOperation.unknown', function () {
            value = new Value({
                type: 'list',
                value: [
                    { type: 'double', value: 3.14 },
                    { type: 'double', value: 5.67e-8 }
                ]
            });

            expect(value.dryRun(new FieldOperation({
                type: 'list_itemmove',
                value: 0
            }))).to.be('unknown_type');
        });
    });

    provide();
});