var ContactListView = function (model) {
        this._model = model;
        this._currentValues = null;
        this._numberChanges = [];
    };

ContactListView.templates = {
    contactList: _.template('<table class="table table-stripped" style="margin-bottom: 0;">' +
            '<%= contentTemplate %>' +
            '<tr><td colspan="3" align="right">' +
                '<button class="btn btn-primary new">Добавить контакт</button>' +
                '<button class="btn btn-default update">Проверить обновления</button>' +
            '</td></tr>' +
        '</table>'),

    empty: _.template('<tr class="info empty"><td colspan="3" align="center">Список контактов пуст.</td></tr>'),

    contact: _.template('<tr class="" data-id="<%- id %>">' +
            '<td><%- name %></td>' +
            '<td><%= numbersTemplate %></td>' +
            '<td style="text-align: right;">' +
                '<button class="btn btn-default edit-contact">Редактировать</button>' +
                '<button class="btn btn-default delete-contact">Удалить</button>' +
            '</td>' +
        '</tr>'),

    contactNumber: _.template('<span class="glyphicon glyphicon-<%- type %>" style="width: 40px;"></span><span><%- number %></span>'),

    record: _.template('<div class="modal fade record"><div class="modal-dialog modal-lg">' +
            '<div class="modal-content"><div class="modal-body">' +
                    '<div class="error" class="hidden">Что-то пошло не так. Попробуйте ещё раз.</div>' +
                    '<form class="form-horizontal">' +
                    '<div class="form-group">' +
                        '<label for="contact-name" class="control-label col-sm-4">Имя:</label>' +
                        '<div class="col-sm-6"><input type="text" class="form-control contact-name"/></div>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label class="control-label col-sm-4">Номера телефонов:</label>' +
                        '<div class="col-sm-6">' +
                            '<p class="bg-info no-numbers">Нет добавленных номеров</p>' +
                            '<table class="table table-stripped hidden contact-numbers"></table>' +
                            '<div class="input-group">' +
                                '<div class="input-group-addon" style="width:150px"><select class="form-control number-type" name="number-type">' +
                                    '<option value="mobile">Мобильный</option>' +
                                    '<option value="home">Домашний</option>' +
                                    '<option value="work">Рабочий</option>' +
                                '</select></div>' +
                                '<div style="display: table-cell; padding: 6px 0; background-color: #eee; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc;">' +
                                    '<input type="text" class="form-control contact-phone"/>' +
                                '</div>' +
                                '<div class="input-group-addon" style="width:50px"><button type="button" class="btn add-number">Добавить</button></div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</form>' +
            '</div><div class="modal-footer">' +
                '<button type="button" class="btn btn-primary submit">Сохранить</button>' +
                '<button type="button" class="btn cancel">Отмена</button>' +
            '</div></div>' +
        '</div></div>'),

    numberInput: _.template('<tr>' +
            '<td style="width: 40px;"><span class="glyphicon glyphicon-<%- icon %>"></span></td>' +
            '<td><%- number %></td>' +
            '<td data-index="<%- index %>"><%= buttonsTemplate %></td>' +
        '</tr>'),

    buttons: {
        up: _.template('<span class="glyphicon glyphicon-arrow-up <%- action %>"></span>'),
        down: _.template('<span class="glyphicon glyphicon-arrow-down <%- action %>"></span>'),
        'delete': _.template('<span class="glyphicon glyphicon-remove <%- action %>"></span>')
    },

    conflict: _.template('<div class="modal fade conflict"><div class="modal-dialog">' +
            '<div class="modal-content"><div class="modal-body"><table class="table table-stripped">' +
                '<tr><td colspan="2" class="conflict-message"></td></tr>' +
                '<tr><td>Локальный вариант</td><td>На сервере</td></tr>' +
                '<tr><td class="ours" style="width: 50%;"></td><td class="theirs info" class="width: 50%;"></td></tr>' +
            '</table></div><div class="modal-footer" style="text-align: center;">' +
                '<button class="btn reinstate">Использовать локальный</button>' +
                '<button class="btn edit">Редактировать</button>' +
                '<button class="btn ignore ignore-message"></button>' +
            '</div></div>' +
        '</div></div>'),

    conflictRecord: _.template('<%- name %><br/><%= numbersTemplate %>')
};

ContactListView.icons = {
    mobile: 'phone',
    home: 'home',
    work: 'briefcase'
};

ContactListView.conflicts = {
    deleted: {
        message: 'Запись была удалена с сервера',
        ignoreButton: 'Удалить запись'
    },
    modified: {
        message: 'Запись была изменена на сервере',
        ignoreButton: 'Отменить локальные правки'
    }
};

