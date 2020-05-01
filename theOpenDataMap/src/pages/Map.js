import { withIonLifeCycle } from '@ionic/react';
// import { CachedTileLayer } from '@yaga/leaflet-cached-tile-layer';
import { divIcon } from 'leaflet';
import React from 'react';
import { FeatureGroup, Map, Marker, Polygon, Polyline, TileLayer } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'react-leaflet-markercluster/dist/styles.min.css';
import '../styles/Map.scss';

// const MapCacheLayer= () =>{
//
//     console.log("Adding caching")
//     return <LeafletConsumer>
//         {
//             context => {
//                 new CachedTileLayer(window.globalVars.mapTileServer, {
//                     attribution: "&copy; <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> &copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
//                     databaseName: "tile-cache-data",
//                     databaseVersion: 1,
//                     objectStoreName: "TCD",
//                     crawlDelay: 500,
//                     maxAge: 1000 * 60 * 60 * 24 * 30,
//                 }).addTo(context.map)
//                 return <div />
//             }
//         }
//     </LeafletConsumer>
//
// }

class MapC extends React.Component {

    constructor(props) {
        super(props);
        // this.mapRef = createRef();
        // this.groupRef = createRef();
        this.preventScrollEventFiring = false;
        this.state = {
            zoom: 13,
            center: [51.505, -0.09],
            locations: null,
            visibleLocations: null,
            locationDetailsModalId: null,
            locationDetailsModalData: null,
            locationDetailsModal: false,
            searchBarActive: false,
            locationFilter: null,
            citySelectorModal: false,
            citySelectorModalType: null,
            allFilters: [],
            selectedFilters: [],
            locationListModal: "hidden",
            visibleLocationListLocations: [],

        }
    }

    shouldComponentUpdate(nextProps, nextState) {

        //console.log("SHOULD? ", nextProps.visibleLocations, this.props.visibleLocations)
        if (nextProps.visibleLocations && this.props.visibleLocations && nextProps.visibleLocations.length === this.props.visibleLocations.length) {
            // console.log("SHOULD NO");
            return false;
        }

        // if (nextProps.visibleLocations && this.props.visibleLocations && nextProps.visibleLocations.length !== 0 && this.props.visibleLocations.length !== 0 && nextProps.visibleLocations.length !== this.props.visibleLocations.length && nextProps.visibleLocations[0].id === this.props.visibleLocations[0].id) {
        //     console.log("SHOULD NO HERE");
        //     return false;
        // }

        // console.log("SHOULD YES")
        return true;
    }

    render() {
        return (
            <div id="map-container" data-data={this.props.mapTest}>
                { (true) &&
                    <Map id="main-map" className="markercluster-map" center={this.state.center} zoom={this.state.zoom} ref={this.props.mapRef} zoomControl={false} maxZoom={19} onMouseMove={() => { this.props.mouseMove() }}>
                        <TileLayer
                          attribution="&copy; <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> &copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
                          url={window.globalVars.mapTileServer}
                        />
                        <FeatureGroup ref={this.props.groupRef}>
                            <MarkerClusterGroup>
                            { (this.props.visibleLocations) && (this.props.visibleLocations.map((location, i) => {
                                if ( (location.locationPoint && location.marker && location.locationPoint.x && location.locationPoint.y) ) {
                                    return (
                                        <Marker
                                            id={"marker-" + location.id}
                                            key={location.id}
                                            position={[location.locationPoint.x, location.locationPoint.y]}
                                            onClick={this.props.onMarkerClick}
                                            icon={new divIcon({className: 'marker', html: `
                                                <div class="marker-custom" id="marker-${location.id}" data-image="${(location.marker && location.marker.image) ? "true" : "false"}">
                                                    ${ (location.marker && location.marker.image) ?
                                                        "<div><img src='" + location.marker.image + "' /></div>"
                                                        :
                                                        `<div style=\"background-color:${location.marker ? location.marker.color : '#4a69bb'};\">
                                                            ${ (location.marker && location.marker.icon) ? ('<i class="' + location.marker.icon + '"></i>') : '<i></i>' }
                                                        </div>`
                                                    }
                                                    <span></span>
                                                </div>
                                            `})
                                            }
                                        ></Marker>
                                    )
                                }
                                if (location.locationPath) {
                                    let linePath = location.locationPath.replace(/\(/g, '\[').replace(/\)/g, '\]');
                                    linePath = JSON.parse(linePath);
                                    return (
                                        <Polyline
                                            key={location.id}
                                            positions={linePath}
                                            onClick={(e) => { this.props.onMarkerClick(e, "path", linePath) } }
                                            id={"path-" + location.id}
                                            color={location.path.borderColor}
                                            weight={parseInt(location.path.borderWeight)}
                                            opacity={parseFloat(location.path.borderOpacity)}
                                        />
                                    );
                                }
                                if (location.locationPolygon) {
                                    let polygonPath = location.locationPolygon;
                                    polygonPath = polygonPath.replace(/\(/g, '\[').replace(/\)/g, '\]');
                                    polygonPath = JSON.parse(polygonPath);
                                    return (
                                        <Polygon
                                            key={location.id}
                                            positions={polygonPath}
                                            onClick={(e) => { this.props.onMarkerClick(e, "polygon", polygonPath) } }
                                            id={"poly-" + location.id}
                                            color={location.polygon.borderColor}
                                            weight={parseInt(location.polygon.borderWeight)}
                                            opacity={parseFloat(location.polygon.borderOpacity)}
                                            fillOpacity={parseFloat(location.polygon.fillOpacity)}
                                            fillColor={location.polygon.fillColor}
                                        />
                                    );
                                }
                            })) }
                            </MarkerClusterGroup>
                         </FeatureGroup>
                         {/*<MapCacheLayer />*/}
                    </Map>
                }
            </div>
        );
    }

};


export default withIonLifeCycle(MapC);
