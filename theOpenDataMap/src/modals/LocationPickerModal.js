import { Plugins } from '@capacitor/core';
import { IonActionSheet, IonButton, IonButtons, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonModal, IonSelect, IonSelectOption, IonTitle, IonToolbar, withIonLifeCycle } from '@ionic/react';
import axios from 'axios';
import { checkmark, close, locate } from 'ionicons/icons';
import { divIcon } from 'leaflet';
import React, { createRef } from 'react';
import Autocomplete from 'react-google-autocomplete';
import { Map, Marker, TileLayer } from 'react-leaflet';
import 'react-leaflet-markercluster/dist/styles.min.css';
import '../styles/LocationPickerModal.scss';
const { Geolocation } = Plugins

class LocationPickerModal extends React.Component {

    constructor(props) {
        super(props)
        this.mapRef = createRef();
        this.state = {
            modal: false,
            zoom: 13,
            center: [16.5666658, 102.6072654],
            location: null,
            locationObj: null,
            geocodeResults: null,
            selectedLocation: null,
        }
    }

    componentWillReceiveProps(nextProps) {

        this.setState({
            modal: nextProps.open
        })

        if (nextProps.open !== this.state.modal) {

            setTimeout(function() {
                console.log("Resize trugger")
                this.setState({ selectedLocation: null })
                window.dispatchEvent(new Event('resize'));
            }.bind(this), 1000)

        }

        if (this.props.preloadCoordinates !== nextProps.preloadCoordinates || (!this.state.coordinates) || this.state.mapNotInited) {
            this.setState({
                coordinates: nextProps.preloadCoordinates,
                type: nextProps.preloadType
            }, function() {
                setTimeout(function() {
                    console.log(this.mapRef, this.state.coordinates)
                    if (this.mapRef && this.mapRef.current && this.mapRef.current.leafletElement && this.state.coordinates && this.state.coordinates[0] && this.state.coordinates[0].lat) {
                        const map = this.mapRef.current.leafletElement;
                        map.fitBounds(this.state.coordinates);
                        this.setState({ mapNotInited: false })
                    } else {
                        this.setState({ mapNotInited: true })
                    }
                }.bind(this), 1000)
            })
        }

    }

    close() {
        this.props.onClose()
    }

