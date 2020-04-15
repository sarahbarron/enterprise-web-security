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
        auth: false,
        handler: function (request, h)
        {
            return h.view('main', {title: 'Welcome to Points of Interest'});
        }
    },

    // Controller to view the signup page
    showSignup: {

        auth: false,
        handler: function (request, h)
        {
            return h.view('signup', {title: 'Sign up for Points of Interest'});
        }
    },

    /* Controller when a users clicks submit on the signup page
    Fields are validated and if everything is ok the user is
    registered and logged in if not they are diverted back to the
    signup page with errors reported */

    signup: {
        auth: false,

        // Joi Validation of fields
        validate: {
            payload: {
                firstName: Joi.string().required(),
                lastName: Joi.string().required(),
                email: Joi.string()
                    .email()
                    .required(),
                password: Joi.string().required(),
            },
            options: {
                abortEarly: false
            },
            failAction: function (request, h, error)
            {
                return h
                    .view('signup', {
                        title: 'Sign up error',
                        errors: error.details
                    })
                    .takeover()
                    .code(400);
            }
        },

        handler: async function (request, h)
        {
            try
            {
                const payload = request.payload;
                let user = await User.findByEmail(payload.email);

                if (user)
                {
                    const message = 'Email address is already registered';
                    throw Boom.badData(message);
                }

                const newUser = new User({
                    firstName: payload.firstName,
                    lastName: payload.lastName,
                    email: payload.email,
                    password: payload.password,
                    numOfPoi: 0,
                    scope: ['user']
                });

                user = await newUser.save();

                /* Cookie with user id an scope created (scope is
                 either admin or user */
                request.cookieAuth.set({
                    id: user.id,
                    scope: user.scope
                });

                return h.redirect('/home');

            } catch (err)
            {
                return h.view('signup', {errors: [{message: err.message}]});
            }
        }
    },

    //
    showLogin: {
        auth: false,
        handler: function (request, h)
        {
            return h.view('login', {title: 'Login to Points of Interest'});
        }
    },

    /* Controller for when a user hits submit to login
    If successful the user is redirected to the home page. If not
     they are redirected to the login page with errors
     */

    login: {

        auth: false,

        /* Joi validation of fields I any errors they are return
        for the user to view */
        validate: {
            payload: {
                email: Joi.string()
                    .email()
                    .required(),
                password: Joi.string().required()
            },
            options: {
                abortEarly: false
            },
            failAction: function (request, h, error)
            {
                return h
                    .view('login', {
                        title: 'Sign in error',
                        errors: error.details
                    })
                    .takeover()
                    .code(400);
            }
        },

        handler: async function (request, h)
        {
            const {email, password} = request.payload;
            try
            {
                let user = await User.findByEmail(email);
                if (!user)
                {
                    const message = 'Email address is not registered';
                    throw Boom.unauthorized(message);
                }
                user.comparePassword(password);

                /* Cookies set with user id and scope (either user
                or admin) */
                request.cookieAuth.set({
                    id: user.id,
                    scope: user.scope
                });

                return h.redirect('/home');

            } catch (err)
            {
                return h.view('login', {errors: [{message: err.message}]});
            }
        }
    },

    // Controller for logout which deletes any cookies stored
    logout: {
        handler: function (request, h)
        {
            request.cookieAuth.clear();
            return h.redirect('/');
        }
    },

    // shows your settings details
    showSettings: {

        handler: async function (request, h)
        {
            try
            {
                const id = request.auth.credentials.id;
                const user = await User.findById(id).lean();
                const scope = user.scope;
                const isadmin = Utils.isAdmin(scope);

                return h.view('settings', {
                    title: 'Donation Settings',
                    user: user,
                    isadmin: isadmin
                });
            } catch (err)
            {
                return h.view('login', {errors: [{message: err.message}]});
            }
        }
    },

    // Controller for when a user updates their settings
    updateSettings: {
        // Joi validation of the fields returns boom error if it fails
        validate: {
            payload: {
                firstName: Joi.string().required(),
                lastName: Joi.string().required(),
                email: Joi.string()
                    .email()
                    .required(),
                password: Joi.string().required()
            },
            options: {
                abortEarly: false
            },
            failAction: function (request, h, error)
            {
                return h
                    .view('settings', {
                        title: 'Sign up error',
                        errors: error.details
                    })
                    .takeover()
                    .code(400);
            }
        },

        /* retrieve all the data from the payload and assin it to
        the correct field in the database */
        handler: async function (request, h)
        {
            try
            {
                const userEdit = request.payload;
                const id = request.auth.credentials.id;
                const user = await User.findById(id);
                user.firstName = userEdit.firstName;
                user.lastName = userEdit.lastName;
                user.email = userEdit.email;
                user.password = userEdit.password;
                await user.save();
                return h.redirect('/settings');

            } catch (err)
            {
                return h.view('main', {errors: [{message: err.message}]});

            }
        }
    },
};

module.exports = Accounts;