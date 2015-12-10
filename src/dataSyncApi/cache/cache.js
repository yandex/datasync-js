ns.modules.define('cloud.dataSyncApi.cache', [
    'localForage',
    'vow',
    'cloud.Error',
    'cloud.dataSyncApi.config',
    'cloud.dataSyncApi.Dataset'
], function (provide, localForage, vow, Error, config, Dataset) {
    localForage.config({
        name: config.prefix,
        storeName: config.prefix
    });

    var cache = {
            getDatasetKey: function (context, handle) {
                return 'dataset_' + context + '_' + handle;
            },

            getDataset: function (context, handle) {
                var deferred = vow.defer();

                localForage.getItem(
                    this.getDatasetKey(context, handle),
                    function (error, data) {
                        if (error) {
                            deferred.reject(error);
                        } else {
                            try {
                                data = Dataset.json.deserialize(
                                    JSON.parse(data)
                                );
                            } catch (e) {
                                data = null;
                                // Something went wrong, cache is corrupted
                                cache.clear().always(function () {
                                    deferred.reject(new Error({
                                        code: 500
                                    }));
                                });
                            }

                        if (data)
                            deferred.resolve(data);
                        }
                    }
                );

                return deferred.promise();
            },

            saveDataset: function (context, handle, dataset) {
                return this.saveItem(
                    this.getDatasetKey(context, handle),
                    JSON.stringify(Dataset.json.serialize(dataset))
                );
            },

            saveItem: function (key, value) {
                var deferred = vow.defer();

                localForage.setItem(key, value, function (error) {
                    if (error) {
                        cache.clear().always(function () {
                            deferred.reject(new Error({
                                code: 500
                            }));
                        });
                    } else {
                        deferred.resolve();
                    }
                });

                return deferred.promise();
            },

            clear: function () {
                var deferred = vow.defer();

                localForage.clear(function (e) {
                    if (e) {
                        deferred.reject(e);
                    } else {
                        deferred.resolve();
                    }
                });

                return deferred.promise();
            }
        };

    provide (cache);
});