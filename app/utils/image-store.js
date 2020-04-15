'use strict';
const cloudinary = require('cloudinary');
const fs = require('fs');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);
const ObjectId = require('mongodb').ObjectID;
const Poi = require('../models/poi');
const Image = require('../models/image');

/*
Methods needed by to upload and delete images
 */
const ImageStore = {

    //Configuration of cloudinary
    configure: function ()
    {
        try
        {
            const credentials = {
                cloud_name: process.env.CLOUDINARY_NAME,
                api_key: process.env.CLOUDINARY_KEY,
                api_secret: process.env.CLOUDINARY_SECRET
            };
            cloudinary.config(credentials);
        } catch (e)
        {
            Console.log("Configuration of cloudinary errors: " + e);
        }
    },

    // Method to return all images
    getAllImages: async function ()
    {
        try
        {
            const result = await cloudinary.v2.api.resources();
            return result.resources;
        } catch (e)
        {
            Console.log("Get all images error: " + e);
        }
    },

    // Method to upload an image to cloudinary and save to the DB
    uploadImage: async function (imagefile, poi_id)
    {
        try
        {
            const poi = await Poi.findById(poi_id);
            let newImage;
            /* Check to see if there is an image and if there is
            upload it to cloudinary and create a new image in the
            database */
            if (Object.keys(imagefile).length > 0)
            {
                await writeFile('./public/temp.img', imagefile);
                const uploaded_image = await cloudinary.uploader.upload('./public/temp.img');
                const public_id = uploaded_image.public_id;
                const url = uploaded_image.url;
                newImage = new Image({
                    public_id: public_id,
                    url: url,
                    poi: poi_id
                });
                await newImage.save();
            }
            /* Push a reference to the image id to its point of
            interest image array*/
            poi.image.push(ObjectId(newImage._id));
            poi.save();
        } catch (e)
        {
            Console.log("Uploading of Image error: " + e);
        }
    },

    // Method to delete an image
    deleteImage: async function (image_id)
    {
        try
        {
            const image_obj = await Image.findById(image_id).populate('poi').lean();
            const image_public_id = image_obj.public_id;
            const poi_id = image_obj.poi._id.toString();

            // Delete the objectId reference from the POI schema
            await Poi.findByIdAndUpdate(
                {"_id": poi_id}, // poi to delete from
                {
                    $pull: {image: {$in: [image_obj]}}
                },
                {safe: true},
                function (err)
                {
                    if (err)
                    {
                        console.log(err);
                    }
                });

            // Delete image document from MongoDB
            await Image.findByIdAndDelete(image_id);

            // delete the image from cloudinary
            await cloudinary.v2.uploader.destroy(image_public_id, {});
        } catch (e)
        {
            console.log("Delete Image Error: " + e);
        }
    },

};

module.exports = ImageStore;