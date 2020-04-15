'use strict';

/*
Categories strategy stores the name of a category
 */
const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const categorySchema = Schema({
    name: String
});

module.exports = Mongoose.model('Category', categorySchema);