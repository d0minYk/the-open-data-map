import { IonChip, IonIcon, IonItem, IonLabel, IonThumbnail, withIonLifeCycle } from '@ionic/react';
import { call, globe, mail } from 'ionicons/icons';
import React from 'react';
import "../styles/LocationPreviewItem.scss";
import Utilities from '../Utilities';


class LocationPreviewItem extends React.Component {

    render() {
        return (
            <IonItem key={this.props.location.id} className="location-preview-item" onClick={() => { this.props.onSelect(this.props.location.id, this.props.location.locationPoint || this.props.location.locationPath || this.props.location.locationPolygon) }}>
                <IonThumbnail slot="start">
                    <div className="marker-custom" data-image={(this.props.location.marker && this.props.location.marker.image) ? "true" : "false"}>
                        <div style={{ width: 40, height: 40, backgroundColor: this.props.location.marker ? this.props.location.marker.color : window.globalVars.COLORS.blue }}>
                            { (this.props.location.marker && this.props.location.marker.image) ?
                                <div style={{ width: '100%', height: '100%' }}><img src={this.props.location.marker.image} style={{ width: '100%', height: '100%' }} /></div>
                                :
                                <i style={{ position: 'relative', top: 6 }} className={this.props.location.marker ? this.props.location.marker.icon : "flaticon-placeholder"} />
                            }
                        </div>
                        <span />
                    </div>
                </IonThumbnail>
                <IonLabel className="ion-text-wrap">
                    <h2>{this.props.location.name}</h2>
                    <h3>{Utilities.formatLocation(this.props.location)}</h3>
                    <div className="tags">
                        { (this.props.location.tel) && <IonChip className="icon-tag"> <IonIcon icon={call} /> </IonChip> }
                        { (this.props.location.email) && <IonChip className="icon-tag"> <IonIcon icon={mail} /> </IonChip> }
                        { (this.props.location.website) && <IonChip className="icon-tag"> <IonIcon icon={globe} /> </IonChip> }
                        { (this.props.location.cityName) && <IonChip className="colored selectable" data-type="city">{this.props.location.cityName}</IonChip> }
                        { (this.props.location.categories && this.props.location.categories.length !== 0) &&
                            this.props.location.categories.map(category => {
                                return (<IonChip className="colored selectable" data-type="category" key={"lpitemcat-" + category + "-" + this.props.location.id}>{category}</IonChip>)
                            })
                        }
                        { (this.props.location.features && Object.keys(this.props.location.features).length !== 0) &&
                            Object.keys(this.props.location.features).map(key => {
                                return (<IonChip className="colored selectable" data-type="feature" key={"lpitemtag-" + key + "-" + this.props.location.id}>{key}</IonChip>)
                            })
                        }
                    </div>
                </IonLabel>
            </IonItem>
        );
    }

};

export default withIonLifeCycle(LocationPreviewItem);
