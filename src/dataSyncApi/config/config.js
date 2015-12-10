ns.modules.define('cloud.dataSyncApi.config', function (provide) {
    provide({
        apiHost: 'https://cloud-api.yandex.net/',
        contexts: {
            app: true,
            user: true
        },
        oauthLoginPage: 'https://oauth.yandex.ru/authorize?response_type=token&client_id={{ key }}',
        oauthWindowParameters: 'width=600,height=500',
        prefix: 'yandex_data_sync_api_v1',
        deltaLimit: 100
    });
});