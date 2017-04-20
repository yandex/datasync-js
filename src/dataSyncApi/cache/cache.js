ns.modules.define('cloud.dataSyncApi.cache', [
    'localForage',
    'Promise',
    'cloud.Error',
    'cloud.dataSyncApi.config',
    'cloud.dataSyncApi.Dataset'
], function (provide, localForage, Promise, Error, config, Dataset) {
    localForage.config({
        name: config.prefix,
        storeName: config.prefix
    });

    var cache = {
            getDatasetKey: function (context, handle, collectionId) {
                if (collectionId) {
                    return 'dataset_' + context + '_' + handle + '|' + collectionId;
                } else {
                    return 'dataset_' + context + '_' + handle;
                }
            },

            getDataset: function (context, handle, collectionId) {
                if (collectionId) {
                    return getDatasetFromStorage(
                        this.getDatasetKey(context, handle, collectionId),
                        collectionId
                    ).then(
                        null,
                        function (e) {
                            if (e.code == 404) {
                                return getDatasetFromStorage(
                                    this.getDatasetKey(context, handle),
                                    collectionId
                                );
                            } else {
                                throw e;
                            }
                        },
                        this
                    );

                } else {
                    return getDatasetFromStorage(
                        this.getDatasetKey(context, handle)
                    );
                }
            },

            saveDataset: function (context, handle, dataset) {
                return this.saveItem(
                    this.getDatasetKey(context, handle, dataset.getCollectionId()),
                    JSON.stringify(Dataset.json.serialize(dataset))
                );
            },

            saveItem: function (key, value) {
                return localForage.setItem(key, value).fail(function () {
                        return cache.clear().always(function () {
                            return Promise.reject(new Error({
                                code: 500
                            }));
                        });
                });
            },

            clear: function () {
                return localForage.clear();
            }
        };

    function getDatasetFromStorage (key, collectionId) {
        var parameters = collectionId ? {
                collection_id: collectionId,
                collection_policy: 'skip'
            } : null;

        return localForage.getItem(key).then(function (data) {
            if (!data) {
                return Promise.reject(new Error({
                    code: 404
                }));
            } else {
                try {
                    data = Dataset.json.deserialize(
                        JSON.parse(data),
                        parameters
                    );
                } catch (e) {
                    data = null;
                    // Something went wrong, cache is corrupted
                    return cache.clear().always(function () {
                        return Promise.reject(new Error({
                            code: 500
                        }));
                    });
                }
            }

            return data;
        });
    }

    provide (cache);
});