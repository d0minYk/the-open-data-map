import { IonAlert, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonListHeader, IonLoading, IonPage, IonTextarea, IonTitle, IonToast, IonToggle, IonToolbar, withIonLifeCycle } from '@ionic/react';
import { addCircleOutline, close, gitCompare, gitMerge, pin, trash } from 'ionicons/icons';
import React, { createRef } from 'react';
import { WithContext as ReactTags } from 'react-tag-input';
import MapPreviewImage from '../images/map-background.png';
import LocationPickerModal from '../modals/LocationPickerModal.js';
import PathBuilderModal from '../modals/PathBuilderModal.js';
import MarkerCustomizerModal from '../modals/MarkerCustomizerModal.js';
import TagSuggestions from '../modals/TagSuggestions.js';
import Server from '../Server.js';
import Storage from '../Storage.js';
import '../styles/LocationEditor.scss';
import Utilities from '../Utilities.js';

const DEFAULT_ORIGINAL_FIELD_LABELS = {
    "name": "Name",
    "description": "Description",
    "tel": "Contact Number",
    "website": "Webiste",
    "email": "Contact Email",
}

class LocationContentEditor extends React.Component {

    constructor(props) {
        super(props)
        this.ionContent = createRef();
        this.lastId = null;
        this.pageRef = createRef();
        this.state = {
            entity: null,
            hasChanged: false,
            togglesEnabled: true,
            loadingMessage: null,
            alertMessage: null,
            locationPickerModal: false,
            minorNotification: null,
            unsavedAlert: false,
        }
    }

    getLocation() {

        if (this.props.match.params.id === "new") {
            this.setState({ togglesEnabled: false }, function() {
                this.setState({
                    entity: {
                        id: "new",
                        originalFields: {
                            "name": "",
                            "website": "",
                            "tel": "",
                            "description": "",
                            "email": "",
                            "___location_type___": "point",
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
                            "___coordinates___": []
                        },
                        isApproved: true,
                    },
                    hasChanged: false,
                    togglesEnabled: true
                })
            })
            return;
        }

        this.setState({ togglesEnabled: false }, function() {
            this.setState({
                entity: null,
                loadingMessage: "Loading location",
                togglesEnabled: true
            }, function() {

                Server.api({
                    method: "get",
                    url: "/location/" + this.props.match.params.id,
                    then: function(res) {

                        console.log('location', res.data);

                        if (res.data.datasetId) {
                            this.setState({ togglesEnabled: false }, function() {
                                this.setState({
                                    alertMessage: this.props.match.params.id + " can only be edited from its dataset",
                                    loadingMessage: null,
                                    togglesEnabled: true
                                })
                            })
                            return;
                        }

                        if (res.data.isDeleted) {
                            this.setState({ togglesEnabled: false }, function() {
                                this.setState({
                                    alertMessage: this.props.match.params.id + " has been deleted",
                                    loadingMessage: null,
                                    togglesEnabled: true
                                })
                            })
                            return;
                        }

                        this.setState({ togglesEnabled: false }, function() {
                            this.setState({
                                entity: res.data,
                                hasChanged: false,
                                loadingMessage: null,
                                togglesEnabled: true
                            })
                        })

                    }.bind(this),
                    catch: function(code, error) {
                        this.setState({ togglesEnabled: false }, function() {
                            this.setState({
                                alertMessage: "Failed to get " + this.props.match.params.id,
                                loadingMessage: null,
                                togglesEnabled: true
                            })
                        })
                    }.bind(this)
                })

            })
        })

    }

    async componentDidUpdate() {
        console.log("UPDATE==")
        if ( (this.props.match.params.id) && (this.props.match.params.id !== this.lastId) ) {
            this.lastId = this.props.match.params.id;
            this.getLocation();
        }
    }

    async ionViewWillEnter() {
        document.title = "Location Editor" + window.globalVars.pageTitle;
        let user = await Storage.getO("user")
        if (!user) {
            this.props.history.push("/login");
            return;
        }
        this.setState({
            size: window.globalVars.size,
            platform: window.globalVars.platform,
        })
    }

