const Accounts = require('./app/controllers/accounts-ctrl');
const Admin = require('./app/controllers/admin-ctrl');


module.exports = [
    // Routes for authentication
    {method: 'GET', path: '/', config: Accounts.index},
    {method: 'GET', path: '/signup', config: Accounts.showSignup},
    {method: 'GET', path: '/login', config: Accounts.showLogin},
    {method: 'GET', path: '/logout', config: Accounts.logout},
    {method: 'POST', path: '/signup', config: Accounts.signup},
    {method: 'POST', path: '/login', config: Accounts.login},
    {method: 'GET', path: '/home', config: Accounts.home},



    // routes for settings
    {method: 'GET', path: '/settings', config: Accounts.showSettings},
    {method: 'POST', path: '/settings', config: Accounts.updateSettings},


    // admin
    {method: 'GET',path: '/admin-dashboard', config: Admin.adminDashboard},
    {method: 'GET',path: '/delete-user/{id}', config: Admin.deleteUser},
    {method: 'GET',path: '/view-user/{id}', config: Admin.viewUser},
    {method: 'POST',path: '/view-user/{id}', config: Admin.viewUser},




    // Route to public images and allow them to be viewed by everybody
    {
        method: 'GET',
        path: '/{param*}',
        handler: {
            directory: {
                path: './public'
            }
        },
        options: {auth: false}
    }
];