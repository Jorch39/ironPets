require('dotenv').config();
const flash = require("connect-flash");
const bodyParser   = require('body-parser');
const cookieParser = require('cookie-parser');
const express      = require('express');
const favicon      = require('serve-favicon');
const hbs          = require('hbs');
const mongoose     = require('mongoose');
const logger       = require('morgan');
const path         = require('path');
const Pet          = require('./models/Pet');
const User          = require('./models/User');
const session      = require("express-session");
const bcrypt       = require("bcrypt");
const passport     = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const FacebookStrategy  =     require('passport-facebook').Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const MongoStore = require("connect-mongo")(session);

mongoose.Promise = Promise;
mongoose
  .connect('mongodb+srv://userAdminJp:ironpets923@cluster0-o48uv.mongodb.net/test?retryWrites=true&w=majority', {useNewUrlParser: true,  useUnifiedTopology: true})
  .then(x => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`)
  })
  .catch(err => {
    console.error('Error connecting to mongo', err)
  });

const app_name = require('./package.json').name;
const debug = require('debug')(`${app_name}:${path.basename(__filename).split('.')[0]}`);

const app = express();

// Middleware Setup
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

//Configure the express session
app.use(session({
  //Meterlo en el .env
  secret: "our-passport-local-strategy-app",
  resave: true,
  saveUninitialized: true
}));

passport.serializeUser((user, cb) => {
  cb(null, user._id);
});

passport.deserializeUser((id, cb) => {
  User.findById(id, (err, user) => {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

//Passport working put
app.use(flash());
passport.use(new LocalStrategy({
  passReqToCallback: true
}, (req, username, password, next) => {
  User.findOne({ username }, (err, user) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(null, false, { message: "Incorrect username" });
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return next(null, false, { message: "Incorrect password" });
    }

    return next(null, user);
  });
}));

// Initialize the session
app.use(passport.initialize());
app.use(passport.session());


// Express View engine setup

app.use(require('node-sass-middleware')({
  src:  path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  sourceMap: true
}));
      

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'images', 'icon.png')));

hbs.registerPartials(__dirname + '/views/partials');

hbs.registerHelper('json', function(context) {
  return JSON.stringify(context);
});


app.locals.title = 'IronPets';

const userRoutes = require('./routes/userRoutes');

const router = require('./routes/auth');

app.use('/', router);

app.use('/userRotes', userRoutes);


module.exports = app;
