import { IonAlert, IonIcon, withIonLifeCycle } from '@ionic/react';
import { thumbsUpOutline } from 'ionicons/icons';
import React from 'react';
import Server from '../Server';

class LikeButton extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            likes: ( (props.likes) && (props.source === "parent") ) ? props.likes : [],
            loaded: ( (props.likes) && (props.source === "parent") ) ? true : false,
            error: null,
        }
    }

    toggleLike() {

        if (!window.globalVars.user) {
            this.props.history.push("/login")
            return;
        }

        let likes = this.state.likes;

        if (likes.filter(item => { return item.userId === window.globalVars.user.id} ).length !== 0) {
            this.setState({ likes: likes.filter(item => { return item.userId !== window.globalVars.user.id} ) })
        } else {
            likes.push({
                id: 0,
                userId: window.globalVars.user.id
            })
            this.setState({ likes: likes })
        }

        Server.api({
            method: "post",
            url: "/like/" + this.props.type + "/" + this.props.id,
            then: function(res) {
                console.log("LIKE DONE", res.data);
            }.bind(this),
            catch: function(code, error) {
                console.log("LIKE ERROR", error);
                this.setState({ error: error })
            }.bind(this)
        })

    }

    render() {
        return (
            <div
                data-highlighted={(this.state.likes.filter(item => { return ( (window.globalVars.user) && (item.userId === window.globalVars.user.id) ) } ).length !== 0)}
                onClick={() => { if (!this.props.noClickAction) this.toggleLike(); }}
            >
                <IonIcon icon={thumbsUpOutline} mode="md"></IonIcon>
                <label>
                    {this.state.likes.length}
                    <span>Like</span>
                </label>
                <IonAlert
                    isOpen={this.state.error !== null}
                    onDidDismiss={() => { this.setState({ error: null }) }}
                    message={this.state.error}
                    buttons={[
                        { text: 'Close' },
                    ]}
                />
            </div>
        );
    }

};

export default withIonLifeCycle(LikeButton);
