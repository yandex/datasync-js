/**
 * Yandex DataSync JS API
 *
 * Copyright 2014-2015 Yandex LLC and contributors https://yandex.com/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
var vow = global.ya && global.ya.vow || global.vow,
    ns = {
        cloud: {},
        Promise: vow && vow.Promise,
        modules: global.ya && global.ya.modules || global.modules
    };
ns.modules.define('Promise', function (provide) {
    provide(ns.Promise);
});
