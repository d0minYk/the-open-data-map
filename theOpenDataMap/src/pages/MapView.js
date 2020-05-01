import { Plugins } from '@capacitor/core';
import { IonButtons, IonBackButton, IonSpinner, IonAlert, IonChip, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonInput, IonList, IonPage, IonProgressBar, IonTitle, IonToast, IonToolbar, withIonLifeCycle } from '@ionic/react';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import { bookmark, closeSharp, expandOutline, locateOutline, reorderFourOutline, search, arrowBackCircleOutline } from 'ionicons/icons';
import React, { createRef } from 'react';
import CitySelectorModal from '../modals/CitySelector.js';
import Loader from '../modals/Loader.js';
import LocationPreviewItem from '../modals/LocationPreviewItem.js';
import MapLocationDetailsModal from '../modals/MapLocationDetails.js';
import Server from '../Server';
import Storage from '../Storage';
import '../styles/Map.scss';
import Map from './Map.js';
const { Geolocation } = Plugins

class MapView extends React.Component {

    constructor(props) {
        super(props);
        this.mapRef = createRef();
        this.groupRef = createRef();
        this.pageRef = createRef();
        this.mapSearchInput = createRef();
        this.preventScrollEventFiring = false;
        this.state = {
            minorError: null,
            error: null,
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
            keywords: "",
            mapBoundsFilter: null,
            floatingSearchBarBlurred: false,
            showAllFilters: false,
        }
    }

    ionViewWillLeave() {
        this.setState({
            locationListModal: "hidden",
            locationDetailsModalId: null,
            locationDetailsModalData: null,
            locationDetailsModal: false,
        })
    }

    filter() {

        let filters = this.state.selectedFilters;

        if (filters.length === 0 && !this.state.mapBoundsFilter) {
            this.setState({
                visibleLocations: this.state.locations,
                loading: false,
                visibleLocationListLocations: this.state.locations.slice(0, 20),
            })
        } else {

            let selectedFilterCount = this.state.selectedFilters.length + (this.state.mapBoundsFilter ? 1 : 0)

            let locations = this.state.locations;
            let visibleLocations = [];

            for (let i = 0; i < locations.length; i++) {

                let location = locations[i];

                let matchCount = 0;

                if (this.state.mapBoundsFilter) {
                    if ( (location.locationPoint) && (this.state.mapBoundsFilter.contains({ lat: location.locationPoint.x, lng: location.locationPoint.y })) ) {
                        matchCount++;
                    }
                }

                // if (!match) {

                    if (location.features && Object.keys(location.features).length !== 0) {

                        for (let key in location.features)  {
                            let filterHash = "feature|" + key;
                            if (filters.indexOf(filterHash) !== -1) {
                                matchCount++;
                            }
                        }

                    }

                // }

                // if (!match) {

                    if (location.categories && location.categories.length !== 0) {

                        for (let j = 0; j < location.categories.length; j++)  {
                            let filterHash = "category|" + location.categories[j];
                            if (filters.indexOf(filterHash) !== -1) {
                                matchCount++;
                            }
                        }

                    }

                // }

                // if (!match) {

                    if ( (location.cityName) && (filters.indexOf("city|" + location.cityName) !== -1) ) {
                        matchCount++;
                    }

                // }

                // if (!match) {

                    if ( (location.countryName) && (filters.indexOf("country|" + location.countryName) !== -1) ) {
                        matchCount++;
                    }

                // }

                if (matchCount === selectedFilterCount)
                    visibleLocations.push(location);

            }

            this.setState({
                visibleLocations: visibleLocations,
                visibleLocationListLocations: visibleLocations.slice(0, 20),
                loading: false,
            }, function() {

                this.preventScrollEventFiring = false;

                setTimeout(function() {
                    if (visibleLocations.length !== 0) {
                        this.fitBoundsNow();
                    }
                }.bind(this), 1000)

            })

        }

    }

    fitBoundsNow() {
        const group = this.groupRef.current.leafletElement;
        let bounds = group.getBounds();
        this.mapFitBoundsWithOffset(bounds);
    }

    loadLocationListSlice() {

        if (this.state.visibleLocations && this.state.visibleLocationListLocations && this.state.visibleLocationListLocations.length !== this.state.visibleLocations.length) {

            this.setState({
                visibleLocationListLocations: this.state.visibleLocations.slice(0, this.state.visibleLocationListLocations.length + 20)
            }, function() {
                this.preventScrollEventFiring = false;
            })

        }

    }

