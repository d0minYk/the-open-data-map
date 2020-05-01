import { IonAlert, IonButton, IonButtons, IonContent, IonFooter, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonModal, IonTitle, IonToolbar, withIonLifeCycle } from '@ionic/react';
import { close } from 'ionicons/icons';
import React, { createRef } from 'react';
import QueryBuilder, { formatQuery } from 'react-querybuilder';
import MapPreviewImage from '../images/map-background.png';
import MarkerCustomizerModal from '../modals/MarkerCustomizerModal.js';
import '../styles/FilterEditor.scss';
import '../styles/QueryBuilder.scss';
import Utilities from '../Utilities.js';
import TagSuggestions from './TagSuggestions.js';

class FilterEditor extends React.Component {

    constructor(props) {
        super(props)
        this.filterModalRef = createRef();
        this.state = {
            modal: false,
            key: null,
            fields: [],
            name: "",
            query: null,
            deleteConfirm: false,
            icons: [],
            error: null,
        }
    }

    toggle() {

    }

    componentWillReceiveProps(nextProps) {

        this.setState({
            modal: (nextProps.open) ? true : false
        })

        if (nextProps.open && !this.state.modal) {

        } else { return; }

        if (nextProps.fields) {
            this.setState({
                fields: nextProps.fields.map(item => {
                    return {
                        name: item,
                        label: item
                    }
                })
            })
        }

        if (nextProps.filterBeingEditedKey) {
            this.setState({
                key: nextProps.filterBeingEditedKey,
                name: nextProps.filterBeingEdited.name,
                color: nextProps.filterBeingEdited.color || "#4a69bb",
                icon: nextProps.filterBeingEdited.icon,
                query: nextProps.filterBeingEdited.query,
                borderColor: nextProps.filterBeingEdited.borderColor,
                borderWeight: nextProps.filterBeingEdited.borderWeight,
                borderOpacity: nextProps.filterBeingEdited.borderOpacity,
                fillOpacity: nextProps.filterBeingEdited.fillOpacity,
                fillColor: nextProps.filterBeingEdited.fillColor,
                image: nextProps.filterBeingEdited.image,
                modal: (nextProps.open) ? true : false
            })
        } else {
            this.setState({
                name: "",
                query: null,
                modal: (nextProps.open) ? true : false
            })
        }

    }

    handleChange(key, value) {
        console.log(key, value)
        this.setState({
            [key]: value
        })
    }

    // save() {
    //
    //     // TODO validate
    //
    //     let obj = {
    //         name: this.state.name,
    //         visibleToUsers: this.state.visibleToUsers,
    //         type: this.state.type,
    //     }
    //
    //     if (this.props.type === "marker") {
    //         obj.icon = this.state.icon;
    //         obj.color = this.state.color;
    //     }
    //
    //     this.props.onSave(this.state.key, obj)
    //
    //     this.props.onClose();
    //
    // }

    logQuery = (query) => {
        console.log("Set query")
        this.setState({
            query: query,
            querySQL: formatQuery(query, 'sql')
        })
    }

    save = () => {

        this.setState({ error: null })

        if ( (this.state.name !== "Default") && (this.state.query.rules.length === 0) ) {
            this.setState({ error: "One condition is required" })
            return;
        }

        if ( (!this.state.name) || (!this.state.name.trim()) ) {
            this.setState({ error: "Name is required" })
            return;
        }

        if (!/^[a-zA-Z0-9- ]+$/.test(this.state.name.trim())) {
            this.setState({ error: "Only letters, numbers, spaces and - are allowed as name" })
            return;
        }

        if ( (!this.props.type === "marker") && (!this.state.color) ) {
            this.setState({ error: "Color is required" })
            return;
        }

        if ( ( (this.props.type === "path") || (this.props.type === "polygon") ) && (!this.state.borderColor) ) {
            this.setState({ error: "Border color is required" })
            return;
        }

        if ( ( (this.props.type === "path") || (this.props.type === "polygon") ) && (!this.state.borderWeight) ) {
            this.setState({ error: "Border weight is required" })
            return;
        }

        if ( ( (this.props.type === "path") || (this.props.type === "polygon") ) && (!this.state.borderOpacity) ) {
            this.setState({ error: "Border opacity is required" })
            return;
        }

        this.props.onClose();
        this.props.onSave(this.props.filterBeingEditedKey, this.state.name, this.state.query, this.state.color, this.state.icon, this.state.querySQL, this.state.borderColor, this.state.borderWeight, this.state.borderOpacity, this.state.fillColor, this.state.fillOpacity, this.state.image);

    }

    filterIcons(value) {
        this.setState({
            iconKeywords: value
        }, function() {

        })
    }

