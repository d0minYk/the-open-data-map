import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
    IonApp,
    IonIcon,
    IonLabel,
    IonRouterOutlet,
    IonTabBar,
    IonTabButton,
    IonTabs
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { book, map, addCircle, person, informationCircle } from 'ionicons/icons';

import Loader from './modals/Loader.js';
import Loadable from 'react-loadable';

import { Plugins, StatusBarStyle } from '@capacitor/core';
import AppIcon from './images/logo.png'
import {setupConfig} from '@ionic/core';

import ReactGA from 'react-ga';
import bugsnag from '@bugsnag/js'
import bugsnagReact from '@bugsnag/plugin-react'

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import './styles/App.scss';
import './styles/leaflet.css';
import './styles/Desktop.scss';
import './styles/Mobile.scss';
import './icons/flaticon.css';

/* Theme variables */
import './theme/variables.css';
import Storage from './Storage';
import Server from './Server';

// Pages
import CookieConsent from "react-cookie-consent";
import Splash from './pages/Splash.js';
import Login from './pages/Login.js';
import Search from './pages/Search.js';
import SearchGuide from './pages/SearchGuide.js';
import Legal from './pages/Legal.js';
import Directory from './pages/Directory.js';
import MapView from './pages/MapView.js';
import Profile from './pages/Profile.js';
import Error from './pages/Error.js';
import ContactUs from './pages/ContactUs';
import DatasetSchemaEditor from './pages/DatasetSchemaEditor';
import DatasetProgress from './pages/DatasetProgress';
import About from './pages/About';
import Credits from './pages/Credits';
import DatasetContentEditor from './pages/DatasetContentEditor';
import DatasetList from './pages/DatasetList.js';
import CKANList from './pages/CKANList.js';
import LocationList from './pages/LocationList.js';
import RequestList from './pages/RequestList.js';
import SocialList from './pages/SocialList.js';
import UserList from './pages/UserList.js';
import DatasetDetails from './pages/DatasetDetails.js';
import DatasetContent from './pages/DatasetContent.js';
import AdminDashboard from './pages/AdminDashboard.js';
import LocationEditor from './pages/LocationEditor.js';
import RequestEditor from './pages/RequestEditor.js';
import FAQ from './pages/FAQ.js';
import Statistics from './pages/Statistics.js';
import RequestDetails from './pages/RequestDetails.js';
import NewPostDrawer from './modals/NewPostDrawer.js';

// Lazy loaded pages for website
// const CookieConsent = Loadable({ loader: () => import ('react-cookie-consent'), loading: Loader });
// const Splash = Loadable({ loader: () => import ('./pages/Splash.js'), loading: Loader });
// const Login = Loadable({ loader: () => import ('./pages/Login.js'), loading: Loader });
// const Search = Loadable({ loader: () => import ('./pages/Search.js'), loading: Loader });
// const SearchGuide = Loadable({ loader: () => import ('./pages/SearchGuide.js'), loading: Loader });
// const Legal = Loadable({ loader: () => import ('./pages/Legal.js'), loading: Loader });
// const Directory = Loadable({ loader: () => import ('./pages/Directory.js'), loading: Loader });
// const MapView = Loadable({ loader: () => import ('./pages/MapView.js'), loading: Loader });
// const Profile = Loadable({ loader: () => import ('./pages/Profile.js'), loading: Loader });
// const Error = Loadable({ loader: () => import ('./pages/Error.js'), loading: Loader });
// const ContactUs = Loadable({ loader: () => import ('./pages/ContactUs.js'), loading: Loader });
// const DatasetSchemaEditor = Loadable({ loader: () => import ('./pages/DatasetSchemaEditor.js'), loading: Loader });
// const DatasetProgress = Loadable({ loader: () => import ('./pages/DatasetProgress.js'), loading: Loader });
// const About = Loadable({ loader: () => import ('./pages/About.js'), loading: Loader });
// const Credits = Loadable({ loader: () => import ('./pages/Credits.js'), loading: Loader });
// const DatasetContentEditor = Loadable({ loader: () => import ('./pages/DatasetContentEditor.js'), loading: Loader });
// const DatasetList = Loadable({ loader: () => import ('./pages/DatasetList.js'), loading: Loader });
// const CKANList = Loadable({ loader: () => import ('./pages/CKANList.js'), loading: Loader });
// const LocationList = Loadable({ loader: () => import ('./pages/LocationList.js'), loading: Loader });
// const RequestList = Loadable({ loader: () => import ('./pages/RequestList.js'), loading: Loader });
// const SocialList = Loadable({ loader: () => import ('./pages/SocialList.js'), loading: Loader });
// const UserList = Loadable({ loader: () => import ('./pages/UserList.js'), loading: Loader });
// const DatasetDetails = Loadable({ loader: () => import ('./pages/DatasetDetails.js'), loading: Loader });
// const DatasetContent = Loadable({ loader: () => import ('./pages/DatasetContent.js'), loading: Loader });
// const AdminDashboard = Loadable({ loader: () => import ('./pages/AdminDashboard.js'), loading: Loader });
// const LocationEditor = Loadable({ loader: () => import ('./pages/LocationEditor.js'), loading: Loader });
// const RequestEditor = Loadable({ loader: () => import ('./pages/RequestEditor.js'), loading: Loader });
// const FAQ = Loadable({ loader: () => import ('./pages/FAQ.js'), loading: Loader });
// const Statistics = Loadable({ loader: () => import ('./pages/Statistics.js'), loading: Loader });
// const RequestDetails = Loadable({ loader: () => import ('./pages/RequestDetails.js'), loading: Loader });
// const NewPostDrawer = Loadable({ loader: () => import ('./modals/NewPostDrawer.js'), loading: Loader });

