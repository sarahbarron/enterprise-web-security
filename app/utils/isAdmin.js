'use strict';

const isAdmin = {
    /* Method to check if the user has admin scope or not and
    returns a boolean */
    isAdmin(scope)
    {
        if (scope == 'admin')
        {
            return true;
        }
        return false;
    }
};

module.exports = isAdmin;