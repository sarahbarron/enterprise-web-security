'use strict';
const User = require('../models/user');
const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');
const Utils = require('../utils/isAdmin');

/*
Accounts Controller contains controllers for signup, login,
register and settings
 */
const Accounts = {

    // First welcome page controller
    index: {
        auth: {
            mode: 'optional'
        },
        handler: function (request, h) {
            let message;
            if (request.auth.isAuthenticated) {
                message = ('Hello ' + request.auth.credentials.profile.displayName);
            } else {
                message = 'Hello Stranger'
            }
            return h.view('main', {
                title: 'Welcome to Apex Gym',
                message: message
            });
        }
    },

    // Users dashboard
    home: {
        auth: 'cookie-auth',
        handler: async function (request, h) {
            const id = request.auth.credentials.id;
            const displayName = request.auth.credentials.profile.displayName;
            const user = await User.findById(id).lean();
            return h.view('home', {
                user: user,
                title: 'Apex Gym Authenticated',
                displayName: displayName
            });
        }
    },


    // Controller to view the signup page
    showSignup: {

        auth: false,
        handler: function (request, h) {
            return h.view('signup', {
                title: 'Sign up for Apex Gym' +
                    ' Classes'
            });
        }
    },

    /* Controller when a users clicks submit on the signup page
        Fields are validated and if everything is ok the user is
        registered and redirected to log in via Oauth authentication 
        if not they are diverted back to the
        signup page with errors reported */

    signup: {
        auth: false,

        // Joi Validation of fields
        validate: {
            payload: {
                gitHubUsername: Joi.string().required(),
                firstName: Joi.string().required(),
                lastName: Joi.string().required(),
                address: Joi.string().required(),
                telephone: Joi.number().required(),
                email: Joi.string()
                    .email()
                    .required(),
                medical: Joi.string(),

            },
            options: {
                abortEarly: false
            },
            failAction: function (request, h, error) {
                return h
                    .view('signup', {
                        title: 'Sign up error',
                        errors: error.details
                    })
                    .takeover()
                    .code(400);
            }
        },

        handler: async function (request, h) {
            try {
                const payload = request.payload;
                let userEmail = await User.findByEmail(payload.email);
                let userName = await User.findByGitHubUsername(payload.gitHubUsername);
                if (userEmail || userName) {
                    const message = 'Someone with this username or email address is already registered';
                    throw Boom.badData(message);
                }

                const newUser = new User({
                    gitHubUsername: payload.gitHubUsername,
                    email: payload.email,
                    firstName: payload.firstName,
                    lastName: payload.lastName,
                    address: payload.address,
                    telephone: payload.telephone,
                    email: payload.email,
                    medical: payload.medical,
                    scope: ['user']
                });

                user = await newUser.save();

                return h.redirect('/login');

            } catch (err) {
                return h.view('signup', {
                    errors: [{
                        message: err.message
                    }]
                });
            }
        }
    },


    // Login using Oauth
    login: {
        auth: 'github-oauth',
        handler: async function (request, h) {
            if (request.auth.isAuthenticated) {
                // Return github username and email
                const username = request.auth.credentials.profile.username;
                const email = request.auth.credentials.profile.email;

                // check to see if the username or the email address is stored in the db
                let findEmail = await User.findByEmail(email);
                let findUsername = await User.findByGitHubUsername(username);

                // If the github email address is private it will return null therefore I
                // do a double check for either the username or email, if both are not in the
                // database redirect the user to the signup page
                if ((!findEmail) && (!findUsername)) {
                    return h.redirect('signup');

                }
                request.cookieAuth.set(request.auth.credentials);
                return h.redirect('/home');
            }
            return h.redirect('login');
        }
    },


    // Controller for logout which deletes any cookies stored
    logout: {
        handler: function (request, h) {
            request.cookieAuth.clear();
            return h.redirect('/');
        }
    },

};

module.exports = Accounts;