const { SplashScreen, Device, StatusBar } = Plugins;

// console.log = function nope() {}
// console.error = function nope() {}
// console.warn = function nope() {}

interface State {
    showTabs: boolean;
}

interface Props {

}

// setupConfig({ mode: 'ios', animated: false });

const bugsnagClient = bugsnag('')
bugsnagClient.use(bugsnagReact, React)
const ErrorBoundary = bugsnagClient.getPlugin('react')
// Loading windows config
// import test

class App extends React.Component<Props, State> {

    constructor(props) {

        super(props);

        this.state = {
            currentUrl: "/",
            size: "small",
            platform: "mobile-tablet",
            os: "",
            showCookieConsent: false
        }

        window.globalVars = {
            mapTileServer: "",
            pageTitle: " | The Open Data Map",
            googleMapsAPI: ""
        }

        if (!window.globalVars.mapTileServer) {
            alert("Map Tile Server is not defined, define in App.js");
        }

        if (!window.globalVars.googleMapsAPI) {
            alert("Google Maps API key is not defined, define in App.js");
        }

        window.globalVars.COLORS = {
            'red': "#ff5151", // energy, agression, passion
            'orange': "#ff7043", // fun, playful, youthful
            'green': "#66bb6a", // wealth, health, educatin
            'blue': "#4a69bb", // trustworthy, security, calmness
            'purple': "#5F6CAF", // spirituality, chirch
            'grey': "#78909c", // science
        }

        window.globalVars.ICONS = {
            "flaticon-smartphone": { color: window.globalVars.COLORS.grey, keywords: ["smartphone"] },
            "flaticon-car": { color: window.globalVars.COLORS.blue, keywords: ["car"] },
            "flaticon-box": { color: window.globalVars.COLORS.blue, keywords: ["box"] },
            "flaticon-ballot": { color: window.globalVars.COLORS.blue, keywords: ["ballot", "vote", "election"] },
            "flaticon-elections": { color: window.globalVars.COLORS.blue, keywords: ["ballot", "vote", "election"] },
            "flaticon-city-hall": { color: window.globalVars.COLORS.blue, keywords: ["city hall", "government", "building"] },
            "flaticon-city-hall-1": { color: window.globalVars.COLORS.blue, keywords: ["city hall", "government", "building"] },
            "flaticon-route": { color: window.globalVars.COLORS.blue, keywords: ["route", "track"] },
            "flaticon-track": { color: window.globalVars.COLORS.blue, keywords: ["route", "track"] },
            "flaticon-direction": { color: window.globalVars.COLORS.blue, keywords: ["direction"] },
            "flaticon-education": { color: window.globalVars.COLORS.green, keywords: ["education", "school"] },
            "flaticon-church": { color: window.globalVars.COLORS.purple, keywords: ["church"] },
            "flaticon-headstone": { color: window.globalVars.COLORS.purple, keywords: ["headstone"] },
            "flaticon-recycle-sign": { color: window.globalVars.COLORS.green, keywords: ["recycle"] },
            "flaticon-parking": { color: window.globalVars.COLORS.blue, keywords: ["parking"] },
            "flaticon-bicycle": { color: window.globalVars.COLORS.blue, keywords: ["biycle", "bike"] },
            "flaticon-trash-can": { color: window.globalVars.COLORS.grey, keywords: ["trash", "bin", "can"] },
            "flaticon-recycle-bin": { color: window.globalVars.COLORS.green, keywords: ["recycle"] },
            "flaticon-promotion": { color: window.globalVars.COLORS.blue, keywords: ["promotion"] },
            "flaticon-call": { color: window.globalVars.COLORS.grey, keywords: ["call", "phone"] },
            "flaticon-enterprise": { color: window.globalVars.COLORS.blue, keywords: ["enterprise"] },
            "flaticon-family": { color: window.globalVars.COLORS.green, keywords: ["family"] },
            "flaticon-student": { color: window.globalVars.COLORS.green, keywords: ["student"] },
            "flaticon-suitcase": { color: window.globalVars.COLORS.blue, keywords: ["suitcase", "work"] },
            "flaticon-employee": { color: window.globalVars.COLORS.blue, keywords: ["employee"] },
            "flaticon-together": { color: window.globalVars.COLORS.blue, keywords: ["together"] },
            "flaticon-warrior": { color: window.globalVars.COLORS.purple, keywords: ["warrior"] },
            "flaticon-lotus-flower": { color: window.globalVars.COLORS.purple, keywords: ["lotus-flower"] },
            "flaticon-padmasana": { color: window.globalVars.COLORS.purple, keywords: ["padmasana"] },
            "flaticon-heart": { color: window.globalVars.COLORS.purple, keywords: ["heart"] },
            "flaticon-charity": { color: window.globalVars.COLORS.purple, keywords: ["charity", "vulunteer"] },
            "flaticon-dumbbell": { color: window.globalVars.COLORS.red, keywords: ["dumbbell", "gym"] },
            "flaticon-information": { color: window.globalVars.COLORS.blue, keywords: ["information"] },
            "flaticon-question": { color: window.globalVars.COLORS.blue, keywords: ["question", "help"] },
            "flaticon-dog": { color: window.globalVars.COLORS.orange, keywords: ["dog", "animal"] },
            "flaticon-bone": { color: window.globalVars.COLORS.orange, keywords: ["bone"] },
            "flaticon-barbershop": { color: window.globalVars.COLORS.blue, keywords: ["barbershop"] },
            "flaticon-coffee-shop": { color: window.globalVars.COLORS.blue, keywords: ["coffee", "cafeteria"] },
            "flaticon-cafeteria": { color: window.globalVars.COLORS.blue, keywords: ["cafeteria", "coffee"] },
            "flaticon-coffee": { color: window.globalVars.COLORS.blue, keywords: ["coffee"] },
            "flaticon-bread": { color: window.globalVars.COLORS.blue, keywords: ["bread"] },
            "flaticon-chocolate": { color: window.globalVars.COLORS.blue, keywords: ["chocolate"] },
            "flaticon-dish": { color: window.globalVars.COLORS.blue, keywords: ["dish"] },
            "flaticon-restaurant": { color: window.globalVars.COLORS.blue, keywords: ["restaurant"] },
            "flaticon-shop": { color: window.globalVars.COLORS.blue, keywords: ["shop"] },
            "flaticon-shopping-bag": { color: window.globalVars.COLORS.blue, keywords: ["shopping-bag"] },
            "flaticon-shop-1": { color: window.globalVars.COLORS.blue, keywords: ["shop"] },
            "flaticon-piggy-bank": { color: window.globalVars.COLORS.blue, keywords: ["bank"] },
            "flaticon-museum": { color: window.globalVars.COLORS.blue, keywords: ["museum"] },
            "flaticon-record": { color: window.globalVars.COLORS.orange, keywords: ["record"] },
            "flaticon-disco-ball": { color: window.globalVars.COLORS.orange, keywords: ["disco"] },
            "flaticon-beer": { color: window.globalVars.COLORS.orange, keywords: ["beer"] },
            "flaticon-lgtb": { color: window.globalVars.COLORS.orange, keywords: ["lgbt"] },
            "flaticon-truck": { color: window.globalVars.COLORS.blue, keywords: ["truck"] },
            "flaticon-ambulance": { color: window.globalVars.COLORS.green, keywords: ["ambulance", "hospital", "health"] },
            "flaticon-boat": { color: window.globalVars.COLORS.blue, keywords: ["boat"] },
            "flaticon-doctor": { color: window.globalVars.COLORS.green, keywords: ["doctor", "hospital"] },
            "flaticon-hospital": { color: window.globalVars.COLORS.green, keywords: ["hospital"] },
            "flaticon-subway": { color: window.globalVars.COLORS.blue, keywords: ["subway"] },
            "flaticon-tourist": { color: window.globalVars.COLORS.orange, keywords: ["tourist"] },
            "flaticon-tourists": { color: window.globalVars.COLORS.orange, keywords: ["tourists"] },
            "flaticon-suitcase-1": { color: window.globalVars.COLORS.orange, keywords: ["suitcase"] },
            "flaticon-tickets": { color: window.globalVars.COLORS.blue, keywords: ["tickets"] },
            "flaticon-cctv": { color: window.globalVars.COLORS.grey, keywords: ["cctv", "camera"] },
            "flaticon-water": { color: window.globalVars.COLORS.blue, keywords: ["water", "bottle"] },
            "flaticon-playground": { color: window.globalVars.COLORS.green, keywords: ["playground"] },
            "flaticon-park": { color: window.globalVars.COLORS.green, keywords: ["park"] },
            "flaticon-bowling": { color: window.globalVars.COLORS.orange, keywords: ["bowling"] },
            // "flaticon-right-to-objection": { color: "#42a5f5", keywords: ["box"] },
            // "flaticon-lightbulb": { color: window.globalVars.COLORS.blue, keywords: ["lightbulb", "idea"] },
            "flaticon-wifi": { color: window.globalVars.COLORS.grey, keywords: ["internet", "wifi", "network"] },
            "flaticon-plant": { color: window.globalVars.COLORS.green, keywords: ["plant", "crop", "allotment"] },
            "flaticon-atm-machine": { color: window.globalVars.COLORS.blue, keywords: ["atm", "bank"] },
            "flaticon-book": { color: window.globalVars.COLORS.blue, keywords: ["book", "library"] },
            "flaticon-book-1": { color: window.globalVars.COLORS.blue, keywords: ["book", "library"] },
            "flaticon-book-2": { color: window.globalVars.COLORS.blue, keywords: ["book", "library"] },
            "flaticon-taxi": { color: window.globalVars.COLORS.blue, keywords: ["taxi"] },
            "flaticon-bus-stop": { color: window.globalVars.COLORS.blue, keywords: ["bus"] },
            "flaticon-running": { color: window.globalVars.COLORS.orange, keywords: ["running"] },
            "flaticon-gym": { color: window.globalVars.COLORS.red, keywords: ["gym"] },
            "flaticon-gym-1": { color: window.globalVars.COLORS.red, keywords: ["gym"] },
            "flaticon-pharmacy": { color: window.globalVars.COLORS.green, keywords: ["pharmacy", "medicine"] },
            "flaticon-sauna": { color: window.globalVars.COLORS.orange, keywords: ["sauna"] },
            "flaticon-work": { color: window.globalVars.COLORS.blue, keywords: ["work"] },
            "flaticon-factory": { color: window.globalVars.COLORS.blue, keywords: ["factory"] },
            "flaticon-laptop": { color: window.globalVars.COLORS.grey, keywords: ["laptop", "computer"] },
            "flaticon-factory-1": { color: window.globalVars.COLORS.blue, keywords: ["factory"] },
            "flaticon-camera": { color: window.globalVars.COLORS.grey, keywords: ["camera"] },
            "flaticon-worker": { color: window.globalVars.COLORS.blue, keywords: ["worker"] },
            "flaticon-worker-1": { color: window.globalVars.COLORS.blue, keywords: ["worker"] },
            "flaticon-maintenance": { color: window.globalVars.COLORS.blue, keywords: ["maintenance"] },
            "flaticon-engineer": { color: window.globalVars.COLORS.blue, keywords: ["engineer"] },
            "flaticon-architect": { color: window.globalVars.COLORS.blue, keywords: ["architect", "house"] },
            "flaticon-florist": { color: window.globalVars.COLORS.blue, keywords: ["florist"] },
            "flaticon-florist-1": { color: window.globalVars.COLORS.blue, keywords: ["florist"] },
            "flaticon-cloth": { color: window.globalVars.COLORS.blue, keywords: ["cloth"] },
            "flaticon-fast-food": { color: window.globalVars.COLORS.blue, keywords: ["food"] },
            "flaticon-park-1": { color: window.globalVars.COLORS.green, keywords: ["park"] },
            "flaticon-burger": { color: window.globalVars.COLORS.blue, keywords: ["food"] },
            "flaticon-tooth": { color: window.globalVars.COLORS.blue, keywords: ["tooth", "dentist"] },
            "flaticon-canvas": { color: window.globalVars.COLORS.blue, keywords: ["canvas"] },
            "flaticon-pipeline": { color: window.globalVars.COLORS.blue, keywords: ["pipeline", "plumber"] },
            "flaticon-plumber": { color: window.globalVars.COLORS.blue, keywords: ["plumber"] },
            "flaticon-post-office": { color: window.globalVars.COLORS.blue, keywords: ["post office"] },
            "flaticon-post-office-1": { color: window.globalVars.COLORS.blue, keywords: ["post office"] },
            "flaticon-painting": { color: window.globalVars.COLORS.orange, keywords: ["painting"] },
            "flaticon-paint": { color: window.globalVars.COLORS.orange, keywords: ["paint"] },
            "flaticon-instruction": { color: window.globalVars.COLORS.blue, keywords: ["instruction"] },
            "flaticon-microphone": { color: window.globalVars.COLORS.orange, keywords: ["microphone", "record"] },
            "flaticon-dj-mixer": { color: window.globalVars.COLORS.orange, keywords: ["dj"] },
            "flaticon-camera-1": { color: window.globalVars.COLORS.grey, keywords: ["camera", "photo", "picture"] },
            "flaticon-dance": { color: window.globalVars.COLORS.orange, keywords: ["dance"] },
            "flaticon-dancing": { color: window.globalVars.COLORS.orange, keywords: ["dance"] },
            "flaticon-museum-1": { color: window.globalVars.COLORS.blue, keywords: ["museum"] },
            "flaticon-cinema": { color: window.globalVars.COLORS.orange, keywords: ["cinema", "movie"] },
            "flaticon-exhibition": { color: window.globalVars.COLORS.orange, keywords: ["exhibition"] },
            "flaticon-spotlights": { color: window.globalVars.COLORS.orange, keywords: ["theatre"] },
            "flaticon-exhibition-1": { color: window.globalVars.COLORS.orange, keywords: ["theatre"] },
            "flaticon-workspace": { color: window.globalVars.COLORS.blue, keywords: ["workspace"] },
            "flaticon-car-crash": { color: window.globalVars.COLORS.blue, keywords: ["car"] },
            "flaticon-ice-skating": { color: window.globalVars.COLORS.orange, keywords: ["skate"] },
            "flaticon-toilet-paper": { color: window.globalVars.COLORS.grey, keywords: ["toilet"] },
            "flaticon-fuel-station": { color: window.globalVars.COLORS.grey, keywords: ["fuel", "station", "gas"] },
            "flaticon-electric": { color: window.globalVars.COLORS.green, keywords: ["fuel", "station", "charge", "electric"] },
            "flaticon-charging": { color: window.globalVars.COLORS.green, keywords: ["fuel", "station", "charge", "electric"] },
        }

        let parts = window.location.href.split("/");

        if (parts[2] === "localhost:8100") {
            window.globalVars.domainName = 'http://localhost:8100/';
            window.globalVars.serverIp = 'http://localhost:8080/';
        } else {
            window.globalVars.domainName = "https://theopendatamap.com/"; //  parts[2] + "/";
            window.globalVars.serverIp = "https://theopendatamap.com/"; //  parts[2] + "/";
        }

        window.globalVars.OWN_MARKER_IMAGES = [
            "black-10",
            "blue-10",
            "green-10",
            "grey-10",
            "orange-10",
            "purple-10",
            "red-10",
            "yellow-10",
            "black-20",
            "blue-20",
            "green-20",
            "grey-20",
            "orange-20",
            "purple-20",
            "red-20",
            "yellow-20",
            "black-30",
            "blue-30",
            "green-30",
            "grey-30",
            "orange-30",
            "purple-30",
            "red-30",
            "yellow-30",
            "black-40",
            "blue-40",
            "green-40",
            "grey-40",
            "orange-40",
            "purple-40",
            "red-40",
            "yellow-40",
            "black-50",
            "blue-50",
            "green-50",
            "grey-50",
            "orange-50",
            "purple-50",
            "red-50",
            "yellow-50",
            "black-60",
            "blue-60",
            "green-60",
            "grey-60",
            "orange-60",
            "purple-60",
            "red-60",
            "yellow-60",
            "black-70",
            "blue-70",
            "green-70",
            "grey-70",
            "orange-70",
            "purple-70",
            "red-70",
            "yellow-70",
            "black-80",
            "blue-80",
            "green-80",
            "grey-80",
            "orange-80",
            "purple-80",
            "red-80",
            "yellow-80",
            "black-90",
            "blue-90",
            "green-90",
            "grey-90",
            "orange-90",
            "purple-90",
            "red-90",
            "yellow-90",
            "0-black",
            "0-blue",
            "0-green",
            "0-grey",
            "0-orange",
            "0-purple",
            "0-red",
            "0-white",
            "0-yellow",
            "1-black",
            "1-blue",
            "1-green",
            "1-grey",
            "1-orange",
            "1-purple",
            "1-red",
            "1-white",
            "1-yellow",
            "10+-black",
            "10+-blue",
            "10+-green",
            "10+-grey",
            "10+-orange",
            "10+-purple",
            "10+-red",
            "10+-white",
            "10+-yellow",
            "10-blakc",
            "10-blue",
            "10-green",
            "10-grey",
            "10-orange",
            "10-purple",
            "10-red",
            "10-white",
            "10-yellow",
            "2-black",
            "2-blue",
            "2-green",
            "2-grey",
            "2-orange",
            "2-purple",
            "2-red",
            "2-white",
            "2-yellow",
            "3-black",
            "3-blue",
            "3-green",
            "3-grey",
            "3-orange",
            "3-purple",
            "3-red",
            "3-white",
            "3-yellow",
            "4-black",
            "4-blue",
            "4-green",
            "4-grey",
            "4-orange",
            "4-purple",
            "4-red",
            "4-white",
            "4-yellow",
            "5-black",
            "5-blue",
            "5-green",
            "5-grey",
            "5-orange",
            "5-purple",
            "5-red",
            "5-white",
            "5-yellow",
            "6-black",
            "6-blue",
            "6-green",
            "6-grey",
            "6-orange",
            "6-purple",
            "6-red",
            "6-white",
            "6-yellow",
            "7-black",
            "7-blue",
            "7-green",
            "7-grey",
            "7-orange",
            "7-purple",
            "7-red",
            "7-white",
            "7-yellow",
            "8-black",
            "8-blue",
            "8-green",
            "8-grey",
            "8-orange",
            "8-purple",
            "8-red",
            "8-white",
            "8-yellow",
            "9-blakc",
            "9-blue",
            "9-green",
            "9-grey",
            "9-orange",
            "9-purple",
            "9-red",
            "9-white",
            "9-yellow",
            "black",
            "blue",
            "green",
            "grey",
            "orange",
            "purple",
            "red",
            "yellow",
            "black-half",
            "blue-half",
            "green-half",
            "grey-half",
            "orange-half",
            "purple-half",
            "red-half",
            "yellow-half",
            "black-quarter3",
            "blue-quarter3",
            "green-quarter3",
            "grey-quarter3",
            "orange-quarter3",
            "purple-quarter3",
            "red-quarter3",
            "yellow-quarter3",
            "black-quarter",
            "blue-quarter",
            "green-quarter",
            "grey-quarter",
            "orange-quarter",
            "purple-quarter",
            "red-quarter",
            "yellow-quarter",
            "black-half",
            "blue-half",
            "green-half",
            "grey-half",
            "orange-half",
            "purple-half",
            "red-half",
            "yellow-half",
            ""
        ].map(item => { return window.globalVars.serverIp + "markericons/" + item + ".png" })

        window.globalVars.profilePicturesPath = window.globalVars.serverIp + "profilepictures/"
        window.globalVars.datasetsPath = window.globalVars.serverIp + "datasets/"

        Device.getInfo().then(async function(deviceInfo) {

            console.log("APP START", deviceInfo)

            let deviceModel = deviceInfo.model.toLowerCase();
            let platform = ( (deviceModel.indexOf("macintosh") !== -1) || (deviceModel.indexOf("windows") !== -1) ) ? "desktop" : "mobile-tablet";
            let os = (["iPad", "iPhone", "iPod", "iPod Touch"].indexOf(deviceInfo.model) !== -1) ? "ios" : "android";

            if (os === "ios") {
                StatusBar.setStyle({ style: StatusBarStyle.Light });
            }

            this.setState({
                platform: platform,
                os: os
            })

            window.globalVars.platform = platform
            window.globalVars.os = os

            let el = document.documentElement
            if (el) {
                el.setAttribute("data-os", os)
                el.setAttribute("data-platform", platform)
                if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1){
                    el.setAttribute("data-firefox", "true")
                }
                if (deviceModel.indexOf("windows") !== -1) {
                    el.setAttribute("data-windows", "true")
                }
            }

            let firstLoad = await Storage.get("firstLoad");

            if (!firstLoad && platform === "desktop" && window.parent === window) {
                this.setState({ showCookieConsent: true })
                Storage.set("firstLoad", "true")
            }

        }.bind(this));

