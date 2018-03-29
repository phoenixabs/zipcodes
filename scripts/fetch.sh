#!/bin/bash

set -e

cd "$(dirname "$0")"

wget=`which wget`
unzip=`which unzip`

if [ ! -x "$wget" ]; then
    echo "Could not find wget in path.."
    exit 1;
fi

if [ ! -x "$unzip" ]; then
    echo "Could not find unzip in path.."
    exit 1;
fi

if [ ! -f ./free-zipcode-database.csv ]; then
    echo "Fetching US Zipcodes CSV File"
    $wget -nv "http://federalgovernmentzipcodes.us/free-zipcode-database.csv"
fi

if [ ! -f ./US.txt ]; then
    echo "Fetching US Zipcodes CSV File From geonames "
    $wget -nv "http://download.geonames.org/export/zip/US.zip"
    $unzip -oq "US.zip" "US.txt"
fi

if [ ! -f ./zcta2010.csv ]; then
    echo "Fetching Zip Sizes"
    $wget -nv "http://proximityone.com/countytrends/zcta2010.csv" --user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36"
fi


wait

echo "Processing CSV file."

./process.js

wait

rm ./free-zipcode-database.csv
rm ./zcta2010.csv
rm ./US.zip*
rm ./US.txt

wait

echo "Build Complete"
