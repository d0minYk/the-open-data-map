import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonPage, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToolbar, withIonLifeCycle } from '@ionic/react';
import React from 'react';
import Server from '../Server.js';
import '../styles/ContactUs.scss';

const REASONS = [
    "Inappropriate, updated, moved or closed location",
    "Inappropriate user behaviour or content",
    "Other inappropriate or wrong content",
    // "Request new dataset",
    "Request organization account",
    "Request account deletion",
    "Request personal data",
    "Feedback",
    "Other"
]

class ContactUs extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            reason: "",
            body: "",
            status: null,
            postButtonDisabled: false,
            email: "",
            loaded: false,
        }
    }

    reset() {

        this.setState({
            reason: "",
            body: "",
            status: null,
            postButtonDisabled: false,
            email: "",
            loaded: false,
        }, function() {
            if (this.props.match.params.reason && this.props.match.params.details) {
                this.setState({
                    reason: this.props.match.params.reason,
                    body: this.props.match.params.details,
                    loaded: true,
                })
            } else {
                this.setState({ loaded: true })
            }
        })

    }

    async ionViewWillEnter() {
        document.title = "Contact Us" + window.globalVars.pageTitle;
        this.reset();
    }

    post() {

        this.setState({ status: null })

        Server.api({
            method: "post",
            url: "/contact-us/",
            data: {
                email: this.state.email,
                reason: this.state.reason,
                body: this.state.body,
            },
            then: function(res) {
                console.log("SENT", res);
                this.reset();
                this.setState({
                    status: {
                        success: true,
                        data: "Request submitted"
                    }
                })
            }.bind(this),
            catch: function(code, error) {
                console.log("COMMENT ERROR", error, code);
                this.setState({
                    status: {
                        success: false,
                        data: error || "Unexpected Error"
                    }
                })
            }.bind(this)
        })

    }

    render() {
        return (
            <IonPage data-page="contact-us">
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                        <IonBackButton onClick={() => { this.props.history.goBack();  }} />
                    </IonButtons>
                    <IonTitle>Contact Us</IonTitle>
                </IonToolbar>
                </IonHeader>
                <IonContent>
                    <IonList>
                        { (!window.globalVars.user) &&
                            <IonItem>
                                <IonLabel position="stacked">Email</IonLabel>
                                <IonInput value={this.state.email} onIonChange={(e) => { this.setState({ "email": e.target.value}) }} placeholder="Email (optional)" type="text"></IonInput>
                            </IonItem>
                        }
                        { (this.state.loaded) &&
                            <IonItem>
                                <IonLabel position="stacked">Reason</IonLabel>
                                <IonSelect value={this.state.reason} multiple={false} okText="Save" onIonChange={(e) => { this.setState({ reason: e.target.value }) }}>
                                    { REASONS.map(reason => {
                                        return <IonSelectOption key={reason} value={reason}>{reason}</IonSelectOption>
                                    }) }
                                </IonSelect>
                            </IonItem>
                        }
                        { (this.state.reason === "Inappropriate, updated, moved or closed location") &&
                            <p className="info">The easiest way to report a location just open the location and select the report option (warning icon), a notification will be immediately sent to the owner of the location, if this hasn't solved the problem then use the below textarea to describe the issue quoting the link of the location.</p>
                        }
                        { (this.state.reason === "Request organization account") &&
                            <p className="info">Please include the city and country where your organization or council is based.</p>
                        }
                        <IonItem>
                            <IonLabel position="stacked">More details</IonLabel>
                            <IonTextarea
                                value={this.state.body}
                                rows={6}
                                cols={20}
                                onIonChange={(e) => { this.setState({ body: e.target.value }) }}
                            />
                        </IonItem>
                        { (this.state.status) &&
                            <p data-success={this.state.status.success} className="status">{this.state.status.data}</p>
                        }
                        <IonButton
                            disabled={this.state.postButtonDisabled}
                            className="submit-btn"
                            expand="block"
                            onClick={() => { this.post(); }}
                        >Send</IonButton>
                    </IonList>
                </IonContent>
            </IonPage>
        );
    }

};

export default withIonLifeCycle(ContactUs);
