import React, { Component } from 'react';
import '../styles/Spinner.scss';

class Spinner extends Component {

    render () {

        return (
            <div className="spinner-container" data-show={this.props.show}>
                <svg className="spinner" viewBox="0 0 50 50">
                    <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                </svg>
            </div>
        )

    }

}

export default Spinner;
