import { Plugins } from '@capacitor/core';
import { IonContent, IonPage, withIonLifeCycle } from '@ionic/react';
import axios from "axios";
import React from 'react';
import AppStoreBadge from '../images/appstore.png';
import GooglePlayBadge from '../images/googleplay.png';
import Logo from '../images/logo.png';
import Server from '../Server.js';
import Storage from '../Storage.js';
import '../styles/Splash.scss';



const { Device } = Plugins;

class Splash extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            statistics: {

            },
            render: false,
        }
    }

    async ionViewWillEnter() {

        let splashscreenPassed = await Storage.get("splashscreenPassed");

        if (splashscreenPassed) {
            console.log("PASSEd")
            // this.props.history.push("/map")
            this.props.history.replace("/map");
            return;
        }

        console.log("NOT PASSEd")

        this.setState({ render: true })
        document.title = "Welcome" + window.globalVars.pageTitle;

        setTimeout(async function() {

            Server.api({
                method: "get",
                url: "/statistics",
                then: function(res) { this.setState({ statistics: res.data }) }.bind(this),
                catch: function(code, error) { console.error("Failed to get stats", error, code) }.bind(this)
            })

            let deviceInfoStr = "";
            let deviceInfo = await Device.getInfo();
            for (let key in deviceInfo) {
                if (deviceInfo[key])
                    deviceInfoStr += key + ": " + deviceInfo[key] + ", ";
            }

        }.bind(this))

    }

    render() {

        return (
          <IonPage data-page="splash">
              { (this.state.render && this.props.size === "big") &&
                    <picture>
                        <source type="image/webp" srcSet={process.env.PUBLIC_URL + '/assets/images/map-background-min.webp'} />
                        <source type="image/jp2" srcSet={process.env.PUBLIC_URL + '/assets/images/map-background-min.jp2'} />
                        <source type="image/jxr" srcSet={process.env.PUBLIC_URL + '/assets/images/map-background-min.jxr'} />
                        <img src={process.env.PUBLIC_URL + '/assets/images/map-background-min.png'} alt="alt description" />
                    </picture>
              }
             { (this.state.render) &&
                 <div className="splash-container">
                   <IonContent>
                       <div className="splash">
                           <img src={Logo} />
                           <div className="stats">
                               <div>
                                   <span style={{ marginRight: 10 }}>{ (this.state.statistics.locations || "20000+") }</span><label>open</label> <label>locations</label><br />
                                   <label>in</label><span style={{ marginRight: 10, marginLeft: 10 }}>{ (this.state.statistics.datasets || "10+") }</span><label>datasets</label><br />
                                   <label>spanning</label> <label>over</label><span style={{ marginRight: 10, marginLeft: 10 }}>{ (this.state.statistics.cities || "1000+") }</span><label>cities</label><br />
                                   {/*<label>and</label><span style={{ marginRight: 10, marginLeft: 10 }}>{ (this.state.statistics.countries || "10+") }</span><label>countries</label><br />*/}
                                   <label>across</label> <span style={{ marginRight: 10, marginLeft: 10 }}>{ (this.state.statistics.categories || "10+") }</span> <label>categories</label> <br />
                                   <label>posted</label> <label>by</label> <span style={{ marginLeft: 10, marginRight: 10 }}>{ (this.state.statistics.users ? (parseInt(this.state.statistics.organizations) + parseInt(this.state.statistics.users)) : "10+") }</span><label>users</label>
                               </div>
                           </div>
                           <button className="login-btn" onClick={ async() => {
                               await Storage.set("splashscreenPassed", "true");
                               window.location.href = "/";
                           }}>
                               Continue without an account
                           </button>
                           <button className="main" onClick={() => { window.location.href = "/login"  }}>
                               LOGIN / SIGN UP
                           </button>
                           { (window.globalVars.platform === "desktop") &&
                               <div className="stores">
                                   <a href="https://itunes.apple.com/gb/app/id1491419380" target="_blank">
                                       <img src={AppStoreBadge} />
                                   </a>
                                   <a href="https://play.google.com/store/apps/details?id=com.dominikgyecsek.theopendatamap" target="_blank">
                                       <img src={GooglePlayBadge} />
                                   </a>
                               </div>
                           }
                       </div>
                   </IonContent>
               </div>
             }
            { (this.state.render && this.props.platform === "desktop") &&
                 <div className="made-by">Made by <a target="_blank" href="https://dominikgyecsek.com/">Dominik Gyecsek</a></div>
            }
          </IonPage>
        );
    }

};

export default withIonLifeCycle(Splash);
