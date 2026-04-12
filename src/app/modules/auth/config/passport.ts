import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import config from '../../../../config';
import { User } from '../../user/user.model';
import { USER_ROLES } from '../../../../enums/user';
import { USER_STATUS } from '../../user/user.interface';

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google_client_id as string,
      clientSecret: config.google_client_secret as string,
      callbackURL: config.google_redirect_uri as string,
      passReqToCallback: true,
    },
    async (req, _accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          console.error('❌ Google profile missing email:', profile);
          return done(new Error('No email found in Google profile'));
        }

        // Read role from frontend
        const frontendRole = (req.query.role as USER_ROLES) || 'user';

        // Find user
        let user = await User.findOne({ email });

        // Check if user exists
        if (user) {
          // Blocked/Deleted check
          if (
            user.status === USER_STATUS.RESTRICTED ||
            user.status === USER_STATUS.DELETED
          ) {
            console.warn(`🚫 Restricted/Deleted user tried to login: ${email}`);
            return done(new Error('Account is deactivated.'));
          }

          // Link Google ID if not already linked
          if (!user.googleId) {
            try {
              user.googleId = profile.id;
              await user.save();
              console.log(`🔗 Linked Google ID for existing user: ${email}`);
            } catch (err) {
              console.error(
                '❌ Failed to link Google ID for existing user:',
                err
              );
              return done(new Error('Failed to link Google account'));
            }
          }

          return done(null, user);
        }

        // Create new user
        try {
          user = await User.create({
            name: profile.displayName,
            email,
            role: frontendRole,
            verified: true,
            googleId: profile.id,
          });
          console.log(
            `✅ New user created via Google: ${email}, role: ${frontendRole}`
          );
          return done(null, user);
        } catch (err) {
          console.error('❌ Failed to create new user:', err);
          return done(new Error('Failed to create new user'));
        }
      } catch (err) {
        console.error('❌ Google OAuth error:', err);
        return done(err);
      }
    }
  )
);

export default passport;
