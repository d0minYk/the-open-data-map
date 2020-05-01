import { Plugins } from '@capacitor/core';
import { IonSpinner, IonButton, IonChip, IonIcon, IonItem, IonLabel, IonList, IonSkeletonText, IonToast, withIonLifeCycle } from '@ionic/react';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import { arrowDown, call, closeSharp, globe, mail, navigate } from 'ionicons/icons';
import React, { createRef } from 'react';
import ReactGA from 'react-ga';
import Server from '../Server.js';
import '../styles/MapLocationDetails.scss';
import Utilities from '../Utilities';
import Storage from '../Storage';
import Comments from './Comments.js';
import Ratings from './Ratings.js';
import Reports from './Reports.js';
import SocialActions from './SocialActions.js';
import UserBadge from './UserBadge.js';
const { Device } = Plugins;

class MapLocationDetails extends React.Component {

    constructor(props) {
        super(props)
        this.ionListRef = createRef();
        this.commentsRef = createRef();
        this.ratingsRef = createRef();
        this.reportsRef = createRef();
        this.state = {
            modal: false,
            id: null,
            details: null,
            showAllFields: false,
            error: null
        }
    }

    toggle() {

    }

    async getLocationDetails() {

        console.log("GEtting location " + this.state.id)

        let savedLocations = await Storage.getO("savedLocations");

        if (savedLocations && typeof savedLocations === "object" && savedLocations[this.state.id]) {
            console.log("LOADING FROM CACHE");
            let location = savedLocations[this.state.id];
            this.setState({
                loading: null,
                details: location,
            }, function() {
                console.log("CALLING")
                this.props.onChildLoad(location.locationPoint ? { lat: location.locationPoint.x, lng: location.locationPoint.y } : null, (location.locationPath ? "path" : (location.locationPolygon ? "polygon" : null) ), (location.locationPath || location.locationPolygon || null) )
            })
            return;
        }

        Server.api({
            method: "get",
            url: "/location/" + this.state.id,
            then: function(res) {

                console.log("Got location", res.data);
                ReactGA.pageview(window.globalVars.domainName + "location/" + this.state.id);

                document.title = res.data.name + window.globalVars.pageTitle;

                if (res.data.locationPath) {
                    let linePath = JSON.parse(res.data.locationPath.replace(/\(/g, '\[').replace(/\)/g, '\]'));
                    res.data.locationPathFirst = {x: linePath[0][0], y: linePath[0][1]}
                } else if (res.data.locationPolygon) {
                    let locationPolygon = JSON.parse(res.data.locationPolygon.replace(/\(/g, '\[').replace(/\)/g, '\]'));
                    res.data.locationPolygonFirst = {x: locationPolygon[0][0], y: locationPolygon[0][1]}
                }

                this.setState({
                    loading: null,
                    details: res.data,
                }, function() {
                    console.log("CALLING")
                    this.props.onChildLoad(res.data.locationPoint ? { lat: res.data.locationPoint.x, lng: res.data.locationPoint.y } : null, (res.data.locationPath ? "path" : (res.data.locationPolygon ? "polygon" : null) ), (res.data.locationPath || res.data.locationPolygon || null) )
                })

            }.bind(this),
            catch: function(code, error) {
                this.setState({
                    error: error,
                    loading: null
                })
                setTimeout(function() {
                    this.props.onClose();
                }.bind(this), 2000)
            }.bind(this)
        })

    }

