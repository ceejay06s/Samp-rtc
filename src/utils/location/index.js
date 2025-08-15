"use strict";
// Location formatting module - Main exports
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLocationFormat = exports.normalizeLocation = exports.getShortLocation = exports.getMediumLocation = exports.getLocationComponents = exports.getFullLocation = exports.formatLocationForDisplay = exports.formatLocationForContext = exports.parseLocationWithCountry = exports.parseLocation = exports.isLocationFromCountry = exports.getPossibleCountries = exports.detectCountry = exports.PHILIPPINE_INDICATORS = exports.LOCATION_PATTERNS = exports.COUNTRY_NAMES = exports.COUNTRY_DETECTION = void 0;
// Constants
var constants_1 = require("./constants");
Object.defineProperty(exports, "COUNTRY_DETECTION", { enumerable: true, get: function () { return constants_1.COUNTRY_DETECTION; } });
Object.defineProperty(exports, "COUNTRY_NAMES", { enumerable: true, get: function () { return constants_1.COUNTRY_NAMES; } });
Object.defineProperty(exports, "LOCATION_PATTERNS", { enumerable: true, get: function () { return constants_1.LOCATION_PATTERNS; } });
Object.defineProperty(exports, "PHILIPPINE_INDICATORS", { enumerable: true, get: function () { return constants_1.PHILIPPINE_INDICATORS; } });
// Detectors
var detectors_1 = require("./detectors");
Object.defineProperty(exports, "detectCountry", { enumerable: true, get: function () { return detectors_1.detectCountry; } });
Object.defineProperty(exports, "getPossibleCountries", { enumerable: true, get: function () { return detectors_1.getPossibleCountries; } });
Object.defineProperty(exports, "isLocationFromCountry", { enumerable: true, get: function () { return detectors_1.isLocationFromCountry; } });
// Parsers
var parsers_1 = require("./parsers");
Object.defineProperty(exports, "parseLocation", { enumerable: true, get: function () { return parsers_1.parseLocation; } });
Object.defineProperty(exports, "parseLocationWithCountry", { enumerable: true, get: function () { return parsers_1.parseLocationWithCountry; } });
// Formatters
var formatters_1 = require("./formatters");
Object.defineProperty(exports, "formatLocationForContext", { enumerable: true, get: function () { return formatters_1.formatLocationForContext; } });
Object.defineProperty(exports, "formatLocationForDisplay", { enumerable: true, get: function () { return formatters_1.formatLocationForDisplay; } });
Object.defineProperty(exports, "getFullLocation", { enumerable: true, get: function () { return formatters_1.getFullLocation; } });
Object.defineProperty(exports, "getLocationComponents", { enumerable: true, get: function () { return formatters_1.getLocationComponents; } });
Object.defineProperty(exports, "getMediumLocation", { enumerable: true, get: function () { return formatters_1.getMediumLocation; } });
Object.defineProperty(exports, "getShortLocation", { enumerable: true, get: function () { return formatters_1.getShortLocation; } });
Object.defineProperty(exports, "normalizeLocation", { enumerable: true, get: function () { return formatters_1.normalizeLocation; } });
Object.defineProperty(exports, "validateLocationFormat", { enumerable: true, get: function () { return formatters_1.validateLocationFormat; } });
