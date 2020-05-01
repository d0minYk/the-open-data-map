import { IonIcon, IonItem, IonLabel, IonList, IonThumbnail, withIonLifeCycle } from '@ionic/react';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import { chatbubblesOutline, fileTrayFullOutline, informationCircleOutline, locationOutline } from 'ionicons/icons';
import React from 'react';
import Storage from '../Storage';
import '../styles/NewPostDrawer.scss';

class NewPostDrawer extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            canPostDataset: false,
            canPostRequest: false,
            open: false,
        }
    }

    async componentWillReceiveProps(nextProps) {

        if (nextProps.pathname === "/post") {

            let user = await Storage.getO("user");

            if (!user) {
                this.props.history.push("/login")
            } else {
                if (user.type === "org") {
                    this.setState({ canPostDataset: true })
                } else if (user.type === "user") {
                    this.setState({ canPostRequest: true })
                }
            }

        }

        this.setState({
            open: (nextProps.pathname === "/post")
        })

    }

    render() {
        return (
            <SwipeableDrawer
                anchor="bottom"
                disableBackdropTransition={false}
                open={this.state.open}
                onClose={ () => { this.props.history.goBack() } }
                onOpen={ () => { } }
                className="new-post-drawer"
            >
                <div className="swipeable-drawer-body">
                     <div className="drag-indicator"></div>
                     <IonList className="post-options">
                         <IonItem onClick={() => { this.props.history.push("/location/new/edit") }} mode="ios">
                             <IonThumbnail slot="start">
                                 <div>
                                     <IonIcon icon={locationOutline} />
                                 </div>
                             </IonThumbnail>
                             <IonLabel className="ion-text-wrap">
                                 <h2>Location</h2>
                                 <h3>Post a single location under CC0 licence for everyone to see and earn 20 points</h3>
                             </IonLabel>
                         </IonItem>
                         <IonItem onClick={() => {
                            if (this.state.canPostDataset)
                                this.props.history.push("/dataset/setup/new/source")
                            else
                                this.props.history.push("/contact-us/Request organization account/I would like to request an organization account.")
                        }}>
                             <IonThumbnail slot="start">
                                 <div>
                                     <IonIcon icon={fileTrayFullOutline} />
                                 </div>
                             </IonThumbnail>
                             <IonLabel className="ion-text-wrap">
                                 <h2>Dataset</h2>
                                 { (this.state.canPostDataset) ?
                                     <h3>Post a dataset</h3>
                                     :
                                     <h3>Currently only organizations, councils and other government bodies can post datasets, click here to request access or a demo</h3>
                                 }
                             </IonLabel>
                         </IonItem>
                         { (this.state.canPostRequest) &&
                             <IonItem onClick={() => { this.props.history.push("/request/new/edit") }}>
                                 <IonThumbnail slot="start">
                                     <div>
                                         <IonIcon icon={informationCircleOutline} />
                                     </div>
                                 </IonThumbnail>
                                 <IonLabel className="ion-text-wrap">
                                     <h2>Request</h2>
                                     <h3>Submit a FOI request and we will transfer the request to an appropriate council</h3>
                                 </IonLabel>
                             </IonItem>
                         }
                         <IonItem lines="none" lines="none" onClick={() => { this.props.history.push("/faq/1") }}>
                             <IonThumbnail slot="start">
                                 <div>
                                     <IonIcon icon={chatbubblesOutline} />
                                 </div>
                             </IonThumbnail>
                             <IonLabel className="ion-text-wrap">
                                 <h2>Other ways to contribute</h2>
                                 <h3>You can earn points by commenting, reporting, rating and sharing. Learn more.</h3>
                             </IonLabel>
                         </IonItem>
                     </IonList>
                </div>
            </SwipeableDrawer>
        );
    }

};

export default withIonLifeCycle(NewPostDrawer);