    async loadNewLocations(locations, noResultList, noZooming) {

        if (!locations) {
            this.setState({ loading: false, })
            return;
        }

        this.preventScrollEventFiring = false;

        let allFilters = [];
        let categoryFilters = [];
        let featureFilters = [];
        let cityFilters = [];
        let countryFilters = [];
        let selectedFilters = [];
        let counts = {}

        // locations = locations.splice(0, 500);

        for (var i = 0; i < locations.length; i++) {

            let location = locations[i];

            if (location.features && Object.keys(location.features).length !== 0) {

                for (let key in location.features)  {
                    let filterHash = "feature|" + key;
                    if (featureFilters.indexOf(filterHash) === -1) {
                        featureFilters.push(filterHash);
                    }
                    if (!counts[filterHash]) {
                        counts[filterHash] = 0
                    }
                    counts[filterHash]++
                }

            }

            if (location.categories && location.categories.length !== 0) {

                for (let j = 0; j < location.categories.length; j++)  {
                    let filterHash = "category|" + location.categories[j];
                    if (categoryFilters.indexOf(filterHash) === -1) {
                        categoryFilters.push(filterHash);
                    }
                    if (!counts[filterHash]) {
                        counts[filterHash] = 0
                    }
                    counts[filterHash]++
                }

            }

            if (location.cityName) {
                let filterHash = "city|" + location.cityName;
                if (cityFilters.indexOf(filterHash) === -1) {
                    cityFilters.push(filterHash);
                }
                if (!counts[filterHash]) {
                    counts[filterHash] = 0
                }
                counts[filterHash]++
            }

            if (location.countryName) {
                let filterHash = "country|" + location.countryName;
                if (countryFilters.indexOf(filterHash) === -1) {
                    countryFilters.push(filterHash);
                }
                if (!counts[filterHash]) {
                    counts[filterHash] = 0
                }
                counts[filterHash]++
            }

        }

        countryFilters.sort((a, b) => { return ( counts[a] < counts[b] ? 1 : -1 ) });
        cityFilters.sort((a, b) => { return ( counts[a] < counts[b] ? 1 : -1 ) });
        categoryFilters.sort((a, b) => { return ( counts[a] < counts[b] ? 1 : -1 ) });
        featureFilters.sort((a, b) => { return ( counts[a] < counts[b] ? 1 : -1 ) });

        allFilters = allFilters.concat(categoryFilters, featureFilters, countryFilters, cityFilters)

        for (let i = 0; i < allFilters.length; i++) {
            allFilters[i] = allFilters[i] + "|" + counts[allFilters[i]];
        }

        this.setState({
            locations: locations,
            visibleLocations: locations,
            visibleLocationListLocations: locations.slice(0, 20),
            loading: false,
            locationListModal: noResultList ? "hidden" : ((locations && locations.length > 0) ? "minimized" : "hidden"),
            floatingSearchBarBlurred: noResultList ? false : ((locations && locations.length > 0) ? true : false),
            allFilters: allFilters,
            selectedFilters: selectedFilters,
            iframeLoading: false,
            showAllFilters: false,
        }, function() {
            this.setState({
                locationListModal: noResultList ? "hidden" : ((locations && locations.length > 0) ? "minimized" : "hidden"),
                floatingSearchBarBlurred: noResultList ? false : ((locations && locations.length > 0) ? true : false),
            })
            setTimeout(function() {
                if ( (locations.length !== 0) && (!noZooming) ) {
                    const map = this.mapRef.current.leafletElement;
                    this.fitBoundsNow();
                    setTimeout(function() {
                        if ( (locations.length !== 0) && (!noZooming) ) {
                            let zoom = map.getZoom();
                            if (zoom >= 19) {
                                this.fitBoundsNow();
                            }
                        }
                        setTimeout(function() {
                            if ( (locations.length !== 0) && (!noZooming) ) {
                                let zoom = map.getZoom();
                                if (zoom >= 19) {
                                    this.fitBoundsNow();
                                }
                            }
                        }.bind(this), 1000)
                    }.bind(this), 500)
                }
            }.bind(this), 500)
        })

    }

    async zoomToCurrentLocation() {

        if (this.props.platform === "desktop") {
            if (window.navigator) {
                window.navigator.geolocation.getCurrentPosition(function(position) {
                if (position.coords && position.coords.latitude && position.coords.longitude) {
                    this.mapSetViewWithOffset({lat: position.coords.latitude, lng: position.coords.longitude}, 16)
                }}.bind(this), function(error) { console.log(error) });
            }
        } else if (window.globalVars.os === "android") {
            const position = await Geolocation.getCurrentPosition({options: {enableHighAccuracy: false}}).catch(e => { console.error("Failed to get location", e) });
            this.mapSetViewWithOffset({lat: position.coords.latitude, lng: position.coords.longitude}, 16)
        } else if (window.globalVars.os === "ios") {
            let cbId = await Geolocation.watchPosition({enableHighAccuracy: true}, function(position, error) {
                Geolocation.clearWatch({ id: cbId })
                if (!error && position && position.coords && position.coords.latitude && position.coords.longitude) {
                    this.mapSetViewWithOffset({lat: position.coords.latitude, lng: position.coords.longitude}, 16)
                }
            }.bind(this))
        }

    }

    componentWillUnmount() {
        window.removeEventListener("focus", this.handleFocus);
    }

    componentDidMount() {
        window.addEventListener("focus", this.handleFocus);
    }

    handleFocus() {
        setTimeout(function() { window.dispatchEvent(new Event('resize')); }, 500)
        setTimeout(function() { window.dispatchEvent(new Event('resize')); }, 1000)
        setTimeout(function() { window.dispatchEvent(new Event('resize')); }, 2000)
        setTimeout(function() { window.dispatchEvent(new Event('resize')); }, 3000)
    }

