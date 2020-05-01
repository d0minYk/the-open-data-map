import { IonAlert, IonIcon, IonItem, IonLabel, IonThumbnail, IonToast, withIonLifeCycle } from '@ionic/react';
import { star } from 'ionicons/icons';
import React from 'react';
import Server from '../Server';
import "../styles/EntityListItem.scss";
import Utilities from '../Utilities';
import SocialActions from './SocialActions.js';
import LocationPreviewItem from './LocationPreviewItem.js';
import UserBadge from './UserBadge.js';

class EntityListItem extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            setupFromCkanAlert: null,
            minorNotification: null,
        }
    }

    mirrorDataset(url, matchId) {

        console.log(url, matchId);
        // return;

        Server.api({
            method: "post",
            url: "/dataset/parse",
            data: {
                url: url,
                ckanMatchId: matchId,
                onlyImport: false,
            },
            then: function(res) {

                this.setState({
                    loading: null
                }, function() {
                    this.props.history.push("/dataset/progress/" + res.data.id)
                })

            }.bind(this),
            catch: function(code, error) {
                // this.setState({
                //     error: error,
                //     loading: null
                // })
                this.setState({
                    minorNotification: (error || "Failed to initiate dataset"),
                    loading: null
                })
                console.error("FAILEd To CreaTE");
            }.bind(this)
        })

    }

    render() {

        return (
            <IonItem className="entity-list-item" new={this.props.new ? "true" : "false"}>
                { (this.props.entity) &&
                    <IonThumbnail slot="start">
                        { (this.props.entityType === "location" || this.props.actionType === "locations") &&
                            <div className="marker-custom" data-image={(this.props.entity.marker && this.props.entity.marker.image) ? "true" : "false"}>
                                <div style={{ width: 40, height: 40, backgroundColor: this.props.entity.marker ? this.props.entity.marker.color : window.globalVars.COLORS.blue }}>
                                    { (this.props.entity && this.props.entity.marker && this.props.entity.marker.image) ?
                                        <div style={{ width: '100%', height: '100%' }}><img src={this.props.entity.marker.image} style={{ width: '100%', height: '100%' }} /></div>
                                        :
                                        <i style={{ position: 'relative', top: 6 }} className={(this.props.entity && this.props.entity.marker && this.props.entity.marker.icon) ? this.props.entity.marker.icon : 'flaticon-placeholder'} />
                                    }
                                </div>
                                <span />
                            </div>
                        }
                        { (this.props.entityType === "dataset" || this.props.actionType === "ckan" || this.props.actionType === "datasets") &&
                            <div style={{ backgroundColor: "#4a69bb" }}>
                                <i className="flaticon-box" />
                            </div>
                        }
                        { (this.props.entityType === "request") &&
                            <div style={{ backgroundColor: "#4a69bb" }}>
                                <i className="flaticon-question" />
                            </div>
                        }
                        { (this.props.new) &&
                            <span className="new">New</span>
                        }
                    </IonThumbnail>
                }
                { (this.props.entity) &&
                    <IonLabel className="ion-text-wrap">
                        <div onClick={() => {

                            if (this.props.onClick) {
                                this.props.onClick(this.props.entityId)
                            } else if (this.props.actionType === "ckan") {
                                this.setState({ setupFromCkanAlert: { name: this.props.entity.title, id: this.props.entityId, url: this.props.entity.file.url } })
                            } else if (this.props.actionType === "datasets" || (this.props.entityType === "dataset")) {
                                if (this.props.entity.userId === this.props.ownId) {
                                    this.props.history.push("/dataset/progress/" + this.props.entity.id);
                                } else {
                                    this.props.history.push("/dataset/" + this.props.entity.id);
                                }
                            } else if (this.props.actionType === "locations" || (this.props.entityType === "location")) {
                                this.props.history.push("/location/" + this.props.entity.id);
                            } else if (this.props.actionType === "request" || this.props.actionType === "requests") {
                                this.props.history.push("/request/" + this.props.entity.id);
                            }

                        }}>
                            <h2>
                                { (this.props.entityType === "location") && this.props.entity.name }
                                { (this.props.entityType === "dataset") && this.props.entity.name }
                                { this.props.actionType === "ckan" && <span>{this.props.entity.title} ({this.props.entity.file.format})</span> }
                                { this.props.actionType === "datasets" && <span>{this.props.entity.name || "Untitled"}</span> }
                                { this.props.actionType === "locations" && <span>{this.props.entity.name || "Untitled"}</span> }
                                { (this.props.actionType === "request" || this.props.actionType === "requests" || this.props.entityType === "request") && <span>{this.props.entity.name || "Untitled"}</span> }
                            </h2>
                            <h3>
                                { (this.props.entityType === "location") && Utilities.formatLocation(this.props.entity) }
                                { (this.props.actionType === "locations") && Utilities.formatLocation(this.props.entity) }
                                { (this.props.entityType === "dataset") && (Utilities.shorten(this.props.entity.description, 180)) }
                                { (this.props.actionType === "datasets") && (this.props.entity.description) }
                                { (this.props.actionType === "ckan") && this.props.entity.file.description }
                                { (this.props.actionType === "request" || this.props.actionType === "requests" || this.props.entityType === "request") && (this.props.entity.status || "Closed") }
                            </h3>
                            { (this.props.actionType !== "ckan" && !this.props.hideSocialActions) &&
                                <SocialActions {...this.props} noClickAction={true} style={{ marginTop: 8 }} type={this.props.entityType} actions={this.props.entity} id={this.props.entityId} name={this.props.entity.name} />
                            }
                        </div>
                        <div style={{ marginTop: 8 }} onClick={() => { this.props.history.push("/profile/" + this.props.entity.userId) }}>
                            { (this.props.actionType === "likes") &&
                                <div className="like">
                                    <UserBadge username={this.props.username || this.props.entity.username} photo={this.props.userPhoto || this.props.entity.userPhoto} date={this.props.date} type="photo-username-date" />
                                </div>
                            }
                            { (this.props.actionType === "comments") &&
                                <div className="comment">
                                    <UserBadge username={this.props.username || this.props.entity.username} photo={this.props.userPhoto || this.props.entity.userPhoto} date={this.props.date} type="photo-username-date" />
                                    {this.props.body}
                                </div>
                            }
                            { (this.props.actionType === "ratings") &&
                                <div className="rating">
                                    <UserBadge username={this.props.username || this.props.entity.username} photo={this.props.userPhoto || this.props.entity.userPhoto} date={this.props.date} type="photo-username-date" />
                                    <div className="stars" data-rating={this.props.rating}>
                                        <span> <IonIcon icon={star} /> </span>
                                        <span> <IonIcon icon={star} /> </span>
                                        <span> <IonIcon icon={star} /> </span>
                                        <span> <IonIcon icon={star} /> </span>
                                        <span> <IonIcon icon={star} /> </span>
                                    </div>
                                    {this.props.body}
                                </div>
                            }
                            { (this.props.actionType === "reports") &&
                                <div className="report">
                                    <UserBadge username={this.props.username || this.props.entity.username} photo={this.props.userPhoto || this.props.entity.userPhoto} date={this.props.date} type="photo-username-date" />
                                    <div>{this.props.cause}</div>
                                    { this.props.body && <div>{this.props.body}</div> }
                                </div>
                            }
                            { (this.props.actionType === "shares") &&
                                <div className="share">
                                    <UserBadge username={this.props.username || this.props.entity.username} photo={this.props.userPhoto || this.props.entity.userPhoto} date={this.props.date} type="photo-username-date" />
                                    Shared to {this.props.platform}
                                </div>
                            }
                        </div>
                    </IonLabel>
                }
                <IonAlert
                    isOpen={this.state.setupFromCkanAlert !== null}
                    onDidDismiss={() => { this.setState({ setupFromCkanAlert: null }) }}
                    header={this.state.setupFromCkanAlert && 'Mirror ' + this.state.setupFromCkanAlert.name}
                    message={'You are about to create a dataset that will be updated from this url by your selected interval'}
                    buttons={[
                        {
                            text: 'Cancel',
                            handler: () => {}
                        },
                        {
                            text: 'Set Up',
                            handler: () => {
                                this.mirrorDataset(this.state.setupFromCkanAlert.url, this.state.setupFromCkanAlert.id);
                            }
                        },
                    ]}
                />
                <IonToast
                    color="dark"
                    isOpen={(this.state.minorNotification !== null)}
                    onDidDismiss={() => { this.setState({ minorNotification: null }) }}
                    message={this.state.minorNotification}
                    position="bottom"
                    duration={1500}
              />
            </IonItem>
        );
    }

};

export default withIonLifeCycle(EntityListItem);
