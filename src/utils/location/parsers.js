"use strict";
// Location parsing utilities
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLocation = parseLocation;
exports.parseLocationWithCountry = parseLocationWithCountry;
var constants_1 = require("./constants");
var detectors_1 = require("./detectors");
/**
 * Parse location string based on detected country format
 */
function parseLocationByCountry(location, countryCode) {
    var pattern = constants_1.LOCATION_PATTERNS[countryCode];
    if (!pattern) {
        return parseGenericLocation(location);
    }
    var match = location.match(pattern);
    if (!match) {
        return parseGenericLocation(location);
    }
    // Special handling for Philippine addresses
    if (countryCode === 'PH') {
        var part1 = match[1], part2 = match[2], part3 = match[3], part4 = match[4];
        var parts = [part1, part2, part3, part4].filter(Boolean).map(function (p) { return p === null || p === void 0 ? void 0 : p.trim(); });
        // Philippine address formats:
        // 1. "Barangay, City/Municipality, Province, Philippines"
        // 2. "City/Municipality, Province, Philippines"
        // 3. "Barangay, City/Municipality, Province"
        // 4. "City/Municipality, Province"
        // 5. Complex addresses with multiple parts
        if (parts.length >= 4) {
            // For complex addresses, look for city and province specifically
            var city_1 = '';
            var state_1 = '';
            // Look for common Philippine cities
            var phCities = ['pasay', 'makati', 'quezon city', 'manila', 'taguig', 'pasig', 'marikina', 'caloocan', 'malabon', 'navotas', 'valenzuela', 'parañaque', 'las piñas', 'muntinlupa', 'mandaluyong', 'pasay', 'pateros', 'baguio', 'davao', 'cebu', 'iloilo', 'bacolod', 'zamboanga', 'general santos', 'butuan', 'iligan', 'olongapo', 'angeles', 'dagupan', 'naga', 'legazpi', 'roxas', 'puerto princesa', 'tagaytay', 'batangas', 'lipa', 'lucena', 'antipolo', 'cainta', 'taytay', 'angono', 'binangonan', 'cardona', 'morong', 'pililla', 'rodriguez', 'tanay', 'teresa', 'baras', 'jala-jala'];
            // Look for common Philippine provinces
            var phProvinces = ['metro manila', 'cebu', 'davao del sur', 'bulacan', 'laguna', 'cavite', 'pampanga', 'rizal', 'quezon', 'batangas', 'nueva ecija', 'pangasinan', 'iloilo', 'negros occidental', 'bohol', 'leyte', 'camarines sur', 'zamboanga del sur', 'misamis oriental', 'cotabato'];
            // Find city
            for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
                var part = parts_1[_i];
                var partLower = part.toLowerCase();
                for (var _a = 0, phCities_1 = phCities; _a < phCities_1.length; _a++) {
                    var cityName = phCities_1[_a];
                    if (partLower.includes(cityName) && !city_1) {
                        city_1 = part;
                        break;
                    }
                }
                if (city_1)
                    break;
            }
            // Find province
            for (var _b = 0, parts_2 = parts; _b < parts_2.length; _b++) {
                var part = parts_2[_b];
                var partLower = part.toLowerCase();
                for (var _c = 0, phProvinces_1 = phProvinces; _c < phProvinces_1.length; _c++) {
                    var provinceName = phProvinces_1[_c];
                    if (partLower.includes(provinceName) && !state_1) {
                        // Clean up the province name (remove extra text)
                        if (provinceName === 'metro manila') {
                            state_1 = 'Metro Manila';
                        }
                        else {
                            state_1 = part;
                        }
                        break;
                    }
                }
                if (state_1)
                    break;
            }
            if (city_1 && state_1) {
                return {
                    city: city_1,
                    state: state_1,
                    fullAddress: location.trim(),
                };
            }
        }
        if (parts.length === 4) {
            // Format: "Barangay, City/Municipality, Province, Philippines"
            return {
                city: "".concat(parts[0], ", ").concat(parts[1]), // Barangay, City/Municipality
                state: parts[2], // Province
                country: parts[3], // Philippines
                fullAddress: location.trim(),
            };
        }
        else if (parts.length === 3) {
            // Check if last part is "Philippines" or a province
            var lastPart = parts[2].toLowerCase();
            if (lastPart.includes('philippines') || lastPart.includes('filipino')) {
                // Format: "City/Municipality, Province, Philippines"
                return {
                    city: parts[0], // City/Municipality
                    state: parts[1], // Province
                    country: parts[2], // Philippines
                    fullAddress: location.trim(),
                };
            }
            else {
                // Format: "Barangay, City/Municipality, Province"
                return {
                    city: "".concat(parts[0], ", ").concat(parts[1]), // Barangay, City/Municipality
                    state: parts[2], // Province
                    fullAddress: location.trim(),
                };
            }
        }
        else if (parts.length === 2) {
            // Format: "City/Municipality, Province"
            return {
                city: parts[0], // City/Municipality
                state: parts[1], // Province
                fullAddress: location.trim(),
            };
        }
        else if (parts.length === 1) {
            // Single part - could be city or province
            return {
                city: parts[0],
                fullAddress: location.trim(),
            };
        }
    }
    // Standard parsing for other countries
    var city = match[1], state = match[2], country = match[3];
    return {
        city: city === null || city === void 0 ? void 0 : city.trim(),
        state: state === null || state === void 0 ? void 0 : state.trim(),
        country: country === null || country === void 0 ? void 0 : country.trim(),
        fullAddress: location.trim(),
    };
}
/**
 * Generic location parser for unknown formats
 */
function parseGenericLocation(location) {
    var parts = location.split(',').map(function (part) { return part.trim(); }).filter(Boolean);
    if (parts.length === 0) {
        return { fullAddress: location };
    }
    if (parts.length === 1) {
        return {
            city: parts[0],
            fullAddress: location,
        };
    }
    if (parts.length === 2) {
        return {
            city: parts[0],
            state: parts[1],
            fullAddress: location,
        };
    }
    // For 3+ parts, assume: city, state, country
    return {
        city: parts[0],
        state: parts[1],
        country: parts.slice(2).join(', '),
        fullAddress: location,
    };
}
/**
 * Main function to parse location intelligently
 */
function parseLocation(location) {
    if (!location) {
        return { fullAddress: '' };
    }
    var trimmedLocation = location.trim();
    if (!trimmedLocation) {
        return { fullAddress: '' };
    }
    // Detect country
    var countryCode = (0, detectors_1.detectCountry)(trimmedLocation);
    // Parse based on detected country
    if (countryCode) {
        return parseLocationByCountry(trimmedLocation, countryCode);
    }
    // Fallback to generic parsing
    return parseGenericLocation(trimmedLocation);
}
/**
 * Parse location with specific country format
 */
function parseLocationWithCountry(location, countryCode) {
    if (!location) {
        return { fullAddress: '' };
    }
    var trimmedLocation = location.trim();
    if (!trimmedLocation) {
        return { fullAddress: '' };
    }
    return parseLocationByCountry(trimmedLocation, countryCode);
}
