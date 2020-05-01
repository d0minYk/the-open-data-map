import { IonBadge, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonModal, IonSearchbar, IonSegment, IonSegmentButton, IonSkeletonText, IonTitle, IonToolbar, withIonLifeCycle } from '@ionic/react';
import { close } from 'ionicons/icons';
import React from 'react';
import Server from '../Server';
import Storage from '../Storage';

class CitySelectorModal extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            results: [],
            keyword: "",
            type: "city",
            error: null,
        }
        this.initialSearchDone = false;
    }

    async select(id, name, countryId, countryName) {

        let previousSearches = (await Storage.getO("previousSearches")) || {};

        if (this.state.type === "city") {
            previousSearches["city-" + id] = name;
        } else {
            previousSearches["country-" + countryId] = countryName;
        }

        Storage.setO("previousSearches", previousSearches)

        this.props.onSelect(this.state.type, id, name, countryId, countryName)
        this.props.close();

    }

    setType(type) {

        if (type === this.state.type) {
            return;
        }

        this.setState({
            type: type,
            keyword: ""
        }, function() {
            this.search(this.state.keyword)
        })

    }

    componentWillReceiveProps(nextProps) {

        if (nextProps.restrictToType) {
            this.setType(nextProps.restrictToType)
        }

        if (nextProps.open && (!this.initialSearchDone)) {
            this.initialSearchDone = true;
            this.setState({
                keyword: ""
            }, function() {
                this.search("");
            })
        }

    }

    search(keyword) {

        keyword = keyword.trim();

        this.setState({
            keyword: keyword,
            error: null,
        })

        let apiUrl = "/" + this.state.type;

        if (keyword.length > 0) {
            apiUrl += "/search/" + keyword
        }

        Server.api({
            method: "get",
            url: apiUrl,
            then: function(res) {

                if (res.data) {
                    this.setState({ results: res.data })
                }

            }.bind(this),
            catch: function(code, error) {
                this.setState({ error: "Failed to load results." })
            }.bind(this)
        })

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
                        <IonTitle>Select {this.state.type}</IonTitle>
                        <IonButtons slot="end">
                            <IonIcon icon={close} onClick={() => { this.props.close() }}></IonIcon>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    { (!this.props.restrictToType) &&
                        <IonSegment mode="ios" value={this.state.type} onIonChange={e => this.setType(e.detail.value) }>
                            <IonSegmentButton value="city">
                                <IonLabel>City</IonLabel>
                            </IonSegmentButton>
                            <IonSegmentButton value="country">
                                <IonLabel>Country</IonLabel>
                            </IonSegmentButton>
                        </IonSegment>
                    }
                    <IonSearchbar
                        debounce={600}
                        showCancelButton="focus"
                        value={this.state.keyword}
                        onIonChange={(e) => {this.search(e.target.value)}}
                        placeholder="Search"
                    / >
                    { (!this.state.results) &&
                        <IonList>
                            <IonLabel>
                                <IonSkeletonText animated style={{ width: '50%' }} />
                            </IonLabel>
                        </IonList>
                    }
                    { (this.state.results) && (this.state.results.length !== 0) &&
                        <IonList>
                            { (this.state.results.map(item => {
                                if (this.state.type === "city" && (!item.countryName || !item.cityName)) return null;
                                if (this.state.type !== "city" && (!item.name)) return null;
                                return (
                                    <IonItem key={item.id} onClick={() => { this.select(item.id, this.state.type === "city" ? item.cityName : item.name, item.countryId, item.countryName); }}>
                                        <IonLabel>{ (this.state.type === "city") ? (item.countryName + " - " + item.cityName) : item.name }</IonLabel>
                                        <IonBadge color="primary">{item.locationCount || "0"}</IonBadge>
                                    </IonItem>
                                )
                            })) }
                        </IonList>
                    }
                    { (!this.state.error) && (this.state.results) && (this.state.results.length === 0) &&
                        <IonList>
                            <IonItem>
                                <IonLabel>No Results</IonLabel>
                            </IonItem>
                        </IonList>
                    }
                    { (this.state.error) &&
                        <IonList>
                            <IonItem>
                                <IonLabel>{this.state.error}</IonLabel>
                            </IonItem>
                        </IonList>
                    }
                    {/*<IonButton onClick={() => { this.props.close() }}>Close Modal</IonButton>*/}
                </IonContent>
            </IonModal>
        );
    }

};

export default withIonLifeCycle(CitySelectorModal);
