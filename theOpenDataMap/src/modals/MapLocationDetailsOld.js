import { Plugins } from '@capacitor/core';
import { IonButton, IonChip, IonIcon, IonItem, IonLabel, IonList, IonSkeletonText, withIonLifeCycle } from '@ionic/react';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import { bookmarkOutline, call, globe, mail, navigate } from 'ionicons/icons';
import React, { createRef } from 'react';
import Server from '../Server.js';
import '../styles/MapLocationDetails.scss';
import Utilities from '../Utilities';
import Comments from './Comments.js';
import CommentsButton from './CommentsButton.js';
import LikeButton from './LikeButton.js';
import Ratings from './Ratings.js';
import RatingsButton from './RatingsButton.js';
import Reports from './Reports.js';
import ReportsButton from './ReportsButton.js';
import ShareButton from './ShareButton.js';
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
            formattedLocation: null,
            showAllFields: false,
        }
    }

    toggle() {

    }

    getLocationDetails() {

        console.log("GEtting location " + this.state.id)

        Server.api({
            method: "get",
            url: "/location/" + this.state.id,
            then: function(res) {

                console.log("Got location", res.data);

                this.setState({
                    loading: null,
                    details: res.data,
                    formattedLocation: Utilities.formatLocation(res.data),
                })

            }.bind(this),
            catch: function(code, error) {
                this.setState({
                    error: error,
                    loading: null
                })
            }.bind(this)
        })

    }

    componentWillReceiveProps(nextProps) {

        this.setState({
            modal: nextProps.open,
        })

        if (!nextProps.open) {

            if (this.ionListRef && this.ionListRef.current) {
                console.log("SETTING ST")
                this.ionListRef.current.scrollTop = 0;
                this.setState({scrolledStatus: "normal"})
            }

        }

        if ( (nextProps.id || nextProps.data) && (nextProps.id !== this.state.id) ) {

            if (nextProps.data) {

                this.setState({
                    id: nextProps.data.id,
                    loading: null,
                    details: nextProps.data,
                    formattedLocation: Utilities.formatLocation(nextProps.data)
                })

            } else {

                this.setState({
                    id: nextProps.id
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
            formattedLocation: null
        })

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
        return (
            <SwipeableDrawer
                anchor="bottom"
                disableBackdropTransition={false}
                open={this.state.modal}
                onClose={ () => { this.clear(); this.props.onClose(); } }
                onOpen={ () => { this.props.onOpen(); } }
                onScroll={(e) => {
                    e.stopPropagation();
                }}
            >
                <div className="swipeable-drawer-body" data-drawer="map-location-details">
                    <div className="drag-indicator"></div>
                    { (this.state.details) &&
                        <IonList ref={this.ionListRef} data-scrolled-status={this.state.scrolledStatus} lines="none" onScroll={(e) => {
                            // console.log(e.target.scrollHeight, e.target.scrollTop, e.target.clientHeight);
                            this.setState({ scrolledStatus: ( (e.target.scrollTop === 0 && e.target.scrollHeight !== e.target.clientHeight) ? "normal" : "expanded") })
                        }}>

                            <h1> { this.state.details.fields.name } </h1>
                            <h2> { Utilities.formatLocation(this.state.details) } </h2>

                            <div className="outside-actions">

                                { (this.state.details.locationPoint) &&
                                    <div className="action-btn" onClick={() => { if (this.state.details.locationPoint) this.openDirections(this.state.details.locationPoint); }}>
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

                            <div className="social-actions">
                                <LikeButton
                                    {...this.props}
                                    type="location"
                                    id={this.state.details.id}
                                    source="parent"
                                    likes={this.state.details.likes}
                                />
                                <CommentsButton
                                    comments={this.state.details.comments}
                                    type="location"
                                    id={this.state.details.id}
                                    source="parent"
                                    onClick={() => { this.ionListRef.current.scrollTo(0, this.commentsRef.current.offsetTop)  }}
                                />
                                <RatingsButton
                                    ratings={this.state.details.ratings}
                                    type="location"
                                    id={this.state.details.id}
                                    source="parent"
                                    onClick={() => { this.ionListRef.current.scrollTo(0, this.ratingsRef.current.offsetTop)  }}
                                />
                                <ShareButton
                                    type="location"
                                    id={this.state.details.id}
                                    quote={"Check out " + this.state.details.fields.name}
                                    title={this.state.details.fields.name}
                                    link={window.globalVars.domainName + "location/" + this.state.details.id}
                                    shares={this.state.details.shares}
                                />
                                <div>
                                    <IonIcon icon={bookmarkOutline}></IonIcon>
                                    <label>
                                        2
                                        <span>Save</span>
                                    </label>
                                </div>
                                <ReportsButton
                                    {...this.props}
                                    reports={this.state.details.reports}
                                    type="location"
                                    id={this.state.details.id}
                                    source="parent"
                                    onClick={() => { this.ionListRef.current.scrollTo(0, this.reportsRef.current.offsetTop)  }}
                                />
                            </div>

                            <h3>Categories</h3>
                            { this.state.details.categories.map(item => {
                                return (<IonChip> <IonLabel>{item}</IonLabel> </IonChip>);
                            }) }

                            <h3>Features</h3>
                            { Object.keys(this.state.details.features).map(key => {
                                return (<IonChip> <IonLabel>{key}</IonLabel> </IonChip>);
                            }) }

                            <div className="field" onClick={() => { this.clear(); this.props.onClose(); this.props.history.push("/profile/" + this.state.details.owner.id); }}>
                                <h3>Author</h3>
                                <p>{this.state.details.owner.username}</p>
                            </div>

                            { (this.state.details.dataset) && (this.state.details.dataset.maintainerName || this.state.details.dataset.maintainerEmail) &&
                                <div className="field" onClick={() => { if (this.state.details.dataset.maintainerEmail) window.open("mailto:" + this.state.details.dataset.maintainerEmail) }}>
                                    <h3>Maintianer</h3>
                                    { this.state.details.dataset.maintainerName && <p>{this.state.details.dataset.maintainerName}</p> }
                                    { this.state.details.dataset.maintainerEmail && <p>{this.state.details.dataset.maintainerEmail}</p> }
                                </div>
                            }

                            { (this.state.details.dataset) &&
                                <div className="field" onClick={() => { this.clear(); this.props.onClose(); this.props.history.push("/dataset/" + this.state.details.dataset.id); }}>
                                    <h3>Posted in</h3>
                                    <p>{this.state.details.dataset.name}</p>
                                </div>
                            }

                            { (!this.state.showAllFields) && Object.keys(this.state.details.fields).map(key => {

                                let field = this.state.details.fields[key];
                                if (key === "name") return null;
                                if (typeof field !== "string") return;
                                if (key.startsWith("___") && key.endsWith("___")) return;

                                return (
                                    <div className="field">
                                        <h3> { key } </h3>
                                        <p> { field } </p>
                                    </div>
                                )

                            }) }

                            { (this.state.showAllFields) && Object.keys(this.state.details.originalFields).map(key => {

                                let field = this.state.details.originalFields[key];
                                if (key === "name") return null;
                                if (typeof field !== "string") return;
                                if (key.startsWith("___") && key.endsWith("___")) return;

                                return (
                                    <div className="field">
                                        <h3> { key } </h3>
                                        <p> { field } </p>
                                    </div>
                                )

                            }) }

                            <IonButton style={{marginTop: 12}} expand="block" onClick={() => { this.setState({ showAllFields: !this.state.showAllFields }) }} >{ (this.state.showAllFields) ? "Show less" : "Show all fields" }</IonButton>

                            <div ref={this.commentsRef}></div>
                            <Comments
                                {...this.props}
                                comments={this.state.details.comments}
                                type="location"
                                id={this.state.details.id}
                                source="parent"
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
                            />

                            <div ref={this.ratingsRef}></div>
                            <Ratings
                                {...this.props}
                                ratings={this.state.details.ratings}
                                type="location"
                                id={this.state.details.id}
                                datasetId={this.state.details.datasetId}
                                userId={this.state.details.userId}
                                source="parent"
                            />

                            <div className="field">
                                <h3>Licence</h3>
                                <p>{this.state.details.licenceType}</p>
                                <p>{this.state.details.licenceDetails}</p>
                            </div>

                        </IonList>
                    }
                    { (!this.state.details) &&
                        <IonList lines="none">

                            <IonItem text-wrap>
                                <IonLabel position="stacked" class="ion-text-wrap">
                                    <h1> <IonSkeletonText animated style={{ width: '60%' }} /> </h1>
                                    <h2> <IonSkeletonText animated style={{ width: '80%' }} /> </h2>
                                </IonLabel>
                            </IonItem>

                            { [0,0,0,0].map(key => {

                                return (
                                    <IonItem>
                                        <IonLabel position="stacked" class="ion-text-wrap">
                                            <h3> <IonSkeletonText animated style={{ width: '40%' }} /> </h3>
                                            <p> <IonSkeletonText animated style={{ width: '100%' }} /> </p>
                                            <p> <IonSkeletonText animated style={{ width: '80%' }} /> </p>
                                        </IonLabel>
                                    </IonItem>
                                )

                            }) }
                        </IonList>
                    }
                </div>
            </SwipeableDrawer>
        );
    }

};

export default withIonLifeCycle(MapLocationDetails);
