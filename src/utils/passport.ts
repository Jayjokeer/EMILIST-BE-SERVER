// passport-setup.ts
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import mongoose from 'mongoose';
import Users from "../models/users.model";
import { generateShortUUID } from './utility';

passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser((id: string, done) => {
    Users.findById(id).then((user) => {
        done(null, user);
    });
});

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            callbackURL: "https://emilist-be-server.onrender.com/api/v1/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
                const existingUserByGoogleId = await Users.findOne({ googleId: profile.id });
                if (existingUserByGoogleId) {
                    return done(null, existingUserByGoogleId);
                }

                const existingUserByEmail = await Users.findOne({ email: profile.emails![0].value });
                if (existingUserByEmail) {
                    return done(null, existingUserByEmail);
                }

                const newUser = await new Users({
                    googleId: profile.id,
                    userName: profile.displayName,
                    email: profile.emails![0].value,
                    uniqueId: generateShortUUID(),
                    isEmailVerified: true,
                }).save();

                done(null, newUser);
        }
    )
);

