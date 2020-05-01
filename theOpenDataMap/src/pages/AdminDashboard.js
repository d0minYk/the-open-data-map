import { IonActionSheet, IonBackButton, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonListHeader, IonPage, IonSearchbar, IonSegment, IonSegmentButton, IonThumbnail, IonTitle, IonToolbar, withIonLifeCycle } from '@ionic/react';
import React from 'react';
import EntityListItem from '../modals/EntityListItem.js';
import UserBadge from '../modals/UserBadge.js';
import Server from '../Server.js';
import Storage from '../Storage.js';
import '../styles/AdminDashboard.scss';

class About extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            section: "stats",
            keywords: "",
            statistics: {},
            users: [],
            requests: [],
            actionMenuUserId: null
        }
    }

    setSection(section) {

        if (section === this.state.section) {
            return;
        }

        this.setState({
            keywords: ""
        }, function() {

            if (section === "stats") {
                this.getStats();
            } else if (section === "users") {
                this.getUsers();
            } else if (section === "requests") {
                this.getRequests();
            }

            this.setState({
                section: section,
                keywords: ""
            })

        })

    }

    getUsers() {

        Server.api({
            method: "get",
            url: "/user",
            params: { keywords: this.state.keywords },
            then: function(res) {
                console.log("Got users", res.data);
                this.setState({ users: res.data })
            }.bind(this),
            catch: function(code, error) { console.error("Failed to get users", error, code) }.bind(this)
        })

    }

    getRequests() {

        Server.api({
            method: "get",
            url: "/request",
            params: { keywords: this.state.keywords },
            then: function(res) {
                console.log("Got requests", res.data);
                this.setState({ requests: res.data })
            }.bind(this),
            catch: function(code, error) { console.error("Failed to get users", error, code) }.bind(this)
        })

    }

    loginAs(userId) {

        Server.api({
            method: "get",
            url: "/user/" + userId + "/login-as",
            then: async function(res) {
                await Storage.setO("adminUser", await Storage.getO("user"));
                await Storage.setO("adminAuthToken", await Storage.getO("authToken"));
                await Storage.setO("user", res.data);
                await Storage.setO("authToken", res.data.token);
                window.location.href = "/";
            }.bind(this),
            catch: function(code, error) { console.error("Failed to get users", error, code) }.bind(this)
        })

    }

    toggleBlock(userId) {

        Server.api({
            method: "put",
            url: "/user/" + userId + "/block",
            then: function(res) { this.getUsers(); }.bind(this),
            catch: function(code, error) { console.error("Failed to toggle block", error, code) }.bind(this)
        })

    }

    getStats() {

        Server.api({
            method: "get",
            url: "/statistics",
            then: function(res) { this.setState({ statistics: res.data }) }.bind(this),
            catch: function(code, error) { console.error("Failed to get stats", error, code) }.bind(this)
        })

    }

    async ionViewWillEnter() {
        this.getStats();
    }

    render() {
        return (
            <IonPage data-page="admin-dashboard">
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                        <IonBackButton onClick={() => { this.props.history.goBack();  }} />
                    </IonButtons>
                    <IonTitle>Admin Dashboard</IonTitle>
                </IonToolbar>
                </IonHeader>
                <IonContent>
                    <IonSegment mode="ios" value={this.state.section} onIonChange={e => this.setSection(e.detail.value) }>
                        <IonSegmentButton value="stats">
                            <IonLabel>Stats</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="users">
                            <IonLabel>Users</IonLabel>
                        </IonSegmentButton>
                        {/*<IonSegmentButton value="locations">
                            <IonLabel>Locations</IonLabel>
                        </IonSegmentButton>*/}
                        <IonSegmentButton value="requests">
                            <IonLabel>Reqs</IonLabel>
                        </IonSegmentButton>
                    </IonSegment>
                    { (this.state.section === "stats") &&
                        <div className="statistics">
                            <IonListHeader>Statistics</IonListHeader>
                            <div>
                                { (this.state.statistics.locations) && <div> <p>{this.state.statistics.locations}</p> <label>Locations</label> </div> }
                                { (this.state.statistics.users) && <div> <p>{this.state.statistics.users}</p> <label>Users</label> </div> }
                                { (this.state.statistics.organizations) && <div> <p>{this.state.statistics.organizations}</p> <label>Organizations</label> </div> }
                                { (this.state.statistics.datasets) && <div> <p>{this.state.statistics.datasets}</p> <label>Datasets</label> </div> }
                                { (this.state.statistics.cities) && <div> <p>{this.state.statistics.cities}</p> <label>Cities</label> </div> }
                                { (this.state.statistics.countries) && <div> <p>{this.state.statistics.countries}</p> <label>Countries</label> </div> }
                                { (this.state.statistics.likes) && <div> <p>{this.state.statistics.likes}</p> <label>Likes</label> </div> }
                                { (this.state.statistics.comments) && <div> <p>{this.state.statistics.comments}</p> <label>Comments</label> </div> }
                                { (this.state.statistics.ratings) && <div> <p>{this.state.statistics.ratings}</p> <label>Ratings</label> </div> }
                                { (this.state.statistics.shares) && <div> <p>{this.state.statistics.shares}</p> <label>Shares</label> </div> }
                                { (this.state.statistics.reports) && <div> <p>{this.state.statistics.reports}</p> <label>Reports</label> </div> }
                                { (this.state.statistics.categories) && <div> <p>{this.state.statistics.categories}</p> <label>Categories</label> </div> }
                                { (this.state.statistics.features) && <div> <p>{this.state.statistics.features}</p> <label>Features</label> </div> }
                            </div>
                        </div>
                    }
                    { (this.state.section === 'users' || this.state.section === 'requests') &&
                        <IonSearchbar
                            debounce={600}
                            showCancelButton="focus"
                            value={this.state.keywords}
                            onIonChange={(e) => {
                                this.setState({
                                    keywords: e.target.value
                                }, function() {
                                    if (this.state.section === "users") {
                                        this.getUsers();
                                    } else if (this.state.section === "requests") {
                                        this.getRequests();
                                    }
                                })
                            }}
                            placeholder="Search"
                        / >
                    }
                    { (this.state.section === 'users') &&
                        <div className="users">
                            <IonList>
                                { this.state.users.map(item => {
                                    return (
                                        <IonItem onClick={ () => { this.setState({ actionMenuUserId: item.id }) } }>
                                            <IonThumbnail slot="start">
                                                <UserBadge type="list-photo" photo={item.picture} username={item.username} />
                                            </IonThumbnail>
                                            <IonLabel class="ion-text-wrap">
                                                <h2>{item.username}</h2>
                                                <h3>{item.email}</h3>
                                                <p>{item.points} Points, {item.rank}, {(item.locked ? "Locked" : "Active")}</p>
                                            </IonLabel>
                                        </IonItem>
                                    )
                                }) }
                            </IonList>
                        </div>
                    }
                    { (this.state.section === 'requests') &&
                        <div className="requests">
                            <IonList>
                                { this.state.requests.map(item => {
                                    return (
                                        <EntityListItem {...this.props} entityType="request" actionType="request" entity={item} />
                                    )
                                }) }
                            </IonList>
                        </div>
                    }
                </IonContent>
                <IonActionSheet
                    header="Options"
                    isOpen={this.state.actionMenuUserId !== null}
                    onDidDismiss={() => { this.setState({ actionMenuUserId: null }) }}
                    buttons={[
                        {
                            text: 'Toggle Block',
                            role: 'destructive',
                            handler: () => { this.toggleBlock(this.state.actionMenuUserId) }
                        },
                        {
                            text: 'Profile',
                            handler: () => { this.props.history.push("/profile/" + this.state.actionMenuUserId); }
                        },
                        {
                            text: 'Log in as',
                            handler: () => { this.loginAs(this.state.actionMenuUserId) }
                        },
                    ]}
                />
            </IonPage>
        );
    }

};

export default withIonLifeCycle(About);
