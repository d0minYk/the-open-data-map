import { IonSpinner, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonLabel, IonList, IonListHeader, IonPage, IonSegment, IonSegmentButton, IonSkeletonText, IonTitle, IonToast, IonToolbar, withIonLifeCycle } from '@ionic/react';
import { addCircle, airplane, arrowBackCircle, arrowForwardCircle, chatbox, compass, fileTrayFull, home, mail, podium, ribbon, settings, share, star, subway, thumbsUp, warning } from 'ionicons/icons';
import React, { createRef } from 'react';
import EntityListItem from '../modals/EntityListItem.js';
import Settings from '../modals/Settings.js';
import Server from '../Server.js';
import Storage from '../Storage.js';
import '../styles/Profile.scss';
import Utilities from '../Utilities.js';

class Profile extends React.Component {

    constructor(props) {
        super(props)
        this.pageRef = createRef();
        this.settingsModalRef = createRef();
        this.state = {
            citySelectorModal: false,
            modal: false,
            userType: 'user',
            statistics: null,
            own: false,
            settingsModal: false,
            loggedInAs: false,
            readyToRender: false,
            section: 'notifications',
            error: null
        }
    }

    async logBackToAdmin() {
        await Storage.setO("user", await Storage.getO("adminUser"));
        await Storage.setO("authToken", await Storage.getO("adminAuthToken"));
        await Storage.remove("adminUser");
        await Storage.remove("adminAuthToken");
        window.location.href = "/";
    }

    ionViewDidLeave() {
        this.setState({ readyToRender: false })
    }

    ionViewDidEnter() {
        this.setState({ readyToRender: true })
    }

    async ionViewWillEnter() {

        document.title = "Profile" + window.globalVars.pageTitle;

        let user = await Storage.getO("user")
        let defaultLocation = await Storage.getO("defaultLocation");
        let adminAuthToken = await Storage.getO("adminAuthToken");

        if (user && user.type === "admin" && !this.props.match.params.id) {
            this.props.history.push("/admin");
            return;
        }

        if (!this.props.match.params.id && !user) {
            this.props.history.push("/login")
            return;
        }

        let userId = this.props.match.params.id ? this.props.match.params.id : user.id;

        this.setState({
            userType: user ? user.type : null,
            userId: user ? user.id : null,
            defaultLocation: defaultLocation,
            loggedInAs: adminAuthToken,
            displayedId: userId,
            timeline: null
        }, async function() {

            let sectionToGet = "";

            if ( (!this.props.match.params.id) || ( user && (parseInt(this.props.match.params.id) === user.id) ) ) {
                this.setState({
                    own: true,
                    section: "notifications"
                })
                sectionToGet = "notifications";
            } else {
                this.setState({
                    own: false,
                    section: "activity"
                })
                sectionToGet = "activity";
            }

            console.log("Getting: " + userId);

            let cachedUser = await Storage.getO("cache-user-main");
            let cachedUserActivity = await Storage.getO("cache-user-activity");
            let cachedUserNotifications = await Storage.getO("cache-user-notifications");

            // Loading from cache if available
            if (cachedUser && ( (cachedUserActivity && cachedUser.section === "activity") || (cachedUserNotifications && cachedUser.section === "notifications") ) ) {
                if (parseInt(cachedUser.id) === parseInt(userId)) {

                    this.setState(cachedUser.data);
                    this.setState({ section: cachedUser.section })

                    if (cachedUser.section === "activity") {
                        this.setState({ timeline: cachedUserActivity.data.timeline, })
                    } else {
                        this.setState({ timeline: cachedUserNotifications.data.timeline, })
                    }

                    if ((new Date(cachedUser.date)).getTime() + 60000 < (new Date()).getTime()) { } else {
                        // No need to reload because it was loaded a minte ago
                        return;
                    }

                }
            }

            // console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! NEED FREH!!!!!!!!!!")

            if (sectionToGet === "activity") {
                this.getActivity();
            } else {
                this.getNotifications();
            }

            Server.api({
                method: "get",
                url: "user/" + userId,
                then: async function(res) {

                    console.log("GOT stats", res.data)

                    this.setState({
                        statistics: res.data.statistics,
                        username: res.data.username,
                        email: res.data.email,
                        picture: res.data.picture,
                        displayedId: userId,
                    })

                    document.title = res.data.username + window.globalVars.pageTitle;

                    if (this.state.own) {
                        await Storage.setO("defaultLocation", res.data.statistics.home || null);
                        await Storage.setO("profilePicture", res.data.picture || null);
                        await Storage.setO("ckanUrl", res.data.ckanUrl || null);
                        await Storage.setO("requestAutoAssigns", res.data.requestAutoAssigns || null);
                    }

                    let previousSearches = (await Storage.getO("previousSearches")) || {};
                    previousSearches["user-" + userId] = res.data.username;
                    Storage.setO("previousSearches", previousSearches)

                    Storage.setO("cache-user-main", {
                        date: new Date(),
                        section: sectionToGet,
                        id: userId,
                        data: res.data
                    })

                    //
                    // this.setState({
                    //     locations: res.data.data,
                    //     loading: false,
                    //     locationListModal: (res.data && res.data.length > 0) ? "minimized" : "hidden"
                    // }, function() {
                    //     setTimeout(function() {
                    //         if (res.data.length !== 0) {
                    //             const map = this.mapRef.current.leafletElement;
                    //             const group = this.groupRef.current.leafletElement;
                    //             let bounds = group.getBounds();
                    //             if (bounds.isValid())
                    //                 map.fitBounds(bounds);
                    //             console.log(map, group)
                    //         }
                    //     }.bind(this), 1000)
                    // })

                }.bind(this),
                catch: function(code, error) {
                    this.setState({
                        error: error,
                        loading: false
                    })
                }.bind(this)
            })

        })

    }

