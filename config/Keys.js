// Dev
let keys = {
    domainName: "http://localhost:8100/",
    serverIp: "http://localhost:8080/",
    googleMaps: {
        apiKey: ''
    },
    jwtSecret: "",
    postgres: {
        user: '',
        host: '',
        database: '',
        password: '',
        port: 5432,
    },
    email: {
        default: {
            host: '',
            port: 465,
            email: '',
            password: ''
        }
    },
    adminEmail: "",
    bugsnag: {
        apiKey: ""
    }
}

if (process.env.ENV === "PROD") {
    keys.domainName = "";
    keys.serverIp = "";
    keys.postgres = {
        user: '',
        host: '',
        database: '',
        password: '',
        port: 5432,
    };
}

module.exports = keys;
