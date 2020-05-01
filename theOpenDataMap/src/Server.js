import axios from 'axios';
import Storage from './Storage';

let requestStack = [];

class Server {

    static async api(request) {

        if (request.url.indexOf("api") > -1) {
            axios.defaults.baseURL = window.globalVars.serverIp
        } else {
            axios.defaults.baseURL = window.globalVars.serverIp + "a";
        }


        let headers = {

        }

        let authToken = (await Storage.get("authToken"))

        if (authToken) {
            authToken = authToken.replace(/\"/g, '');;
            headers['Authorization'] = "Token " + authToken
        }

        // if (request.url !== "/api/user/login") {
        //     headers['Authorization'] = "Token " + this.authenticationToken
        // }

        let start = new Date().getTime();

        console.log(requestStack)
        console.log('%c ' + request.method + " " + request.url + "?" + request.params, 'background: #222; color: #bada55');

        for (let i = 0; i < requestStack.length; i++) {
            if (requestStack[i].url === request.method + " " + request.url + "?" + request.params) {
                // console.log(requestStack[i].time + 2 + " > " + Math.round(start / 1000))
                if (requestStack[i].time + 1 > Math.round(start / 1000)) {
                    console.log("DUPE REQUEST+====================================")
                    return;
                }
            }
        }

        requestStack.push({
            url: request.method + " " + request.url + "?" + request.params,
            time: Math.round(start / 1000),
        })

        axios({
            method: request.method,
            url: request.url,
            data: request.data,
            headers: headers,
            params: request.params,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }).then(function (response) {

            if (window.globalVars.size === "small" && window.globalVars.os === "ios") {

                let end = new Date().getTime();
                let time = end - start;
                let minimumTime = 500;
                console.log('iPhone @@@@ SERVER RESPONSE TIME: ' + time);

                if (time < minimumTime) {
                    console.log("@@@@ delay response pass by" + (minimumTime - time))
                    setTimeout(function() {
                        console.log("@@@@ unblocked")
                        request.then(response);
                    }, minimumTime - time)
                } else {
                    console.log("@@@@ No need to delay")
                    request.then(response);
                }

            } else {

                console.log("@@@@ Not iphone, pass response")
                request.then(response);

            }

        })
        .catch(async function (error) {

            console.error(error);

            if (error && error.response && error.response.status) {

                if (error.response.status === 401) {
                    await Storage.remove("user");
                    await Storage.remove("authToken");
                    await Storage.remove("splashscreenPassed");
                    window.location.href = "/";
                } else {
                    request.catch(error.response.status, error.response.data.error || "Unexpected Error");
                }

            } else {

                request.catch(500, "Unexpected Error");

            }

        });

    }

}

export default Server;
