'use strict';

/*
Image Schema stores an images public id, url and a reference to
the Point of Interest it is associated with
 */
const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const ImageSchema = new Schema({

    public_id: String,
    url: String,
    poi: {
        type: Schema.Types.ObjectId,
        ref: 'Poi'
    },
});

module.exports = Mongoose.model('Image', ImageSchema);