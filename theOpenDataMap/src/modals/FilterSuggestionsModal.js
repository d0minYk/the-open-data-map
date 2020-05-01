import { IonBadge, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonModal, IonTitle, IonToolbar, withIonLifeCycle } from '@ionic/react';
import { close } from 'ionicons/icons';
import React from 'react';


class FilterSuggestionsModal extends React.Component {

    ionViewWillEnter() {
        // console.log("VIEW WILL ENTER????????????====================")
        // this.search("");
    }

    constructor(props) {
        super(props)
        this.state = {
            results: [],
            keyword: "",
            type: "city"
        }
    }

    render() {
        return (
            <IonModal
                isOpen={this.props.open}
                presentingElement={(this.props.presentingElement && (window.globalVars === undefined || window.globalVars.size !== "big")) ? this.props.presentingElement.current : undefined}
                onDidDismiss={ () => { this.props.close(); } }
                swipeToClose={true}
                key="city-selector-modal"
            >
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>{this.props.section} Suggestions</IonTitle>
                        <IonButtons slot="end">
                            <IonIcon icon={close} onClick={() => { this.props.close() }}></IonIcon>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    { this.props.suggestions &&
                        <IonList>
                            { (this.props.suggestions.slice(0, 500).map((item, i) => {
                                return (
                                    <IonItem key={item.field} onClick={() => { this.props.onSelect(item.field, item.value) } }>
                                        <IonLabel className="ion-text-wrap">{item.value} ({item.field})</IonLabel>
                                        <IonBadge color="primary">{item.count}</IonBadge>
                                    </IonItem>
                                )
                            })) }
                        </IonList>
                    }
                </IonContent>
            </IonModal>
        );
    }

};

export default withIonLifeCycle(FilterSuggestionsModal);