    setSection(section) {

        if (section === this.state.section) {
            return;
        }

        this.setState({
            section: section,
            timeline: null
        }, function() {

            if (section === "notifications") {
                this.getNotifications();
            } else if (section === "activity") {
                this.getActivity();
            }

        })

    }

    getNotifications() {

        console.log("@@ GEtting notifications");

        Server.api({
            method: "get",
            url: "user/" + this.state.displayedId + "/timeline/inbox",
            then: async function(res) {
                console.log("GOT stats", res.data);
                this.setState({
                    timeline: res.data,
                    section: "notifications"
                })
                await Storage.setO("cache-user-notifications", {
                    id: this.state.displayedId,
                    data: {
                        timeline: res.data
                    },
                    date: new Date()
                })
                let cachedUser = await Storage.getO("cache-user-main");
                if (cachedUser && cachedUser.section !== "notifications") {
                    cachedUser.section = "notifications";
                    await await Storage.setO("cache-user-main", cachedUser);
                }
            }.bind(this),
            catch: function(code, error) {
                console.error("got error", code, error);
                this.setState({
                    error: error,
                    loading: false
                })
            }.bind(this)
        })

    }

    getActivity() {

        console.log("@@ GEtting activity");

        Server.api({
            method: "get",
            url: "user/" + this.state.displayedId + "/timeline/outbox",
            then: async function(res) {
                console.log("GOT stats", res.data);
                this.setState({
                    timeline: res.data,
                    section: "activity"
                })
                Storage.setO("cache-user-activity", {
                    id: this.state.displayedId,
                    data: {
                        timeline: res.data
                    },
                    date: new Date()
                })
                let cachedUser = await Storage.getO("cache-user-main");
                if (cachedUser && cachedUser.section !== "activity") {
                    cachedUser.section = "activity";
                    await await Storage.setO("cache-user-main", cachedUser);
                }
            }.bind(this),
            catch: function(code, error) {
                console.error("got error", code, error);
                this.setState({
                    error: error,
                    loading: false
                })
            }.bind(this)
        })

    }

    async arrowForwardCircle() {
        await Storage.clear();
        window.location.href = "/splash"
    }

    // async updateLocation(type, id, name) {
    //     await Storage.setO("currentCity", {
    //         id: id,
    //         name: name,
    //         type: type
    //     })
    // }

