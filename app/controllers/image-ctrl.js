'use strict';

const ImageStore = require('../utils/image-store');
const Poi = require('../models/poi');
const Image = require('../models/image');
const ObjectId = require('mongodb').ObjectID;

/* Controller for images and gallery of images, this allows a user
 to upload an image, and delete an image */
const Gallery = {

    /*Controller to upload an image */
    uploadFile: {
        handler: async function (request, h)
        {
            try
            {
                const file = request.payload.image;
                const poi_id = request.params.poi;

                if (Object.keys(file).length > 0)
                {
                    await ImageStore.uploadImage(file, poi_id);
                }
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

    // Controller to delete an Image
    deleteImage: {
        handler: async function (request, h)
        {
            try
            {

                const image_id = request.params.img_id;
                await ImageStore.deleteImage(image_id);
                return h.redirect('/home');

            } catch (err)
            {
                return h.view('home', {errors: [{message: err.message}]});
            }
        }
    }

};

module.exports = Gallery;