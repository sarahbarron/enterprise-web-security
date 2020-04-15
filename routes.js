const Poi = require('./app/controllers/poi-ctrl');
const Accounts = require('./app/controllers/accounts-ctrl');
const Admin = require('./app/controllers/admin-ctrl');
const Image = require('./app/controllers/image-ctrl');
const Category = require('./app/controllers/categories-ctrl');

module.exports = [
    // Routes for authentication
    {method: 'GET', path: '/', config: Accounts.index},
    {method: 'GET', path: '/signup', config: Accounts.showSignup},
    {method: 'GET', path: '/login', config: Accounts.showLogin},
    {method: 'GET', path: '/logout', config: Accounts.logout},
    {method: 'POST', path: '/signup', config: Accounts.signup},
    {method: 'POST', path: '/login', config: Accounts.login},

    // Routes for points of interest
    {method: 'GET', path: '/home', config: Poi.home},
    {method: 'POST', path: '/addpoi', config: Poi.addpoi},
    {method: 'GET', path: '/delete-poi/{id}', config: Poi.deletepoi},
    {method: 'GET', path: '/update-poi/{id}', config: Poi.showUpdatePoi},
    {method: 'POST', path: '/update-poi/{id}', config: Poi.updatePoi},
    {method: 'GET', path: '/view-poi/{id}', config: Poi.showSinglePoi},

    // routes for settings
    {method: 'GET', path: '/settings', config: Accounts.showSettings},
    {method: 'POST', path: '/settings', config: Accounts.updateSettings},


    // admin
    {method: 'GET',path: '/admin-dashboard', config: Admin.adminDashboard},
    {method: 'GET',path: '/delete-user/{id}', config: Admin.deleteUser},
    {method: 'GET',path: '/view-user/{id}', config: Admin.viewUser},
    {method: 'POST',path: '/view-user/{id}', config: Admin.viewUser},

    // Images
    {method: 'POST',path: '/addimage/{poi}', config: Image.uploadFile},
    {method: 'GET',path: '/view-poi/delete-image/{img_id}',config: Image.deleteImage},
    {method: 'GET',path: '/update-poi/delete-image/{img_id}',config: Image.deleteImage},

    // Category
    {method: 'GET', path: '/categories', config: Category.viewCategories},
    {method: 'POST', path: '/filter-category', config: Category.viewCategories},
    {method: 'POST', path: '/add-category', config: Category.addCategory},
    {method: 'POST',path: '/delete-category',config: Category.deleteCategory},
    {method: 'POST', path: '/home', config: Poi.home},

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