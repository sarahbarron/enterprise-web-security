const PointOfInterest = require('../models/poi');
const User = require('../models/user');
const Image = require('../models/image');
const Utils = require('../utils/isAdmin');
const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');
const ImageStore = require('../utils/image-store');
const Category = require('../models/categories');
const poiUtil = require('../utils/poi-util');

/*
Controller for all Points of Interest. Allows a user
- view a list of their points of interest and filter the list by
categories.
- Add a new point of interest
- Delete a point of interest
- Edit a point of interest
- Upload multiple images to a point of interest
 */
const Poi = {

    /* Controller for a authenticated user or admin
     When a user or admin first registers or logs in they will be
     redirected the home page. This page shows a list of the
     user/admins Points of Interest and allows them to add a new
     POI, delete a POI, or redirect to view a single POI or
     update a POI
     */
    home: {
        handler: async function (request, h)
        {
            try
            {
                let filter = request.payload;


                /* if the user selects to filter by all categories
                set the filter to null so that it will return all
                 categories
                 */
                if (filter != null)
                {
                    if (filter.category === "all")
                    {
                        filter = null;
                    }
                }
                const id = request.auth.credentials.id;
                const user = await User.findById(id).lean();
                let poi_list;
                let defaultcategory;

                /* If a user selects a category to filter by
               return results with POI's in this category
               otherwise return all POI's */
                if (filter != null)
                {
                    const filter_by_category = await Category.findOne({name: filter.category}).lean();
                    poi_list = await PointOfInterest.find({
                        user: user,
                        category: filter_by_category
                    }).populate('user').populate('category').lean().sort('-category');
                    defaultcategory = filter_by_category;
                }
                /* If the user selected all categories or didn't
                select and category return POI's in all categories */
                else
                {
                    poi_list = await PointOfInterest.find({user: user}).populate('user').populate('category').lean().sort('-category');
                    const cat = await Category.find().lean().sort('name');
                    defaultcategory = cat[0];
                }
                const scope = user.scope;
                const isadmin = Utils.isAdmin(scope);
                const category = await Category.find().lean().sort('name');
                return h.view('home',
                    {
                        title: 'Points Of Interest',
                        poi: poi_list,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        isadmin: isadmin,
                        onlyusercanview: true,
                        categories: category,
                        defaultcategory: defaultcategory
                    });
            } catch (err)
            {
                return h.view('home', {errors: [{message: err.message}]});
            }
        }
    },

    // Controller for adding a point of interest for a user/admin
    addpoi: {
        handler: async function (request, h)
        {
            try
            {
                const id = request.auth.credentials.id;
                const user = await User.findById(id);
                const data = request.payload;
                const rawCategory = request.payload.category;
                const category = await Category.findOne({
                    name: rawCategory
                });

                // Create the new POI
                const newPoi = new PointOfInterest({
                    name: data.name,
                    description: data.description,
                    category: category._id,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    user: user._id
                });
                await newPoi.save();

                // //Upload image to cloudinary & save details to DB
                const image_file = data.image;
                await ImageStore.uploadImage(image_file, newPoi._id);

                // Increment num of pois for the user
                let numOfPoi = user.numOfPoi;
                user.numOfPoi = numOfPoi + 1;
                await user.save();

                // redirect to view all POI's
                return h.redirect('/home');
            } catch (err)
            {
                return h.view('home', {errors: [{message: err.message}]});
            }
        },
        payload: {
            multipart: true,
            output: 'data',
            maxBytes: 209715200,
            parse: true
        }
    },

    // Controller to delete a poi,delete all images of that poi first
    deletepoi: {
        handler: async function (request, h)
        {
            try
            {
                const poi_id = request.params.id;
                await poiUtil.deletePoi(poi_id);
                return h.redirect('/home');
            } catch (err)
            {
                return h.view('home', {errors: [{message: err.message}]});
            }
        }
    },
    // show user settings
    showUpdatePoi: {
        handler: async function (request, h)
        {
            try
            {
                const poi_id = request.params.id;
                const poi = await PointOfInterest.findById(poi_id).populate('image').populate('category').lean().sort('-category');
                const user_id = request.auth.credentials.id;
                const user = await User.findById(user_id).lean();
                const scope = user.scope;
                const isadmin = Utils.isAdmin(scope);
                const category = await Category.find().lean();

                return h.view('update-poi', {
                    title: 'Update POI',
                    poi: poi,
                    isadmin: isadmin,
                    categories: category
                });
            } catch (err)
            {
                return h.view('login', {errors: [{message: err.message}]});
            }
        }
    },

    // Controller to update a Point of Interest
    updatePoi: {

        /* Joi validation of fields if any errors return a boom
        message to the user/admin */
        validate: {
            payload: {
                name: Joi.string().required(),
                category: Joi.string().required(),
                description: Joi.string().allow('').allow(null),
                latitude: Joi.number().required(),
                longitude: Joi.number().required(),
            },
            options: {
                abortEarly: false
            },
            failAction: function (request, h, error)
            {
                return h
                    .view('home', {
                        title: 'Failed to update POI ' + error.details,
                        errors: error.details
                    })
                    .takeover()
                    .code(400);
            }
        },

        // If validation passes assign the data for each field to
        // the point of interest
        handler: async function (request, h)
        {
            try
            {
                const userEdit = request.payload;
                const poi_id = request.params.id;
                const poi = await PointOfInterest.findById(poi_id);
                const rawCategory = userEdit.category;
                const category = await Category.findOne({
                    name: rawCategory
                }).lean();

                poi.name = userEdit.name;
                poi.category = category._id;
                poi.description = userEdit.description;
                poi.longitude = userEdit.longitude;
                poi.latitude = userEdit.latitude;
                await poi.save();
                return h.redirect('/home');

            } catch (err)
            {
                return h.view('home', {errors: [{message: err.message}]});
            }
        },
    },

    /*
    Controller to view a single point of interest full details
    View the POI's name, category, latitude and longitude
    location, description and any images a user has uploaded for
    the poi, The user can also add more images to the POI from
    here
    */
    showSinglePoi: {
        handler: async function (request, h)
        {
            try
            {
                const poi_id = request.params.id;
                const poi = await PointOfInterest.findById(poi_id).populate('image').populate('category').lean();
                const user_id = request.auth.credentials.id;
                const user = await User.findById(user_id).lean();
                const scope = user.scope;
                const isadmin = Utils.isAdmin(scope);

                return h.view('view-poi', {
                    title: 'View Single POI',
                    poi: poi,
                    isadmin: isadmin
                });
            } catch (err)
            {
                return h.view('home', {errors: [{message: err.message}]});
            }
        }
    },
};

module.exports = Poi;