'use strict';

const Poi = require('../models/poi');
const ImageStore = require('../utils/image-store');
const User = require('../models/user');

/*
Methods needed for Point of Interest
*/

const PoiUtil = {

    /* Method for deleting a POI, by deleting all images first and
     decrementing the number of pois for he user and finally
      deleting  the POI */
    deletePoi: async function (poi_id)
    {
        try
        {
            const poi = await Poi.findById(poi_id).populate('image').populate('user').lean();
            const user_id = poi.user._id;
            const images = poi.image;
            const user = await User.findById(user_id);
            let numOfPoi = user.numOfPoi;
            user.numOfPoi = numOfPoi - 1;
            await user.save();

            if (images.length > 0)
            {
                let i;
                for (i = 0; i < images.length; i++)
                {
                    let image_id = images[i]._id;
                    await ImageStore.deleteImage(image_id);
                }
            }
            await Poi.findByIdAndDelete(poi_id);
        } catch (e)
        {
            console.log("Deletion of Point Of Interest Error: " + e);
        }
    },
};

module.exports = PoiUtil;
