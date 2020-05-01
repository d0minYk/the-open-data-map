import { Plugins } from '@capacitor/core';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonPage, IonSegment, IonSegmentButton, IonTitle, IonToast, IonToolbar, withIonLifeCycle } from '@ionic/react';
import { clipboard } from 'ionicons/icons';
import React from 'react';
import QueryBuilder, { formatQuery } from 'react-querybuilder';
import '../styles/QueryBuilder.scss';
import '../styles/Search.scss';

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
                    },
                    {
                        name: "originals",
                        label: "Original Fields",
                        selected: false,
                    },
                    {
                        name: "id",
                        label: "Id",
                        selected: false,
                    },
                    {
                        name: "address",
                        label: "Address",
                        selected: false,
                    },
                    {
                        name: "name",
                        label: "Name",
                        selected: true,
                    },
                    {
                        name: "author",
                        label: "Author",
                        selected: false,
                    },
                    {
                        name: "dataset",
                        label: "Dataset",
                        selected: false,
                    },
                    {
                        name: "features",
                        label: "Features",
                        selected: true,
                    },
                    {
                        name: "categories",
                        label: "Categories",
                        selected: true,
                    },
                    {
                        name: "email",
                        label: "Email",
                        selected: false,
                    },
                    {
                        name: "tel",
                        label: "Telephone Number",
                        selected: false,
                    },
                    {
                        name: "website",
                        label: "Website",
                        selected: false,
                    },
                    {
                        name: "coordinates",
                        label: "Coordinates",
                        selected: true,
                    },
                    {
                        name: "licence",
                        label: "Licence",
                        selected: true,
                    },
                ],
                dataset: [
                    {
                        name: "all",
                        label: "All Fields",
                        selected: false,
                    },
                    {
                        name: "fields",
                        label: "Fields",
                        selected: false,
                    },
                    {
                        name: "sources",
                        label: "Sources",
                        selected: false,
                    },
                    {
                        name: "id",
                        label: "Id",
                        selected: true,
                    },
                    {
                        name: "name",
                        label: "Name",
                        selected: true,
                    },
                    {
                        name: "author",
                        label: "Author",
                        selected: false,
                    },
                    {
                        name: "description",
                        label: "Description",
                        selected: false,
                    },
                    {
                        name: "features",
                        label: "Features",
                        selected: true,
                    },
                    {
                        name: "categories",
                        label: "Categories",
                        selected: true,
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
                    operators: ["contains", "!contains"],
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
        document.title = "Advanced Search" + window.globalVars.pageTitle;
    }

    setEntity(entity) {
        this.setState({
            entity: entity,
            query: {
                id: "g-VicTvqn8KT9RN-XQusk_f",
                rules: [],
                combinator: "and",
                not: false
            },
            queryStr: null
        })
    }

    updateAPIURL() {

        let apiURL = this.generateApiURL();

        this.setState({
            apiURL: apiURL.success ? apiURL.data : null,
            apiURLError: apiURL.success ? null : apiURL.data
        })

    }

    generateApiURL() {

        let query = this.state.query;
        let fields = this.state.fields[this.state.entity];

        let base = window.globalVars.serverIp + "api/" + this.state.entity;
        let fieldsStr = ""
        let queryStr = ""
        let startStr = this.state.start
        let limitStr = this.state.limit

        let selectedFields = fields.filter(field => field.selected)

        if (selectedFields.indexOf("all") > -1) {

            fieldsStr = "all";

        } else {

            for (let i = 0; i < selectedFields.length; i++) {
                fieldsStr += selectedFields[i].name;
                if (i + 1 !== selectedFields.length)
                    fieldsStr += ","
            }

        }

        if (!fieldsStr) {
            return {
                success: false,
                data: "Select at least one field to return."
            };
        }

        queryStr = formatQuery(query, 'sql');

        if ( (queryStr === "()") ) {
            return {
                success: false,
                data: "Define at least one condition."
            };
        }

        queryStr = queryStr.replace(/like/g, 'contains');
        queryStr = queryStr.replace(/%/g, '');

        let rules = this.recursiveExpand(query.combinator, query.rules);

        for (let i = 0; i < rules.length; i++) {

            let rule = rules[i];
            console.log(rule);

            if (rule.value.trim() === "") {
                return { success: false, data: "Some conditions have empty values" };
            }

            let ruleE = this.QUERY_FIELDS[this.state.entity].filter(item => item.name === rule.field)[0];
            // console.log("HERE:", ruleE, rule.field)

            if (ruleE && ruleE.operators.indexOf(rule.operator) === -1) {
                return { success: false, data: "Operator " + rule.operator + " is not allowed for \"" + ruleE.label + "\""};
            }

        }

        return {
            success: true,
            data: base + "?fields=" + fieldsStr + "&query=" + queryStr + "&start=" + startStr + "&limit=" + limitStr
        };

    }

    recursiveExpand(combinator, rules) {

        let rulesArr = [];

        let ruleSetResults = [];
        let rootRuleSetResults = [];
        let rule;

        for (let i = 0; i < rules.length; i++) {

            rule = rules[i];

            if (rule.combinator) {
                rulesArr = rulesArr.concat(this.recursiveExpand(rule.combinator, rule.rules));
            } else {
                rulesArr.push(rule)
            }

        }

        return rulesArr;

    }

    logQuery = (query) => {

        console.log("QUERY CHANGE", query, "==============")

        this.setState({
            query: query,
        }, function() {
            this.updateAPIURL();
        })

    }

    render() {
        return (
            <IonPage data-page="search">
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonBackButton onClick={() => { this.props.history.goBack(); }} />
                        </IonButtons>
                        <IonTitle>Search</IonTitle>
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
                    <section data-section="advanced">
                        <h2>Fields</h2>
                        <p>These fields are going to be returned for each result.</p>
                        <div className="fields">
                            { this.state.fields[this.state.entity].map((field, i) => {
                                return (
                                    <div key={i} className="field" data-selected={field.selected} onClick={() => {
                                        let fields = this.state.fields;
                                        fields[this.state.entity][i].selected = !fields[this.state.entity][i].selected;
                                        this.setState({ fields: fields }, function() {
                                            this.updateAPIURL();
                                        })
                                    }}>
                                        {field.label}
                                    </div>
                                )
                            }) }
                        </div>
                        <h2>Query</h2>
                        <p>Defined filters to match.</p>
                        <QueryBuilder
                            fields={this.QUERY_FIELDS[this.state.entity]}
                            operators={this.OPERATORS}
                            onQueryChange={this.logQuery}
                            query={ this.state.query }
                        />
                        <div className="half">
                            <IonItem>
                                <IonLabel position="stacked">Start</IonLabel>
                                <p>Number of results to skip</p>
                                <IonInput type="number" placeholder="Skip n results" value={this.state.start} onIonChange={(e) => { this.setState({ start: e.target.value }, function() { this.updateAPIURL(); } ) }}></IonInput>
                            </IonItem>
                            <IonItem>
                                <IonLabel position="stacked">Limit</IonLabel>
                                <p>Total number of results to return</p>
                                <IonInput type="number" placeholder="Return n results" value={this.state.limit} onIonChange={(e) => { this.setState({ limit: e.target.value }, function() { this.updateAPIURL(); } ) }}></IonInput>
                            </IonItem>
                        </div>
                        <h2>API URL</h2>
                        <p>You can copy this to the browser's address bar to get a JSON representation of the results</p>
                        { (this.state.apiURL) &&
                            <div className="api-url" onClick={() => {
                                Clipboard.write({ string: this.state.apiURL });
                                this.setState({ copiedToClipboard: true })
                            } }>
                                <IonIcon icon={clipboard} mode="md" />
                                <span><span>GET</span> { this.state.apiURL }</span>
                            </div>
                        }
                        { (this.state.apiURLError) &&
                            <div className="status" data-success="false">
                                {this.state.apiURLError}
                            </div>
                        }
                        <IonButton expand="block" fill="outline" onClick={() => {
                            if (this.state.apiURL) {
                                window.open(this.state.apiURL);
                            } else {
                                window.alert("Incomplete search requirements (" + this.state.apiURLError + ")")
                            }
                        }}>Get JSON</IonButton>

                        <IonButton expand="block" fill="outline" onClick={() => { this.props.history.push("/search/guide") }}>API Guide</IonButton>
                        { (this.state.entity === "location") &&
                            <IonButton expand="block" onClick={() => {
                                if (this.state.apiURL) {
                                    let strippedUrl = this.state.apiURL.match(/query=(.+?)&/gm)[0];
                                    strippedUrl = strippedUrl.replace("query=", "");
                                    strippedUrl = strippedUrl.substr(0, strippedUrl.length-1);
                                    this.props.history.push("map/query/" + strippedUrl)
                                } else {
                                    window.alert("Incomplete search requirements (" + this.state.apiURLError + ")")
                                }
                            }}>Display on the map</IonButton>
                        }
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
