import { IonList, IonSpinner, IonActionSheet, IonBackButton, IonButton, IonButtons, IonChip, IonContent, IonHeader, IonIcon, IonLabel, IonPage, IonSkeletonText, IonTitle, IonToast, IonToolbar, withIonLifeCycle } from '@ionic/react';
import { airplane, calendar, gitCompare, gitMerge, globe, pin, pricetag, statsChartOutline, subway } from 'ionicons/icons';
import React, { createRef } from 'react';
import Comments from '../modals/Comments.js';
import Ratings from '../modals/Ratings.js';
import Reports from '../modals/Reports.js';
import SocialActions from '../modals/SocialActions.js';
import UserBadge from '../modals/UserBadge.js';
import Server from '../Server.js';
import Storage from '../Storage';
import '../styles/DatasetDetails.scss';
import Utilities from '../Utilities.js';

class DatasetDetails extends React.Component {

    constructor(props) {
        super(props);
        this.pageRef = createRef();
        this.commentsRef = createRef();
        this.scrollingRef = createRef();
        this.ratingsRef = createRef();
        this.reportsRef = createRef();
        this.state = {
            loading: true,
            dataset: null,
            downloadOriginalDatasetSheet: null,
            userSubscribed: false,
            error: null,
            showAllCities: false,
            showAllCountries: false,
            showAllFeatures: false,
            showAllCategories: false,
        }
    }

    async ionViewWillEnter() {
        this.getDataset();
    }

    getDataset = () => {

        Server.api({
            method: "get",
            url: "/dataset/" + this.props.match.params.id,
            then: function(res) {
                console.log("GOT DATASET", res.data);
                if (res.data) {
                    document.title = res.data.name + window.globalVars.pageTitle;
                    this.setState({ dataset: res.data, loading: null })
                    if (res.data.userSubscribed) {
                        this.setState({ userSubscribed: res.data.userSubscribed })
                    }
                }
            }.bind(this),
            catch: function(code, error) {
                this.setState({
                    error: error,
                    loading: null
                })
            }.bind(this)
        })

    }

    async notificationSubscription(action) {

        let user = await Storage.getO("user");
        if (!user) {
            this.props.history.push("/login")
            return;
        }

        Server.api({
            method: (action === "unsubscribe") ? "DELETE" : "PUT",
            url: "/subscription/DATASET_UPDATE/" + this.props.match.params.id,
            then: function(res) {
                this.setState({ userSubscribed: !this.state.userSubscribed })
                console.log("SUBSCRIBE OK", res.data);
                // if (res.data) {
                //     this.setState({ dataset: res.data })
                // }
            }.bind(this),
            catch: function(code, error) {
                console.log("SUBSCRIBE NOT OK");
                // this.setState({
                //     error: error,
                //     loading: null
                // })
            }.bind(this)
        })

        console.log("SUB?UNSU", action);

    }

