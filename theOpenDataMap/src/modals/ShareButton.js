import { Plugins } from '@capacitor/core';
import { IonIcon, withIonLifeCycle } from '@ionic/react';
import { shareSocialOutline } from 'ionicons/icons';
import React from 'react';
import ShareModal from './ShareModal.js';
import Server from '../Server.js';

const { Share } = Plugins;

class ShareButton extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            shareModal: false
        }
    }

    async openModal() {

        if (!this.props.noClickAction) {

            if (window.globalVars.platform === "desktop") {
                this.setState({ shareModal: true })
            } else {
                let shareRet = await Share.share({
                  title: this.props.title,
                  text: this.props.title,
                  url: this.props.link,
                  dialogTitle: this.props.title,
                });

                this.logShare("clipboard")

            }

        }

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

    }

    render() {
        return (
            <div
                data-highlighted={( (this.state.justShared) || ( (this.props.shares) && (this.props.shares.filter(item => { return window.globalVars.user && item.userId === window.globalVars.user.id} ).length !== 0) ) )}
            >
                <IonIcon onClick={() => { this.openModal() }} mode="md" icon={shareSocialOutline}></IonIcon>
                <label onClick={() => { this.openModal() }}>
                    {(this.props.shares) ? (this.state.justShared ? this.props.shares.length + 1 : this.props.shares.length) : (this.state.justShared ? 1 : 0) }
                    <span>Share</span>
                </label>
                <ShareModal
                    modal={this.state.shareModal}
                    id={this.props.id}
                    presentingElement={this.props.presentingElement}
                    quote={this.props.quote}
                    title={this.props.title}
                    type={this.props.type}
                    link={this.props.link}
                    onClose={ () => { console.log("CLOSING"); this.setState({ shareModal: false })  } }
                    onShare={ () => { this.setState({ justShared: true }) } }
                />
            </div>
        );
    }

};

export default withIonLifeCycle(ShareButton);
