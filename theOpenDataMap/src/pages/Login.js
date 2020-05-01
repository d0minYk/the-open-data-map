import { IonContent, IonInput, IonLabel, IonList, IonPage, IonToast, withIonLifeCycle } from '@ionic/react';
import React from 'react';
import { RouteComponentProps } from 'react-router';
import Logo from '../images/logo-purple.png';
import Server from '../Server';
import Storage from '../Storage';
import '../styles/Login.scss';


interface Props extends RouteComponentProps {
    type: string;
}

interface State {
    password: string;
    passwordAgain: string;
    username: string;
    email: string;
};

class Login extends React.Component<Props, State> {

    constructor(props) {
        super(props)
        this.state = {
            type: 'signup',
            error: null,
        }
    }

    componentDidMount() {

        console.log("INIT LOGIN with ", this.state);

        if (this.props.match.params.token) {
            this.setState({
                type: "restore"
            })
        }

    }

    handleChange(key, value) {
        this.setState({
            [key]: value.value
        })
    }

    ionViewWillEnter() {
        // let rootSection = window.location.href.replace("http://", "").replace("https://", "").split("/")[1];
        // this.setState({
        //     type: rootSection
        // })
        document.title = "Login" + window.globalVars.pageTitle;
    }

    requestRestore() {

        this.setState({
            errorMsg: null,
            successMsg: null,
            loading: true,
        })

        console.log("Restore");

        Server.api({
            method: "post",
            url: "/user/restore/email",
            data: {
                email: this.state.email,
            },
            then: function(res) {
                console.log(res.data);
                this.setState({ successMsg: res.data, loading: false })
                // this.saveUserDetails(res.data);
            }.bind(this),
            catch: function(code, error) {
                this.setState({ errorMsg: error, loading: false })
            }.bind(this)
        })


    }

    changePassword() {

        this.setState({
            errorMsg: null,
            successMsg: null,
            loading: true,
        })

        console.log("Change pass");

        Server.api({
            method: "post",
            url: "/user/restore/password",
            data: {
                token: this.props.match.params.token,
                password: this.state.password,
                passwordAgain: this.state.passwordAgain
            },
            then: function(res) {
                console.log(res.data);
                this.setState({ successMsg: res.data, loading: false });
                setTimeout(function() {
                    this.props.history.push("/login")
                }.bind(this), 1000);
                // this.saveUserDetails(res.data);
            }.bind(this),
            catch: function(code, error) {
                console.error(error);
                this.setState({ errorMsg: error, loading: false })
            }.bind(this)
        })


    }

    signup() {

        this.setState({
            errorMsg: null,
            successMsg: null,
            loading: true,
        })

        Server.api({
            method: "post",
            url: "/user/",
            data: {
                email: this.state.email,
                password: this.state.password,
                username: this.state.username
            },
            then: function(res) {
                console.log(res.data);
                this.saveUserDetails(res.data);
            }.bind(this),
            catch: function(code, error) {
                this.setState({ errorMsg: error, loading: false })
            }.bind(this)
        })

    }

    login() {

        this.setState({
            errorMsg: null,
            successMsg: null,
            loading: true,
        })

        Server.api({
            method: "post",
            url: "/user/login",
            data: {
                email: this.state.email,
                password: this.state.password,
            },
            then: function(res) {
                this.saveUserDetails(res.data);
            }.bind(this),
            catch: function(code, error) {
                this.setState({ errorMsg: code === 429 ? "Too many tries, try later" : error, loading: false })
            }.bind(this)
        })

    }

    async saveUserDetails(data) {
        await Storage.setO("user", data);
        await Storage.setO("authToken", data.token);
        await Storage.set("splashscreenPassed", "true");
        await Storage.setO("lastLocation", {
            type: "country",
            countryId: 450,
            countryName: "United Kingdom",
        })
        window.location.href = "/";
    }

    async continueWithoutAccount(data) {
        await Storage.set("splashscreenPassed", "true");
        window.location.href = "/";
    }

    onEnter() {
        console.log("ENTER", this.state);

        if (this.state.type === "signup") {
            this.signup();
        } else if (this.state.type === "login") {
            this.login();
        } else if (this.state.type === "forgotten") {
            this.requestRestore();
        } else if (this.state.type === "restore") {
            this.changePassword();
        }

    }

