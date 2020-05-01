import { IonToggle, IonAlert, IonBackButton, IonButton, IonButtons, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonListHeader, IonLoading, IonNote, IonPage, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToast, IonToolbar, withIonLifeCycle } from '@ionic/react';
import { post } from 'axios';
import { addCircle, checkmark, create, globe, pencil, refreshCircle } from 'ionicons/icons';
import React, { createRef } from 'react';
import { WithContext as ReactTags } from 'react-tag-input';
import CitySelectorModal from '../modals/CitySelector.js';
import EntityListItem from '../modals/EntityListItem.js';
import FieldEditor from '../modals/FieldEditor.js';
import FilterEditor from '../modals/FilterEditor.js';
import FilterSuggestionsModal from '../modals/FilterSuggestionsModal.js';
import SourceEditor from '../modals/SourceEditor.js';
import TagSuggestions from '../modals/TagSuggestions.js';
import Server from '../Server.js';
import Storage from '../Storage.js';
import '../styles/DatasetSchemaEditor.scss';
import Utilities from '../Utilities.js';

const STEPS = [
    "source",
    "fields",
    "details",
    "categories",
    "features",
    "markers",
]

const UPDATE_PERIODS = [
    "manually",
    "every 5 minutes",
    "every 10 minutes",
    "every 15 minutes",
    "every 30 minutes",
    "every 1 hour",
    "every 2 hours",
    "every 4 hours",
    "every 8 hours",
    "daily",
    "weekly",
    "bi-weekly",
    "monthly",
]

class DatasetSchemaEditor extends React.Component {

    constructor(props) {
        super(props)
        this.pageRef = createRef();
        this.state = {
            pendingStep: null,
            step: null,
            source: null,
            sourceURL: null,
            error: null,
            file: null,
            loading: null,
            fieldsArr: null,
            hasChanged: {
                fields: false
            },

            fieldEditorModal: false,
            fieldMappings: [],
            citySelectorModal: false,
            citySelectorModalType: null,

            filterEditorModal: false,
            filterEditModalType: null,
            parsedLocations: {
                errored: []
            },
            errored: [],
            licences: [],
            showSelects: true,
            canEditLicence: true,
            hasChanged: false,
        }
    }

    openSourceOption(source) {

        this.setState({ source: source })

        if (source === "internal") {
            this.setState({ loading: "Creating Dataset" })
            this.createDataset();
        }

    }

    handleDetailChange(key, value) {
        let dataset = this.state.dataset;
        dataset[key] = value;
        this.setState({ dataset: dataset })
        this.setState({ hasChanged: true })
    }

    handleCategoryTagAddition = (tag) => {
        let dataset = this.state.dataset;
        if (!dataset.categories.default) dataset.categories.default = [];
        dataset.categories.default = [...dataset.categories.default, tag]
        this.setState({ dataset: dataset })
        this.setState({ hasChanged: true })
    }

    handleCategoryTagDelete = (i) => {
        let dataset = this.state.dataset;
        dataset.categories.default = dataset.categories.default.filter((tag, index) => index !== i)
        this.setState({ dataset: dataset })
        this.setState({ hasChanged: true })
    }

    handleFeatureTagAddition = (tag) => {
        let dataset = this.state.dataset;
        if (!dataset.features.default) dataset.features.default = [];
        dataset.features.default = [...dataset.features.default, tag]
        this.setState({ dataset: dataset })
        this.setState({ hasChanged: true })
    }

    handleFeatureTagDelete = (i) => {
        let dataset = this.state.dataset;
        dataset.features.default = dataset.features.default.filter((tag, index) => index !== i)
        this.setState({ dataset: dataset })
        this.setState({ hasChanged: true })
    }

    handleChange(key, value) {
        this.setState({
            [key]: value
        })
    }

    postFormat() {

        let dataset = this.state.dataset;

        if (dataset.categories.default && Array.isArray(dataset.categories.default)) {
            dataset.categories.default = dataset.categories.default.map(item => { return { id: item, text: item } })
        }

        if (dataset.features.default && Array.isArray(dataset.features.default)) {
            dataset.features.default = dataset.features.default.map(item => { return { id: item, text: item } })
        }

        this.setState({
            datasets: dataset,
            hasChanged: false
        })
        this.loadStep(this.state.pendingStep);

    }

    getRequests() {

        Server.api({
            method: "get",
            url: "/user/current/request/open",
            then: function(res) {

                this.setState({
                    loading: null,
                    requests: res.data,
                    step: "request"
                }, function() {
                    // this.postFormat();
                })

                console.log("Got requests", res.data);

            }.bind(this),
            catch: function(code, error) {
                this.setState({
                    error: error,
                    loading: null
                })
            }.bind(this)
        })

    }

    getDataset() {

        Server.api({
            method: "get",
            url: "/dataset/" + this.state.id,
            params: {
                source: "schemaeditor",
            },
            then: function(res) {

                res.data.sources = res.data.sources || []

                this.setState({
                    loading: null,
                    dataset: res.data,
                    hasChanged: false,
                }, function() {
                    this.postFormat();
                })

                console.log("Got dataset", res.data);

            }.bind(this),
            catch: function(code, error) {
                this.setState({
                    error: error,
                    loading: null,
                    hasChanged: false,
                })
            }.bind(this)
        })

    }

    createDataset() {

        console.log("Creating dataset");

        Server.api({
            method: "post",
            url: "/dataset",
            data: {},
            then: function(res) {

                // this.setState({
                //     loading: null,
                //     id: res.data.id,
                //     dataset: res.data,
                //     // pendingStep: "fields"
                // }, function() {
                //     // this.postFormat();
                //     this.props.history.push("/dataset/progress/" + res.data.id)
                // })

                this.setState({
                    loading: null
                }, function() {
                    this.props.history.push("/dataset/progress/" + res.data.id)
                })

            }.bind(this),
            catch: function(code, error) {
                console.log(error, code);
                this.setState({
                    error: error,
                    loading: null
                })
            }.bind(this)
        })

    }

