import { IonAlert, IonIcon, IonToast, withIonLifeCycle } from '@ionic/react';
import { addCircle, create, star } from 'ionicons/icons';
import React from 'react';
import 'react-dynamic-swiper/lib/styles.css';
import Server from '../Server';
import Storage from '../Storage';
import '../styles/Comments.scss';
import '../styles/Ratings.scss';
import '../styles/Reports.scss';
import RatingEditorModal from './RatingEditorModal';
import UserBadge from './UserBadge';


class Ratings extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            ratings: ( (props.ratings) && (props.source === "parent") ) ? props.ratings : [],
            loaded: ( (props.ratings) && (props.source === "parent") ) ? true : false,
            loggedoutAlert: false,
            toast: null
        }
    }

    getRatings() {

        Server.api({
            method: "GET",
            url: "/rating/" + this.props.type + "/" + this.props.id,
            then: function(res) {
                if (res.data)
                    this.setState({ ratings: res.data })
            }.bind(this),
            catch: function(code, error) {
                console.log("couldnt'g et comments", error);
            }.bind(this)
        })

    }

    async addRating() {
        let user = await Storage.getO("user");
        if (!user) {
            this.setState({ loggedoutAlert: true })
            return;
        }
        this.setState({
            ratingEditorModal: true,
            ratingBeingEdited: {
                id: 0,
                createdAt: (new Date()),
                body: "",
                rating: 0,
            }
        })
    }

    render() {
        return (
            <div className="reports-container ratings-container comments-container">
                <div className="header">
                    <h3>Ratings</h3>
                    <IonIcon id="new-rating-btn" icon={addCircle} onClick={() => { this.addRating(); }} />
                </div>
                { (this.state.ratings) && (this.state.ratings.length !== 0) &&
                    <div className="comments reports ratings">
                        { this.state.ratings.map(item => {
                            return (
                                <div className="comment reports" key={item.id}>
                                    <UserBadge type="photo-username-date" photo={item.userPhoto} username={item.userName} date={item.createdAt} />
                                    <div>
                                        <div className="stars" data-rating={item.rating}>
                                            <span> <IonIcon icon={star} /> </span>
                                            <span> <IonIcon icon={star} /> </span>
                                            <span> <IonIcon icon={star} /> </span>
                                            <span> <IonIcon icon={star} /> </span>
                                            <span> <IonIcon icon={star} /> </span>
                                        </div>
                                        <p className="body">{item.body}</p>
                                    </div>
                                    { (window.globalVars.user && item.userId === window.globalVars.user.id) &&
                                        <div className="options">
                                            <button onClick={() => {
                                                this.setState({
                                                    ratingEditorModal: true,
                                                    ratingBeingEdited: {
                                                        id: item.id,
                                                        createdAt: item.createdAt,
                                                        body: item.body,
                                                        rating: item.rating
                                                    }
                                                })
                                            }}>
                                                <IonIcon icon={create} />
                                                <label>Edit</label>
                                            </button>
                                        </div>
                                    }
                                </div>
                            )
                        }) }
                    </div>
                }
                { ( (!this.state.ratings) || (this.state.ratings.length === 0) ) &&
                    <div className="empty">
                        <p>No comments yet.</p>
                    </div>
                }
                <RatingEditorModal
                    type={this.props.type}
                    id={this.props.id}
                    open={this.state.ratingEditorModal}
                    rating={this.state.ratingBeingEdited}
                    close={() => { this.setState({ ratingEditorModal: false }) } }
                    presentingElement={this.props.presentingElement}
                    onSubmit={(success, message) => {
                        this.setState({
                            toast: {
                                color: success ? "success" : "danger",
                                msg: message
                            }
                        })
                        this.getRatings();
                        setTimeout(function() {
                            this.setState({
                                ratingBeingEdited: null,
                                ratingEditorModal: false,
                            })
                        }.bind(this), 1200)
                    }}
                />
                <IonToast
                    isOpen={this.state.toast !== null}
                    onDidDismiss={() => this.setState({ toast: null })}
                    message={this.state.toast ? this.state.toast.msg : ""}
                    color={this.state.toast ? this.state.toast.color : ""}
                    closeButtonText="Close"
                    duration={2000}
                    position="top"
                    showCloseButton={true}
                />
                <IonAlert
                    isOpen={this.state.loggedoutAlert}
                    onDidDismiss={() => { this.setState({ deleteCardConfirmationAlert: false }) }}
                    header={'Log In'}
                    message={'Log in or create an account to join the conversation'}
                    buttons={[
                        { text: 'Cancel', },
                        { text: 'Log in', handler: () => { this.props.history.push("/login") } }
                    ]}
                />
            </div>
        );
    }

};

export default withIonLifeCycle(Ratings);