    render() {
        return (
            <IonPage data-page="dataset-details" ref={this.pageRef}>
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonBackButton onClick={() => { this.props.history.goBack(); }} />
                        </IonButtons>
                        <IonTitle>{ (this.state.dataset ? this.state.dataset.name : "Dataset Details" ) }</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent ref={this.scrollingRef}>
                    <div className="header">
                        <div className="quick-stats">
                            <div>
                                <div className="icon-wrapper"> <IonIcon icon={globe} mode="md" /> </div>
                                <div className="meta">
                                    <p> { (this.state.dataset && this.state.dataset.statistics) ? <span>{this.state.dataset.statistics.locations || 0}</span> : <IonSkeletonText animated style={{ width: '30%' }} /> } </p>
                                    <label> { (this.state.dataset && this.state.dataset.statistics) ? <span>Locations</span> : <IonSkeletonText animated style={{ width: '72%' }} /> } </label>
                                </div>
                            </div>
                            <div>
                                <div className="icon-wrapper"> <IonIcon icon={airplane} mode="md" /> </div>
                                <div className="meta">
                                    <p> { (this.state.dataset && this.state.dataset.statistics) ? <span>{this.state.dataset.statistics.countries.length}</span> : <IonSkeletonText animated style={{ width: '30%' }} /> } </p>
                                    <label> { (this.state.dataset && this.state.dataset.statistics) ? <span>Countries</span> : <IonSkeletonText animated style={{ width: '72%' }} /> } </label>
                                </div>
                            </div>
                            <div>
                                <div className="icon-wrapper"> <IonIcon icon={subway} mode="md" /> </div>
                                <div className="meta">
                                    <p> { (this.state.dataset && this.state.dataset.statistics) ? <span>{this.state.dataset.statistics.cities.length}</span> : <IonSkeletonText animated style={{ width: '30%' }} /> } </p>
                                    <label> { (this.state.dataset && this.state.dataset.statistics) ? <span>Cities</span> : <IonSkeletonText animated style={{ width: '72%' }} /> } </label>
                                </div>
                            </div>
                            <div>
                                <div className="icon-wrapper"> <IonIcon icon={pin} mode="md" /> </div>
                                <div className="meta">
                                    <p> { (this.state.dataset && this.state.dataset.statistics) ? <span>{this.state.dataset.statistics.points}</span> : <IonSkeletonText animated style={{ width: '30%' }} /> } </p>
                                    <label> { (this.state.dataset && this.state.dataset.statistics) ? <span>Points</span> : <IonSkeletonText animated style={{ width: '72%' }} /> } </label>
                                </div>
                            </div>
                            <div>
                                <div className="icon-wrapper"> <IonIcon icon={gitMerge} mode="md" /> </div>
                                <div className="meta">
                                    <p> { (this.state.dataset && this.state.dataset.statistics) ? <span>{this.state.dataset.statistics.paths}</span> : <IonSkeletonText animated style={{ width: '30%' }} /> } </p>
                                    <label> { (this.state.dataset && this.state.dataset.statistics) ? <span>Paths</span> : <IonSkeletonText animated style={{ width: '72%' }} /> } </label>
                                </div>
                            </div>
                            <div>
                                <div className="icon-wrapper"> <IonIcon icon={gitCompare} mode="md" /> </div>
                                <div className="meta">
                                    <p> { (this.state.dataset && this.state.dataset.statistics) ? <span>{this.state.dataset.statistics.polygons}</span> : <IonSkeletonText animated style={{ width: '30%' }} /> } </p>
                                    <label> { (this.state.dataset && this.state.dataset.statistics) ? <span>Polygons</span> : <IonSkeletonText animated style={{ width: '72%' }} /> } </label>
                                </div>
                            </div>
                            <div>
                                <div className="icon-wrapper"> <IonIcon icon={calendar} mode="md" /> </div>
                                <div className="meta">
                                    <p> { (this.state.dataset && this.state.dataset.statistics) ? <span>{Utilities.formatDate(this.state.dataset.createdat, "DD/MM/YY")}</span> : <IonSkeletonText animated style={{ width: '30%' }} /> } </p>
                                    <label> { (this.state.dataset && this.state.dataset.statistics) ? <span>Created</span> : <IonSkeletonText animated style={{ width: '72%' }} /> } </label>
                                </div>
                            </div>
                            <div>
                                <div className="icon-wrapper"> <IonIcon icon={calendar} mode="md" /> </div>
                                <div className="meta">
                                    <p> { (this.state.dataset && this.state.dataset.statistics) ? <span>{Utilities.formatDate(this.state.dataset.lastUpdated, "DD/MM/YY")}</span> : <IonSkeletonText animated style={{ width: '30%' }} /> } </p>
                                    <label> { (this.state.dataset && this.state.dataset.statistics) ? <span>Last Updated</span> : <IonSkeletonText animated style={{ width: '72%' }} /> } </label>
                                </div>
                            </div>
                            <div>
                                <div className="icon-wrapper"> <IonIcon icon={pricetag} mode="md" /> </div>
                                <div className="meta">
                                    <p> { (this.state.dataset && this.state.dataset.statistics) ? <span>{Object.keys(this.state.dataset.statistics.categories).length}</span> : <IonSkeletonText animated style={{ width: '30%' }} /> } </p>
                                    <label> { (this.state.dataset && this.state.dataset.statistics) ? <span>Categories</span> : <IonSkeletonText animated style={{ width: '72%' }} /> } </label>
                                </div>
                            </div>
                            <div>
                                <div className="icon-wrapper"> <IonIcon icon={statsChartOutline} mode="md" /> </div>
                                <div className="meta">
                                    <p> { (this.state.dataset && this.state.dataset.statistics) ? <span>{Object.keys(this.state.dataset.statistics.features).length}</span> : <IonSkeletonText animated style={{ width: '30%' }} /> } </p>
                                    <label> { (this.state.dataset && this.state.dataset.statistics) ? <span>Features</span> : <IonSkeletonText animated style={{ width: '72%' }} /> } </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    { (this.state.loading) &&
                        <IonList className="loading">
                            <IonSpinner className="big" name="crescent" />
                        </IonList>
                    }

                    { (this.state.dataset) &&
                        <div className="details">

                            { (this.state.dataset && this.state.dataset.name) &&
                                <SocialActions
                                    {...this.props}
                                    showActionName={true}
                                    style={{ marginTop: 20 }}
                                    type="dataset"
                                    actions={this.state.dataset}
                                    id={this.state.dataset.id}
                                    name={this.state.dataset.name}
                                    onCommentClick={() => {
                                        // this.scrollingRef.current.scrollTo(0, this.commentsRef.current.offsetTop)
                                        let button = document.getElementById("new-comment-btn");
                                        if (button) { button.click(); }
                                    }}
                                    onRatingClick={() => {
                                        // this.scrollingRef.current.scrollTo(0, this.ratingsRef.current.offsetTop)
                                        let button = document.getElementById("new-rating-btn");
                                        if (button) { button.click(); }
                                    }}
                                    onReportClick={() => {
                                        // this.scrollingRef.current.scrollTo(0, this.reportsRef.current.offsetTop)
                                        let button = document.getElementById("new-report-btn");
                                        if (button) { button.click(); }
                                    }}
                                    presentingElement={this.pageRef}
                                />
                            }

                            {/*<div className="field" onClick={() => { this.props.history.push("/profile/" + (this.state.dataset ? this.state.dataset.userId : "")); }}>
                                <h3>Author</h3>
                                <p> {this.state.dataset ? this.state.dataset.authorUsername : <IonSkeletonText animated style={{ width: '30%' }} /> } </p>
                            </div>*/}

                            { (this.state.dataset.owner) &&
                                <div className="field">
                                    <h3>Author</h3>
                                    <UserBadge {...this.props} background={true} link={"/profile/" + this.state.dataset.userId} id={this.state.dataset.userId} username={this.state.dataset.owner.username} photo={this.state.dataset.owner.picture} type="photo-username" />
                                </div>
                            }

                            <div className="field">
                                <h3>Description</h3>
                                <p>{this.state.dataset.description}</p>
                            </div>

                            { (this.state.dataset.topicName) &&
                                <div className="field">
                                    <h3>Topic</h3>
                                    <p>{this.state.dataset.topicName}</p>
                                </div>
                            }

                            { (this.state.dataset.maintainerName || this.state.dataset.maintainerEmail) &&
                                <div className="field" onClick={() => { if (this.state.dataset.maintainerEmail) window.open("mailto:" + this.state.dataset.maintainerEmail) }}>
                                    <h3>Maintianer</h3>
                                    { this.state.dataset.maintainerName && <p>{this.state.dataset.maintainerName}</p> }
                                    { this.state.dataset.maintainerEmail && <p>{this.state.dataset.maintainerEmail}</p> }
                                </div>
                            }

                            <div className="field">
                                <h3>Licence</h3>
                                <p>{this.state.dataset.licenceType}</p>
                                <p>{this.state.dataset.licenceDescription}</p>
                            </div>

                            { (this.state.dataset) && (this.state.dataset.maintainerName || this.state.dataset.maintainerEmail) &&
                                <div className="field" onClick={() => { if (this.state.dataset.maintainerEmail) window.open("mailto:" + this.state.dataset.maintainerEmail) }}>
                                    <h3>Maintianer</h3>
                                    { this.state.dataset.maintainerName && <p>{this.state.dataset.maintainerName}</p> }
                                    { this.state.dataset.maintainerEmail && <p>{this.state.dataset.maintainerEmail}</p> }
                                </div>
                            }

                            <div className="options">
                                { (this.props.size === "small") && <IonButton expand="block" onClick={() => { this.props.history.push("/dataset/" + this.state.dataset.id + "/content") }} >Explore Locations</IonButton> }
                                <IonButton expand="block" onClick={() => { this.props.history.push("/dataset/" + this.state.dataset.id + "/map") }}>Show on Map</IonButton>
                                <IonButton expand="block" onClick={() => { window.open(window.globalVars.serverIp + "api/location?fields=all&query=(datasetId%20=%20%22" + this.state.dataset.id + "%22)") }}>Download Dataset in JSON</IonButton>
                                { (this.state.dataset.sources && this.state.dataset.sources.length !== 0) &&
                                    <IonButton expand="block" onClick={() => { this.setState({ downloadOriginalDatasetSheet: true }) }}>Download Original Dataset</IonButton>
                                }
                                { (this.state.userSubscribed) ?
                                    <IonButton expand="block" onClick={() => { this.notificationSubscription("unsubscribe") }}>Unsubscribe from updates</IonButton>
                                    :
                                    <IonButton expand="block" onClick={() => { this.notificationSubscription("subscribe") }}>Subscribe to updates</IonButton>
                                }
                            </div>

                            <h3>Categories</h3>
                            { Object.keys(this.state.dataset.statistics.categories).map((key, i) => {
                                if (i > 9 && !this.state.showAllCategories) return null;
                                let item = this.state.dataset.statistics.categories[key];
                                return (<IonChip key={key} onClick={() => { this.props.history.push("/dataset/" + this.state.dataset.id + "/content/category:" + key + ",") }} className="colored" data-type="category"> <IonLabel>{ key }<span>{ item.count }</span></IonLabel> </IonChip>);
                            }) }
                            { (this.state.dataset.statistics.categories.length > 10) && <IonChip className="colored" data-type="category" data-bolder="true" onClick={() => { this.setState({ showAllCategories: !this.state.showAllCategories }) }}> { (this.state.showAllCategories) ? "Show less categories" : "Show all categories ..." } </IonChip> }

                            <h3>Features</h3>
                            { Object.keys(this.state.dataset.statistics.features).map((key, i) => {
                                if (i > 9 && !this.state.showAllFeatures) return null;
                                let item = this.state.dataset.statistics.features[key];
                                return (<IonChip key={key} onClick={() => { this.props.history.push("/dataset/" + this.state.dataset.id + "/content/feature:" + key + ",") }} className="colored" data-type="feature"> <IonLabel>{ key }<span>{ item.count }</span></IonLabel> </IonChip>);
                            }) }
                            { (this.state.dataset.statistics.features.length > 10) && <IonChip className="colored" data-type="feature" data-bolder="true" onClick={() => { this.setState({ showAllFeatures: !this.state.showAllFeatures }) }}> { (this.state.showAllFeatures) ? "Show less features" : "Show all features ..." } </IonChip> }

                            <h3>Cities</h3>
                            { this.state.dataset.statistics.cities.map((item, i) => {
                                if (i > 9 && !this.state.showAllCities) return null;
                                return (<IonChip key={item.name} onClick={() => { this.props.history.push("/dataset/" + this.state.dataset.id + "/content/city:" + item.name + ",") }} className="colored" data-type="city"> <IonLabel>{ item.name }<span>{ item.count }</span></IonLabel> </IonChip>);
                            }) }
                            { (this.state.dataset.statistics.cities.length > 10) && <IonChip className="colored" data-type="city" data-bolder="true" onClick={() => { this.setState({ showAllCities: !this.state.showAllCities }) }}> { (this.state.showAllCities) ? "Show less cities" : "Show all cities ..." } </IonChip> }

                            <h3>Countries</h3>
                            { this.state.dataset.statistics.countries.map((item, i) => {
                                if (i > 9 && !this.state.showAllCountries) return null;
                                return (<IonChip key={item.name} onClick={() => { this.props.history.push("/dataset/" + this.state.dataset.id + "/content/country:" + item.name + ",") }} className="colored" data-type="country"> <IonLabel>{ item.name }<span>{ item.count }</span></IonLabel> </IonChip>);
                            }) }
                            { (this.state.dataset.statistics.countries.length > 10) && <IonChip className="colored" data-type="country" data-bolder="true" onClick={() => { this.setState({ showAllCountries: !this.state.showAllCountries }) }}> { (this.state.showAllCountries) ? "Show less countries" : "Show all countries ..." } </IonChip> }

                            <div ref={this.commentsRef}></div>
                            <Comments
                                {...this.props}
                                comments={this.state.dataset.comments}
                                type="dataset"
                                id={this.state.dataset.id}
                                source="parent"
                                presentingElement={this.pageRef}
                            />

                            <div ref={this.reportsRef}></div>
                            <Reports
                                {...this.props}
                                reports={this.state.dataset.reports}
                                type="dataset"
                                id={this.state.dataset.id}
                                datasetId={this.state.dataset.datasetId}
                                userId={this.state.dataset.userId}
                                source="parent"
                                presentingElement={this.pageRef}
                            />

                            <div ref={this.ratingsRef}></div>
                            <Ratings
                                {...this.props}
                                ratings={this.state.dataset.ratings}
                                type="dataset"
                                id={this.state.dataset.id}
                                datasetId={this.state.dataset.datasetId}
                                userId={this.state.dataset.userId}
                                source="parent"
                                presentingElement={this.pageRef}
                            />

                        </div>
                    }
                    {/*<IonAlert
                        isOpen={this.state.downloadOriginalDatasetSheet}
                        onDidDismiss={() => { this.setState({ downloadOriginalDatasetSheet: false }) }}
                        header={'Download original dataset'}

                        buttons={[
                            { text: 'Cancel', },
                            { text: 'Download', handler: () => {
                                window.open(window.globalVars.datasetsPath + this.state.dataset.savedName)
                            } }
                        ]}
                    />*/}
                    <IonActionSheet
                        isOpen={this.state.downloadOriginalDatasetSheet !== null}
                        header={"Select file to download"}
                        onDidDismiss={() => { this.setState({ downloadOriginalDatasetSheet: null }) }}
                        buttons={(this.state.dataset && this.state.dataset.sources) ? this.state.dataset.sources.map(item => {
                            return {
                                text: item.name + " (" + item.type + ")",
                                handler: () => { window.open(item.url) }
                            }
                        }) : []}
                      >
                    </IonActionSheet>
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

export default withIonLifeCycle(DatasetDetails);
