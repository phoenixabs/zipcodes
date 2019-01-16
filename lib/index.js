var geohash = require('geohash-area');
var codesUS, states, codesCanada, codes = {};

function load() {
    if (!codesUS) {
        codesUS = require('./codes');
        states = require('./states');
        codesCanada = require('./codesCanada');
        codes.codes = Object.assign({}, codesUS.codes, codesCanada.codes);
        codes.stateMap = Object.assign({}, codesUS.stateMap, codesCanada.stateMap);
    }
}

exports.states = () => {
    load();
    return states;
};

exports.codes = () => {
    load();
    return codes.codes;
};


var lookup = function(zip) {
    load();
    if (zip != null && zip != undefined && typeof zip === "string" && isNaN(zip.charAt(0))) {
      return codes.codes[zip.slice(0, 3)];
    }
    return codes.codes[zip];
};

exports.lookup = lookup;

var byName = function(city, state) {
    load();
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
    load();
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

var distLatLon = function(lat1, lon1, lat2, lon2) {
    var radians1 = deg2rad(lat1);
    var radians2 = deg2rad(lat2);

    var distance = Math.sin(radians1) 
                * Math.sin(radians2) 
                + Math.cos(radians1) 
                * Math.cos(radians2) 
                * Math.cos(deg2rad(lon1 - lon2)); 

    return Math.acos(distance) * 3958.56540656;
}

var dist = function(zipA, zipB) {
    zipA = lookup(zipA);
    zipB = lookup(zipB);
    if (!zipA || !zipB) {
        return null;
    }

    return Math.round(distLatLon(zipA.latitude, zipA.longitude, zipB.latitude, zipB.longitude));
};

exports.distance = dist;

var geohashLookups; // store the list of zips at each geohash precision
var GEOHASH_PRECISION = 4; // reduces 44142 zip codes into 10469 geohash buckets
function buildGeohashLookup() {
    load();
    const DICT = "0123456789bcdefghjkmnpqrstuvwxyz";
    geohashLookups = {};
    for (var i = 1; i <= GEOHASH_PRECISION; i++) {
        geohashLookups[i] = {};
    }
    var geohashFills = {};
    function getGeoHashFills(count) {
        if (!geohashFills[count]) {
            if (count === 0) {
                geohashFills[count] = [''];
            }
            else {
                var fills = [];
                var smallerFills = getGeoHashFills(count - 1);
                for (var i = 0; i < smallerFills.length; i++) {
                    for (var j = 0; j < DICT.length; j++) {
                        fills.push(smallerFills[i] + DICT[j]);
                    }
                }
                geohashFills[count] = fills;
            }
        }
        return geohashFills[count];
    }

    for (var i in codes.codes) {
        var code = codes.codes[i];

        if (code.approximateRadius) {
            var possibleGeoHashes = geohash.rect(code.latitude, code.longitude, code.approximateRadius, GEOHASH_PRECISION);
            // console.log(code.zip, geohash.encode(code.latitude, code.longitude, GEOHASH_PRECISION), possibleGeoHashes);
            for (var g = 0; g < possibleGeoHashes.length; g++) {
                var hash = possibleGeoHashes[g].hash;
                for (var l = 1; l <= hash.length; l++) {
                    var h = hash.substring(0, l);
                    (geohashLookups[l][h] || (geohashLookups[l][h] = [])).push(code);
                }

                // fill in smaller geohashes
                for (var l = 1; l <= GEOHASH_PRECISION - hash.length; l++) {
                    var fills = getGeoHashFills(l);
                    for (var m = 0; m < fills.length; m++) {
                        var h = hash + fills[m];
                        // console.log('fill', code.zip, l + hash.length, h, geohashLookups[l + hash.length][h]);
                        (geohashLookups[l + hash.length][h] || (geohashLookups[l + hash.length][h] = [])).push(code);
                    }
                }
            }
        }
        else {
            var hash = geohash.encode(code.latitude, code.longitude, GEOHASH_PRECISION);
            for (var l = 1; l <= hash.length; l++) {
                var h = hash.substring(0, l);
                (geohashLookups[l][h] || (geohashLookups[l][h] = [])).push(code);
            }
        }
    }
}

exports.radius = function(zip, miles, full) {
    var targetZip = lookup(zip);
    if (!targetZip) {
        return [];
    }

    var i, ret = exports.radiusFromLatLon(targetZip.latitude, targetZip.longitude, miles);
    for (i = 0; i < ret.length; i++) {
        if (full) {
            ret[i] = ret[i].zip;
        }
        else {
            ret[i] = ret[i].zip.zip;
        }
    }

    return ret;
};

exports.radiusFromLatLon = function(lat, lon, miles) {
    if (!geohashLookups) {
        buildGeohashLookup();
    }

    var possibleGeohashes = geohash.rect(lat, lon, miles, GEOHASH_PRECISION);
    
    var ret = [], i, d, seenZips = {};
    
    for (i = 0; i < possibleGeohashes.length; i++) {
        var possibleZips = geohashLookups[possibleGeohashes[i].hash.length][possibleGeohashes[i].hash];
        if (possibleZips) {
            for (d = 0; d < possibleZips.length; d++) {
                var possibleZip = possibleZips[d];
                if (seenZips[possibleZip.zip]) {
                    continue;
                }
                seenZips[possibleZip.zip] = true;

                var distance = distLatLon(lat, lon, possibleZip.latitude, possibleZip.longitude);
                if (possibleZip.approximateRadius) {
                    distance = Math.max(0, distance - possibleZip.approximateRadius);
                }
                if (Math.round(distance) <= miles) {
                    ret.push({
                        zip: possibleZip,
                        distance: distance
                    });
                }    
            }
        }
    }

    ret.sort(function(a,b) {
        return a.distance - b.distance;
    });

    return ret;    
}


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

function lookupByCoords(lat,lon) {	
    load();			// Return the closest code to coordinates at lat,lon
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
