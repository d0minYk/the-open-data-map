import { IonAlert, IonIcon, IonToast, withIonLifeCycle } from '@ionic/react';
import { addCircle, create } from 'ionicons/icons';
import React from 'react';
import Server from '../Server';
import Storage from '../Storage';
import '../styles/Comments.scss';
import CommentEditorModal from './CommentEditorModal';
import UserBadge from './UserBadge';


class Comments extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            comments: ( (props.comments) && (props.source === "parent") ) ? props.comments : [],
            loaded: ( (props.comments) && (props.source === "parent") ) ? true : false,
            loggedoutAlert: false,
            toast: null,
        }
    }

    getComments() {

        Server.api({
            method: "GET",
            url: "/comment/" + this.props.type + "/" + this.props.id,
            then: function(res) {
                if (res.data)
                    this.setState({ comments: res.data })
            }.bind(this),
            catch: function(code, error) {
                
            }.bind(this)
        })

    }

    async addComment() {
        let user = await Storage.getO("user");
        if (!user) {
            this.setState({ loggedoutAlert: true })
            return;
        }
        this.setState({
            commentEditorModal: true,
            commentBeingEdited: {
                id: 0,
                createdAt: (new Date()),
                body: "",
            }
        })
    }

    render() {
        return (
            <div className="comments-container">
                <div className="header">
                    <h3>Comments</h3>
                    <IonIcon id="new-comment-btn" icon={addCircle} onClick={() => { this.addComment(); }} />
                </div>
                { (this.state.comments) && (this.state.comments.length !== 0) &&
                    <div className="comments">
                        { this.state.comments.map(item => {
                            return (
                                <div className="comment" key={item.id}>
                                    <UserBadge type="photo-username-date" photo={item.userPhoto} username={item.userName} date={item.createdAt} />
                                    <p className="body">{item.body}</p>
                                    { (window.globalVars.user && item.userId === window.globalVars.user.id) &&
                                        <div className="options">
                                            <button onClick={() => {
                                                this.setState({
                                                    commentEditorModal: true,
                                                    commentBeingEdited: {
                                                        id: item.id,
                                                        createdAt: item.createdAt,
                                                        body: item.body,
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
                { ( (!this.state.comments) || (this.state.comments.length === 0) ) &&
                    <div className="empty">
                        <p>No comments yet.</p>
                    </div>
                }
                <CommentEditorModal
                    type={this.props.type}
                    id={this.props.id}
                    open={this.state.commentEditorModal}
                    comment={this.state.commentBeingEdited}
                    presentingElement={this.props.presentingElement}
                    close={() => { this.setState({ commentEditorModal: false }) } }
                    onSubmit={(success, message) => {
                        this.setState({
                            toast: {
                                color: success ? "success" : "danger",
                                msg: message
                            }
                        })
                        this.getComments();
                        setTimeout(function() {
                            this.setState({
                                commentBeingEdited: null,
                                commentEditorModal: false,
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

export default withIonLifeCycle(Comments);
