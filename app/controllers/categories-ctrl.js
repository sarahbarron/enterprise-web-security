'use strict';

const CategoryModel = require('../models/categories');
const Poi = require('../models/poi');
const PoiUtils = require('../utils/poi-util');
const User = require('../models/user');
const Utils = require('../utils/isAdmin')
/*
Admin controls for Categories. Admin can add a category, delete a
category and view points of interest in each category using a category
filter
*/
const Category = {

    /* Controller for the main category page where you can view a
    category */
    viewCategories: {
        auth: {scope: ['admin']},
        handler: async function (request, h)
        {
            try
            {

                const id = request.auth.credentials.id;
                const user = await User.findById(id).lean();
                const scope = user.scope;
                const isadmin = Utils.isAdmin(scope);

                let filter = request.payload;
                let poi_list;
                let defaultcategory;

                if (filter != null)
                {
                    if (filter.category === "all")
                    {
                        filter = null;
                    } else
                    {
                        const filter_by_category = await CategoryModel.findOne({name: filter.category}).lean();
                        poi_list = await Poi.find({category: filter_by_category}).populate('user').populate('category').lean().sort('-category');
                        defaultcategory = filter_by_category;
                    }
                }
                if (filter == null)
                {
                    const filter_by_category = await CategoryModel.find().lean().sort('name');
                    poi_list = await Poi.find({category: filter_by_category}).populate('user').populate('category').lean().sort('-category');
                    if (filter_by_category.length > 0)
                    {
                        defaultcategory = filter_by_category[0];
                    }
                }

                const categories = await CategoryModel.find().lean().sort('name');
                return h.view('categories', {
                    categories: categories,
                    poi: poi_list,
                    defaultcategory: defaultcategory,
                    onlyusercanview: false,
                    isadmin: isadmin
                });
            } catch (err)
            {
                return h.view('categories', {errors: [{message: err.message}]});
            }
        }
    },

    // Controller for adding a category
    addCategory: {
        auth: {scope: ['admin']},
        handler: async function (request, h)
        {
            try
            {
                const data = request.payload;
                const name = data.name.toUpperCase();

                /* Checks to see if there is a category already
                setup with the same name */
                const all_ready_created_category = await CategoryModel.findOne({
                    name: name,
                }).collation({locale: 'en', caseLevel: false});

                /* if there isn't an existing category with the
                same name create a new category */
                if (all_ready_created_category == null)
                {
                    const newCategory = new CategoryModel({
                        name: name
                    });
                    await newCategory.save();
                }
                return h.redirect('/categories');

            } catch (err)
            {
                return h.view('categories', {errors: [{message: err.message}]});
            }
        }
    },

    // Delete a category controller
    deleteCategory: {
        auth: {scope: ['admin']},
        handler: async function (request, h)
        {
            try
            {
                const data = request.payload;
                let categories;

                /* If the user has chosen to delete all categories
                return a all categories */
                if (data.category === 'all')
                {
                    categories = await CategoryModel.find().lean();
                }

                // otherwise only return the single category selected
                else
                {
                    categories = await CategoryModel.find({name: data.category}).lean();
                }

                /* loop through the selected categories and for each
                category delete any associated points of interest and
                their images*/
                let num;
                for (num = 0; num < categories.length; num++)
                {
                    const category_id = categories[num]._id;
                    const pois = await Poi.find({category: category_id});
                    if (pois.length > 0)
                    {
                        let i;
                        for (i = 0; i < pois.length; i++)
                        {
                            let poi_id = pois[i];
                            PoiUtils.deletePoi(poi_id);
                        }
                    }
                }

                /* If the user has chosen to delete all categories
                find and delete all categories*/
                if (data.category === 'all')
                {
                    await CategoryModel.deleteMany();
                }
                // Otherwise only delete the category selected
                else
                {
                    await CategoryModel.findOneAndDelete({name: data.category});
                }
                return h.redirect('/categories');

            } catch (err)
            {
                return h.view('categories', {errors: [{message: err.message}]});
            }
        }
    }
};

module.exports = Category;