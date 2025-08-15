"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePlatform = void 0;
var react_1 = require("react");
var platform_1 = require("../utils/platform");
var usePlatform = function () {
    var platformInfo = (0, react_1.useMemo)(function () { return (0, platform_1.getPlatformInfo)(); }, []);
    var browserInfo = (0, react_1.useMemo)(function () { return (0, platform_1.getBrowserInfo)(); }, []);
    var environmentConfig = (0, react_1.useMemo)(function () { return (0, platform_1.getEnvironmentConfig)(); }, []);
    var platformStyles = (0, react_1.useMemo)(function () { return (0, platform_1.getPlatformStyles)(); }, []);
    return __assign(__assign({}, platformInfo), { browserInfo: browserInfo, environmentConfig: environmentConfig, platformStyles: platformStyles });
};
exports.usePlatform = usePlatform;