    componentWillReceiveProps(nextProps) {

        this.setState({
            modal: nextProps.open,
        })

        if (!nextProps.open) {

            if (this.ionListRef && this.ionListRef.current) {
                this.ionListRef.current.scrollTop = 0;
                this.setState({scrolledStatus: "normal"})
            }

        }

        if ( (nextProps.id || nextProps.data) && (nextProps.id !== this.state.id) ) {

            let prev = document.querySelector(".marker-custom[data-selected='true']")
            if (prev) {
                prev.setAttribute("data-selected", "false")
            }

            let marker = document.getElementById("marker-" + nextProps.id);
            console.log("HERE: ", marker);

            if (marker) {
                marker.setAttribute("data-selected", "true")
            }

            if (nextProps.data) {

                if (nextProps.data.locationPath) {
                    let linePath = JSON.parse(nextProps.data.locationPath.replace(/\(/g, '\[').replace(/\)/g, '\]'));
                    nextProps.data.locationPathFirst = {x: linePath[0][0], y: linePath[0][1]}
                } else if (nextProps.data.locationPolygon) {
                    let locationPolygon = JSON.parse(nextProps.data.locationPolygon.replace(/\(/g, '\[').replace(/\)/g, '\]'));
                    nextProps.data.locationPolygonFirst = {x: locationPolygon[0][0], y: locationPolygon[0][1]}
                }

                this.setState({
                    id: nextProps.data.id,
                    loading: null,
                    details: nextProps.data,
                })

            } else {

                this.setState({
                    id: nextProps.id,
                    details: null
                }, function() {
                    this.getLocationDetails();
                })

            }

        }

    }

    clear() {

        this.setState({
            id: null,
            details: null,
        })

        this.props.onClose();

    }

    async openDirections(point) {

        let deviceInfo = await Device.getInfo();

        if (deviceInfo.platform === "ios") {
            window.open('maps://?q=' + point.x + ',' + point.y, '_system');
        } else if (deviceInfo.platform === "android") {
            window.open('geo://' + point.x + ',' + point.y + '?q=' + point.x + ',' + point.y);
        } else {
            window.open('https://www.google.com/maps/dir/?api=1&destination=' + point.x + ',' + point.y, '_system');
        }

    }

