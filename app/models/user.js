'use strict';

/*
User Schema to store a users name,email,password, number of poi's
 and scope (admin or user)
 */
const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
const Boom = require('@hapi/boom');
const bcrypt = require('bcrypt')
const userSchema = new Schema({
    firstName: String,
    lastName: String,
    address: String,
    telephone: Number,
    email: String,
    medical: String,
    password: String,
    scope: Array
});

// Check if the email address exists during authentication
userSchema.statics.findByEmail = function (email) {
    return this.findOne({
        email: email
    });
};


// Compare passwords to check they match during authentication
userSchema.methods.comparePassword = async function (candidatePassword) {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
};

module.exports = Mongoose.model('User', userSchema);