    async ionViewWillEnter() {

        document.title = "Map" + window.globalVars.pageTitle;

        if (window.parent !== window) {
            console.log("IFRAME")
            this.setState({
                iframeLoading: true,
                iframe: true,
            })
            let parentUrl = document.referrer;
            let navbar = document.getElementsByTagName('ion-tab-bar')
            console.log(navbar, "=====================================================")
            setTimeout(function() {
                if (navbar && navbar[0]) { navbar[0].style.display = 'none' }
            }.bind(this), 100)
            let myLocationBtn = document.getElementsByTagName('ion-fab-button')
            if (myLocationBtn && myLocationBtn[0]) { myLocationBtn[0].style.display = 'none' }
            let searchBar = document.getElementsByClassName('floating-search-bar')
            if (searchBar && searchBar[0]) { searchBar[0].style.display = 'none' }
            // return;
        } else {
            console.log("INOT IFRAME")
        }

        let lastLocation = await Storage.getO("lastLocation");
        let categories = await Storage.getO("categories");

        if (categories)
            categories = categories.map(item => { return { id: "-" + item.id, text: item.name } })

        this.setState({
            locationFilter: lastLocation,
            categories: categories
        }, function() {
            this.getTagSuggestions();
        })

        setTimeout(function() { window.dispatchEvent(new Event('resize')); }, 500)
        setTimeout(function() { window.dispatchEvent(new Event('resize')); }, 1000)
        setTimeout(function() { window.dispatchEvent(new Event('resize')); }, 2000)
        setTimeout(function() { window.dispatchEvent(new Event('resize')); }, 3000)

        if (this.props.match.params.locationId) {
            this.loadLocationDetailsFromHere(this.props.match.params.locationId)
            this.setState({ loading: true })
        } else if (this.props.match.params.datasetId) {
            this.datasetFromHere(this.props.match.params.datasetId)
            this.setState({ loading: true })
        } else if (this.props.match.params.query) {
            this.advancedQuery(this.props.match.params.query);
            this.setState({ loading: true })
        } else {
            // this.search();
            // let lastMapSearch = await Storage.getO("lastMapSearch")
            //
            // if (lastMapSearch) {
            //     this.setState({
            //         keywords: lastMapSearch.keywords || "",
            //     }, function() {
            //         this.loadNewLocations(lastMapSearch.results)
            //     })
            // }

        }

    }

    getTagSuggestions() {

    }

    advancedQuery(query) {

        Server.api({
            method: "get",
            url: "/api/location?fields=all&start=0&limit=10000&query=" + query + "&preservefields=true",
            then: function(res) {
                console.log(res.data, "===========================")
                this.loadNewLocations(res.data.data);
            }.bind(this),
            catch: function(code, error) {
                console.log("Err getting advanced")
                this.setState({
                    error: error,
                    locations: [],
                    visibleLocations: [],
                    visibleLocationListLocations: [],
                    allFilters: [],
                    selectedFilters: [],
                    loading: false
                })
            }.bind(this)
        })

    }

    async search(alertMinorError) {

        if (this.state.keywords.length < 2) {
            if (alertMinorError)
                this.setState({ minorError: "Enter at least 2 characters" })
            return
        }

        setTimeout(function() {
            if (this.mapSearchInput && this.mapSearchInput.current) {
                this.mapSearchInput.current.blur();
            }
        })

        this.setState({
            loading: true,
            locations: null,
            visibleLocations: null,
            locationDetailsModalId: null,
            locationDetailsModalData: null,
            locationDetailsModal: false,
            allFilters: [],
            selectedFilters: [],
            locationListModal: "hidden",
            visibleLocationListLocations: [],
            mapBoundsFilter: null,
            showAllFilters: false,
        })

        // return;

        Server.api({
            method: "get",
            url: "/location",
            params: {
                location: this.state.locationFilter,
                keywords: this.state.keywords,
                source: "mapview",
            },
            then: function(res) {
                this.loadNewLocations(res.data);
            }.bind(this),
            catch: function(code, error) {
                this.setState({
                    error: error,
                    locations: [],
                    visibleLocations: [],
                    visibleLocationListLocations: [],
                    allFilters: [],
                    selectedFilters: [],
                    loading: false
                })
            }.bind(this)
        })

    }

    async getTagSuggestions() {

        let tagSuggestions = await Storage.getO("tagSuggestions");

        let url = "/everywhere";

        if (this.state.locationFilter && this.state.locationFilter.type === "city") {
            url = "/city/" + this.state.locationFilter.cityId;
        } else if (this.state.locationFilter && this.state.locationFilter.type === "country") {
            url = "/country/" + this.state.locationFilter.countryId;
        }

        if (tagSuggestions && tagSuggestions.url === url && tagSuggestions.date + 900000 > Date.now()) {
            this.setState({ tagSuggestions: tagSuggestions.tags })
            return;
        }

        Server.api({
            method: "get",
            url: "/tag/" + url,
            then: function(res) {
                if (res.data) {
                    Storage.setO("tagSuggestions", {
                        tags: res.data,
                        url: url,
                        date: Date.now(),
                    })
                    this.setState({ tagSuggestions: res.data })
                }
            }.bind(this),
            catch: function(code, error) {
                console.error("failed to get tag suggestions", code, error);
            }.bind(this)
        })

    }

