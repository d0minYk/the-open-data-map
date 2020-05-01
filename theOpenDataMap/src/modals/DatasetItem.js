import { IonItem, IonLabel, IonSkeletonText, withIonLifeCycle } from '@ionic/react';
import React from 'react';
import Utilities from '../Utilities';
import SocialActions from './SocialActions.js';
import UserBadge from './UserBadge.js';

class DatasetItem extends React.Component {

    render() {
        return (
            <IonItem onClick={() => { if (this.props.dataset) { this.props.history.push(this.props.own ? "/dataset/progress/" + this.props.dataset.id : "/dataset/" + this.props.dataset.id) } }}>
                { (this.props.loading) ?
                    <IonLabel class="ion-text-wrap">
                        <h2> <IonSkeletonText animated style={{ width: '80%' }} /> </h2>
                        <h3> <IonSkeletonText animated style={{ width: '64%' }} /> </h3>
                        <p> <IonSkeletonText animated style={{ width: '100%', margin: 'auto' }} /> </p>
                    </IonLabel>
                    :
                    <IonLabel class="ion-text-wrap">
                        <h2>{this.props.dataset.name || "Untitled"} </h2>
                        <h3>{this.props.dataset.topicName}</h3>
                        <h3>Last Updated {Utilities.formatDate(this.props.dataset.locationupdatedat, "HH:MM DD/MM/YYYY")}</h3>
                        { (this.props.own) &&
                            <h4> { (this.props.dataset.isQueued) ? "Parsing in progress" : ( this.props.dataset.isPublished ? "Published" : "Draft" ) } </h4>
                        }
                        { (this.props.dataset.description) &&
                            <p> {Utilities.shorten(this.props.dataset.description, 180)} </p>
                        }
                        { (!this.props.own) &&
                            <UserBadge username={this.props.dataset.username} photo={this.props.dataset.userPhoto} type="photo-username" />
                        }
                        <SocialActions {...this.props} noClickAction={true} style={{marginTop: 8}} type="dataset" actions={this.props.dataset} id={this.props.dataset.id} name={this.props.dataset.name} />
                    </IonLabel>
                }
            </IonItem>
        );
    }

};

export default withIonLifeCycle(DatasetItem)
