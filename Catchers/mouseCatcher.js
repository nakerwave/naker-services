import { Animation } from '../Animation/animation';
import remove from 'lodash/remove';
import { Vector2, Quaternion } from '@babylonjs/core/Maths/math';
import { Tools } from '@babylonjs/core/Misc/Tools';
var MouseCatcher = /** @class */ (function () {
    function MouseCatcher(animationManager) {
        var _this = this;
        this.mousecatch = new Vector2(0, 0);
        this.catching = true;
        // Code copied from babylon: https://github.com/BabylonJS/Babylon.js/blob/master/src/Cameras/Inputs/freeCameraDeviceOrientationInput.ts
        this.screenQuaternion = new Quaternion();
        this.constantTranform = new Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
        this.deviceMaxVector = new Vector2(Math.PI / 8, Math.PI / 8);
        this.step = new Vector2(0, 0);
        this.mouseReal = new Vector2(0, 0);
        this.mouseCatch = new Vector2(0, 0);
        this.rapidity = 0.1;
        this.finalPrecision = 0.01;
        this.listeners = [];
        this.animation = new Animation(animationManager, 10);
        window.addEventListener("mousemove", function (evt) { _this.mouseOrientation(evt); });
        window.addEventListener("deviceorientation", function (evt) { _this.deviceOrientation(evt); });
        window.addEventListener("orientationchange", function () { _this.orientationChanged(); });
        this.orientationChanged();
    }
    MouseCatcher.prototype.orientationChanged = function () {
        var screenOrientationAngle = (window.orientation !== undefined ? +window.orientation : (window.screen.orientation && (window.screen.orientation)['angle'] ? (window.screen.orientation).angle : 0));
        screenOrientationAngle = -Tools.ToRadians(screenOrientationAngle / 2);
        this.screenQuaternion.copyFromFloats(0, Math.sin(screenOrientationAngle), 0, Math.cos(screenOrientationAngle));
    };
    MouseCatcher.prototype.deviceOrientation = function (evt) {
        if (this.catching) {
            var gamma = evt.gamma !== null ? evt.gamma : 0;
            var beta = evt.beta !== null ? evt.beta : 0;
            var alpha = evt.alpha !== null ? evt.alpha : 0;
            if (evt.gamma !== null) {
                var quaternion = Quaternion.RotationYawPitchRoll(Tools.ToRadians(alpha), Tools.ToRadians(beta), -Tools.ToRadians(gamma));
                quaternion.multiplyInPlace(this.screenQuaternion);
                quaternion.multiplyInPlace(this.constantTranform);
                quaternion.z *= -1;
                quaternion.w *= -1;
                var angles = quaternion.toEulerAngles();
                var pos = new Vector2(angles.y, angles.x);
                // * 3 to make it match with mousemove
                pos.divideInPlace(this.deviceMaxVector);
                Vector2.Maximize(pos, this.deviceMaxVector);
                this.catch(pos);
            }
        }
    };
    MouseCatcher.prototype.mouseOrientation = function (evt) {
        if (this.catching) {
            var pos = Vector2.Zero();
            var w = window.innerWidth;
            var h = window.innerHeight;
            pos.x = 2 * (evt.x - w / 2) / w;
            pos.y = 2 * (evt.y - h / 2) / h;
            this.catch(pos);
        }
    };
    MouseCatcher.prototype.start = function () {
        this.catching = true;
    };
    MouseCatcher.prototype.stop = function () {
        this.catching = false;
    };
    MouseCatcher.prototype.catch = function (mouse) {
        var _this = this;
        this.mouseReal = mouse;
        this.animation.infinite(function () {
            var gapmouse = _this.mouseReal.subtract(_this.mouseCatch);
            _this.step.x = gapmouse.x * _this.rapidity;
            _this.step.y = gapmouse.y * _this.rapidity;
            _this.mouseCatch.x += _this.step.x;
            _this.mouseCatch.y += _this.step.y;
            if (Math.abs(gapmouse.x) < _this.finalPrecision && Math.abs(gapmouse.y) < _this.finalPrecision)
                _this.animation.running = false;
            for (var i = 0; i < _this.listeners.length; i++) {
                _this.listeners[i](_this.mouseCatch);
            }
        });
    };
    MouseCatcher.prototype.addListener = function (callback) {
        this.listeners.push(callback);
    };
    MouseCatcher.prototype.removeListener = function (callback) {
        remove(this.listeners, function (c) { c == callback; });
    };
    return MouseCatcher;
}());
export { MouseCatcher };
//# sourceMappingURL=mouseCatcher.js.map