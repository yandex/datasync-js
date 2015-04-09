Yandex DataSync JS API 
===================================


Yandex DataSync API allows for structured data storage and synchronization in Web services and mobile applications.
Please follow the rules and recommendations in the API Terms of Use and brand guide.


Documentation
-------------

<a href="https://tech.yandex.ru/datasync/jsapi/">Available at tech.yandex.ru (in Russian)</a>

License
-------

Copyright 2014-2015 Yandex LLC and contributors <https://yandex.com/>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

<http://www.apache.org/licenses/LICENSE-2.0>

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Service Agreement
-----------------

<a href="http://legal.yandex.ru/sync_api/">Data Sync usage terms</a>


Important Notes
---------------

To use this API you MUST register your application at <a href="https://oauth.yandex.ru/">oauth.yandex.ru</a>.
You application MUST use secure http connection.

Example
-------
    
<a href="https://yandex.github.io/datasync-js/example/contactList.html">example/contactList.html</a>

Buiding
-------

  1. To build a project you need to have <a href="http://gulpjs.com/">gulp</a> installed on your system.
  2. Run `npm run debug` or `npm run release` to build debug or release version of the API respectively. Result will be placed into './build/' folder
  3. Run `npm run watch` to make gulp watching file changes and preforming debug build automatically

Testing
-------

  Open './test/test.html?token=<test_token>' in your browser. You may get test token on <a href="https://oauth.yandex.ru/">Yandex OAuth page</a>.
