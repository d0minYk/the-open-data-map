import { IonAlert, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonListHeader, IonModal, IonNote, IonTitle, IonToast, IonToolbar, withIonLifeCycle } from '@ionic/react';
import { addCircle, close } from 'ionicons/icons';
import React, { createRef } from 'react';
import CitySelectorModal from '../modals/CitySelector.js';
import ProfilePictureManager from '../modals/ProfilePictureManager.js';
import Server from '../Server.js';
import Storage from '../Storage.js';
import '../styles/Profile.scss';
import Utilities from '../Utilities.js';

class Settings extends React.Component {

    constructor(props) {
        super(props)
        this.settingsModalRef = createRef();
        this.state = {
            citySelectorModal: false,
            modal: false,
            userType: 'user',
            statistics: null,
            own: false,
            settingsModal: false,
            rawImage: null,
            toast: null,
            ckanUrl: ""
        }
    }

    async componentWillReceiveProps(nextProps) {

        if (nextProps.modal !== this.props.modal) {

            let defaultLocation = await Storage.getO("defaultLocation");
            let profilePicture = await Storage.getO("profilePicture");
            let ckanUrl = await Storage.getO("ckanUrl");
            let requestAutoAssigns = await Storage.getO("requestAutoAssigns");
            let user = await Storage.getO("user");

            console.log("DED", defaultLocation)

            this.setState({
                defaultLocation: defaultLocation,
                profilePicture: profilePicture,
                ckanUrl: ckanUrl,
                userType: user ? user.type : null,
                requestAutoAssigns: requestAutoAssigns,
            })

        }

    }

    async ionViewWillEnter() {

    }

    async updatePassword() {

        Server.api({
            method: "put",
            url: "user/current/password",
            data: {
                oldPassword: this.state.oldPassword,
                newPassword: this.state.newPassword,
                newPasswordAgain: this.state.newPasswordAgain,
            },
            then: function(res) {
                console.log("UPDATED", res.data)
                this.setState({ toast: { msg: "Password updated", color: "success" } })
            }.bind(this),
            catch: function(code, error) {
                console.log("FAiled to update", error)
                this.setState({ toast: { msg: error || "Failed to update password", color: "danger" } })
            }.bind(this)
        })

    }

    async removeProfilePicture() {

        Server.api({
            method: "delete",
            url: "user/current/picture",
            then: function(res) {
                this.setState({ toast: { msg: "Profile Picture deleted", color: "success" } })
                // this.props.hardReload();
                this.props.close();
            }.bind(this),
            catch: function(code, error) {
                this.setState({ toast: { msg: "Failed to delete Profile Picture", color: "danger" } })
            }.bind(this)
        })

    }

    triggerUploadDialog = () => {

        let node = document.getElementById('profile-picture-upload-input');
        let event;

        if (typeof(Event) === 'function') { event = new MouseEvent('click', { 'view': window, 'bubbles': true, 'cancelable': false });
        } else { event = document.createEvent('Event'); event.initEvent('click', true, true); }

        node.dispatchEvent(event);

    }

    async updateCkanUrl() {

        console.log("Pushing url", this.state.ckanUrl)

        Server.api({
            method: "put",
            url: "user/current/ckan",
            data: {
                url: this.state.ckanUrl
            },
            then: function(res) {
                console.log("UPDATED", res.data)
                this.setState({ toast: { msg: "CKAN URL udpated", color: "success" } })
            }.bind(this),
            catch: function(code, error) {
                console.log("FAiled to update", error)
                this.setState({ toast: { msg: error || "Failed to update CKAN URL", color: "danger" } })
            }.bind(this)
        })

    }

    addAutoAssignCity(id, name) {

        console.log("Adding  " + id);

        Server.api({
            method: "post",
            url: "/request-auto-assign/" + id,
            then: async function(res) {
                let requestAutoAssigns = this.state.requestAutoAssigns || [];
                requestAutoAssigns.push({
                    id: res.data,
                    name: name
                })
                this.setState({ requestAutoAssigns: requestAutoAssigns })
                this.setState({ toast: { msg: "City added", color: "success" } })
                await Storage.setO("requestAutoAssigns", requestAutoAssigns);
            }.bind(this),
            catch: function(code, error) {
                this.setState({ toast: { msg: error || "Failed to add city", color: "danger" } })
            }.bind(this)
        })

    }

