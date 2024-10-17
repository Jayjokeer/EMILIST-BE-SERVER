import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import Users from "../models/users.model";
import { generateShortUUID } from './utility';
import { Strategy as FacebookStrategy, Profile } from 'passport-facebook';
import { config } from './config';


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
            clientID: config.googleClientId,
            clientSecret: config.googleClientSecret,
            callbackURL: `${config.baseUrl}/api/v1/auth/google/callback`,
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