import { Plugins } from '@capacitor/core';
import { IonItem, IonLabel, IonList, IonActionSheet, IonButton, IonButtons, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonModal, IonSelect, IonSelectOption, IonTitle, IonToolbar, withIonLifeCycle } from '@ionic/react';
import axios from 'axios';
import { checkmark, close, locate, closeSharp } from 'ionicons/icons';
import { divIcon } from 'leaflet';
import React, { createRef } from 'react';
import Autocomplete from 'react-google-autocomplete';
import { Map, Polygon, Polyline, TileLayer, Marker } from 'react-leaflet';
import 'react-leaflet-markercluster/dist/styles.min.css';
import '../styles/LocationPickerModal.scss';
import '../styles/PathBuilderModal.scss';
const { Geolocation } = Plugins

class PathBuilderModal extends React.Component {

    constructor(props) {
        super(props)
        this.mapRef = createRef();
        this.state = {
            modal: false,
            zoom: 13,
            center: [16.5666658, 102.6072654],
            type: props.type || null,
            coordinates: props.coordinates ? JSON.parse(JSON.stringify(props.coordinates)) : null,
            focus: (props.coordinates && props.coordinates.length !== 0) ? (props.coordinates.length-1) : -1,
        }
        if (props.coordinates) {
            this.cwpCB(props)
        }
    }

    cwpCB(nextProps) {

        this.setState({
            modal: nextProps.open
        })

        if (nextProps.open !== this.state.modal || nextProps.type !== this.state.type) {

            console.log("YUMMPY")

            setTimeout(function() {
                console.log("Resize trugger")
                window.dispatchEvent(new Event('resize'));
            }.bind(this), 500)

            this.setState({
                type: nextProps.type,
                coordinates: JSON.parse(JSON.stringify(nextProps.coordinates)),
                focus: (nextProps.coordinates && nextProps.coordinates.length !== 0) ? (nextProps.coordinates.length-1) : -1,
            }, function() {
                setTimeout(function() {
                    console.log("HERE")
                    if (this.mapRef && this.mapRef.current && this.mapRef.current.leafletElement && this.state.coordinates && this.state.coordinates[0] && this.state.coordinates[0].lat) {
                        console.log("AND WIN")
                        const map = this.mapRef.current.leafletElement;
                        map.fitBounds(this.state.coordinates);
                    }
                }.bind(this), 1000)
            })

        }

    }

    componentWillReceiveProps(nextProps) {
        this.cwpCB(nextProps)
    }

    close() {
        this.props.onClose()
    }

    onMapClick = (latlng) => {
        console.log("SELECTED: ", latlng);
        let coordinates = this.state.coordinates;
        coordinates.splice(this.state.focus+1, 0, latlng);
        this.setState({
            coordinates: JSON.parse(JSON.stringify(coordinates)),
            focus: this.state.focus + 1
        }, function() {
            if (this.props.size === "big") {
                this.props.onSave(this.state.coordinates)
            }
        })
    }

    async zoomToCurrentLocation() {

        const map = this.mapRef.current.leafletElement;

        if (window.globalVars.platform === "desktop") {
            if (window.navigator) {
                window.navigator.geolocation.getCurrentPosition(function(position) {
                if (position.coords && position.coords.latitude && position.coords.longitude) {
                    map.setView({lat: position.coords.latitude, lng: position.coords.longitude}, 17);
                }}.bind(this), function(error) { console.log(error) });
            }
        } else if (window.globalVars.os === "android") {
            const position = await Geolocation.getCurrentPosition({options: {enableHighAccuracy: false}}).catch(e => { console.error("Failed to get location", e) });
            map.setView({lat: position.coords.latitude, lng: position.coords.longitude}, 17);
        } else if (window.globalVars.os === "ios") {
            let cbId = await Geolocation.watchPosition({enableHighAccuracy: true}, function(position, error) {
                Geolocation.clearWatch({ id: cbId })
                if (!error && position && position.coords && position.coords.latitude && position.coords.longitude) {
                    map.setView({lat: position.coords.latitude, lng: position.coords.longitude}, 17);
                }
            }.bind(this))
        }

    }

    save() {
        this.props.onSave(this.state.coordinates)
    }