    render() {
        return (
            <IonModal
                isOpen={this.state.modal}
                presentingElement={(this.props.presentingElement && (window.globalVars === undefined || window.globalVars.size !== "big")) ? this.props.presentingElement.current : undefined}
                onDidDismiss={ () => { this.props.onClose(); } }
                swipeToClose={true}
                ref={this.filterModalRef}
                data-modal="filter-editor"
                style={{ display: (this.state.deleteConfirm) ? "block" : "block" }}
            >
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>{(this.props.filterBeingEditedKey ? "Edit " + this.props.filterBeingEditedKey : "Create a new filter" )}</IonTitle>
                        <IonButtons slot="end">
                            <IonIcon icon={close} onClick={() => { this.props.onClose() }}></IonIcon>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <IonList>
                        <IonItem>
                            <IonLabel position="stacked">Category Name</IonLabel>
                            { (this.state.name === "Default") ?
                                <IonLabel position="stacked">Default</IonLabel>
                                :
                                <IonInput value={this.state.name} onIonChange={(e) => { this.handleChange("name", e.target.value); this.setState({ tagSuggestionsQuery: e.target.value }); }} placeholder="Enter the tag you want to add to matched entities" type="text"></IonInput>
                            }
                            <TagSuggestions type={this.props.type} query={this.state.tagSuggestionsQuery} onSelect={(tag) => { this.handleChange("name", tag) } } />
                        </IonItem>
                        { (this.state.name !== "Default") &&
                            <IonItem>
                                <IonLabel position="stacked">Conditions</IonLabel>
                                <div className="rules">
                                    <QueryBuilder fields={this.state.fields} operators={[
                                        { name: '=', label: '=' },
                                        { name: '!=', label: '!=' },
                                        { name: '<', label: '<' },
                                        { name: '<=', label: '<=' },
                                        { name: '>', label: '>' },
                                        { name: '>=', label: '>=' },
                                        { name: 'null', label: 'empty', value: false },
                                        { name: '!null', label: 'not empty', value: false },
                                        { name: 'contains', label: 'contains' },
                                        { name: '!contains', label: 'does not contain' },
                                    ]} onQueryChange={this.logQuery} query={ this.state.query } />
                                </div>
                            </IonItem>
                        }
                        <div className="marker-apearance" onClick={() => {
                            this.setState({
                                markerCustomizerModal: true,
                                markerCustomizerModalData: this.state,
                            })
                        }}>
                            { (this.props.type === "point") &&
                                <div className="marker">
                                    <IonItem>
                                        <IonLabel position="stacked">Marker Appearance</IonLabel>
                                    </IonItem>
                                    <div className="preview-wrapper" style={{ backgroundImage: `url('${MapPreviewImage}')` }}>
                                        <div class="marker-custom" data-image={this.state.image ? "true" : "false"}>
                                            <div style={{ backgroundColor: this.state.color || window.globalVars.COLORS.blue }}>
                                                { (this.state.image) ?
                                                    <div style={{ width: '100%', height: '100%' }}><img src={this.state.image} style={{ width: '100%', height: '100%' }} /></div>
                                                    :
                                                    <i className={this.state.icon} />
                                                }
                                            </div>
                                            <span />
                                        </div>
                                    </div>
                                </div>
                            }
                            { (this.props.type === "path") &&
                                <div className="path">
                                    <IonItem>
                                        <IonLabel position="stacked">Path Appearance</IonLabel>
                                    </IonItem>
                                    <div className="preview-wrapper" style={{ backgroundImage: `url('${MapPreviewImage}')` }}>
                                        <div className="path-custom" style={{ backgroundColor: this.state.borderColor, opacity: this.state.borderOpacity, height: this.state.borderWeight + "px" }} />
                                    </div>
                                </div>
                            }
                            { (this.props.type === "polygon") &&
                                <div className="polygon">
                                    <IonItem>
                                        <IonLabel position="stacked">Polygon Appearance</IonLabel>
                                    </IonItem>
                                    <div className="preview-wrapper" style={{ backgroundImage: `url('${MapPreviewImage}')` }}>
                                        <div className="polygon-preview" style={{
                                            backgroundColor: ("rgba(" + Utilities.hexToRgbA(this.state.fillColor) + "," + parseFloat(this.state.fillOpacity) + ")"),
                                            borderColor: ("rgba(" + Utilities.hexToRgbA(this.state.borderColor) + "," + parseFloat(this.state.borderOpacity) + ")"),
                                            borderWidth: parseInt(this.state.borderWeight) + "px" }}
                                        />
                                    </div>
                                </div>
                            }
                        </div>
                        { (this.state.error) &&
                            <div className="error-msg">
                                {this.state.error}
                            </div>
                        }
                        <IonAlert
                            isOpen={this.state.deleteConfirm}
                            onDidDismiss={() => {
                                this.setState({
                                    deleteConfirm: false
                                })
                            }}
                            header={'Delete ' + this.props.type}
                            message={'Are you sure you want to delete this ' + this.props.type + '?'}
                            buttons={[
                                {
                                    text: 'Cancel',
                                    role: 'cancel'
                                },
                                {
                                    text: 'Delete',
                                    role: 'delete',
                                    cssClass: 'danger',
                                    handler: () => {
                                        this.props.onDelete(this.props.filterBeingEditedKey);
                                        this.props.onClose();
                                    }
                                }
                            ]}
                        />
                    </IonList>
                </IonContent>
                <IonFooter>
                    { (this.props.filterBeingEditedKey && this.state.name !== "Default") &&
                        <IonButton color="danger" className="delete-btn" expand="block" onClick={() => { this.setState({ deleteConfirm: true }) }}>
                            Delete
                        </IonButton>
                    }
                    <IonButton color="dark" className="save-btn" expand="block" onClick={() => { this.save(); }}>
                        Save
                    </IonButton>
                </IonFooter>
                <MarkerCustomizerModal
                    open={this.state.markerCustomizerModal}
                    data={this.state.markerCustomizerModalData}
                    type={this.props.type}
                    source="filter-editor"
                    datasetEntity={this.props.dataset}
                    presentingElement={this.filterModalRef}
                    onClose={() => {
                        this.setState({
                            markerCustomizerModal: false
                        })
                    }}
                    onOpen={() => {

                    }}
                    type={this.props.type}
                    coordinates={null}
                    onSave={(type, style) => {

                        console.log("SAVING", style)

                        this.setState({
                            ...style,
                            markerCustomizerModal: false,
                        })

                    }}
                />
            </IonModal>
        );
    }

};

export default withIonLifeCycle(FilterEditor);
