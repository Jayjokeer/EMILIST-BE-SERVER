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
const users_model_1 = __importDefault(require("../models/users.model"));
const utility_1 = require("./utility");
// import { Strategy as FacebookStrategy, Profile } from 'passport-facebook';
const config_1 = require("./config");
// passport.serializeUser((user: any, done) => {
//     done(null, user.id);
// });
// passport.deserializeUser((id: string, done) => {
//     Users.findById(id).then((user) => {
//         done(null, user);
//     });
// });
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: config_1.config.googleClientId,
    clientSecret: config_1.config.googleClientSecret,
    callbackURL: `${config_1.config.baseUrl}/api/v1/auth/google/callback`,
}, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    const existingUserByGoogleId = yield users_model_1.default.findOne({ googleId: profile.id });
    console.log(existingUserByGoogleId);
    if (existingUserByGoogleId) {
        existingUserByGoogleId.accessToken = accessToken;
        yield existingUserByGoogleId.save();
        return done(null, existingUserByGoogleId);
    }
    const existingUserByEmail = yield users_model_1.default.findOne({ email: profile.emails[0].value });
    console.log(existingUserByEmail);
    if (existingUserByEmail) {
        existingUserByEmail.accessToken = accessToken;
        yield existingUserByEmail.save();
        return done(null, existingUserByEmail);
    }
    const newUser = yield new users_model_1.default({
        googleId: profile.id,
        userName: profile.displayName,
        email: profile.emails[0].value,
        uniqueId: (0, utility_1.generateShortUUID)(),
        isEmailVerified: true,
        accessToken: accessToken
    }).save();
    return done(null, newUser);
})));
// passport.serializeUser((user: Express.User, done) => {
//   done(null, user);
// });
// passport.deserializeUser((user: Express.User, done) => {
//   done(null, user);
// });
// passport.use(new FacebookStrategy({
//   clientID: config.fbClientId ,
//   clientSecret: config.fbClientSecret,
//   callbackURL: '/auth/facebook/callback',
//   profileFields: ['id', 'emails', 'name'],
// },
// (accessToken: string, refreshToken: string, profile: Profile, done: (error: any, user?: Express.User | false) => void) => {
//   console.log(profile);
//   return done(null, profile);
// }));