    render() {

        if (!this.state.modal) return null;

        let contentDOM = <div className="location-details-overlay" data-scrolled-status={this.state.scrolledStatus}>
            <div className="location-details">
                { (this.state.details) &&
                    <IonList ref={this.ionListRef} data-scrolled-status={this.state.scrolledStatus} lines="none" onScroll={(e) => {
                        if (this.props.size === "big") return;
                        this.setState({ scrolledStatus: ( (e.target.scrollTop <= 0 && e.target.scrollHeight !== e.target.clientHeight) ? "normal" : "expanded") })
                    }}>
                        <div style={{ background: 'white', paddingTop: 10, paddingBottom: 15 }}>
                        { (this.props.size === "big" || this.props.iframe) && <IonIcon icon={closeSharp} onClick={() => { this.clear(); }} className="close-btn" /> }
                        { (this.props.size === "small" && !this.props.iframe) && <div className="drag-indicator"></div> }
                        <h1> { this.state.details.fields.name } </h1>
                        <h2> { Utilities.formatLocation(this.state.details) } </h2>

                        { (this.state.details.locationPoint || this.state.details.locationPolygonFirst || this.state.details.locationPathFirst || this.state.details.email || this.state.details.tel || this.state.details.website) &&
                            <div className="outside-actions">

                                { (this.state.details.locationPoint) &&
                                    <div className="action-btn" onClick={() => { if (this.state.details.locationPoint) this.openDirections(this.state.details.locationPoint); }}>
                                        <IonIcon icon={navigate} mode="md" />
                                        <label>Route</label>
                                    </div>
                                }

                                { (this.state.details.locationPathFirst) &&
                                    <div className="action-btn" onClick={() => { if (this.state.details.locationPathFirst) this.openDirections(this.state.details.locationPathFirst); }}>
                                        <IonIcon icon={navigate} mode="md" />
                                        <label>Route</label>
                                    </div>
                                }

                                { (this.state.details.locationPolygonFirst) &&
                                    <div className="action-btn" onClick={() => { if (this.state.details.locationPolygonFirst) this.openDirections(this.state.details.locationPolygonFirst); }}>
                                        <IonIcon icon={navigate} mode="md" />
                                        <label>Route</label>
                                    </div>
                                }

                                { this.state.details.email &&
                                    <a className="action-btn" target="_blank" href={"mailto:" + this.state.details.email}>
                                        <IonIcon icon={mail} mode="md" />
                                        <label>Email</label>
                                    </a>
                                }

                                { this.state.details.tel &&
                                    <a className="action-btn" target="_blank" href={"tel:" + this.state.details.tel}>
                                        <IonIcon icon={call} mode="md" />
                                        <label>Call</label>
                                    </a>
                                }

                                { this.state.details.website &&
                                    <a className="action-btn" target="_blank" href={this.state.details.website}>
                                        <IonIcon icon={globe} mode="md" />
                                        <label>Visit</label>
                                    </a>
                                }

                            </div>
                        }

                        { (window.globalVars && window.globalVars.user && window.globalVars.user.id === this.state.details.userId) &&
                            <IonButton style={{margin: 15, padding: 0}} expand="block" onClick={() => { this.props.history.push("/location/" + this.state.details.id + "/edit") }} >Edit Location</IonButton>
                        }

                        <SocialActions
                            {...this.props}
                            showActionName={true}
                            style={{ marginTop: 12, marginBottom: 12 }}
                            type="location"
                            actions={this.state.details}
                            id={this.state.details.id}
                            name={this.state.details.name}
                            onCommentClick={() => { this.ionListRef.current.scrollTo(0, this.commentsRef.current.offsetTop) }}
                            onRatingClick={() => { this.ionListRef.current.scrollTo(0, this.ratingsRef.current.offsetTop) }}
                            onReportClick={() => { this.ionListRef.current.scrollTo(0, this.reportsRef.current.offsetTop) }}
                            presentingElement={this.props.presentingElement}
                        />

                        { (this.state.scrolledStatus === "expanded") &&
                            <div>
                                <h3>Categories</h3>
                                { this.state.details.categories.map(item => {
                                    return (<IonChip className="colored" data-type="category"> <IonLabel>{item}</IonLabel> </IonChip>);
                                }) }

                                <h3>Features</h3>
                                { Object.keys(this.state.details.features).map(key => {
                                    return (<IonChip className="colored" data-type="feature"> <IonLabel>{key}</IonLabel> </IonChip>);
                                }) }
                            </div>
                        }

                        { (this.state.scrolledStatus !== "expanded") &&
                            <div>
                                { (this.state.details.cityName) && <IonChip className="colored" data-type="city"> <IonLabel>{this.state.details.cityName}</IonLabel> </IonChip> }
                                { this.state.details.categories.map(item => {
                                    return (<IonChip className="colored" data-type="category"> <IonLabel>{item}</IonLabel> </IonChip>);
                                }) }
                                { Object.keys(this.state.details.features).map(key => {
                                    return (<IonChip className="colored" data-type="feature"> <IonLabel>{key}</IonLabel> </IonChip>);
                                }) }
                            </div>
                        }

                        { (this.state.details.owner) &&
                            <div className="field">
                                <h3>Author</h3>
                                <UserBadge {...this.props} background={true} link={"/profile/" + this.state.details.userId} id={this.state.details.userId} username={this.state.details.owner.username} photo={this.state.details.owner.picture} type="photo-username" />
                            </div>
                        }

                        { (this.state.details.dataset) && (this.state.details.dataset.maintainerName || this.state.details.dataset.maintainerEmail) &&
                            <div className="field" onClick={() => { if (this.state.details.dataset.maintainerEmail) window.open("mailto:" + this.state.details.dataset.maintainerEmail) }}>
                                <h3>Maintianer</h3>
                                { this.state.details.dataset.maintainerName && <p>{this.state.details.dataset.maintainerName}</p> }
                                { this.state.details.dataset.maintainerEmail && <p>{this.state.details.dataset.maintainerEmail}</p> }
                            </div>
                        }

                        { (this.state.details.dataset) &&
                            <div className="field" onClick={() => { this.clear(); this.props.onClose(); this.props.history.push("/dataset/" + this.state.details.dataset.id); }}>
                                <h3>Dataset</h3>
                                <UserBadge {...this.props} background={true} link={"/dataset/" + this.state.details.dataset.id} id={this.state.details.dataset.id} name={this.state.details.dataset.name} type="dataset" />
                            </div>
                        }

                        { (this.state.details.updatedat) &&
                            <div className="field">
                                <h3>Updated</h3>
                                <p>{Utilities.timeSince(this.state.details.updatedat)}</p>
                            </div>
                        }

                        { (this.state.details.createdat) &&
                            <div className="field">
                                <h3>Added</h3>
                                <p>{Utilities.timeSince(this.state.details.createdat)}</p>
                            </div>
                        }

                        { (!this.state.showAllFields) && Object.keys(this.state.details.fields).sort().map(key => {

                            let field = this.state.details.fields[key];
                            if (key === "name") return null;
                            if (typeof field !== "string") return;
                            if ( ((key.startsWith("___") && key.endsWith("___")) || key === "categories" || key === "features")) return;

                            return (
                                <div className="field">
                                    <h3> { key } </h3>
                                    { (field.indexOf("\n") !== -1 || field.indexOf("<br />" !== -1)) ?
                                        <div>
                                            { field.split(/(\r\n|\r|\n)|<br \/>/g).map ((item, i) => <p key={i}>{item}</p>) }
                                        </div>
                                        :
                                        <p> { field } </p>
                                    }
                                </div>
                            )

                        }) }

                        { (this.state.showAllFields) && Object.keys(this.state.details.originalFields).sort().map(key => {

                            let field = this.state.details.originalFields[key];
                            if (key === "name") return null;
                            if (typeof field !== "string") return;
                            if ( ((key.startsWith("___") && key.endsWith("___")) || key === "categories" || key === "features")) return;

                            return (
                                <div className="field">
                                    <h3> { key } </h3>
                                    { (field.indexOf("\n") !== -1 || field.indexOf("<br />" !== -1)) ?
                                        <div>
                                            { field.split(/(\r\n|\r|\n)|<br \/>/g).map ((item, i) => <p key={i}>{item}</p>) }
                                        </div>
                                        :
                                        <p> { field } </p>
                                    }
                                </div>
                            )

                        }) }

                        <IonButton color="light" style={{marginTop: 12}} expand="block" onClick={() => { this.setState({ showAllFields: !this.state.showAllFields }) }} >{ (this.state.showAllFields) ? "Show less" : "Show all fields" }</IonButton>

                        <div ref={this.commentsRef}></div>
                        <Comments
                            {...this.props}
                            comments={this.state.details.comments}
                            type="location"
                            id={this.state.details.id}
                            source="parent"
                            presentingElement={this.props.presentingElement}
                        />

                        <div ref={this.reportsRef}></div>
                        <Reports
                            {...this.props}
                            reports={this.state.details.reports}
                            type="location"
                            id={this.state.details.id}
                            datasetId={this.state.details.datasetId}
                            userId={this.state.details.userId}
                            source="parent"
                            presentingElement={this.props.presentingElement}
                        />

                        <div ref={this.ratingsRef}></div>
                        <Ratings
                            {...this.props}
                            ratings={this.state.details.ratings}
                            type="location" id={this.state.details.id}
                            datasetId={this.state.details.datasetId}
                            userId={this.state.details.userId}
                            source="parent"
                            presentingElement={this.props.presentingElement}
                        />

                        <div className="field">
                            <h3>Licence</h3>
                            <p>{this.state.details.licenceType}</p>
                            <p>{this.state.details.licenceDetails}</p>
                        </div>

                    </div>
                    </IonList>
                }
                { (this.props.size === "big" && this.state.loading === null) &&
                    <button className="expand-btn" onClick={() => { this.setState({ scrolledStatus: "expanded" }) }}>
                        <IonIcon icon={arrowDown} />
                    </button>
                }
                { (!this.state.details) &&
                    <IonList lines="none" className="loading">
                        <IonSpinner className="big" name="crescent" />
                    </IonList>
                }
                <IonToast
                    isOpen={this.state.error !== null}
                    onDidDismiss={() => this.setState({ error: null })}
                    message={this.state.error}
                    color="danger"
                    closeButtonText="Close"
                    duration={2000}
                    position="top"
                    showCloseButton={true}
                />
            </div>
        </div>

        if (this.props.size !== "big") {

            contentDOM =
                <SwipeableDrawer
                    anchor="bottom"
                    disableBackdropTransition={false}
                    open={(this.props.open)}
                    onClose={ () => { this.clear() } }
                    onOpen={ () => { this.setState({ locationListModal: "maximized" }) } }
                    onScroll={(e) => {
                        e.stopPropagation();
                    }}
                >
                    {contentDOM}
                </SwipeableDrawer>

        }

        return (
            contentDOM
        );
    }

};

export default withIonLifeCycle(MapLocationDetails);
