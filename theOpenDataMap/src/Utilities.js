class Utilities {

    static timeSince(date) {

        let seconds = Math.floor((new Date() - new Date(date)) / 1000);

        let interval = Math.floor(seconds / 31536000);

        if (interval > 1) {
            return interval + " years ago";
        }

        interval = Math.floor(seconds / 2592000);

        if (interval > 1) {
            return interval + " months ago";
        }

        interval = Math.floor(seconds / 86400);

        if (interval > 1) {
            return interval + " days ago";
        }

        interval = Math.floor(seconds / 3600);

        if (interval > 1) {
            return interval + " hours ago";
        }

        interval = Math.floor(seconds / 60);

        if (interval > 1) {
            return interval + " mins ago";
        }

        return "just now";

    }

    static daysSince(date) {

        let seconds = Math.floor((new Date() - new Date(date)) / 1000);

        let interval = Math.floor(seconds / 31536000);

        if (interval > 1) {
            return interval + " years ago";
        }

        interval = Math.floor(seconds / 2592000);

        if (interval > 1) {
            return interval + " months ago";
        }

        interval = Math.floor(seconds / 86400);

        if (interval > 1) {
            return interval + " days ago";
        }

        return "less than a day ago"

    }

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

    static shorten(str, maxLen, separator = ' ') {
        if (str.length <= maxLen) return str;
        return str.substr(0, str.lastIndexOf(separator, maxLen)) + " ...";
    }

    static shortenToChar(str, maxLen) {
        if (str.length <= maxLen) return str;
        return str.substr(0, maxLen) + "..";
    }

    static getBase64(file) {

        return new Promise(function(resolve, reject) {

            let reader = new FileReader();

            reader.readAsDataURL(file);
            reader.onload = function () {
                resolve(reader.result)
            };

            reader.onerror = function (error) {
                reject(error)
            };

        })

    }

    static dataURLtoFile(dataurl, filename) {

        let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);

        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }

        return new File([u8arr], filename, {type:mime});

    }

    static capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    static hexToRgbA(hex) {

        let c;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            c= hex.substring(1).split('');
            if(c.length== 3){
                c= [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c= '0x'+c.join('');
            return [(c>>16)&255, (c>>8)&255, c&255].join(',')
        }

    }

    static randomStr(length) {

    	let text = "";
    	let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    	for (let i = 0; i < length; i++)
    		text += possible.charAt(Math.floor(Math.random() * possible.length));

    	return text;

    }

    static formatLocation(locationObj) {

        let locationStr =
            (locationObj.streetHouse ? locationObj.streetHouse  + " " : "" ) +
            (locationObj.postcode ? locationObj.postcode  + " " : "" ) +
            (locationObj.cityName ? locationObj.cityName  + " " : "" ) +
            (locationObj.countryName ? locationObj.countryName  + " " : "" )

        if (!locationStr) {
            locationStr = "No Location Information"
        }

        return locationStr;

    }

    static formatDate(dateObj, format) {

    	var str = new Date();

    	if (dateObj !== undefined) {
    		str = new Date(dateObj);
    	}

        // console.log(str)
        //
        // if ( (typeof dateObj === 'string') || (typeof dateObj === 'number') ) {
        //     str = new Date(dateObj * 1000);
        // }
        //
        // console.log(str)

    	var dateStr = "";
    	var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    	var months;
    	var days;
    	var years;
    	var hours;
    	var minutes;

    	switch (format) {

    		case "DD/MM/YYYY":
    			months = (str.getMonth()+1);
    			days = (str.getDate());
    			years = str.getFullYear();
    			if (months < 10) months = "0" + months
    			if (days < 10) days = "0" + days
    			dateStr = days + "/" + months + "/" + years;
    			break;

            case "DD/MM/YY":
    			months = (str.getMonth()+1);
    			days = (str.getDate());
    			years = str.getFullYear();
    			if (months < 10) months = "0" + months
    			if (days < 10) days = "0" + days
    			dateStr = days + "/" + months + "/" + (years + "").substr(0, 2);
    			break;

            case "DD/MM":
    			months = (str.getMonth()+1);
    			days = (str.getDate());
    			if (months < 10) months = "0" + months
    			if (days < 10) days = "0" + days
    			dateStr = days + "/" + months;
    			break;

            case "YYYY-MM-DD":
    			months = (str.getMonth()+1);
    			days = (str.getDate());
    			years = str.getFullYear();
    			if (months < 10) months = "0" + months
    			if (days < 10) days = "0" + days
    			dateStr = years + "-" + months + "-" + days;
    			break;

            case "HH:MM DD/MM/YYYY":
                months = (str.getMonth()+1);
                days = (str.getDate());
                years = str.getFullYear();
                if (months < 10) months = "0" + months
                if (days < 10) days = "0" + days
                hours = str.getHours()
                minutes = str.getMinutes()
                if (hours < 10) hours = "0" + hours;
                if (minutes < 10) minutes = "0" + minutes
                dateStr = hours + ":" + minutes + " " + days + "/" + months + "/" + years;
                break;

            case "mm DD":
                months = monthNames[(str.getMonth())];
                days = (str.getDate());
                if (days < 10) days = "0" + days
                dateStr = months + " " + days;
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

export default Utilities;
