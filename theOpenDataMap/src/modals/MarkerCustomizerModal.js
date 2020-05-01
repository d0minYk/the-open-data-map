import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonModal, IonRange, IonSearchbar, IonTitle, IonToolbar, withIonLifeCycle } from '@ionic/react';
import { close } from 'ionicons/icons';
import { divIcon } from 'leaflet';
import React, { createRef } from 'react';
import { Map, Marker, Polygon, Polyline, TileLayer } from 'react-leaflet';
import 'react-leaflet-markercluster/dist/styles.min.css';
import '../styles/LocationCustomizerModal.scss';

const DUMMY_MARKER = {
    lat: 16.5666658,
    lng: 102.6072654,
}

const DUMMY_PATH = [
    {lat: 16.565001712417242, lng: 102.60874271392824},
    {lat: 16.56529993531471, lng: 102.60772347450258},
    {lat: 16.56639426150385, lng: 102.60662437223802},
    {lat: 16.567860519811003, lng: 102.60874271392824},
    {lat: 16.566441404897738, lng: 102.61056661605836},
]

class LocationCustomizerModal extends React.Component {

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
            style: {},
            selectedCoordinates: true,
        }
    }

    componentWillReceiveProps(nextProps) {

        this.setState({
            modal: nextProps.open
        })

        if (this.state.modal === nextProps.open) {
            return;
        }

        let type;
        let selectedCoordinates = true;
        let coordinates;

        if (nextProps.data) {

            if (nextProps.source === "dataset-content-editor") {
                type = nextProps.data.location.type;
                coordinates = nextProps.data.location.data;
            } else if (nextProps.source === "filter-editor") {
                type = nextProps.type;
                coordinates = [];
            } else {
                type = nextProps.data.___location_type___;
                coordinates = nextProps.data.___coordinates___;
            }

            if (type === "point") {

                if (coordinates && coordinates[0]) {
                    coordinates = coordinates[0];
                } else {
                    selectedCoordinates = false
                    coordinates = DUMMY_MARKER
                }

                this.setState({ style: (nextProps.source === "dataset-content-editor") ? nextProps.data.style.___marker_style___ : ( (nextProps.source === "filter-editor") ? nextProps.data : nextProps.data.___marker_style___ ) } )

                setTimeout(function() {
                    if (this.mapRef && this.mapRef.current) { this.mapRef.current.leafletElement.setView(coordinates, 16); }
                }.bind(this), 1200)

            } else if (type === "path") {

                if (!coordinates || coordinates.length === 0) {
                    coordinates = DUMMY_PATH
                    selectedCoordinates = false;
                }

                this.setState({ style: (nextProps.source === "dataset-content-editor") ? nextProps.data.style.___path_style___ : ( (nextProps.source === "filter-editor") ? nextProps.data : nextProps.data.___path_style___ ) } )

                setTimeout(function() {
                    if (this.mapRef && this.mapRef.current) {
                        this.mapRef.current.leafletElement.fitBounds(coordinates);
                    }
                }.bind(this), 1200)

            } else if (type === "polygon") {

                if (!coordinates || coordinates.length === 0) {
                    coordinates = DUMMY_PATH
                    selectedCoordinates = false
                }

                this.setState({
                    style: (nextProps.source === "dataset-content-editor") ?
                        nextProps.data.style.___polygon_style___ :
                        ( (nextProps.source === "filter-editor") ? nextProps.data : nextProps.data.___polygon_style___ )
                })

                setTimeout(function() {
                    if (this.mapRef && this.mapRef.current) {
                        this.mapRef.current.leafletElement.fitBounds(coordinates);
                    }
                }.bind(this), 1200)

            }

        }

        let keywords = [];

        if (nextProps.locationEntity) {

            console.log("LOCATION=============== SUGEST ICONS=========", nextProps.locationEntity)

            let location = nextProps.locationEntity;

            if (location.originalFields) {

                for (let key in location.originalFields) {

                    let value = location.originalFields[key];

                    if (!key.startsWith("___") && !key.endsWith("___")) {

                        console.log(key + ": ", value)

                        if (typeof value === "string" && value) {
                            keywords.push(value)
                        } else if (key === "categories") {
                            for (let category in value) {
                                keywords.push(value[category].text)
                            }
                        } else if (key === "features") {
                            for (let feature in value) {
                                keywords.push(value[feature].text)
                            }
                        }

                    }

                }

                console.log(keywords)

            }

        }

        if (nextProps.datasetEntity) {

            console.log("DATASET SUGEST ICONS=========")

            if (nextProps.datasetEntity.name) { keywords.push(nextProps.datasetEntity.name) }
            if (nextProps.datasetEntity.description) { keywords.push(nextProps.datasetEntity.description) }

            if (nextProps.datasetEntity.features) {

                if (nextProps.datasetEntity.features.default) {
                    for (let i = 0; i < nextProps.datasetEntity.features.default.length; i++) {
                        if (nextProps.datasetEntity.features.default[i].text) {
                            keywords.push(nextProps.datasetEntity.features.default[i].text)
                        } else {
                            keywords.push(nextProps.datasetEntity.features.default[i])
                        }
                    }
                }

                if (nextProps.datasetEntity.features.filterRules) {
                    Object.keys(nextProps.datasetEntity.features.filterRules).map(key => {
                        keywords.push(nextProps.datasetEntity.features.filterRules[key].name)
                    })
                }

            }

            if (nextProps.datasetEntity.categories) {

                if (nextProps.datasetEntity.categories.default) {
                    for (let i = 0; i < nextProps.datasetEntity.categories.default.length; i++) {
                        if (nextProps.datasetEntity.categories.default[i].text) {
                            keywords.push(nextProps.datasetEntity.categories.default[i].text)
                        } else {
                            keywords.push(nextProps.datasetEntity.categories.default[i])
                        }
                    }
                }

                if (nextProps.datasetEntity.categories.filterRules) {
                    Object.keys(nextProps.datasetEntity.categories.filterRules).map(key => {
                        keywords.push(nextProps.datasetEntity.categories.filterRules[key].name)
                    })
                }

            }

        }

        if (nextProps.locationEntity || nextProps.datasetEntity) {

            let iconSuggestions = [];

            if (keywords.length !== 0) {
                for (let key in window.globalVars.ICONS) {
                    let icon = window.globalVars.ICONS[key];
                    let match = null;
                    for (let i = 0; i < icon.keywords.length; i++) {
                        let keyword = icon.keywords[i]
                        for (let j = 0; j < keywords.length; j++) {
                            let keyword2 = keywords[j];
                            if (keyword.toLowerCase().indexOf(keyword2) !== -1) {
                                match = key;
                                break;
                            }
                        }
                    }
                    if (match && iconSuggestions && iconSuggestions.indexOf(key) === -1) {
                        iconSuggestions.push(key);
                    }
                }
            }

            this.setState({ iconSuggestions: iconSuggestions })

        }

        console.log("=======PROPS======", type, coordinates, selectedCoordinates, "=====================")

        this.setState({
            type: type,
            location: coordinates,
            selectedCoordinates: selectedCoordinates,
        })



        setTimeout(function() {
            console.log("Resize trugger")
            window.dispatchEvent(new Event('resize'));
        }, 1000)

    }

    filterIcons(value) {
        this.setState({
            iconKeywords: value ? value.trim().toLowerCase() : ""
        }, function() {

        })
    }

    handleChange(key, value) {

        console.log(key + " - " + value)

        let style = this.state.style;

        if (key === "icon") {
            delete style.image;
        }

        console.log(style);
        style[key] = value
        console.log(style);

        this.setState({ style: style })
    }

    close() {
        this.props.onClose()
    }

    render() {
        return (
            <IonModal
                isOpen={this.props.open}
                className="location-customizer-modal"
                presentingElement={(this.props.presentingElement && (window.globalVars === undefined || window.globalVars.size !== "big")) ? this.props.presentingElement.current : undefined}
                onDidDismiss={ () => { this.props.onClose(); } }
                swipeToClose={true}
            >
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Customize Appearance</IonTitle>
                        <IonButtons slot="end">
                            <IonIcon icon={close} onClick={() => { this.props.onClose() }}></IonIcon>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="location-picker-modal">
                    { (!this.state.selectedCoordinates) &&
                        <div className="no-location-selected">
                            You haven't selected any coordinates yet, once you do you can preview your selected points here
                        </div>
                    }
                    <div class="map-container">
                        <Map className="markercluster-map" center={this.state.center} zoom={this.state.zoom} ref={this.mapRef} zoomControl={false} maxZoom={20}>
                            <TileLayer
                              attribution="&copy; <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> &copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
                              url={window.globalVars.mapTileServer}
                            />
                            { (this.state.location && this.state.type === "point") &&
                                <Marker
                                    position={[this.state.location.lat, this.state.location.lng]}
                                    icon={new divIcon({className: 'marker', html: `
                                        <div class="marker-custom" data-image="${this.state.style.image ? "true" : "false"}">
                                            ${ (this.state.style.image) ?
                                                "<div><img src='" + this.state.style.image + "' /></div>"
                                                :
                                                `<div style=\"background-color:${this.state.style ? this.state.style.color : '#4a69bb'};\">
                                                    ${ (this.state.style && this.state.style.icon) ? '<i class="' + this.state.style.icon + '" />' : "<i />" }
                                                </div>`
                                            }
                                            <span />
                                        </div>`})
                                    }
                                ></Marker>
                            }
                            { (this.state.location && this.state.type === "path") &&
                                <Polyline
                                    positions={this.state.location}
                                    color={this.state.style.borderColor}
                                    weight={parseInt(this.state.style.borderWeight)}
                                    opacity={parseFloat(this.state.style.borderOpacity)}
                                />
                            }
                            { (this.state.location && this.state.type === "polygon") &&
                                <Polygon
                                    positions={this.state.location}
                                    color={this.state.style.borderColor}
                                    weight={parseInt(this.state.style.borderWeight)}
                                    opacity={parseFloat(this.state.style.borderOpacity)}
                                    fillOpacity={parseFloat(this.state.style.fillOpacity)}
                                    fillColor={this.state.style.fillColor}
                                />
                            }
                        </Map>
                  </div>
                  <div className="options">
                    { (this.state.location) &&
                        <IonList>
                            { (this.state.type === "point") &&
                                  <IonItem>
                                      <IonLabel position="stacked">Icon</IonLabel>
                                      <IonSearchbar
                                          debounce={600}
                                          showCancelButton="focus"
                                          value={this.state.iconKeywords}
                                          onIonChange={(e) => {this.filterIcons(e.target.value)}}
                                          placeholder="Search Icons"
                                      / >
                                      { (this.state.iconSuggestions && this.state.iconSuggestions.length !== 0) &&
                                          <div className="icon-suggestions">
                                              <IonLabel position="stacked">Suggetsions</IonLabel>
                                              <div className="icon-picker">
                                                  { this.state.iconSuggestions.map(key => {
                                                      let item = window.globalVars.ICONS[key]
                                                      return (
                                                          <div
                                                              style={{ backgroundColor: item.color }}
                                                              onClick={() => {
                                                                  this.handleChange("icon", key)
                                                                  this.handleChange("color", item.color)
                                                              }}
                                                              data-selected={key === this.state.icon}
                                                          >
                                                              <i className={key} />
                                                          </div>
                                                      )
                                                  }) }
                                              </div>

                                          </div>
                                      }
                                      <div className="all-icons">
                                          { (this.state.iconSuggestions && this.state.iconSuggestions.length !== 0) &&
                                              <IonLabel position="stacked">All Icons</IonLabel>
                                          }
                                          <div className="icon-picker">
                                              <div
                                                  style={{
                                                      backgroundColor: this.state.style.color || "#4a69bb",
                                                      float: 'left'
                                                  }}
                                                  onClick={() => {
                                                      this.handleChange("icon", null)
                                                  }}
                                                  data-selected={null === this.state.icon}
                                              >
                                                  <i className={"flaticon-"} />
                                              </div>
                                              { window.globalVars.ICONS && Object.keys(window.globalVars.ICONS).map(key => {

                                                  let item = window.globalVars.ICONS[key];

                                                  if (this.state.iconKeywords) {
                                                      let match = false;
                                                      for (let i = 0; i < item.keywords.length; i++) {
                                                          if (item.keywords[i].toLowerCase().indexOf(this.state.iconKeywords) > -1) {
                                                              match = true;
                                                              break;
                                                          }
                                                      }
                                                      if (!match) return null;
                                                  }

                                                  return (
                                                      <div
                                                          style={{ backgroundColor: item.color }}
                                                          onClick={() => {
                                                              this.handleChange("icon", key)
                                                              this.handleChange("color", item.color)
                                                          }}
                                                          data-selected={key === this.state.icon}
                                                      >
                                                          <i className={key} />
                                                      </div>
                                                  )
                                              }) }
                                          </div>
                                      </div>
                                  </IonItem>
                              }
                              { (this.state.type === "point") &&
                                  <IonItem>
                                      <IonLabel position="stacked">Override default color</IonLabel>
                                      <div className="color-picker">
                                          { Object.keys(window.globalVars.COLORS).map(key => {
                                              let item = window.globalVars.COLORS[key];
                                              return (
                                                  <div
                                                      onClick={() => { this.handleChange("color", item) }}
                                                      data-color={item}
                                                      style={{ backgroundColor: item }}
                                                      data-selected={item === this.state.style.color}
                                                  ></div>
                                              )
                                          }) }
                                      </div>
                                  </IonItem>
                              }
                              { (this.state.type === "point") &&
                                  <IonItem>
                                      <IonLabel position="stacked">Custom Image</IonLabel>
                                      <div className="image-picker">
                                          { window.globalVars.OWN_MARKER_IMAGES.map(item => {
                                              return (
                                                  <div
                                                      onClick={() => { this.handleChange("image", item) }}
                                                      data-image={item}
                                                      data-selected={item === this.state.style.image}
                                                  >
                                                      <img src={item} />
                                                  </div>
                                              )
                                          })}
                                      </div>
                                      <IonInput value={this.state.style.image} onIonChange={(e) => { this.handleChange("image", e.target.value); }} placeholder="Custom image (56*56 PNG)" type="text"></IonInput>
                                  </IonItem>
                              }
                              { ( (this.state.type === "path") || (this.state.type === "polygon") ) &&
                                  <IonItem>
                                      <IonLabel position="stacked">Border Color</IonLabel>
                                      <div className="color-picker">
                                          { Object.keys(window.globalVars.COLORS).map(key => {
                                              let item = window.globalVars.COLORS[key];
                                              return (
                                                  <div
                                                      onClick={() => { this.handleChange("borderColor", item) }}
                                                      data-color={item}
                                                      style={{ backgroundColor: item }}
                                                      data-selected={item === this.state.style.borderColor}
                                                  ></div>
                                              )
                                          }) }
                                      </div>
                                  </IonItem>
                              }
                              { ( (this.state.type === "path") || (this.state.type === "polygon") ) &&
                                  <IonItem>
                                      <IonLabel position="stacked">Border Weight {this.state.style.borderWeight}</IonLabel>
                                      <IonRange onIonChange={(e) => { this.handleChange("borderWeight", parseInt(e.target.value)) }} value={this.state.style.borderWeight} step="1" min="0" max="10" pin color="primary" />
                                  </IonItem>
                              }
                              { ( (this.state.type === "path") || (this.state.type === "polygon") ) &&
                                  <IonItem>
                                      <IonLabel position="stacked">Border Opacity {this.state.style.borderOpacity}</IonLabel>
                                      <IonRange onIonChange={(e) => { this.handleChange("borderOpacity", parseFloat(e.target.value).toFixed(1)) }} value={this.state.style.borderOpacity} step="0.1" min="0" max="1" pin color="primary" />
                                  </IonItem>
                              }
                              { (this.state.type === "polygon") &&
                                  <IonItem>
                                      <IonLabel position="stacked">Fill Color</IonLabel>
                                      <div className="color-picker">
                                          { Object.keys(window.globalVars.COLORS).map(key => {
                                              let item = window.globalVars.COLORS[key];
                                              return (
                                                  <div
                                                      onClick={() => { this.handleChange("fillColor", item) }}
                                                      data-color={item}
                                                      style={{ backgroundColor: item }}
                                                      data-selected={item === this.state.style.fillColor}
                                                  ></div>
                                              )
                                          }) }
                                      </div>
                                  </IonItem>
                              }
                              { (this.state.type === "polygon") &&
                                  <IonItem>
                                      <IonLabel position="stacked">Fill Opacity {this.state.style.fillOpacity}</IonLabel>
                                      <IonRange onIonChange={(e) => { this.handleChange("fillOpacity", parseFloat(e.target.value).toFixed(1)) }} value={this.state.style.fillOpacity} step="0.1" min="0" max="1" pin color="primary" />
                                  </IonItem>
                              }
                          </IonList>
                      }
                      <IonButton expand="block" onClick={() => { this.props.onSave(this.state.type, this.state.style) }}>Save</IonButton>
                  </div>
                </IonContent>
            </IonModal>
        );
    }

};

export default withIonLifeCycle(LocationCustomizerModal);