    async updateLocation(type, id, name, countryId, countryName) {

        let newLocationFilter = null;

        if (type) {

            if (countryName) {
                newLocationFilter = {
                    cityId: id,
                    cityName: name,
                    countryId: countryId,
                    countryName: countryName,
                    type: "city",
                };
            } else {
                newLocationFilter = {
                    type: "country",
                    countryId: id,
                    countryName: name
                };
            }

        }

        this.setState({
            locationFilter: newLocationFilter,
            locationFilterOpen: false
        }, function() {
            this.getTagSuggestions();
            this.search();
        })

        await Storage.setO("lastLocation", newLocationFilter)

    }

    mapFitBoundsWithOffset(coordinates) {

        console.log("@@ mapFitBoundsWithOffset()")

        if (!this.mapRef || !this.mapRef.current) {
            return;
        }

        const map = this.mapRef.current.leafletElement;

        if (typeof coordinates === "string") {
            coordinates = coordinates.replace(/\(/g,"[").replace(/\)/g,"]");
            coordinates = JSON.parse(coordinates)
        }

        map.fitBounds(coordinates, (this.props.size === "big" || this.state.locationListModal === "hidden") ? {} : {
            paddingTopLeft: [0, 60],
            paddingBottomRight: [0, 380]
        } );

        console.log("@@ mapFitBoundsWithOffset() OK")

    }

    mapSetViewWithOffset(location, zoom) {

        if (!this.mapRef || !this.mapRef.current) {
            return;
        }

        const map = this.mapRef.current.leafletElement;

        let targetLatLng = location

        if (this.props.size !== "big") {

            let offsetNum = 0;
            let clientHeight = document.getElementById("main-map").clientHeight + 50;
            let mapViewHeight = clientHeight - 400;
            let offsetFromMiddleToBottomSlider = clientHeight / 2 - 400;
            offsetNum = (mapViewHeight - offsetFromMiddleToBottomSlider) / 2;

            console.log("===============mapSetViewWithOffset=============",
            "clientHeight: " + clientHeight, "mapViewHeight: " + mapViewHeight, "offsetFromModdleToBottomSlider: " + offsetFromMiddleToBottomSlider, "OffsetNum: " + offsetNum + " !!!!!!!!",
            )

            let targetPoint = map.project({ lat: location.lat, lng: location.lng }, zoom).subtract([0, (offsetNum < 0 ? (offsetNum + 22) : (-offsetNum + 22))])
            targetLatLng = map.unproject(targetPoint, zoom);

        }

        map.setView(targetLatLng, zoom);
        this.setState({ floatingSearchBarBlurred: true })
    }

    onListClick = (locationId, location) => {
        this.loadLocationDetails(locationId);
        this.setState({ locationListModal: 'minimized' })
        if (location && location.x && location.y) {
            this.mapSetViewWithOffset({ lat: location.x, lng: location.y }, 18)
        }
        // TODO paths
    }

    onMarkerClick = (marker, type, coordinates) => {

        if (!this.mapRef || !this.mapRef.current) {
            return;
        }

        const map = this.mapRef.current.leafletElement;
        let locationId = (marker && marker.sourceTarget) ? marker.sourceTarget.options.id.split("-")[1] : null;

        if (!type) {
            if (marker.latlng) {
                this.mapSetViewWithOffset(marker.latlng, 18)
            } else {
                this.mapSetViewWithOffset(marker, 18)
            }
        } else if (type === "path") {
            this.mapFitBoundsWithOffset(coordinates)
        } else if (type === "polygon") {
            this.mapFitBoundsWithOffset(coordinates)
        }

        this.loadLocationDetails(locationId);

    }

    loadLocationDetails(locationId) {

        this.setState({
            locationDetailsModalId: locationId,
            locationDetailsModal: true,
        })

    }

    datasetFromHere(datasetId) {

        Server.api({
            method: "get",
            url: "/dataset/" + datasetId + "/locations",
            source: "map-view",
            then: function(res) {
                this.loadNewLocations(res.data);
            }.bind(this),
            catch: function(code, error) {
                this.setState({
                    error: error,
                    loading: null
                })
            }.bind(this)
        })

    }

    loadSavedLocations() {

        if (!window.globalVars.user) {
            this.props.history.push("/login");
            return;
        }

        if (!window.globalVars.savedLocations || Object.keys(window.globalVars.savedLocations).length === 0) {
            console.log("No locations");
            return;
        }

        this.setState({
            locations: null,
            keywords: ""
        }, function() {
            let arr = [];
            for (let key in window.globalVars.savedLocations)
                arr.push(window.globalVars.savedLocations[key])

            this.loadNewLocations(arr);
        })

    }

