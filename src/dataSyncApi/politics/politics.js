ns.modules.define('cloud.dataSyncApi.politics', [

], function (provide) {
    provide({
        theirs: function (operations, conflicts) {
            var indexes = conflicts.reduce(function (indexes, conflict) {
                    indexes[conflict.index] = true;
                    return indexes;
                }, {}),
                result = [];

            operations.forEach(function (operation, index) {
                if (!indexes[index]) {
                    result.push(operation);
                }
            });

            return result;
        }
    });
});