    parseDataset(onlyImport) {

        Server.api({
            method: "post",
            url: "/dataset/parse",
            data: {
                url: this.state.sourceURL,
                onlyImport: onlyImport,
            },
            then: function(res) {

                // this.setState({
                //     loading: null,
                //     id: res.data.id,
                //     dataset: res.data,
                //     pendingStep: "fields",
                // }, function() {
                //     this.postFormat();
                // })

                this.setState({
                    loading: null
                }, function() {
                    this.props.history.push("/dataset/progress/" + res.data.id)
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

    async uploadDataset() {

        console.log("Uploading dataset", this.state.file);

        let formData = new FormData();
        formData.append('dataset', this.state.file, this.state.file.name);

        console.log(formData.get("dataset"));

        let authToken = (await Storage.get("authToken")).replace(/\"/g, '');;

        console.log("UPladoing", authToken, formData);

        post(window.globalVars.serverIp + 'a/dataset/upload', formData, {
            headers: {
                'content-type': 'multipart/form-data',
                'Authorization': "Token " + authToken
            }
        }).then(function(res) {

            this.setState({
                loading: null
            }, function() {
                this.props.history.push("/dataset/progress/" + res.data.id)
            })

            // this.setState({
            //     loading: null,
            //     id: response.data.id,
            //     dataset: response.data,
            //     fieldsArr: Object.keys(response.data.fields),
            //     pendingStep: "fields",
            // }, function() {
            //     this.postFormat();
            // })
            //
            // console.log("UPlaoded", response.data)

        }.bind(this)).catch(function(err) {

            let errorMsg = "Failed to upload file.";

            if ( (err) && (err.response) && (err.response.data) && (err.response.data.error) ) {
                errorMsg = err.response.data.error
            }

            this.setState({
                loading: null,
                error: errorMsg
            })

        }.bind(this))

    }

    autosuggestFieldMappings() {

        let fields = this.state.dataset.fields;

        console.log("autosuggestiong", fields);

        const fieldSuggestions = {
            "name": ["name", "place_name", "placename", "place", "buildingname", "building_name", "building", "site_name", "title", "businessname", "business_name"],
            "latitude": ["lat", "latitude"],
            "longitude": ["long", "lng", "longitude"],
            "city": ["city", "town"],
            "country": ["country"],
            "street": ["address", "location", "addr", "loc", "street", "streetname", "street_name"],
            "postcode": ["postcode", "zip", "zipcode", "zip_code", "postal_code", "postalcode"],
            "tel": ["tel", "telephone", "mobile", "telephone_number", "mobile_number", "telno", "mobileno", "phoneno", "phone_number", "tel_number", "tel_no", "mobile_no", "telephonenumber", "phonenumber", "mobilenumber", "contact", "contact_no", "contact_number", "contactno"],
            "website": ["website", "web", "website_addr", "website_address, webaddress", "webpage", "site", "web_site", "link", "weblink"],
            "email": ["email", "email", "email_address", "email_addr", "emailaddress"],
            "description": ["desc", "description"],
        }

        let autoMatchCount = 0;

        for (let fieldKey in fields) {
            let field = fields[fieldKey];
            fields[fieldKey].visibleToUsers = true;
            fields[fieldKey].searchableByUser = true;
            for (let fieldSuggestionKey in fieldSuggestions) {
                let fieldSuggestion = fieldSuggestions[fieldSuggestionKey];
                if (field.type !== "default") {
                    // console.log(field, fieldSuggestion);
                    if (fieldSuggestion.indexOf(fieldKey.toLowerCase()) > -1) {
                        console.log(fieldSuggestionKey + " is matched for " + fieldKey);
                        fields[fieldKey].type = [fieldSuggestionKey];
                        autoMatchCount++;
                    }
                }
            }
        }

        if (autoMatchCount !== 0) {
            let dataset = this.state.dataset;
            console.log(fields, "===AAAA=====");
            dataset.fields = fields;
            this.setState({
                dataset: dataset,
                fields: fields,
                autoMatchCount: autoMatchCount
            })
        }

    }

    loadStep(step) {

        console.log("Loading: " + step);

        switch (step) {

            case "details":

                console.log("PREPARING FIELDS");

                if (this.state.dataset.name) {
                    this.setState({ canEditLicence: false })
                }

                break;

            case "fields":

                let fieldNames = this.state.dataset.fields;
                let alreadyInited = false;

                for (let key in fieldNames) {
                    let field = fieldNames[key];
                    if ( (field.type) && (field.type !== "default") && (field.type.length !== 0) ) {
                        alreadyInited = true;
                    }
                }

                console.log("===== ALREADY INTIEd? " + alreadyInited);

                if (!alreadyInited) {
                    this.autosuggestFieldMappings();
                }

                let fieldMappings = [];

                fieldMappings = [
                    {
                        displayName: "Name",
                        name: "name",
                        description: "Required, can be the name of the location, street or business"
                    },
                    {
                        displayName: "Description",
                        name: "description",
                        description: "Description of the location"
                    },
                    {
                        displayName: "Website",
                        name: "website",
                        description: "Website of the location, street or business"
                    },
                    {
                        displayName: "Telephone Number",
                        name: "tel",
                        description: "Telephone number of the location, street or business"
                    },
                    {
                        displayName: "Email address",
                        name: "email",
                        description: "Email address of the location, street or business"
                    },
                    {
                        displayName: "Street, House No.",
                        name: "street",
                        description: "Select the street address and house number fields.",
                        multiple: true,
                    },
                    {
                        displayName: "Postcode",
                        name: "postcode",
                        description: "Postcode",
                        multiple: true,
                    },
                    {
                        displayName: "City",
                        name: "city",
                        description: "Select the field that contains the city of the entity, if left empty the city will be geocoded from the given coordinates or the default city will be used"
                    },
                    {
                        name: "___DEFAULT_CITY___",
                        default: "Pick city",
                        displayName: "Set default city",
                        description: "Only set a default city if all locations contained are in this city"
                    },
                    {
                        displayName: "Country",
                        name: "country",
                        description: "Select the field that contains the country of the entity, if left empty the country will be geocoded from the given coordinates or the default country will be used"
                    },
                    {
                        name: "___DEFAULT_COUNTRY___",
                        default: "Pick country",
                        displayName: "Set default country",
                        description: "Only set a default country if all locations contained are in this country"
                    }
                ]

                if (["csv", "json", "xml", "xlsx"].indexOf(this.state.dataset.format) > -1) {
                    fieldMappings.splice(2, 0, {
                        displayName: "Latitude",
                        name: "latitude",
                        description: "If your dataset contains both the latitude and longitude in the same field then select that field for both latitude and longitude",
                        multiple: false,
                    }, {
                        displayName: "Longitude",
                        name: "longitude",
                        description: "If your dataset contains both the latitude and longitude in the same field then select that field for both latitude and longitude",
                        multiple: false,
                    })
                }

                if (this.state.dataset.type === "external") {
                    fieldMappings.push({
                        displayName: "Unique Id",
                        name: "uniqueId",
                        multiple: true,
                        description: "Select one or more fields to form an id for each location that is unique inside this dataset. This cannot be changed later."
                    },)
                }

                this.setState({
                    // fieldsArr: Object.keys(this.state.dataset.fields),
                    fieldMappings: fieldMappings
                })

            break;

            default:

        }

        this.setState({
            fieldsArr: Object.keys(this.state.dataset.fields),
            step: step
        })

        let id;

        if (this.props.match.params.id !== "new") {
            id = this.props.match.params.id
        } else {
            id = this.state.dataset.id;
        }

    }

    nextStep() {

        let currentStep = this.state.step;

        switch (currentStep) {

            case "source":

                let source = this.state.source;
                let loadingMsg = "Please wait..."

                console.log(source);

                if (source === "internal") {

                    this.createDataset();
                    loadingMsg = "Creating dataset"

                } else if ( (source === "url") || (source === "urlFile") ) {

                    if (!this.state.sourceURL) {
                        this.setState({
                            error: "Enter the URL to the dataset",
                            loading: null
                        })
                        return;
                    }

                    this.parseDataset(source === "urlFile" ? true : false);

                    loadingMsg = "Parsing File"

                } else if (source === "file") {

                    if (!this.state.file) {
                        this.setState({
                            error: "Select a file to upload",
                            loading: null
                        })
                        return;
                    }

                    this.uploadDataset();

                    loadingMsg = "Uploading File"

                } else {

                    this.setState({
                        error: "Select an option",
                        loading: null
                    })
                    return;

                }

                this.setState({
                    loading: loadingMsg
                })

                break;

            case "fields":
                this.postFieldsToServer();
                break;

            case "details":
                this.postDetailsToServer();
                break;

            case "categories":
                this.postCategoriesToServer();
                break;

            case "features":
                this.postFeaturesToServer();
                break;

            case "markers":
                this.postMarkersToServer();
                break;

            case "paths":
                this.postPathsToServer();
                break;

            case "polygons":
                this.postPolygonsToServer();
                break;

            case "sources":
                this.postSourcesToServer();
                break;

            case "geocoding":
                this.postGeocodingToServer();
                break;

            default:
                console.log("Unknown step")
                break;

        }

    }

    async ionViewWillEnter() {

        let step = this.props.match.params.section
        let id = this.props.match.params.id

        if (id === "new") {

            this.setState({
                step: step,
                id: id,
                hasChanged: false,
            })

        } else {

            this.setState({
                pendingStep: step,
                id: id,
                loading: "Getting dataset",
                hasChanged: false,
            }, function() {
                if (step === "request") {
                    this.getRequests();
                } else if (step === "errored") {
                    this.getErrored();
                } else {
                    this.getDataset();
                }
            })

        }

        this.setState({ topics: await Storage.getO("topics") })
        this.setState({ licences: await Storage.getO("licences") })

        console.log("Opened editor " + id + ", " + step);

    }

    async getErrored() {

        let errored = await Storage.getO("errored-parses");
        console.log("Loading errored", errored);

        if (!errored || parseInt(errored.id) !== parseInt(this.props.match.params.id)) {
            console.log("THis is not the right errored or not foudn");
            setTimeout(function() {
                window.location.reload();
            }, 5000);
            return;
        }

        this.setState({
            errored: errored.data,
            loading: null,
            step: "errored"
        })

    }

    postFieldsToServer() {

        // console.log(this.props.history, );

        this.setState({
            loading: "Validating field mapping"
        })

        Server.api({
            method: "put",
            url: "/dataset/" + this.state.id + "/fields",
            data: this.state.dataset.fields,
            then: function(res) {
                console.log("======Pushed fields", res);

                this.setState({
                    loading: null,
                    hasChanged: false,
                }, function() {
                    window.globalVars.datasetHasChanged = false;
                    this.props.history.goBack()
                })
                // this.loadStep("details");

            }.bind(this),
            catch: function(code, error) {
                console.log("Error pushing fields", error, code);
                this.setState({
                    error: error,
                    loading: null
                })
            }.bind(this)
        })

    }

    requestParsing() {

        this.setState({
            loading: "Parsing Dataset"
        })

        Server.api({
            method: "put",
            url: "/dataset/" + this.state.id + "/parse",
            then: function(res) {
                console.log("======Requested parse features", res);
                this.setState({
                    loading: null,
                })
            }.bind(this),
            catch: function(code, error) {
                console.log("Error requesting parse", error, code);
                this.setState({
                    error: error,
                    loading: null
                })
            }.bind(this)
        })

    }

    postPathsToServer() {

        this.setState({
            loading: "Saving paths"
        })

        Server.api({
            method: "put",
            url: "/dataset/" + this.state.id + "/paths",
            data: this.state.dataset.paths,
            then: function(res) {
                console.log("======Pushed markers", res);
                this.setState({
                    loading: null,
                    hasChanged: false
                })
                window.globalVars.datasetHasChanged = false;
                this.props.history.goBack();
            }.bind(this),
            catch: function(code, error) {
                console.log("Error pushing markers", error, code);
                this.setState({
                    error: error,
                    loading: null
                })
            }.bind(this)
        })

    }

    postPolygonsToServer() {

        this.setState({
            loading: "Saving polygons"
        })

        Server.api({
            method: "put",
            url: "/dataset/" + this.state.id + "/polygons",
            data: this.state.dataset.polygons,
            then: function(res) {
                console.log("======Pushed markers", res);
                this.setState({
                    loading: null,
                    hasChanged: false,
                })
                window.globalVars.datasetHasChanged = false;
                this.props.history.goBack();
            }.bind(this),
            catch: function(code, error) {
                console.log("Error pushing markers", error, code);
                this.setState({
                    error: error,
                    loading: null
                })
            }.bind(this)
        })

    }

    postGeocodingToServer() {

        Server.api({
            method: "put",
            url: "/dataset/" + this.state.id + "/geocoding",
            data: {
                noGeocode: this.state.dataset.noGeocode,
                noReverseGeocode: this.state.dataset.noReverseGeocode,
                acceptNoAddress: this.state.dataset.acceptNoAddress
            },
            then: function(res) {
                console.log("======Pushed geocode", res);
                this.setState({
                    loading: null,
                    hasChanged: false,
                })
                window.globalVars.datasetHasChanged = false;
                this.props.history.goBack();
            }.bind(this),
            catch: function(code, error) {
                console.log("Error pushing geocode", error, code);
                this.setState({
                    error: error,
                    loading: null
                })
            }.bind(this)
        })

    }

    postSourcesToServer() {

        this.setState({
            loading: "Saving polygons"
        })

        Server.api({
            method: "put",
            url: "/dataset/" + this.state.id + "/sources",
            data: this.state.dataset.sources,
            then: function(res) {
                console.log("======Pushed markers", res);
                this.setState({
                    loading: null,
                    hasChanged: false
                })
                window.globalVars.datasetHasChanged = false;
                this.props.history.goBack();
            }.bind(this),
            catch: function(code, error) {
                console.log("Error pushing markers", error, code);
                this.setState({
                    error: error,
                    loading: null
                })
            }.bind(this)
        })

    }

    postMarkersToServer() {

        this.setState({
            loading: "Saving markers"
        })

        Server.api({
            method: "put",
            url: "/dataset/" + this.state.id + "/markers",
            data: this.state.dataset.markers,
            then: function(res) {
                console.log("======Pushed markers", res);
                this.setState({
                    loading: null,
                    hasChanged: false
                })
                window.globalVars.datasetHasChanged = false;
                this.props.history.goBack();
            }.bind(this),
            catch: function(code, error) {
                console.log("Error pushing markers", error, code);
                this.setState({
                    error: error,
                    loading: null
                })
            }.bind(this)
        })

    }

    postFeaturesToServer() {

        this.setState({
            loading: "Saving features"
        })

        Server.api({
            method: "put",
            url: "/dataset/" + this.state.id + "/features",
            data: this.state.dataset.features,
            then: function(res) {
                console.log("======Pushed features", res);
                this.setState({
                    loading: null,
                    hasChanged: false,
                })
                window.globalVars.datasetHasChanged = false;
                this.props.history.goBack();
            }.bind(this),
            catch: function(code, error) {
                console.log("Error pushing features", error, code);
                this.setState({
                    error: error,
                    loading: null
                })
            }.bind(this)
        })

    }

    postCategoriesToServer() {

        this.setState({
            loading: "Saving categories"
        })

        Server.api({
            method: "put",
            url: "/dataset/" + this.state.id + "/categories",
            data: this.state.dataset.categories,
            then: function(res) {
                console.log("======Pushed cats", res);
                this.setState({
                    loading: null,
                    hasChanged: false,
                })
                window.globalVars.datasetHasChanged = false;
                this.props.history.goBack();
            }.bind(this),
            catch: function(code, error) {
                console.log("Error pushing cats", error, code);
                this.setState({
                    error: error,
                    loading: null
                })
            }.bind(this)
        })

    }

    postDetailsToServer() {

        this.setState({
            loading: "Saving details"
        })

        Server.api({
            method: "put",
            url: "/dataset/" + this.state.id + "/details",
            data: {
                description: this.state.dataset.description,
                maintainerName: this.state.dataset.maintainerName,
                maintainerEmail: this.state.dataset.maintainerEmail,
                name: this.state.dataset.name,
                topicId: this.state.dataset.topicId,
                licenceId: this.state.dataset.licenceId,
                updateFrequency: this.state.dataset.updateFrequency,
            },
            then: function(res) {
                console.log("======Pushed details", res);
                this.setState({
                    loading: null,
                    hasChanged: false,
                })
                window.globalVars.datasetHasChanged = false;
                this.props.history.goBack();
            }.bind(this),
            catch: function(code, error) {
                console.log("Error pushing details", error, code);
                this.setState({
                    error: error,
                    loading: null
                })
            }.bind(this)
        })

    }

    handleMappingChange(category, fieldNames) {

        if (fieldNames === "___ignore___") {
            console.log("Ignoring")
            return;
        }

        if (!Array.isArray(fieldNames)) {
            fieldNames = [fieldNames];
        }

        let fields = this.state.dataset.fields;

        for (let i = 0; i < this.state.fieldsArr.length; i++) {
            let fieldName = this.state.fieldsArr[i];
            let field = fields[fieldName];
            if (field.type.indexOf(category) > -1) {
                field.type.splice(field.type.indexOf(category), 1);
            }
        }

        for (let i = 0; i < fieldNames.length; i++) {

            let field = fields[fieldNames[i]];
            if (fields[fieldNames[i]] !== undefined)
                fields[fieldNames[i]].type.push(category);

        }

        this.setState({
            showSelects: false,
            hasChanged: true
        }, function() {
            this.setState(prevState => ({
                dataset: {
                    ...prevState.dataset,
                    fields: fields
                },
                showSelects: true
            }))
        })

    }

    editField(key) {
        this.setState({
            fieldEditorModal: true,
            fieldBeingEditedKey: key,
            fieldBeingEdited: this.state.dataset.fields[key]
        })
    }

    editSource(i) {
        this.setState({
            sourceEditorModal: true,
            sourceBeingEdited: this.state.dataset.sources[i],
            sourceBeingEditedI: i,
        })
    }

    createSource() {
        this.setState({
            sourceEditorModal: true,
            sourceBeingEdited: {},
            sourceBeingEditedI: this.state.dataset.sources.length,
            hasChanged: true
        })
    }

    updateSource(i, obj) {
        let dataset = this.state.dataset;
        dataset.sources[i] = obj
        this.setState({
            dataset: dataset,
            hasChanged: true
        })
    }

    removeSource(i) {
        let dataset = this.state.dataset;
        delete dataset.sources[i];
        this.setState({
            dataset: dataset,
            hasChanged: true
        })
    }

    createField() {
        this.setState({ fieldEditorModal: true, })
    }

    updateField(key, obj) {
        console.log("Updated field received", key, obj);
        let fields = this.state.dataset.fields
        fields[key] = obj;
        this.setState({
            fields: fields, fieldsArr: Object.keys(fields),
            hasChanged: true
        })
    }

    createPathFilter() {
        this.setState({
            filterEditorModal: true,
            filterEditModalType: "path",
            hasChanged: true
        })
    }

    createPolygonFilter() {
        this.setState({
            filterEditorModal: true,
            filterEditModalType: "polygon",
            hasChanged: true
        })
    }

    createMarkerFilter() {
        this.setState({
            filterEditorModal: true,
            filterEditModalType: "point",
            hasChanged: true
        })
    }

    editMarkerFilter(key) {
        this.setState({
            filterEditorModal: true,
            filterBeingEditedKey: key,
            filterBeingEdited: this.state.dataset.markers[key],
            filterEditModalType: "point"
        })
    }

    editPolygonFilter(key) {
        this.setState({
            filterEditorModal: true,
            filterBeingEditedKey: key,
            filterBeingEdited: this.state.dataset.polygons[key],
            filterEditModalType: "polygon"
        })
    }

    editPathFilter(key) {
        this.setState({
            filterEditorModal: true,
            filterBeingEditedKey: key,
            filterBeingEdited: this.state.dataset.paths[key],
            filterEditModalType: "path"
        })
    }

    editCategoryFilter(key) {
        this.setState({
            filterEditorModal: true,
            filterBeingEditedKey: key,
            filterBeingEdited: this.state.dataset.categories.filterRules[key],
            filterEditModalType: "category"
        })
    }

    editFeatureFilter(key) {
        this.setState({
            filterEditorModal: true,
            filterBeingEditedKey: key,
            filterBeingEdited: this.state.dataset.features.filterRules[key],
            filterEditModalType: "feature"
        })
    }

    createCategoryFilter() {
        this.setState({
            filterEditorModal: true,
            filterEditModalType: "category",
            hasChanged: true
        })
    }

    createFeatureFilter() {
        this.setState({
            filterEditorModal: true,
            filterEditModalType: "feature",
            hasChanged: true
        })
    }

    deleteFilter(key) {

        console.log("Deleting: " + key);

        if (this.state.filterEditModalType === "feature") {

            let dataset = this.state.dataset
            delete dataset.features.filterRules[key];
            this.setState({ dataset: dataset })

        } else if (this.state.filterEditModalType === "category") {

            let dataset = this.state.dataset
            delete dataset.categories.filterRules[key];
            this.setState({ dataset: dataset })

        } else if (this.state.filterEditModalType === "point") {

            let dataset = this.state.dataset
            delete dataset.markers[key];
            this.setState({ dataset: dataset })

        }

        this.setState({ hasChanged: true })

    }

    updateFilter(key, name, obj, color, icon, sql, borderColor, borderWeight, borderOpacity, fillColor, fillOpacity, image) {

        if (!key) {
            key = Utilities.randomStr(8);
        }

        console.log("Updated filter", key, name, obj);

        if (this.state.filterEditModalType === "feature") {

            let dataset = this.state.dataset
            dataset.features.filterRules[key] = {
                name: name,
                query: obj,
                sql: sql
            };
            this.setState({ dataset: dataset })

        } else if (this.state.filterEditModalType === "category") {

            let dataset = this.state.dataset
            dataset.categories.filterRules[key] = {
                name: name,
                query: obj,
                sql: sql
            };
            this.setState({ dataset: dataset })

        } else if (this.state.filterEditModalType === "point") {

            let dataset = this.state.dataset
            dataset.markers[key] = {
                name: name,
                query: obj,
                color: color,
                icon: icon,
                sql: sql,
                image: image
            };
            this.setState({ dataset: dataset })

        } else if (this.state.filterEditModalType === "path") {

            let dataset = this.state.dataset
            dataset.paths[key] = {
                name: name,
                query: obj,
                color: color,
                icon: icon,
                sql: sql,
                borderColor: borderColor,
                borderWeight: borderWeight,
                borderOpacity: borderOpacity
            };
            this.setState({ dataset: dataset })

        } else if (this.state.filterEditModalType === "polygon") {

            let dataset = this.state.dataset
            dataset.polygons[key] = {
                name: name,
                query: obj,
                color: color,
                icon: icon,
                sql: sql,
                borderColor: borderColor,
                borderWeight: borderWeight,
                borderOpacity: borderOpacity,
                fillColor: fillColor,
                fillOpacity: fillOpacity,
            };
            this.setState({ dataset: dataset })

        }

        this.setState({ hasChanged: true })
        this.setState({ filterEditorModal: false })

    }

    handleCategoryChange(key, value) {
        console.log(key, value);
        let categories = this.state.dataset.categories
        categories[key] = value;
        this.setState({
            categories: categories,
            hasChanged: true,
        })
    }

    getSelectedFieldMappings(item) {
        let matchedFields = [];
        for (let i = 0; i < this.state.fieldsArr.length; i++) {
            let field = this.state.fieldsArr[i];
            Object.keys(this.state.dataset.fields).map((key, i) => {
                if ( (key === field) && (this.state.dataset.fields[key].type !== "default") && (this.state.dataset.fields[key].type.indexOf(item.name) > -1) ) {
                    matchedFields.push(field)
                }
            })
        }
        return [...new Set(JSON.parse(JSON.stringify(matchedFields)))]
    }

    updateLocation(type, id, name) {

        console.log("updateing location", type, id, name);

        let dataset = this.state.dataset;

        if (type === "city") {
            dataset.fields["___DEFAULT_CITY___"].name = name;
            dataset.fields["___DEFAULT_CITY___"].id = id;
        } else if (type === "country") {
            dataset.fields["___DEFAULT_COUNTRY___"].name = name;
            dataset.fields["___DEFAULT_COUNTRY___"].id = id;
        }

        this.setState({
            dataset: dataset,
            hasChanged: true,
        })


    }

    associateRequest(id) {

        console.log("Savng request to dataset", id)

        Server.api({
            method: "put",
            url: "/dataset/" + this.props.match.params.id + "/request",
            data: { id: id },
            then: function(res) {
                console.log("ASSOCIATED");
                this.setState({ loading: null, })
                window.globalVars.datasetHasChanged = false;
                this.props.history.goBack();
            }.bind(this),
            catch: function(code, error) {
                this.setState({
                    error: error,
                    loading: null
                })
            }.bind(this)
        })

    }

    postDataset() {

        console.log("Posting dataset");

        Server.api({
            method: "put",
            url: "/dataset/" + this.props.match.params.id + "/publish",
            data: {},
            then: function(res) {
                console.log("dataset published");
                this.props.history.push("/profile");
            }.bind(this),
            catch: function(code, error) {
                this.setState({
                    error: error,
                    loading: null
                })
            }.bind(this)
        })

    }

    componentWillUnmount() {
        clearInterval(this.hasChangedInterval);
        window.globalVars.datasetHasChanged = false;
    }

    componentDidMount() {
        this.hasChangedInterval = setInterval(function() { window.globalVars.datasetHasChanged = this.state.hasChanged }.bind(this), 200);
    }

    render() {
        return (
            <IonPage data-page="dataset-schema-editor" ref={this.pageRef}>
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonBackButton onClick={() => {
                                if (this.state.hasChanged) {
                                    this.setState({ hasChangedAlert: true })
                                } else {
                                    this.props.history.goBack();
                                }
                            }} />
                        </IonButtons>
                        <IonTitle>
                            { this.state.step === "source" && "Select Source" }
                            { this.state.step === "fields" && "Dataset Fields" }
                            { this.state.step === "details" && "Dataset Details" }
                            { this.state.step === "categories" && "Categories" }
                            { this.state.step === "features" && "Features" }
                            { this.state.step === "markers" && "Markers" }
                            { this.state.step === "paths" && "Paths" }
                            { this.state.step === "sources" && "File Sources" }
                            { this.state.step === "polygons" && "Polygons" }
                            { this.state.step === "request" && "Request" }
                            { this.state.step === "errored" && "Errored Parses" }
                        </IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <div className="steps-container">
                        <div className="steps">
                            { (this.state.step === "source") &&
                                <div className="step" data-step="source">
                                    <IonList>
                                        <IonItem onClick={() => { this.openSourceOption("url") }}>
                                            <IonLabel className="ion-text-wrap dataset-type-description">
                                                <h2>
                                                    Keep updated from URL
                                                    <span>Recommended</span>
                                                </h2>
                                                <div>
                                                    <div>
                                                        <IonIcon icon={globe} />
                                                        <label>Hosted by you</label>
                                                    </div>
                                                    <div>
                                                        <IonIcon icon={pencil} />
                                                        <label>Not editable from the ODM</label>
                                                    </div>
                                                    <div>
                                                        <IonIcon icon={refreshCircle} />
                                                        <label>Updates periodically checked</label>
                                                    </div>
                                                    { (this.state.source === "url") &&
                                                        <IonItem lines="none" class="ion-no-margin ion-no-padding">
                                                            {/*<IonLabel position="stacked">URL</IonLabel>*/}
                                                            <IonInput onIonChange={(e) => {this.handleChange("sourceURL", e.target.value)}} placeholder="Enter the URL of the file" type="text"></IonInput>
                                                        </IonItem>
                                                    }
                                                </div>
                                            </IonLabel>
                                        </IonItem>
                                        <IonItem onClick={() => { this.openSourceOption("internal") }}>
                                            <IonLabel className="ion-text-wrap dataset-type-description">
                                                <h2>New hosted dataset</h2>
                                                <div>
                                                    <div>
                                                        <IonIcon icon={globe} />
                                                        <label>Hosted by the ODM</label>
                                                    </div>
                                                    <div>
                                                        <IonIcon icon={pencil} />
                                                        <label>Editable from the ODM</label>
                                                    </div>
                                                    <div>
                                                        <IonIcon icon={refreshCircle} />
                                                        <label>Changes updated immediately</label>
                                                    </div>
                                                </div>
                                            </IonLabel>
                                        </IonItem>
                                        <IonItem onClick={() => { this.openSourceOption("urlFile") }}>
                                            <IonLabel className="ion-text-wrap dataset-type-description">
                                                <h2>Import from URL</h2>
                                                <div>
                                                    <div>
                                                        <IonIcon icon={globe} />
                                                        <label>Hosted by the ODM</label>
                                                    </div>
                                                    <div>
                                                        <IonIcon icon={create} />
                                                        <label>Editable from the ODM</label>
                                                    </div>
                                                    <div>
                                                        <IonIcon icon={refreshCircle} />
                                                        <label>Changes updated immediately</label>
                                                    </div>
                                                    { (this.state.source === "urlFile") &&
                                                        <IonItem lines="none" class="ion-no-margin ion-no-padding">
                                                            <IonInput onIonChange={(e) => {this.handleChange("sourceURL", e.target.value)}} placeholder="Enter the URL of the file" type="text"></IonInput>
                                                        </IonItem>
                                                    }
                                                </div>
                                            </IonLabel>
                                        </IonItem>
                                        <IonItem onClick={() => { this.openSourceOption("file") }}>
                                            <IonLabel className="ion-text-wrap dataset-type-description">
                                                <h2>Upload file</h2>
                                                <div>
                                                    <div>
                                                        <IonIcon icon={globe} />
                                                        <label>Hosted by the ODM</label>
                                                    </div>
                                                    <div>
                                                        <IonIcon icon={create} />
                                                        <label>Editable from the ODM</label>
                                                    </div>
                                                    <div>
                                                        <IonIcon icon={refreshCircle} />
                                                        <label>Changes updated immediately</label>
                                                    </div>
                                                </div>
                                                { (this.state.source === "file") &&
                                                    <div>
                                                        <input color="primary" id="file-upload-input" onChange={(e) => {this.handleChange("file", e.target.files[0])}} placeholder="Upload file" type="file" />
                                                        <p>Supported files: CSV, XML, CSV, XLSX, KML, KMX, SHP, JSON, GeoJSON. Up to 100MB</p>
                                                    </div>
                                                }
                                            </IonLabel>
                                        </IonItem>
                                    </IonList>
                                </div>
                            }
                            { (this.state.step === "details") &&
                                <div className="step" data-step="details">
                                    <IonListHeader>Dataset Details</IonListHeader>
                                    <IonList>
                                        <IonItem>
                                            <IonLabel position="stacked">Name <span>required</span></IonLabel>
                                            <IonInput value={this.state.dataset.name} onIonChange={(e) => {this.handleDetailChange("name", e.target.value)}} placeholder="Name of the dataset" type="text"></IonInput>
                                        </IonItem>
                                        <IonItem>
                                            <IonLabel position="stacked">Description <span>required</span></IonLabel>
                                            <IonTextarea rows={5} value={this.state.dataset.description} onIonChange={(e) => {this.handleDetailChange("description", e.target.value)}} placeholder="Details of the dataset" type="text"></IonTextarea>
                                        </IonItem>
                                        <IonItem>
                                            <IonLabel position="stacked">Maintainer Name</IonLabel>
                                            <IonInput value={this.state.dataset.maintainerName} onIonChange={(e) => {this.handleDetailChange("maintainerName", e.target.value)}} placeholder="Name of the maintianer" type="text"></IonInput>
                                        </IonItem>
                                        <p>Only fill out if this is different from your account.</p>
                                        <IonItem>
                                            <IonLabel position="stacked">Maintainer Email</IonLabel>
                                            <IonInput value={this.state.dataset.maintainerEmail} onIonChange={(e) => {this.handleDetailChange("maintainerEmail", e.target.value)}} placeholder="Email of the maintianer" type="text"></IonInput>
                                        </IonItem>
                                        { (this.state.dataset.type === "external") &&
                                            <IonItem>
                                                <IonLabel position="stacked">Update period</IonLabel>
                                                <IonSelect value={this.state.dataset.updateFrequency} multiple={false} okText="Save" onIonChange={(e) => {this.handleDetailChange("updateFrequency", e.target.value)}}>
                                                    { UPDATE_PERIODS.map(period => {
                                                        return <IonSelectOption key={period} value={period}>{period}</IonSelectOption>
                                                    }) }
                                                </IonSelect>
                                            </IonItem>
                                        }
                                        <IonItem>
                                            <IonLabel position="stacked">Topic</IonLabel>
                                            <IonSelect value={this.state.dataset.topicId} multiple={false} okText="Save" onIonChange={(e) => {this.handleDetailChange("topicId", e.target.value)}}>
                                                { this.state.topics.map(topic => {
                                                    return <IonSelectOption key={topic.id} value={topic.id}>{topic.name}</IonSelectOption>
                                                }) }
                                            </IonSelect>
                                        </IonItem>
                                        <IonItem>
                                            <IonLabel position="stacked">Licence Type <span>required, can only be set once</span></IonLabel>
                                            <IonSelect disabled={!this.state.canEditLicence} value={this.state.dataset.licenceId} multiple={false} okText="Save" onIonChange={(e) => {this.handleDetailChange("licenceId", e.target.value)}}>
                                                { this.state.licences.map(licence => {
                                                    return <IonSelectOption key={licence.name} value={licence.id}>{licence.name}</IonSelectOption>
                                                }) }
                                            </IonSelect>
                                        </IonItem>
                                    </IonList>
                                </div>
                            }
                            { (this.state.step === "categories") &&
                                <div className="step" data-step="categories">
                                    <IonListHeader>Default Categories</IonListHeader>
                                    <p>Choose single category if this dataset only contains one entity (e.g. Museums)</p>
                                    <IonList style={{ marginBottom: 15 }}>
                                        <IonItem>
                                            <IonLabel position="stacked">Default Categories</IonLabel>
                                            <ReactTags
                                                className="tag-editor"
                                                inline
                                                placeholder="New category"
                                                handleInputChange={(text) => { this.setState({ query: text }) }}
                                                minQueryLength={1}
                                                tags={this.state.dataset.categories.default || []}
                                                autofocus={false}
                                                handleDelete={this.handleCategoryTagDelete}
                                                handleAddition={this.handleCategoryTagAddition}
                                                delimiters={[188, 13]}
                                            />
                                            <TagSuggestions type="category" query={this.state.query} onSelect={(tag) => { this.handleCategoryTagAddition({id: tag, text: tag}); }} />
                                        </IonItem>
                                        <IonItem>
                                            <IonLabel>Add default category</IonLabel>
                                            <IonSelect value={this.state.dataset.categories.includeDefault} interface="action-sheet" multiple={false} okText="Save" onIonChange={(e) => {this.handleCategoryChange("includeDefault", e.target.value)}}>
                                                <IonSelectOption value="all">For all</IonSelectOption>
                                                <IonSelectOption value="match">Only if no condition-based match</IonSelectOption>
                                            </IonSelect>
                                        </IonItem>
                                    </IonList>
                                    <IonListHeader>
                                        <IonLabel>Condition-based categories</IonLabel>
                                        <IonButton color="dark" onClick={() => { this.createCategoryFilter() }}>
                                            <IonIcon icon={addCircle}></IonIcon>
                                        </IonButton>
                                    </IonListHeader>
                                    <p>Here you can set up conditions so some categories are only matched to the desired locations (e.g. if name field contains "museum" then add category "museum" to the location)</p>
                                    { (this.state.dataset && this.state.dataset.repeatingValues && this.state.dataset.repeatingValues.length !== 0) &&
                                        <IonButton style={{ margin: 15 }} color="dark" fill="outline" expand="block" onClick={() => { this.setState({ filterSuggestionsModal: true }) }}>Suggestions {this.state.dataset.repeatingValues.length}</IonButton>
                                    }
                                    <div className="filters">
                                        <IonList style={{ marginBottom: 15 }}>
                                            { (Object.keys(this.state.dataset.categories.filterRules).map(key => {
                                                let filterRule = this.state.dataset.categories.filterRules[key];
                                                return (
                                                    <IonItem key={key}>
                                                        <IonLabel class="ion-text-wrap">
                                                            <h2>{filterRule.name}</h2>
                                                            {filterRule.sql && <p>{filterRule.sql}</p> }
                                                        </IonLabel>
                                                        <IonIcon onClick={ () => { this.editCategoryFilter(key) } } icon={create} slot="end" />
                                                    </IonItem>
                                                )
                                            })) }
                                        </IonList>
                                    </div>
                                </div>
                            }
                            { (this.state.step === "markers") &&
                                <div className="step" data-step="markers">
                                    <IonListHeader>Customize Markers</IonListHeader>
                                    <p>Here you can set up conditions so some locations will have a distinct look that helps understanding the type of location</p>
                                    <div className="markers">
                                        <IonList style={{ marginBottom: 15 }}>
                                            { (Object.keys(this.state.dataset.markers).map(key => {
                                                let marker = this.state.dataset.markers[key];
                                                return (
                                                    <IonItem key={key} onClick={ () => { this.editMarkerFilter(key) } }>
                                                        <IonLabel class="ion-text-wrap">
                                                            <h2>{marker.name}</h2>
                                                            {marker.sql && <p>{marker.sql}</p> }
                                                        </IonLabel>
                                                        <div class="marker-custom" data-image={marker.image ? "true" : "false"}>
                                                            <div style={{ backgroundColor: marker.color || window.globalVars.COLORS.blue }}>
                                                                { (marker.image) ?
                                                                    <div style={{ width: '100%', height: '100%' }}><img src={marker.image} style={{ width: '100%', height: '100%' }} /></div>
                                                                    :
                                                                    <i className={marker.icon} />
                                                                }
                                                            </div>
                                                            <span />
                                                        </div>
                                                    </IonItem>
                                                )
                                            })) }
                                        </IonList>
                                        { (this.state.dataset && this.state.dataset.repeatingValues && this.state.dataset.repeatingValues.length !== 0) &&
                                            <IonButton style={{ margin: 15 }} color="dark" fill="outline" expand="block" onClick={() => { this.setState({ filterSuggestionsModal: true }) }}>Suggestions {this.state.dataset.repeatingValues.length}</IonButton>
                                        }
                                        <IonButton color="primary" className="create-btn" expand="block" onClick={() => { this.createMarkerFilter() }}>
                                            Add new marker
                                        </IonButton>
                                    </div>
                                </div>
                            }
                            { (this.state.step === "paths") &&
                                <div className="step" data-step="markers">
                                    <IonListHeader>Customize Paths</IonListHeader>
                                    <p>Here you can set up conditions so some locations will have a distinct look that helps understanding the type of location</p>
                                    <div className="paths">
                                        <IonList style={{ marginBottom: 15 }}>
                                            { (Object.keys(this.state.dataset.paths).map(key => {
                                                let marker = this.state.dataset.paths[key];
                                                return (
                                                    <IonItem key={key} onClick={ () => { this.editPathFilter(key) } }>
                                                        <IonLabel class="ion-text-wrap">
                                                            <h2>{marker.name}</h2>
                                                            {marker.sql && <p>{marker.sql}</p> }
                                                        </IonLabel>
                                                        <div className="path-preview" style={{ backgroundColor: marker.borderColor, opacity: marker.borderOpacity, height: marker.borderWeight + "px" }} />
                                                    </IonItem>
                                                )
                                            })) }
                                        </IonList>
                                        { (this.state.dataset && this.state.dataset.repeatingValues && this.state.dataset.repeatingValues.length !== 0) &&
                                            <IonButton style={{ margin: 15 }} color="dark" fill="outline" expand="block" onClick={() => { this.setState({ filterSuggestionsModal: true }) }}>Suggestions {this.state.dataset.repeatingValues.length}</IonButton>
                                        }
                                        <IonButton color="primary" className="create-btn" expand="block" onClick={() => { this.createPathFilter() }}>
                                            Add new marker
                                        </IonButton>
                                    </div>
                                </div>
                            }
                            { (this.state.step === "polygons") &&
                                <div className="step" data-step="markers">
                                    <IonListHeader>Customize Polygons</IonListHeader>
                                    <p>Here you can set up conditions so some locations will have a distinct look that helps understanding the type of location</p>
                                    <div className="paths">
                                        <IonList style={{ marginBottom: 15 }}>
                                            { (Object.keys(this.state.dataset.polygons).map(key => {
                                                let marker = this.state.dataset.polygons[key];
                                                return (
                                                    <IonItem key={key} onClick={ () => { this.editPolygonFilter(key) } }>
                                                        <IonLabel class="ion-text-wrap">
                                                            <h2>{marker.name}</h2>
                                                            {marker.sql && <p>{marker.sql}</p> }
                                                        </IonLabel>
                                                        <div className="polygon-preview" style={{ backgroundColor: ("rgba(" + Utilities.hexToRgbA(marker.fillColor) + "," + marker.fillOpacity + ")"), borderColor: ("rgba(" + Utilities.hexToRgbA(marker.borderColor) + "," + marker.borderOpacity + ")"), borderWidth: marker.borderWeight + "px" }} />
                                                    </IonItem>
                                                )
                                            })) }
                                        </IonList>
                                        { (this.state.dataset && this.state.dataset.repeatingValues && this.state.dataset.repeatingValues.length !== 0) &&
                                            <IonButton style={{ margin: 15 }} color="dark" fill="outline" expand="block" onClick={() => { this.setState({ filterSuggestionsModal: true }) }}>Suggestions {this.state.dataset.repeatingValues.length}</IonButton>
                                        }
                                        <IonButton color="primary" className="create-btn" expand="block" onClick={() => { this.createPolygonFilter() }}>
                                            Add new marker
                                        </IonButton>
                                    </div>
                                </div>
                            }
                            { (this.state.step === "features") &&
                                <div className="step" data-step="features">
                                    <IonListHeader>Default Features</IonListHeader>
                                    <p>Choose global features (e.g. free admission) that is applied to every location</p>
                                    <IonList style={{ marginBottom: 15 }}>
                                        <IonItem>
                                            <IonLabel position="stacked">Global Features</IonLabel>
                                            <ReactTags
                                                className="tag-editor"
                                                inline
                                                placeholder="New feature"
                                                handleInputChange={(text) => { this.setState({ query: text }) }}
                                                minQueryLength={1}
                                                tags={this.state.dataset.features.default || []}
                                                autofocus={false}
                                                handleDelete={this.handleFeatureTagDelete}
                                                handleAddition={this.handleFeatureTagAddition}
                                                delimiters={[188, 13]}
                                            />
                                            <TagSuggestions type="feature" query={this.state.query} onSelect={(tag) => { this.handleFeatureTagAddition({id: tag, text: tag}); }} />
                                        </IonItem>
                                    </IonList>
                                    <IonListHeader>
                                        <IonLabel>Condition-based Features</IonLabel>
                                        <IonButton color="dark" onClick={() => { this.createFeatureFilter() }}>
                                            <IonIcon icon={addCircle}></IonIcon>
                                        </IonButton>
                                    </IonListHeader>
                                    <p>Here you can set up conditions so some features are only matched to the desired locations (e.g. if facilities field contains "disabled" then add feature "disabled access" to the location)</p>
                                    <div className="filters">
                                        <IonList style={{ marginBottom: 15 }}>
                                            { (Object.keys(this.state.dataset.features.filterRules).map(key => {
                                                let filterRule = this.state.dataset.features.filterRules[key];
                                                return (
                                                    <IonItem key={key}>
                                                        <IonLabel class="ion-text-wrap">
                                                            <h2>{filterRule.name}</h2>
                                                            {filterRule.sql && <p>{filterRule.sql}</p> }
                                                        </IonLabel>
                                                        <IonIcon onClick={ () => { this.editFeatureFilter(key) } } icon={create} slot="end" />
                                                    </IonItem>
                                                )
                                            })) }
                                        </IonList>
                                        { (this.state.dataset && this.state.dataset.repeatingValues && this.state.dataset.repeatingValues.length !== 0) &&
                                            <IonButton style={{ margin: 15 }} color="dark" fill="outline" expand="block" onClick={() => { this.setState({ filterSuggestionsModal: true }) }}>Suggestions {this.state.dataset.repeatingValues.length}</IonButton>
                                        }
                                    </div>
                                </div>
                            }
                            { (this.state.step === "fields") &&
                                <div className="step" data-step="fields">
                                    <IonListHeader>Field Mappings</IonListHeader>
                                    <p>Map the following fields to the fields of your dataset</p>
                                    { (this.state.autoMatchCount) &&
                                        <div className="warning-msg">
                                            {this.state.autoMatchCount} fields have been autosuggested.
                                        </div>
                                    }
                                    <IonList>
                                        { this.state.fieldMappings.map((item, i) => {

                                            if (!this.state.showSelects) {
                                                return null;
                                            }

                                            if (!item.name.startsWith("___")) {

                                                return (
                                                    <div key={item.name}>
                                                    <IonItem>
                                                        <IonLabel>{item.displayName}</IonLabel>
                                                        <IonSelect
                                                            value={ this.getSelectedFieldMappings(item) }
                                                            multiple={item.multiple}
                                                            okText="Save"
                                                            key={"sel-" + i}
                                                            onIonChange={(e) => {this.handleMappingChange(item.name, e.target.value)}}
                                                        >
                                                            { (this.state.fieldsArr.length < 3) &&
                                                                <IonSelectOption value={"___ignore___"}>No fields created</IonSelectOption>
                                                            }
                                                            { this.state.fieldsArr.map(field => {
                                                                return Object.keys(this.state.dataset.fields).map((key, i) => {
                                                                    if (key !== field) return null;
                                                                    if (this.state.dataset.fields[key].type === "default") return null;
                                                                    if (this.state.dataset.fields[key].type.indexOf(item.name) > -1) {
                                                                        return <IonSelectOption selected value={field}>{field}</IonSelectOption>
                                                                    } else {
                                                                        return <IonSelectOption value={field}>{field}</IonSelectOption>
                                                                    }
                                                                })
                                                            })
                                                            }
                                                        </IonSelect>
                                                    </IonItem>
                                                    { item.description && <p>{item.description}</p> }
                                                    </div>
                                                )

                                            } else {

                                                return (
                                                    <div key={item.name}>
                                                        <IonItem onClick={() => {

                                                            if (item.name === "___DEFAULT_CITY___") {
                                                                this.setState({
                                                                    citySelectorModalType: "city",
                                                                    citySelectorModal: true
                                                                })
                                                            } else if (item.name === "___DEFAULT_COUNTRY___") {
                                                                this.setState({
                                                                    citySelectorModalType: "country",
                                                                    citySelectorModal: true
                                                                })
                                                            }

                                                        }}>
                                                            <IonLabel>{item.displayName}</IonLabel>
                                                            <IonNote slot="end">{this.state.dataset.fields[item.name].name || item.default}</IonNote>
                                                            <IonIcon icon={create}  slot="end" />
                                                        </IonItem>
                                                        { item.description && <p>{item.description}</p> }
                                                    </div>
                                                )

                                            }

                                        }) }
                                    </IonList>
                                    <IonListHeader>
                                        <IonLabel>Fields</IonLabel>
                                        <IonButton color="dark" onClick={() => { this.createField() }}>
                                            <IonIcon icon={addCircle}></IonIcon>
                                        </IonButton>
                                    </IonListHeader>
                                    <p>Here you can set up which fields are visible by default for users.</p>
                                    <IonList style={{ marginBottom: 15 }}>
                                        {Object.keys(this.state.dataset.fields).map((key, obj) => {
                                            if (key.startsWith("___")) return null;
                                            return (
                                                <div key={key}>
                                                    <IonItem onClick={() => { this.editField(key) }}>
                                                        <IonLabel>
                                                            <h2>{key}</h2>
                                                            <h3>Visible by default: {(this.state.dataset.fields[key].visibleToUsers) ? "Yes" : "No"}</h3>
                                                            <h3>Searchable by default: {(this.state.dataset.fields[key].searchableByUser) ? "Yes" : "No"}</h3>
                                                            <h3>Display name: {this.state.dataset.fields[key].name}</h3>
                                                        </IonLabel>
                                                        <IonIcon icon={create} slot="end" />
                                                    </IonItem>
                                                </div>
                                            )
                                        })}
                                    </IonList>
                                </div>
                            }
                            { (this.state.step === "sources") &&
                                <div className="step" data-step="fields">
                                    <IonListHeader>
                                        <IonLabel>File Sources</IonLabel>
                                        <IonButton color="dark" onClick={() => { this.createSource() }}>
                                            <IonIcon icon={addCircle}></IonIcon>
                                        </IonButton>
                                    </IonListHeader>
                                    <p>You can link to multiple files hosted by you.</p>
                                    <IonList>
                                        { this.state.dataset.sources.map((item, i) => {
                                            return (
                                                <IonItem key={item.name} className="ion-text-wrap" onClick={() => { this.editSource(i) }}>
                                                    <IonLabel>
                                                        <h2>{item.name} ({item.type})</h2>
                                                        <h3>{item.url}</h3>
                                                    </IonLabel>
                                                    <IonIcon icon={create} slot="end" />
                                                </IonItem>
                                            )
                                        }) }
                                    </IonList>
                                </div>
                            }
                            { (this.state.step === "geocoding") &&
                                <div className="step" data-step="fields">
                                    <IonListHeader>
                                        <IonLabel>Geocoding options</IonLabel>
                                    </IonListHeader>
                                    <p>You can override the default geocoding options here</p>
                                    <IonList>
                                        <IonItem>
                                            <IonLabel>Disable Geocoding</IonLabel>
                                            <IonToggle
                                                checked={this.state.dataset.noGeocode}
                                                onIonChange={(e) => {
                                                    let dataset = this.state.dataset;
                                                    dataset.noGeocode = e.detail.checked;
                                                    this.setState({ dataset: dataset, hasChanged: true })
                                                }}
                                            />
                                        </IonItem>
                                        <p>By default all locations (if location text is provided) are geocoded by Nominatim and Google to get the most precise coordinates (even if you defined them), if there is a confident match from either of them that addres and coordiantes are going to be used. If you don't define coordiantes this will still be used</p>
                                    </IonList>
                                    <IonList>
                                        <IonItem>
                                            <IonLabel>Disable Reverse Geocoding</IonLabel>
                                            <IonToggle
                                                checked={this.state.dataset.noReverseGeocode}
                                                onIonChange={(e) => {
                                                    let dataset = this.state.dataset;
                                                    dataset.noReverseGeocode = e.detail.checked;
                                                    this.setState({ dataset: dataset, hasChanged: true })
                                                }}
                                            />
                                        </IonItem>
                                        <p>If the previous geocoding has failed we will attempt to reverse geocode from your given coordiantes (if provided), if there is a confident match from either of them that addres and coordiantes are going to be used.</p>
                                    </IonList>
                                    <IonList>
                                        <IonItem>
                                            <IonLabel>Accept No City</IonLabel>
                                            <IonToggle
                                                checked={this.state.dataset.acceptNoAddress}
                                                onIonChange={(e) => {
                                                    let dataset = this.state.dataset;
                                                    dataset.acceptNoAddress = e.detail.checked;
                                                    this.setState({ dataset: dataset, hasChanged: true })
                                                }}
                                            />
                                        </IonItem>
                                        <p>If enabled the location will not be errored if it has at least a recognized country (e.g. if your dataset contains locations in the water)</p>
                                    </IonList>
                                </div>
                            }
                            { (this.state.step === "request") &&
                                <div className="step" data-step="request">
                                    <IonListHeader>Select request</IonListHeader>
                                    <p>Select the request you are submitting this dataset in for.</p>
                                    <IonList>
                                        { this.state.requests.map((item) => {
                                            return (
                                                <EntityListItem key={item.id} onClick={(id) => { this.associateRequest(id) }} hideSocialActions={true} actionType="request" entityType="request" entity={item} entityId={item.id} />
                                            )
                                        }) }
                                    </IonList>
                                </div>
                            }
                            { (this.state.step === "errored") &&
                                <div className="step" data-step="request">
                                    <IonListHeader>Errored Parses</IonListHeader>
                                    <p>The following locations have failed to be parsed</p>
                                    <IonList>
                                        { this.state.errored.map(item => {
                                            return (
                                                <IonItem key={item.id}>
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
                            }
                        </div>
                    </div>
                </IonContent>
                { (["source", "fields", "features", "categories", "details", "markers", "paths", "polygons", "sources", "geocoding"].indexOf(this.state.step) > -1) &&
                    <IonFab onClick={() => { this.nextStep() }}>
                        <IonFabButton><IonIcon icon={checkmark} /></IonFabButton>
                    </IonFab>
                }
                <IonToast
                    isOpen={this.state.error !== null}
                    onDidDismiss={() => this.setState({ error: null })}
                    message={this.state.error}
                    color="danger"
                    closeButtonText="Close"
                    duration={5000}
                    position="top"
                    showCloseButton={true}
                />
                <IonLoading
                    isOpen={this.state.loading !== null}
                    onDidDismiss={() => this.setState({ loading: null })}
                    message={this.state.loading}
                />
                <FieldEditor
                    presentingElement={this.pageRef}
                    open={this.state.fieldEditorModal}
                    fieldBeingEdited={this.state.fieldBeingEdited}
                    fieldBeingEditedKey={this.state.fieldBeingEditedKey}
                    onClose={() => { this.setState({ fieldEditorModal: false, fieldBeingEdited: null, fieldBeingEditedKey: null }) }}
                    onOpen={() => { this.setState({ fieldEditorModal: true }) }}
                    onSave={(key, obj) => { this.updateField(key, obj) }}
                />
                <SourceEditor
                    presentingElement={this.pageRef}
                    open={this.state.sourceEditorModal}
                    data={this.state.sourceBeingEdited}
                    i={this.state.sourceBeingEditedI}
                    onClose={() => { this.setState({ sourceEditorModal: false, sourceBeingEditedI: null, sourceBeingEdited: null }) }}
                    onOpen={() => { this.setState({ sourceEditorModal: true }) }}
                    onSave={(i, obj) => { this.updateSource(i, obj) }}
                    onDelete={(i, obj) => { this.removeSource(i) }}
                />
                <FilterEditor
                    presentingElement={this.pageRef}
                    dataset={this.state.dataset}
                    open={this.state.filterEditorModal}
                    filterBeingEdited={this.state.filterBeingEdited}
                    fields={this.state.fieldsArr}
                    filterBeingEditedKey={this.state.filterBeingEditedKey}
                    onClose={() => { this.setState({ filterEditorModal: false, filterEditorModal: null, filterBeingEditedKey: null }) }}
                    onOpen={() => { this.setState({ filterEditorModal: true }) }}
                    onSave={(key, name, obj, color, icon, sql, borderColor, borderWeight, borderOpacity, fillColor, fillOpacity, image) => { this.updateFilter(key, name, obj, color, icon, sql, borderColor, borderWeight, borderOpacity, fillColor, fillOpacity, image) }}
                    onDelete={(key) => { this.deleteFilter(key) }}
                    type={this.state.filterEditModalType}
                />
                <CitySelectorModal
                    presentingElement={this.pageRef}
                    open={this.state.citySelectorModal}
                    close={() => { this.setState({ citySelectorModal: false }) } }
                    onSelect={(type, id, name) => { this.updateLocation(type, id, name) }}
                    restrictToType={this.state.citySelectorModalType}
                />
                <FilterSuggestionsModal
                    presentingElement={this.pageRef}
                    open={this.state.filterSuggestionsModal}
                    section={this.state.step}
                    suggestions={this.state.dataset ? this.state.dataset.repeatingValues : null}
                    close={() => { this.setState({ filterSuggestionsModal: false }) } }
                    onSelect={(field, value) => {

                        let key = Utilities.randomStr(8);
                        let object = {
                            "name": value,
                            "query": {
                                "id": "g-Bao6B_4jmR1shBExC54kV",
                                "rules": [
                                    {
                                        "id": "r-lV32yarkm_X970n7Msg9O",
                                        "field": field,
                                        "value": value,
                                        "operator": "contains"}
                                ],
                                "combinator": "and",
                                "not": false
                            },
                            "sql": "(" + field + " like \"%park%\")"
                        }

                        console.log("Creating: ", key, object);

                        if (this.state.step === "categories") {
                            this.setState({
                                filterEditorModal: true,
                                filterBeingEditedKey: key,
                                filterBeingEdited: object,
                                filterEditModalType: "category"
                            })
                        } else if (this.state.step === "features") {
                            this.setState({
                                filterEditorModal: true,
                                filterBeingEditedKey: key,
                                filterBeingEdited: object,
                                filterEditModalType: "feature"
                            })
                        } else if (this.state.step === "markers") {
                            this.setState({
                                filterEditorModal: true,
                                filterBeingEditedKey: key,
                                filterBeingEdited: object,
                                filterEditModalType: "point"
                            })
                        } else if (this.state.step === "paths") {
                            this.setState({
                                filterEditorModal: true,
                                filterBeingEditedKey: key,
                                filterBeingEdited: object,
                                filterEditModalType: "path"
                            })
                        } else if (this.state.step === "polygons") {
                            this.setState({
                                filterEditorModal: true,
                                filterBeingEditedKey: key,
                                filterBeingEdited: object,
                                filterEditModalType: "polygon"
                            })
                        }

                        this.setState({ filterSuggestionsModal: false })

                    }}
                />
                <IonAlert
                    isOpen={this.state.hasChangedAlert}
                    onDidDismiss={() => { this.setState({ hasChangedAlert: false }) }}
                    message={"You have some unsaved changes"}
                    buttons={[
                        { text: 'Discard', handler: () => { this.props.history.goBack() } },
                        { text: 'Review' },
                    ]}
                />
            </IonPage>
        );
    }

};

export default withIonLifeCycle(DatasetSchemaEditor);