$.extend(ContactListView.prototype, {
    renderAt: function ($contactList) {
        this._$contactList = $contactList;

        this._buildHtml();

        this._$contactList
            .on('click', '.new', this._addNewContact.bind(this))
            .on('click', '.update', this._update.bind(this))
            .on('click', '.edit-contact', this._editContact.bind(this))
            .on('click', '.delete-contact', this._deleteContact.bind(this));
    },

    _buildHtml: function () {
        this._$contactList.html(
            this._getContactsHtml() +
            ContactListView.templates.record() +
            ContactListView.templates.conflict()
        );
        this._$record = this._$contactList.find('.record');
        this._$conflict = this._$contactList.find('.conflict');
    },

    _getContactsHtml: function () {
        var contacts = this._model.getContacts(),
            content = [];

        if (contacts.length == 0) {
            content.push(ContactListView.templates.empty());
        } else {
            var sortedContacts = contacts.sort(function (a, b) {
                    return a.name < b.name ? -1 : 1;
                });

            content = sortedContacts.map(function (contact) {
                return ContactListView.templates.contact({
                    id: contact.id,
                    name: contact.name,
                    numbersTemplate: contact.numbers.map(function (row) {
                        return ContactListView.templates.contactNumber({
                            type: ContactListView.icons[row.type],
                            number: row.number
                        });
                    }).join('<br/>')
                });
            });
        }

        return ContactListView.templates.contactList({
            contentTemplate: content.join('')
        });
    },

    _update: function () {
        this._model.update().then(this._buildHtml.bind(this));
    },

    _addNewContact: function () {
        this._currentId = Math.floor(Math.random() * 1e10).toString(16);
        this._showRecord({
            name: '',
            numbers: [],
            addingNewContact: true
        });
    },

    _editContact: function (e) {
        var id = this._extractDataAttribute(e, 'data-id');
        if (id !== null) {
            this._currentId = id;
            var contact = this._model.getContact(id);
            this._showRecord({
                name: contact.name,
                numbers: contact.numbers
            });
        }
    },

    _deleteContact: function (e) {
        var id = this._extractDataAttribute(e, 'data-id');
        if (id !== null) {
            this._model.deleteContact(id).always(this._buildHtml.bind(this));
        }
    },

    _showRecord: function (values) {
        this._numberChanges = [];
        this._addingNewContact = values.addingNewContact;
        this._rewriteContact = values.rewriteContact;
        this._$record.find('.error').addClass('hidden');
        this._setFieldsValues(values);

        var $record = this._$record;
        $record
            .on('click', '.submit', this._submit.bind(this))
            .on('click', '.cancel', this._hideRecord.bind(this))
            .on('click', '.add-number', this._addNumber.bind(this))
            .on('click', '.move-number-up', this._moveNumberUp.bind(this))
            .on('click', '.move-number-down', this._moveNumberDown.bind(this))
            .on('click', '.delete-number', this._deleteNumber.bind(this));

        $record.modal('show', {
            backdrop: 'static'
        });
    },

    _hideRecord: function () {
        this._$record.modal('hide');
        this._$record.off('click')
    },

    _addNumber: function () {
        var $number = this._$record.find('.contact-phone'),
            number = $number.val(),
            type = this._$record.find('.number-type').val();

        if (number) {
            this._numberChanges.push({
                operation: 'insert',
                index: this._currentValues.numbers.length,
                type: type,
                number: number
            });
            this._currentValues.numbers.push({
                type: type,
                number: number
            });
            this._renderNumbers();
        }

        $number.val('');
    },

    _moveNumberUp: function (e) {
        this._moveNumber(e, -1);
    },

    _moveNumberDown: function (e) {
        this._moveNumber(e, 1);
    },

    _moveNumber: function (e, direction) {
        var index = Number(this._extractDataAttribute(e, 'data-index')),
            currentValues = this._currentValues;

        if (!isNaN(index)) {
            var newIndex = index + direction;

            this._numberChanges.push({
                operation: 'move',
                index: index,
                newIndex: newIndex
            });

            var number = currentValues.numbers[index];
            currentValues.numbers[index] = currentValues.numbers[newIndex];
            currentValues.numbers[newIndex] = number;
            this._renderNumbers();
        }
    },

    _deleteNumber: function (e) {
        var index = Number(this._extractDataAttribute(e, 'data-index'));

        if (!isNaN(index)) {
            this._numberChanges.push({
                operation: 'delete',
                index: index
            });
            this._currentValues.numbers.splice(index, 1);
            this._renderNumbers();
        }
    },

    _submit: function () {
        var success = (function () {
                this._buildHtml();
                this._hideRecord();
            }).bind(this),

            fail = (function (e) {
                if (e.notFatal) {
                    this._hideRecord();
                    this._showConflict(e.ours, e.theirs);
                } else {
                    this._$record.find('.error').removeClass('hidden');
                }
            }).bind(this);

        if (this._rewriteContact) {
            this._model.setContact({
                id: this._currentId,
                name: this._$record.find('.contact-name').val(),
                numbers: this._currentValues.numbers
            }).then(success, fail);
        } else {
            this._model.updateContact({
                id: this._currentId,
                name: this._$record.find('.contact-name').val(),
                numbers: this._currentValues.numbers,
                numberChanges: this._numberChanges,
                addNewRecord: this._addingNewContact
            }).then(success, fail);
        }
    },

    _extractDataAttribute: function (e, attributeName) {
        var target = e.target;
        while (target && !target.hasAttribute(attributeName)) {
            target = target.parentNode;
        }

        if (target) {
            return target.getAttribute(attributeName);
        } else {
            return null;
        }
    },

    _setFieldsValues: function (values) {
        this._currentValues = values;
        this._$record.find('.contact-name').val(values.name);
        this._renderNumbers();
    },

    _renderNumbers: function () {
        var numbers = this._currentValues.numbers,
            $contactNumbers = this._$record.find('.contact-numbers'),
            $noNumbers = this._$record.find('.no-numbers');

        if (numbers.length == 0) {
            $contactNumbers.empty().addClass('hidden');
            $noNumbers.removeClass('hidden');
        } else {
            var templates = ContactListView.templates,
                buttonTemplates = templates.buttons,
                numberTemplate = templates.numberInput,
                icons = ContactListView.icons;

            $contactNumbers.addClass('hidden').html(
                numbers.map(function (number, index) {
                    var buttons = [
                            buttonTemplates.up({
                                action: index > 0 ? 'active move-number-up' : 'inactive'
                            }),
                            buttonTemplates.down({
                                action: index < numbers.length - 1 ? 'active move-number-down' : 'inactive'
                            }),
                            buttonTemplates['delete']({
                                action: 'active delete-number'
                            })
                        ];

                    return numberTemplate({
                        icon: icons[number.type],
                        number: number.number,
                        index: index,
                        buttonsTemplate: buttons.join('')
                    })
                }).join('')
            ).removeClass('hidden');
            $noNumbers.addClass('hidden');
        }
    },

    _showConflict: function (ourRecord, theirRecord) {
        var $conflict = this._$conflict,
            $ours = this._$conflict.find('.ours'),
            $theirs = this._$conflict.find('.theirs'),
            type = theirRecord ? 'modified' : 'deleted';

        $conflict.find('.conflict-message').html(
            ContactListView.conflicts[type].message
        );
        $conflict.find('.ignore-message').html(
            ContactListView.conflicts[type].ignoreButton
        );

        switch (type) {
            case 'deleted':
                $ours.html(this._makeConflictRecordHtml(ourRecord));
                $theirs.html('');
                break;
            case 'modified':
                $ours.html(this._makeConflictRecordHtml(ourRecord));
                $theirs.html(this._makeConflictRecordHtml(theirRecord));
        }

        var $reinstate = $conflict.find('.reinstate'),
            $edit = $conflict.find('.edit'),
            $ignore = $conflict.find('.ignore'),

            close = (function () {
                $reinstate.off('click');
                $edit.off('click');
                $ignore.off('click');

                this._getContactsHtml();
                $conflict.modal('hide');
            }).bind(this);

        $reinstate.on('click', (function () {
            this._model.setContact(ourRecord).then(close);
        }).bind(this));

        $edit.on('click', (function () {
            this._currentId = ourRecord.id;
            close();
            this._showRecord({
                name: ourRecord.name,
                numbers: ourRecord.numbers,
                rewriteContact: true
            });
        }).bind(this));

        $ignore.on('click', close);

        $conflict.modal('show', {
            backdrop: 'static'
        });
    },

    _makeConflictRecordHtml: function (values) {
        var types = ContactListView.icons;
        return ContactListView.templates.conflictRecord({
            name: values.name,
            numbersTemplate: values.numbers.map(function (number) {
                return ContactListView.templates.contactNumber({
                    type: types[number.type],
                    number: number.number
                })
            }).join('<br/>')
        });
    }
});