        if (window.innerWidth >= 724) {
            setupConfig({ animated: false });
            StatusBar.hide();
        }

    }

    onResize() {
        let size = (window.innerWidth < 724) ? "small" : "big";
        this.setState({
            size: size
        })
        window.globalVars.size = size;
        let el = document.documentElement
        if (el) { el.setAttribute("data-size", size) }
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.onResize.bind(this));
    }

    async componentDidMount() {

        window.addEventListener("resize", this.onResize.bind(this));

        this.onResize();

        window.globalVars.user = await Storage.getO("user");
        window.globalVars.savedLocations = (await Storage.getO("savedLocations")) || {};
        // let canTrack = await Storage.get("canTrack");

        let definitions = await Storage.getO("definitions");
        if (definitions && definitions.mapTileServer !== this.state.serverTileServer) {
            window.globalVars.mapTileServer = definitions.mapTileServer;
        }

        if (window.parent === window) {
            ReactGA.initialize('UA-159408536-1');
            ReactGA.pageview(window.location.href);
        }

        if (window.globalVars.user) {
            this.setState({
                userId: window.globalVars.user.id,
                userType: window.globalVars.user.type
            })
        }

        setInterval(async function() {

            if (window.location.href !== this.state.currentUrl) {
                let newUrl = window.location.href;
                if (window.parent === window) {
                    if (newUrl.indexOf("/directory") === -1) {
                        // console.log("=======TRACK: " + newUrl)
                        ReactGA.pageview(window.location.href);
                    }
                }
                this.setState({ currentUrl: window.location.href })
                let html = document.querySelector("html");
                if (html) {
                    html.setAttribute("data-page", newUrl)
                }

            }

        }.bind(this), 100);

        setTimeout(function() {

            Server.api({
                method: "get",
                url: "/tag",
                then: function(res) {
                    if (res.data && Array.isArray(res.data)) {
                        Storage.setO("allTags", res.data)
                    }
                }.bind(this),
                catch: function(code, error) { console.log("tags get error", error); }.bind(this)
            })

            Server.api({
                method: "get",
                url: "/definition",
                then: function(res) {
                    if (res.data && Array.isArray(res.data)) {
                        let obj = {};
                        for (let i = 0; i < res.data.length; i++) {
                            obj[res.data[i].key] = res.data[i].value;
                        }
                        Storage.setO("definitions", obj)
                    }
                }.bind(this),
                catch: function(code, error) { console.log("tags get error", error); }.bind(this)
            })

            if (window.globalVars.user && window.globalVars.user.id) {

                Server.api({
                    method: "get",
                    url: "/favorite",
                    then: function(res) {
                        if (res.data && Array.isArray(res.data)) {
                            let obj = {};
                            for (let i = 0; i < res.data.length; i++) {
                                let location = res.data[i];
                                obj[location.id] = location
                            }
                            Storage.setO("savedLocations", obj)
                        }
                    }.bind(this),
                    catch: function(code, error) { console.log("favorite get error", error); }.bind(this)
                })

                Server.api({
                    method: "get",
                    url: "/user/current",
                    then: async function(res) {
                        if (res.data && res.data.token) {
                            await Storage.setO("authToken", res.data.token);
                        }
                    }.bind(this),
                    catch: async function(code, error) {
                        console.log("failed to get user", error);
                        await Storage.clear();
                        window.location.href = "/splash"
                    }.bind(this)
                })

                // window.globalVars.savedLocations =;
            }

        }, 8000);

        SplashScreen.hide();

    }

    render() {
        return (
            <ErrorBoundary>
            <IonApp data-page={window.location.href} data-os={this.state.os} data-url={this.state.currentUrl} data-size={this.state.size} data-platform={this.state.platform}>
            <IonReactRouter>
                <IonTabs>
                    <IonRouterOutlet>

                        <Route path="/profile" component={Profile} exact />
                        <Route path="/profile/:id" component={Profile} exact />

                        <Route path="/directory/:entity/:id" component={Directory} exact={true} />
                        <Route path="/directory" component={Directory} exact={true} />

                            { (this.state.size === "big") ?
                                <Route path="/profile/:id/:direction/:section" render={(props) => <div key="profile-id-dir-section"> <Profile {...props} /> <SocialList {...props} entity="user" /> </div> } exact={true} />
                                :
                                <Route path="/profile/:id/:direction/:section" render={(props) => <SocialList {...props} entity="user" />} exact={true} />
                            }

                        { (this.state.size === "big") ?
                            <Route path="/dataset/list/organization/:id" render={(props) => <div key="dataset-list-org-id"> <Profile {...props} /> <DatasetList {...props} entity="organization" /> </div> } exact={true} />
                            :
                            <Route path="/dataset/list/organization/:id" render={(props) => <DatasetList {...props} entity="organization" />} exact={true} />
                        }

                        { (this.state.size === "big") ?
                            <Route path="/dataset/list/city/:id" render={(props) => <div key="dataset-list-city-id"> <Directory {...props} /> <DatasetList {...props} entity="city" /> </div> } exact={true} />
                            :
                            <Route path="/dataset/list/city/:id" render={(props) => <DatasetList {...props} entity="city" />} exact={true} />
                        }

                        { (this.state.size === "big") ?
                            <Route path="/dataset/list/country/:id" render={(props) => <div key="dataset-list-country-id"> <Directory {...props} /> <DatasetList {...props} entity="country" /> </div> } exact={true} />
                            :
                            <Route path="/dataset/list/country/:id" render={(props) => <DatasetList {...props} entity="country" />} exact={true} />
                        }

                        { (this.state.size === "big") ?
                            <Route path="/request/list/user/:id" render={(props) => <div key="request-list-user-id"> <Profile {...props} /> <RequestList {...props} entity="user" /> </div> } exact={true} />
                            :
                            <Route path="/request/list/user/:id" render={(props) => <RequestList {...props} entity="user" />} exact={true} />
                        }

                        { (this.state.size === "big") ?
                            <Route path="/request/list/city/:id" render={(props) => <div key="request-list-city-id"> <Directory {...props} /> <RequestList {...props} entity="city" /> </div> } exact={true} />
                            :
                            <Route path="/request/list/city/:id" render={(props) => <RequestList {...props} entity="city" />} exact={true} />
                        }

                        { (this.state.size === "big") ?
                            <Route path="/request/list/country/:id" render={(props) => <div key="request-list-country-id"> <Directory {...props} /> <RequestList {...props} entity="country" /> </div> } exact={true} />
                            :
                            <Route path="/request/list/country/:id" render={(props) => <RequestList {...props} entity="country" />} exact={true} />
                        }

                        { (this.state.size === "big") ?
                            <Route path="/location/list/organization/:id" render={(props) => <div key="location-list-org-id"> <Profile {...props} /> <LocationList {...props} entity="organization" /> </div> } exact={true} />
                            :
                            <Route path="/location/list/organization/:id" render={(props) => <LocationList {...props} entity="organization" />} exact={true} />
                        }

                        { (this.state.size === "big") ?
                            <Route path="/location/list/city/:id" render={(props) => <div key="location-list-city-id"> <Directory {...props} /> <LocationList {...props} entity="city" /> </div> } exact={true} />
                            :
                            <Route path="/location/list/city/:id" render={(props) => <LocationList {...props} entity="city" />} exact={true} />
                        }

                        { (this.state.size === "big") ?
                            <Route path="/location/list/country/:id" render={(props) => <div key="location-list-country-id"> <Directory {...props} /> <LocationList {...props} entity="country" /> </div> } exact={true} />
                            :
                            <Route path="/location/list/country/:id" render={(props) => <LocationList {...props} entity="country" />} exact={true} />
                        }

                        { (this.state.size === "big") ?
                            <Route path="/profile/:id/ckan" render={(props) => <div key="profile-id-ckan"> <Profile {...props} /> <CKANList {...props} /> </div> } exact={true} />
                            :
                            <Route path="/profile/:id/ckan" render={(props) => <CKANList {...props} />} exact={true} />
                        }

                        { (this.state.size === "big") ?
                            <Route path="/users/:type/:entity/:id" render={(props) =>
                                <div key="user-type-entity-id"> <Directory {...props} /> <UserList {...props} /> </div>
                            } exact={true} />
                            :
                            <Route path="/users/:type/:entity/:id" component={UserList} exact={true} />
                        }

                        <Route path="/map/query/:query" render={(props) => <MapView {...props} size={this.state.size} platform={this.state.platform} /> } exact={true} />
                        <Route path="/map" render={(props) => <MapView {...props} size={this.state.size} platform={this.state.platform} /> } exact={true} />

                        { (this.state.size === "big") ?
                            <Route path="/dataset/setup/:id/:section" render={(props) =>
                                <div key="dataset-setup-section">
                                    <DatasetProgress key="newoen" {...props} />
                                    <DatasetSchemaEditor {...props} size={this.state.size} platform={this.state.platform} />
                                </div>
                            } exact={true} />
                            :
                            <Route path="/dataset/setup/:id/:section" render={(props) =>
                                <DatasetSchemaEditor {...props} size={this.state.size} platform={this.state.platform} />
                            } exact={true} />
                        }

                        <Route path="/dataset/progress/:id" component={DatasetProgress} exact/>

                        <Route path="/location/:id/edit" component={LocationEditor} exact={true} />
                        <Route path="/location/:locationId" render={(props) => <MapView {...props} size={this.state.size} platform={this.state.platform} /> } exact={true} />

                        <Route path="/dataset/:id/edit" component={DatasetContentEditor} exact/>
                        <Route path="/dataset/:datasetId/map" render={(props) => <MapView {...props} size={this.state.size} platform={this.state.platform} /> } exact={true} />

                        <Route path="/request/:id/edit" component={RequestEditor} exact={true} />
                        <Route path="/request/:id" component={RequestDetails} exact={true} />

                        { (this.state.size === "big") ?
                            <Route path="/dataset/:id/content" render={(props) => <div key="dataset-i-content"> <DatasetDetails {...props} /> <DatasetContent {...props} /> </div> } exact={true} />
                            :
                            <Route path="/dataset/:id/content" render={(props) => <DatasetContent {...props} />} exact={true} />
                        }

                        { (this.state.size === "big") ?
                            <Route path="/dataset/:id/content/:keywords" render={(props) => <div key="dataset-i-content"> <DatasetDetails {...props} /> <DatasetContent {...props} /> </div> } exact={true} />
                            :
                            <Route path="/dataset/:id/content/:keywords" render={(props) => <DatasetContent {...props} />} exact={true} />
                        }

                        { (this.state.size === "big") ?
                            <Route path="/dataset/:id" render={(props) => <div key="dataseti"> <DatasetDetails size={this.state.size} platform={this.state.platform} {...props} /> <DatasetContent {...props} /> </div> } exact={true} />
                            :
                            <Route path="/dataset/:id" render={(props) => <DatasetDetails size={this.state.size} platform={this.state.platform} {...props} />} exact={true} />
                        }

                        <Route path="/login" render={(props) => <Login {...props} size={this.state.size} platform={this.state.platform} /> } exact={true} />
                        <Route path="/restore/:token" component={Login} />

                        <Route path="/admin" component={AdminDashboard} exact/>

                        <Route path="/splash" render={(props) => <Splash {...props} size={this.state.size} platform={this.state.platform} /> } exact={true} />

                        <Route path="/about" component={About} exact/>

                        { (this.state.size === "big") ?
                            <Route path="/search/guide" render={(props) => <div key="search-guide"> <About {...props} /> <SearchGuide {...props} /> </div> } exact={true} />
                            :
                            <Route path="/search/guide" component={SearchGuide} exact={true} />
                        }

                        { (this.state.size === "big") ?
                            <Route path="/contact-us/:reason/:details" render={(props) => <div key="contactusp"> <About {...props} /> <ContactUs {...props} /> </div> } exact={true} />
                            :
                            <Route path="/contact-us/:reason/:details" component={ContactUs} exact={true} />
                        }

                        { (this.state.size === "big") ?
                            <Route path="/credits" render={(props) => <div key="credits"> <About {...props} /> <Credits {...props} /> </div> } exact={true} />
                            :
                            <Route path="/credits" component={Credits} exact={true} />
                        }

                        { (this.state.size === "big") ?
                            <Route path="/contact-us" render={(props) => <div key="contact"> <About {...props} /> <ContactUs {...props} /> </div> } exact={true} />
                            :
                            <Route path="/contact-us" component={ContactUs} exact={true} />
                        }

                        { (this.state.size === "big") ?
                            <Route path="/statistics" render={(props) => <div key="statistics"> <About {...props} /> <Statistics {...props} /> </div> } exact={true} />
                            :
                            <Route path="/statistics" component={Statistics} exact={true} />
                        }

                        { (this.state.size === "big") ?
                            <Route path="/faq" render={(props) => <div key="faq"> <About {...props} /> <FAQ {...props} /> </div> } exact={true} />
                            :
                            <Route path="/faq" component={FAQ} exact={true} />
                        }

                        { (this.state.size === "big") ?
                            <Route path="/faq/:i" render={(props) => <div key="faqi"> <About {...props} /> <FAQ {...props} /> </div> } exact={true} />
                            :
                            <Route path="/faq/:i" render={(props) => <FAQ {...props} /> } exact={true} />
                        }

                        { (this.state.size === "big") ?
                            <Route path="/search" render={(props) => <div key="search"> <About {...props} /> <Search {...props} /> </div> } exact={true} />
                            :
                            <Route path="/search" component={Search} exact={true} />
                        }

                        { (this.state.size === "big") ?
                            <Route path="/legal" render={(props) => <div key="legal"> <About {...props} /> <Legal {...props} /> </div> } exact={true} />
                            :
                            <Route path="/legal" component={Legal} exact={true} />
                        }

                        <Route path="/" render={() => <Redirect to="/splash" />} exact={true} />

                        <Route path="/error/:code/:msg" component={Error} exact={true}/>

                        {/*<Route render={(props) => <div> SOMETHING ELSE </div> }  />*/}

                        <Route path="*" render={(props) =>
                            <div key="all">
                            <NewPostDrawer {...props} pathname={props.history.location.pathname} />
                            { (this.state.showCookieConsent) &&
                                <CookieConsent
                                    location="bottom"
                                    buttonText="Close"
                                    cookieName="consent"
                                    style={{ background: "#333" }}
                                    buttonStyle={{ color: "#4e503b", fontSize: "13px" }}
                                    onAccept={() => { console.log("Accepted") }}
                                >
                                    This website uses cookies for analytic purposes, by continuting to use the website you agree to these.
                                </CookieConsent>
                            }
                            </div>
                        } exact={true} />

                    </IonRouterOutlet>
                    <IonTabBar slot={ (this.state.platform === "mobile-tablet") ? "bottom" : "top" }>
                        { (this.state.platform === "desktop") &&
                            <IonTabButton tab="tab0" href="/map" className="logo">
                                <img src={AppIcon} />
                            </IonTabButton>
                        }
                        { /* (this.state.platform === "desktop") && (this.state.userType === "org") &&
                            <IonTabButton mode="md" tab="tab6" href="/34">
                                <IonIcon icon={informationCircle} />
                                <IonLabel>My Datasets</IonLabel>
                            </IonTabButton>
                        */ }
                        <IonTabButton mode="md" tab="tab1" href="/directory">
                            <IonIcon icon={book} />
                            <IonLabel>Directory</IonLabel>
                        </IonTabButton>
                        <IonTabButton mode="md" tab="tab2" href="/map">
                            <IonIcon icon={map} />
                            <IonLabel>Map</IonLabel>
                        </IonTabButton>
                        <IonTabButton mode="md" tab="tab3" href="/post">
                            <IonIcon icon={addCircle} />
                            <IonLabel>Contribute</IonLabel>
                        </IonTabButton>
                        <IonTabButton mode="md" tab="tab4" href="/profile">
                            <IonIcon icon={person} />
                            <IonLabel>Profile</IonLabel>
                        </IonTabButton>
                        <IonTabButton mode="md" tab="tab5" href="/about">
                            <IonIcon icon={informationCircle} />
                            <IonLabel>About</IonLabel>
                        </IonTabButton>

                    </IonTabBar>
                </IonTabs>
                </IonReactRouter>
            </IonApp>
            </ErrorBoundary>
        )
    }

};

export default App;
