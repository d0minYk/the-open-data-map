import { IonListHeader, IonSpinner, IonBackButton, IonButtons, IonContent, IonHeader, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel, IonList, IonPage, IonSearchbar, IonSkeletonText, IonTitle, IonToast, IonToolbar, withIonLifeCycle } from '@ionic/react';
import React from 'react';
import LocationPreviewItem from '../modals/LocationPreviewItem.js';
import Server from '../Server.js';
import Utilities from '../Utilities.js';
import '../styles/DatasetContent.scss';

let startedGettingDatasetContent = false;
let startedGettingDatasetContentId = null;
let startedGettingDatasetContentKeywords = null;
let datasetContentLastTimestamp = null;

class DatasetList extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            page: 0,
            keywords: "",
            list: [],
            mainActionSheet: false,
            error: null,
        }
    }

    paginate(e) {

        console.log("PAGINATE " + this.state.page+1)

        let page = this.state.page;
        page++;

        this.setState({
            page: page
        }, function() {
            this.getDatasetSlice();
        })

    }

    async ionViewWillEnter() {

        document.title = "Dataset Content" + window.globalVars.pageTitle;

        // Desktop route causes rendering twice, if same id leave while the first reqiest is processed
        if (startedGettingDatasetContent || (this.state.list.length !== 0 && startedGettingDatasetContentId === this.props.match.params.id && startedGettingDatasetContentKeywords === this.props.match.params.keywords)) {
            return;
        }

        startedGettingDatasetContent = true;

        setTimeout(function() { startedGettingDatasetContent = false; }.bind(this), 1000);

        startedGettingDatasetContentId = this.props.match.params.id;
        startedGettingDatasetContentKeywords = this.props.match.params.keywords;

        this.setState({
            keywords: (this.props.match.params.keywords ? this.props.match.params.keywords : ""),
            page: 0,
            loading: true,
            list: []
        }, function() {
            if (!this.state.keywords)
                this.getDatasetSlice();
        })

    }

    getDatasetSlice = () => {

        Server.api({
            method: "get",
            url: "/dataset/" + this.props.match.params.id + "/" + this.state.page + "/" + (this.state.keywords ? this.state.keywords.trim().toLowerCase() : "null"),
            then: function(res) {

                let existing = this.state.list;
                if (!existing) {
                    existing = [];
                }

                if (res.data.length === 0) {
                    if (document.getElementById('infinite-scroll-dataset-content'))
                        document.getElementById('infinite-scroll-dataset-content').disabled = true
                    this.setState({
                        loading: false,
                        list: existing
                    })
                    // console.log("ALL LOADED!!")
                } else {

                    // if (existing && res.data && JSON.parse(JSON.stringify(existing)) === JSON.parse(JSON.stringify(res.data))) {
                    //     console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DUPE")
                    //     return;
                    // }

                    let list = existing.concat(res.data);
                    list = Array.from(new Set(list.map(a => a.id))).map(id => {
                        return list.find(a => a.id === id)
                    })

                    this.setState({
                        loading: false,
                        list: list,
                    })

                }

                console.log()

                if (document.getElementById('infinite-scroll-dataset-content'))
                    document.getElementById('infinite-scroll-dataset-content').complete();

            }.bind(this),
            catch: function(code, error) {
                this.setState({
                    error: error,
                    loading: false
                })
            }.bind(this)
        })

    }

    render() {
        return (
            <IonPage data-page="dataset-content">
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                        <IonBackButton onClick={() => { this.props.history.goBack(); }}  />
                    </IonButtons>
                    <IonTitle>Dataset Content</IonTitle>
                </IonToolbar>
                </IonHeader>
                <IonContent>
                    <IonSearchbar
                        debounce={600}
                        showCancelButton="focus"
                        value={this.state.keywords}
                        onIonChange={(e) => {
                            this.setState({
                                keywords: e.target.value,
                                loading: true,
                                page: 0,
                                list: [],
                            }, function() {
                                this.getDatasetSlice()
                            })
                        }}
                        placeholder="Search"
                    / >
                    { (this.state.loading) && (!this.state.list) &&
                        <IonList className="loading">
                            <IonSpinner className="big" name="crescent" />
                        </IonList>
                    }
                    { ( (this.state.list.length === 0) && (!this.state.loading) ) &&
                        <div className="no-results">
                            No Results
                        </div>
                    }
                    { (this.state.list.length > 0) &&
                        <IonList>
                            { this.state.list.map((item, i) => {

                                if (i === 0) {
                                    datasetContentLastTimestamp = null
                                }

                                let timestamp = Utilities.daysSince(item.updatedat);
                                let timestampDOM = null
                                if (timestamp !== datasetContentLastTimestamp && timestamp) {
                                    datasetContentLastTimestamp = timestamp;
                                    timestampDOM = <IonListHeader>{timestamp}</IonListHeader>
                                }

                                return (
                                    <div key={item.id}>
                                        { timestampDOM }
                                        <LocationPreviewItem
                                            key={item.id}
                                            onSelect={() => { this.props.history.push("/location/" + item.id) }}
                                            onClick={() => {  }}
                                            location={item}
                                        />
                                    </div>
                                )
                            }) }
                        </IonList>
                    }
                    { (this.state.list.length > 0) &&
                        <IonInfiniteScroll
                            threshold="50px"
                            id="infinite-scroll-dataset-content"
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

export default withIonLifeCycle(DatasetList);
