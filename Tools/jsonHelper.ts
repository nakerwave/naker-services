export class JsonHelper {

    recursiveJsonToObject(interfaceObject: Object, objectToTransale: Object) {
        let param: any = {};
        for (let key in interfaceObject) {
            let par = interfaceObject[key];
            let trad = par.dim;
            if (!trad) trad = par
            if (objectToTransale[trad] !== undefined) {
                if (par.next !== undefined) {
                    param[key] = this.recursiveJsonToObject(par.next, objectToTransale[trad]);
                } else {
                    param[key] = objectToTransale[trad];
                }
            }
        }
        return param;
    }

    recursiveObjectToJson(interfaceObject: Object, objectToTransale: Object) {
        let json = {};
        for (let key in interfaceObject) {
            if (objectToTransale[key] !== undefined) {
                let par = interfaceObject[key];
                if (par.next !== undefined) {
                    json[par.dim] = this.recursiveObjectToJson(par.next, objectToTransale[key]);
                } else if (par.accuracy !== undefined) {
                    json[par.dim] = this.limitAccuracy(objectToTransale[key], par.accuracy);
                } else {
                    json[par] = objectToTransale[key];
                }
            }
        }
        return json;
    }

    recursiveObjectToObject(interfaceObject: Object, objectToTransale: Object) {
        let json = {};
        for (let key in interfaceObject) {
            if (objectToTransale[key] !== undefined) {
                let par = interfaceObject[key];
                if (par.next !== undefined) {
                    json[key] = this.recursiveObjectToObject(par.next, objectToTransale[key]);
                } else if (par.accuracy !== undefined) {
                    json[key] = this.limitAccuracy(objectToTransale[key], par.accuracy);
                } else {
                    json[key] = objectToTransale[key];
                }
            }
        }
        return json;
    }

    limitAccuracy(number: number, length: number) {
        if (length == 1) return Math.round(number);
        let powLength = Math.pow(10, length);
        return Math.round(number * powLength) / powLength;
    }
}
