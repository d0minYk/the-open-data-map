import { Plugins } from '@capacitor/core';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonLabel, IonPage, IonSegment, IonSegmentButton, IonTitle, IonToast, IonToolbar, withIonLifeCycle } from '@ionic/react';
import React from 'react';
import '../styles/QueryBuilder.scss';
import '../styles/SearchGuide.scss';
import Utilities from '../Utilities.js';

const { Clipboard } = Plugins;

class Search extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            query: null,
            start: 0,
            limit: 500,
            fields: {
                location: [
                    {
                        name: "all",
                        label: "All Fields",
                        selected: false,
                        description: "Returns all fields"
                    },
                    {
                        name: "originals",
                        label: "Original Fields",
                        selected: false,
                        description: "Returns all original fields including unmapped fields",
                        type: "Object { Dataset specific fields }"
                    },
                    {
                        name: "id",
                        label: "Id",
                        selected: false,
                        description: "Id of the location",
                        type: "Number"
                    },
                    {
                        name: "address",
                        label: "Address",
                        selected: false,
                        description: "Address of the location",
                        type: "Object { streetHouse, postcode, city, country }"
                    },
                    {
                        name: "name",
                        label: "Name",
                        selected: true,
                        description: "Name of the location",
                        type: "String"
                    },
                    {
                        name: "author",
                        label: "Author",
                        selected: false,
                        description: "Author of the location",
                        type: "Object { id, email, username }"
                    },
                    {
                        name: "dataset",
                        label: "Dataset",
                        selected: false,
                        description: "Dataset of the location",
                        type: "Object { id, name, description, userId, format, sources, maintainerName, maintainerEmail }"
                    },
                    {
                        name: "features",
                        label: "Features",
                        selected: true,
                        description: "Features of the location",
                        type: "[String]"
                    },
                    {
                        name: "categories",
                        label: "Categories",
                        selected: true,
                        description: "Categories of the location",
                        type: "[String]"
                    },
                    {
                        name: "email",
                        label: "Email",
                        selected: false,
                        description: "Email of the location",
                        type: "String"
                    },
                    {
                        name: "tel",
                        label: "Telephone Number",
                        selected: false,
                        description: "Telephone number of the location",
                        type: "String"
                    },
                    {
                        name: "website",
                        label: "Website",
                        selected: false,
                        description: "Website of the location",
                        type: "String"
                    },
                    {
                        name: "coordinates",
                        label: "Coordinates",
                        selected: true,
                        description: "Coordinates of the location",
                        type: "Object { type, coordinates } "
                    },
                    {
                        name: "licence",
                        label: "Licence",
                        selected: true,
                        description: "Returns the licence type and desscription",
                        type: "Object { name, description } "
                    },
                    {
                        name: "updateat",
                        label: "Updated At",
                        selected: false,
                        description: "Date of the last content update",
                        type: "Date"
                    },
                    {
                        name: "createat",
                        label: "Created At",
                        selected: false,
                        description: "Date of the location creation",
                        type: "Date"
                    },
                ],
                dataset: [
                    {
                        name: "all",
                        label: "All Fields",
                        selected: false,
                        description: "Returns all fields",
                        type: "Object"
                    },
                    {
                        name: "fields",
                        label: "Fields",
                        selected: false,
                        description: "Fields of the dataset",
                        type: "[String]"
                    },
                    {
                        name: "sources",
                        label: "Sources",
                        selected: false,
                        description: "Sources of the dataset with download links and different types",
                        type: "[Object]"
                    },
                    {
                        name: "id",
                        label: "Id",
                        selected: true,
                        description: "Id of the dataset",
                        type: "Number"
                    },
                    {
                        name: "name",
                        label: "Name",
                        selected: true,
                        description: "Name of the dataset",
                        type: "String"
                    },
                    {
                        name: "author",
                        label: "Author",
                        selected: false,
                        description: "Author of the dataset",
                        type: "Object { id, email, username }"
                    },
                    {
                        name: "description",
                        label: "Description",
                        selected: false,
                        description: "Description of the dataset",
                        type: "String"
                    },
                    {
                        name: "features",
                        label: "Features",
                        selected: true,
                        description: "Features of the dataset",
                        type: "[String]"
                    },
                    {
                        name: "categories",
                        label: "Categories",
                        selected: true,
                        description: "Categories of the dataset",
                        type: "[String]"
                    },
                    {
                        name: "licence",
                        label: "Licence",
                        selected: true,
                        description: "Returns the licence type and desscription",
                        type: "Object { name, description }"
                    },
                    {
                        name: "updateat",
                        label: "Updated At",
                        selected: false,
                        description: "Date of the last content update",
                        type: "Date"
                    },
                    {
                        name: "createat",
                        label: "Created At",
                        selected: false,
                        description: "Date of the dataset creation",
                        type: "Date"
                    },
                ],
            },
            apiURL: "",
            entity: "location"
        }
        this.QUERY_FIELDS = {
            location: [
                {
                    name: "any",
                    label: "Any field",
                    description: "This searches in all fields of the location, returns result if there is at least one match",
                    operators: ["contains", "!contains"]
                },
                {
                    name: "datasetId",
                    label: "Dataset Id",
                    description: "The id of the dataset",
                    operators: ["=", "!="]
                },
                {
                    name: "authorId",
                    label: "Author Id",
                    description: "The id of the poster user",
                    operators: ["=", "!="]
                },
                {
                    name: "name",
                    label: "Name",
                    description: "The name of the location",
                    operators: ["contains", "!contains", "=", "!="]
                },
                {
                    name: "streetHouse",
                    label: "Street House",
                    description: "Street and or house number of the location",
                    operators: ["contains", "!contains", "=", "!="]
                },
                {
                    name: "postcode",
                    label: "Postcode",
                    description: "Postcode of the location",
                    operators: ["contains", "!contains", "=", "!="]
                },
                {
                    name: "city",
                    label: "City",
                    description: "City of the location",
                    operators: ["contains", "!contains", "=", "!="]
                },
                {
                    name: "country",
                    label: "Country",
                    description: "Country of the location",
                    operators: ["contains", "!contains", "=", "!="]
                },
                {
                    name: "features",
                    label: "Features",
                    description: "Features of the location",
                    operators: ["contains", "!contains"]
                },
                {
                    name: "categories",
                    label: "Categories",
                    description: "Categories of the location",
                    operators: ["contains", "!contains"]
                },
                {
                    name: "email",
                    label: "Email",
                    description: "Email address of the location or business",
                    operators: ["contains", "!contains", "=", "!="]
                },
                {
                    name: "tel",
                    label: "Telephone Number",
                    description: "Telephone number of the location or business",
                    operators: ["contains", "!contains", "=", "!="]
                },
                {
                    name: "website",
                    label: "Website",
                    description: "Website of the location or business",
                    operators: ["contains", "!contains", "=", "!="]
                },
            ],
            dataset: [
                {
                    name: "id",
                    label: "Id",
                    description: "The id of the dataset",
                    operators: ["=", "!="]
                },
                {
                    name: "name",
                    label: "Name",
                    description: "The name of the dataset",
                    operators: ["contains", "!contains", "=", "!="]
                },
                {
                    name: "description",
                    label: "Description",
                    description: "The description of the dataset",
                    operators: ["contains", "!contains", "=", "!="]
                },
                {
                    name: "features",
                    label: "Features",
                    description: "Features of the dataset",
                    operators: ["contains", "!contains"]
                },
                {
                    name: "categories",
                    label: "Categories",
                    description: "Categories of the dataset",
                    operators: ["contains", "!contains"]
                },
            ]
        }
        this.OPERATORS = [
            { name: '=', label: '=' },
            { name: '!=', label: '!=' },
            // { name: 'null', label: 'null' },
            // { name: '!null', label: '!null' },
            { name: 'contains', label: 'contains' },
            { name: '!contains', label: '!contains' },
        ]
    }

    async ionViewWillEnter() {
        // this.reset();
        document.title = "API Docs" + window.globalVars.pageTitle;
    }

    setEntity(entity) {
        this.setState({ entity: entity })
    }

    render() {
        return (
            <IonPage data-page="search-guide">
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonBackButton onClick={() => { this.props.history.goBack(); }} />
                        </IonButtons>
                        <IonTitle>Search Guide</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <IonSegment mode="ios" value={this.state.entity} onIonChange={e => this.setEntity(e.detail.value) }>
                        <IonSegmentButton value="location">
                            <IonLabel>Location</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="dataset">
                            <IonLabel>Dataset</IonLabel>
                        </IonSegmentButton>
                    </IonSegment>
                    <section>

                        <div className="entity-header">
                            <h2>{Utilities.capitalize(this.state.entity)} Search</h2>
                            <p>Returns {this.state.entity}s based on user query</p>
                            <div className="link">
                                <span>GET</span>
                                <span>https://theopendatamap.com/api/{this.state.entity}</span>
                            </div>
                        </div>

                        <h3>Parameters</h3>

                        <div className="parameter">
                            <h4>start <span>optional, default: 0</span></h4>
                            <p>Number of results to skip before returning matches</p>
                            <div className="link b">
                                <span>Example value</span>
                                <span>&start=50</span>
                            </div>
                        </div>

                        <div className="parameter">
                            <h4>limit <span>optional, default: 500</span></h4>
                            <p>Number of results to return</p>
                            <div className="link b">
                                <span>Example value</span>
                                <span>&limit=1000</span>
                            </div>
                        </div>

                        <div className="parameter">
                            <h4>fields <span>optional, default: all</span></h4>
                            <p>Comma separated list of fields that are going to be returned for all matches</p>
                            <div className="link b">
                                <span>Example value</span>
                                <span>&fields=id,name,author,city,country</span>
                            </div>
                            <div className="list">
                                { (this.state.fields[this.state.entity].map(field => {
                                    return (
                                        <div key={field.name}>
                                            <h5>{field.name} <span>{field.type}</span></h5>
                                            <p>{field.description}</p>
                                        </div>
                                    )
                                })) }
                            </div>
                        </div>

                        <div className="parameter">
                            <h4>query <span>required</span></h4>
                            <p>SQL-styled syntax query with nested AND, OR support</p>
                            <div className="link b">
                                <span>Example value</span>
                                { (this.state.entity === "location") ?
                                    <span>&query=( (name contains "pollution forecast") AND (city = "London") )</span>
                                    :
                                    <span>&query=(name contains "pollution forecast")</span>
                                }
                            </div>
                            <div className="list">
                                { (this.QUERY_FIELDS[this.state.entity].map(field => {
                                    return (
                                        <div key={field.name}>
                                            <h5>{field.name}</h5>
                                            <p>{field.description}</p>
                                            <p>Supported operatos: {field.operators.map((operator, i) => { return <span key={i}>{operator + (i !== field.operators.length -1 ? ", " : "") }</span> })}</p>
                                        </div>
                                    )
                                })) }
                            </div>
                        </div>

                        <h3>Example response</h3>
                        <div className="link b">
                            <span>
<pre>{
`{
    "total": "10400",
    "start": "500",
    "limit": "500",
    "data": [
        {
            "id": 233,
            "name": "Recycling centres",
            ...
        },
        ...
    ]
}` }
</pre>
                            </span>
                        </div>

                    </section>
                </IonContent>
                <IonToast
                    isOpen={this.state.copiedToClipboard}
                    onDidDismiss={() => { this.setState({ copiedToClipboard: false }) }}
                    message="Copied to clipboard"
                    position="top"
                    color="dark"
                    duration={1200}
                />
            </IonPage>
        );
    }

};

export default withIonLifeCycle(Search);