    removeAutoAssignCity(id, i) {

        console.log("Removing  " + id);

        Server.api({
            method: "delete",
            url: "/request-auto-assign/" + id,
            then: async function(res) {
                let requestAutoAssigns = this.state.requestAutoAssigns;
                requestAutoAssigns.splice(i, 1);
                this.setState({ requestAutoAssigns: requestAutoAssigns })
                this.setState({ toast: { msg: "City removed", color: "success" } })
                await Storage.setO("requestAutoAssigns", requestAutoAssigns);
            }.bind(this),
            catch: function(code, error) {
                this.setState({ toast: { msg: "Failed to remove city", color: "danger" } })
            }.bind(this)
        })

    }

    async updateHome(cityId, cityName, countryId, countryName) {

        console.log("Updating home", cityId, cityName, countryId, countryName);

        let newLocation = {
            cityId: cityId,
            cityName: cityName,
            countryId: countryId,
            countryName: countryName,
            type: "city",
        }

        Server.api({
            method: "put",
            url: "user/current/home",
            data: newLocation,
            then: function(res) {
                console.log("UPDATED", res.data)
                // this.setState({ toast: { msg: "Hometown updated", color: "success" } })
                this.props.close();
            }.bind(this),
            catch: function(code, error) {
                console.log("FAiled to update", error)
            }.bind(this)
        })

        await Storage.setO("lastLocation", newLocation);
        await Storage.setO("defaultLocation", newLocation);

    }

    onPictureChange(e) {

        Utilities
            .getBase64(e.target.files[0])
            .then(function(base64) {
                this.setState({
                    rawImage: base64
                })
            }.bind(this)).catch(function(err) {

            }.bind(this))

    }

