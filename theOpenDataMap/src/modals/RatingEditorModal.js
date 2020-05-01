import { IonAlert, IonButton, IonButtons, IonContent, IonFooter, IonHeader, IonIcon, IonModal, IonTextarea, IonTitle, IonToolbar, withIonLifeCycle } from '@ionic/react';
import { close, star, trash } from 'ionicons/icons';
import React from 'react';
import Server from '../Server';
import '../styles/CommentEditorModal.scss';
import '../styles/RatingEditorModal.scss';
import { Plugins } from '@capacitor/core';

class RatingEditorModal extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            error: null,
            loading: false,
        }
    }

    setStars(stars) {
        this.setState({ rating: stars })
    }

    componentWillReceiveProps(nextProps) {

        if (nextProps.open !== this.props.open) {

            if (nextProps.rating) {
                this.setState(nextProps.rating)
            }

        }

    }

    delete() {

        this.setState({ loading: true })

        Server.api({
            method: "DELETE",
            url: "/rating/" + this.state.id,
            then: function(res) {
                console.log("COMMENT Deleted", res.data);
                this.props.onSubmit(true, "Rating deleted");
                this.setState({ loading: false })
            }.bind(this),
            catch: function(code, error) {
                console.log("COMMENT delete ERROR", error);
                // this.props.onSubmit(false, "Failed to delete rating");
                this.setState({
                    error: error,
                    loading: false,
                })
            }.bind(this)
        })

    }

    postRating() {

        this.setState({ loading: true })

        let method = "POST";
        let url = "/rating/" + this.props.type + "/" + this.props.id;

        if (this.state.id !== 0) {
            method = "PUT";
            url = "/rating/" + this.state.id
        }

        Server.api({
            method: method,
            url: url,
            data: this.state,
            then: function(res) {
                console.log("COMMENT DONE", res.data);
                this.props.onSubmit(true, "Rating posted");
                this.setState({ loading: false })
            }.bind(this),
            catch: function(code, error) {
                console.log("COMMENT ERROR", error);
                // this.props.onSubmit(false, "Failed to post rating");
                this.setState({
                    error: error,
                    loading: false,
                })
            }.bind(this)
        })

    }

    render() {
        return (
            <IonModal
                isOpen={this.props.open}
                presentingElement={(this.props.presentingElement && (window.globalVars === undefined || window.globalVars.size !== "big")) ? this.props.presentingElement.current : undefined}
                onDidDismiss={ () => { this.props.close(); } }
                swipeToClose={true}
                className="comment-editor-modal rating-editor-modal"
            >
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>{(this.state.id === 0) ? "Post" : "Edit"} Rating</IonTitle>
                        <IonButtons slot="end">
                            <IonIcon icon={close} onClick={() => { this.props.close() }}></IonIcon>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <div className="comment rating">
                        <div className="stars" data-rating={this.state.rating}>
                            <span onClick={() => { this.setStars(1) }}> <IonIcon icon={star} /> </span>
                            <span onClick={() => { this.setStars(2) }}> <IonIcon icon={star} /> </span>
                            <span onClick={() => { this.setStars(3) }}> <IonIcon icon={star} /> </span>
                            <span onClick={() => { this.setStars(4) }}> <IonIcon icon={star} /> </span>
                            <span onClick={() => { this.setStars(5) }}> <IonIcon icon={star} /> </span>
                        </div>
                        <IonTextarea
                            value={this.state.body}
                            placeholder="Brief description"
                            onIonChange={(e) => {
                                this.setState({ body: e.target.value })
                            }}
                        />
                    </div>
                </IonContent>
                <IonFooter>
                    <div className="options">
                        { (this.state.id !== 0) &&
                            <IonButton
                                disabled={this.state.loading}
                                className="delete-btn"
                                color="danger"
                                onClick={() => { this.setState({ deleteConfirmModal: true }) }}
                            >
                                <IonIcon slot="icon-only" icon={trash} />
                            </IonButton>
                        }
                        <IonButton disabled={this.state.loading} className="save-btn" onClick={() => { this.postRating(); }}>{this.state.id === 0 ? "Post" : "Update"}</IonButton>
                    </div>
                </IonFooter>
                <IonAlert
                    isOpen={this.state.error !== null}
                    onDidDismiss={() => { this.setState({ error: null }) }}
                    message={this.state.error}
                    buttons={[
                        { text: 'Close' },
                    ]}
                />
                <IonAlert
                    isOpen={this.state.deleteConfirmModal}
                    onDidDismiss={() => { this.setState({ deleteConfirmModal: false }) }}
                    message={"Are you sure you want to delete this rating?"}
                    buttons={[
                        { text: 'Cancel' },
                        { text: 'Delete', handler: () => { this.delete() } }
                    ]}
                />

            </IonModal>
        );
    }

};

export default withIonLifeCycle(RatingEditorModal);
