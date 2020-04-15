'use strict';
const User = require('../models/user');
const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');
const Utils = require('../utils/isAdmin');
const PointOfInterest = require('../models/poi');
const PoiUtils = require('../utils/poi-util');
const Category = require('../models/categories');

/*
The Admin controller controls for user Users - the Admin can view
a list of users, view a single user, delete the user, view a list
of a users Points of Interest, and view users single points of
interest full details.
 */

const Admin = {

    // Controller to view a list of all users
    adminDashboard: {
        auth: {scope: 'admin'},
        handler: async function (request, h)
        {
            try
            {
                const id = request.auth.credentials.id;
                const user = await User.findById(id).lean();
                const allusers = await User.find({scope: 'user'}).lean().sort('lastName');
                const scope = user.scope;
                /* Method to determine if the person logged in is
                 a user or administrator */
                const isadmin = Utils.isAdmin(scope);
                return h.view('admin-dashboard',
                    {
                        title: 'All Users',
                        users: allusers,
                        isadmin: isadmin,
                    });
            } catch (err)
            {
                return h.view('login', {errors: [{message: err.message}]});
            }
        }
    },

    // Controller for deleting a user
    deleteUser: {
        auth: {scope: ['admin']},
        handler: async function (request, h)
        {
            try
            {
                const id = request.params.id;
                const user = await User.findById(id).lean();
                const pois = await PointOfInterest.find({user: user});
                /* If the user has points of interest delete each
                 of them and their containing images   */
                if (pois.length > 0)
                {
                    let i;
                    for (i = 0; pois.length > i; i++)
                    {
                        let poi_id = pois[i]._id;
                        await PoiUtils.deletePoi(poi_id);
                    }
                }
                await User.findByIdAndDelete(id);
                return h.redirect('/admin-dashboard');
            } catch (err)
            {
                return h.view('admin-dashboard', {errors: [{message: err.message}]});
            }
        }
    },

    /* Controller for an admin to view a single user this shows
     all of the users points of interest in a list */
    viewUser: {
        auth: {scope: 'admin'},
        handler: async function (request, h)
        {
            try
            {
                const id = request.params.id;
                const user = await User.findById(id);
                let filter = request.payload;
                let poi_list;
                let defaultcategory;
                /* if admin chooses to filter by category
                  check what filter they want to use and return
                  a list based on those results set the
                  default category to the one the user has
                  selected or to the 1st category in the
                  list if none or all categories was selected*/
                if (filter != null)
                {
                    if (filter.category === "all")
                    {
                        filter = null;
                    } else
                    {
                        const filter_by_category = await Category.findOne({name: filter.category}).lean();
                        poi_list = await PointOfInterest.find({
                            user: user,
                            category: filter_by_category
                        }).populate('user').populate('category').lean().sort('-category');
                        defaultcategory = filter_by_category;
                    }
                }
                if (filter == null)
                {
                    const filter_by_category = await Category.find().lean().sort('name');
                    poi_list = await PointOfInterest.find({
                        user: user,
                        category: filter_by_category
                    }).populate('user').populate('category').lean().sort('-category');
                    if (filter_by_category.length > 0)
                    {
                        defaultcategory = filter_by_category[0];
                    }
                }

                const categories = await Category.find().lean().sort('name');
                return h.view('user-pois', {
                    title: "View User",
                    userid: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    categories: categories,
                    poi: poi_list,
                    defaultcategory: defaultcategory,
                    onlyusercanview: false,
                    isadmin: true
                });
            } catch (err)
            {
                return h.view('admin-dashboard', {errors: [{message: err.message}]});
            }
        }
    }
};
module.exports = Admin;