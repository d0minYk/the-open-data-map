import { IonSpinner, IonBackButton, IonButtons, IonContent, IonHeader, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel, IonList, IonPage, IonSearchbar, IonSkeletonText, IonTitle, IonToast, IonToolbar, withIonLifeCycle } from '@ionic/react';
import React from 'react';
import LocationPreviewItem from '../modals/LocationPreviewItem.js';
import Server from '../Server.js';
import Storage from '../Storage.js';

let startedGettingLocationList = false;
let startedGettingLocationListId = null;

class LocationList extends React.Component {

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
            tabTitle: "Locations",
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

        document.title = "Location List" + window.globalVars.pageTitle;

        // Desktop route causes rendering twice, if same id leave while the first reqiest is processed
        if ( (startedGettingLocationList) || (this.state.list !== null && startedGettingLocationListId === this.props.match.params.id) ) {
            return;
        }

        startedGettingLocationListId = this.props.match.params.id;
        startedGettingLocationList = true;

        setTimeout(function() {
            startedGettingLocationList = null;
        }.bind(this), 1500);

        let user = await Storage.getO("user");

        if ( (user) && (parseInt(this.props.match.params.id) === user.id) ) {
            this.setState({ own: true })
        }

        this.setState({
            keywords: "",
            page: 0,
            list: null,
            tabTitle: "Locations",
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

        console.log("Getting=============================================================================================");

        if (this.state.tabTitle === "Locations") {

            let previousSearches = (await Storage.getO("previousSearches")) || {};

            if (previousSearches && previousSearches[((this.props.entity === "organization") ? "user" : this.props.entity) + "-" + this.props.match.params.id]) {
                let tabTitle = "Locations";
                if (this.props.entity === "organization") {
                    tabTitle += " by " + previousSearches["user-" + this.props.match.params.id]
                } else {
                    tabTitle += " in " + previousSearches[this.props.entity + "-" + this.props.match.params.id]
                }
                this.setState({ tabTitle: tabTitle })
            }

        }

        Server.api({
            method: "get",
            url: "/location/" + this.props.entity + "/" + this.props.match.params.id + "/" + this.state.page + "/" + (this.state.keywords ? this.state.keywords : "null"),
            then: function(res) {

                let existing = this.state.list;
                if (!existing) {
                    existing = [];
                }

                if (res.data.length === 0) {
                    if (document.getElementById('infinite-scroll-location-list'))
                        document.getElementById('infinite-scroll-location-list').disabled = true
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

                if (document.getElementById('infinite-scroll-location-list'))
                    document.getElementById('infinite-scroll-location-list').complete();

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
                    <IonSearchbar
                        debounce={600}
                        showCancelButton="focus"
                        value={this.state.keywords}
                        onIonChange={(e) => {this.search(e.target.value)}}
                        placeholder="Search"
                    / >
                    { (this.state.loading) && (!this.state.list) &&
                        <IonList className="loading">
                            <IonSpinner className="big" name="crescent" />
                        </IonList>
                    }
                    { (this.state.list && this.state.list.length > 0) &&
                        <IonList>
                            { this.state.list.map(item => { return (<LocationPreviewItem key={item.id} {...this.props} location={item} onSelect={(id) => { this.props.history.push("/location/" + id) }} /> ) }) }
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
                            id="infinite-scroll-location-list"
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

export default withIonLifeCycle(LocationList);
