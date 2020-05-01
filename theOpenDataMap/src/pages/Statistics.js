import { IonAlert, IonBackButton, IonBadge, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonListHeader, IonLoading, IonPage, IonThumbnail, IonTitle, IonToolbar, withIonLifeCycle } from '@ionic/react';
import React from 'react';
import UserBadge from '../modals/UserBadge.js';
import Server from '../Server.js';
import Utilities from '../Utilities.js';
import '../styles/Statistics.scss';

class Statistics extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            statistics: {},
            leaderboards: {},
            loading: true,
            error: null
        }
    }

    async ionViewWillEnter() {
        document.title = "Statistics" + window.globalVars.pageTitle;
        this.getStats();
    }

    getStats() {

        this.setState({ loading: true, error: null })

        Server.api({
            method: "get",
            url: "/statistics",
            then: function(res) {
                this.setState({ statistics: res.data })
                if (this.state.leaderboards.cities) {
                    this.setState({ loading: false })
                }
            }.bind(this),
            catch: function(code, error) {
                console.error("Failed to get stats", error, code);
                this.setState({ error: "Failed to get statistics", loading: false, })
            }.bind(this)
        })

        Server.api({
            method: "get",
            url: "/statistics/leaderboards",
            then: function(res) {
                this.setState({ leaderboards: res.data })
                if (this.state.statistics.cities) {
                    this.setState({ loading: false })
                }
            }.bind(this),
            catch: function(code, error) {
                console.error("Failed to get stats", error, code)
                this.setState({ error: "Failed to get statistics", loading: false, })
            }.bind(this)
        })

    }

    render() {
        return (
            <IonPage data-page="statistics">
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonBackButton onClick={() => { this.props.history.goBack();  }} />
                        </IonButtons>
                    <IonTitle>Statistics</IonTitle>
                </IonToolbar>
                </IonHeader>
                <IonContent>
                    <IonListHeader>Statistics</IonListHeader>
                    <div className="statistics">
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
                    <IonListHeader>Top Organizations</IonListHeader>
                    <IonList className="users">
                        { (this.state.leaderboards.organizations) && this.state.leaderboards.organizations.map(item => {
                            return (
                                <IonItem key={item.id} onClick={() => { this.props.history.push("/profile/" + item.id) }}>
                                    <IonThumbnail slot="start">
                                        <UserBadge type="list-photo" photo={item.userPhoto} username={item.username} />
                                    </IonThumbnail>
                                    <IonLabel class="ion-text-wrap">
                                        <h2>{item.username}</h2>
                                        <h3>{item.points} Points</h3>
                                    </IonLabel>
                                </IonItem>
                            )
                        }) }
                    </IonList>
                    <IonListHeader>Top Users</IonListHeader>
                    <IonList className="users">
                        { (this.state.leaderboards.users) && this.state.leaderboards.users.map(item => {
                            return (
                                <IonItem key={item.id} onClick={() => { this.props.history.push("/profile/" + item.id) }}>
                                    <IonThumbnail slot="start">
                                        <UserBadge type="list-photo" photo={item.userPhoto} username={item.username} />
                                    </IonThumbnail>
                                    <IonLabel class="ion-text-wrap">
                                        <h2>{item.username}</h2>
                                        <h3>{item.points} Points</h3>
                                    </IonLabel>
                                </IonItem>
                            )
                        }) }
                    </IonList>
                    <IonListHeader>Top Countries</IonListHeader>
                    <IonList className="countries">
                        { (this.state.leaderboards.countries) && this.state.leaderboards.countries.map(item => {
                            return (
                                <IonItem key={item.countryId} onClick={() => { this.props.history.push("/directory/country" + item.countryId) }}>
                                    <IonThumbnail slot="start">
                                        <div>
                                            <i className="flaticon-city-hall-1" />
                                        </div>
                                    </IonThumbnail>
                                    <IonLabel class="ion-text-wrap">
                                        <h2>{item.countryName}</h2>
                                        <h3>{Utilities.nFormatter(item.totalPoints, 1)} Points</h3>
                                    </IonLabel>
                                </IonItem>
                            )
                        }) }
                    </IonList>
                    <IonListHeader>Top Cities</IonListHeader>
                    <IonList className="cities">
                        { (this.state.leaderboards.cities) && this.state.leaderboards.cities.map(item => {
                            return (
                                <IonItem key={item.cityId} onClick={() => { this.props.history.push("/directory/city/" + item.cityId) }}>
                                    <IonThumbnail slot="start">
                                        <div>
                                            <i className="flaticon-city-hall-1" />
                                        </div>
                                    </IonThumbnail>
                                    <IonLabel class="ion-text-wrap">
                                        <h2>{item.cityName} ({item.countryName})</h2>
                                        <h3>{Utilities.nFormatter(item.totalPoints, 1)} Points</h3>
                                    </IonLabel>
                                </IonItem>
                            )
                        }) }
                    </IonList>
                    <IonListHeader>Categories</IonListHeader>
                    <IonList className="categories">
                        { (this.state.leaderboards.categories) && this.state.leaderboards.categories.map(item => {
                            return (
                                <IonItem key={item.name}>
                                    <IonLabel class="ion-text-wrap">{item.name}</IonLabel>
                                    <IonBadge color="primary">{item.totalCount || "0"}</IonBadge>
                                </IonItem>
                            )
                        }) }
                    </IonList>
                    <IonListHeader>Features</IonListHeader>
                    <IonList className="features">
                        { (this.state.leaderboards.features) && this.state.leaderboards.features.map(item => {
                            return (
                                <IonItem key={item.name}>
                                    <IonLabel class="ion-text-wrap">{item.name}</IonLabel>
                                    <IonBadge color="primary">{item.totalCount || "0"}</IonBadge>
                                </IonItem>
                            )
                        }) }
                    </IonList>
                </IonContent>
                <IonLoading
                    isOpen={this.state.loading}
                    message="Loading statistics"
                />
                <IonAlert
                    isOpen={this.state.error !== null}
                    onDidDismiss={() => { this.props.history.goBack(); }}
                    header={'Error'}
                    message={this.state.error}
                    buttons={[
                        { text: 'Close' },
                    ]}
                />
            </IonPage>
        );
    }

};

export default withIonLifeCycle(Statistics);
