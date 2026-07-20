const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const getGoogleCallbackUrl = () => {
  if (process.env.GOOGLE_CALLBACK_URL && process.env.GOOGLE_CALLBACK_URL.trim()) {
    return process.env.GOOGLE_CALLBACK_URL.trim();
  }

  if (process.env.NODE_ENV === 'production') {
    return 'https://ecochat-rec4.onrender.com/api/auth/google/callback';
  }

  return 'http://localhost:5000/api/auth/google/callback';
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
      callbackURL: getGoogleCallbackUrl(),
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (!email) {
          return done(new Error('No email found in Google profile'), null);
        }

        // 1. Check if user already exists with Google ID
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          return done(null, user);
        }

        // 2. Check if user exists with the same email (but maybe signed in differently or not linked yet)
        user = await User.findOne({ email });
        if (user) {
          user.googleId = profile.id;
          if (!user.profilePicture) {
            user.profilePicture = profile.photos && profile.photos[0] ? profile.photos[0].value : '';
          }
          await user.save();
          return done(null, user);
        }

        // 3. Create a new user (Note: username is NOT set yet. User must onboard on client side)
        user = new User({
          name: profile.displayName || 'Google User',
          email: email,
          googleId: profile.id,
          profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
          onlineStatus: 'offline',
        });
        await user.save();
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// We will use JWT authentication so serialize/deserialize are just minimal stubs
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
