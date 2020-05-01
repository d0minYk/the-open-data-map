import { IonAlert, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonListHeader, IonLoading, IonPage, IonToast, IonToggle, IonToolbar, withIonLifeCycle } from '@ionic/react';
import { add, arrowBackCircleOutline, arrowForwardCircleOutline, close, gitCompare, gitMerge, pin, trash } from 'ionicons/icons';
import React, { createRef } from 'react';
import { WithContext as ReactTags } from 'react-tag-input';
import MapPreviewImage from '../images/map-background.png';
import LocationPickerModal from '../modals/LocationPickerModal.js';
import PathBuilderModal from '../modals/PathBuilderModal.js';
import MarkerCustomizerModal from '../modals/MarkerCustomizerModal.js';
import TagSuggestions from '../modals/TagSuggestions.js';
import Server from '../Server.js';
import '../styles/DatasetContentEditor.scss';
import Utilities from '../Utilities.js';

class DatasetContentEditor extends React.Component {

    constructor(props) {
        super(props)
        this.ionContent = createRef();
        this.pageRef = createRef();
        this.state = {
            current: {
                entity: null,
                id: null,
                i: 0,
                hasChanged: false,
                status: null,
            },
            togglesEnabled: true,
            loadingMessage: "Loading dataset",
            alertMessage: null,
            locationPickerModal: false,
            pathBuilderModal: false,
            minorNotification: null,
            unsavedAlert: false,
        }
    }

    async getDataset() {

        let dataset = await new Promise(function(resolve, reject) {

            Server.api({
                method: "get",
                url: "/dataset/" + this.props.match.params.id,
                then: function(res) {

                    if (res.data.type === "external") {
                        this.setState({
                            alertMessage: "This dataset is updated from an external URL and cannot be edited here.",
                            loadingMessage: null,
                        })
                        return resolve(null);
                    }

                    if ( (!res.data.isPublished) && (res.data.savedName) ) {
                        this.setState({
                            alertMessage: "This dataset is not yet published, you can create and edit locations after the initial parsing has finished.",
                            loadingMessage: null,
                        })
                        return resolve(null);
                    }

                    if ( (!res.data.fields) || (Object.keys(res.data.fields).length === 0) ) {
                        this.setState({
                            alertMessage: "This dataset has no fields defined",
                            loadingMessage: null,
                        })
                        return resolve(null);
                    }

                    return resolve(res.data);

                }.bind(this),
                catch: function(code, error) {
                    this.setState({
                        alertMessage: error,
                        loading: null
                    })
                }.bind(this)
            })

        }.bind(this))

        console.log(dataset, "===========");

        if (!dataset) {
            return;
        }

        let locations = await new Promise(function(resolve, reject) {

            Server.api({
                method: "get",
                url: "/dataset/" + this.props.match.params.id + "/locations",
                then: function(res) {
                    return resolve(res.data);
                }.bind(this),
                catch: function(code, error) {
                    this.setState({
                        alertMessage: error,
                        loading: null
                    })
                }.bind(this)
            })

        }.bind(this))

        if (!locations) {
            locations = [];
        }

        locations = locations.filter(item => !item.isDeleted).map(item => {
            return item.id;
        })

        this.setState({
            dataset: dataset,
            locations: locations || [],
            loadingMessage: null,
        }, function() {

            console.log("GOT", this.state);

            if (this.state.locations.length === 0) {
                this.appendNewLocalLocation();
            } else {
                this.getLocation(0);
            }

        })

        // this.setState({
        //     loadingMessage: null,
        //     dataset: res.data,
        // }, function() {
        //     // this.postFormat();
        // })
        //
        // console.log("Got dataset", res.data);

    }

    getLocation(i) {

        if (i < 0) {
            return;
        }

        if (i > this.state.locations.length-1) {
            this.appendNewLocalLocation();
            return;
        }

        this.ionContent.current.scrollToTop(0);

        let locationId = this.state.locations[i]
        i = parseInt(i)

        if (locationId === 0) {
            this.setState({ togglesEnabled: false }, function() {
                this.setState({
                    togglesEnabled: true,
                    current: {
                        entity: {
                            originalFields: {},
                            datasetDefaultOverrides: {},
                            id: 0,
                            isApproved: true,
                        },
                        id: 0,
                        i: this.state.locations.length-1,
                        hasChanged: true,
                        status: "present",
                    }
                })
            })
            return;
        }

        this.setState({ togglesEnabled: false }, function() {
            this.setState({
                current: {
                    entity: null,
                    id: locationId,
                    i: i,
                    hasChanged: false,
                    status: "getting",
                },
                loadingMessage: "Getting location " + locationId,
                pendingI: null,
                togglesEnabled: true
            }, function() {

                Server.api({
                    method: "get",
                    url: "/location/" + locationId,
                    then: function(res) {

                        console.log('location', res.data);

                        this.setState({ togglesEnabled: false }, function() {
                            this.setState({
                                current: {
                                    entity: res.data,
                                    id: locationId,
                                    i: i,
                                    hasChanged: false,
                                    status: "present",
                                },
                                loadingMessage: null,
                                togglesEnabled: true
                            })
                        })

                    }.bind(this),
                    catch: function(code, error) {
                        this.setState({ togglesEnabled: false }, function() {
                            this.setState({
                                alertMessage: "Failed to get " + locationId,
                                loadingMessage: null,
                                togglesEnabled: true
                            })
                        })
                    }.bind(this)
                })

            })
        })

    }

