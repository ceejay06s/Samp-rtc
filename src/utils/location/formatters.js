"use strict";
// Location formatting utilities
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatLocationForDisplay = formatLocationForDisplay;
exports.getLocationComponents = getLocationComponents;
exports.formatLocationForContext = formatLocationForContext;
exports.getShortLocation = getShortLocation;
exports.getMediumLocation = getMediumLocation;
exports.getFullLocation = getFullLocation;
exports.validateLocationFormat = validateLocationFormat;
exports.normalizeLocation = normalizeLocation;
var parsers_1 = require("./parsers");
/**
 * Format location for display based on country
 */
function formatLocationForDisplay(location, format) {
    if (format === void 0) { format = 'full'; }
    if (!location)
        return '';
    var parsed = (0, parsers_1.parseLocation)(location);
    switch (format) {
        case 'city-only':
            return parsed.city || location;
        case 'city-state':
            if (parsed.city && parsed.state) {
                return "".concat(parsed.city, ", ").concat(parsed.state);
            }
            return parsed.city || location;
        case 'full':
        default:
            var parts = [];
            if (parsed.city)
                parts.push(parsed.city);
            if (parsed.state)
                parts.push(parsed.state);
            if (parsed.country)
                parts.push(parsed.country);
            return parts.length > 0 ? parts.join(', ') : location;
    }
}
/**
 * Get location components for specific use cases
 */
function getLocationComponents(location) {
    var parsed = (0, parsers_1.parseLocation)(location);
    return {
        city: parsed.city,
        state: parsed.state,
        country: parsed.country,
        displayName: formatLocationForDisplay(location, 'full'),
    };
}
/**
 * Format location for different display contexts
 */
function formatLocationForContext(location, context) {
    if (context === void 0) { context = 'profile'; }
    if (!location)
        return '';
    switch (context) {
        case 'card':
            // Shorter format for cards
            return formatLocationForDisplay(location, 'city-state');
        case 'list':
            // Medium format for lists
            return formatLocationForDisplay(location, 'city-state');
        case 'search':
            // Full format for search results
            return formatLocationForDisplay(location, 'full');
        case 'profile':
        default:
            // Full format for profiles
            return formatLocationForDisplay(location, 'full');
    }
}
/**
 * Create a short location display (city only)
 */
function getShortLocation(location) {
    return formatLocationForDisplay(location, 'city-only');
}
/**
 * Create a medium location display (city, state)
 */
function getMediumLocation(location) {
    return formatLocationForDisplay(location, 'city-state');
}
/**
 * Create a full location display (city, state, country)
 */
function getFullLocation(location) {
    return formatLocationForDisplay(location, 'full');
}
/**
 * Validate location format
 */
function validateLocationFormat(location) {
    if (!location)
        return false;
    var trimmed = location.trim();
    if (trimmed.length === 0)
        return false;
    // Basic validation - should have at least one comma or be a single word
    var parts = trimmed.split(',').map(function (part) { return part.trim(); }).filter(Boolean);
    return parts.length > 0;
}
/**
 * Clean and normalize location string
 */
function normalizeLocation(location) {
    if (!location)
        return '';
    return location
        .trim()
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/,\s*,/g, ',') // Remove empty parts between commas
        .replace(/^,+|,+$/g, '') // Remove leading/trailing commas
        .trim();
}
