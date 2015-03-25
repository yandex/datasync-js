ns.modules.define('global', function (provide) {
    provide(global);
});
if (typeof module == 'object') {
    module.exports = ns;
} else {
    var ya = global.ya || (global.ya = {});
    ya.modules = ns.modules;
    ya.vow = ns.vow;
    ya.cloud = ns.cloud;
}