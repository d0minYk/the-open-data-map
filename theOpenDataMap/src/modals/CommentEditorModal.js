import { IonAlert, IonButton, IonButtons, IonContent, IonFooter, IonHeader, IonIcon, IonModal, IonTextarea, IonTitle, IonToolbar, withIonLifeCycle } from '@ionic/react';
import { close, trash } from 'ionicons/icons';
import React from 'react';
import Server from '../Server';
import '../styles/CommentEditorModal.scss';

class CommentEditorModal extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            error: null,
            loading: false,
        }
    }

    componentWillReceiveProps(nextProps) {

        if (nextProps.open !== this.props.open) {

            if (nextProps.comment) {
                this.setState(nextProps.comment)
            }

        }

    }

    delete() {

        this.setState({ loading: true })

        Server.api({
            method: "DELETE",
            url: "/comment/" + this.state.id,
            then: function(res) {
                this.props.onSubmit(true, "Comment deleted");
                this.setState({ loading: false })
            }.bind(this),
            catch: function(code, error) {
                this.setState({
                    error: error,
                    loading: false,
                })
            }.bind(this)
        })

    }

    postComment() {

        this.setState({ loading: true })

        let method = "POST";
        let url = "/comment/" + this.props.type + "/" + this.props.id;

        if (this.state.id !== 0) {
            method = "PUT";
            url = "/comment/" + this.state.id
        }

        Server.api({
            method: method,
            url: url,
            data: this.state,
            then: function(res) {
                this.props.onSubmit(true, "Comment posted");
                this.setState({ loading: false })
            }.bind(this),
            catch: function(code, error) {
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
                className="comment-editor-modal"
            >
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>{(this.state.id === 0) ? "Post" : "Edit"} Comment</IonTitle>
                        <IonButtons slot="end">
                            <IonIcon icon={close} onClick={() => { this.props.close() }}></IonIcon>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <div className="comment">
                        <IonTextarea
                            value={this.state.body}
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
                        <IonButton disabled={this.state.loading} className="save-btn" onClick={() => { this.postComment(); }}>{this.state.id === 0 ? "Post" : "Update"}</IonButton>
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
                    message={"Are you sure you want to delete this comment?"}
                    buttons={[
                        { text: 'Cancel' },
                        { text: 'Delete', handler: () => { this.delete() } }
                    ]}
                />
            </IonModal>
        );
    }

};

export default withIonLifeCycle(CommentEditorModal);
