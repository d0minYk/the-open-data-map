import { IonActionSheet, IonAlert, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar, withIonLifeCycle } from '@ionic/react';
import { checkmark, ellipsisHorizontalOutline, handLeftOutline, hourglassOutline, warning } from 'ionicons/icons';
import React from 'react';
import Server from '../Server.js';
import Storage from '../Storage.js';
import '../styles/DatasetProgress.scss';
import Utilities from '../Utilities.js';

let startedGettingProgress = false;

class DatasetProgress extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            loading: null,
            progress: [

            ],
            error: null,
            parsingOrErrorPreviewmodal: null,
            actionSheet: false
        }
    }

    publish() {

        Server.api({
            method: "put",
            url: "/dataset/" + this.props.match.params.id + "/published",
            then: function(res) {
                console.log("PUBLISHED", res);
                this.getProgress();
            }.bind(this),
            catch: function(code, error) {
                console.log("Error PUBLIHSING", error, code);
                this.setState({ error: error, })
            }.bind(this)
        })

    }

    markUpdated() {

        Server.api({
            method: "put",
            url: "/dataset/" + this.props.match.params.id + "/updated",
            then: function(res) {
                console.log("PUBLISHED", res);
                this.setState({ error: "Dataset marked as updated", })
            }.bind(this),
            catch: function(code, error) {
                console.log("Error PUBLIHSING", error, code);
                this.setState({ error: error, })
            }.bind(this)
        })

    }

    checkForUpdates() {

        Server.api({
            method: "put",
            url: "/dataset/" + this.props.match.params.id + "/schedule",
            then: function(res) {
                console.log("======Requested parse requested", res);
                this.setState({ error: "Your dataset is scheduled to be checked for updates in a couple of minutes" })
            }.bind(this),
            catch: function(code, error) {
                this.setState({ error: "Failed to request check for updates" })
            }.bind(this)
        })

    }

    parse() {

        Server.api({
            method: "put",
            url: "/dataset/" + this.props.match.params.id + "/parse",
            data: { fetchLatestFromUrl: this.state.fetchLatest },
            then: function(res) {
                console.log("======Requested parse features", res);
                this.getProgress();
            }.bind(this),
            catch: function(code, error) {
                console.log("Error requesting parse", error, code);
                this.setState({ error: error, })
            }.bind(this)
        })

    }

    deleteDataset() {

        Server.api({
            method: "delete",
            url: "/dataset/" + this.props.match.params.id,
            then: function(res) {
                console.log("DELETED", res);
                this.props.history.push("/profile")
            }.bind(this),
            catch: function(code, error) {
                console.log("Error DELETING", error, code);
                this.setState({ error: error, })
            }.bind(this)
        })

    }

    getProgress() {

        if (this.props.match.params.id === "new")
            return;

        Server.api({
            method: "get",
            url: "/dataset/" + this.props.match.params.id + "/progress",
            then: function(res) {

                let dataset = res.data.dataset;
                let parsedLocations = res.data.locations;
                let errored = parsedLocations.filter(location => location.error);

                Storage.setO("errored-parses", {
                    id: dataset.id,
                    data: errored,
                })

                let nextChosen = false;

                this.setState({ dataset: dataset })

                console.log("GOT PRgoress", dataset, parsedLocations);

                let progress = [
                    {
                        name: "Define and Map field",
                        subtext: "mandatory",
                        path: "fields"
                    },
                    {
                        name: "Describe dataset",
                        subtext: "mandatory",
                        path: "details"
                    },
                    {
                        name: "Categories",
                        subtext: "mandatory",
                        path: "categories"
                    },
                    {
                        name: "Features",
                        subtext: "optional",
                        status: "optional",
                        path: "features"
                    },
                    {
                        name: "Marker Appearance",
                        subtext: "optional",
                        path: "markers"
                    },
                    {
                        name: "Path Appearance",
                        subtext: "optional",
                        path: "paths"
                    },
                    {
                        name: "Polygon Appearance",
                        subtext: "optional",
                        path: "polygons"
                    },
                    {
                        name: "Sources",
                        subtext: "optional",
                        path: "sources"
                    },
                    {
                        name: "Geocoding",
                        subtext: "optional",
                        path: "geocoding",
                        status: "optional",
                        description: "Override default geocoding and reverse-geocoding options"
                    },
                    {
                        name: "Full Parse (to apply rules)",
                        subtext: "",
                        path: "parse()",
                    },
                    {
                        name: "Review Dataset",
                        subtext: "",
                        status: "warning",
                        path: "review()"
                    },
                    {
                        name: "Fulfil request",
                        path: "request"
                    },
                    {
                        name: "Pulbish Dataset",
                        subtext: "",
                        path: "publish()"
                    },
                    {
                        name: "Mark as updated",
                        description: "If you have made changes to your dataset you can flag this dataset as updated which will put it at the top of new dataset updates. You don't have to do this if your dataset is updated from a url.",
                        path: "markUpdated()",
                        status: "optional"
                    },
                ];

                if (dataset.fields) {

                    let foundNameMapping = false;

                    for (let key in dataset.fields) {
                        let field = dataset.fields[key];
                        console.log(typeof field.type);
                        if (field && typeof field.type === 'object' && field.type.indexOf("name") !== -1) {
                            console.log("HEr")
                            foundNameMapping = true;
                            break;
                        }
                    }

                    if (!foundNameMapping) {
                        progress[0].status = "todo";
                        progress[0].description = "Edit fields and field mappings so users can better understand what each field represents"
                        progress[0].next = true;
                        nextChosen = true;
                    } else {
                        progress[0].status = "completed";
                        progress[0].description = "Fields have been mapped already. Click to edit (you need to parse again after making changes)"
                        // progress[0].data = dataset.fields;
                    }

                }

                // , but the dataset has to be re-parsed to update existing locations

                if (!dataset.name || !dataset.description || !dataset.licenceId) {
                    progress[1].status = "todo";
                    progress[1].description = "Name and describe the dataset"
                    if (!nextChosen) {
                        progress[1].next = true;
                        nextChosen = true;
                    }
                } else {
                    progress[1].status = "completed";
                    progress[1].description = "Dataset details are filled out. Click to edit (changes are applied immediately)."
                    // progress[1].data = {
                    //     Name: dataset.name,
                    //     Description: dataset.description,
                    //     Tags: dataset.tags.length !== 0 ? dataset.tags.split(", ") : "",
                    // }
                }

                if ( (!dataset.categories) || (!dataset.categories.default) || (dataset.categories.default.length === 0) ) {

                    progress[2].status = "optional";
                    progress[2].description = "Set the default category for your locations and add conditions if the dataset contains multiple location categories."

                    if (dataset.savedName) {
                        progress[2].status = "todo";
                        if (!nextChosen) {
                            progress[2].next = true;
                            nextChosen = true;
                        }
                    } else {
                        progress[2].subtext = "optional";
                    }

                } else {
                    progress[2].status = "completed";
                    progress[2].description = "Dataset categories have been defined. Click to edit (you need to parse again after making changes)."
                }

                if ( (dataset.features.default.length !== 0) || (Object.keys(dataset.features.filterRules).length !== 0) ) {
                    progress[3].status = "completed";
                    progress[3].description = "Dataset features have been defined. Click to edit (you need to parse again after making changes)."
                } else {
                    progress[3].status = "optional";
                    progress[3].description = "You can define global features and amenities or use conditions to apply conditional features"
                }

                if ( (Object.keys(dataset.markers).length > 1) || (dataset.markers.default.color !== "#4a69bb") ) {
                    progress[4].status = "completed";
                    progress[4].description = "Dataset markers have been defined. Click to edit (you need to parse again after making changes)."
                } else {
                    progress[4].status = "optional";
                    progress[4].description = "You can set the default marker style and use conditions to apply conditional marker styles."
                }

                if ( (Object.keys(dataset.paths).length > 1) || (dataset.paths.default.borderColor !== "#333") ) {
                    progress[5].status = "completed";
                    progress[5].description = "Dataset paths have been defined. Click to edit (you need to parse again after making changes)."
                } else {
                    progress[5].status = "optional";
                    progress[5].description = "You can set the default path style and use conditions to apply conditional path styles."
                }

                if ( (Object.keys(dataset.polygons).length > 1) || (dataset.polygons.default.borderColor !== "#333") ) {
                    progress[6].status = "completed";
                    progress[6].description = "Dataset polygons have been defined. Click to edit (you need to parse again after making changes)."
                } else {
                    progress[6].status = "optional";
                    progress[6].description = "You can set the default polygon style and use conditions to apply conditional polygon styles."
                }

                if (dataset.sources && dataset.sources.length !== 0) {
                    progress[7].status = "completed";
                    progress[7].description = "Sources added. Click to edit (changes are applied immediately)"
                } else {
                    progress[7].status = "optional";
                    progress[7].description = "You can link to multiple files hosted by you."
                }

                if (dataset.isQueued) {
                    progress[9].status = "inprogress";
                    progress[9].description = "Parsing in progress, this usually only takes a few seconds but might take longer if you have a big dataset that requires geocoding."
                } else {

                    if (parsedLocations.length === 0) {

                        progress[9].status = "todo";
                        progress[9].description = "Click here to start parsing"
                        if (!nextChosen) {
                            progress[9].next = true;
                            nextChosen = true;
                        }

                    } else {

                        if (errored.length === 0) {
                            progress[9].status = "completed";
                            progress[9].description = "Parsing completed."
                        } else {
                            progress[9].status = "warning";
                            progress[9].description = "Parsing completed with errors, please review these items by clicking here, if you don't correct these errors then these will be exluded from publishing. If you make changes to the source file hosted by you then you will need to select 'fetch latest file from url'"
                        }

                        progress[9].description += " (" + (parsedLocations.length - errored.length) + "/" + parsedLocations.length + " successful)"

                    }

                }

                if (!dataset.savedName) {
                    console.log("======SAVED ON open data map");
                    if (parsedLocations.length === 0) {
                        progress[9].status = "optional";
                        progress[9].description = "No locations yet"
                        if (progress[9].next) {
                            progress[9].next = false;
                            nextChosen = false;
                        }
                    }
                }

                progress[10].status = "optional";
                progress[10].description = "Review your locations before publishing";

                if (dataset.requestId) {
                    progress[11].status = "completed";
                    progress[11].description = "Request attached"
                } else {
                    progress[11].status = "optional";
                    progress[11].description = "If you are submitting this dataset for a request then select the request"
                }

                if (dataset.isPublished) {
                    progress[12].status = "completed";
                    progress[12].description = "Dataset has been published and publicly visible"
                } else {
                    progress[12].status = "todo";
                    progress[12].description = "Click here to publish dataset"
                    if (!nextChosen) {
                        progress[12].next = true;
                        nextChosen = true;
                    }
                }

                this.setState({
                    progress: progress,
                    // errored: errored
                })

            }.bind(this),
            catch: function(code, error) {
                this.setState({
                    error: error,
                    loading: null
                })
            }.bind(this)
        })

    }

    ionViewWillLeave() {
        startedGettingProgress = false;
    }

    async ionViewWillEnter() {

        document.title = "Dataset Setup" + window.globalVars.pageTitle;

        if (!startedGettingProgress) {
            startedGettingProgress = true
            setTimeout(function() {
                startedGettingProgress = false;
            }, 5000)
            this.getProgress();
        }

        let lastUpdate = await Storage.get("lastTopicUpdate");

        if (!lastUpdate || parseInt(lastUpdate) + 900000 < Date.now()) {

            console.log("============================================ GETTING========================")

            Server.api({
                method: "get",
                url: "/topic/",
                then: async function(res) {
                    if (res.data) {
                        await Storage.setO("topics", res.data)
                        await Storage.set("lastTopicUpdate", Date.now())
                    }
                }.bind(this),
                catch: function(code, error) {
                    console.error(code, error);
                }.bind(this)
            })

            Server.api({
                method: "get",
                url: "/licence/",
                then: async function(res) {
                    if (res.data)
                        await Storage.setO("licences", res.data)
                }.bind(this),
                catch: function(code, error) {
                    console.error(code, error);
                }.bind(this)
            })

        }

    }

    openStep(item) {

        if (item.path.indexOf("()") === -1) {
            this.props.history.push("/dataset/setup/" + this.props.match.params.id + "/" + item.path )
        } else {
            if (item.path === "parse()") {
                if (item.status === "inprogress") {
                    this.setState({ error: "Parsing is already in progress." })
                } else if ( (item.status === "warning") || (item.status === "completed") ) {
                    if (item.status === "warning") {
                        this.setState({ parsingOrErrorPreviewmodal: true })
                    } else {
                        this.setState({ confirmParsingModal: true })
                    }
                } else if (!item.next && !this.state.dataset.isPublished) {
                    this.setState({ error: "Please complete all the required sections above to start the parsing." })
                } else {
                    this.setState({ confirmParsingModal: true })
                }
            } else if (item.path === "review()") {
                if (this.state.progress[9].status === "todo") {
                    this.setState({ error: "The dataset is not yet parsed." })
                } else if (this.state.progress[9].status === "inprogress") {
                    this.setState({ error: "Parsing is in progress." })
                } else {
                    this.props.history.push("/dataset/" + this.props.match.params.id + "/map")
                }
            } else if (item.path === "publish()") {
                if (this.state.dataset.isPublished) {
                    this.setState({ error: "This dataset is already publihsed" })
                } else if (!item.next) {
                    this.setState({ error: "Please complete all the required sections above to publish the dataset." })
                } else {
                    this.setState({ confirmPublishingModal: true })
                }
            } else if (item.path === "markUpdated()") {
                if (!this.state.dataset.isPublished) {
                    this.setState({ error: "You have to publish your dataset first" })
                } else {
                    this.markUpdated();
                }
            }
        }

    }

    render() {
        return (
            <IonPage data-page="dataset-progress">
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonBackButton onClick={() => { this.props.history.goBack(); }} />
                        </IonButtons>
                        <IonTitle>Dataset Progress</IonTitle>
                        <IonButtons slot="end">
                            <IonIcon icon={ellipsisHorizontalOutline} onClick={() => { this.setState({ actionSheet: true }) }}></IonIcon>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <div className="progress-container">
                        <div className="line" />
                        { (this.state.dataset && this.state.dataset.isPublished && this.state.dataset.type === "external") &&
                            <div className="details">
                                <h2>Last parses</h2>
                                <div>
                                    <label>Last check for updates</label>
                                    <p>{(this.state.dataset.lastCheckForUpdates) ? Utilities.formatDate(this.state.dataset.lastCheckForUpdates, "") : "N/A" }</p>
                                </div>
                                <div>
                                    <label>Last Activity</label>
                                    <p>{(this.state.dataset.locationupdatedat) ? Utilities.formatDate(this.state.dataset.locationupdatedat, "") : "N/A" }</p>
                                </div>
                                <div>
                                    <label>Scan period</label>
                                    <p>{this.state.dataset.updateFrequency}</p>
                                </div>
                                <IonButton style={{ marginBottom: 0, marginTop: 4, marginLeft: 0 }} color="dark" onClick={() => { this.checkForUpdates() }}>Check for updates now</IonButton>
                            </div>
                        }
                        { this.state.progress.map((item, i) => {
                            return (
                                <div className="task" data-pulse={item.next} key={item.name} onClick={() => {

                                        if (window.globalVars.datasetHasChanged) {
                                            this.setState({
                                                hasChangedAlert: true,
                                                pendingStep: item,
                                            })
                                            return;
                                        }

                                        this.openStep(item);

                                    }}>
                                    { (item.status === "todo") && <div className="status" data-status="todo"> <IonIcon icon={handLeftOutline} mode="md" /> </div> }
                                    { (item.status === "completed") && <div className="status" data-status="completed"> <IonIcon icon={checkmark} mode="md" /> </div> }
                                    { (item.status === "optional") && <div className="status" data-status="optional"> <IonIcon icon={checkmark} mode="md" /> </div> }
                                    { (item.status === "inprogress") && <div className="status" data-status="inprogress"> <IonIcon icon={hourglassOutline} mode="md" /> </div> }
                                    { (item.status === "warning") && <div className="status" data-status="warning"> <IonIcon icon={warning} mode="md" /> </div> }
                                    <div className="meta">
                                        <h2>{item.name} { item.subtext && <span>{item.subtext}</span> }</h2>
                                        <p>{item.description}</p>
                                        { (item.path === "fields" && item.data) &&
                                            <div className="data" data-section="fields">
                                                { Object.keys(item.data).map(key => {
                                                    if ( (key.startsWith("___") && key.endsWith("___")) || key === "uniqueId" ) return null;
                                                    let field = item.data[key];
                                                    return (
                                                        <div className="field" key={key}>
                                                            {key}
                                                            { (typeof field.type === "object" && field.type.length !== 0) && field.type.map(field => {
                                                                return (
                                                                    <span key={field}>{field}</span>
                                                                )
                                                            }) }
                                                        </div>
                                                    )
                                                }) }
                                            </div>
                                        }
                                        { (item.path === "details" && item.data) &&
                                            <div className="data" data-section="fields">
                                                { Object.keys(item.data).map(key => {
                                                    let field = item.data[key];
                                                    return (
                                                        <div key={key} className="field">
                                                            {key}
                                                            <span>{field}</span>
                                                        </div>
                                                    )
                                                }) }
                                            </div>
                                        }
                                        { /* (item.path === "parse()" && this.state.errored && this.state.errored.length !== 0) &&
                                            <div className="data" data-section="parse">
                                                <IonList>
                                                    { this.state.errored.map(item => {
                                                        return (
                                                            <IonItem>
                                                                <IonLabel className="ion-text-wrap">
                                                                    <h2>Internal Id: {item.id}</h2>
                                                                    <h3>Name: {item.name}</h3>
                                                                    <h3>Cause: {item.error}</h3>
                                                                    {item.errorRowI && <h3>Row/Document: {item.errorRowI}</h3> }
                                                                </IonLabel>
                                                            </IonItem>
                                                        )
                                                    }) }
                                                </IonList>
                                            </div>
                                        */ }
                                    </div>
                                </div>
                            )
                        }) }
                    </div>
                </IonContent>
                <IonAlert
                    isOpen={this.state.error !== null}
                    onDidDismiss={() => { this.setState({ error: null }) }}
                    message={this.state.error}
                    buttons={[
                        { text: 'Close' }
                    ]}
                />

                <IonActionSheet
                    isOpen={this.state.parsingOrErrorPreviewmodal !== null}
                    header={"Select Option"}
                    onDidDismiss={() => { this.setState({ parsingOrErrorPreviewmodal: null }) }}
                    buttons={[
                        {
                            text: "Review errored locations",
                            handler: () => { this.props.history.push("/dataset/setup/" + this.props.match.params.id + "/errored") }
                        },
                        {
                            text: "Reparse",
                            handler: () => { this.setState({ confirmParsingModal: true }) }
                        },
                    ]}
                  >
                </IonActionSheet>
                <IonAlert
                    isOpen={this.state.confirmParsingModal}
                    onDidDismiss={(d) => {
                        console.log(d.detail.data)
                        this.setState({
                            confirmParsingModal: false,
                            fetchLatest: (d && d.detail && d.detail.data && d.detail.data.values && d.detail.data.values[0] === "fetchLatest")
                        })
                    }}
                    message={"You are about to parse this dataset, this might take a few minutes depending on the size of the dataset."}
                    inputs={(this.state.dataset && this.state.dataset.savedName) ?
                        [
                            {
                                name: 'fetchLatest',
                                type: 'checkbox',
                                label: 'Fetch latest file from URL (this will erase all saved locations and all data related to them (e.g. likes, comments) from theopendatamap.com)',
                                value: 'fetchLatest'
                            }
                        ]
                        :
                        []
                    }
                    buttons={[
                        { text: 'Cancel' },
                        { text: 'Parse', handler: () => { setTimeout(function() { this.parse() }.bind(this), 300) } }
                    ]}
                />
                <IonAlert
                    isOpen={this.state.confirmPublishingModal}
                    onDidDismiss={() => { this.setState({ confirmPublishingModal: false }) }}
                    message={"You are about to publish this dataset, please make sure that locations have been parsed correctly."}
                    buttons={[
                        { text: 'Cancel' },
                        { text: 'Publish', handler: () => { this.publish() } }
                    ]}
                />
                <IonAlert
                    isOpen={this.state.confirmDeleteModal}
                    onDidDismiss={() => { this.setState({ confirmDeleteModal: false }) }}
                    header={'Delete dataset'}
                    message={'This will immediately mark the dataset and all locations as deleted, comments, reports and location data will not be deleted but will be hidden'}
                    buttons={[
                        { text: 'Cancel', },
                        { text: 'Delete', handler: () => { this.deleteDataset() } }
                    ]}
                />
                <IonAlert
                    isOpen={this.state.hasChangedAlert}
                    onDidDismiss={() => { this.setState({ hasChangedAlert: false }) }}
                    message={"You have some unsaved chagnes"}
                    buttons={[
                        { text: 'Discard', handler: () => { this.openStep(this.state.pendingStep); } },
                        { text: 'Review' },
                    ]}
                />
                <IonActionSheet
                    isOpen={this.state.actionSheet}
                    header="Options"
                    onDidDismiss={() => { this.setState({ actionSheet: false }) }}
                    buttons={[
                        {
                            text: "Edit Content",
                            handler: () => { this.props.history.push("/dataset/" + this.props.match.params.id + "/edit") }
                        },
                        {
                            text: "View Public Page",
                            handler: () => { this.props.history.push("/dataset/" + this.props.match.params.id) }
                        },
                        {
                            text: "Delete Dataset",
                            role: "destructive",
                            handler: () => { this.setState({ confirmDeleteModal: true }) }
                        },
                        {
                            text: "Cancel",
                            role: "cancel",
                            handler: () => { this.setState({ actionSheet: false }) }
                        }
                    ]}
                  >
                </IonActionSheet>
            </IonPage>
        );
    }

};

export default withIonLifeCycle(DatasetProgress);
