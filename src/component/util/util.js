ns.modules.define('component.util', function (provide) {
    var util = {
            /**
             * @ignore
             * Базовая функция, реализующая наследование в JavaScript.
             * Реализует наследование прототипа без исполнения конструктора родителя.
             *
             * К дочернему классу добавляется поле 'superclass', указывающее на
             * прототип родительского класса, и поле 'constructor', которое указывает на конструктор класса.
             * Через поле 'constructor' объекта 'superclass' можно обратится к конструктору родительского класса.
             * @name component.util.augment
             * @function
             * @static
             * @param {Function} ChildClass Дочерний класс.
             * @param {Function} ParentClass Родительский класс.
             * @param {Object} override Набор дополнительных полей и функций,
             * которые будут приписаны к прототипу дочернего класса.
             * @returns {Object} Прототип дочернего класса.
             * @example
             *
             * // Родительский класс
             * var ParentClass = function (param1, param2) {
             *     this.param1 = param1;
             *     this.param2 = param2;
             * };
             *
             * ParentClass.prototype = {
             *     foo: function () {
             *         alert('Parent!');
             *     }
             * };
             * // Дочерний класс
             * var ChildClass = function (param1, param2, param3) {
             *     // Вызываем конструктор родителя
             *     ChildClass.superclass.constructor.call(this, param1, param2);
             *     this._param3 = param3;
             * }
             *
             * // наследуем ChildClass от ParentClass
             * augment(ChildClass, ParentClass, {
             *     // переопределяем в наследнике метод foo
             *     foo: function () {
             *         // Вызываем метод родительского класса
             *         ChildClass.superclass.foo.call(this);
             *         alert('Child!');
             *     }
             * });
             */
            augment: function (ChildClass, ParentClass, override) {
                ChildClass.prototype = (Object.create || function (obj) {
                    function F () {
                    }

                    F.prototype = obj;
                    return new F();
                })(ParentClass.prototype);

                ChildClass.prototype.constructor = ChildClass;
                ChildClass.superclass = ParentClass.prototype;
                ChildClass.superclass.constructor = ParentClass;

                if (override) {
                    util.extend(ChildClass.prototype, override);
                }
                return ChildClass.prototype;
            },
            /**
             * @ignore
             * Функция, копирующая свойства из одного или нескольких
             * JavaScript-объектов в другой JavaScript-объект.
             * @param {Object} target Целевой JavaScript-объект. Будет модифицирован
             * в результате работы функции.
             * @param {Object} source JavaScript-объект - источник. Все его свойства
             * будут скопированы. Источников может быть несколько (функция может иметь
             * произвольное число параметров), данные копируются справа налево (последний
             * аргумент имеет наивысший приоритет при копировании).
             * @name component.util.extend
             * @function
             * @static
             *
             * @example
             * var options = extend({
             *      prop1: 'a',
             *      prop2: 'b'
             * }, {
             *      prop2: 'c',
             *      prop3: 'd'
             * }, {
             *      prop3: 'e'
             * });
             * // Получим в итоге: {
             * //     prop1: 'a',
             * //     prop2: 'c',
             * //     prop3: 'e'
             * // }
             */
            extend: function (target) {
                for (var i = 1, l = arguments.length; i < l; i++) {
                    var arg = arguments[i];
                    if (arg) {
                        var keys = Object.keys(arg);
                        for (var j = 0, k = keys.length; j < k; j++) {
                            target[keys[j]] = arg[keys[j]];
                        }
                    }
                }
                return target;
            },
            /**
             * @ignore
             * <p>Базовая функция, реализующая объявление классов.
             * При помощи этой функции можно объявить новый класс, указать у этого класса набор методов и
             * произвести наследование от другого класса.</p>
             * <p>К дочернему классу приписывается поле superclass, указывающее на
             * прототип родительского класса.
             * Через поле 'constructor' объекта 'superclass' можно обратится
             * к конструктору родительского класса.</p>
             * @name component.util.defineClass
             * @function
             * @static
             * @param {Function} constructor Конструктор класса.
             * @param {Function} [parentClass] Родительский класс,
             * от которого необходимо произвести наследование. Этот аргумент может быть пропущен.
             * @param {Object} [override] Набор дополнительных полей и функций,
             * которые будут приписаны к прототипу класса. Источников может быть несколько (функция может иметь
             * произвольное число параметров), данные копируются справа налево (последний
             * аргумент имеет наивысший приоритет при копировании).
             * @returns {Function} Класс.
             */
            defineClass: function (constructor) {
                var argIndex = 1,
                    baseConstructor = typeof arguments[argIndex] == "function" ? arguments[argIndex++] : null;

                if (baseConstructor) {
                    util.augment(constructor, baseConstructor);
                }

                var argLength = arguments.length;
                while (argIndex < argLength) {
                    util.extend(constructor.prototype, arguments[argIndex++]);
                }

                return constructor;
            }
        };

    provide(util);
});