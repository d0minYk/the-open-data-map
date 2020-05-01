import { IonButton, IonContent, IonIcon, IonLabel, IonList, IonListHeader, IonPage, IonSkeletonText, IonToast, withIonLifeCycle } from '@ionic/react';
import { addCircle, business, caretDownOutline, chatbox, compass, fileTrayFull, helpCircle, person, podium, share, star, thumbsUp, warning, ribbon } from 'ionicons/icons';
import React, { createRef } from 'react';
import ReactGA from 'react-ga';
import CitySelectorModal from '../modals/CitySelector.js';
import DatasetItem from '../modals/DatasetItem.js';
import EntityListItem from '../modals/EntityListItem.js';
import LocationPreviewItem from '../modals/LocationPreviewItem.js';
import UserBadge from '../modals/UserBadge.js';
import Server from '../Server.js';
import Utilities from '../Utilities.js';
import Storage from '../Storage.js';
import '../styles/Directory.scss';

class Directory extends React.Component {

    constructor(props) {
        super(props)
        this.pageRef = createRef();
        this.state = {
            loading: null,
            organizations: [],
            users: [],
            locations: [],
            tabTitle: "",
            locationInfo: {},
            datasets: [],
            requests: [],
            error: null
        }
    }

    async getDetails() {

        this.setState({
            loading: true,
            organizations: [],
            users: [],
            locations: [],
            tabTitle: "",
            locationInfo: {},
            datasets: [],
            totalUserCount: undefined,
            totalOrganizationCount: undefined,
            totalLocationCount: undefined,
            totalRequestCount: undefined,
            totalDatasetCount: undefined,
            totalPointsEarnt: undefined,
            totalLikeCount: undefined,
            totalCommentCount: undefined,
            totalRatingCount: undefined,
            totalReportCount: undefined,
            totalShareCount: undefined,
            rank: undefined,
            lastActivity: undefined,
        })

        // this.setState({ directoryUrl: "/directory/" + lastLocation.type + "/" + (lastLocation.type === "city" ? lastLocation.cityId : lastLocation.countryId), })

        let type;
        let id;
        let countryName;

        let lastLocation = await Storage.getO("lastLocation");

        if (this.props.match.params.entity && this.props.match.params.id) {

            console.log("@@ URL READ")

            type = this.props.match.params.entity;
            id = this.props.match.params.id;
            countryName = "?";

        } else if (lastLocation && lastLocation.type) {
            console.log("@@ LOCAL LAST LOC READ");
            type = lastLocation.type;
            id = (lastLocation.type === "city") ? lastLocation.cityId : lastLocation.countryId;
            countryName = (lastLocation.type === "city") ? lastLocation.countryName : null;
        } else {
            console.log("@@ NOT LOC FALLBACK TO LONDON");
            type = "city"
            id = 227267
            countryName = "United Kingdom"
        }

        let cachedDirectory = await Storage.getO("cache-directory");

        // Loading from cache if available
        if (cachedDirectory) {
            if (cachedDirectory.type === type && parseInt(cachedDirectory.id) === parseInt(id)) {
                // Match, show it
                this.setState(cachedDirectory.data);
                if ((new Date(cachedDirectory.date)).getTime() + 60000 < (new Date()).getTime()) {
                    // Match, but 15 seconds has elapsed, requesting new from server
                    this.getDetailsFromServer(type, id)
                }
            } else {
                // No match, gettinf from server
                this.getDetailsFromServer(type, id)
            }
        } else {
            this.getDetailsFromServer(type, id)
        }

    }

