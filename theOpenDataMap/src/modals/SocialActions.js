import { withIonLifeCycle } from '@ionic/react';
import React from 'react';
import ShareButton from '../modals//ShareButton.js';
import CommentsButton from '../modals/CommentsButton.js';
import FavoriteButton from '../modals/FavoriteButton.js';
import LikeButton from '../modals/LikeButton.js';
import RatingsButton from '../modals/RatingsButton.js';
import ReportsButton from '../modals/ReportsButton.js';

class SocialActions extends React.Component {

    render() {
        return (
            <div className="social-actions" style={this.props.style} data-action-names={this.props.showActionName ? "true" : "false"}>
                <LikeButton
                    {...this.props}
                    type={this.props.type}
                    id={this.props.id}
                    source="parent"
                    likes={this.props.actions.likes}
                    noClickAction={this.props.noClickAction}
                />
                <RatingsButton
                    ratings={this.props.actions.ratings}
                    type={this.props.type}
                    id={this.props.id}
                    source="parent"
                    onClick={() => { if (this.props.onRatingClick) this.props.onRatingClick(); }}
                    noClickAction={this.props.noClickAction}
                />
                <ReportsButton
                    reports={this.props.actions.reports}
                    type={this.props.type}
                    id={this.props.id}
                    source="parent"
                    onClick={() => { if (this.props.onReportClick) this.props.onReportClick(); }}
                    noClickAction={this.props.noClickAction}
                />
                <ShareButton
                    type={this.props.type}
                    id={this.props.id}
                    quote={"Check out " + this.props.name}
                    title={this.props.name}
                    key={this.props.id + "share-button"}
                    link={window.globalVars.domainName + (this.props.type === "dataset" ? ("dataset/" + this.props.id) : ( this.props.type === "request" ? "request/" + this.props.id : "location/" + this.props.id ) )}
                    shares={this.props.actions.shares}
                    noClickAction={this.props.noClickAction}
                    presentingElement={this.props.presentingElement}
                />
                { (this.props.type === "location") &&
                    <FavoriteButton
                        {...this.props}
                        id={this.props.id}
                        meta={this.props.actions}
                    />
                }
                <CommentsButton
                    comments={this.props.actions.comments}
                    type={this.props.type}
                    id={this.props.id}
                    source="parent"
                    onClick={() => { if (this.props.onCommentClick) this.props.onCommentClick(); }}
                    noClickAction={this.props.noClickAction}
                />
                { (this.props.type !== "location") &&
                    <div></div>
                }
            </div>
        );
    }

};

export default withIonLifeCycle(SocialActions)