    async reverseGeocode(latlng) {

         let res = await axios
            .get('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + latlng.lat + ',' + latlng.lng + '&sensor=true&key=' + window.globalVars.googleMapsAPI + '&language=en&region=US')
            .catch(function(e) { alert("Failed to get address.") })

        if (!res) {
            return;
        }

        this.setState({
            geocodeResults: res.data.results.filter(item => {
                return ( (item.types.indexOf("point_of_interest") !== -1) || (item.types.indexOf("premise") !== -1) || (item.types.indexOf("street_address") !== -1) || (item.types.indexOf("route") !== -1) )
            })
        })

         console.log(res)

    }

    onMapClick = (latlng) => {

        console.log(latlng);

        this.setState({
            location: {
                lat: latlng.lat,
                lng: latlng.lng,
            }
        })

        const map = this.mapRef.current.leafletElement;
        map.setView(latlng, 20);

        if (this.props.needAddress)
            this.reverseGeocode(latlng);

    }

    async zoomToCurrentLocation() {

        const map = this.mapRef.current.leafletElement;

        if (window.globalVars.platform === "desktop") {
            console.log("DEKSTOP")
            if (window.navigator) {
                window.navigator.geolocation.getCurrentPosition(function(position) {
                if (position.coords && position.coords.latitude && position.coords.longitude) {
                    map.setView({lat: position.coords.latitude, lng: position.coords.longitude}, 17);
                }}.bind(this), function(error) { console.log(error) });
            }
        } else if (window.globalVars.os === "android") {
            console.log("android")
            const position = await Geolocation.getCurrentPosition({options: {enableHighAccuracy: false}}).catch(e => { console.error("Failed to get location", e) });
            map.setView({lat: position.coords.latitude, lng: position.coords.longitude}, 17);
        } else if (window.globalVars.os === "ios") {
            console.log("ios")
            let cbId = await Geolocation.watchPosition({enableHighAccuracy: true}, function(position, error) {
                Geolocation.clearWatch({ id: cbId })
                if (!error && position && position.coords && position.coords.latitude && position.coords.longitude) {
                    map.setView({lat: position.coords.latitude, lng: position.coords.longitude}, 17);
                }
            }.bind(this))
        }

    }

    save() {
        console.log("Passing; ", this.state.location, this.state.selectedLocation)
        this.props.onSave(this.state.location, this.state.selectedLocation)
    }

    setAddress = (address) => {

        let addressObj = {
            formatted_address: address.formatted_address
        }

        address.address_components.forEach(function(value) {
            addressObj[value.types[0]] = value.long_name
        });

        let addressFormatted = {
            streetHouse: ( ( addressObj.street_number ? addressObj.street_number + " " : " ") + ( addressObj.route ? addressObj.route : "") ).trim(),
            city: addressObj.postal_town ? addressObj.postal_town : addressObj.locality,
            country: addressObj.country,
            postcode: addressObj.postal_code ? addressObj.postal_code : addressObj.postal_code_prefix
        }

        console.log(address.geometry.location)

        let location = {
            lat: (typeof address.geometry.location.lat === "function") ? (address.geometry.location.lat()) : address.geometry.location.lat,
            lng: (typeof address.geometry.location.lng === "function") ? (address.geometry.location.lng()) : address.geometry.location.lng,
        }

        this.setState({
            selectedLocation: addressFormatted,
            location: location
        })

        console.log(this.mapRef, "========");


        const map = this.mapRef.current.leafletElement;
        map.fitBounds([location]);

        // this.props.onSave(this.state.location, this.state.selectedLocation)

    }

    render() {

        let contentDOM = <div className="container">
            <div className="autocomplete-wrapper">
                { (window.google && window.google.maps && window.google.maps.places) &&
                    <Autocomplete
                        onPlaceSelected={(place) => {
                            this.setAddress(place);
                            console.log(place, this.mapRef)
                            // this.setState({ location: {
                            //     lat: place.geometry.location.lat(),
                            //     lng: place.geometry.location.lng(),
                            // }}, function() {
                            //     console.log(this.mapRef)
                            //     // const map = this.mapRef.current.leafletElement;
                            //     // map.setView(this.state.location, 18);
                            // })
                        }}
                        types={['address']}
                    />
                }
            </div>
            { (this.state.selectedLocation) &&
                <div className="selected-address">
                    <p><strong>Selected address: </strong></p>
                    <p>{
                        (this.state.selectedLocation.streetHouse || "") + " " +
                        (this.state.selectedLocation.city || "") + " " +
                        (this.state.selectedLocation.postcode || "") + " " +
                        (this.state.selectedLocation.country || "")
                    }</p>
                    { (this.props.size === "big") &&
                        <IonButton style={{ marginTop: 8 }} fill="outline" color="dark" onClick={() => { this.save(); }}>Use this address</IonButton>
                    }
                </div>
            }
            <div className="map-container">
                <Map className="markercluster-map" center={this.state.center} zoom={this.state.zoom} ref={this.mapRef} zoomControl={false} maxZoom={20} onClick={(e) => { this.onMapClick(e.latlng) }}>
                    <TileLayer
                      attribution="&copy; <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> &copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
                      url={window.globalVars.mapTileServer}
                    />
                    { ((this.state.location || (this.state.coordinates && this.state.coordinates[0]) ) && this.state.type === "point") &&
                        <Marker
                            position={this.state.location ? [this.state.location.lat, this.state.location.lng] : [this.state.coordinates[0].lat, this.state.coordinates[0].lng]}
                            onClick={this.onMarkerClick}
                            icon={new divIcon({className: 'marker', html: ` <div class="marker-custom" style="background-color:#4a69bb;"/ >`}) }
                        ></Marker>
                    }
                </Map>
              </div>
              { (this.state.geocodeResults) &&
                  <IonSelect multiple={false} okText="Save" onIonChange={(e) => {this.setState({ selectedLocation: e.target.value} )}}>
                      { this.state.geocodeResults.map(field => {
                          return <IonSelectOption key={field.formatted_address} selected={this.state.selectedLocation === field.formatted_address} value={field.formatted_address}>{field.formatted_address}</IonSelectOption>
                      }) }
                  </IonSelect>
              }
              <IonActionSheet
                  isOpen={this.state.geocodeResults !== null}
                  header={"Select Address"}
                  onDidDismiss={() => { this.setState({ geocodeResults: null }) }}
                  buttons={this.state.geocodeResults ? this.state.geocodeResults.map(item => {
                      return {
                          text: item.formatted_address,
                          handler: () => { this.setAddress(item) }
                      }
                  }) : []}
                >
              </IonActionSheet>
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
                <div className="location-picker-modal">
                    {contentDOM}
                </div>
            )
        }

        return (
            <IonModal
                isOpen={this.props.open}
                className="location-picker-modal"
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

export default withIonLifeCycle(LocationPickerModal);