    async getDetailsFromServer(type, id) {

        ReactGA.pageview(window.globalVars.serverIp + "directory/" + type + "/" + id);

        Server.api({
            method: "get",
            url: type + "/" + id,
            then: function(res) {

                console.log("============Got stats; ", res.data);

                if (res.data) {

                    res.data.tabTitle = (res.data.locationInfo.type === "city") ? res.data.locationInfo.cityName : res.data.locationInfo.countryName;
                    res.data.googleQuery = (res.data.locationInfo.type === "city") ? (res.data.locationInfo.cityName + "," + res.data.locationInfo.countryName) : res.data.locationInfo.countryName;
                    res.data.loading = null;
                    res.data.type = type;
                    res.data.id = id;

                    document.title = res.data.tabTitle + window.globalVars.pageTitle;

                    this.setState(res.data);

                    Storage.setO("cache-directory", {
                        date: new Date(),
                        type: type,
                        id: id,
                        data: res.data
                    })

                }

            }.bind(this),
            catch: function(code, error) {
                console.log(error, code);
                this.setState({
                    error: error,
                    loading: null
                })
            }.bind(this)
        })

    }

    async updateLocation(type, id, name, countryId, countryName) {

        let newLocationFilter = {}

        if (countryName) {
            newLocationFilter = {
                cityId: id,
                cityName: name,
                countryId: countryId,
                countryName: countryName,
                type: "city",
            };
        } else {
            newLocationFilter = {
                type: "country",
                countryId: id,
                countryName: name
            };
        }

        await Storage.setO("lastLocation", newLocationFilter);

        if (window.location.href.indexOf("/directory") === -1) {
            this.props.history.push("/directory");
        } else {
            this.getDetails();
        }

    }

    ionViewWillEnter() {

        this.getDetails();
        document.title = "Directory" + window.globalVars.pageTitle;

    }

