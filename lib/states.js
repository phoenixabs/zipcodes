var full = {
    'ALABAMA': 'AL',
    'ALASKA': 'AK',
    'ARIZONA': 'AZ',
    'ARKANSAS': 'AR',
    'CALIFORNIA': 'CA',
    'COLORADO': 'CO',
    'CONNECTICUT': 'CT',
    'DELAWARE': 'DE',
    'DISTRICT OF COLUMBIA': 'DC',
    'FLORIDA': 'FL',
    'GEORGIA': 'GA',
    'HAWAII': 'HI',
    'IDAHO': 'ID',
    'ILLINOIS': 'IL',
    'INDIANA': 'IN',
    'IOWA': 'IA',
    'KANSAS': 'KS',
    'KENTUCKY': 'KY',
    'LOUISIANA': 'LA',
    'MAINE': 'ME',
    'MARYLAND': 'MD',
    'MASSACHUSETTS': 'MA',
    'MICHIGAN': 'MI',
    'MINNESOTA': 'MN',
    'MISSISSIPPI': 'MS',
    'MISSOURI': 'MO',
    'MONTANA': 'MT',
    'NEBRASKA': 'NE',
    'NEVADA': 'NV',
    'NEW HAMPSHIRE': 'NH',
    'NEW JERSEY': 'NJ',
    'NEW MEXICO': 'NM',
    'NEW YORK': 'NY',
    'NORTH CAROLINA': 'NC',
    'NORTH DAKOTA': 'ND',
    'OHIO': 'OH',
    'OKLAHOMA': 'OK',
    'OREGON': 'OR',
    'PENNSYLVANIA': 'PA',
    'RHODE ISLAND': 'RI',
    'SOUTH CAROLINA': 'SC',
    'SOUTH DAKOTA': 'SD',
    'TENNESSEE': 'TN',
    'TEXAS': 'TX',
    'UTAH': 'UT',
    'VERMONT': 'VT',
    'VIRGINIA': 'VA',
    'WASHINGTON': 'WA',
    'WEST VIRGINIA': 'WV',
    'WISCONSIN': 'WI',
    'WYOMING': 'WY',
    "BRITISH COLUMBIA": "BC",
    "ONTARIO": "ON",
    "NEWFOUNDLAND AND LABRADOR": "NL",
    "NOVA SCOTIA": "NS",
    "PRINCE EDWARD ISLAND": "PE",
    "NEW BRUNSWICK": "NB",
    "QUEBEC": "QC",
    "MANITOBA": "MB",
    "SASKATCHEWAN": "SK",
    "ALBERTA": "AB",
    "NORTHEWEST TERRITORIES": "NT",
    "NUNAVUT": "NU",
    "YUKON TERRITORY": "YT"
};

var FIPS = {
    AK: 02,
    MS: 28,
    AL: 01,
    MT: 30,
    AR: 05,
    NC: 37,
    AS: 60,
    ND: 38,
    AZ: 04,
    NE: 31,
    CA: 06,
    NH: 33,
    CO: 08,
    NJ: 34,
    CT: 09,
    NM: 35,
    DC: 11,
    NV: 32,
    DE: 10,
    NY: 36,
    FL: 12,
    OH: 39,
    GA: 13,
    OK: 40,
    GU: 66,
    OR: 41,
    HI: 15,
    PA: 42,
    IA: 19,
    PR: 72,
    ID: 16,
    RI: 44,
    IL: 17,
    SC: 45,
    IN: 18,
    SD: 46,
    KS: 20,
    TN: 47,
    KY: 21,
    TX: 48,
    LA: 22,
    UT: 49,
    MA: 25,
    VA: 51,
    MD: 24,
    VI: 78,
    ME: 23,
    VT: 50,
    MI: 26,
    WA: 53,
    MN: 27,
    WI: 55,
    MO: 29,
    WV: 54,   
    WY: 56
}

var abbr = {};

exports.full = full;

exports.fips = FIPS;

for (var i in full) {
    abbr[full[i]] = i;
}

exports.abbr = abbr;

exports.normalize = function(state) {
    state = state.toUpperCase();

    if (state.length !== 2) {
        state = full[state];
    }
    return state;
}
