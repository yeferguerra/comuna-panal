const express = require('express');
const cors = require('cors');
const passport = require('passport');
require('./config/passport');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

// ... existing code ... 