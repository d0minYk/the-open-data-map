import { IonSkeletonText, withIonLifeCycle } from '@ionic/react';
import React from 'react';
import '../styles/UserBadge.scss';
import Utilities from '../Utilities';


class UserBadge extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="user-badge" data-background={this.props.background} onClick={() => { if (this.props.link) this.props.history.push(this.props.link) }}>
            { (window.globalVars && window.globalVars.profilePicturesPath && this.props.type && (this.props.username || this.props.name || this.props.loading)) &&
                <div onClick={() => { if (this.props.onClick) { this.props.onClick(); } }}>
                    { (this.props.type === "dataset") &&
                        <div className="dataset">
                            <div className='photo'>
                                <div className="initial">{this.props.name[0]}</div>
                            </div>
                            <div className="name">
                                {this.props.name}
                            </div>
                        </div>
                    }
                    { (this.props.type === "photo-username") &&
                        <div className="photo-username">
                            <div className='photo'>
                                { (this.props.photo) ?
                                    <img src={window.globalVars.profilePicturesPath + this.props.photo} />
                                    :
                                    <div className="initial">{this.props.username[0]}</div>
                                }
                            </div>
                            <div className="name">
                                {this.props.username}
                            </div>
                        </div>
                    }
                    { (this.props.type === "photo-username-date") &&
                        <div className="photo-username-date">
                            <div className='photo'>
                                { (this.props.photo) ?
                                    <img src={window.globalVars.profilePicturesPath + this.props.photo} />
                                    :
                                    <div className="initial">{this.props.username[0]}</div>
                                }
                            </div>
                            <div className="side">
                                <div className="name">
                                    {this.props.username}
                                </div>
                                <div className="date">
                                    {Utilities.formatDate(this.props.date, "HH:MM DD/MM/YYYY")}
                                </div>
                            </div>
                        </div>
                    }
                    { (this.props.type === "photo-username-subtext") &&
                        <div className="photo-username-subtext">
                            { (this.props.loading) ?
                                <div className="loading photo">
                                    <IonSkeletonText animated style={{ width: '100%', margin: 'auto' }} />
                                </div>
                                :
                                <div className='photo'>
                                    { (this.props.photo) ?
                                        <img src={window.globalVars.profilePicturesPath + this.props.photo} />
                                        :
                                        <div className="initial">{this.props.username[0]}</div>
                                    }
                                </div>
                            }
                            <div className="name">
                                { (this.props.loading) ? <IonSkeletonText animated style={{ width: '70%', margin: 'auto' }} /> : this.props.username}
                            </div>
                            <div className="subtext">
                                { (this.props.loading) ? <IonSkeletonText animated style={{ width: '32%', margin: 'auto' }} /> : this.props.subtext}
                            </div>
                        </div>
                    }
                    { (this.props.type === "list-photo") &&
                        <div className="list-photo">
                            <div className='photo'>
                                { (this.props.photo) ?
                                    <img src={window.globalVars.profilePicturesPath + this.props.photo} />
                                    :
                                    <div className="initial">{this.props.username[0]}</div>
                                }
                            </div>
                        </div>
                    }
                </div>
            }
            </div>
        );
    }

};

export default withIonLifeCycle(UserBadge);
