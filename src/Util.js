/**
 * Created by malloyzhu on 2015/10/30.
 */

var Util = {
    handler: function (callback, caller) {
        return function () {
            callback.apply(caller, arguments);
        }
    }
};
