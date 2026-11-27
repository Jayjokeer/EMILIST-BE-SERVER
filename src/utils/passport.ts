import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import Users from "../models/users.model";
import { generateShortUUID } from './utility';
// import { Strategy as FacebookStrategy, Profile } from 'passport-facebook';
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
            state: true,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const googleEmail = profile.emails?.[0]?.value?.toLowerCase();
                if (!googleEmail) return done(new Error('Google account did not provide an email address'));

                const existingUserByGoogleId = await Users.findOne({ googleId: profile.id });
                if (existingUserByGoogleId) {
                    existingUserByGoogleId.accessToken = accessToken;
                    existingUserByGoogleId.isEmailVerified = true;
                   await existingUserByGoogleId.save()
                    return done(null, existingUserByGoogleId);
                }

                const existingUserByEmail = await Users.findOne({ email: googleEmail });
                if (existingUserByEmail) {
                    existingUserByEmail.googleId = profile.id;
                    existingUserByEmail.accessToken = accessToken;
                    existingUserByEmail.isEmailVerified = true;
                    await existingUserByEmail.save();
                    return done(null, existingUserByEmail);
                }

                const newUser = await new Users({
                    googleId: profile.id,
                    userName: profile.displayName,
                    email: googleEmail,
                    uniqueId: generateShortUUID(),
                    isEmailVerified: true,
                    accessToken: accessToken
                }).save();
               return done(null, newUser);
            } catch (error) {
                return done(error as Error);
            }
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
