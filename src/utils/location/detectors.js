"use strict";
// Location detection utilities
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectCountry = detectCountry;
exports.isLocationFromCountry = isLocationFromCountry;
exports.getPossibleCountries = getPossibleCountries;
var constants_1 = require("./constants");
/**
 * Detect the country from location string
 */
function detectCountry(location) {
    var _a;
    var parts = location.split(',').map(function (part) { return part.trim(); });
    // Check for country names in the last part
    var lastPart = (_a = parts[parts.length - 1]) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    if (lastPart) {
        for (var _i = 0, _b = Object.entries(constants_1.COUNTRY_NAMES); _i < _b.length; _i++) {
            var _c = _b[_i], code = _c[0], names = _c[1];
            if (names.some(function (name) { return lastPart.includes(name.toLowerCase()); })) {
                return code;
            }
        }
    }
    // Check for state/province patterns
    for (var _d = 0, _e = Object.entries(constants_1.COUNTRY_DETECTION); _d < _e.length; _d++) {
        var _f = _e[_d], code = _f[0], pattern = _f[1];
        for (var _g = 0, parts_1 = parts; _g < parts_1.length; _g++) {
            var part = parts_1[_g];
            if (pattern.test(part)) {
                return code;
            }
        }
    }
    // Special check for Philippine addresses without explicit country name
    // Look for common Philippine location indicators
    var locationLower = location.toLowerCase();
    for (var _h = 0, PHILIPPINE_INDICATORS_1 = constants_1.PHILIPPINE_INDICATORS; _h < PHILIPPINE_INDICATORS_1.length; _h++) {
        var indicator = PHILIPPINE_INDICATORS_1[_h];
        if (locationLower.includes(indicator)) {
            return 'PH';
        }
    }
    return null;
}
/**
 * Check if a location string is likely from a specific country
 */
function isLocationFromCountry(location, countryCode) {
    return detectCountry(location) === countryCode;
}
/**
 * Get all possible countries for a location string
 */
function getPossibleCountries(location) {
    var countries = [];
    var parts = location.split(',').map(function (part) { return part.trim(); });
    // Check each part against country patterns
    for (var _i = 0, _a = Object.entries(constants_1.COUNTRY_DETECTION); _i < _a.length; _i++) {
        var _b = _a[_i], code = _b[0], pattern = _b[1];
        for (var _c = 0, parts_2 = parts; _c < parts_2.length; _c++) {
            var part = parts_2[_c];
            if (pattern.test(part) && !countries.includes(code)) {
                countries.push(code);
            }
        }
    }
    // Check for country names
    var locationLower = location.toLowerCase();
    for (var _d = 0, _e = Object.entries(constants_1.COUNTRY_NAMES); _d < _e.length; _d++) {
        var _f = _e[_d], code = _f[0], names = _f[1];
        if (names.some(function (name) { return locationLower.includes(name.toLowerCase()); }) && !countries.includes(code)) {
            countries.push(code);
        }
    }
    return countries;
}
