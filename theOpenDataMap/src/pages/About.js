import { Plugins } from '@capacitor/core';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonPage, IonTitle, IonToolbar, withIonLifeCycle } from '@ionic/react';
import { at, documentTextOutline, helpCircleOutline, informationCircleOutline, logoAppleAppstore, logoGooglePlaystore, podiumOutline, ribbonOutline, search, shareSocialOutline, starOutline } from 'ionicons/icons';
import React from 'react';
import ShareModal from '../modals/ShareModal.js';
import '../styles/About.scss';
const { Device, Share } = Plugins;

class About extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            deviceInfo: {},
            shareModal: false,
        }
    }

    async ionViewWillEnter() {
        document.title = "About" + window.globalVars.pageTitle;
        let deviceInfo = await Device.getInfo();
        this.setState({
            deviceInfo: deviceInfo
        })
    }

    async openShare() {

        if (window.globalVars.platform === "desktop") {
            this.setState({ shareModal: true })
        } else {
            let shareRet = await Share.share({
              title: "The Open Data Map",
              text: "The Open Data Map is a portal that enables everyone to visualize, search and explore location-based datasets posted by organizations and governments and where people can open requests, post locations and report, rate, like, share and comment on datasets and locations.",
              url: "https://theopendatamap.com",
              dialogTitle: "The Open Data Map is a portal that enables everyone to visualize, search and explore location-based datasets posted by organizations and governments and where people can open requests, post locations and report, rate, like, share and comment on datasets and locations.",
            });
        }

    }

    render() {
        return (
            <IonPage data-page="about">
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="starOutlinet">
                        <IonBackButton onClick={() => { this.props.history.goBack();  }} />
                    </IonButtons>
                    <IonTitle>About Us</IonTitle>
                </IonToolbar>
                </IonHeader>
                <IonContent>
                    <IonList>
                        <IonItem className="head" style={{ "--border-color": "transparent" }}>
                            <IonLabel position="stacked" className="ion-text-wrap" style={{ transform: "none", marginTop: 10, marginBottom: 4, fontWeight: 400 }}>
                                <div>The Open Data Map is a portal that enables everyone to visualize, search and explore location-based datasets posted by organizations and governments and where people can open requests, post locations and report, rate, like, share and comment on datasets and locations.</div>
                            </IonLabel>
                        </IonItem>
                        <IonItem onClick={() => { this.props.history.push("/search") }}>
                            <IonIcon icon={search} />
                            <IonLabel className="ion-text-wrap">
                                <h2>Advanced API Search</h2>
                                <h3>Build advanced queries for the Open Data Map API.</h3>
                            </IonLabel>
                        </IonItem>
                        <IonItem onClick={() => { this.props.history.push("/search/guide") }}>
                            <IonIcon icon={informationCircleOutline} />
                            <IonLabel className="ion-text-wrap">
                                <h2>API Documentation</h2>
                                <h3>API Documentation for the Open Data Map</h3>
                            </IonLabel>
                        </IonItem>
                        <IonItem onClick={() => { this.props.history.push("/faq") }}>
                            <IonIcon icon={helpCircleOutline} />
                            <IonLabel className="ion-text-wrap">
                                <h2>Frequently Asked Questions</h2>
                            </IonLabel>
                        </IonItem>
                        <IonItem onClick={() => { this.props.history.push("/contact-us") }}>
                            <IonIcon icon={at} />
                            <IonLabel className="ion-text-wrap">
                                <h2>Contact Us</h2>
                                <h3>Write to us with any concern, feedback or requests.</h3>
                            </IonLabel>
                        </IonItem>
                        <IonItem onClick={() => { this.props.history.push("/legal") }}>
                            <IonIcon icon={documentTextOutline} />
                            <IonLabel className="ion-text-wrap">
                                <h2>Legal</h2>
                                <h3>Read our Terms & Condition and Privacy Policy</h3>
                            </IonLabel>
                        </IonItem>
                        <IonItem onClick={() => { this.props.history.push("/statistics") }}>
                            <IonIcon icon={podiumOutline} />
                            <IonLabel className="ion-text-wrap">
                                <h2>Statistics and Leaderboards</h2>
                                <h3>See global statistics and top cities, countries, users and organizations</h3>
                            </IonLabel>
                        </IonItem>
                        <IonItem onClick={() => { this.props.history.push("/credits") }}>
                            <IonIcon icon={ribbonOutline} />
                            <IonLabel className="ion-text-wrap">
                                <h2>Credits</h2>
                                <h3>Frameworks, libraries, datasources and other third party assets used to create the Open Data Map</h3>
                            </IonLabel>
                        </IonItem>
                        { (this.state.deviceInfo.platform === "ios") &&
                            <IonItem onClick={() => { window.open("https://itunes.apple.com/gb/app/id1491419380") }}>
                                <IonIcon icon={starOutline} />
                                <IonLabel className="ion-text-wrap">
                                    <h2>Rate in the AppStore</h2>
                                    <h3>Help spread the word by giving us a review in the AppStore</h3>
                                </IonLabel>
                            </IonItem>
                        }
                        { (this.state.deviceInfo.platform === "android") &&
                            <IonItem onClick={() => { window.open("https://play.google.com/store/apps/details?id=com.dominikgyecsek.theopendatamap") }}>
                                <IonIcon icon={starOutline} />
                                <IonLabel className="ion-text-wrap">
                                    <h2>Rate in Google Play</h2>
                                    <h3>Help spread the word by giving us a review in Google Play</h3>
                                </IonLabel>
                            </IonItem>
                        }
                        <IonItem onClick={() => { this.openShare(); }}>
                            <IonIcon icon={shareSocialOutline} />
                            <IonLabel className="ion-text-wrap">
                                <h2>Share us on social media</h2>
                                <h3>Help spread the word by giving us a shout on social media</h3>
                            </IonLabel>
                        </IonItem>
                        { (this.state.deviceInfo.platform === "web") &&
                            <IonItem onClick={() => { window.open("https://itunes.apple.com/gb/app/id1491419380") }}>
                                <IonIcon icon={logoAppleAppstore} />
                                <IonLabel className="ion-text-wrap">
                                    <h2>Download on the AppStore</h2>
                                </IonLabel>
                            </IonItem>
                        }
                        { (this.state.deviceInfo.platform === "web") &&
                            <IonItem onClick={() => { window.open("https://play.google.com/store/apps/details?id=com.dominikgyecsek.theopendatamap") }}>
                                <IonIcon icon={logoGooglePlaystore} />
                                <IonLabel className="ion-text-wrap">
                                    <h2>Get it on Google Play</h2>
                                </IonLabel>
                            </IonItem>
                        }
                    </IonList>
                </IonContent>
                <ShareModal
                    modal={this.state.shareModal}
                    id={0}
                    quote={"The Open Data Map is a portal that enables everyone to visualize, search and explore location-based datasets posted by organizations and governments and where people can open requests, post locations and report, rate, like, share and comment on datasets and locations."}
                    title={"The Open Data Map"}
                    type="website"
                    link={"https://theopendatamap.com"}
                    onClose={ () => { setTimeout(function() { this.setState({ shareModal: false }) }.bind(this), 100)  } }
                    onShare={ () => { this.setState({ justShared: true }) } }
                />
            </IonPage>
        );
    }

};

export default withIonLifeCycle(About);
