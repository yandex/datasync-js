ns.modules.define('global', function (provide) {
    provide(global);
});
if (typeof global.module == 'object') {
    global.module.exports = ns;
} else {
    var ya = global.ya || (global.ya = {
            modules: ns.modules,
            Promise: ns.Promise
        });
    ya.cloud = ns.cloud;
}