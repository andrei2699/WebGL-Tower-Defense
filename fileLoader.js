// Not working yet

var loadTextResource = function (url, callback) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.onload = function () {
        if (request.status < 200 || request.status > 299) {
            callback('Error: HTTP Status' + request.status + ' on resource ' + url);
        } else {
            callback(null, request.responseText);
        }
    };

    request.send();
};

var loadImage = function (url, callback) {
    var image = new Image();
    image.onload = function () {
        callback(null, image);
    };
    image.src = url;
}