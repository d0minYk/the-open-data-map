import { Plugins } from '@capacitor/core';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonPage, IonSearchbar, IonTitle, IonToolbar, withIonLifeCycle } from '@ionic/react';
import { chevronDown } from 'ionicons/icons';
import React from 'react';
import '../styles/FAQ.scss';
const { Device } = Plugins;

class FAQ extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            keywords: "",
            selected: "",
            FAQs: [
                {
                    name: "What is the Open Data Map?",
                    content: `
                        The Open Data Map is a portal that enables everyone to visualize, search and explore location-based datasets posted by organizations and governments and where people can open requests, post locations and report, rate, like, share and comment on datasets and locations.
                    `
                },
                {
                    name: "How can I earn points?",
                    content: `
                        <p>Posting a Location - 20 points</p>
                        <p>Reporting a mistake - 10 points</p>
                        <p>Rating - 5 points</p>
                        <p>Commenting - 2 points</p>
                        <p>Sharing - 2 points</p>
                    `
                },
                {
                    name: "What licence types are allowed?",
                    content: `Only licences that allow royalty-free reuse for any purpose are allowed, more information on a locations/datasets licence can be found on its details page. New locations posted directly on The Open Data Map have CC0 licence`
                },
                {
                    name: "My personal data",
                    content: `
                        <p>You can use ODM's API and most functions without signing up, but certain functions require a registration.</p>
                        <p>You need an email address, username and password to sign up. The email address is only used for authetnication and transactional emails and is never shown or searchable by other users (except organization accounts). If you make any posts or comment on something your username will be displayed instead along with your profile picture (optional). Your password is not stored in plaintext and is not readable even by us.</p>
                    `
                },
                {
                    name: "How to use the API",
                    content: `You can read the documentation on the API <a href="/search/guide">here</a> and use a query builder to build advanced search queries <a href="/search">here</a>.`
                },
                {
                    name: "How to post locations",
                    content: `You can post a location by clicking on the add icon from the tab bar`
                },
                {
                    name: "How to post datasets",
                    content: `Datasets can be posted from your profile page by clicking on my posts and then the add button next to my datasets. Each stage of the dataset creation is described in detail, in case you have any other questions don't hesitate to <a href="/contact-us">contact us</a>`
                },
                {
                    name: "Who can post datasets?",
                    content: `
                        At the moment only organizations and government bodies can post datasets, but if you can provide us with a dataset sample we might grant permission to post datasets as well.
                    `
                },
                {
                    name: "How to make your locations more discoverable",
                    content: `You can make your locations more discoverable by adding the appropriate category and features, naming and describing it in detail.`
                },
                {
                    name: "How to make a FOI request",
                    content: `You can make a FOI request by selecting the desired city and clicking on create request. There might be nobody asisgned to the selected city, in this case we will transfer this information directly to responsible entity.`
                },
                {
                    name: "Can i delete my account?",
                    content: `Yes you can contact us from <a href="/contact-us/Request account deletion/I would like my personal data to be deleted.">here</a>`
                },
                {
                    name: "Dataset auto-discovery from CKAN portal",
                    content: `We can automatically detect location based datasets by looking at its content, it might take up to one day to complete initial scan and new datasets appear a day after they were posted. To set a dataset up on ODM simply click a dataset match from your profile.`
                },
            ]
        }
    }

    async ionViewWillEnter() {

        document.title = "FAQ" + window.globalVars.pageTitle;

        if (this.props.match.params.i) {
            this.setState({ selected: this.state.FAQs[this.props.match.params.i] ? this.state.FAQs[this.props.match.params.i].name : "What is the Open Data Map?" })
        }

        this.setState({ keywords: "" })

    }

    search(keywords) {
        this.setState({ keywords: keywords.toLowerCase() })
    }

    render() {
        return (
            <IonPage data-page="faq">
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonBackButton onClick={() => { this.props.history.goBack();  }} />
                        </IonButtons>
                    <IonTitle>FAQ</IonTitle>
                </IonToolbar>
                </IonHeader>
                <IonContent>
                    {/*<iframe style={{border:'none',width:'100%',height:560}} src="http://localhost:8100/dataset/401/map"></iframe>*/}
                    <IonSearchbar
                        debounce={600}
                        showCancelButton="focus"
                        value={this.state.keywords}
                        onIonChange={(e) => {this.search(e.target.value)}}
                        placeholder="Search questions"
                    / >
                    <IonList>
                        { this.state.FAQs.map(item => {

                            if (this.state.keywords && item.name.toLowerCase().indexOf(this.state.keywords) === -1 && item.content.toLowerCase().indexOf(this.state.keywords) === -1 )
                                return null;

                            return (
                                <IonItem onClick={() => { this.setState({ selected: item.name }) }} key={item.name}>
                                    <IonLabel className="ion-text-wrap">
                                        <h2>{item.name}</h2>
                                        { (item.name === this.state.selected) &&
                                            <div dangerouslySetInnerHTML={{
                                                __html : item.content
                                            }} />
                                        }
                                    </IonLabel>
                                    <IonIcon icon={chevronDown} />
                                </IonItem>
                            )
                        }) }
                    </IonList>
                </IonContent>
            </IonPage>
        );
    }

};

export default withIonLifeCycle(FAQ);
