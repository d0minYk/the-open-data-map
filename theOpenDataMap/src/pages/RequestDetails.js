import { IonAlert, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonLoading, IonPage, IonTitle, IonToast, IonToolbar, withIonLifeCycle } from '@ionic/react';
import React, { createRef } from 'react';
import Comments from '../modals/Comments.js';
import Ratings from '../modals/Ratings.js';
import Reports from '../modals/Reports.js';
import SocialActions from '../modals/SocialActions.js';
import UserBadge from '../modals/UserBadge.js';
import Server from '../Server.js';
import Storage from '../Storage.js';
import '../styles/RequestDetails.scss';

class RequestDetails extends React.Component {

    constructor(props) {
        super(props)
        this.pageRef = createRef();
        this.state = {
            loadingMessage: null,
            minorNotification: null,
            alertMessage: null,
            canEdit: false,
        }
    }

    async getRequest() {

        let user = await Storage.getO("user");

        this.setState({
            ownUserId: (user ? user.id : null),
            ownUserType: (user ? user.type : null),
            loadingMessage: "Getting request",
        })

        Server.api({
            method: "get",
            url: "/request/" + this.props.match.params.id,
            then: function(res) {

                if (res.data) {

                    console.log("Request", res.data)

                    this.setState({
                        name: res.data.name,
                        details: res.data.description,
                        cityId: res.data.cityId,
                        cityName: res.data.cityName,
                        countryName: res.data.countryName,
                        countryId: res.data.countryId,
                        status: res.data.status,
                        requestor: res.data.requestor,
                        dataset: res.data.dataset,
                        datasetId: res.data.datasetId,
                        asignee: res.data.asignee,
                        requestorId: res.data.requestorId,
                        asigneeId: res.data.asigneeId,
                        canEdit: (res.data.requestorId === this.state.ownUserId || res.data.asigneeId === this.state.ownUserId),
                        likes: res.data.likes,
                        comments: res.data.comments,
                        ratings: res.data.ratings,
                        shares: res.data.shares,
                        reports: res.data.reports,
                    })

                }

                this.setState({
                    loadingMessage: null
                })

            }.bind(this),
            catch: function(code, error) {
                this.setState({
                    alertMessage: "Failed to get request",
                    loadingMessage: null,
                })
            }.bind(this)
        })

    }

    async unassign() {

        this.setState({ loadingMessage: "Removing assignment" })

        Server.api({
            method: "delete",
            url: "/request/" + this.props.match.params.id + "/assignment",
            then: function(res) {
                this.getRequest();
            }.bind(this),
            catch: function(code, error) {
                this.setState({
                    alertMessage: "Failed to unassign",
                    loadingMessage: null,
                })
            }.bind(this)
        })

    }

    async assign() {

        this.setState({ loadingMessage: "Adding assignment" })

        Server.api({
            method: "put",
            url: "/request/" + this.props.match.params.id + "/assignment",
            then: function(res) {
                this.getRequest();
            }.bind(this),
            catch: function(code, error) {
                this.setState({
                    alertMessage: "Failed to assign",
                    loadingMessage: null,
                })
            }.bind(this)
        })

    }

    async ionViewWillEnter() {
        document.title = "Request Details" + window.globalVars.pageTitle;
        this.getRequest();
    }

