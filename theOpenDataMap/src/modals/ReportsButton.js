import { IonIcon, withIonLifeCycle } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';
import React from 'react';


class ReportsButton extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            reports: ( (props.reports) && (props.source === "parent") ) ? props.reports : [],
        }
    }

    render() {
        return (
            <div
                onClick={() => { if (!this.props.noClickAction) this.props.onClick(); }}
                data-highlighted={(this.state.reports.filter(item => { return ( (window.globalVars.user) && (item.userId === window.globalVars.user.id) ) } ).length !== 0)}
            >
                <IonIcon mode="md" icon={alertCircleOutline}></IonIcon>
                <label>
                    {this.state.reports.length}
                    <span>Report</span>
                </label>
            </div>
        );
    }

};

export default withIonLifeCycle(ReportsButton);
