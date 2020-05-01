import React, { Component } from 'react';
import '../styles/Loader.scss';
import Spinner from './Spinner';


class Loader extends Component {

    render() {

        return (
            <div className="full-screen-loader">
                <Spinner show={true} />
            </div>
        );

    }

}

export default Loader;
