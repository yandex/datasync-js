var expect = expect || require('expect.js'),
    ya = ya || require('../build/cloud-data-sync-api.js');

ya.modules.define('test.cloud.dataSyncApi.cache', [
    'test.util',
    'cloud.dataSyncApi.cache',
    'cloud.dataSyncApi.Dataset',
    'localForage'
], function (provide, util, cache, Dataset, localForage) {
    describe('cloud.dataSyncApi.cache', function () {
        var snapshotJson = util.snapshotJson,
            checkDataset = util.checkDataset;

        it('getDataset', function (done) {
            var fail = function (e) {
                    cache.clear().always(function () {
                        done(e);
                    });
                };

            localForage.setItem(
                cache.getDatasetKey('app', 'test'),
                JSON.stringify(snapshotJson),
                function (e) {
                    if (e) {
                        fail(e);
                    } else {
                        cache.getDataset('app', 'test').then(function (dataset) {
                            checkDataset(dataset, Dataset.json.deserialize(snapshotJson));
                            done();
                        }, fail).fail(fail);
                    }
                }
            );
        });

        it('saveDataset', function (done) {
            var fail = function (e) {
                    cache.clear().always(function () {
                        done(e);
                    });
                },
                dataset = Dataset.json.deserialize(snapshotJson);

            cache.saveDataset('app', 'test', dataset).then(function () {
                localForage.getItem(
                    cache.getDatasetKey('app', 'test'),
                    function (e, res) {
                        if (e) {
                            fail(e);
                        } else {
                            checkDataset(Dataset.json.deserialize(res), dataset);
                            done();
                        }
                    }
                );
            }, fail).fail(fail);
        });
    });

    provide();
});