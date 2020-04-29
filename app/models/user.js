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
    gitHubUsername: String,
    email: String,
    firstName: String,
    lastName: String,
    address: String,
    telephone: Number,
    medical: String,
    scope: Array
});

// Check if the email address exists during authentication
userSchema.statics.findByEmail = function (email) {
    return this.findOne({
        email: email
    });
};


// Check if the username address exists during authentication
userSchema.statics.findByGitHubUsername = function (gitHubUsername) {
    return this.findOne({
        gitHubUsername: gitHubUsername
    });
};


// Compare passwords to check they match during authentication
userSchema.methods.comparePassword = async function (candidatePassword) {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
};

module.exports = Mongoose.model('User', userSchema);