    appendNewLocalLocation() {

        console.log("APPENING");

        // return;

        let locations = JSON.parse(JSON.stringify(this.state.locations));
        let lastId = locations[locations.length-1];

        if (lastId !== 0) {
            locations.push(0)
        }

        let updateObj = {
            togglesEnabled: true,
            locations: locations,
            current: {
                entity: {
                    originalFields: {},
                    datasetDefaultOverrides: {},
                    isApproved: true,
                    id: 0,
                },
                id: 0,
                i: locations.length-1,
                hasChanged: true,
                status: "present",
            }
        };

        console.log(updateObj)

        this.setState({ togglesEnabled: false }, function() { this.setState(updateObj) })

    }

    handleTagAddition(tag, field) {
        let current = this.state.current;
        current.entity.datasetDefaultOverrides[field] = [...current.entity.datasetDefaultOverrides[field], tag]
        current.hasChanged = true;
        this.setState({ togglesEnabled: false }, function() {
            this.setState({
                current: current,
                togglesEnabled: true
            })
        })
    }

    ionViewWillEnter() {
        document.title = "Dataset Content Editor" + window.globalVars.pageTitle;
        this.getDataset();
        this.setState({
            size: window.globalVars.size,
            platform: window.globalVars.platform,
            hasChanged: false,
        })
    }

    async delete() {

        console.log("Deleting")

        let res = await new Promise(function(resolve, reject) {

            Server.api({
                method: "DELETE",
                url: '/location/' + this.state.current.entity.id,
                then: function(res) {
                    console.log(res, "DELETED");
                    let locations = this.state.locations;
                    let current = this.state.current;
                    let index = locations.indexOf(this.state.current.entity.id);
                    locations.splice(index, 1);
                    current.hasChanged = false;
                    this.setState({ togglesEnabled: false }, function() {
                        this.setState({
                            minorNotification: "Deleted!",
                            togglesEnabled: true,
                            current: current,
                            locations: locations
                        }, function() {
                            if (locations.length === 0) {
                                this.appendNewLocalLocation();
                            } else {
                                this.getLocation(0)
                            }
                        })
                    })
                    return resolve(res.data);
                }.bind(this),
                catch: function(code, error) {
                    this.setState({ togglesEnabled: false }, function() {
                        this.setState({
                            alertMessage: error,
                            loadingMessage: null,
                            togglesEnabled: true,
                        })
                    })
                }.bind(this)
            })

        }.bind(this));

        console.log(res);

        if (this.state.pendingI) {

            if (this.state.pendingI === this.state.locations.length) {
                this.appendNewLocalLocation();
            } else {
                this.getLocation(this.state.pendingI);
            }

        }

    }

    async save() {

        console.log("SAVING...", this.state.current);

        let res = await new Promise(function(resolve, reject) {

            let method = "POST";
            let url = "/location";
            let data = this.state.current.entity;

            if (this.state.current.entity.id !== 0) {
                method = "PUT"
                url = "/location/" + this.state.current.entity.id;
                data = this.state.current.entity;
            }

            data.dataset = this.state.dataset;

            Server.api({
                method: method,
                url: url,
                data: data,
                then: function(res) {
                    let current = this.state.current;
                    let locations = this.state.locations;
                    locations[locations.length-1] = res.data;
                    current.hasChanged = false;
                    if (current.entity.id === 0) {
                        current.entity.id = res.data;
                        current.id = res.data;
                    }
                    this.setState({ togglesEnabled: false }, function() {
                        this.setState({
                            minorNotification: "Saved!",
                            togglesEnabled: true,
                            current: current,
                            locations: locations
                        }, function() {
                            return resolve(res.data);
                        })
                    })
                }.bind(this),
                catch: function(code, error) {
                    this.setState({ togglesEnabled: false }, function() {
                        this.setState({
                            alertMessage: error,
                            loadingMessage: null,
                            togglesEnabled: true,
                        })
                    })
                }.bind(this)
            })

        }.bind(this));

        console.log(res);

        if (this.state.pendingI) {

            if (this.state.pendingI === this.state.locations.length) {
                this.appendNewLocalLocation();
            } else {
                this.getLocation(this.state.pendingI);
            }

        }

    }

