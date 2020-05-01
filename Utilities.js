const urlExists = require('url-exists');

class Utilities {

    // https://stackoverflow.com/questions/9461621/format-a-number-as-2-5k-if-a-thousand-or-more-otherwise-900
    static nFormatter(num, digits) {

        var si = [
            { value: 1, symbol: "" },
            { value: 1E3, symbol: "k" },
            { value: 1E6, symbol: "M" },
            { value: 1E9, symbol: "G" },
            { value: 1E12, symbol: "T" },
            { value: 1E15, symbol: "P" },
            { value: 1E18, symbol: "E" }
        ];

        var rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
        var i;

        for (i = si.length - 1; i > 0; i--) {
            if (num >= si[i].value) {
                break;
            }
        }

        return (num / si[i].value).toFixed(digits).replace(rx, "$1") + si[i].symbol;
        
    }

    static isEmail(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    static async isURL(url) {
        return await new Promise(resolve => {
            urlExists(url, function(err, exists) {
                console.error(err);
                resolve(exists)
            })
        });
    }

    static getFilesizeInMb(filename) {
    	let stats = fs.statSync(filename)
    	let fileSizeInBytes = stats["size"]
    	return fileSizeInBytes/1024/1024
    }

    static removeFalselyElements(arr) {
        if (Array.isArray(arr)) {
            for (let i = 0; i < arr.length; i++) {
                if ( (!arr[i]) || (arr[i] === "") ) {
                    arr.splice(i, 1);
                    i--;
                }
            }
            return arr;
        }
        return [];
    }

    static deepEqual(a, b) {

        const assert = require("assert");

        try {
          assert.deepEqual(a, b);
        } catch (error) {
          if (error.name === "AssertionError") {
            return false;
          }
          throw error;
        }

        return true;

    };

    static isLatitude(originalLat) {

        let lat = parseFloat(originalLat);

        if (lat < -90 || lat > 90 || isNaN(originalLat)) {
            return false;
        }

        return true;

    }

    static isLongitude(lngOriginal) {

        let lng = parseFloat(lngOriginal);

        if (lng < -180 || lng > 180 || isNaN(lngOriginal)) {
            return false;
        }

        return true;

    }

    // Def falsy valuesfalse, 0, 0n, "", '', ``, null, undefined, NaN
    static containsFalsyValues(str) {

        if (!str)
            return;

        str = str.toLowerCase();

        return [
            "false",
            "f",
            "no",
            "-",
            "n",
            "na",
            "n/a",,
            "null",
            "undefined"
        ].indexOf(str) > -1

    }

    static formatDate(dateObj, format) {

        var str = new Date();

        if (dateObj !== undefined) {
            str = new Date(dateObj);
        }

        if ( (typeof dateObj === 'string') || (typeof dateObj === 'number') ) {
            str = new Date(dateObj * 1000);
        }

        var dateStr = "";
        var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        var months;
        var days;
        var years;
        var hours;
        var minutes;

        switch (format) {

            case "HH:MM DD/MM":
                months = (str.getMonth()+1);
                days = (str.getDate());
                hours = str.getHours()
                minutes = str.getMinutes()
                if (hours < 10) hours = "0" + hours;
                if (minutes < 10) minutes = "0" + minutes
                if (months < 10) months = "0" + months
                if (days < 10) days = "0" + days;
                dateStr = hours + ":" + minutes + " " + days + "/" + months;
                break;

            case "DD/MM/YYYY":
                months = (str.getMonth()+1);
                days = (str.getDate());
                years = str.getFullYear();
                if (months < 10) months = "0" + months
                if (days < 10) days = "0" + days
                dateStr = days + "-" + months + "-" + years;
                break;

            case "YYYY-MM-DD":
                months = (str.getMonth()+1);
                days = (str.getDate());
                years = str.getFullYear();
                if (months < 10) months = "0" + months
                if (days < 10) days = "0" + days
                dateStr = years + "-" + months + "-" + days;
                break;

            default:
                months = (str.getMonth()+1);
                if (months < 10) months = "0" + months
                years = str.getFullYear();
                if (years < 10) years = "0" + years
                days = (str.getDate());
                if (days < 10) days = "0" + days
                hours = str.getHours()
                if (hours < 10) hours = "0" + hours
                minutes = str.getMinutes()
                if (minutes < 10) minutes = "0" + minutes
                dateStr = years + "-" + months + "-" + days + " " + hours + ":" + minutes
                break;

        }

        return dateStr;

    }

}

module.exports = Utilities;
