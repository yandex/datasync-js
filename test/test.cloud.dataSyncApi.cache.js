var expect = expect || require('expect.js'),
    ya = ya || require('../build/cloud-data-sync-api.js');

ya.modules.define('test.cloud.dataSyncApi.cache', [
    'test.util',
    'cloud.dataSyncApi.cache',
    'cloud.dataSyncApi.Dataset',
    'localForage',
    'vow'
], function (provide, util, cache, Dataset, localForage, vow) {
    function clearCache (done) {
        cache.clear().done(
            done,
            done
        );
    }

    beforeEach(function (done) {
        clearCache(done);
    });
    afterEach(function (done) {
        clearCache(done);
    });

    describe('cloud.dataSyncApi.cache', function () {
        var snapshotJson = util.snapshotJson,
            checkDataset = util.checkDataset;

        it('getDataset', function (done) {
            localForage.setItem(
                cache.getDatasetKey('app', 'test'),
                JSON.stringify(snapshotJson)
            ).done(
                function () {
                    cache.getDataset('app', 'test').done(function (dataset) {
                        checkDataset(dataset, Dataset.json.deserialize(snapshotJson));
                        done();
                    }, done);
                },
                done
            );
        });

        it('saveDataset', function (done) {
            var dataset = Dataset.json.deserialize(snapshotJson);

            cache.saveDataset('app', 'test', dataset).done(function () {
                localForage.getItem(
                    cache.getDatasetKey('app', 'test')
                ).done(
                    function (res) {
                        checkDataset(Dataset.json.deserialize(JSON.parse(res)), dataset);
                        done();
                    },
                    done
                );
            }, done);
        });

        it('collectionId filter test', function (done) {
            var dataset1 = Dataset.json.deserialize(snapshotJson, {
                    collection_id: 'col',
                    collection_policy: 'skip'
                }),
                dataset2 = Dataset.json.deserialize(snapshotJson, {
                    collection_id: 'col_2',
                    collection_policy: 'skip'
                });

            vow.all([
                cache.saveDataset('app', 'test', dataset1),
                cache.saveDataset('app', 'test', dataset2)
            ]).done(function () {
                localForage.getItem(
                    cache.getDatasetKey('app', 'test')
                ).done(function (data) {
                    expect(data).to.eql(null);
                    vow.all([
                        cache.getDataset('app', 'test', 'col'),
                        cache.getDataset('app', 'test', 'col_2')
                    ]).done(function (datasets) {
                        checkDataset(datasets[0], dataset1);
                        checkDataset(datasets[1], dataset2);
                        done();
                    }, done);
                }, done);
            }, done);
        });

        it('collectionId test', function (done) {
            var dataset = Dataset.json.deserialize(snapshotJson);

            cache.saveDataset('app', 'test', dataset).done(function () {
                vow.all([
                    cache.getDataset('app', 'test'),
                    cache.getDataset('app', 'test', 'col')
                ]).done(function (res) {
                    checkDataset(res[0], dataset);
                    checkDataset(res[1], Dataset.json.deserialize(snapshotJson, {
                        collection_id: 'col',
                        collection_policy: 'skip'
                    }));
                    done();
                }, done)
            }, done);
        });
    });

    provide();
});