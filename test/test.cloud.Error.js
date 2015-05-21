var expect = expect || require('expect.js'),
    ya = ya || require('../build/cloud-data-sync-api.js');

ya.modules.define('test.cloud.Error', [
    'cloud.Error'
], function (provide, CloudError) {

    describe('cloud.Error', function () {
        it('should extend Error', function () {
            var error = new CloudError();
            expect(error instanceof Error).to.be(true);
            expect(error instanceof CloudError).to.be(true);
        });

        it('should contain stack', function () {
            var error = new CloudError();
            expect(typeof error.stack === 'string').to.be(true);
        });
    });

    provide();
});
