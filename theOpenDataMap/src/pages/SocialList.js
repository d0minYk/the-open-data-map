import { IonSpinner, IonBackButton, IonButtons, IonContent, IonHeader, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel, IonList, IonPage, IonSkeletonText, IonTitle, IonToast, IonToolbar, withIonLifeCycle } from '@ionic/react';
import React from 'react';
import EntityListItem from '../modals/EntityListItem.js';
import Server from '../Server.js';
import Storage from '../Storage.js';
import Utilities from '../Utilities.js';

let startedGettingSocialList = false;
let startedGettingSocialListId = null;
let startedGettingSocialListType = null

class SocialList extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            page: 0,
            keywords: "",
            list: null,
            mainActionSheet: false,
            confirmDeleteAlertId: null,
            own: false,
            tabTitle: "Actions",
            error: null,
        }
    }

    paginate(e) {

        let page = this.state.page;
        page++;

        this.setState({
            page: page
        }, function() {
            this.getLocationsSlice();
        })

    }

    async ionViewWillEnter() {

        // Desktop route causes rendering twice, if same id leave while the first reqiest is processed
        if ( (startedGettingSocialList) || (this.state.list !== null && startedGettingSocialListId === this.props.match.params.id && startedGettingSocialListType === this.props.match.params.section) ) {
            return;
        }

        startedGettingSocialList = true;
        startedGettingSocialListId = this.props.match.params.id;
        startedGettingSocialListType = this.props.match.params.section;

        setTimeout(function() {
            startedGettingSocialList = false
        }.bind(this), 1500);

        let user = await Storage.getO("user");

        if ( (user) && (parseInt(this.props.match.params.id) === user.id) ) {
            this.setState({ own: true })
        }

        if (user) {
            this.setState({ userId: user.id })
        }

        this.setState({
            keywords: "",
            page: 0,
            list: null,
            tabTitle: "Actions",
            loading: true,
        }, function() {
            this.getLocationsSlice();
        })

    }

    search(keywords) {

        this.setState({
            keywords: "",
            page: 0,
            list: null,
            keywords: keywords
        }, function() {
            this.getLocationsSlice();
        })

    }

    async getLocationsSlice() {

        console.log("Getting");

        if (this.state.tabTitle === "Actions") {

            let previousSearches = (await Storage.getO("previousSearches")) || {};

            if (previousSearches && previousSearches[((this.props.entity === "organization") ? "user" : this.props.entity) + "-" + this.props.match.params.id]) {
                this.setState({ tabTitle: Utilities.capitalize(this.props.match.params.section) + " " + (this.props.match.params.direction === "inbox" ? "to " : "by ") + previousSearches["user-" + this.props.match.params.id] })
            }

        }

        console.log(this.props.entity + "/" + this.props.match.params.id + "/timeline/" + this.props.match.params.direction + "/" + this.props.match.params.section + "/" + this.state.page)

        Server.api({
            method: "get",
            url: this.props.entity + "/" + this.props.match.params.id + "/timeline/" + this.props.match.params.direction + "/" + this.props.match.params.section + "/" + this.state.page,
            then: function(res) {

                let existing = this.state.list;
                if (!existing) {
                    existing = [];
                }

                if (res.data.length === 0) {
                    if (document.getElementById('infinite-scroll-social-list'))
                        document.getElementById('infinite-scroll-social-list').disabled = true
                    this.setState({
                        loading: false,
                        list: existing
                    })
                } else {

                    this.setState({
                        loading: false,
                        list: existing.concat(res.data),
                    })

                }

                if (document.getElementById('infinite-scroll-social-list'))
                    document.getElementById('infinite-scroll-social-list').complete();

            }.bind(this),
            catch: function(code, error) {
                console.log("ERROR")
                this.setState({
                    error: error,
                    loading: null
                })
            }.bind(this)
        })

    }

    render() {
        return (
            <IonPage data-page="location-list">
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonBackButton onClick={ () => { this.props.history.goBack() } } />
                        </IonButtons>
                        <IonTitle>{this.state.tabTitle}</IonTitle>
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
                            { this.state.list.map(item => { return (<EntityListItem
                                {...this.props}
                                key={item.entityId || item.id}
                                entityType={item.entityType}
                                actionType={this.props.match.params.section}
                                ownId={this.state.userId}
                                body={item.body}
                                rating={item.rating}
                                cause={item.cause}
                                platform={item.platform}
                                entityId={item.entityId || item.id}
                                entityUserId={item.entityUserId}
                                entity={item.entity || item.meta || item}
                                username={item.username}
                                userPhoto={item.userPhoto}
                            /> ) }) }
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
                            id="infinite-scroll-social-list"
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

export default withIonLifeCycle(SocialList);