    async delete() {

        console.log("Deleting")

        let res = await new Promise(function(resolve, reject) {

            Server.api({
                method: "DELETE",
                url: '/location/' + this.state.entity.id,
                then: function(res) {
                    console.log(res, "DELETED");
                    this.setState({ togglesEnabled: false }, function() {
                        this.setState({
                            minorNotification: "Deleted!",
                            togglesEnabled: true,
                        })
                        setTimeout(function() {
                            this.props.history.push("/profile");
                        }.bind(this), 1000);
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

        if (this.state.pendingI) {

            if (this.state.pendingI === this.state.locations.length) {
                this.appendNewLocalLocation();
            } else {
                this.getLocation(this.state.pendingI);
            }

        }

    }

    async save() {

        this.setState({ loadingMessage: "Saving..." })

        console.log("SAVING...", this.state.entity);

        let method = "POST";
        let url = "/location";
        let data = this.state.entity;

        for (let key in data.originalFields) {
            if ( (key.startsWith("___") && key.endsWith("___")) || ["streetHouse", "postcode", "city", "country", "tel", "website", "email", "name", "description"].indexOf(key) !== -1 ) continue;
            if (!data.originalFields[key]) {
                delete data.originalFields[key]
            }
        }

        if (this.props.match.params.id !== "new") {
            method = "PUT"
            url = "/location/" + this.state.entity.id;
            data = this.state.entity;
        }

        Server.api({
            method: method,
            url: url,
            data: data,
            then: function(res) {
                let entity = this.state.entity;
                if (this.props.match.params.id === "new") {
                    setTimeout(function() {
                        this.props.history.push("/location/" + res.data + "/edit");
                    }.bind(this), 1000);
                }
                this.setState({ togglesEnabled: false }, function() {
                    this.setState({
                        minorNotification: "Saved!",
                        togglesEnabled: true,
                        hasChanged: false,
                        loadingMessage: null,
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

    }

    handleTagAddition(tag, field) {

        let entity = this.state.entity;
        if (!entity.originalFields[field]) {
            entity.originalFields[field] = []
        }
        entity.originalFields[field] = [...entity.originalFields[field], tag]
        this.setState({ togglesEnabled: false }, function() {
            this.setState({
                entity: entity,
                hasChanged: true,
                togglesEnabled: true
            })
        })

    }

    render() {
        return (
            <IonPage data-page="location-editor" ref={this.pageRef}>
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonBackButton onClick={() => { this.props.history.goBack(); }} />
                        </IonButtons>
                        <IonTitle>{this.props.match.params.id === "new" ? "Create" : "Edit"} Location</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent ref={this.ionContent}>
                    <div className="fields">
                        { (this.state.entity) &&
                            <div>
                                <IonListHeader>
                                    <IonLabel>Main Details</IonLabel>
                                </IonListHeader>
                                <IonList>
                                    {/*<IonItem>
                                        <IonLabel position="stacked">ID</IonLabel>
                                        <IonInput disabled={true} value={this.props.match.params.id} type="text"></IonInput>
                                    </IonItem>*/}
                                    { (this.state.entity && this.state.entity.originalFields) && Object.keys(this.state.entity.originalFields).map(key => {
                                        if ( (key.startsWith("___") && key.endsWith("___")) || (key === "categories") || (key === "features") || (key === "streetHouse") || (key === "postcode") || (key === "city") || (key === "country") ) return null;
                                        let value = this.state.entity.originalFields[key];
                                        let displayName = DEFAULT_ORIGINAL_FIELD_LABELS[key] || key;
                                        return (
                                            <IonItem key={key}>
                                                <IonLabel position="stacked">{displayName} {(displayName === "Name") ? <span>required</span> : null}</IonLabel>
                                                { (key === "description") ?
                                                    <IonTextarea rows={4} value={value} onIonChange={(e) => {
                                                        let entity = this.state.entity;
                                                        entity.originalFields[key] = e.target.value;
                                                        this.setState({ togglesEnabled: false }, function() {
                                                            this.setState({
                                                                entity: entity,
                                                                hasChanged: true,
                                                                togglesEnabled: true
                                                            })
                                                        })
                                                    } } placeholder={displayName} type="text"></IonTextarea>
                                                    :
                                                    <IonInput value={value} onIonChange={(e) => {
                                                        let entity = this.state.entity;
                                                        entity.originalFields[key] = e.target.value;
                                                        this.setState({ togglesEnabled: false }, function() {
                                                            this.setState({
                                                                entity: entity,
                                                                hasChanged: true,
                                                                togglesEnabled: true
                                                            })
                                                        })
                                                    } } placeholder={displayName} type="text"></IonInput>
                                                }
                                            </IonItem>
                                        )
                                    }) }
                                    <IonButton style={{ margin: '15px 15px 0 15px' }} expand="block" className="add-btn" onClick={() => {
                                        this.setState({ togglesEnabled: false }, function() { this.setState({ newFieldModal: true, togglesEnabled: true }) })
                                    }}>
                                        <IonIcon slot="start" icon={addCircleOutline} />
                                        Add custom field
                                    </IonButton>
                                </IonList>
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
                                                <IonLabel>{item.label} {(item.field === "categories") && " required"}</IonLabel>
                                            </IonListHeader>
                                            <p style={{ margin: '0 20px', color: '#555' }}>Separate with Enters</p>
                                            <IonItem>
                                                <ReactTags
                                                    className="tag-editor"
                                                    inline
                                                    placeholder={"Enter " + item.field}
                                                    minQueryLength={1}
                                                    tags={this.state.entity.originalFields[item.field] || []}
                                                    handleInputChange={(text) => { this.setState(item.field === "categories" ? { queryCategories: text } : { queryFeatures: text }) }}
                                                    autofocus={false}
                                                    key={item.field + "-tag-editor"}
                                                    handleDelete={(i) => {
                                                        if (!this.state.entity.originalFields[item.field]) {
                                                            return;
                                                        }
                                                        let entity = this.state.entity;
                                                        entity.originalFields[item.field] = entity.originalFields[item.field].filter((tag, index) => index !== i)
                                                        this.setState({ togglesEnabled: false }, function() {
                                                            this.setState({
                                                                entity: entity,
                                                                hasChanged: true,
                                                                togglesEnabled: true
                                                            })
                                                        })
                                                    }}
                                                    handleAddition={(tag) => { this.handleTagAddition(tag, item.field); }}
                                                    delimiters={[188, 13]}
                                                />
                                            </IonItem>
                                            <TagSuggestions
                                                key={item.field + "-tag-suggestions"}
                                                suggestFeatureFrom={ (item.field === "features") ? this.state.entity.originalFields["categories"] : null }
                                                type={item.autosuggest}
                                                query={(item.field === "categories") ? this.state.queryCategories : this.state.queryFeatures}
                                                onSelect={(tag) => {
                                                    this.handleTagAddition({id: tag, text: tag}, item.field);
                                                    // this.setState({
                                                    //     queryCategories: "",
                                                    //     queryFeatures: ""
                                                    // })
                                                }}
                                            />
                                        </section>
                                    )
                                })}
                                <section>
                                    <IonListHeader>
                                        <IonLabel>Location</IonLabel>
                                    </IonListHeader>
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
                                                    data-selected={ this.state.entity.originalFields["___location_type___"] === item.type }
                                                    onClick={() => {
                                                        let entity = this.state.entity;
                                                        entity.originalFields["___location_type___"] = item.type;
                                                        this.setState({ togglesEnabled: false }, function() {
                                                            this.setState({
                                                                entity: entity,
                                                                hasChanged: true,
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
                                    { ((this.state.entity.originalFields["___location_type___"] === "path" || this.state.entity.originalFields["___location_type___"] === "polygon") && this.state.entity.originalFields["___coordinates___"]) &&
                                        <div style={{ margin: '15px 15px 0 15px' }}>
                                            {this.state.entity.originalFields["___coordinates___"].length} coordinates selected.
                                        </div>
                                    }
                                    { (this.state.size === "small") &&
                                        <div>
                                            <IonButton className="add-btn" expand="block" onClick={() => {
                                                let newState = (this.state.entity.originalFields["___location_type___"] === "point") ? { locationPickerModal: true, togglesEnabled: true } : { pathBuilderModal: true, togglesEnabled: true }
                                                this.setState({ togglesEnabled: false }, function() { this.setState(newState) })
                                            }}>{ (this.state.entity.originalFields["___location_type___"] === "point") ? "Select location from map" : "Edit " + this.state.entity.originalFields["___location_type___"] + " on the map" }</IonButton>
                                        </div>
                                    }
                                    <div className="marker-apearance" onClick={() => {
                                        this.setState({ togglesEnabled: false }, function() { this.setState({
                                            markerCustomizerModal: true,
                                            markerCustomizerModalData: this.state.entity.originalFields,
                                            togglesEnabled: true
                                        }) })
                                    }}>
                                        { (this.state.entity.originalFields["___location_type___"] === "point") &&
                                            <div className="marker">
                                                <IonItem>
                                                    <IonLabel position="stacked">Marker Appearance</IonLabel>
                                                </IonItem>
                                                <div className="preview-wrapper" style={{ backgroundImage: `url('${MapPreviewImage}')` }}>
                                                    <div className="marker-custom" data-image={this.state.entity.originalFields["___marker_style___"].image ? "true" : "false"}>
                                                        <div style={{ backgroundColor: this.state.entity.originalFields["___marker_style___"].color || window.globalVars.COLORS.blue }}>
                                                            { (this.state.entity.originalFields["___marker_style___"].image) ?
                                                                <div style={{ width: '100%', height: '100%' }}><img src={this.state.entity.originalFields["___marker_style___"].image} style={{ width: '100%', height: '100%' }} /></div>
                                                                :
                                                                <i className={this.state.entity.originalFields["___marker_style___"].icon} />
                                                            }
                                                        </div>
                                                        <span />
                                                    </div>
                                                </div>
                                            </div>
                                        }
                                        { (this.state.entity.originalFields["___location_type___"] === "path") &&
                                            <div className="path">
                                                <IonItem>
                                                    <IonLabel position="stacked">Path Appearance</IonLabel>
                                                </IonItem>
                                                <div className="preview-wrapper" style={{ backgroundImage: `url('${MapPreviewImage}')` }}>
                                                    <div className="path-custom" style={{ backgroundColor: this.state.entity.originalFields["___path_style___"].borderColor, opacity: this.state.entity.originalFields["___path_style___"].borderOpacity, height: this.state.entity.originalFields["___path_style___"].borderWeight + "px" }} />
                                                </div>
                                            </div>
                                        }
                                        { (this.state.entity.originalFields["___location_type___"] === "polygon") &&
                                            <div className="polygon">
                                                <IonItem>
                                                    <IonLabel position="stacked">Polygon Appearance</IonLabel>
                                                </IonItem>
                                                <div className="preview-wrapper" style={{ backgroundImage: `url('${MapPreviewImage}')` }}>
                                                    <div className="polygon-preview" style={{
                                                        backgroundColor: ("rgba(" + Utilities.hexToRgbA(this.state.entity.originalFields["___polygon_style___"].fillColor) + "," + parseFloat(this.state.entity.originalFields["___polygon_style___"].fillOpacity) + ")"),
                                                        borderColor: ("rgba(" + Utilities.hexToRgbA(this.state.entity.originalFields["___polygon_style___"].borderColor) + "," + parseFloat(this.state.entity.originalFields["___polygon_style___"].borderOpacity) + ")"),
                                                        borderWidth: parseInt(this.state.entity.originalFields["___polygon_style___"].borderWeight) + "px" }}
                                                    />
                                                </div>
                                            </div>
                                        }
                                    </div>
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
                                                    <IonLabel position="stacked">{item.label} <span>required</span></IonLabel>
                                                    <IonInput value={ this.state.entity.originalFields[item.name] || "" } onIonChange={(e) => {
                                                        let entity = this.state.entity;
                                                        entity.originalFields[item.name] = e.target.value;
                                                        this.setState({ togglesEnabled: false }, function() {
                                                            this.setState({
                                                                entity: entity,
                                                                hasChanged: true,
                                                                togglesEnabled: true
                                                            })
                                                        })
                                                    } } placeholder={item.label} type="text"></IonInput>
                                                </IonItem>
                                            )
                                        }) }
                                    </div>
                                </section>
                                <IonItem>
                                    <IonLabel>{ (this.props.match.params.id === "new") ? "Publish on save" : "Published" }</IonLabel>
                                    { (this.state.togglesEnabled) &&
                                        <IonToggle
                                            checked={this.state.entity.isApproved}
                                            onIonChange={(e) => {

                                                let entity = this.state.entity;
                                                entity.isApproved = !entity.isApproved;

                                                this.setState({ togglesEnabled: false }, function() {
                                                    this.setState({
                                                        entity: entity,
                                                        hasChanged: true,
                                                        togglesEnabled: true
                                                    })
                                                })

                                            }}
                                        />
                                    }
                                </IonItem>
                                <p className="licence-disclaimer" onClick={() => { window.open("https://creativecommons.org/share-your-work/public-domain/cc0/") }}>Locations are posted under CC0 licence.</p>
                                <div className="options">
                                    { (this.props.match.params.id !== "new") &&
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
                                    <IonButton className="save-btn" disabled={ (!this.state.hasChanged) } onClick={() => { this.save() }}>Save</IonButton>
                                </div>
                            </div>
                        }
                    </div>
                    { (this.state.size === "big") &&
                        <div className="map">
                            { (this.state.entity && this.state.entity.originalFields && this.state.entity.originalFields["___location_type___"] === "point") &&
                                <LocationPickerModal
                                    open={true}
                                    size="big"
                                    presentingElement={this.pageRef}
                                    onClose={() => { }}
                                    onOpen={() => { }}
                                    preloadCoordinates={this.state.entity ? this.state.entity.originalFields["___coordinates___"] : null}
                                    preloadType={this.state.entity ? this.state.entity.originalFields["___location_type___"] : null}
                                    needAddress={ (this.state.entity) && (this.state.entity.originalFields["___location_type___"] === "point") }
                                    onSave={(coordinates, address) => {

                                        let entity = this.state.entity;

                                        if (coordinates && coordinates.lat) {

                                            if (entity.originalFields["___location_type___"] === "point") {
                                                entity.originalFields["___coordinates___"] = [coordinates]
                                            } else {
                                                entity.originalFields["___coordinates___"].push(coordinates)
                                            }

                                            if (address && (address.streetHouse || address.postcode || address.city || address.country)) {
                                                entity.originalFields["streetHouse"] = address.streetHouse;
                                                entity.originalFields["postcode"] = address.postcode;
                                                entity.originalFields["city"] = address.city;
                                                entity.originalFields["country"] = address.country;
                                            }

                                        }

                                        this.setState({
                                            entity: entity,
                                            hasChanged: true,
                                        })

                                    }}
                                />
                            }
                            { (this.state.entity && this.state.entity.originalFields && this.state.entity.originalFields["___location_type___"] !== "point") &&
                                <PathBuilderModal
                                    open={true}
                                    coordinates={this.state.entity.originalFields["___coordinates___"]}
                                    type={this.state.entity.originalFields["___location_type___"]}
                                    size="big"
                                    presentingElement={this.pageRef}
                                    onClose={() => { }}
                                    onOpen={() => { }}
                                    onSave={(coordinates) => {
                                        let entity = this.state.entity;
                                        entity.originalFields["___coordinates___"] = coordinates;
                                        this.setState({
                                            entity: entity,
                                            hasChanged: true
                                        })
                                    }}
                                />
                            }
                        </div>
                    }
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
                                console.log("Discarding")
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
                <MarkerCustomizerModal
                    open={this.state.markerCustomizerModal}
                    data={this.state.markerCustomizerModalData}
                    source="location-editor"
                    locationEntity={this.state.entity}
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

                        let entity = this.state.entity;

                        this.setState({ togglesEnabled: false }, function() {

                            if (type === "point") {
                                entity.originalFields["___marker_style___"] = style;
                            } else if (type === "path") {
                                entity.originalFields["___path_style___"] = style;
                            } else if (type === "polygon") {
                                entity.originalFields["___polygon_style___"] = style;
                            }

                            this.setState({
                                markerCustomizerModal: false,
                                togglesEnabled: true,
                                entity: entity,
                                hasChanged: true
                            })

                        })

                    }}
                />
                { (this.state.size === "small") &&
                    <LocationPickerModal
                        open={this.state.locationPickerModal}
                        size="small"
                        preloadCoordinates={this.state.entity ? this.state.entity.originalFields["___coordinates___"] : null}
                        preloadType={this.state.entity ? this.state.entity.originalFields["___location_type___"] : null}
                        presentingElement={this.pageRef}
                        onClose={() => { this.setState({ locationPickerModal: false }) }}
                        onOpen={() => { this.setState({ locationPickerModal: true }) }}
                        needAddress={ (this.state.entity) && (this.state.entity.originalFields["___location_type___"] === "point") }
                        onSave={(coordinates, address) => {

                            let entity = this.state.entity;

                            if (coordinates && coordinates.lat) {

                                if (entity.originalFields["___location_type___"] === "point") {
                                    entity.originalFields["___coordinates___"] = [coordinates]
                                } else {
                                    entity.originalFields["___coordinates___"].push(coordinates)
                                }

                                if (address && address.streetHouse) entity.originalFields["streetHouse"] = address.streetHouse;
                                if (address && address.postcode) entity.originalFields["postcode"] = address.postcode;
                                if (address && address.city) entity.originalFields["city"] = address.city;
                                if (address && address.country) entity.originalFields["country"] = address.country;

                            }

                            this.setState({
                                entity: entity,
                                hasChanged: true,
                                locationPickerModal: false,
                            })

                        }}
                    />
                }
                { (this.state.size === "small") &&
                    <PathBuilderModal
                        open={this.state.pathBuilderModal}
                        coordinates={(this.state.entity && this.state.entity.originalFields) ? this.state.entity.originalFields["___coordinates___"] : null }
                        type={(this.state.entity && this.state.entity.originalFields) ? this.state.entity.originalFields["___location_type___"] : null}
                        size="small"
                        presentingElement={this.pageRef}
                        onClose={() => { this.setState({ pathBuilderModal: false }) }}
                        onOpen={() => { this.setState({ pathBuilderModal: true }) }}
                        onSave={(coordinates) => {
                            let entity = this.state.entity;
                            entity.originalFields["___coordinates___"] = coordinates;
                            this.setState({
                                entity: entity,
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
              <IonAlert
                isOpen={this.state.newFieldModal}
                onDidDismiss={async (d) => {

                    let name = (d.detail && d.detail.data) ? d.detail.data.values.name.trim() : ""
                    let entity = this.state.entity;

                    if ( (!name) || (entity.originalFields[name] !== undefined && entity.originalFields[name] !== null) ) {

                        this.setState({ togglesEnabled: false }, function() {
                            this.setState({
                                togglesEnabled: true,
                                newFieldModal: false,
                                minorNotification: (!name ? "Empty field name" : "Field already exists")
                            })
                        })

                    } else {

                        entity.originalFields[name] = "";

                        this.setState({ togglesEnabled: false }, function() {
                            this.setState({
                                minorNotification: "Field Added!",
                                newFieldModal: false,
                                togglesEnabled: true,
                                entity: entity,
                            })
                        })

                    }

                    console.log(name)
                }}
                header={'Enter the name of the field'}
                buttons={[ { text: 'Add', } ]}
                inputs={[
                    {
                      name: 'name',
                      type: 'text',
                      label: 'Name'
                    },
                ]}
            />
            </IonPage>
        );
    }

};

export default withIonLifeCycle(LocationContentEditor);
