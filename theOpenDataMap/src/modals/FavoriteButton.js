import { IonIcon, withIonLifeCycle } from '@ionic/react';
import { bookmark, bookmarkOutline } from 'ionicons/icons';
import React from 'react';
import Server from '../Server';
import Storage from '../Storage';


class LikeButton extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            saved: false,
        }
    }

    componentDidMount() {

        if (!window.globalVars.savedLocations || !this.props.id) {
            setTimeout(function() { this.componentDidMount(); }.bind(this), 250);
            return;
        }

        this.setState({ saved: window.globalVars.savedLocations[this.props.id] ? true : false })

    }

    async toggle() {

        if (!window.globalVars.user) {
            this.props.history.push("/login");
            return;
        }

        if (window.globalVars.savedLocations[this.props.id]) {

            delete window.globalVars.savedLocations[this.props.id];

            Server.api({
                method: "delete",
                url: "/favorite/" + this.props.id,
                then: function(res) {
                    console.log("favorite saved", res.data);
                }.bind(this),
                catch: function(code, error) {
                    console.log("favorite ERROR", error);
                }.bind(this)
            })

        } else {

            window.globalVars.savedLocations[this.props.id] = this.props.meta;

            Server.api({
                method: "post",
                url: "/favorite/" + this.props.id,
                then: function(res) {
                    console.log("favorite saved", res.data);
                }.bind(this),
                catch: function(code, error) {
                    console.log("favorite ERROR", error);
                }.bind(this)
            })

        }

        await Storage.setO("savedLocations", window.globalVars.savedLocations);

        this.setState({ saved: !this.state.saved });

    }

    render() {

        return (
            <div
                data-highlighted={this.state.saved}
                onClick={() => { this.toggle(); }}
                key={"fav-btn-" + this.props.id}
            >
                <IonIcon icon={this.state.saved ? bookmark : bookmarkOutline}></IonIcon>
                <label>
                    <span style={{ display: "block" }}>{this.state.saved ? "Saved" : "Save"}</span>
                </label>
            </div>
        );
    }

};

export default withIonLifeCycle(LikeButton);
