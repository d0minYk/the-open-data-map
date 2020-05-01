import { Plugins } from '@capacitor/core';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonModal, IonTitle, IonToolbar, withIonLifeCycle } from '@ionic/react';
import { close } from 'ionicons/icons';
import React from 'react';
import { FacebookIcon, FacebookShareButton, InstapaperIcon, InstapaperShareButton, LineIcon, LineShareButton, PocketIcon, PocketShareButton, RedditIcon, RedditShareButton, TelegramIcon, TelegramShareButton, TumblrIcon, TumblrShareButton, TwitterIcon, TwitterShareButton, ViberIcon, ViberShareButton, WhatsappIcon, WhatsappShareButton } from "react-share";
import Server from '../Server.js';
import '../styles/ShareModal.scss';

const { Clipboard } = Plugins;

class ShareModal extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            copyToClipboardText: "Copy to clipboard",
            copyIframeToClipboardText: "Copy Iframe link to clipboard",
            copyIframeExtendedToClipboardText: "Copy Iframe map to clipboard"
        }
    }

    copyLink() {
        console.log("Copyign...");
        Clipboard.write({
            string: this.props.link
        });
        this.setState({ copyToClipboardText: "Copied!" })
        this.logShare("clipboard")
    }

    copyIframeExtended() {

        let iframelink = window.globalVars.serverIp;

        if (this.props.type === "dataset") {
            iframelink += "dataset/" + this.props.id + "/map"
        } else if (this.props.type === "location") {
            iframelink += "location/" + this.props.id
        }

        Clipboard.write({
            string: `<iframe style="border:none;width:100%;height:560px" src="${iframelink}"></iframe>`
        });

        this.setState({ copyIframeExtendedToClipboardText: "Copied!" })
        this.logShare("iframe")

    }

    async copyIframe() {

        console.log("Copyign...", this.props);

        let iframelink = window.globalVars.serverIp + "widget/";

        if (this.props.type === "dataset") {
            iframelink += "dataset/" + this.props.id
        } else if (this.props.type === "request") {
            iframelink += "request/" + this.props.id
        }  else if (this.props.type === "location") {
            iframelink += "location/" + this.props.id
        }

        Clipboard.write({
            string: `<iframe style="border:none;width:100px;height:38px" src="${iframelink}"></iframe>`
        });

        this.setState({ copyIframeToClipboardText: "Copied!" })
        this.logShare("iframe")

    }

    logShare(platform) {

        if (!window.globalVars.user) {
            console.log("not logged in, cannot log")
            return;
        }

        Server.api({
            method: "post",
            url: "/share/" + this.props.type + "/" + this.props.id + "/" + platform,
            then: function(res) { console.log("Share logged"); }.bind(this),
            catch: function(code, error) { console.error("Share log error", error); }.bind(this)
        })

        this.props.onShare();

    }

    render() {
        return (
            <IonModal
                isOpen={this.props.modal}
                onDidDismiss={ () => { this.props.onClose(); } }
                presentingElement={(this.props.presentingElement && (window.globalVars === undefined || window.globalVars.size !== "big")) ? this.props.presentingElement.current : undefined}
                swipeToClose={true}
                data-modal="share-modal"
            >
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Share {this.props.title}</IonTitle>
                        <IonButtons slot="end" onClick={() => { this.props.onClose() }}>
                            <IonIcon icon={close}></IonIcon>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <div>
                        <div className="platforms">
                            <FacebookShareButton onClick={() => { this.logShare("facebook") }} url={this.props.link} quote={this.props.quote} className="platform facebook"> <FacebookIcon /> </FacebookShareButton>
                            <InstapaperShareButton onClick={() => { this.logShare("instapaper") }} url={this.props.link} quote={this.props.quote} className="platform facebook"> <InstapaperIcon /> </InstapaperShareButton>
                            <LineShareButton onClick={() => { this.logShare("line") }} url={this.props.link} quote={this.props.quote} className="platform facebook"> <LineIcon /> </LineShareButton>
                            <PocketShareButton onClick={() => { this.logShare("pocket") }} url={this.props.link} quote={this.props.quote} className="platform facebook"> <PocketIcon /> </PocketShareButton>
                            <RedditShareButton onClick={() => { this.logShare("reddit") }} url={this.props.link} quote={this.props.quote} className="platform facebook"> <RedditIcon /> </RedditShareButton>
                            <TelegramShareButton onClick={() => { this.logShare("telegram") }} url={this.props.link} quote={this.props.quote} className="platform facebook"> <TelegramIcon /> </TelegramShareButton>
                            <TumblrShareButton onClick={() => { this.logShare("tumblr") }} url={this.props.link} quote={this.props.quote} className="platform facebook"> <TumblrIcon /> </TumblrShareButton>
                            <TwitterShareButton onClick={() => { this.logShare("twitter") }} url={this.props.link} quote={this.props.quote} className="platform facebook"> <TwitterIcon /> </TwitterShareButton>
                            <ViberShareButton onClick={() => { this.logShare("viber") }} url={this.props.link} quote={this.props.quote} className="platform facebook"> <ViberIcon /> </ViberShareButton>
                            <WhatsappShareButton onClick={() => { this.logShare("whatsapp") }} url={this.props.link} quote={this.props.quote} className="platform facebook"> <WhatsappIcon /> </WhatsappShareButton>
                        </div>
                        <IonButton expand="block" onClick={() => { this.copyLink(); }}>{this.state.copyToClipboardText}</IonButton>
                        <IonButton expand="block" onClick={() => { this.copyIframe(); }}>{this.state.copyIframeToClipboardText}</IonButton>
                        { (this.props.type === "location" || this.props.type === "dataset") &&
                            <IonButton expand="block" onClick={() => { this.copyIframeExtended(); }}>{this.state.copyIframeExtendedToClipboardText}</IonButton>
                        }
                    </div>
                </IonContent>
            </IonModal>
        );
    }

};

export default withIonLifeCycle(ShareModal);
