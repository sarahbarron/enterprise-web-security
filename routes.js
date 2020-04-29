const Accounts = require('./app/controllers/accounts-ctrl');



module.exports = [
    // Routes for authentication
    {
        method: 'GET',
        path: '/',
        config: Accounts.index
    },
    {
        method: 'GET',
        path: '/signup',
        config: Accounts.showSignup
    },
    {
        method: 'GET',
        path: '/login',
        config: Accounts.login
    },

    {
        method: 'GET',
        path: '/logout',
        config: Accounts.logout
    },
    {
        method: 'POST',
        path: '/signup',
        config: Accounts.signup
    },

    {
        method: 'GET',
        path: '/home',
        config: Accounts.home
    },


    // Route to public images and allow them to be viewed by everybody
    {
        method: 'GET',
        path: '/{param*}',
        handler: {
            directory: {
                path: './public'
            }
        },
        options: {
            auth: false
        }
    }
];