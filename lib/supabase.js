"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
var supabase_js_1 = require("@supabase/supabase-js");
var config_1 = require("./config");
// Validate environment variables on import
(0, config_1.validateConfig)();
exports.supabase = (0, supabase_js_1.createClient)(config_1.config.supabase.url, config_1.config.supabase.anonKey);