    render() {
        return (
            <IonModal
                isOpen={this.props.modal}
                onDidDismiss={ () => { this.props.close(); } }
                presentingElement={(this.props.presentingElement && (window.globalVars === undefined || window.globalVars.size !== "big")) ? this.props.presentingElement.current : undefined}
                swipeToClose={true}
                ref={this.settingsModalRef}
                data-modal="settings"
            >
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Settings</IonTitle>
                        <IonButtons slot="end">
                            <IonIcon icon={close} onClick={() => { this.props.close() }}></IonIcon>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <IonHeader collapse="condense">
                        <IonToolbar>
                            <IonTitle size="large">Settings</IonTitle>
                        </IonToolbar>
                    </IonHeader>
                    <IonList>
                        <IonListHeader>
                            <IonLabel>Profile Picture</IonLabel>
                        </IonListHeader>
                        <IonItem>
                            <div className="profile-picture">
                                { (this.state.profilePicture) &&
                                    <div className="current">
                                        <img src={window.globalVars.profilePicturesPath + this.state.profilePicture} />
                                    </div>
                                }
                                <ProfilePictureManager
                                    image={this.state.rawImage}
                                    presentingElement={this.settingsModalRef}
                                    close={() => { this.setState({ rawImage: null }) }}
                                    onOperationEnd={(success) => {
                                        this.props.close();
                                        // this.props.hardReload();
                                    }}
                                />
                                <button onClick={() => { this.triggerUploadDialog() }}>{ (this.state.profilePicture) ? "Update" : "Upload" }</button>
                                { (this.state.profilePicture) && <button onClick={() => { this.removeProfilePicture() }}>Remove</button> }
                            </div>
                        </IonItem>
                        { (this.state.userType === "org") &&
                            <IonListHeader>
                                <IonLabel>Autodetect CKAN geo-datasets</IonLabel>
                            </IonListHeader>
                        }
                        { (this.state.userType === "org") &&
                            <div className="ckan">
                                <IonItem>
                                    <IonLabel position="stacked" className="ion-text-wrap">
                                        URL
                                    </IonLabel>
                                    <IonInput value={this.state.ckanUrl} onIonChange={(e) => { this.setState({ ckanUrl: e.target.value }) } } placeholder={"Chan Url"} type="text" />
                                </IonItem>
                                <p>You can enter the url to your ckan portal here, this is going to be parsed daily to check for location-based datasets, matches will appear in your profile from where you can easily set it up on The Open Data Map.</p>
                            </div>
                        }
                        { (this.state.userType === "org") &&
                            <IonButton style={{ marginBottom: 0, marginTop: 0 }} expand="block" disabled={this.state.updatingPasswordDisabled} onClick={() => { this.setState({ confirmCkanUrlUpdate: true }) }}>Upadate URL</IonButton>
                        }

                        <IonListHeader>
                            <IonLabel>Location</IonLabel>
                        </IonListHeader>
                        <IonItem onClick={() => { this.setState({ citySelectorModal: true, citySelectorMode: "own" }) }}>
                            <IonLabel>Own City</IonLabel>
                            <IonNote slot="end">{ (this.state.defaultLocation ? this.state.defaultLocation.cityName : "-") }</IonNote>
                        </IonItem>

                        <IonListHeader>
                            <IonLabel>Change Password</IonLabel>
                        </IonListHeader>
                        <IonItem>
                            <IonLabel>Old Password</IonLabel>
                            <IonInput value={this.state.oldPassword} onIonChange={(e) => { this.setState({ oldPassword: e.target.value }) } } placeholder={"Old Password"} type="password" />
                        </IonItem>
                        <IonItem>
                            <IonLabel>New Password</IonLabel>
                            <IonInput value={this.state.newPassword} onIonChange={(e) => { this.setState({ newPassword: e.target.value }) } } placeholder={"New Password"} type="password" />
                        </IonItem>
                        <IonItem>
                            <IonLabel>New Password Again</IonLabel>
                            <IonInput value={this.state.newPasswordAgain} onIonChange={(e) => { this.setState({ newPasswordAgain: e.target.value }) } } placeholder={"New Password"} type="password" />
                        </IonItem>
                        <IonButton expand="block" disabled={this.state.updatingPasswordDisabled} onClick={() => { this.updatePassword() }}>Update Password</IonButton>

                        { (this.state.userType === "org") &&
                            <div>
                                <IonListHeader>
                                    <IonLabel>Auto-request assignment</IonLabel>
                                    <IonButton color="dark" onClick={() => { this.setState({ citySelectorModal: true, citySelectorMode: "request" }) }}>
                                        <IonIcon icon={addCircle}></IonIcon>
                                    </IonButton>
                                </IonListHeader>
                                { (!this.state.requestAutoAssigns || this.state.requestAutoAssigns.length === 0) &&
                                    <div className="cities">
                                        <IonItem>
                                            <IonLabel>No cities added</IonLabel>
                                        </IonItem>
                                    </div>
                                }
                                { (this.state.requestAutoAssigns && this.state.requestAutoAssigns.length !== 0) &&
                                    <div className="cities">
                                        { this.state.requestAutoAssigns.map((item, i) => {
                                            return (
                                                <IonItem>
                                                    <IonLabel>{item.name}</IonLabel>
                                                    <IonIcon icon={close} slot="end" onClick={() => { this.removeAutoAssignCity(item.id, i) }} />
                                                </IonItem>
                                            )
                                        }) }
                                    </div>
                                }
                            </div>
                        }

                        {/*<IonItem className="status-msg" data-state="error">
                            <IonLabel>Error</IonLabel>
                        </IonItem>*/}

                    </IonList>
                    <CitySelectorModal
                        presentingElement={this.settingsModalRef}
                        open={this.state.citySelectorModal}
                        close={() => { this.setState({ citySelectorModal: false }) } }
                        onSelect={(type, id, name, countryId, countryName) => {
                            if (this.state.citySelectorMode === "request") {
                                this.addAutoAssignCity(id, name);
                            } else {
                                this.updateHome(id, name, countryId, countryName);
                            }
                        }}
                        restrictToType={"city"}
                    />
                    <input id="profile-picture-upload-input" type="file" name="profile-picture" onChange={ (e) => {this.onPictureChange(e)}} />
                </IonContent>
                <IonToast
                    isOpen={this.state.toast !== null}
                    onDidDismiss={() => this.setState({ toast: null })}
                    message={this.state.toast ? this.state.toast.msg : ""}
                    color={this.state.toast ? this.state.toast.color : ""}
                    closeButtonText="Close"
                    duration={2000}
                    position="top"
                    showCloseButton={true}
                />
                <IonAlert
                    isOpen={this.state.confirmCkanUrlUpdate}
                    onDidDismiss={() => { this.setState({ confirmCkanUrlUpdate: false }) }}
                    header={'Update CKAN URL'}
                    message={'Are you sure you want to update your CKAN URL? This will remove all existing matches and reparse the newly entered portal'}
                    buttons={[
                        { text: 'Cancel', },
                        { text: 'Update', handler: () => { this.updateCkanUrl() } }
                    ]}
                />
            </IonModal>
        );
    }

};

export default withIonLifeCycle(Settings);
