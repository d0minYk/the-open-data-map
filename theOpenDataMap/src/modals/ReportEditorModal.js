import { IonAlert, IonButton, IonButtons, IonContent, IonFooter, IonHeader, IonIcon, IonModal, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToolbar, withIonLifeCycle } from '@ionic/react';
import { close, trash } from 'ionicons/icons';
import React from 'react';
import Server from '../Server';
import '../styles/CommentEditorModal.scss';
import '../styles/ReportEditorModal.scss';

const REASONS_LOCATION = [
    "Select Reason",
    "Moved Permanently",
    "Closed Permanently",
    "Moved Temporarily",
    "Closed Temporarily",
    "Non-existent",
    "Suggest Edit",
    "Inappropriate",
    "Duplicate"
]

const REASONS_DATASET = [
    "Select Reason",
    "Suggest Edit",
    "Inappropriate",
    "Duplicate",
    "Other Issue",
]

const REASONS_REQUEST = [
    "Select Reason",
    "Suggest Edit",
    "Inappropriate",
    "Duplicate",
    "Other Issue"
]

class ReportEditorModal extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            error: null,
            loading: false,
        }
    }

    componentWillReceiveProps(nextProps) {

        if (nextProps.open !== this.props.open) {

            if (nextProps.report) {
                this.setState(nextProps.report)
            }

        }

    }

    delete() {

        this.setState({ loading: true })

        Server.api({
            method: "DELETE",
            url: "/report/" + this.state.id,
            then: function(res) {
                console.log("COMMENT Deleted", res.data);
                this.props.onSubmit(true, "Report deleted");
                this.setState({ loading: false })
            }.bind(this),
            catch: function(code, error) {
                console.log("COMMENT delete ERROR", error);
                // this.props.onSubmit(false, "Failed to delete report");
                this.setState({
                    error: error,
                    loading: false,
                })
            }.bind(this)
        })

    }

    postReport() {

        this.setState({ loading: true })

        let method = "POST";
        let url = "/report/" + this.props.type + "/" + this.props.id;

        if (this.state.id !== 0) {
            method = "PUT";
            url = "/report/" + this.state.id
        }

        Server.api({
            method: method,
            url: url,
            data: this.state,
            then: function(res) {
                console.log("COMMENT DONE", res.data);
                this.props.onSubmit(true, "Report posted");
                this.setState({ loading: false })
            }.bind(this),
            catch: function(code, error) {
                console.log("COMMENT ERROR", error);
                // this.props.onSubmit(false, "Failed to post report");
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
                className="comment-editor-modal report-editor-modal"
            >
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>{(this.state.id === 0) ? "Post" : "Edit"} Report</IonTitle>
                        <IonButtons slot="end">
                            <IonIcon icon={close} onClick={() => { this.props.close() }}></IonIcon>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <div className="comment report">
                        <IonSelect value={this.state.cause} multiple={false} okText="Save" onIonChange={(e) => {
                            this.setState({ cause: e.target.value })
                        }}>
                            { (this.props.type === "location") && REASONS_LOCATION.map(cause => { return (<IonSelectOption key={cause} value={cause}>{cause}</IonSelectOption>) }) }
                            { (this.props.type === "request") && REASONS_REQUEST.map(cause => { return (<IonSelectOption key={cause} value={cause}>{cause}</IonSelectOption>) }) }
                            { (this.props.type === "dataset") && REASONS_DATASET.map(cause => { return (<IonSelectOption key={cause} value={cause}>{cause}</IonSelectOption>) }) }
                        </IonSelect>
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
                        <IonButton disabled={this.state.loading} className="save-btn" onClick={() => { this.postReport(); }}>{this.state.id === 0 ? "Post" : "Update"}</IonButton>
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
                    message={"Are you sure you want to delete this report?"}
                    buttons={[
                        { text: 'Cancel' },
                        { text: 'Delete', handler: () => { this.delete() } }
                    ]}
                />
            </IonModal>
        );
    }

};

export default withIonLifeCycle(ReportEditorModal);
