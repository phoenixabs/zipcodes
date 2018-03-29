#!/usr/bin/env node

var fs = require('fs'),
    path = require('path'),
    zips = {},
    str,
    data = fs.readFileSync('./free-zipcode-database.csv', 'utf8').replace(/\r/g, '').split('\n'),
    geonamesData = fs.readFileSync('./US.txt', 'utf8').split('\n'),
    zctaData = fs.readFileSync('./zcta2010.csv', 'utf8').replace(/\r/g, '').split('\n');

data.shift();

var clean = function(str) {
    return str.replace(/"/g, '').trimLeft();
}

var ucfirst = function(str) {
    str = str.toLowerCase();
    var lines = str.split(' ');
    lines.forEach(function(s, i) {
        var firstChar = s.charAt(0),
            upperFirstChar = firstChar.toUpperCase();

        lines[i] = upperFirstChar + s.substring(1);

    });
    return lines.join(' ');
};

geonamesLookupData = {};
// replace lat long US zip Codes 
geonamesData.forEach(function(line, num) {
    var dt = line.split('\t');
    if (dt.length == 12) {
        geonamesLookupData[clean(dt[1])] = {
            latitude: dt[9],
            longitude: dt[10]
        };
    }
});

data.forEach(function(line, num) {
    line = line.split(',');
    if (line.length > 1) {
        var o = {};

        o.zip = clean(line[1]);
        o.type = clean(line[2]);
        if (geonamesLookupData[o.zip] !== undefined) {
            o.latitude = Number(clean(geonamesLookupData[o.zip].latitude));
            o.longitude = Number(clean(geonamesLookupData[o.zip].longitude));
        } else {
            o.latitude = Number(clean(line[6]));
            o.longitude = Number(clean(line[7]));
        }
        o.city = ucfirst(clean(line[3]));
        o.state = clean(line[4]);
        o.country = 'US';
        if (!zips[o.zip]) {
            zips[o.zip] = o;
        }
    }
});

zctaData.forEach(function(line, num) {
    line = line.split(','); // the first 5 columns don't have commas in them so this is okay
    if (line.length > 5) {
        let zipcode = line[0];
        let zipInfo = zips[zipcode];
        if (zipInfo.latitude && zipInfo.longitude) {
            let totalSquareMiles = Number(line[3]) + Number(line[4]);
            let approximateRadius = Math.sqrt(totalSquareMiles) / 2;
            zipInfo.approximateRadius = +approximateRadius.toFixed(3);
        }
    }
})

var stateMap = {};

for (var i in zips) {
    var item = zips[i];
    stateMap[item.state] = stateMap[item.state] || [];

    stateMap[item.state].push(item.zip);
}

str = 'exports.codes = ' + JSON.stringify(zips,null,'\t') + ';\n';
str += 'exports.stateMap = ' + JSON.stringify(stateMap,null,'\t') + ';\n';

fs.writeFileSync(path.join('../', 'lib', 'codes.js'), str, 'utf8');
