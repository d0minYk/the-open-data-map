import { IonAlert, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonLoading, IonNote, IonPage, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToast, IonToolbar, withIonLifeCycle } from '@ionic/react';
import React, { createRef } from 'react';
import CitySelectorModal from '../modals/CitySelector.js';
import Server from '../Server.js';
import Storage from '../Storage.js';
import '../styles/RequestEditor.scss';

class RequestEditor extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            loadingMessage: null,
            alertMessage: null,
            minorNotification: null,
            availableStatuses: [
                "Draft"
            ],
            hasChanged: false,
            canUpdateDetails: false,
        }
        this.lastId = null;
        this.pageRef = createRef();
    }

    async getRequest() {

        let user = await Storage.getO("user");
        this.setState({ ownUserId: (user ? user.id : null) })

        if (this.props.match.params.id !== "new") {

            this.setState({ loadingMessage: "Getting request" })

            Server.api({
                method: "get",
                url: "/request/" + this.props.match.params.id,
                then: function(res) {

                    if (res.data) {

                        let asigneeId = res.data.asigneeId;
                        let requestorId = res.data.requestorId;
                        let status = res.data.status;
                        let availableStatuses = [status];

                        if (requestorId === this.state.ownUserId) {

                            console.log("Requestor here");

                            this.setState({ canUpdateDetails: true })

                            if (status !== "Released" && status !== "Closed") {
                                availableStatuses = [status, "Closed"]
                            }

                        } else if (asigneeId === this.state.ownUserId) {

                            console.log("Asignee here");

                            if (status === "Closed") {
                                availableStatuses = [status, "Collecting data", "Needs more information", "Released"]
                            } else if (status === "Collecting data") {
                                availableStatuses = [status, "Closed", "Needs more information", "Released"]
                            } else if (status === "Needs more information") {
                                availableStatuses = [status, "Closed", "Collecting data", "Released"]
                            } else if (status === "Assigned") {
                                availableStatuses = [status, "Closed", "Collecting data", "Needs more information", "Released"]
                            }

                        }

                        this.setState({
                            name: res.data.name,
                            details: res.data.description,
                            cityId: res.data.cityId,
                            cityName: res.data.cityName,
                            countryName: res.data.countryName,
                            countryId: res.data.countryId,
                            status: res.data.status,
                            hasChanged: false,
                            availableStatuses: availableStatuses
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

        } else {

            this.setState({
                name: "",
                description: "",
                status: "Draft",
                cityName: "",
                cityId: "",
                countryName: "",
                countryId: "",
                hasChanged: false,
                canUpdateDetails: true
            })

        }

    }

    updateStatus(status) {

        if (status === "Released") {
            this.setState({ releaseInfoAlert: true });
            return;
        }

        console.log("Updaiting status: " + status)

        if (status === this.state.status) {
            console.log("SAME")
            return;
        }

        this.setState({ loadingMessage: "Updating status" })

        Server.api({
            method: "PUT",
            url: "/request/" + this.props.match.params.id + "/status",
            data: { status: status },
            then: function(res) {
                this.getRequest();
                this.setState({
                    minorNotification: "Status updated",
                    loadingMessage: null,
                })
            }.bind(this),
            catch: function(code, error) {
                this.setState({
                    alertMessage: error,
                    loadingMessage: null,
                })
            }.bind(this)
        })

    }

    async componentDidUpdate() {
        console.log("UPDATE==")
        if ( (this.props.match.params.id) && (this.props.match.params.id !== this.lastId) ) {
            this.lastId = this.props.match.params.id;
            this.getRequest();
        }
    }

    async ionViewWillEnter() {
        document.title = "Request Editor" + window.globalVars.pageTitle;
    }

    async save() {

        console.log("SAVING...", this.state);

        Server.api({
            method: (this.props.match.params.id === "new") ? "POST" : "PATCH",
            url: "/request" + ( (this.props.match.params.id === "new") ? "" : "/" + this.props.match.params.id ),
            data: {
                name: this.state.name,
                details: this.state.details,
                cityId: this.state.cityId,
                cityName: this.state.cityName,
                countryName: this.state.countryName,
                countryId: this.state.countryId,
            },
            then: function(res) {
                if (this.props.match.params.id === "new") {
                    setTimeout(function() {
                        this.props.history.push("/request/" + res.data);
                    }.bind(this), 1200);
                }
                this.setState({
                    minorNotification: "Saved!",
                    hasChanged: false,
                })
            }.bind(this),
            catch: function(code, error) {
                this.setState({
                    alertMessage: error,
                    loadingMessage: null,
                })
            }.bind(this)
        })

    }

    render() {
        return (
            <IonPage data-page="request-editor" ref={this.pageRef}>
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonBackButton onClick={() => { this.props.history.goBack(); }} />
                        </IonButtons>
                        <IonTitle>{this.props.match.params.id === "new" ? "Create" : "Edit"} Request</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent ref={this.ionContent}>
                    { (!this.state.loadingMessage) &&
                        <div className="fields">
                            <IonList>
                                <IonItem>
                                    <IonLabel position="stacked">Name</IonLabel>
                                    <IonInput value={this.state.name} type="text" placeholder="Name" onIonChange={(e) => { this.setState({ hasChanged: true, name: e.target.value }) }}></IonInput>
                                </IonItem>
                                <IonItem>
                                    <IonLabel position="stacked">Details</IonLabel>
                                    <IonTextarea rows={5} value={this.state.details} placeholder="Details" onIonChange={(e) => { this.setState({ hasChanged: true, details: e.target.value }) }}></IonTextarea>
                                </IonItem>
                                <IonItem onClick={() => { if (this.props.match.params.id === "new") this.setState({ citySelectorModal: true }) }}>
                                    <IonLabel>City</IonLabel>
                                    <IonNote disabled={this.props.match.params.id !== "new"} slot="end">{this.state.cityName ? (this.state.cityName + ", " + this.state.countryName) : "Select City"}</IonNote>
                                </IonItem>
                                <IonItem>
                                    <IonLabel>Status</IonLabel>
                                    <IonSelect disabled={this.state.availableStatuses.length < 2} multiple={false} okText="Update Status" value={this.state.status} onIonChange={(e) => {this.updateStatus(e.target.value)}}>
                                        { this.state.availableStatuses.map(status => {
                                            return <IonSelectOption value={status}>{status}</IonSelectOption>
                                        }) }
                                    </IonSelect>
                                </IonItem>
                            </IonList>
                            { (this.state.canUpdateDetails) &&
                                <IonButton expand="block" className="save-btn" disabled={ (!this.state.hasChanged) } onClick={() => { this.save() }}>{ this.props.match.params.id === "new" ? "Post" : "Update Details" }</IonButton>
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
                <IonAlert
                    isOpen={this.state.releaseInfoAlert}
                    onDidDismiss={() => { this.setState({ releaseInfoAlert: false }) }}
                    header={'Releasing Dataset'}
                    message={'You can mark this dataset as released by selecting this request under the dataset details option.'}
                    buttons={[
                        {
                            text: 'Close',
                        },
                        {
                            text: 'Create now',
                            handler: () => { this.props.history.push("/dataset/setup/new/source") }
                        },
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
              <CitySelectorModal
                  presentingElement={this.pageRef}
                  open={this.state.citySelectorModal}
                  close={() => { this.setState({ citySelectorModal: false }) } }
                  onSelect={(type, cityId, cityName, countryId, countryName) => {
                      this.setState({
                          cityId: cityId,
                          countryId: countryId,
                          cityName: cityName,
                          countryName: countryName,
                          hasChanged: true
                      })
                  }}
                  restrictToType={"city"}
              />
            </IonPage>
        );
    }

};

export default withIonLifeCycle(RequestEditor);
