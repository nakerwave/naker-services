export var JsonHelper = {
    recursiveJsonToObject: function (interfaceObject, objectToTransale) {
        var param = {};
        for (var key in interfaceObject) {
            var par = interfaceObject[key];
            var trad = par.dim;
            if (!trad)
                trad = par;
            if (objectToTransale[trad] != undefined) {
                if (par.next != undefined) {
                    param[key] = this.recursiveJsonToObject(par.next, objectToTransale[trad]);
                }
                else {
                    param[key] = objectToTransale[trad];
                }
            }
        }
        return param;
    },
    recursiveObjectToJson: function (interfaceObject, objectToTransale) {
        var json = {};
        for (var key in interfaceObject) {
            if (objectToTransale[key] != undefined) {
                var par = interfaceObject[key];
                if (par.next != undefined) {
                    json[par.dim] = this.recursiveObjectToJson(par.next, objectToTransale[key]);
                }
                else if (par.accuracy != undefined) {
                    json[par.dim] = this.limitAccuracy(objectToTransale[key], par.accuracy);
                }
                else {
                    json[par] = objectToTransale[key];
                }
            }
        }
        return json;
    },
    recursiveObjectToObject: function (interfaceObject, objectToTransale) {
        var json = {};
        for (var key in interfaceObject) {
            if (objectToTransale[key] != undefined) {
                var par = interfaceObject[key];
                if (par.next != undefined) {
                    json[key] = this.recursiveObjectToObject(par.next, objectToTransale[key]);
                }
                else if (par.accuracy != undefined) {
                    json[key] = this.limitAccuracy(objectToTransale[key], par.accuracy);
                }
                else {
                    json[key] = objectToTransale[key];
                }
            }
        }
        return json;
    },
    limitAccuracy: function (number, length) {
        if (length == 1)
            return Math.round(number);
        var powLength = Math.pow(10, length);
        return Math.round(number * powLength) / powLength;
    },
};
//# sourceMappingURL=jsonHelper.js.map