    loadLocationDetailsFromHere(locationId) {

        Server.api({
            method: "get",
            url: "/location/" + locationId,
            source: "map-view",
            then: function(res) {

                document.title = res.data.name + window.globalVars.pageTitle;

                this.loadNewLocations([res.data], true, true);

                this.setState({
                    locationDetailsModalId: 0,
                    locationDetailsModalData: res.data,
                    locationDetailsModal: true,
                }, function() {

                    setTimeout(function() {
                        this.onMarkerClick(res.data.locationPoint ? { lat: res.data.locationPoint.x, lng: res.data.locationPoint.y } : null, (res.data.locationPath ? "path" : (res.data.locationPolygon ? "polygon" : null) ), (res.data.locationPath || res.data.locationPolygon || null) )
                    }.bind(this), 1000)

                })

            }.bind(this),
            catch: function(code, error) {
                this.setState({
                    error: error,
                    loading: null,
                    allFilters: [],
                    selectedFilters: [],
                    locations: [],
                    visibleLocations: [],
                    visibleLocationListLocations: [],
                })
                // this.props.history.push("/error/" + code + "/" + error)
            }.bind(this)
        })

    }

    filterByMapBounds = () => {

        let mapBoundsFilter = this.state.mapBoundsFilter;

        if (!mapBoundsFilter) {

            if (!this.mapRef || !this.mapRef.current) {
                return;
            }

            const map = this.mapRef.current.leafletElement;

            mapBoundsFilter = map.getBounds();

        } else {
            mapBoundsFilter = null;
        }

        this.setState({
            mapBoundsFilter: mapBoundsFilter,
            selectedFilters: []
        }, function() {
            this.filter();
        })

    }

    handleInputFocus = () => {
        this.setState({
            searchBarActive: true
        })
    }

    handleInputBlur = () => {
        setTimeout(function() {
            this.setState({
                searchBarActive: false
            })
        }.bind(this), 100);
    }

    onMapSearchAreaClick() {

        if (this.state.floatingSearchBarBlurred) {

            setTimeout(function() {
                if (this.mapSearchInput.current) {
                    this.mapSearchInput.current.setFocus();
                }
            }.bind(this), 200)

        }

        this.setState({
            floatingSearchBarBlurred: false,
            locationListModal: "hidden",
            locationDetailsModal: false,
            locationDetailsModalId: null,
        })

    }

