import { IonIcon, withIonLifeCycle } from '@ionic/react';
import { starOutline } from 'ionicons/icons';
import React from 'react';


class RatingsButton extends React.Component {

    constructor(props) {
        super(props);

        let ratingsSum = 0;

        if (props.ratings) {
            props.ratings.map(rating => { ratingsSum += rating.rating; return rating; })
            ratingsSum = (props.ratings.length !== 0) ? (ratingsSum / props.ratings.length): "0"
        }


        this.state = {
            ratings: ( (props.ratings) && (props.source === "parent") ) ? props.ratings : [],
            ratingsAvg: ratingsSum,
        }
    }

    render() {
        return (
            <div
                onClick={() => { if (!this.props.noClickAction) this.props.onClick(); }}
                data-highlighted={(this.state.ratings.filter(item => { return ( (window.globalVars.user) && (item.userId === window.globalVars.user.id) ) } ).length !== 0)}
            >
                <IonIcon mode="md" icon={starOutline}></IonIcon>
                { (this.state.ratings.length === 0) &&
                    <label>0<span>Rate</span></label>
                }
                { (this.state.ratings.length !== 0) &&
                    <label>{this.state.ratingsAvg + " (" + this.state.ratings.length + ")"}<span>Rating</span></label>
                }
            </div>
        );
    }

};

export default withIonLifeCycle(RatingsButton);
