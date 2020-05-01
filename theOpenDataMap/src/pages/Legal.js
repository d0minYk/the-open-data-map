import { IonBackButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, withIonLifeCycle } from '@ionic/react';
import React, { createRef } from 'react';
import '../styles/Lagal.scss';

class Legal extends React.Component {

    constructor(props) {
        super(props);
        this.contentRef = createRef();
        this.termsRef = createRef();
        this.privacyRef = createRef();
        this.gdprRef = createRef();
        this.state = {

        }
    }

    ionViewWillEnter() {
        document.title = "Legal" + window.globalVars.pageTitle;
    }

    render() {
        return (
            <IonPage data-page="legal">
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                        <IonBackButton onClick={() => { this.props.history.goBack();  }} />
                    </IonButtons>
                    <IonTitle>Legal</IonTitle>
                </IonToolbar>
                </IonHeader>
                <IonContent>

                <div className="content" ref={this.contentRef}>

                    <ul className="links">
                        <li><a onClick={() => { this.contentRef.current.scrollTo(0, this.termsRef.current.offsetTop)  }}>Terms and Conditions (Last updated 03/03/2020)</a></li>
                        <li><a onClick={() => { this.contentRef.current.scrollTo(0, this.privacyRef.current.offsetTop)  }}>Privacy Policy (Last updated 03/03/2020)</a></li>
                        <li><a onClick={() => { this.contentRef.current.scrollTo(0, this.gdprRef.current.offsetTop)  }}>GDPR (Last updated 03/03/2020)</a></li>
                    </ul>

                    <h2>TLDR</h2>

                    <ul>
                        <li>Our service is only available for people who are 18 or older.</li>
                        <li>We don't own, use or sell your personal or other data to anyone.</li>
                        <li>We use Google Analytics to better understand and improve our services, no personal data is transfered to Google</li>
                        <li>You can request your personal data to be delelted at any time from the <a onClick={() => { this.props.history.push("/contact-us/Request account deletion/I would like my account to be deleted.") }}>contact us page</a>.</li>
                        <li>We reserve the right to terminate your account without any notice if you intentionally post harmful, inappropriate or inaccurate information.</li>
                        <li>Datasets posted on The Open Data Map by councils, organizations and other government bodies must be open data already.</li>
                        <li>Location posted on The Open Data Map both by organizations or users will have Creative Commons No rights reserved licence (CC0)</li>
                    </ul>

                    <h2>Changes to our Terms & Conditions and Privacy Policy</h2>
                    <p>We reserve the right to change our Terms & Conditions and Privacy Policy at any time.</p>
                    <p>Your continued use of The Open Data Map after any modifications of our Terms & Conditions or Privacy Policy on this page will constitute your acknowledgment of the modifications and your consent to abide by them.</p>
                    <p>If we make changes to this page, we will notify you through the email address you have provided us.</p>
                    <p>Please read these Terms & Conditions & Privacy Policy carefully before using the <a href="https://www.theopendatamap.com/">www.theopendatamap.com</a> website and the The Open Data Map mobile applications operated by Dominik Gyecsek ("The Open Data Map", "us", "we", or "our").</p>
                    <p>Your access to and use of The Open Data Map is conditioned upon your acceptance of and compliance with these Terms and Conditions and Privacy Policy. If you disagree with any part then you do not have permission to use our service.</p>
                    <p><strong>Contact us if you have any questions at <a href="mailto:dominik@theopendatamap.com">dominik@theopendatamap.com</a> or from the <a onClick={() => { this.props.history.push("/contact-us") }}>contact us page</a></strong></p>

                    <div id="terms" ref={this.termsRef}>

                        <h2>Terms & Conditions</h2>

                        <h3>Communications</h3>
                        <p>We will only send emails to your email address in the following cases:</p>
                        <ul>
                            <li>Terms & Condition, Privacy Policy changes</li>
                            <li>To help you get back into your account</li>
                            <li>Respond to one of your queries</li>
                            <li>Notify you if a report is received to one of your posted location</li>
                            <li>Notify you if a FOI request's status posted by you has changed</li>
                        </ul>

                        <h3>Content</h3>
                        <p>Our Service allows you to post locations, requests, datasets, comments, reports, ratings and upload files ("Content"). You are responsible for the Content that you post on the Service, including its legality. By posting Content on the Service, you confirm that the Content is yours and/or you have the right to use it and acknowlede that the data posted will have Creative Commons No rights reserved licence (CC0).</p>
                        <p>We take no responsibility and assume no liability for Content you or any third party posts on the Service. We have the right to monitor all Content provided by the users.</p>
                        <p>Any content stored on the Service will be stored indefinitely, deleting content (that is not personal data) makes the content publicly hidden.</p>

                        <h3>Accounts</h3>
                        <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for any and all activities or actions that occur under your account. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</p>

                        <h3>Intellectual Property</h3>
                        <p>We respect the intellectual property rights of others. If you believe that someone infringing on these please contact us.</p>

                        <h3>Termination</h3>
                        <p>We may terminate or suspend your account and bar access to the Service at any time, without prior notice or liability if you intentionally post harmful, inappropriate or inaccurate information.</p>

                        <h3>Indemnification</h3>
                        <p>You agree to defend, indemnify and hold harmless The Open Data Map from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses, resulting from or arising out of</p>
                        <ul>
                            <li>your use and access of the Service, by you or any person using your account and password</li>
                            <li>a breach of these Terms</li>
                            <li>Content posted on the Service.</li>
                        </ul>

                        <h3>Limitation Of Liability</h3>
                        <p>In no event shall The Open Data Map be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from</p>
                        <ul>
                            <li>your access to or use of or inability to access or use the Service</li>
                            <li>any conduct or content of any third party on the Service</li>
                            <li>any content obtained from the Service</li>
                            <li>unauthorized access, use or alteration of your transmissions or content</li>
                        </ul>

                        <h3>Disclaimer</h3>
                        <p>Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied.</p>

                        <p>We do not warrant that</p>
                        <ul>
                            <li>the Service will function uninterrupted, secure or available at any particular time or location</li>
                            <li>any errors or defects will be corrected</li>
                            <li>the Service is free of any harmful components</li>
                            <li>the results of using the Service will meet your requirements</li>
                        </ul>

                    </div>

                    <div id="privacy" ref={this.privacyRef}>

                        <h2>Privacy Policy</h2>

                        <p>This page informs you of our policies regarding the collection, use and disclosure of Personal Information when you use our Service.</p>
                        <p>We will not use or share your information with anyone except as described in this Privacy Policy.</p>
                        <p>We use your Personal Information for providing and improving the Service. By using the Service, you agree to the collection and use of information in accordance with this policy.</p>
                        <p>While using our Service, we may ask you to provide us with personally identifiable information, these may include, your email address, username and other personal information ("Personal Information").</p>
                        <p>We collect this information for the purpose of identifying and communicating with you.</p>

                        <h3>Log Data</h3>
                        <p>We collect information that your browser sends whenever you visit our website, use our API or use our app.</p>
                        <p>This Log Data may include the following information:</p>
                        <ul>
                            <li>IP address</li>
                            <li>Browser type</li>
                            <li>Browser version</li>
                            <li>The pages of our Service that you visit and the time and date of your visit</li>
                            <li>Mobile device's type</li>
                            <li>Mobile device's unique ID</li>
                            <li>Mobile device's operating system</li>
                            <li>other statistics</li>
                        </ul>

                        <p>In addition, we use third party services to improve our product and troubleshoot issues, we do not share any personal data with these providers. These providers include Google Analytics (https://analytics.google.com) and Bugsnag (https://www.bugsnag.com/).</p>

                        <h3>Cookies</h3>
                        <p>Cookies are files with a small amount of data, which may include an anonymous unique identifier. Cookies are sent to your browser from a web site and transferred to your device. We only use cookies to keep you logged in but the aforementioned third-party services may use other cookies for better analytics, these do not include personal data.</p>

                        <h3>Compliance With Laws</h3>
                        <p>We will disclose your Personal Information where required to do so by law or subpoena or if we believe that such action is necessary to comply with the law and the reasonable requests of law enforcement or to protect the security or integrity of our Service.</p>

                        <h3>Security</h3>
                        <p>The security of your Personal Information is important to us, and we strive to implement and maintain reasonable, commercially acceptable security procedures and practices appropriate to the nature of the information we store, in order to protect it from unauthorized access, destruction, use, modification, or disclosure.</p>
                        <p>However no method of transmission over the internet, or method of electronic storage is 100% secure and we are unable to guarantee the absolute security of the Personal Information we have collected from you.</p>

                        <h3>International Processing</h3>
                        <p>Your information, including Personal Information, may be transferred and stored on servers located outside of your governmental jurisdiction where the data protection laws may be different than those from your jurisdiction.</p>

                        <h3>Underage</h3>
                        <p>Our service is only available for people who are 18 or older.</p>
                        <p>We do not knowingly collect personally identifiable information from people under 18.</p>
                        <p>If we become aware that we have collected Personal Information from a person under 18 without verification of parental consent, we will remove that information from our service.</p>

                    </div>

                    <div id="gdpr" ref={this.gdprRef}>

                        <h2>GDPR</h2>

                        <h3>Data Export</h3>
                        <p>You can request a full data export containing all data posted by you from the <a onClick={() => { this.props.history.push("/contact-us/Request personal data/I would like to request my personal data.") }}>contact us page</a>. Once requested we will send you a download link in 5 business days.</p>

                        <h3>Deletion</h3>
                        <p>All content you post or upload can be deleted which makes the content publicly hidden but will remain stored on the server.</p>
                        <p>You can request to terminate your account with all your data deleted by contacting us.</p>

                        <h3>Cookies and Analytics</h3>
                        <p>We use cookies and other local storage solutions to securely identify your account and keep you signed in.</p>
                        <p>We use analytics services to improve our product and troubleshoot issues. These include Google Analytics (https://analytics.google.com) and Bugsnag (https://www.bugsnag.com/).</p>

                    </div>

                </div>

                </IonContent>
            </IonPage>
        );
    }

};

export default withIonLifeCycle(Legal);
