
var codesUS = require('./codes'),
    states = require('./states'),
    codesCanada = require('./codesCanada'),
    geohash = require('geohash-area');

var codes = {};
codes.codes = Object.assign({}, codesUS.codes, codesCanada.codes);
codes.stateMap = Object.assign({}, codesUS.stateMap, codesCanada.stateMap);

exports.states = states;
exports.codes = codes.codes;

var lookup = function(zip) {
    if (zip != null && zip != undefined && typeof zip === "string" && isNaN(zip.charAt(0))) {
      return codes.codes[zip.slice(0, 3)];
    }
    return codes.codes[zip];
};

exports.lookup = lookup;

var byName = function(city, state) {
    city = city.toUpperCase();

    var ret = [];
    
    byState(state).forEach(function(item) {
        if (city === item.city.toUpperCase()) {
            ret.push(item);
        }
    });

    return ret;
};

exports.lookupByName = byName;

var byState = function(state) {
    var normalized = states.normalize(state.toUpperCase()),
        ret = [],
        mapping = codes.stateMap[normalized] || codes.stateMap[state];

    if (!mapping) {
        return ret;
    }

    mapping.forEach(function(zip) {
        ret.push(codes.codes[zip]);
    });

    return ret;
};

exports.lookupByState = byState;

var dist = function(zipA, zipB) {
    zipA = lookup(zipA);
    zipB = lookup(zipB);
    if (!zipA || !zipB) {
        return null;
    }
    
    var zipALatitudeRadians = deg2rad(zipA.latitude);
    var zipBLatitudeRadians = deg2rad(zipB.latitude);

    var distance = Math.sin(zipALatitudeRadians) 
                * Math.sin(zipBLatitudeRadians) 
                + Math.cos(zipALatitudeRadians) 
                * Math.cos(zipBLatitudeRadians) 
                * Math.cos(deg2rad(zipA.longitude - zipB.longitude)); 

    distance = Math.acos(distance) * 3958.56540656;
    return Math.round(distance);
};

exports.distance = dist;

var geohashLookups; // store the list of zips at each geohash precision
var GEOHASH_PRECISION = 4; // reduces 44142 zip codes into 10469 geohash buckets
function buildGeohashLookup() {
    geohashLookups = {};
    for (var i = 1; i <= GEOHASH_PRECISION; i++) {
        geohashLookups[i] = {};
    }

    for (var i in codes.codes) {
        var code = codes.codes[i];
        var hash = geohash.encode(code.latitude, code.longitude, GEOHASH_PRECISION);
        for (var l = 1; l <= hash.length; l++) {
            var h = hash.substring(0, l);
            (geohashLookups[l][h] || (geohashLookups[l][h] = [])).push(code);
        }
    }
}

exports.radius = function(zip, miles, full) {
    if (!geohashLookups) {
        buildGeohashLookup();
    }

    var targetZip = lookup(zip);
    var possibleGeohashes = geohash.rect(targetZip.latitude, targetZip.longitude, miles, GEOHASH_PRECISION);
    
    var ret = [], i, d, distances = {};
    
    for (i = 0; i < possibleGeohashes.length; i++) {
        var possibleZips = geohashLookups[possibleGeohashes[i].hash.length][possibleGeohashes[i].hash];
        if (possibleZips) {
            for (d = 0; d < possibleZips.length; d++) {
                var possibleZip = possibleZips[d];
                var distance = dist(zip, possibleZip.zip);
                if (distance <= miles) {
                   distances[possibleZip.zip] = distance;
                   ret.push(possibleZip.zip);
                }    
            }
        }
    }

    ret.sort(function(a,b) {
        return distances[a] - distances[b]
    });

    if (full) {
        for (i = 0; i < ret.length; i++) {
            ret[i] = lookup(ret[i]);
        }
    }

    return ret;
};


var deg2rad = function(value) {
    return value * 0.017453292519943295;
};

exports.toMiles = function(kilos) {
    return Math.round(kilos / 1.609344);
};

exports.toKilometers = function(miles) {
    return Math.round(miles * 1.609344);
};


function haversine(lat1,lon1, lat2,lon2) {		// Retuns the great circle distance between two coordinate points in miles
	var dLat = deg2rad(lat2 - lat1);
	var dLon = deg2rad(lon2 - lon1);
	var lat1 = deg2rad(lat1);
	var lat2 = deg2rad(lat2);

	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
			Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	return 3960 * c;
}

function lookupByCoords(lat,lon) {				// Return the closest code to coordinates at lat,lon
	var minDist = Infinity;
	var minCode = null;

	for(zip in codes.codes) {
		var code = codes.codes[zip];
		if(code.latitude && code.longitude) {
			var dist = haversine(lat,lon, code.latitude, code.longitude);
			if(dist<minDist) {
				minDist = dist;
				minCode = code;
			}
		}
	}
	return minCode;
}

exports.lookupByCoords = lookupByCoords;