    render() {
        return (
            <IonPage data-page="dataset-content-editor" ref={this.pageRef}>
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonBackButton onClick={() => { this.props.history.goBack(); }} />
                        </IonButtons>
                        <div className="pagination">
                            <IonIcon icon={arrowBackCircleOutline} onClick={() => {

                                if (this.state.current.hasChanged) {
                                    this.setState({ togglesEnabled: false }, function() {
                                        this.setState({
                                            pendingI: this.state.current.i-1,
                                            unsavedAlert: true,
                                            togglesEnabled: true
                                        })
                                    })
                                    // this.save();
                                    return;
                                }

                                this.getLocation(this.state.current.i-1)

                            }} />
                            <div>
                                <IonInput value={this.state.current.i} onIonBlur={(e) => {

                                    let newValue = e.target.value;

                                    if (!newValue) {
                                        return;
                                    }

                                    if (isNaN(newValue)) {
                                        return;
                                    }

                                    if (this.state.current.hasChanged) {
                                        this.setState({ togglesEnabled: false }, function() {
                                            this.setState({
                                                pendingI: newValue,
                                                togglesEnabled: true,
                                                unsavedAlert: true
                                            })
                                        })
                                        // this.save();
                                        return;
                                    }

                                    if (newValue > this.state.locations.length-1) {
                                        alert("Out of range");
                                        return
                                    }

                                    this.getLocation(newValue)

                                } } type="text" />
                                <span className="separator">/</span>
                                <span className="total">{this.state.locations ? this.state.locations.length-1 : 0}</span>
                            </div>
                            <IonIcon icon={arrowForwardCircleOutline} onClick={() => {

                                if (this.state.current.hasChanged) {
                                    this.setState({ togglesEnabled: false }, function() {
                                        this.setState({
                                            pendingI: this.state.current.i+1,
                                            togglesEnabled: true,
                                            unsavedAlert: true
                                        })
                                    })
                                    // this.save();
                                    return;
                                }

                                this.getLocation(this.state.current.i+1)

                            }} />
                        <IonIcon onClick={() => {

                            if (this.state.current.hasChanged) {
                                this.setState({ togglesEnabled: false }, function() {
                                    this.setState({
                                        pendingI: this.state.locations.length,
                                        togglesEnabled: true,
                                        unsavedAlert: true
                                    })
                                })
                                // this.save();
                                return;
                            }

                            this.appendNewLocalLocation();

                        }} icon={add} />
                        </div>
                    </IonToolbar>
                </IonHeader>
                <IonContent ref={this.ionContent}>
                    <div className="fields">
                        { (this.state.dataset && this.state.current && this.state.current.entity) &&
                            <div>
                                <IonListHeader>
                                    <IonLabel>Main Details</IonLabel>
                                </IonListHeader>
                                <IonList>
                                    <IonItem>
                                        <IonLabel position="stacked">ID</IonLabel>
                                        <IonInput disabled={true} value={this.state.current.id} type="text"></IonInput>
                                    </IonItem>
                                    { Object.keys(this.state.dataset.fields).map(key => {
                                        if (key === "uniqueId") return;
                                        let field = this.state.dataset.fields[key];
                                        let displayName = key;
                                        let value = this.state.current.entity.originalFields[key] || "";
                                        if ((key.startsWith("___") && key.endsWith("___"))) {
                                            value = this.state.dataset.fields[key].name;
                                            displayName = key.replace(/___/g, "");
                                        }
                                        return (
                                            <IonItem key={key}>
                                                <IonLabel position="stacked">{displayName}</IonLabel>
                                                <IonInput disabled={ (key.startsWith("___") && key.endsWith("___")) || (typeof value !== 'string') } value={ (typeof value === 'object') ? (JSON.stringify(value)) : value } onIonChange={(e) => {
                                                    let current = this.state.current;
                                                    current.entity.originalFields[key] = e.target.value;
                                                    current.hasChanged = true;
                                                    this.setState({ togglesEnabled: false }, function() {
                                                        this.setState({
                                                            current: current,
                                                            togglesEnabled: true
                                                        })
                                                    })
                                                } } placeholder={displayName} type="text"></IonInput>
                                            </IonItem>
                                        )
                                    }) }
                                </IonList>
                                <IonButton className="add-btn" expand="block" onClick={() => {
                                    this.props.history.push("/dataset/setup/" + this.props.match.params.id + "/fields")
                                }}>Add new field</IonButton>
                                { [
                                    {
                                        label: "Categories",
                                        field: "categories",
                                        autosuggest: "category"
                                    },
                                    {
                                        label: "Features",
                                        field: "features",
                                        autosuggest: "feature"
                                    }
                                ].map(item => {
                                    return (
                                        <section key={item.field}>
                                            <IonListHeader>
                                                <IonLabel>{item.label}</IonLabel>
                                            </IonListHeader>
                                            <p style={{ margin: '0 20px', color: '#555' }}>Separate with Enters</p>
                                            <IonItem>
                                                <IonLabel>Override dataset filters</IonLabel>
                                                { (this.state.togglesEnabled) &&
                                                    <IonToggle
                                                        checked={this.state.current.entity.datasetDefaultOverrides !== undefined && this.state.current.entity.datasetDefaultOverrides !== null && this.state.current.entity.datasetDefaultOverrides[item.field] !== undefined}
                                                        onIonChange={(e) => {

                                                            let current = this.state.current;
                                                            if (!current.entity.datasetDefaultOverrides) current.entity.datasetDefaultOverrides = {}

                                                            if (current.entity.datasetDefaultOverrides[item.field]) {
                                                                delete current.entity.datasetDefaultOverrides[item.field];
                                                            } else {
                                                                current.entity.datasetDefaultOverrides[item.field] = [];
                                                            }

                                                            current.hasChanged = true;

                                                            this.setState({ togglesEnabled: false }, function() {
                                                                this.setState({
                                                                    current: current,
                                                                    togglesEnabled: true
                                                                })
                                                            })

                                                        }}
                                                    />
                                                }
                                                </IonItem>
                                                { (this.state.current.entity.datasetDefaultOverrides && this.state.current.entity.datasetDefaultOverrides[item.field]) &&
                                                    <IonItem>
                                                        <ReactTags
                                                            className="tag-editor"
                                                            inline
                                                            placeholder={"Enter " + item.field}
                                                            minQueryLength={1}
                                                            handleInputChange={(text) => { this.setState(item.field === "categories" ? { queryCategories: text } : { queryFeatures: text }) }}
                                                            tags={this.state.current.entity.datasetDefaultOverrides[item.field]}
                                                            autofocus={false}
                                                            key={item.field + "-tag-editor"}
                                                            handleDelete={(i) => {
                                                                if (!this.state.current.entity.datasetDefaultOverrides[item.field]) {
                                                                    return;
                                                                }
                                                                let current = this.state.current;
                                                                current.entity.datasetDefaultOverrides[item.field] = current.entity.datasetDefaultOverrides[item.field].filter((tag, index) => index !== i)
                                                                current.hasChanged = true;
                                                                this.setState({ togglesEnabled: false }, function() {
                                                                    this.setState({
                                                                        current: current,
                                                                        togglesEnabled: true
                                                                    })
                                                                })
                                                            }}
                                                            handleAddition={(tag) => { this.handleTagAddition(tag, item.field); }}
                                                            delimiters={[188, 13]}
                                                        />
                                                    </IonItem>
                                                }
                                                { (this.state.current.entity.datasetDefaultOverrides && this.state.current.entity.datasetDefaultOverrides[item.field]) &&
                                                    <TagSuggestions
                                                        key={item.field + "-tag-suggestions"}
                                                        suggestFeatureFrom={ (item.field === "features") ? this.state.current.entity.datasetDefaultOverrides["categories"] : null }
                                                        type={item.autosuggest}
                                                        query={(item.field === "categories") ? this.state.queryCategories : this.state.queryFeatures}
                                                        onSelect={(tag) => {
                                                            this.handleTagAddition({id: tag, text: tag}, item.field);
                                                        }}
                                                    />
                                                }
                                        </section>
                                    )
                                })}

                                <section>
                                    <IonListHeader>
                                        <IonLabel>Location</IonLabel>
                                    </IonListHeader>
                                    <IonItem>
                                        <IonLabel>Override compilation from dataset fields</IonLabel>
                                        { (this.state.togglesEnabled) &&
                                            <IonToggle
                                                checked={this.state.current.entity.datasetDefaultOverrides !== undefined && this.state.current.entity.datasetDefaultOverrides !== null && this.state.current.entity.datasetDefaultOverrides["location"] !== undefined}
                                                onIonChange={(e) => {

                                                    let current = this.state.current;
                                                    if (!current.entity.datasetDefaultOverrides) current.entity.datasetDefaultOverrides = {}

                                                    if (current.entity.datasetDefaultOverrides["location"]) {
                                                        delete current.entity.datasetDefaultOverrides["location"];
                                                    } else {
                                                        current.entity.datasetDefaultOverrides["location"] = {
                                                            type: "point",
                                                            data: [],
                                                            str: {
                                                                streetHouse: "",
                                                                postcode: "",
                                                                city: "",
                                                                country: ""
                                                            }
                                                        };
                                                    }

                                                    current.hasChanged = true;

                                                    this.setState({ togglesEnabled: false }, function() {
                                                        this.setState({
                                                            current: current,
                                                            togglesEnabled: true
                                                        })
                                                    })

                                                }}
                                            />
                                        }
                                        </IonItem>
                                        { (this.state.current.entity.datasetDefaultOverrides && this.state.current.entity.datasetDefaultOverrides["location"]) &&
                                            <div className="location-type-picker">
                                                { [
                                                    {
                                                        type: "point",
                                                        label: "Point",
                                                        icon: pin
                                                    },
                                                    {
                                                        type: "path",
                                                        label: "Path",
                                                        icon: gitMerge
                                                    },
                                                    {
                                                        type: "polygon",
                                                        label: "Polygon",
                                                        icon: gitCompare
                                                    }
                                                ].map(item => {
                                                    return (
                                                        <div
                                                            key={item.type}
                                                            data-selected={ this.state.current.entity.datasetDefaultOverrides["location"].type === item.type }
                                                            onClick={() => {
                                                                let current = this.state.current;
                                                                current.entity.datasetDefaultOverrides["location"].type = item.type;
                                                                current.hasChanged = true;
                                                                this.setState({ togglesEnabled: false }, function() {
                                                                    this.setState({
                                                                        current: current,
                                                                        togglesEnabled: true
                                                                    })
                                                                })
                                                            }}
                                                        >
                                                            <IonIcon icon={item.icon} mode="md" />
                                                            <label>{item.label}</label>
                                                        </div>
                                                    )
                                                }) }
                                            </div>
                                        }
                                        { (this.state.current.entity.datasetDefaultOverrides && this.state.current.entity.datasetDefaultOverrides["location"]) &&
                                            <div>
                                                { ((this.state.current.entity.datasetDefaultOverrides["location"].type === "path" || this.state.current.entity.datasetDefaultOverrides["location"].type === "polygon") && this.state.current.entity.datasetDefaultOverrides["location"].type) &&
                                                    <div style={{ margin: '15px 15px 0 15px' }}>
                                                        {this.state.current.entity.datasetDefaultOverrides["location"].data.length} coordinates selected.
                                                    </div>
                                                }
                                            </div>
                                        }
                                        { (this.state.current.entity.datasetDefaultOverrides && this.state.current.entity.datasetDefaultOverrides["location"]) &&
                                            <div>
                                                { (this.state.size === "small") &&
                                                    <IonButton className="add-btn" expand="block" onClick={() => {
                                                        // this.setState({ togglesEnabled: false }, function() { this.setState({ locationPickerModal: true, togglesEnabled: true }) })
                                                        let newState = (this.state.current.entity.datasetDefaultOverrides["location"].type === "point") ? { locationPickerModal: true, togglesEnabled: true } : { pathBuilderModal: true, togglesEnabled: true }
                                                        this.setState({ togglesEnabled: false }, function() { this.setState(newState) })
                                                    }}>{ (this.state.current.entity.datasetDefaultOverrides["location"].type === "point") ? "Select location from map" : "Edit on map" }</IonButton>
                                                }
                                            </div>
                                        }
                                        { (this.state.current.entity.datasetDefaultOverrides && this.state.current.entity.datasetDefaultOverrides["location"]) &&
                                            <div className="location-str">
                                                { [
                                                    {
                                                        name: "streetHouse",
                                                        label: "House and street number"
                                                    },
                                                    {
                                                        name: "postcode",
                                                        label: "Postcode"
                                                    },
                                                    {
                                                        name: "city",
                                                        label: "City"
                                                    },
                                                    {
                                                        name: "country",
                                                        label: "Country"
                                                    },
                                                ].map(item => {
                                                    return (
                                                        <IonItem key={item.name}>
                                                            <IonLabel position="stacked">{item.label}</IonLabel>
                                                            <IonInput value={ this.state.current.entity.datasetDefaultOverrides["location"].str[item.name] } onIonChange={(e) => {
                                                                let current = this.state.current;
                                                                current.entity.datasetDefaultOverrides["location"].str[item.name] = e.target.value;
                                                                current.hasChanged = true;
                                                                this.setState({ togglesEnabled: false }, function() {
                                                                    this.setState({
                                                                        current: current,
                                                                        togglesEnabled: true
                                                                    })
                                                                })
                                                            } } placeholder={item.label} type="text"></IonInput>
                                                        </IonItem>
                                                    )
                                                }) }
                                            </div>
                                        }
                                        <IonItem>
                                            <IonLabel>Style override</IonLabel>
                                            { (this.state.togglesEnabled) &&
                                                <IonToggle
                                                    checked={this.state.current.entity.datasetDefaultOverrides !== undefined && this.state.current.entity.datasetDefaultOverrides !== null && this.state.current.entity.datasetDefaultOverrides["style"] !== undefined}
                                                    onIonChange={(e) => {

                                                        let current = this.state.current;
                                                        if (!current.entity.datasetDefaultOverrides) current.entity.datasetDefaultOverrides = {}

                                                        if (current.entity.datasetDefaultOverrides["style"]) {
                                                            delete current.entity.datasetDefaultOverrides["style"];
                                                        } else {
                                                            current.entity.datasetDefaultOverrides["style"] = {
                                                                "___marker_style___": {
                                                                    color: (window.globalVars ? window.globalVars.COLORS.blue : "#4a69bb"),
                                                                },
                                                                "___path_style___": {
                                                                    borderColor: '#333',
                                                                    borderWeight: 5,
                                                                    borderOpacity: 1,
                                                                },
                                                                "___polygon_style___": {
                                                                    borderColor: '#333',
                                                                    borderWeight: 5,
                                                                    borderOpacity: 1,
                                                                    fillOpacity: 1,
                                                                    fillColor: (window.globalVars ? window.globalVars.COLORS.blue : "#4a69bb")
                                                                },
                                                            };
                                                        }

                                                        current.hasChanged = true;

                                                        this.setState({ togglesEnabled: false }, function() {
                                                            this.setState({
                                                                current: current,
                                                                togglesEnabled: true
                                                            })
                                                        })

                                                    }}
                                                />
                                            }
                                        </IonItem>
                                        { (this.state.current.entity.datasetDefaultOverrides && this.state.current.entity.datasetDefaultOverrides["style"]) &&
                                            <div className="marker-apearance" onClick={() => {
                                                this.setState({ togglesEnabled: false }, function() { this.setState({
                                                    markerCustomizerModal: true,
                                                    markerCustomizerModalData: this.state.current.entity.datasetDefaultOverrides,
                                                    togglesEnabled: true
                                                }) })
                                            }}>
                                                { (this.state.current.entity.datasetDefaultOverrides["location"].type === "point") &&
                                                    <div className="marker">
                                                        <IonItem>
                                                            <IonLabel position="stacked">Marker Appearance</IonLabel>
                                                        </IonItem>
                                                        <div className="preview-wrapper" style={{ backgroundImage: `url('${MapPreviewImage}')` }}>
                                                            <div class="marker-custom" data-image={this.state.current.entity.datasetDefaultOverrides["style"]["___marker_style___"].image ? "true" : "false"}>
                                                                <div style={{ backgroundColor: this.state.current.entity.datasetDefaultOverrides["style"]["___marker_style___"].color || window.globalVars.COLORS.blue }}>
                                                                    { (this.state.current.entity.datasetDefaultOverrides["style"]["___marker_style___"].image) ?
                                                                        <div style={{ width: '100%', height: '100%' }}><img src={this.state.current.entity.datasetDefaultOverrides["style"]["___marker_style___"].image} style={{ width: '100%', height: '100%' }} /></div>
                                                                        :
                                                                        <i className={this.state.current.entity.datasetDefaultOverrides["style"]["___marker_style___"].icon} />
                                                                    }
                                                                </div>
                                                                <span />
                                                            </div>
                                                        </div>
                                                    </div>
                                                }
                                                { (this.state.current.entity.datasetDefaultOverrides["location"].type === "path") &&
                                                    <div className="path">
                                                        <IonItem>
                                                            <IonLabel position="stacked">Path Appearance</IonLabel>
                                                        </IonItem>
                                                        <div className="preview-wrapper" style={{ backgroundImage: `url('${MapPreviewImage}')` }}>
                                                            <div className="path-custom" style={{ backgroundColor: this.state.current.entity.datasetDefaultOverrides["style"]["___path_style___"].borderColor, opacity: this.state.current.entity.datasetDefaultOverrides["style"]["___path_style___"].borderOpacity, height: this.state.current.entity.datasetDefaultOverrides["style"]["___path_style___"].borderWeight + "px" }} />
                                                        </div>
                                                    </div>
                                                }
                                                { (this.state.current.entity.datasetDefaultOverrides["location"].type === "polygon") &&
                                                    <div className="polygon">
                                                        <IonItem>
                                                            <IonLabel position="stacked">Polygon Appearance</IonLabel>
                                                        </IonItem>
                                                        <div className="preview-wrapper" style={{ backgroundImage: `url('${MapPreviewImage}')` }}>
                                                            <div className="polygon-preview" style={{
                                                                backgroundColor: ("rgba(" + Utilities.hexToRgbA(this.state.current.entity.datasetDefaultOverrides["style"]["___polygon_style___"].fillColor) + "," + parseFloat(this.state.current.entity.datasetDefaultOverrides["style"]["___polygon_style___"].fillOpacity) + ")"),
                                                                borderColor: ("rgba(" + Utilities.hexToRgbA(this.state.current.entity.datasetDefaultOverrides["style"]["___polygon_style___"].borderColor) + "," + parseFloat(this.state.current.entity.datasetDefaultOverrides["style"]["___polygon_style___"].borderOpacity) + ")"),
                                                                borderWidth: parseInt(this.state.current.entity.datasetDefaultOverrides["style"]["___polygon_style___"].borderWeight) + "px" }}
                                                            />
                                                        </div>
                                                    </div>
                                                }
                                            </div>
                                        }
                                </section>

                                <IonItem>
                                    <IonLabel>{ (this.state.current.entity.id === 0) ? "Publish on save" : "Published" }</IonLabel>
                                    { (this.state.togglesEnabled) &&
                                        <IonToggle
                                            checked={this.state.current.entity.isApproved}
                                            onIonChange={(e) => {

                                                let current = this.state.current;
                                                current.entity.isApproved = !current.entity.isApproved;
                                                current.hasChanged = true;

                                                this.setState({ togglesEnabled: false }, function() {
                                                    this.setState({
                                                        current: current,
                                                        togglesEnabled: true
                                                    })
                                                })

                                            }}
                                        />
                                    }
                                </IonItem>
                                <div className="options">
                                    { (this.state.current.entity.id !== 0) &&
                                        <IonButton
                                            className="delete-btn"
                                            color="danger"
                                            onClick={() => {
                                                this.setState({ togglesEnabled: false }, function() {
                                                    this.setState({
                                                        deleteConfirm: true,
                                                        togglesEnabled: true
                                                    })
                                                })
                                            }}>
                                                <IonIcon slot="icon-only" icon={trash} />
                                        </IonButton>
                                    }
                                    <IonButton className="save-btn" disabled={ (!this.state.current.hasChanged) } onClick={() => { this.save() }}>Save</IonButton>
                                </div>
                            </div>
                        }
                    </div>
                </IonContent>
                <IonLoading
                    isOpen={this.state.loadingMessage !== null}
                    onDidDismiss={() => {
                        this.setState({ togglesEnabled: false }, function() {
                            this.setState({
                                loadingMessage: null,
                                togglesEnabled: true
                            })
                        })
                    }}
                    message={this.state.loadingMessage}
                />
                <IonAlert
                    isOpen={this.state.alertMessage !== null}
                    onDidDismiss={() => {
                        this.setState({ togglesEnabled: false }, function() {
                            if (this.state.alertMessage && this.state.alertMessage.indexOf("not yet published") !== -1) {
                                this.props.history.goBack();
                            }
                            this.setState({
                                alertMessage: null,
                                togglesEnabled: true,
                            })
                        })
                    }}
                    header={'Error'}
                    message={this.state.alertMessage}
                    buttons={[
                        { text: 'Close' },
                    ]}
                />
                <IonAlert
                    isOpen={this.state.unsavedAlert}
                    onDidDismiss={() => {
                        this.setState({ togglesEnabled: false }, function() {
                            this.setState({
                                unsavedAlert: false,
                                togglesEnabled: true,
                            })
                        })
                    }}
                    header={'Unsaved changes'}
                    message={'Do you want to save your changes?'}
                    buttons={[
                        {
                            text: 'Discard',
                            handler: () => {

                                if (this.state.pendingI) {

                                    if (this.state.pendingI === this.state.locations.length) {
                                        this.appendNewLocalLocation();
                                    } else {
                                        this.getLocation(this.state.pendingI);
                                    }

                                }

                            }
                        },
                        {
                            text: 'Save',
                            handler: () => {

                                this.save();

                            }
                        },
                    ]}
                />
                <IonAlert
                    isOpen={this.state.deleteConfirm}
                    onDidDismiss={() => {
                        this.setState({ togglesEnabled: false }, function() {
                            this.setState({
                                deleteConfirm: false,
                                togglesEnabled: true,
                            })
                        })
                    }}
                    header={'Delete location'}
                    message={'Are you sure you want to delete this location, this will mark this as deleted and will not be public or mutable anymore'}
                    buttons={[
                        {
                            text: 'Cancel',
                        },
                        {
                            text: 'Delete',
                            handler: () => {
                                this.delete();
                            }
                        },
                    ]}
                />

            { (this.state.size === "big") && (this.state.current.entity && this.state.current.entity.datasetDefaultOverrides && this.state.current.entity.datasetDefaultOverrides["location"] && this.state.current.entity.datasetDefaultOverrides["location"].type === "point") &&
                    <div className="map">
                        <LocationPickerModal
                            open={true}
                            size="big"
                            presentingElement={this.pageRef}
                            onClose={() => { }}
                            onOpen={() => { }}
                            preloadType={this.state.current && this.state.current.entity && this.state.current.entity.datasetDefaultOverrides["location"] ? this.state.current.entity.datasetDefaultOverrides["location"].type : null}
                            preloadCoordinates={this.state.current && this.state.current.entity && this.state.current.entity.datasetDefaultOverrides["location"] ? this.state.current.entity.datasetDefaultOverrides["location"].data : null}
                            needAddress={ (this.state.current.entity && this.state.current.entity.datasetDefaultOverrides && this.state.current.entity.datasetDefaultOverrides["location"] && this.state.current.entity.datasetDefaultOverrides["location"].type === "point") }
                            onSave={(coordinates, address) => {

                                let current = this.state.current;

                                if (coordinates && coordinates.lat) {

                                    if (current.entity.datasetDefaultOverrides["location"].type === "point") {
                                        current.entity.datasetDefaultOverrides["location"].data = [coordinates]
                                    } else {
                                        current.entity.datasetDefaultOverrides["location"].data.push(coordinates)
                                    }

                                    if (address && address.streetHouse) current.entity.datasetDefaultOverrides["location"].str.streetHouse = address.streetHouse;
                                    if (address && address.postcode) current.entity.datasetDefaultOverrides["location"].str.postcode = address.postcode;
                                    if (address && address.city) current.entity.datasetDefaultOverrides["location"].str.city = address.city;
                                    if (address && address.country) current.entity.datasetDefaultOverrides["location"].str.country = address.country;

                                }

                                current.hasChanged = true

                                this.setState({
                                    current: current,
                                    hasChanged: true,
                                    locationPickerModal: false,
                                })

                            }}
                        />
                    </div>
                }

                { (this.state.size === "big" && this.state.current.entity && this.state.current.entity.datasetDefaultOverrides && this.state.current.entity.datasetDefaultOverrides["location"] && this.state.current.entity.datasetDefaultOverrides["location"].type !== "point") &&
                    <div className="map">
                        <PathBuilderModal
                            open={true}
                            coordinates={this.state.current.entity.datasetDefaultOverrides["location"].data}
                            type={this.state.current.entity.datasetDefaultOverrides["location"].type}
                            size="big"
                            presentingElement={this.pageRef}
                            onClose={() => { }}
                            onOpen={() => { }}
                            onSave={(coordinates) => {
                                let current = this.state.current;
                                current.entity.datasetDefaultOverrides["location"].data = coordinates;
                                current.hasChanged = true;
                                this.setState({
                                    current: current,
                                    hasChanged: true
                                })
                            }}
                        />
                    </div>
                }

                { (this.state.size === "small") &&
                    <LocationPickerModal
                        open={this.state.locationPickerModal}
                        size="small"
                        presentingElement={this.pageRef}
                        onClose={() => { this.setState({ locationPickerModal: false }) }}
                        onOpen={() => { this.setState({ locationPickerModal: true }) }}
                        preloadType={this.state.current && this.state.current.entity && this.state.current.entity.datasetDefaultOverrides["location"] ? this.state.current.entity.datasetDefaultOverrides["location"].type : null}
                        preloadCoordinates={this.state.current && this.state.current.entity && this.state.current.entity.datasetDefaultOverrides["location"] ? this.state.current.entity.datasetDefaultOverrides["location"].data : null}
                        needAddress={ (this.state.current.entity && this.state.current.entity.datasetDefaultOverrides && this.state.current.entity.datasetDefaultOverrides["location"] && this.state.current.entity.datasetDefaultOverrides["location"].type === "point") }
                        onSave={(coordinates, address) => {

                            let current = this.state.current;

                            if (coordinates && coordinates.lat) {

                                if (current.entity.datasetDefaultOverrides["location"].type === "point") {
                                    current.entity.datasetDefaultOverrides["location"].data = [coordinates]
                                } else {
                                    current.entity.datasetDefaultOverrides["location"].data.push(coordinates)
                                }

                                if (address && address.streetHouse) current.entity.datasetDefaultOverrides["location"].str.streetHouse = address.streetHouse;
                                if (address && address.postcode) current.entity.datasetDefaultOverrides["location"].str.postcode = address.postcode;
                                if (address && address.city) current.entity.datasetDefaultOverrides["location"].str.city = address.city;
                                if (address && address.country) current.entity.datasetDefaultOverrides["location"].str.country = address.country;

                            }

                            current.hasChanged = true;

                            this.setState({
                                current: current,
                                hasChanged: true,
                                locationPickerModal: false,
                            })

                        }}
                    />
                }

                { (this.state.size === "small") &&
                    <PathBuilderModal
                        open={this.state.pathBuilderModal}
                        coordinates={this.state.current.entity ? this.state.current.entity.datasetDefaultOverrides["location"].data : null}
                        type={this.state.current.entity ? this.state.current.entity.datasetDefaultOverrides["location"].type : null}
                        size="small"
                        presentingElement={this.pageRef}
                        onClose={() => { this.setState({ pathBuilderModal: false }) }}
                        onOpen={() => { this.setState({ pathBuilderModal: true }) }}
                        onSave={(coordinates) => {
                            let current = this.state.current;
                            current.entity.datasetDefaultOverrides["location"].data = coordinates;
                            current.hasChanged = true
                            this.setState({
                                current: current,
                                pathBuilderModal: false,
                                hasChanged: true
                            })
                        }}
                    />
                }

                <IonToast
                    color="dark"
                    isOpen={(this.state.minorNotification !== null)}
                    onDidDismiss={() => {
                        this.setState({ togglesEnabled: false }, function() {
                            this.setState({
                                togglesEnabled: true,
                                minorNotification: null,
                            })
                        })
                    }}
                    message={this.state.minorNotification}
                    position="bottom"
                    duration={1000}
              />
          {/*<MarkerCustomizerModal
                  open={this.state.markerCustomizerModal}
                  data={this.state.markerCustomizerModalData}
                  source="dataset-content-editor"
                  locationEntity={this.state.current.entity}
                  presentingElement={this.pageRef}
                  onClose={() => {
                      this.setState({ togglesEnabled: false }, function() {
                          this.setState({
                              markerCustomizerModal: false,
                              togglesEnabled: true,
                          })
                      })
                  }}
                  onOpen={() => {
                      this.setState({ togglesEnabled: false }, function() {
                          this.setState({
                              markerCustomizerModal: true,
                              togglesEnabled: true,
                          })
                      })
                  }}
                  type="marker"
                  coordinates={null}
                  onSave={(type, style) => {

                      let current = this.state.current;

                      this.setState({ togglesEnabled: false }, function() {

                          current.hasChanged = true;

                          if (type === "point") {
                              current.entity.datasetDefaultOverrides["style"]["___marker_style___"] = style;
                          } else if (type === "path") {
                              current.entity.datasetDefaultOverrides["style"]["___path_style___"] = style;
                          } else if (type === "polygon") {
                              current.entity.datasetDefaultOverrides["style"]["___polygon_style___"] = style;
                          }

                          this.setState({
                              markerCustomizerModal: false,
                              togglesEnabled: true,
                              current: current,
                              hasChanged: true
                          })

                      })

                  }}
              />*/}
            </IonPage>
        );
    }

};

export default withIonLifeCycle(DatasetContentEditor);