    render() {
        return (
          <IonPage data-page="map" className="map-page" ref={this.pageRef}>
              <IonHeader>
                <IonToolbar>
                  <IonTitle></IonTitle>
                </IonToolbar>
              </IonHeader>
            <IonContent data-iframe={(this.state.iframe) ? "true" : "false"}>
                { (this.state.iframeLoading) &&
                    <div className="iframe-loading">
                        <Loader show={true} />
                    </div>
                }
                 { ( this.state.loading && this.props.size !== "big" && this.state.locationListModal === "hidden" ) && <div className="progress-bar"> <IonProgressBar type="indeterminate"></IonProgressBar><br /> </div> }
                <div
                    className="floating-search-bar"
                    data-open={this.state.searchBarActive}
                    data-hidden={false}
                    data-blurred={this.state.floatingSearchBarBlurred ? "true" : "false"}
                    onClick={() => { this.onMapSearchAreaClick() }}
                >
                    { (this.state.locationFilterOpen) &&
                        <div className="location-filter-picker" onClick={() => { this.onMapSearchAreaClick() }}>
                            <span
                                onClick={() => { this.setState({
                                    citySelectorModalType: "city",
                                    citySelectorModal: true
                                }) }}
                                data-selected={(this.state.locationFilter && this.state.locationFilter.type === "city")}
                            >
                                    <span>Select City</span>
                                    {(this.state.locationFilter && this.state.locationFilter.type === "city") && <span> {this.state.locationFilter.name} </span> }
                            </span>
                            <span
                                onClick={() => { this.setState({
                                    citySelectorModalType: "country",
                                    citySelectorModal: true
                                }) }}
                                data-selected={(this.state.locationFilter && this.state.locationFilter.type === "country")}
                            >
                                    <span>Select Country</span>
                                    {(this.state.locationFilter && this.state.locationFilter.type === "country") && <span> {this.state.locationFilter.name} </span> }
                            </span>
                            <span
                                data-selected={(!this.state.locationFilter)}
                                onClick={() => { this.updateLocation() }}
                            >
                                <span>Everywhere</span>
                            </span>
                        </div>
                    }
                    <div className="search-fields" onClick={() => { this.onMapSearchAreaClick() }}>
                        <IonIcon icon={search} />
                        <IonInput
                            ref={this.mapSearchInput}
                            placeholder="Search for..."
                            value={this.state.keywords}
                            onIonChange={(e) => {
                                // if (e.target.value === "") {
                                //     this.setState({ featureSuggestions: null })
                                // }
                                console.log("onIonchange " + e.target.value + " from " + this.state.keywords)
                                if (this.state.keywords !== e.target.value)
                                    this.setState({ keywords: e.target.value })
                            }}
                            onIonBlur={() => { console.log("BLUR"); setTimeout(function() { window.dispatchEvent(new Event('resize')); }, 500) }}
                            onKeyDown={(e, b) => { if (e.keyCode === 13) { this.search(true); } }}
                            onIonFocus={() => { this.onMapSearchAreaClick(); }}
                            onClick={() => { this.onMapSearchAreaClick() }}
                        />
                        <div className="location-filter" onClick={() => { this.setState({ locationFilterOpen: !this.state.locationFilterOpen }) }}>
                            { (this.state.locationFilter && ( this.state.locationFilter.type === "city" || this.state.locationFilter.type === "country" ) ) ?
                                <span>in {this.state.locationFilter.type === "city" ? this.state.locationFilter.cityName : this.state.locationFilter.countryName}</span>
                                :
                                <span>Everywhere</span>
                            }
                        </div>
                        { ((this.state.locations && this.state.locations.length !== 0) || this.state.keywords) &&
                            <IonIcon style={{ margin: 0, cursor: 'pointer', paddingLeft: 6 }} icon={closeSharp} onClick={() => {
                                this.setState({
                                    keywords: "",
                                    locations: [],
                                    visibleLocations: [],
                                    visibleLocationListLocations: [],
                                    loading: false,
                                    locationListModal: "hidden",
                                    locationDetailsModalId: null,
                                    locationDetailsModalData: null,
                                    allFilters: [],
                                    selectedFilters: [],
                                })
                            }} />
                        }
                    </div>
                    { /* (!this.state.searchBarActive) &&
                        <div className="result-info">
                            { ( (this.state.locations) && (this.state.locations.length === 0)) && <p>No results</p> }
                            { ( (this.state.locations) && (this.state.locations.length !== 0)) && <p>Showing {this.state.locations.length} results</p> }
                            { (this.state.loading) && <p>Loading...</p> }
                        </div>
                    */ }
                    <div className="tag-suggestions" onClick={() => { this.setState({ floatingSearchBarBlurred: false }) }}>
                        <div className="saved-places" onClick={() => { this.loadSavedLocations(); }}>
                            <IonIcon icon={bookmark} />
                        </div>
                        { this.state.tagSuggestions && this.state.tagSuggestions.map(item => {

                            if (this.state.keywords) {
                                let tags = this.state.keywords.split(",").map(item => item.replace(":feature", "").replace(":category", ""));
                                let match = false;
                                for (let i = 0; i < tags.length; i++) {
                                    if (item.name.indexOf(tags[i]) !== -1) {
                                        match = true;
                                        break;
                                    }
                                }
                                if (!match) {
                                    return null
                                }
                            }

                            return (
                                <IonChip key={item.type + "_" + item.name} className="colored selectable" onClick={() => {

                                    let existingKeywords = this.state.keywords.trim();
                                    // if (existingKeywords) {
                                    //     existingKeywords += ", "
                                    // }
                                    // existingKeywords += item.type + ":" + item.name;

                                    existingKeywords = item.type + ":" + item.name + ",";

                                    console.log(item.features, "========")

                                    // if (item.type === "category" && item.features) {
                                    //     this.setState({
                                    //         featureSuggestions: item.features.map(item => {
                                    //             let newItem = {}
                                    //             newItem.name = item;
                                    //             let featureObj = this.state.tagSuggestions.filter(feature => { return (feature.type === "feature" && feature.name === item) })
                                    //             newItem.count = (featureObj && featureObj[0]) ? featureObj[0].count : 0;
                                    //             return newItem;
                                    //         })
                                    //     })
                                    // }

                                    this.setState({ keywords: existingKeywords }, function() { this.search() })
                                }} data-type={item.type}>{item.name} <span>{item.count}</span></IonChip>
                            )
                        }) }
                        { /*this.state.featureSuggestions && this.state.featureSuggestions.map(item => {
                            return (
                                <IonChip key={"feature_" + item.name} className="colored selectable" onClick={() => {
                                    let existingKeywords = this.state.keywords.trim();
                                    if (existingKeywords) {
                                        existingKeywords += ", "
                                    }
                                    if (existingKeywords.indexOf("feature:" + item.name) !== -1) {
                                        return;
                                    }
                                    existingKeywords += "feature:" + item.name;
                                    this.setState({ keywords: existingKeywords }, function() { this.search() })
                                }} data-type="feature">{item.name} <span>{item.count}</span></IonChip>
                            )
                        }) */ }
                    </div>
                    { (this.props.size === "small" && this.state.locationDetailsModal ) &&
                        <IonIcon className="location-mobile-back-btn" icon={arrowBackCircleOutline} onClick={() => {
                            if (this.props.size === "small" && this.state.locations && this.state.locations.length > 1) {
                                this.setState({
                                    locationDetailsModal: false,
                                    // locationDetailsModalId: null,
                                })
                                // console.log("HERE")
                                // setTimeout(function() { window.dispatchEvent(new Event('resize')); })
                            } else {
                                this.props.history.goBack()
                            }
                        }} />
                    }
                </div>
                <Map
                    visibleLocations={this.state.visibleLocations}
                    mapRef={this.mapRef}
                    groupRef={this.groupRef}
                    onMarkerClick={this.onMarkerClick}
                    mouseMove={() => {
                        if (this.mapSearchInput && this.mapSearchInput.current) {
                            this.mapSearchInput.current.blur();
                        }
                    }}
                />
              <IonFab vertical="bottom" horizontal="end" slot="fixed">
                  <IonFabButton onClick={() => { this.zoomToCurrentLocation() }}><IonIcon icon={locateOutline} /></IonFabButton>
                  { (this.state.locations && this.state.locations.length > 0) &&
                      <IonFabButton id="fit-bounds-btn" onClick={() => {
                          const group = this.groupRef.current.leafletElement;
                          let bounds = group.getBounds();
                          this.mapFitBoundsWithOffset(bounds);
                      } }><IonIcon icon={expandOutline} mode="md" /></IonFabButton>
                  }
                  { (this.state.locations && this.state.locations.length > 0) &&
                      <IonFabButton id="show-match-list-btn" onClick={() => { this.setState({
                          locationListModal: "minimized",
                          floatingSearchBarBlurred: true,
                      }) } }><IonIcon icon={reorderFourOutline} mode="md" /></IonFabButton>
                  }
              </IonFab>
              <MapLocationDetailsModal
                  {...this.props}
                  presentingElement={this.pageRef}
                  open={this.state.locationDetailsModal}
                  iframe={this.state.iframe}
                  id={this.state.locationDetailsModalId}
                  data={this.state.locationDetailsModalData}
                  onChildLoad={(marker, type, coordinates) => { this.onMarkerClick(marker, type, coordinates) }}
                  onClose={() => {

                      this.setState({
                          locationDetailsModal: false,
                          locationDetailsModalId: null,
                      })

                      setTimeout(function() { window.dispatchEvent(new Event('resize')); })

                  }}
                  onOpen={() => { this.setState({ locationDetailsModal: true }) }}
              />
          </IonContent>
          { (this.state.iframe) &&
              <a className="logo" href="https://theopendatamap.com" target="_blank" style={{ zIndex: 100000 }}>
                  <img src={process.env.PUBLIC_URL + '/assets/icon/logo-purple.png'}  />
              </a>
          }
          { (this.props.size === "big") ?
              <div className="big-location-results" data-iframe={(this.state.iframe) ? "true" : "false"} onScroll={(e) => {

                  if (this.preventScrollEventFiring) {
                      return
                  }

                  if (e.target.clientHeight + e.target.scrollTop + 50 > e.target.scrollHeight) {
                      this.preventScrollEventFiring = true;
                      this.loadLocationListSlice();
                  }

              }}>

                  <p className="location-count">Displaying {this.state.visibleLocations ? this.state.visibleLocations.length : "0"} of {this.state.locations ? this.state.locations.length: "0"} locations. Use the below tags to filter your matches.</p>
                  { (this.state.allFilters.length !== 0) &&
                    <div className="filters">
                        <IonChip onClick={() => { this.filterByMapBounds() }} className="colored selectable" data-type="country" data-selected={(this.state.mapBoundsFilter !== null) ? "true" : "false"}>Current map bounds</IonChip>
                        { this.state.allFilters.map((item, i) => {
                            let parts = item.split("|");
                            let hash = parts[0] + "|" + parts[1];
                            if (!this.state.showAllFilters && i > 19) return null;
                            return (
                                <IonChip key={hash} className="colored selectable" data-type={parts[0]} data-selected={(this.state.selectedFilters.indexOf(hash) !== -1) ? "true" : "false"} onClick={() => {
                                    this.setState({
                                        loading: true
                                    }, function() {
                                        let selectedFilters = this.state.selectedFilters;
                                        let index = selectedFilters.indexOf(hash);
                                        if (index === -1) {
                                            selectedFilters.push(hash);
                                        } else {
                                            selectedFilters.splice(index, 1)
                                        }
                                        this.setState({ selectedFilters: selectedFilters }, function() {
                                            this.filter()
                                        })
                                    })
                                }}>{parts[1]} <span>{parts[2]}</span></IonChip>
                            )
                        }) }
                        { (this.state.allFilters.length > 20) && <IonChip className="colored" data-type="country" onClick={() => { this.setState({ showAllFilters: !this.state.showAllFilters }) }}> { (this.state.showAllFilters) ? "Show less filters" : "Show all filters ..." } </IonChip> }
                    </div>
                  }
                  { ( (this.state.visibleLocationListLocations) && (this.state.visibleLocationListLocations.length !== 0) ) &&
                      <IonList className="location-list">
                          { this.state.visibleLocationListLocations.map(item => {
                              return (
                                  <LocationPreviewItem
                                      key={item.id}
                                      onSelect={(locationId, location) => { this.onListClick(locationId, location) }}
                                      onClick={() => {  }}
                                      location={item}
                                  />
                              )
                          }) }
                      </IonList>
                  }
                  { (this.state.loading) &&
                      <IonList className="location-list loading">
                         <IonSpinner className="big" name="crescent" />
                      </IonList>
                  }
              </div>
              :
              <SwipeableDrawer
                  anchor="bottom"
                  disableBackdropTransition={false}
                  open={(this.state.locationListModal !== "hidden")}
                  onClose={ () => { this.setState({ locationListModal: "hidden" }) } }
                  onOpen={ () => { this.setState({ locationListModal: "minimized" }) } }
                  onScroll={(e) => {
                      e.stopPropagation();
                  }}
              >
                  <div className="swipeable-drawer-body" data-drawer="location-list" data-scrolled-status={this.state.locationListModal} onScroll={(e) => {

                      // console.log(e.target.scrollTop + " - " + e.target.clientHeight)

                     // this.setState({ locationListModal: ( (e.target.clientHeight - e.target.scrollTop <= 300 && e.target.scrollHeight !== e.target.clientHeight) ? "maximized" : "minimized") })

                      this.setState({ locationListModal: ( (e.target.scrollTop <= 0 && e.target.scrollHeight !== e.target.clientHeight) ? "minimized" : "maximized") })

                       if (this.preventScrollEventFiring) {
                           return
                       }

                      if (e.target.clientHeight + e.target.scrollTop + 50 > e.target.scrollHeight) {
                          this.preventScrollEventFiring = true;
                          this.loadLocationListSlice();
                      }

                  }}>
                      { (this.state.loading && this.props.size !== "big") && <div className="progress-bar"> <IonProgressBar type="indeterminate"></IonProgressBar><br /> </div> }
                      <div className="list-header">
                          { (!this.state.iframe) && <div className="drag-indicator"></div> }
                          { (this.state.iframe) && <div style={{ fontSize: '1.6em', cursor: 'pointer', margin: 16, display: 'block', textAlign: 'right' }}><IonIcon icon={closeSharp} onClick={() => { this.setState({ locationListModal: 'hidden' }) }} className="close-btn" /></div> }
                          <p className="location-count">Displaying {this.state.visibleLocations ? this.state.visibleLocations.length : "0"} of {this.state.locations ? this.state.locations.length: "0"} locations. Use the below tags to filter your matches.</p>
                          { (this.state.allFilters.length !== 0) &&
                            <div className="filters">
                                <IonChip onClick={() => { this.filterByMapBounds() }} className="colored selectable" data-type="country" data-selected={(this.state.mapBoundsFilter !== null) ? "true" : "false"}>Current map bounds</IonChip>
                                { this.state.allFilters.map((item, i) => {
                                    let parts = item.split("|");
                                    let hash = parts[0] + "|" + parts[1];
                                    if (!this.state.showAllFilters && i > 19) return null;
                                    return (
                                        <IonChip key={hash} className="colored selectable" data-type={parts[0]} data-selected={(this.state.selectedFilters.indexOf(hash) !== -1) ? "true" : "false"} onClick={() => {
                                            this.setState({
                                                loading: true
                                            }, function() {
                                                let selectedFilters = this.state.selectedFilters;
                                                let index = selectedFilters.indexOf(hash);
                                                if (index === -1) {
                                                    selectedFilters.push(hash);
                                                } else {
                                                    selectedFilters.splice(index, 1)
                                                }
                                                this.setState({ selectedFilters: selectedFilters }, function() {
                                                    this.filter()
                                                })
                                            })
                                        }}>{parts[1]} <span>{parts[2]}</span></IonChip>
                                    )
                                }) }
                                { (this.state.allFilters.length > 20) && <IonChip className="colored" data-type="country" onClick={() => { this.setState({ showAllFilters: !this.state.showAllFilters }) }}> { (this.state.showAllFilters) ? "Show less filters" : "Show all filters ..." } </IonChip> }
                            </div>
                          }
                      </div>
                      { ( (this.state.visibleLocationListLocations) && (this.state.visibleLocationListLocations.length !== 0) ) &&
                          <IonList className="location-list">
                              { this.state.visibleLocationListLocations.map(item => {
                                  return (
                                      <LocationPreviewItem
                                          onSelect={(locationId, location) => { this.onListClick(locationId, location) }}
                                          onClick={() => {  }}
                                          location={item}
                                          key={item.id}
                                      />
                                  )
                              }) }
                          </IonList>
                      }
                  </div>
              </SwipeableDrawer>
          }

          <CitySelectorModal
              presentingElement={this.pageRef}
              open={this.state.citySelectorModal}
              close={() => { this.setState({ citySelectorModal: false }) } }
              onSelect={(type, id, name, countryId, countryName) => { this.updateLocation(type, id, name, countryId, countryName) }}
              restrictToType={this.state.citySelectorModalType}
          />
          <IonAlert
              isOpen={this.state.minorError !== null}
              onDidDismiss={() => { this.setState({ minorError: null }) }}
              message={this.state.minorError}
              buttons={[
                  { text: 'Close' }
              ]}
          />
          <IonToast
              isOpen={this.state.error !== null}
              onDidDismiss={() => this.setState({ error: null })}
              message={this.state.error}
              color={"danger"}
              closeButtonText="Close"
              duration={2000}
              position="top"
              showCloseButton={true}
          />
          </IonPage>
        );
    }

};


export default withIonLifeCycle(MapView);
