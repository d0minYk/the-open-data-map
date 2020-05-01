import { IonSpinner, IonBackButton, IonButtons, IonContent, IonHeader, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel, IonList, IonPage, IonSkeletonText, IonThumbnail, IonTitle, IonToast, IonToolbar, withIonLifeCycle } from '@ionic/react';
import React from 'react';
import UserBadge from '../modals/UserBadge.js';
import Server from '../Server.js';
import Storage from '../Storage.js';
import Utilities from '../Utilities.js';

let startedGettingUserListId = null;
let startedGettingUserListEntity = null;
let startedGettingUserListType = null;

class UserList extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            page: 0,
            list: null,
            mainActionSheet: false,
            confirmDeleteAlertId: null,
            own: false,
            tabTitleEnd: "",
            error: null
        }
    }

    paginate(e) {

        let page = this.state.page;
        page++;

        this.setState({
            page: page
        }, function() {
            this.getDatasetSlice();
        })

    }

    async ionViewWillEnter() {

        document.title = "Users" + window.globalVars.pageTitle;

        // Desktop route causes rendering twice, if same id leave while the first reqiest is processed
        if (this.state.list !== null && startedGettingUserListId === this.props.match.params.id && startedGettingUserListEntity === this.props.match.params.entity && startedGettingUserListType === this.props.match.params.type) {
            return;
        }

        startedGettingUserListId = this.props.match.params.id;
        startedGettingUserListEntity = this.props.match.params.entity;
        startedGettingUserListType = this.props.match.params.type;

        // setTimeout(function() {
        //     startedGettingUserListId = null;
        //     startedGettingUserListEntity = null;
        //     startedGettingUserListType = null;
        // }.bind(this), 1500);

        let user = await Storage.getO("user");

        if ( (user) && (parseInt(this.props.match.params.id) === user.id) ) {
            this.setState({ own: true })
        }

        this.setState({
            page: 0,
            list: null,
            tabTitleEnd: "",
            loading: true,
        }, function() {
            this.getDatasetSlice();
        })

    }

    async getDatasetSlice() {

        if (!this.state.tabTitleEnd) {

            let previousSearches = (await Storage.getO("previousSearches")) || {};

            if (previousSearches && previousSearches[this.props.match.params.entity + "-" + this.props.match.params.id]) {
                this.setState({ tabTitleEnd: " in " + previousSearches[this.props.match.params.entity + "-" + this.props.match.params.id] })
            }

        }

        Server.api({
            method: "get",
            url: "/user/" + this.props.match.params.type + "/" + this.props.match.params.entity + "/" + this.props.match.params.id + "/" + this.state.page,
            then: function(res) {

                console.log(res);

                let existing = this.state.list;
                if (!existing) {
                    existing = [];
                }

                if (res.data.length === 0) {
                    if (document.getElementById('infinite-scroll-user-list'))
                        document.getElementById('infinite-scroll-user-list').disabled = true
                    this.setState({
                        loading: false,
                        list: existing
                    })
                    console.log("ALL LOADED!!")
                } else {

                    this.setState({
                        loading: false,
                        list: existing.concat(res.data),
                    })

                }

                if (document.getElementById('infinite-scroll-user-list'))
                    document.getElementById('infinite-scroll-user-list').complete();

            }.bind(this),
            catch: function(code, error) {
                this.setState({
                    error: error,
                    loading: null
                })
            }.bind(this)
        })

    }

    render() {
        return (
            <IonPage data-page="user-list">
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonBackButton onClick={ () => { this.props.history.goBack() } } />
                        </IonButtons>
                        <IonTitle>{ ((this.props.match.params.type === "user") ? "Top contributors" : "Top organizations") + (this.state.tabTitleEnd || "") }</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    { (this.state.loading) && (!this.state.list) &&
                        <IonList className="loading">
                            <IonSpinner className="big" name="crescent" />
                        </IonList>
                    }
                    { (this.state.list && this.state.list.length > 0) &&
                        <IonList>
                            { this.state.list.map(item => {
                                return (
                                    <IonItem key={item.id} onClick={() => { this.props.history.push("/profile/" + item.id) }}>
                                        <IonThumbnail slot="start">
                                            <UserBadge type="list-photo" photo={item.userPhoto} username={item.username} />
                                        </IonThumbnail>
                                        <IonLabel class="ion-text-wrap">
                                            <h2>{item.username}</h2>
                                            <h3>{Utilities.nFormatter(item.pointsInEntity, 1)} points here, {Utilities.nFormatter(item.points, 1)} total points</h3>
                                        </IonLabel>
                                    </IonItem>
                                )
                            }) }
                        </IonList>
                    }
                    { (this.state.list && this.state.list.length === 0) &&
                        <div className="no-results-full">
                            <h2>No results</h2>
                        </div>
                    }
                    { (this.state.list && this.state.list.length > 0) &&
                        <IonInfiniteScroll
                            threshold="50px"
                            id="infinite-scroll-user-list"
                            onIonInfinite={(e) => { this.paginate(e); }}>
                            <IonInfiniteScrollContent
                                loading-spinner="bubbles"
                                loading-text="Loading more data...">
                            </IonInfiniteScrollContent>
                        </IonInfiniteScroll>
                    }
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
                </IonContent>
            </IonPage>
        );
    }

};

export default withIonLifeCycle(UserList);
