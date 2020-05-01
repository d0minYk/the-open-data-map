import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonModal, IonTitle, IonToast, IonToolbar, withIonLifeCycle } from '@ionic/react';
import { put } from 'axios';
import 'cropperjs/dist/cropper.css';
import { close } from 'ionicons/icons';
import React from 'react';
import Cropper from 'react-cropper';
import Storage from '../Storage.js';
import '../styles/ProfilePictureManager.scss';
import Utilities from '../Utilities.js';

class ProfilePictureManager extends React.Component {

    constructor(props) {
        super(props);
        // this.cropper = createRef();
        this.state = {
            citySelectorModal: false,
            modal: false,
            userType: 'user',
            statistics: null,
            own: false,
            settingsModal: false,
            cropperWidth: 240,
            rawImage: null,
            toast: null
        }
    }

    componentWillReceiveProps(nextProps) {

        if ( (nextProps.image && this.state.rawImage === null) || (!nextProps.image && this.state.rawImage) ) {
            this.setState({
                rawImage: nextProps.image
            })
        }

    }

    cancelCrop = () => {

        this.setState({
            rawImage: null
        })

    }

    rotate = () => {

        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d')

        var image = new Image();
        image.src = this.state.rawImage;
        image.onload = function() {
            canvas.width = image.height;
                canvas.height = image.width;
                ctx.rotate(90 * Math.PI / 180);
                ctx.translate(0, -canvas.width);
                ctx.drawImage(image, 0, 0);
            let res = canvas.toDataURL();
            this.setState({
                rawImage: res,
            })
        }.bind(this);

    }

    async fileUpload(file) {

        let user = await Storage.getO("user");
        let authToken = await Storage.getO("authToken");

        if (!user || !authToken) {
            console.log("No creds")
            return;
        }

        this.setState({
            showSpinner: true
        })

        const formData = new FormData();
        formData.append('picture', file)
        const config = {
            headers: {
                'content-type': 'multipart/form-data',
                'Authorization': "Token " + authToken
            }
        }

        return put(window.globalVars.serverIp + "a/user/" + user.id + "/picture", formData, config)

    }

    crop = () => {

        if (this.props.onOperationStart) {
            this.props.onOperationStart();
        }

        let file = this.refs.cropper.getCroppedCanvas().toDataURL("image/jpeg", 0.94);
        this.resizeImage(file, function(fileResized) {

            let fileResizedBlob = Utilities.dataURLtoFile(fileResized);

            this.fileUpload(fileResizedBlob).then((response)=>{

                console.log(response)

                this.setState({
                    showSpinner: false
                })

                if (response.status === 200 || response.statusText === "OK") {
                    this.setState({ toast: { msg: "Profile Picture uploaded", color: "success" } })
                } else {
                    this.setState({ toast: { msg: "Profile Picture failed to upload", color: "danger" } })
                }

                setTimeout(function() {
                    if (this.props.onOperationEnd) {
                        this.props.onOperationEnd(response.data.success);
                    }
                }.bind(this), 1500);

            })

        }.bind(this));

    }

    resizeImage = (base64, cb) => {

        var canvas = document.createElement("canvas");
        var imgResize = document.createElement("img");

        imgResize.onload = function() {

            var ctx = canvas.getContext("2d");
            ctx.drawImage(imgResize, 0, 0);
            var MAX_WIDTH = 400;
            var MAX_HEIGHT = 400;
            var width = imgResize.width;
            var height = imgResize.height;

            if (width > height) {
            if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
            }
            } else {
            if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
            }
            }
            canvas.width = width;
            canvas.height = height;
            ctx = canvas.getContext("2d");
            ctx.drawImage(imgResize, 0, 0, width, height);

            var dataurl = canvas.toDataURL("image/jpeg", 0.94);

            cb(dataurl, width, height);

        }

        imgResize.src = base64;

    }

    render() {
        return (
            <IonModal
                isOpen={this.state.rawImage !== null}
                onDidDismiss={ () => { this.props.close(); } }
                presentingElement={(this.props.presentingElement && (window.globalVars === undefined || window.globalVars.size !== "big")) ? this.props.presentingElement.current : undefined}
                swipeToClose={true}
                data-modal="profile-picture-manager"
            >
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Profile Picture</IonTitle>
                        <IonButtons slot="end">
                            <IonIcon icon={close} onClick={() => { this.props.close() }}></IonIcon>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <div className="profile-picture-wrapper">
                        <div className="profile-picture">
                            { (this.state.rawImage !== null) &&
                                <div className="image-cropper" id="cropper-wrapper">
                                    <Cropper
                                        ref='cropper'
                                        src={this.state.rawImage}
                                        style={{
                                            width: this.state.cropperWidth + "px",
                                            height: this.state.cropperWidth + "px",
                                        }}
                                        minContainerWidth={this.state.cropperWidth}
                                        minContainerHeight={this.state.cropperWidth}
                                        aspectRatio={1/1}
                                        guides={false}
                                        rotatable={false}
                                        zoomable={true}
                                        dragMode="move"
                                        viewMode={1}
                                        autoCropArea={1}
                                        zoomable={true}
                                        viewMode={3}
                                    />
                                </div>
                            }
                        </div>
                        <div className="options">
                            <IonButton color="light" className="rotate" onClick={() => { this.rotate() }}>Rotate</IonButton>
                            <IonButton style={{ marginLeft: 12, marginRight: 12 }} onClick={ () => { this.crop() } }>Save</IonButton>
                            <IonButton color="light" className="remove-btn" onClick={ () => { this.cancelCrop() } }>Cancel</IonButton>
                        </div>
                    </div>
                </IonContent>
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
            </IonModal>
        );
    }

};

export default withIonLifeCycle(ProfilePictureManager);
