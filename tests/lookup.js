#!/usr/bin/env node

var path = require('path'),
    vows = require('vows'),
    assert = require('assert'),
    zipcodes = require(path.join(__dirname, '../', 'lib'));

var tests = {
    'should export': {
        topic: function() {
            return zipcodes;
        },
        'a functions and objects': function(d) {
            ['lookup','lookupByName','distance','radius','toMiles','toKilometers'].forEach(function(key) {
                assert.isFunction(d[key]);
            });
            assert.isObject(d.codes);
            assert.isObject(d.states);
        }
    },
    'Marion': {
        topic: function() {
            return zipcodes.lookup(62959);
        },
        'should be ok': function(marion) {
            assert.equal(marion.city, 'Marion');
        }
    },
    'Kananaskis': {
      topic: function() {
        return zipcodes.lookup("T0L");
      },
      'should be ok': function(kananaskis) {
        assert.equal(kananaskis.city, "Kananaskis Country (claresholm)");
      }
    },
    'BC': {
        topic: function() {
          return zipcodes.lookup("V6B2Y9");
        },
        'should be ok': function(bc) {
          assert.equal(bc.state, "British Columbia");
        }
    },
    'Beverly Hills': {
        topic: function() {
            return zipcodes.lookup(90210);
        },
        'should be ok': function(hills) {
            assert.equal(hills.city, 'Beverly Hills');
        }
    },
    'distance': {
        topic: function() {
            return null;
        },
        'should find': function() {
            var dist = zipcodes.distance(62959, 90210);
            assert.equal(dist, 1662);

            var dist2 = zipcodes.distance(62959, 62959);
            assert.equal(dist2, 0);

            var dist3 = zipcodes.distance(62959, 63801);
            assert.equal(dist3, 68);

            var dist4 = zipcodes.distance(62959, 95014);
            assert.equal(dist4, 1805);
            assert.equal(zipcodes.toKilometers(dist4), 2905);
            assert.equal(zipcodes.toMiles(zipcodes.toKilometers(dist4)), dist4);

            var dist5 = zipcodes.distance(62959, 90210);
            assert.equal(dist5, 1662);

            var dist6 = zipcodes.distance("T2E", "V5N");
            assert.equal(dist6, 417);
        },
        'should not find': function() {
            var dist = zipcodes.distance(62959, 123456);
            assert.equal(dist, null);

            var dist2 = zipcodes.distance(123456, 62959);
            assert.equal(dist2, null);

            var dist3 = zipcodes.distance(123456, "V5N");
            assert.equal(dist3, null);
        }
    },
    'lookups': {
        topic: function() {
            return null;
        },
        'should find by name': function() {
            var l = zipcodes.lookupByName('Marion', 'il');
            assert.equal(l.length, 1);

            var l = zipcodes.lookupByName('Marion', 'Illinois');
            assert.equal(l.length, 1);

            var l = zipcodes.lookupByName('Cupertino', 'CA');
            assert.equal(l.length, 2);

            var l = zipcodes.lookupByName('New York', 'New York');
            assert.equal(l.length, 159);

            var l = zipcodes.lookupByName('New York', 'NY');
            assert.equal(l.length, 159);
        },
        'should find by state': function() {
            var l = zipcodes.lookupByState('RI');
            assert.equal(l.length, 91);

            var l = zipcodes.lookupByState('ri');
            assert.equal(l.length, 91);

            var l = zipcodes.lookupByState('foobar');
            assert.equal(l.length, 0);
        },
		'should find by coordinates': function() {
			var loc = zipcodes.lookupByCoords(29.2108, -81.0228);
			assert.equal(loc.city, 'Daytona Beach');

			loc = zipcodes.lookupByCoords(40.715, -73.985);
			assert.equal(loc.city, 'New York');

			loc = zipcodes.lookupByCoords(36.131, -95.937);
			assert.equal(loc.city, 'Tulsa');
		}
    },
    'radius': {
        topic: function() {
            return null;
        },
        'should find': function() {
            var rad = zipcodes.radius(62959, 20);
            assert.equal(rad.length, 44);

            var rad = zipcodes.radius(95014, 50);
            assert.equal(rad.length, 399);

            var rad = zipcodes.radius(95014, 50, true);
            assert.equal(rad.length, 399);
            rad.sort(function(a,b) {
                return a.zip < b.zip ? -1 : 1;
            });
            assert.deepEqual(rad[0], {
              zip: '93901',
              latitude: 36.6677,
              longitude: -121.6596,
              approximateRadius: 1.913,
              city: 'Salinas',
              state: 'CA',
              type: 'STANDARD',
              country: 'US',
              stateCode: 6,
              countyCode: 53
          });
        },
        'should be reasonably fast': function() {
            // this previously took 90 seconds on my machine, and now it takes about 0.5 seconds
            // the test will fail if it takes over 3 seconds.
            var startTime = new Date().getTime();
            var nyZips = zipcodes.lookupByState('NY');
            for (var i = 0; i < nyZips.length; i++) {
                zipcodes.radius(nyZips[i].zip, 20);
            }
            assert(new Date().getTime() - startTime < 3000);
        }
    }
};

vows.describe('zipcodes').addBatch(tests).export(module);
