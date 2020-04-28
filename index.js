'use strict';

// Only need for local development
const dotenv = require('dotenv')

const Hapi = require('@hapi/hapi');

const fs = require('fs');

const server = Hapi.server({
    // port: process.env.PORT || 3000,
    port: 3443,
    tls: {
        key: fs.readFileSync('keys/private/webserver.key'),
        cert: fs.readFileSync('keys/webserver.crt')
    }
});

// db.js creates a connection to the mongo database
require('./app/models/db');
server.validator(require('@hapi/joi'));


// Only need for local development
// if the .env file cant be found handle the error
const result = dotenv.config();
if (result.error) {
    console.log(result.error.message);
    process.exit(1);
}

async function init() {
    // Register plugins
    await server.register(require('@hapi/inert'));
    await server.register(require('@hapi/vision'));
    await server.register(require('@hapi/cookie'));


    // setup the paths to views, layouts and partials &
    // set the templating engine to handlebars
    server.views({
        engines: {
            hbs: require('handlebars'),
        },
        relativeTo: __dirname,
        path: './app/views',
        layoutPath: './app/views/layouts',
        partialsPath: './app/views/partials',
        layout: true,
        isCached: false,
    });


    // Initialize the cookie plugin
    server.auth.strategy('session', 'cookie', {
        cookie: {
            name: 'cookie',
            password: process.env.COOKIE_PASSWORD,
            isSecure: false
        }
    });

    // Set up the session as the default strategy for all routes
    server.auth.default('session');

    // Initialize routes
    server.route(require('./routes'));

    // Start the server
    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
}

// Handle errors
process.on('unhandledRejection', err => {
    console.log(err);
    process.exit(1);
});

init();