    render() {
        return (
            <IonPage data-page="directory" ref={this.pageRef}>
                <IonContent>
                    <div className="header">
                        <div className="profile-picture">
                            { (this.state.loading) ?
                                <div className="loading">
                                    <IonSkeletonText animated style={{ width: '105%', margin: 'auto' }} />
                                </div>
                                :
                                <div>
                                    <div className="img" style={{ backgroundImage: `url('https://maps.googleapis.com/maps/api/staticmap?center=${this.state.googleQuery}&scale=2&size=300x300&maptype=terrain&format=png&visual_refresh=true&key=${window.globalVars.googleMapsAPI}')` }} />
                                </div>
                            }
                        </div>
                        <h1 onClick={() => { this.setState({ citySelectorModal: true }) }}>
                            { this.state.tabTitle ? this.state.tabTitle : <IonSkeletonText animated style={{ width: '35%', margin: 'auto' }} /> }
                            { this.state.tabTitle && <IonIcon icon={caretDownOutline} mode="md" /> }
                        </h1>
                        <div className="quick-stats">
                            <div>
                                <div className="icon-wrapper"> <IonIcon icon={podium} mode="md" /> </div>
                                <div className="meta">
                                    <p> { (this.state.totalPointsEarnt !== undefined) ? <span>{this.state.totalPointsEarnt}</span> : <IonSkeletonText animated style={{ width: '30%' }} /> } </p>
                                    <label> { (this.state.totalPointsEarnt !== undefined) ? <span>Points Earnt</span> : <IonSkeletonText animated style={{ width: '72%' }} /> } </label>
                                </div>
                            </div>
                            <div>
                                <div className="icon-wrapper"> <IonIcon icon={ribbon} mode="md" /> </div>
                                <div className="meta">
                                    <p> { (this.state.rank !== undefined) ? <span>{this.state.rank}</span> : <IonSkeletonText animated style={{ width: '30%' }} /> } </p>
                                    <label> { (this.state.rank !== undefined) ? <span>Rank</span> : <IonSkeletonText animated style={{ width: '72%' }} /> } </label>
                                </div>
                            </div>
                            <div>
                                <div className="icon-wrapper"> <IonIcon icon={fileTrayFull} mode="ios" /> </div>
                                <div className="meta">
                                    <p> { (this.state.totalDatasetCount !== undefined) ? <span>{this.state.totalDatasetCount}</span> : <IonSkeletonText animated style={{ width: '30%' }} /> } </p>
                                    <label> { (this.state.totalDatasetCount !== undefined) ? <span>Datasets</span> : <IonSkeletonText animated style={{ width: '72%' }} /> } </label>
                                </div>
                            </div>
                            <div>
                                <div className="icon-wrapper"> <IonIcon icon={compass} mode="md" /> </div>
                                <div className="meta">
                                    <p> { (this.state.totalLocationCount !== undefined) ? <span>{this.state.totalLocationCount}</span> : <IonSkeletonText animated style={{ width: '30%' }} /> } </p>
                                    <label> { (this.state.totalLocationCount !== undefined) ? <span>Locations</span> : <IonSkeletonText animated style={{ width: '72%' }} /> } </label>
                                </div>
                            </div>
                            <div>
                                <div className="icon-wrapper"> <IonIcon icon={helpCircle} mode="md" /> </div>
                                <div className="meta">
                                    <p> { (this.state.totalRequestCount !== undefined) ? <span>{this.state.totalRequestCount}</span> : <IonSkeletonText animated style={{ width: '30%' }} /> } </p>
                                    <label> { (this.state.totalRequestCount !== undefined) ? <span>Requests</span> : <IonSkeletonText animated style={{ width: '72%' }} /> } </label>
                                </div>
                            </div>
                            <div>
                                <div className="icon-wrapper"> <IonIcon icon={person} mode="md" /> </div>
                                <div className="meta">
                                    <p> { (this.state.totalUserCount !== undefined) ? <span>{this.state.totalUserCount}</span> : <IonSkeletonText animated style={{ width: '30%' }} /> } </p>
                                    <label> { (this.state.totalUserCount !== undefined) ? <span>Users</span> : <IonSkeletonText animated style={{ width: '72%' }} /> } </label>
                                </div>
                            </div>
                            <div>
                                <div className="icon-wrapper"> <IonIcon icon={business} mode="md" /> </div>
                                <div className="meta">
                                    <p> { (this.state.totalOrganizationCount !== undefined) ? <span>{this.state.totalOrganizationCount}</span> : <IonSkeletonText animated style={{ width: '30%' }} /> } </p>
                                    <label> { (this.state.totalOrganizationCount !== undefined) ? <span>Orgs</span> : <IonSkeletonText animated style={{ width: '72%' }} /> } </label>
                                </div>
                            </div>
                            <div>
                                <div className="icon-wrapper"> <IonIcon icon={thumbsUp} mode="md" /> </div>
                                <div className="meta">
                                    <p> { (this.state.totalLikeCount !== undefined) ? <span>{this.state.totalLikeCount}</span> : <IonSkeletonText animated style={{ width: '30%' }} /> } </p>
                                    <label> { (this.state.totalLikeCount !== undefined) ? <span>Likes</span> : <IonSkeletonText animated style={{ width: '72%' }} /> } </label>
                                </div>
                            </div>
                            <div>
                                <div className="icon-wrapper"> <IonIcon icon={chatbox} mode="md" /> </div>
                                <div className="meta">
                                    <p> { (this.state.totalCommentCount !== undefined) ? <span>{this.state.totalCommentCount}</span> : <IonSkeletonText animated style={{ width: '30%' }} /> } </p>
                                    <label> { (this.state.totalCommentCount !== undefined) ? <span>Comments</span> : <IonSkeletonText animated style={{ width: '72%' }} /> } </label>
                                </div>
                            </div>
                            <div>
                                <div className="icon-wrapper"> <IonIcon icon={star} mode="md" /> </div>
                                <div className="meta">
                                    <p> { (this.state.totalRatingCount !== undefined) ? <span>{this.state.totalRatingCount}</span> : <IonSkeletonText animated style={{ width: '30%' }} /> } </p>
                                    <label> { (this.state.totalRatingCount !== undefined) ? <span>Ratings</span> : <IonSkeletonText animated style={{ width: '72%' }} /> } </label>
                                </div>
                            </div>
                            <div>
                                <div className="icon-wrapper"> <IonIcon icon={warning} mode="md" /> </div>
                                <div className="meta">
                                    <p> { (this.state.totalReportCount !== undefined) ? <span>{this.state.totalReportCount}</span> : <IonSkeletonText animated style={{ width: '30%' }} /> } </p>
                                    <label> { (this.state.totalReportCount !== undefined) ? <span>Reports</span> : <IonSkeletonText animated style={{ width: '72%' }} /> } </label>
                                </div>
                            </div>
                            <div>
                                <div className="icon-wrapper"> <IonIcon icon={share} mode="md" /> </div>
                                <div className="meta">
                                    <p> { (this.state.totalShareCount !== undefined) ? <span>{this.state.totalShareCount}</span> : <IonSkeletonText animated style={{ width: '30%' }} /> } </p>
                                    <label> { (this.state.totalShareCount !== undefined) ? <span>Shares</span> : <IonSkeletonText animated style={{ width: '72%' }} /> } </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="latest">
                        <section>
                            <IonListHeader>
                                <IonLabel>Top Organizations</IonLabel>
                                <IonButton color="dark" onClick={() => { this.props.history.push("/users/org/" + this.state.type + "/" + this.state.id) }}>See all</IonButton>
                            </IonListHeader>
                            <div className="vertical-slider" style={{ whiteSpace: (!this.state.loading && this.state.organizations.length === 0) ? "unset" : "nowrap" }}>
                                { (this.state.loading) && [0, 1, 2].map(item => { return ( <UserBadge key={item} type="photo-username-subtext" loading={true} /> ) }) }
                                { (!this.state.loading && this.state.organizations.length !== 0) && this.state.organizations.map(item => {
                                    return ( <UserBadge key={item.id} onClick={() => { this.props.history.push("/profile/" + item.id) }} type="photo-username-subtext" subtext={Utilities.nFormatter(item.pointsEarnt, 1) + " Points"} photo={item.userPhoto} username={item.username} /> )
                                }) }
                                { (!this.state.loading && this.state.organizations.length === 0) &&
                                    <div className="no-results">
                                        <h4>No Organizations here</h4>
                                        <p>If you are an organization you can request access to post datasets</p>
                                        <IonButton color="dark" onClick={() => { this.props.history.push("/contact-us/Request organization account/I would like to request an organization account.") }}>Contact Us</IonButton>
                                    </div>
                                }
                            </div>
                        </section>
                        <section>
                            <IonListHeader>
                                <IonLabel>Top Contributors</IonLabel>
                                <IonButton color="dark" onClick={() => { this.props.history.push("/users/user/" + this.state.type + "/" + this.state.id) }}>See all</IonButton>
                            </IonListHeader>
                            <div className="vertical-slider" style={{ whiteSpace: (!this.state.loading && this.state.users.length === 0) ? "unset" : "nowrap" }}>
                                { (this.state.loading) && [0, 1, 2].map(item => { return ( <UserBadge key={item} type="photo-username-subtext" loading={true} /> ) }) }
                                { (!this.state.loading && this.state.users.length !== 0) && this.state.users.map(item => {
                                    return ( <UserBadge key={item.id} onClick={() => { this.props.history.push("/profile/" + item.id) }} type="photo-username-subtext" subtext={Utilities.nFormatter(item.pointsEarnt, 1) + " Points"} photo={item.userPhoto} username={item.username} /> )
                                }) }
                                { (!this.state.loading && this.state.users.length === 0) &&
                                    <div className="no-results">
                                        <h4>No Contributors yet</h4>
                                        <p>Be the first one to post a locaton and be the top contributor here</p>
                                        <IonButton color="dark" onClick={() => { this.props.history.push("/post") }}>Post location</IonButton>
                                    </div>
                                }
                            </div>
                        </section>
                        <section>
                            <IonListHeader>
                                <IonLabel>Latest Datasets</IonLabel>
                                <IonButton color="dark" onClick={() => { this.props.history.push("/dataset/list/" + this.state.type + "/" + this.state.id) }}>See all</IonButton>
                            </IonListHeader>
                            { (!this.state.loading && this.state.datasets.length === 0) &&
                                <div className="no-results" style={{ paddingRight: 0 }}>
                                    <h4>No datasets yet</h4>
                                </div>
                            }
                            { (!this.state.loading && this.state.datasets.length !== 0) &&
                                <IonList>
                                    { this.state.datasets.map(item => { return (<DatasetItem key={item.id} own={this.state.own} {...this.props} dataset={item} /> ) }) }
                                </IonList>
                            }
                            { (this.state.loading) &&
                                <IonList>
                                    { [1, 2, 3].map(item => { return (<DatasetItem key={item} loading={true} /> ) }) }
                                </IonList>
                            }
                        </section>
                        <section>
                            <IonListHeader>
                                <IonLabel>Latest Locations</IonLabel>
                                <IonButton color="dark" onClick={() => { this.props.history.push("/location/list/" + this.state.type + "/" + this.state.id) }}>See all</IonButton>
                            </IonListHeader>
                            { (!this.state.loading && this.state.locations.length === 0) &&
                                <div className="no-results" style={{ paddingRight: 0 }}>
                                    <h4>No locations yet</h4>
                                </div>
                            }
                            { (!this.state.loading && this.state.locations.length !== 0) &&
                                <IonList>
                                    { this.state.locations.map(item => { return (<LocationPreviewItem onSelect={(id) => { this.props.history.push("/location/" + id) }} key={item.id} own={this.state.own} {...this.props} location={item} /> ) }) }
                                </IonList>
                            }
                            { (this.state.loading) &&
                                <IonList>
                                    { [1, 2, 3].map(item => { return (<DatasetItem key={item} loading={true} /> ) }) }
                                </IonList>
                            }
                        </section>
                        <section>
                            <IonListHeader>
                                <IonLabel>Latest Requests</IonLabel>
                                <IonButton color="dark" onClick={() => { this.props.history.push("/request/list/" + this.state.type + "/" + this.state.id) }}>See all</IonButton>
                                <IonButton color="dark" onClick={() => { this.props.history.push("/request/new/edit") }}>
                                    <IonIcon icon={addCircle}></IonIcon>
                                </IonButton>
                            </IonListHeader>
                            { (!this.state.loading && this.state.requests.length === 0) &&
                                <div className="no-results" style={{ paddingRight: 0 }}>
                                    <h4>No requests yet</h4>
                                </div>
                            }
                            { (!this.state.loading && this.state.requests.length !== 0) &&
                                <IonList>
                                    { this.state.requests.map(item => { return (<EntityListItem key={item.id} {...this.props} actionType="request" entityType="request" entity={item} /> ) }) }
                                </IonList>
                            }
                            { (this.state.loading) &&
                                <IonList>
                                    { [1, 2, 3].map(item => { return (<DatasetItem key={item} loading={true} /> ) }) }
                                </IonList>
                            }
                        </section>
                    </div>
                    <IonToast
                        isOpen={this.state.error !== null}
                        onDidDismiss={() => this.setState({ error: null })}
                        message={this.state.error}
                        color={"danger"}
                        closeButtonText="Close"
                        duration={2000}
                        position="top"
                        showCloseButton={true}
                    />
                    <CitySelectorModal
                        presentingElement={this.pageRef}
                        open={this.state.citySelectorModal}
                        close={() => { this.setState({ citySelectorModal: false }) } }
                        onSelect={(type, id, name, countryId, countryName) => { this.updateLocation(type, id, name, countryId, countryName); }}
                    />
                </IonContent>
            </IonPage>
        );
    }

};

export default withIonLifeCycle(Directory);
