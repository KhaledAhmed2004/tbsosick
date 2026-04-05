"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const config_1 = __importDefault(require("../../../../config"));
const user_model_1 = require("../../user/user.model");
const user_interface_1 = require("../../user/user.interface");
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: config_1.default.google_client_id,
    clientSecret: config_1.default.google_client_secret,
    callbackURL: config_1.default.google_redirect_uri,
    passReqToCallback: true,
}, (req, _accessToken, _refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const email = (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value;
        if (!email) {
            console.error('❌ Google profile missing email:', profile);
            return done(new Error('No email found in Google profile'));
        }
        // Read role from frontend
        const frontendRole = req.query.role || 'user';
        // Find user
        let user = yield user_model_1.User.findOne({ email });
        // Check if user exists
        if (user) {
            // Blocked/Deleted check
            if (user.status === user_interface_1.USER_STATUS.RESTRICTED ||
                user.status === user_interface_1.USER_STATUS.DELETE) {
                console.warn(`🚫 Restricted/Deleted user tried to login: ${email}`);
                return done(new Error('Account is deactivated.'));
            }
            // Link Google ID if not already linked
            if (!user.googleId) {
                try {
                    user.googleId = profile.id;
                    yield user.save();
                    console.log(`🔗 Linked Google ID for existing user: ${email}`);
                }
                catch (err) {
                    console.error('❌ Failed to link Google ID for existing user:', err);
                    return done(new Error('Failed to link Google account'));
                }
            }
            return done(null, user);
        }
        // Create new user
        try {
            user = yield user_model_1.User.create({
                name: profile.displayName,
                email,
                role: frontendRole,
                verified: true,
                googleId: profile.id,
            });
            console.log(`✅ New user created via Google: ${email}, role: ${frontendRole}`);
            return done(null, user);
        }
        catch (err) {
            console.error('❌ Failed to create new user:', err);
            return done(new Error('Failed to create new user'));
        }
    }
    catch (err) {
        console.error('❌ Google OAuth error:', err);
        return done(err);
    }
})));
exports.default = passport_1.default;
