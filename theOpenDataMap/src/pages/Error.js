import { IonContent, IonPage, withIonLifeCycle } from '@ionic/react';
import React from 'react';
import '../styles/Error.scss';

class Error extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <IonPage data-page="error">
                <IonContent>
                    <div className="error-container">
                        <div className="error">
                            <h2>{this.props.match.params.code}</h2>
                            { (this.props.match.params.msg && this.props.match.params.msg !== 'undefined') &&
                                <p>{this.props.match.params.msg}</p>
                            }
                            <button onClick={() => { this.props.history.push("/") }}>Back to home</button>
                        </div>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

};

export default withIonLifeCycle(Error);
