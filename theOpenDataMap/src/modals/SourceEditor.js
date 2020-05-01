import { IonButton, IonButtons, IonContent, IonFooter, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonModal, IonTitle, IonToolbar, withIonLifeCycle } from '@ionic/react';
import { close } from 'ionicons/icons';
import React from 'react';

class SourceEditor extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            modal: false,
            key: null,
            name: false,
            url: false,
            type: false,
        }
    }

    toggle() {

    }

    componentWillReceiveProps(nextProps) {

        if (nextProps.data) {
            this.setState({
                i: nextProps.i,
                name: nextProps.data.name,
                url: nextProps.data.url,
                type: nextProps.data.type,
                modal: nextProps.open,
                error: null,
            })
        } else {
            this.setState({
                name: null,
                url: null,
                type: null,
                modal: nextProps.open,
                error: null,
            })
        }

    }

    handleChange(key, value) {
        this.setState({
            [key]: value
        })
    }

    save() {

        let name = this.state.name;
        let type = this.state.type;
        let url = this.state.url;

        if (!name || !type || !url) {
            this.setState({ error: "All fields are required" })
            return;
        }

        let match = url.match(/^((ftp|http|https):\/\/)?(www.)?(?!.*(ftp|http|https|www.))[a-zA-Z0-9_-]+(\.[a-zA-Z]+)+((\/)[\w#]+)*(\/\w+\?[a-zA-Z0-9_]+=\w+(&[a-zA-Z0-9_]+=\w+)*)?/gm)
        if (!match) {
            this.setState({ error: "Invalid Website" })
            return;
        }

        if (!url.startsWith("http")) {
            url = "https://" + url
        }

        this.props.onSave(this.state.i, {
            name: name,
            type: type,
            url: url,
        })

        this.props.onClose();

    }

    delete() {

        this.props.onDelete(this.state.i);
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
                        <IonTitle>Edit Source</IonTitle>
                        <IonButtons slot="end">
                            <IonIcon icon={close} onClick={() => { this.props.onClose() }}></IonIcon>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <IonList>
                        <IonItem>
                            <IonLabel position="stacked">Name</IonLabel>
                            <IonInput value={this.state.name} onIonChange={(e) => {this.handleChange("name", e.target.value)}} placeholder="Name" type="text"></IonInput>
                        </IonItem>
                        <IonItem>
                            <IonLabel position="stacked">Format</IonLabel>
                            <IonInput value={this.state.type} onIonChange={(e) => {this.handleChange("type", e.target.value)}} placeholder="Format" type="text"></IonInput>
                        </IonItem>
                        <IonItem>
                            <IonLabel position="stacked">Url</IonLabel>
                            <IonInput value={this.state.url} onIonChange={(e) => {this.handleChange("url", e.target.value)}} placeholder="Url" type="text"></IonInput>
                        </IonItem>
                        { (this.state.error) &&
                            <div className="error-msg" style={{ margin: 15 }}>
                                {this.state.error}
                            </div>
                        }
                    </IonList>
                </IonContent>
                <IonFooter>
                    <IonButton style={{ margin: 15 }} color="danger" className="delete-btn" expand="block" onClick={() => { this.delete() }}>
                        Delete
                    </IonButton>
                    <IonButton style={{ margin: 15 }} color="dark" className="save-btn" expand="block" onClick={() => { this.save(); }}>
                        Save
                    </IonButton>
                </IonFooter>
            </IonModal>
        );
    }

};

export default withIonLifeCycle(SourceEditor);
