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



var HttpRequest = function(method, baseURL, callback, errorHandler) {
    this.method = method;
    this.baseURL = baseURL;
    this.callback = callback;
    this.errorHandler = errorHandler || this.log_error;
}

    
/** supports get and post, for now! */
HttpRequest.prototype.send = function(fields) { return this.send_form_fields(fields); };

HttpRequest.prototype.send_form_fields = function(fields) 
{
    fields = fields || []
    let requester = this.method.toLowerCase() + '_request';
    return this[requester](fields);
};


HttpRequest.prototype.get_request = function(fields)
{
    let queryString = '';
    for (let field of fields)
        queryString = this.build_query_string(queryString, field);

    var options = Object.create(Settings.forms.get);

    return this.exec_fetch(this.baseURL + queryString, options);
};

HttpRequest.prototype.build_query_string = function(data, elemId)
{
    var el = document.getElementById(elemId);
    if (!el) this.trigger_silent_error("Input Element with id: " + elemId + " not found");

    let paramQS = el.name + "=" + encodeURIComponent(el.value)
    if (!data) return '?' + paramQS
    
    return data + '&' + paramQS;
};

//application/x-www-form-urlencoded;charset=UTF-8

HttpRequest.prototype.post_request = function(fields)
{
    let data = new URLSearchParams();
    for (let field of fields) {
        let el = document.getElementById(field);
        if (!el) this.trigger_silent_error("Input Element with id: " + field + " not found");
        data.append(el.name, el.value);
    }

    var options = Object.create(Settings.forms.post);
    options.body = data;

    return this.exec_fetch(this.baseURL, options);
};

HttpRequest.prototype.post_file_request = function(fields)
{
    let data = new FormData();
    for (let field of fields)
        data = this.add_form_data(data, field, filename);

    var options = Object.create(Settings.forms.post);
    options.body = data;

    return this.exec_fetch(this.baseURL, options);
};

/** for POST file requests */
HttpRequest.prototype.add_form_data = function(data, elemId)
{
    var el = document.getElementById(elemId);
    if (!el) this.trigger_silent_error("Input Element with id: " + elemId + " not found");

    data.append(el.name, el.value);
    return data;
};

HttpRequest.prototype.exec_fetch = function(url, options)
{
    //create ajax request
    fetch(url, options).
        then(this.processJsonResponse).
        then(this.callback).
        catch(this.errorHandler)
};

HttpRequest.prototype.processJsonResponse = function(response) { return response.json() };

HttpRequest.prototype.log_error = function(a, b, c, d) { console.error('network request error', a, b, c, d); };

HttpRequest.prototype.trigger_silent_error = function(logMessage)
{
    console.error(logMessage);
    throw Error("Request Failed");
};