    render() {
        return (
            <IonPage data-page="request-details" ref={this.pageRef}>
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonBackButton onClick={() => { this.props.history.goBack(); }} />
                        </IonButtons>
                        <IonTitle>Request Details</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent ref={this.ionContent}>
                    { (!this.state.loadingMessage) &&
                        <div className="fields">
                            <SocialActions showActionName={true} {...this.props} presentingElement={this.pageRef} style={{marginTop: 8}} type="request" actions={this.state} id={this.props.match.params.id} name={this.state.name} />
                            <div className="field">
                                <h3>Name</h3>
                                <p>{this.state.name}</p>
                            </div>
                            <div className="field">
                                <h3>Details</h3>
                                <p>{this.state.details}</p>
                            </div>
                            <div className="field">
                                <h3>Status</h3>
                                <p>{this.state.status}</p>
                            </div>
                            <div className="field">
                                <h3>City</h3>
                                <p>{this.state.cityName ? (this.state.cityName + ", " + this.state.countryName) : "-"}</p>
                            </div>
                            { (this.state.dataset && this.state.dataset.name) &&
                                <div className="field">
                                    <h3>Dataset</h3>
                                    <UserBadge {...this.props} background={true} link={"/dataset/" + this.state.datasetId} id={this.state.datasetId} name={this.state.dataset.name} type="dataset" />
                                </div>
                            }
                            { (this.state.requestor && this.state.requestor.username) &&
                                <div className="field">
                                    <h3>Requestor</h3>
                                    <UserBadge {...this.props} background={true} link={"/profile/" + this.state.requestorId} id={this.state.requestorId} username={this.state.requestor.username} photo={this.state.requestor.picture} type="photo-username" />
                                </div>
                            }
                            { (this.state.asignee && this.state.asignee.username) &&
                                <div className="field">
                                    <h3>Assignee</h3>
                                    <UserBadge {...this.props} background={true} link={"/profile/" + this.state.asigneeId} id={this.state.asigneeId} username={this.state.asignee.username} photo={this.state.asignee.picture} type="photo-username" />
                                </div>
                            }
                            { (this.state.asigneeId && this.state.asigneeId === this.state.ownUserId && this.state.status !== "Released") &&
                                <IonButton onClick={() => { this.unassign(); }} className="unassign-btn" color="danger" expand="block">Unassign</IonButton>
                            }
                            { (!this.state.asigneeId && this.state.ownUserType === "org") &&
                                <IonButton onClick={() => { this.assign(); }} className="assign-btn" color="primary" expand="block">Assign to me</IonButton>
                            }
                            <div ref={this.commentsRef}></div>
                            <Comments {...this.props} presentingElement={this.pageRef} comments={this.state.comments} type="request" id={this.props.match.params.id} source="parent" />

                            <div ref={this.reportsRef}></div>
                            <Reports {...this.props} presentingElement={this.pageRef} reports={this.state.reports} type="request" id={this.props.match.params.id} userId={this.state.requestorId} source="parent" />

                            <div ref={this.ratingsRef}></div>
                            <Ratings {...this.props} presentingElement={this.pageRef} ratings={this.state.ratings} type="request" id={this.props.match.params.id} userId={this.state.requestorId} source="parent" />

                            { (this.state.canEdit) &&
                                <IonButton expand="block" className="save-btn" onClick={() => { this.props.history.push("/request/" + this.props.match.params.id + "/edit") }}>Edit</IonButton>
                            }
                        </div>
                    }
                </IonContent>
                <IonLoading
                    isOpen={this.state.loadingMessage !== null}
                    onDidDismiss={() => {
                        this.setState({ togglesEnabled: false }, function() {
                            this.setState({
                                loadingMessage: null,
                                togglesEnabled: true
                            })
                        })
                    }}
                    message={this.state.loadingMessage}
                />
                <IonAlert
                    isOpen={this.state.alertMessage !== null}
                    onDidDismiss={() => {
                        this.setState({ togglesEnabled: false }, function() {
                            this.setState({
                                alertMessage: null,
                                togglesEnabled: true,
                            })
                        })
                    }}
                    header={'Error'}
                    message={this.state.alertMessage}
                    buttons={[
                        { text: 'Close' },
                    ]}
                />
                <IonToast
                    color="dark"
                    isOpen={(this.state.minorNotification !== null)}
                    onDidDismiss={() => {
                        this.setState({ togglesEnabled: false }, function() {
                            this.setState({
                                togglesEnabled: true,
                                minorNotification: null,
                            })
                        })
                    }}
                    message={this.state.minorNotification}
                    position="bottom"
                    duration={1000}
              />
            </IonPage>
        );
    }

};

export default withIonLifeCycle(RequestDetails);
