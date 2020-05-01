import { IonAlert, IonIcon, IonToast, withIonLifeCycle } from '@ionic/react';
import { addCircle, create } from 'ionicons/icons';
import React from 'react';
import Server from '../Server';
import Storage from '../Storage';
import '../styles/Comments.scss';
import '../styles/Reports.scss';
import ReportEditorModal from './ReportEditorModal';
import UserBadge from './UserBadge';


class Reports extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            reports: ( (props.reports) && (props.source === "parent") ) ? props.reports : [],
            loaded: ( (props.reports) && (props.source === "parent") ) ? true : false,
            loggedoutAlert: false,
            toast: null,
        }
    }

    getReports() {

        Server.api({
            method: "GET",
            url: "/report/" + this.props.type + "/" + this.props.id,
            then: function(res) {
                if (res.data)
                    this.setState({ reports: res.data })
            }.bind(this),
            catch: function(code, error) {
                console.log("couldnt'g et comments", error);
            }.bind(this)
        })

    }

    async addReport() {
        let user = await Storage.getO("user");
        if (!user) {
            this.setState({ loggedoutAlert: true })
            return;
        }
        this.setState({
            reportEditorModal: true,
            reportBeingEdited: {
                id: 0,
                createdAt: (new Date()),
                body: "",
                cause: "Select Reason"
            }
        })
    }

    render() {
        return (
            <div className="reports-container comments-container">
                <div className="header">
                    <h3>Reports</h3>
                    <IonIcon id="new-report-btn" icon={addCircle} onClick={() => { this.addReport(); }} />
                </div>
                { (this.state.reports) && (this.state.reports.length !== 0) &&
                    <div className="comments reports">
                        { this.state.reports.map(item => {
                            return (
                                <div className="comment reports" key={item.id}>
                                    <UserBadge type="photo-username-date" photo={item.userPhoto} username={item.userName} date={item.createdAt} />
                                    <p className="body">
                                        <strong>{item.cause}</strong> <br />
                                        {item.body}
                                    </p>
                                    { (window.globalVars.user && item.userId === window.globalVars.user.id) &&
                                        <div className="options">
                                            <button onClick={() => {
                                                this.setState({
                                                    reportEditorModal: true,
                                                    reportBeingEdited: {
                                                        id: item.id,
                                                        createdAt: item.createdAt,
                                                        body: item.body,
                                                        cause: item.cause
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
                { ( (!this.state.reports) || (this.state.reports.length === 0) ) &&
                    <div className="empty">
                        <p>No comments yet.</p>
                    </div>
                }
                <ReportEditorModal
                    type={this.props.type}
                    id={this.props.id}
                    open={this.state.reportEditorModal}
                    report={this.state.reportBeingEdited}
                    close={() => { this.setState({ reportEditorModal: false }) } }
                    presentingElement={this.props.presentingElement}
                    onSubmit={(success, message) => {
                        this.setState({
                            toast: {
                                color: success ? "success" : "danger",
                                msg: message
                            }
                        })
                        this.getReports();
                        setTimeout(function() {
                            this.setState({
                                reportBeingEdited: null,
                                reportEditorModal: false,
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

    /*{ (item.editing) ?
        <div>

            <IonTextarea
                value={item.body}
                rows={6}
                cols={20}
                placeholder="Brief description"
                onIonChange={(e) => {
                    let reports = this.state.reports;
                    reports[0].body = e.target.value;
                    this.setState({ reports: reports })
                }}
            />
        </div>
        :
        <div>
            <p className="cause">{item.cause}</p>
            <p className="body">{item.body}</p>
        </div>
    }*/

};

export default withIonLifeCycle(Reports);
