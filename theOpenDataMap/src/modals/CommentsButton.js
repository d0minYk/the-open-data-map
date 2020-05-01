import { IonIcon, withIonLifeCycle } from '@ionic/react';
import { chatboxOutline } from 'ionicons/icons';
import React from 'react';

class CommentButton extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            comments: ( (props.comments) && (props.source === "parent") ) ? props.comments : [],
        }
    }

    render() {
        return (
            <div
                onClick={() => { if (this.props.onClick) this.props.onClick(); }}
                data-highlighted={(this.state.comments.filter(item => { return ( (window.globalVars.user) && (item.userId === window.globalVars.user.id) ) } ).length !== 0)}
            >
                <IonIcon mode="md" icon={chatboxOutline}></IonIcon>
                <label>
                    {this.state.comments.length}
                    <span>Comment</span>
                </label>
            </div>
        );
    }

};

export default withIonLifeCycle(CommentButton);
