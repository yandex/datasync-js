ns.modules.define('global', function (provide) {
    provide(global);
});
if (typeof module == 'object') {
    module.exports = ns;
} else {
    var ya = global.ya || (global.ya = {
            modules: ns.modules,
            vow: ns.vow
        });
    ya.cloud = ns.cloud;
}