import { IonChip, withIonLifeCycle } from '@ionic/react';
import React from 'react';
import Storage from '../Storage';
import '../styles/TagSuggestions.scss';



class TagSuggestions extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            query: ""
        }
    }

    async componentDidMount() {

        let tags = await Storage.getO("allTags");

        if (tags && Array.isArray(tags) && tags.length !== 0) {
            this.setState({ tags: tags })
        }

    }

    async componentWillReceiveProps(nextProps) {

        if (nextProps.query !== null && nextProps.query !== undefined && nextProps.query !== this.state.query) {
            this.setState({ query: nextProps.query.toLowerCase() })
        }

        if (nextProps.suggestFeatureFrom) {
            if (this.state.tags && this.state.tags.length !== 0) {
                let suggestions = [];
                for (let i = 0; i < nextProps.suggestFeatureFrom.length; i++) {
                    let category = nextProps.suggestFeatureFrom[i].text;
                    for (let j = 0; j < this.state.tags.length; j++) {
                        if (this.state.tags[j].name.toLowerCase() === category && this.state.tags[j].type === "category") {
                            suggestions = suggestions.concat(this.state.tags[j].features);
                        }
                    }
                }
                suggestions = [...new Set(suggestions)]
                this.setState({ suggestions: suggestions })
            }
        }

    }

    render() {

        if (!this.state.tags)
            return null;

        let count = 0;

        return (
            <div className="tag-suggestions">
                { (this.state.query === "" && this.state.suggestions) && this.state.suggestions.map(item => {
                    if (!item) return null
                    return ( <IonChip key={item} style={{ borderColor: window.globalVars.COLORS.purple, color: window.globalVars.COLORS.purple, fontWeight: 700 }} onClick={() => { this.props.onSelect(item) }}>{item}</IonChip> )
                }) }
                { this.state.tags.map(item => {

                    if (item.type !== this.props.type) return null;
                    if (this.state.query && item.name.indexOf(this.state.query) === -1) return null;

                    count++;

                    if (count > 10) {
                        return null;
                    }

                    return (
                        <IonChip key={item.name} onClick={() => { this.props.onSelect(item.name) }}>{item.name}</IonChip>
                    )

                }) }
            </div>
        );
    }

};

export default withIonLifeCycle(TagSuggestions);