    render() {

        let contentDOM = <div className="container">
            <div className="info">
                Click on the map to add new points.
            </div>
            <div className="map-container">
                <Map className="markercluster-map" center={this.state.center} zoom={this.state.zoom} ref={this.mapRef} zoomControl={false} maxZoom={20} onClick={(e) => { this.onMapClick(e.latlng) }}>
                    <TileLayer
                      attribution="&copy; <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> &copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
                      url={window.globalVars.mapTileServer}
                    />
                    { (this.state.coordinates && this.state.coordinates.length === 1) &&
                        <Marker
                            position={[this.state.coordinates[0].lat, this.state.coordinates[0].lng]}
                            icon={new divIcon({className: 'marker', html: ` <div class="marker-custom" style="background-color:#4a69bb;"/ >`}) }
                        ></Marker>
                    }
                    { (this.state.type === "path" && this.state.coordinates && this.state.coordinates.length > 1) &&
                        (<Polyline
                            key="path"
                            positions={this.state.coordinates}
                        />)
                    }
                    { (this.state.type === "polygon" && this.state.coordinates && this.state.coordinates.length > 1) &&
                        (<Polygon
                            key="polygon"
                            positions={this.state.coordinates}
                        />)
                    }
                    { /*(this.state.coordinates && this.state.coordinates.length !== 0) && this.state.coordinates.map((item, i) => {
                        return (
                            <Marker
                                key={item.lat}
                                position={[item.lat, item.lng]}
                                onClick={ () => { this.setState({ focus: i }) } }
                                icon={new divIcon({className: 'marker', html: `
                                    <div class="path-builder-marker"></div>`})
                                }
                            ></Marker>
                        )
                    }) */ }
                </Map>
              </div>
              <div className="list">
                  <IonList>
                      { this.state.coordinates && this.state.coordinates.map((item, i) => {
                         return (
                             <IonItem key={item.lat} onClick={() => { this.setState({ focus: i }) }}>
                                 <IonLabel class="ion-text-wrap">
                                     <h2>Latitude: {item.lat}</h2>
                                     <h2>Longitude: {item.lng}</h2>
                                     { (i === this.state.focus) && <p>The next point will be after this, click on another item to switch focus</p> }
                                 </IonLabel>
                                 <IonIcon onClick={ () => {
                                     let coordinates = this.state.coordinates;
                                     let newFocus = this.state.focus;
                                     coordinates.splice(i, 1);
                                     if (newFocus === i) {
                                         i--;
                                     }
                                     if (newFocus < 0) {
                                         newFocus = 0;
                                     }
                                     this.setState({
                                         coordinates: JSON.parse(JSON.stringify(coordinates)),
                                         focus: newFocus
                                     }, function() {
                                         if (this.props.size === "big") {
                                             this.props.onSave(this.state.coordinates)
                                         }
                                     })
                                }} icon={closeSharp} slot="end" />
                            </IonItem>
                        )
                      }) }
                  </IonList>
              </div>
              <IonFab vertical="bottom" horizontal="end" slot="fixed">
                  <IonFabButton onClick={() => { this.zoomToCurrentLocation(); }}>
                      <IonIcon icon={locate} />
                  </IonFabButton>
                  { (this.props.size === "small" || (this.props.preloadType === "path" || this.props.preloadType === "polygon") ) &&
                      <IonFabButton color="success" onClick={() => { this.save(); }}>
                          <IonIcon icon={checkmark} />
                      </IonFabButton>
                  }
              </IonFab>
        </div>

        if (this.props.size === "big") {
            return (
                <div className="location-picker-modal path-builder-modal">
                    {contentDOM}
                </div>
            )
        }

        return (
            <IonModal
                isOpen={this.props.open}
                className="location-picker-modal path-builder-modal"
                presentingElement={(this.props.presentingElement && (window.globalVars === undefined || window.globalVars.size !== "big")) ? this.props.presentingElement.current : undefined}
                onDidDismiss={ () => { this.props.onClose(); } }
                swipeToClose={true}
            >
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Select {this.state.type}</IonTitle>
                        <IonButtons slot="end">
                            <IonIcon icon={close} onClick={() => { this.props.onClose() }}></IonIcon>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="location-picker-modal">
                    {contentDOM}
                </IonContent>
            </IonModal>
        );
    }

};

export default withIonLifeCycle(PathBuilderModal);