    render() {

        return (
            <IonPage data-page="profile" ref={this.pageRef}>
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonBackButton onClick={() => { this.props.history.goBack(); }} />
                        </IonButtons>
                        <IonTitle></IonTitle>
                        <IonButtons slot="end">
                            { this.state.own && <IonIcon style={{ color: 'white' }} icon={settings} mode="md" onClick={() => { this.setState({ settingsModal: true }) }} /> }
                            { this.state.own && <IonIcon style={{ color: 'white' }} icon={arrowForwardCircle} mode="md" onClick={() => { this.arrowForwardCircle() }} /> }
                            { !this.state.own && <IonIcon style={{ color: 'white' }} icon={warning} mode="md" onClick={() => {
                                this.props.history.push("/contact-us/Inappropriate user behaviour or content/I would like to report " + this.state.username + " because")
                            }} /> }
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    { /* (window.globalVars.size === "small") &&
                        <div className="scroll-filler" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '200px', background: '#5F6CAF', zIndex: '1' }} />
                    */ }
                    <div className="header">
                        <div className="profile-picture">
                            { (!this.state.username) ?
                                <div className="loading">
                                    <IonSkeletonText animated style={{ width: '105%', margin: 'auto' }} />
                                </div>
                                :
                                <div>
                                    { (this.state.picture) ?
                                        <div className="img" style={{ backgroundImage: `url('${window.globalVars.profilePicturesPath + this.state.picture}')` }} />
                                        :
                                        <div className="initial">{this.state.username[0]}</div>
                                    }
                                </div>
                            }
                        </div>
                        <h1>{ this.state.username ? this.state.username : <IonSkeletonText animated style={{ width: '35%', margin: 'auto' }} /> }</h1>
                        { (this.state.email) &&
                            <div className="contact" onClick={() => { window.open("mailto:" + this.state.email) }}>
                                <div className="email">
                                    <IonIcon icon={mail} />
                                    <span>{this.state.email}</span>
                                </div>
                            </div>
                        }
                        <div className="quick-stats">
                            {/*<div>
                                <div className="icon-wrapper"> <IonIcon icon={home} mode="md" /> </div>
                                <div className="meta">
                                    <p>London</p>
                                    <label>Current City</label>
                                </div>
                            </div>*/}
                            { (!this.state.statistics || this.state.statistics.points !== undefined) &&
                                <div>
                                    <div className="icon-wrapper"> <IonIcon icon={home} mode="md" /> </div>
                                    <div className="meta">
                                        <p> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '30%' }} /> : <span>{this.state.statistics.home ? this.state.statistics.home.cityName : "-"}</span> } </p>
                                        <label> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '72%' }} /> : <span>Home</span> } </label>
                                    </div>
                                </div>
                            }
                            { (!this.state.statistics || this.state.statistics.points !== undefined) &&
                                <div>
                                    <div className="icon-wrapper"> <IonIcon icon={podium} mode="md" /> </div>
                                    <div className="meta">
                                        <p> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '30%' }} /> : <span>{this.state.statistics.points}</span> } </p>
                                        <label> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '72%' }} /> : <span>Points</span> } </label>
                                    </div>
                                </div>
                            }
                            { (!this.state.statistics || this.state.statistics.rank !== undefined) &&
                                <div>
                                    <div className="icon-wrapper"> <IonIcon icon={ribbon} mode="md" /> </div>
                                    <div className="meta">
                                        <p> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '30%' }} /> : <span>{Utilities.capitalize(this.state.statistics.rank)}</span> } </p>
                                        <label> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '72%' }} /> : <span>Rank</span> } </label>
                                    </div>
                                </div>
                            }
                            { (!this.state.statistics || this.state.statistics.countries !== undefined) &&
                                <div>
                                    <div className="icon-wrapper"> <IonIcon icon={airplane} mode="md" /> </div>
                                    <div className="meta">
                                        <p> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '30%' }} /> : <span>{this.state.statistics.countries}</span> } </p>
                                        <label> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '72%' }} /> : <span>Countries</span> } </label>
                                    </div>
                                </div>
                            }
                            { (!this.state.statistics || this.state.statistics.cities !== undefined) &&
                                <div>
                                    <div className="icon-wrapper"> <IonIcon icon={subway} mode="md" /> </div>
                                    <div className="meta">
                                        <p> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '30%' }} /> : <span>{this.state.statistics.cities}</span> } </p>
                                        <label> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '72%' }} /> : <span>Cities</span> } </label>
                                    </div>
                                </div>
                            }
                            { (!this.state.statistics || this.state.statistics.locations !== undefined) &&
                                <div>
                                    <div className="icon-wrapper"> <IonIcon icon={compass} mode="md" /> </div>
                                    <div className="meta">
                                        <p> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '30%' }} /> : <span>{this.state.statistics.locations}</span> } </p>
                                        <label> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '72%' }} /> : <span>Locations</span> } </label>
                                    </div>
                                </div>
                            }
                            { (!this.state.statistics || this.state.statistics.datasets !== undefined) &&
                                <div onClick={() => { this.props.history.push("/dataset/list/organization/" + this.state.displayedId) }}>
                                    <div className="icon-wrapper"> <IonIcon icon={fileTrayFull} mode="ios" /> </div>
                                    <div className="meta">
                                        <p> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '30%' }} /> : <span>{this.state.statistics.datasets}</span> } </p>
                                        <label> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '72%' }} /> : <span>Datasets</span> } </label>
                                    </div>
                                </div>
                            }
                            { (!this.state.statistics || (this.state.statistics.like !== undefined && this.state.statistics.like.received !== undefined)) &&
                                <div>
                                    <div className="icon-wrapper"> <IonIcon icon={thumbsUp} mode="md" /> </div>
                                    <div className="meta">
                                        <p> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '30%' }} /> : <span>
                                            <IonIcon icon={arrowBackCircle} mode="md" /><span>{this.state.statistics.like.received}</span>
                                        </span> } </p>
                                        <label> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '72%' }} /> : <span>Likes</span> } </label>
                                    </div>
                                </div>
                            }
                            { (!this.state.statistics || (this.state.statistics.like !== undefined && this.state.statistics.like.sent !== undefined)) &&
                                <div>
                                    <div className="icon-wrapper"> <IonIcon icon={thumbsUp} mode="md" /> </div>
                                    <div className="meta">
                                        <p> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '30%' }} /> : <span>
                                            <IonIcon icon={arrowForwardCircle} mode="md" /><span>{this.state.statistics.like.sent}</span>
                                        </span> } </p>
                                        <label> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '72%' }} /> : <span>Likes</span> } </label>
                                    </div>
                                </div>
                            }
                            { (!this.state.statistics || (this.state.statistics.comment !== undefined && this.state.statistics.comment.received !== undefined)) &&
                                <div>
                                    <div className="icon-wrapper"> <IonIcon icon={chatbox} mode="md" /> </div>
                                    <div className="meta">
                                        <p> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '30%' }} /> : <span>
                                            <IonIcon icon={arrowBackCircle} mode="md" /><span>{this.state.statistics.comment.received}</span>
                                        </span> } </p>
                                        <label> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '72%' }} /> : <span>Comments</span> } </label>
                                    </div>
                                </div>
                            }
                            { (!this.state.statistics || (this.state.statistics.comment !== undefined && this.state.statistics.comment.sent !== undefined)) &&
                                <div>
                                    <div className="icon-wrapper"> <IonIcon icon={chatbox} mode="md" /> </div>
                                    <div className="meta">
                                        <p> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '30%' }} /> : <span>
                                            <IonIcon icon={arrowForwardCircle} mode="md" /><span>{this.state.statistics.comment.sent}</span>
                                        </span> } </p>
                                        <label> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '72%' }} /> : <span>Comments</span> } </label>
                                    </div>
                                </div>
                            }
                            { (!this.state.statistics || (this.state.statistics.rating !== undefined && this.state.statistics.rating.received !== undefined)) &&
                                <div>
                                    <div className="icon-wrapper"> <IonIcon icon={star} mode="md" /> </div>
                                    <div className="meta">
                                        <p> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '30%' }} /> : <span>
                                            <IonIcon icon={arrowBackCircle} mode="md" /><span>{this.state.statistics.rating.received}</span>
                                        </span> } </p>
                                        <label> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '72%' }} /> : <span>Ratings</span> } </label>
                                    </div>
                                </div>
                            }
                            { (!this.state.statistics || (this.state.statistics.rating !== undefined && this.state.statistics.rating.sent !== undefined)) &&
                                <div>
                                    <div className="icon-wrapper"> <IonIcon icon={star} mode="md" /> </div>
                                    <div className="meta">
                                        <p> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '30%' }} /> : <span>
                                            <IonIcon icon={arrowForwardCircle} mode="md" /><span>{this.state.statistics.rating.sent}</span>
                                        </span> } </p>
                                        <label> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '72%' }} /> : <span>Ratings</span> } </label>
                                    </div>
                                </div>
                            }
                            { (!this.state.statistics || (this.state.statistics.report !== undefined && this.state.statistics.report.received !== undefined)) &&
                                <div>
                                    <div className="icon-wrapper"> <IonIcon icon={warning} mode="md" /> </div>
                                    <div className="meta">
                                        <p> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '30%' }} /> : <span>
                                            <IonIcon icon={arrowBackCircle} mode="md" /><span>{this.state.statistics.report.received}</span>
                                        </span> } </p>
                                        <label> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '72%' }} /> : <span>Reports</span> } </label>
                                    </div>
                                </div>
                            }
                            { (!this.state.statistics || (this.state.statistics.report !== undefined && this.state.statistics.report.sent !== undefined)) &&
                                <div>
                                    <div className="icon-wrapper"> <IonIcon icon={warning} mode="md" /> </div>
                                    <div className="meta">
                                        <p> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '30%' }} /> : <span>
                                            <IonIcon icon={arrowForwardCircle} mode="md" /><span>{this.state.statistics.report.sent}</span>
                                        </span> } </p>
                                        <label> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '72%' }} /> : <span>Reports</span> } </label>
                                    </div>
                                </div>
                            }
                            { (!this.state.statistics || (this.state.statistics.share !== undefined && this.state.statistics.share.received !== undefined)) &&
                                <div>
                                    <div className="icon-wrapper"> <IonIcon icon={share} mode="md" /> </div>
                                    <div className="meta">
                                        <p> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '30%' }} /> : <span>
                                            <IonIcon icon={arrowBackCircle} mode="md" /><span>{this.state.statistics.share.received}</span>
                                        </span> } </p>
                                        <label> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '72%' }} /> : <span>Shares</span> } </label>
                                    </div>
                                </div>
                            }
                            { (!this.state.statistics || (this.state.statistics.share !== undefined && this.state.statistics.share.sent !== undefined)) &&
                                <div>
                                    <div className="icon-wrapper"> <IonIcon icon={share} mode="md" /> </div>
                                    <div className="meta">
                                        <p> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '30%' }} /> : <span>
                                            <IonIcon icon={arrowForwardCircle} mode="md" /><span>{this.state.statistics.share.sent}</span>
                                        </span> } </p>
                                        <label> { (!this.state.statistics) ? <IonSkeletonText animated style={{ width: '72%' }} /> : <span>Shares</span> } </label>
                                    </div>
                                </div>
                            }
                            {/*<div>
                                <div className="icon-wrapper"> <IonIcon icon={help} mode="md" /> </div>
                                <div className="meta">
                                    <p>1</p>
                                    <label>Requests</label>
                                </div>
                            </div>*/}
                        </div>
                    </div>

                    <IonSegment mode="ios" value={this.state.section} onIonChange={e => this.setSection(e.detail.value) }>
                        <IonSegmentButton value="notifications">
                            <IonLabel>{ (this.state.own) ? "Notifications": "Timeline" }</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="activity">
                            <IonLabel>{ (this.state.own) ? "My Posts": "Their Posts" }</IonLabel>
                        </IonSegmentButton>
                    </IonSegment>
                    { (this.state.loggedInAs) &&
                        <IonButton expand="block" onClick={() => { this.logBackToAdmin(); }}>
                            Log back to admin
                        </IonButton>
                    }
                    { (!this.state.timeline) &&
                        <IonList className="loading">
                            <IonSpinner className="big" name="crescent" />
                        </IonList>
                    }
                    { (this.state.timeline) &&
                        <div>
                            {
                                [
                                    { label: "CKAN Matches", field: "ckan", allLink: "/profile/" + this.state.displayedId + "/ckan" },
                                    { label: "Datasets", field: "datasets", addLink:"/dataset/setup/new/source", allLink: "/dataset/list/organization/" + this.state.displayedId },
                                    { label: "Locations", field: "locations", extraLink: { title: "Map", link: "/map/query/(authorId = \"" + this.state.displayedId + "\")"  } ,addLink:"/location/new/edit", allLink: "/location/list/organization/" + this.state.displayedId },
                                    { label: "Likes", field: "likes", allLink: "/profile/" + this.state.displayedId + "/" + (this.state.section === "notifications" ? "inbox" : "outbox") + "/likes" },
                                    { label: "Comments", field: "comments", allLink: "/profile/" + this.state.displayedId + "/" + (this.state.section === "notifications" ? "inbox" : "outbox") + "/comments" },
                                    { label: "Ratings", field: "ratings", allLink: "/profile/" + this.state.displayedId + "/" + (this.state.section === "notifications" ? "inbox" : "outbox") + "/ratings" },
                                    { label: "Shares", field: "shares", allLink: "/profile/" + this.state.displayedId + "/" + (this.state.section === "notifications" ? "inbox" : "outbox") + "/shares" },
                                    { label: "Reports", field: "reports", allLink: "/profile/" + this.state.displayedId + "/" + (this.state.section === "notifications" ? "inbox" : "outbox") + "/reports" },
                                    { label: "Requests", field: "requests", allLink: "/request/list/user/" + this.state.displayedId },
                                ].map(section => {

                                    if (section.field === "datasets" && this.state.own && this.state.userType !== "org") return null

                                    if (section.field === "ckan" && (!this.state.timeline[section.field] || this.state.userType !== "org")) return null
                                    if (section.field === "requests" && (!this.state.timeline[section.field]) ) return null
                                    if (section.field === "datasets" && this.state.section === "notifications" && !this.state.timeline[section.field]) return null
                                    if (section.field === "locations" && this.state.section === "notifications" && !this.state.timeline[section.field]) return null
                                    let headerTitle = section.label + " " + (this.state.section === "notifications" ? "Received" : "Sent");

                                    if (section.field === "datasets") headerTitle = "Latest Datasets"
                                    if (section.field === "locations") headerTitle = "Latest Locations"
                                    if (section.field === "ckan") headerTitle = "Latest CKAN Matches"

                                    if (section.field === "requests") {
                                        headerTitle = (this.state.section === "notifications") ? "Assigned Requests" : "Sent Requests"
                                    }

                                    return (
                                        <div key={section.field}>
                                            <IonListHeader>
                                                <IonLabel>{headerTitle}</IonLabel>
                                                { (section.allLink) &&
                                                    <IonButton color="dark" onClick={() => { this.props.history.push(section.allLink) }}>See all</IonButton>
                                                }
                                                { (section.extraLink) &&
                                                    <IonButton color="dark" onClick={() => { this.props.history.push(section.extraLink.link) }}>{section.extraLink.title}</IonButton>
                                                }
                                                { (section.addLink && this.state.own) &&
                                                    <IonButton color="dark" onClick={() => { this.props.history.push(section.addLink) }}>
                                                        <IonIcon icon={addCircle}></IonIcon>
                                                    </IonButton>
                                                }
                                            </IonListHeader>
                                            <IonList>
                                                { this.state.timeline[section.field] && this.state.timeline[section.field].map(item => {
                                                    return (
                                                        <EntityListItem
                                                            key={(item.entityId || item.id) + "-" + section.field}
                                                            {...this.props}
                                                            actionType={section.field}
                                                            date={item.date || item.updatedAt || item.updatedat || item.createdAt || item.createdat}
                                                            showSocialActions={true} actionOfThisUser={this.state.section !== "notifications"}
                                                            new={item.new}
                                                            ownId={this.state.userId}
                                                            body={item.body}
                                                            rating={item.rating}
                                                            cause={item.cause}
                                                            platform={item.platform}
                                                            entityType={item.entityType}
                                                            entityId={item.entityId || item.id}
                                                            entityUserId={item.entityUserId}
                                                            entity={item.entity || item.meta || item}
                                                            username={item.username}
                                                            userPhoto={item.userPhoto}
                                                        />
                                                    )
                                                }) }
                                            </IonList>
                                            { (!this.state.timeline[section.field] || this.state.timeline[section.field].length === 0) &&
                                                <div className="no-results">
                                                    <h4>No {section.label}</h4>
                                                </div>
                                            }
                                        </div>
                                    )

                                })
                            }
                        </div>
                    }
                    <Settings
                        modal={this.state.settingsModal}
                        presentingElement={this.pageRef}
                        close={() => {
                            Storage.remove("cache-user-main");
                            this.setState({ settingsModal: false })
                            this.ionViewWillEnter();
                        }}
                        hardReload={() => {
                            console.log("HARD RELOAD");
                            Storage.remove("cache-user-main");
                            this.ionViewWillEnter();
                        }}
                    />
                </IonContent>
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
            </IonPage>
        );
    }

};

export default withIonLifeCycle(Profile);
