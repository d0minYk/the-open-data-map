import { IonSpinner, IonBackButton, IonButtons, IonContent, IonHeader, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel, IonList, IonPage, IonSearchbar, IonSkeletonText, IonTitle, IonToast, IonToolbar, withIonLifeCycle } from '@ionic/react';
import React from 'react';
import EntityListItem from '../modals/EntityListItem.js';
import Server from '../Server.js';
import Storage from '../Storage.js';

let startedGettingCKANList = false;
let startedGettingCKANListId = null;

class CKANList extends React.Component {

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
            error: null,
        }
    }

    paginate(e) {

        let page = this.state.page;
        page++;

        this.setState({
            page: page
        }, function() {
            this.getCKANSlice();
        })

    }

    async ionViewWillEnter() {

        document.title = "CKAN" + window.globalVars.pageTitle;

        // Desktop route causes rendering twice, if same id leave while the first reqiest is processed
        if ( (startedGettingCKANList) || (this.state.list !== null && startedGettingCKANListId === this.props.match.params.id) ) {
            return;
        }

        startedGettingCKANList = true;
        startedGettingCKANListId = this.props.match.params.id;

        setTimeout(function() {
            startedGettingCKANList = false;
        }.bind(this), 1500);

        let user = await Storage.getO("user");

        if ( (user) && (parseInt(this.props.match.params.id) === user.id) ) {
            this.setState({ own: true })
        }

        this.setState({
            keywords: "",
            page: 0,
            list: null,
            loading: true,
        }, function() {
            this.getCKANSlice();
        })

    }

    search(keywords) {

        this.setState({
            keywords: "",
            page: 0,
            list: null,
            keywords: keywords
        }, function() {
            this.getCKANSlice();
        })

    }

    async getCKANSlice() {

        console.log("Getting");

        Server.api({
            method: "get",
            url: "/user/current/ckan/" + this.state.page + "/" + (this.state.keywords ? this.state.keywords : "null"),
            then: function(res) {

                let existing = this.state.list;
                if (!existing) {
                    existing = [];
                }

                if (res.data.length === 0) {
                    if (document.getElementById('infinite-scroll-ckan'))
                        document.getElementById('infinite-scroll-ckan').disabled = true
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

                if (document.getElementById('infinite-scroll-ckan'))
                    document.getElementById('infinite-scroll-ckan').complete();

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
            <IonPage data-page="ckan-list">
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonBackButton onClick={ () => { this.props.history.goBack() } } />
                        </IonButtons>
                        <IonTitle>CKAN Matches</IonTitle>
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
                            { this.state.list.map(item => { return (<EntityListItem key={item.id} {...this.props} entityType="ckan" actionType="ckan" entity={item.meta} /> ) }) }
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
                            id="infinite-scroll-ckan"
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

export default withIonLifeCycle(CKANList);