    render() {
        return (
            <IonPage data-page="login" data-section={this.props.type}>
                {/*<div className="background" style={{ backgroundImage: `url('${MapImg}')` }} />*/}
                { (this.props.size === "big") &&
                      <picture>
                          <source type="image/webp" srcset={process.env.PUBLIC_URL + '/assets/images/map-background-min.webp'} />
                          <source type="image/jp2" srcset={process.env.PUBLIC_URL + '/assets/images/map-background-min.jp2'} />
                          <source type="image/jxr" srcset={process.env.PUBLIC_URL + '/assets/images/map-background-min.jxr'} />
                          <img src={process.env.PUBLIC_URL + '/assets/images/map-background-min.png'} alt="alt description" />
                      </picture>
                }
                <div className="login-container">
                    <IonContent>
                        <div className="login">
                            <div className="header">
                                <img className="logo" src={Logo} />
                                {/*<h1>Create an account</h1>
                                <p>In order to request and post locations available to everyone</p>*/}
                            </div>
                            <div className="body">
                                { ( (this.state.type === "signup") || (this.state.type === "login") || (this.state.type === "forgotten") ) &&
                                    <IonList lines="full" class="ion-no-margin ion-no-padding">
                                        <IonLabel position="stacked">Email</IonLabel>
                                        <IonInput onKeyDown={(e, b) => { if (e.keyCode === 13) { this.onEnter(); } }} onIonChange={(e) => {this.handleChange("email", e.target)}} placeholder="Enter your email address" type="text"></IonInput>
                                    </IonList>
                                }
                                { (this.state.errorMsg && this.state.errorMsg.toLowerCase().indexOf("email") !== -1 && this.state.errorMsg.toLowerCase().indexOf("username") === -1 ) &&
                                    <p className="error-msg">{this.state.errorMsg}</p>
                                }
                                { (this.state.type === "signup") &&
                                    <IonList lines="full" class="ion-no-margin ion-no-padding">
                                        <IonLabel position="stacked">Username</IonLabel>
                                        <IonInput onKeyDown={(e, b) => { if (e.keyCode === 13) { this.onEnter(); } }} onIonChange={(e) => {this.handleChange("username", e.target)}} placeholder="Enter your username" type="text"></IonInput>
                                    </IonList>
                                }
                                { (this.state.errorMsg && this.state.errorMsg.toLowerCase().indexOf("username") !== -1) &&
                                    <p className="error-msg">{this.state.errorMsg}</p>
                                }
                                { ( (this.state.type === "signup") || (this.state.type === "login") || (this.state.type === "restore") ) &&
                                    <IonList lines="full" class="ion-no-margin ion-no-padding">
                                        <IonLabel position="stacked">Password</IonLabel>
                                        <IonInput onKeyDown={(e, b) => { if (e.keyCode === 13) { this.onEnter(); } }} onIonChange={(e) => {this.handleChange("password", e.target)}} placeholder="Enter your password" type="password"></IonInput>
                                    </IonList>
                                }
                                { (this.state.errorMsg && this.state.errorMsg.toLowerCase().indexOf("password") !== -1) &&
                                    <p className="error-msg">{this.state.errorMsg}</p>
                                }
                                { (this.state.type === "restore") &&
                                    <IonList lines="full" class="ion-no-margin ion-no-padding">
                                        <IonLabel position="stacked">Password Again</IonLabel>
                                        <IonInput onKeyDown={(e, b) => { if (e.keyCode === 13) { this.onEnter(); } }} onIonChange={(e) => {this.handleChange("passwordAgain", e.target)}} placeholder="Enter your password" type="password"></IonInput>
                                    </IonList>
                                }
                                { (this.state.errorMsg && this.state.errorMsg.toLowerCase().indexOf("password") === -1 && this.state.errorMsg.toLowerCase().indexOf("email") === -1 && this.state.errorMsg.toLowerCase().indexOf("username") === -1) &&
                                    <p className="error-msg">{this.state.errorMsg}</p>
                                }
                                { (this.state.successMsg) &&
                                    <p className="success-msg">{this.state.successMsg}</p>
                                }
                            </div>
                            { (this.state.type === "signup") &&
                                <div className="footer">
                                    <div>
                                        <span onClick={() => { this.setState({ type: "login", errorMsg: null, successMsg: null }) }}>Login</span>
                                        <span onClick={() => { this.setState({ type: "forgotten", errorMsg: null, successMsg: null }) }}>Restore Password</span>
                                        <span onClick={() => { this.continueWithoutAccount(); }}>Skip</span>
                                    </div>
                                    <p className="terms">By using the application you accept our <a onClick={() => { window.open("https://theopendatamap.com/legal") }}>Terms & Conditions and Privacy Policy</a>.</p>
                                    <button disabled={this.state.loading} className="main" onClick={() => { this.signup() }}>Sign up</button>
                                </div>
                            }
                            { (this.state.type === "login") &&
                                <div className="footer">
                                    <div>
                                        <span onClick={() => { this.setState({ type: "signup", errorMsg: null, successMsg: null }) }}>Sign up</span>
                                        <span onClick={() => { this.setState({ type: "forgotten", errorMsg: null, successMsg: null }) }}>Restore Password</span>
                                        <span onClick={() => { this.continueWithoutAccount(); }}>Skip</span>
                                    </div>
                                    <button disabled={this.state.loading} className="main" onClick={() => { this.login() }}>Login</button>
                                </div>
                            }
                            { (this.state.type === "forgotten") &&
                                <div className="footer">
                                    <div>
                                        <span onClick={() => { this.setState({ type: "login", errorMsg: null, successMsg: null }) }}>Login</span>
                                        <span onClick={() => { /*this.props.history.push("/signup")*/ this.setState({ type: "signup" }) }}>Sign up</span>
                                        <span onClick={() => { this.continueWithoutAccount(); }}>Skip</span>
                                    </div>
                                    <button disabled={this.state.loading} className="main" onClick={() => { this.requestRestore() }}>Send link</button>
                                </div>
                            }
                            { (this.state.type === "restore") &&
                                <div className="footer">
                                    <div>
                                        <span onClick={() => { this.setState({ type: "login", errorMsg: null, successMsg: null }) }}>Login</span>
                                    </div>
                                    <button disabled={this.state.loading} className="main" onClick={() => { this.changePassword() }}>Change Password</button>
                                </div>
                            }
                        </div>
                    </IonContent>
                </div>
                <IonToast
                    isOpen={this.state.error !== null}
                    onDidDismiss={() => this.setState({ error: null })}
                    message={this.state.error}
                    color="danger"
                    closeButtonText="Close"
                    duration={5000}
                    position="top"
                    showCloseButton={true}
                />
            </IonPage>
        );
    }

};

export default withIonLifeCycle(Login);
