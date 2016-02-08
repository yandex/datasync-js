var ContactListModel = function (options) {
        options = options || {};
        this._databaseId = options.database_id || 'contact_list_demo';
        this._collectionId = options.collection_id || 'contacts';

        this._database = null;

        return ya.cloud.dataSyncApi.openDatabase({
            database_id: this._databaseId,
            context: 'app',
            create_if_not_exists: true,
            use_client_storage: true
        }).then(function (database) {
            this._database = database;
            return this;
        }, this);
    };

ContactListModel.create = function () {
    return new ContactListModel();
};

ContactListModel.notFatalErrors = [
    'delete_non_existent_record',
    'update_non_existent_record',
    'both_modified'
];


$.extend(ContactListModel.prototype, {
    getContacts: function () {
        var contacts = [];

        this._database.forEach(this._collectionId, function (record) {
            contacts.push(this._exportRecord(record));
        }, this);

        return contacts;
    },

    getContact: function (id) {
        var record = this._database.getRecord(this._collectionId, id);

        return record && this._exportRecord(record);
    },

    _exportRecord: function (record) {
        return {
            id: record.getRecordId(),
            name: record.getFieldValue('name').valueOf(),
            numbers: record.getFieldValue('numbers').valueOf().map(function (item) {
                var parts = item.valueOf().split(':', 2);
                return {
                    type: parts[0],
                    number: parts[1]
                };
            })
        };
    },

    deleteContact: function (id) {
        return this._database.createTransaction()
            .deleteRecords({
                collection_id: this._collectionId,
                record_id: id
            })
            .push();
    },

    updateContact: function (values) {
        var transaction = this._database.createTransaction();

        if (values.addNewRecord) {
            transaction.insertRecords({
                collection_id: this._collectionId,
                record_id: values.id,
                fields: {
                    name: {
                        type: 'string',
                        value: values.name
                    },
                    numbers: {
                        type: 'list',
                        value: []
                    }
                }
            })
        } else if (typeof values.name != 'undefined') {
            transaction.updateRecordFields({
                collection_id: this._collectionId,
                record_id: values.id
            }, {
                name: {
                    type: 'string',
                    value: values.name
                }
            });
        }

        if (values.numberChanges && values.numberChanges.length) {
            transaction.addOperations({
                type: 'update',
                collection_id: this._collectionId,
                record_id: values.id,
                field_operations: values.numberChanges.map(function (change) {
                    var operation = {
                            field_id: 'numbers',
                            type: 'list_item_' + change.operation,
                            index: change.index,
                            new_index: change.newIndex
                        };

                    if (change.operation == 'insert') {
                        operation.value = {
                            type: 'string',
                            value: change.type + ':' + change.number
                        };
                    }

                    return operation;
                })
            });
        }

        return transaction.push().then(undefined, function (e) {
            if (this._errorIsNotFatal(e)) {
                e.notFatal = true;
                e.ours = values;
                e.theirs = this.getContact(values.id);
            }
            throw e;
        }, this);
    },

    setContact: function (values) {
        return this._database.createTransaction()
            .setRecordFields({
                collection_id: this._collectionId,
                record_id: values.id
            }, {
                name: {
                    type: 'string',
                    value: values.name
                },
                numbers: {
                    type: 'list',
                    value: this._importNumbers(values.numbers)
                }
            })
            .push().then(undefined, function (e) {
                if (this._errorIsNotFatal(e)) {
                    e.notFatal = true;
                    e.ours = values;
                    e.theirs = this.getContact(values.id);
                }
                throw e;
            }, this);
    },

    _importNumbers: function (numbers) {
        return (numbers || []).map(function (number) {
            return {
                type: 'string',
                value: number.type + ':' + number.number
            };
        });
    },

    _errorIsNotFatal: function (e) {
        return e.code == 409 && ContactListModel.notFatalErrors.indexOf(
                e.conflicts[0].conflict.getType()
            ) != -1;
    },

    update: function () {
        return this._database.update();
    },

    on: function () {
        this._database.on.apply(this._database, [].slice.call(arguments));
    },

    off: function () {
        this._database.off.apply(this._database, [].slice.call(arguments));
    }
});
