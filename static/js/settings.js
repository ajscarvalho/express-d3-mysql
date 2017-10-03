"use strict";

var Settings = {};

var defaultHeaders = new Headers();
defaultHeaders.append("X-AJAX", "json");

Settings.forms = {
    get: { 
        method: 'GET',
        headers: defaultHeaders,
        mode: 'cors',
        credentials: 'include', // include cookies
        cache: 'default' 
    },
    post: { 
        method: 'POST',
        headers: defaultHeaders,
        mode: 'cors',
        credentials: 'include', // include cookies 
        cache: 'default' 
    }
};
