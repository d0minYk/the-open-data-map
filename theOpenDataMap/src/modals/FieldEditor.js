import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonModal, IonTitle, IonToggle, IonToolbar, withIonLifeCycle } from '@ionic/react';
import { close } from 'ionicons/icons';
import React from 'react';
import '../styles/FieldEditor.scss';


class FieldEditor extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            modal: false,
            key: null,
            visibleToUsers: false,
            searchableByUser: false,
        }
    }

    toggle() {

    }

    componentWillReceiveProps(nextProps) {

        if (nextProps.fieldBeingEditedKey) {
            this.setState({
                key: nextProps.fieldBeingEditedKey,
                name: nextProps.fieldBeingEdited.name,
                visibleToUsers: nextProps.fieldBeingEdited.visibleToUsers,
                searchableByUser: nextProps.fieldBeingEdited.searchableByUser,
                type: nextProps.fieldBeingEdited.type,
                modal: nextProps.open
            })
        } else {
            this.setState({
                name: null,
                visibleToUsers: false,
                searchableByUser: false,
                type: [],
                modal: nextProps.open
            })
        }

    }

    handleChange(key, value) {
        this.setState({
            [key]: value
        })
    }

    save() {

        // TODO validate

        this.props.onSave(this.state.key, {
            name: this.state.name,
            visibleToUsers: this.state.visibleToUsers,
            searchableByUser: this.state.searchableByUser,
            type: this.state.type,
        })

        this.props.onClose();

    }

    render() {
        return (
            <IonModal
                isOpen={this.state.modal}
                presentingElement={(this.props.presentingElement && (window.globalVars === undefined || window.globalVars.size !== "big")) ? this.props.presentingElement.current : undefined}
                onDidDismiss={ () => { this.props.onClose(); } }
                swipeToClose={true}
            >
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>{(this.props.fieldBeingEditedKey ? "Edit " + this.props.fieldBeingEditedKey + " field" : "Create a new field" )}</IonTitle>
                        <IonButtons slot="end">
                            <IonIcon icon={close} onClick={() => { this.props.onClose() }}></IonIcon>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <IonList style={{ height: 'calc(100% - 78px)' }}>
                        { (!this.props.fieldBeingEditedKey) &&
                            <IonItem>
                                <IonLabel position="stacked">Field Name</IonLabel>
                                <IonInput onIonChange={(e) => {this.handleChange("key", e.target.value)}} placeholder="You can only set this once" type="text"></IonInput>
                            </IonItem>
                        }
                        <IonItem>
                            <IonLabel position="stacked">Public Name</IonLabel>
                            <IonInput value={this.state.name} onIonChange={(e) => {this.handleChange("name", e.target.value)}} placeholder="This will be shown to users" type="text"></IonInput>
                        </IonItem>
                        <IonItem>
                            <IonLabel>Visible by default</IonLabel>
                            <IonToggle checked={this.state.visibleToUsers} onIonChange={(e) => {this.handleChange("visibleToUsers", e.detail.checked)}} />
                        </IonItem>
                        <IonItem>
                            <IonLabel>Searcable by default</IonLabel>
                            <IonToggle checked={this.state.searchableByUser} onIonChange={(e) => {this.handleChange("searchableByUser", e.detail.checked)}} />
                        </IonItem>
                    </IonList>
                    <IonButton style={{ margin: 15 }} color="dark" className="save-btn" expand="block" onClick={() => { this.save(); }}>
                        Save
                    </IonButton>
                </IonContent>
            </IonModal>
        );
    }

};

export default withIonLifeCycle(FieldEditor);
