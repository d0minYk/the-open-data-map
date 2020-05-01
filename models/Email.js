const nodemailer = require('nodemailer');
const keys = require('../config/Keys.js');

class EmailModel {

    // Returns a section (new, updates, deletes) of the udpate email
    static generateUpdatesTemplate(name, updates) {

        if (!updates || updates.length === 0) {
            return "";
        }

        return `
            <table bgcolor="#FFFFFF" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="table-layout: fixed; vertical-align: top; min-width: 320px; Margin: 0 auto; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #FFFFFF; width: 100%;" valign="top" width="100%">
                <tbody>
                    <tr style="vertical-align: top;" valign="top">
                        <td style="word-break: break-word; vertical-align: top;" valign="top">
                            <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color:#FFFFFF"><![endif]-->
                            <div style="background-color:transparent;">
                            <div class="block-grid" style="Margin: 0 auto; min-width: 320px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; background-color: transparent;">
                            <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
                            <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:500px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
                            <!--[if (mso)|(IE)]><td align="center" width="500" style="background-color:transparent;width:500px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:5px; padding-bottom:5px;"><![endif]-->
                            <div class="col num12" style="min-width: 320px; display: table-cell; vertical-align: top; width: 500px;">
                            <div style="width:100% !important;">
                            <!--[if (!mso)&(!IE)]><!-->
                            <div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;">
                            <!--<![endif]-->
                            <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px; font-family: Arial, sans-serif"><![endif]-->
                            <div style="color:#555555;font-family:Arial, Helvetica Neue, Helvetica, sans-serif;line-height:1.2;padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px;">
                            <div style="line-height: 1.2; font-size: 12px; color: #555555; font-family: Arial, Helvetica Neue, Helvetica, sans-serif; mso-line-height-alt: 14px;">
                            <p style="line-height: 1.2; word-break: break-word; font-size: 16px; mso-line-height-alt: 19px; margin: 0;"><span style="font-size: 16px;"><strong>${name}</strong></span></p>
                            </div>
                            </div>
                            <!--[if mso]></td></tr></table><![endif]-->
                            <!--[if (!mso)&(!IE)]><!-->
                            </div>
                            <!--<![endif]-->
                            </div>
                            </div>
                            <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
                            <!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
                            </div>
                            </div>
                            </div>

                            ${ updates.map(item => {

                                let fields = "";

                                for (let key in item.originalFields) {
                                    let value = item.fields[key];
                                    if (value && value !== "undefined" && value !== "null")
                                    fields += `
                                        <p style="font-size: 14px; line-height: 1.2; word-break: break-word; mso-line-height-alt: 17px; margin: 0;"><span style="font-size: 14px; color: #555;"><strong>${key}</strong></span></p>
                                        <p style="font-size: 14px; line-height: 1.2; word-break: break-word; mso-line-height-alt: 17px; margin: 0;"><span style="font-size: 14px; color: #555;">${value}</span></p>
                                        <p style="font-size: 14px; line-height: 1.2; word-break: break-word; mso-line-height-alt: 17px; margin: 0;"><span style="font-size: 14px;"> </span></p>
                                    `
                                }

                                return (
                                    `
                                        <div style="background-color:transparent;">
                                        <div class="block-grid" style="Margin: 0 auto; min-width: 320px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; background-color: #efefef; border-radius: 8px; overflow: hidden;">
                                        <div style="border-collapse: collapse;display: table;width: 100%;background-color:#efefef;">
                                        <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:500px"><tr class="layout-full-width" style="background-color:#efefef"><![endif]-->
                                        <!--[if (mso)|(IE)]><td align="center" width="500" style="background-color:#efefef;width:500px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:5px; padding-bottom:5px;"><![endif]-->
                                        <div class="col num12" style="min-width: 320px; display: table-cell; vertical-align: top; width: 500px;">
                                        <div style="width:100% !important;">
                                        <!--[if (!mso)&(!IE)]><!-->
                                        <div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;">
                                        <!--<![endif]-->
                                        <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px; font-family: Arial, sans-serif"><![endif]-->
                                        <div style="color:#555555;font-family:Arial, Helvetica Neue, Helvetica, sans-serif;line-height:1.2;padding-top:10px;padding-right:10px;padding-bottom:0px;padding-left:10px;">
                                        <div style="font-size: 14px; line-height: 1.2; color: #555555; font-family: Arial, Helvetica Neue, Helvetica, sans-serif; mso-line-height-alt: 17px;">
                                        <p style="font-size: 18px; line-height: 1.2; word-break: break-word; mso-line-height-alt: 22px; margin: 0;"><span style="font-size: 18px; color: #555;"><strong>${item.name}</strong></span></p>
                                        <p style="font-size: 15px; line-height: 1.2; word-break: break-word; mso-line-height-alt: 18px; margin: 0;"><span style="font-size: 15px; color: #555;"><strong>${ (item.streetHouse || "") + " " + (item.postcode || "") + " " + (item.cityName || "") + " " + (item.countryName || "") }</strong></span></p>
                                        <p style="font-size: 14px; line-height: 1.2; word-break: break-word; mso-line-height-alt: 17px; margin: 0;"> </p>
                                        ${fields}
                                        </div>
                                        </div>
                                        <!--[if mso]></td></tr></table><![endif]-->
                                        <!--[if (!mso)&(!IE)]><!-->
                                        </div>
                                        <!--<![endif]-->
                                        </div>
                                        </div>
                                        <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
                                        <!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
                                        </div>
                                        </div>
                                        </div>
                                    `
                                )
                            }) }

                            <!--[if (mso)|(IE)]></td></tr></table><![endif]-->


                        </td>
                    </tr>
                </tbody>
            </table>
        `

    }

    // Generates and sends an email about a dataset update
    static async sendDatasetUpdate(email, dataset, changes) {

        console.log("Sending email to " + email)

        var transporter = nodemailer.createTransport({
            host: keys.email.default.host,
            port: keys.email.default.port,
            secure: true,
            auth: {
                user: keys.email.default.email,
                pass: keys.email.default.password,
            }
        });

        let updatesDOM = this.generateUpdatesTemplate("New Locations", changes.new) + this.generateUpdatesTemplate("Updated Locations", changes.updated) + this.generateUpdatesTemplate("Removed Locations", changes.removed);

        transporter.sendMail({
            from: '"The Open Data Map " <noreply@theopendatamap.com>',
            to: email,
            subject: dataset.name + " updates",
            html: `
                <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <html xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                <head>
                <meta name="viewport" content="width=device-width" />
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                <title>Actionable emails e.g. reset password</title>

                <style type="text/css">
                		body {
                			margin: 0;
                			padding: 0;
                		}

                		table,
                		td,
                		tr {
                			vertical-align: top;
                			border-collapse: collapse;
                		}

                		* {
                			line-height: inherit;
                		}

                		a[x-apple-data-detectors=true] {
                			color: inherit !important;
                			text-decoration: none !important;
                		}
                	</style>
                <style id="media-query" type="text/css">
                		@media (max-width: 520px) {

                			.block-grid,
                			.col {
                				min-width: 320px !important;
                				max-width: 100% !important;
                				display: block !important;
                			}

                			.block-grid {
                				width: 100% !important;
                			}

                			.col {
                				width: 100% !important;
                			}

                			.col>div {
                				margin: 0 auto;
                			}

                			img.fullwidth,
                			img.fullwidthOnMobile {
                				max-width: 100% !important;
                			}

                			.no-stack .col {
                				min-width: 0 !important;
                				display: table-cell !important;
                			}

                			.no-stack.two-up .col {
                				width: 50% !important;
                			}

                			.no-stack .col.num4 {
                				width: 33% !important;
                			}

                			.no-stack .col.num8 {
                				width: 66% !important;
                			}

                			.no-stack .col.num4 {
                				width: 33% !important;
                			}

                			.no-stack .col.num3 {
                				width: 25% !important;
                			}

                			.no-stack .col.num6 {
                				width: 50% !important;
                			}

                			.no-stack .col.num9 {
                				width: 75% !important;
                			}

                			.video-block {
                				max-width: none !important;
                			}

                			.mobile_hide {
                				min-height: 0px;
                				max-height: 0px;
                				max-width: 0px;
                				display: none;
                				overflow: hidden;
                				font-size: 0px;
                			}

                			.desktop_hide {
                				display: block !important;
                				max-height: none !important;
                			}
                		}
                	</style>




                <style type="text/css">
                img {
                max-width: 100%;
                }
                body {
                -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important; height: 100%; line-height: 1.6em;
                }
                body {
                background-color: #f6f6f6;
                }
                @media only screen and (max-width: 640px) {
                  body {
                    padding: 0 !important;
                  }
                  h1 {
                    font-weight: 800 !important; margin: 20px 0 5px !important;
                  }
                  h2 {
                    font-weight: 800 !important; margin: 20px 0 5px !important;
                  }
                  h3 {
                    font-weight: 800 !important; margin: 20px 0 5px !important;
                  }
                  h4 {
                    font-weight: 800 !important; margin: 20px 0 5px !important;
                  }
                  h1 {
                    font-size: 22px !important;
                  }
                  h2 {
                    font-size: 18px !important;
                  }
                  h3 {
                    font-size: 16px !important;
                  }
                  .container {
                    padding: 0 !important; width: 100% !important;
                  }
                  .content {
                    padding: 0 !important;
                  }
                  .content-wrap {
                    padding: 10px !important;
                  }
                  .invoice {
                    width: 100% !important;
                  }
                }
                </style>
                </head>

                <body itemscope itemtype="http://schema.org/EmailMessage" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important; height: 100%; line-height: 1.6em; background-color: #f6f6f6; margin: 0;" bgcolor="#f6f6f6">
                    <table class="body-wrap" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; background-color: #f6f6f6; margin: 0;" bgcolor="#f6f6f6">
                        <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                            <td style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;" valign="top"></td>
                                <td class="container" width="600" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; display: block !important; max-width: 600px !important; clear: both !important; margin: 0 auto;" valign="top">
                                    <div class="content" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; max-width: 600px; display: block; margin: 0 auto; padding: 20px;">
                                        <table class="main" width="100%" cellpadding="0" cellspacing="0" itemprop="action" itemscope itemtype="http://schema.org/ConfirmAction" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; border-radius: 3px; background-color: #fff; margin: 0; border: 1px solid #e9e9e9;" bgcolor="#fff">
                                            <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                                <td class="content-wrap" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 20px;" valign="top">
                                                    <meta itemprop="name" content="${dataset.name + " updates"}" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
                                                    <table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                                        <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                                            <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                                                                <img src="https://theopendatamap.com/logo-purple.png" border="0" width="160" style="border:0;display:block;line-height:100%;outline:none;text-decoration:none;max-width:600px;margin-top:0px;" alt="The Open Data Map">
                                                            </td>
                                                        </tr>
                                                        <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                                            <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                                                                The following updates occured in the <strong>${dataset.name}</strong> dataset you are subscribed to. You can unsubscribe from these alerts by clicking the button at the bottom of this page and clicking "Unsubscribe from updates" (you must be logged in)
                                                            </td>
                                                        </tr>
                                                        ${updatesDOM}
                                                        <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin-top: 20px;">
                                                            <td class="content-block" itemprop="handler" itemscope itemtype="http://schema.org/HttpActionHandler" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                                                                <a href=${keys.domainName + "dataset/" + dataset.id} class="btn-primary" itemprop="url" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; color: #FFF; text-decoration: none; line-height: 2em; font-weight: bold; text-align: center; cursor: pointer; display: inline-block; border-radius: 5px; text-transform: capitalize; background-color: #5F6CAF; margin: 0; border-color: #5F6CAF; border-style: solid; border-width: 10px 20px;">View Dataset</a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        <div class="footer" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; clear: both; color: #999; margin: 0; padding: 20px;">
                                            <table width="100%" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                                <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                                    <td class="aligncenter content-block">
                                                        <a href="${keys.domainName}">The Open Data Map</a> | <a href="${keys.domainName}legal">Legal</a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </div>
                                    </div>
                                </td>
                            <td style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;" valign="top"></td>
                        </tr>
                    </table>
                </body>
                </html>
            `
        }, function(error, info){
            if (error) console.error(error);
            console.log(info)
            // callback(error, info);
        });

    }

    // Sends an email with the main style
    static async send(data) {

        console.log("Sending email to " + data.to)

        var transporter = nodemailer.createTransport({
            host: keys.email.default.host,
            port: keys.email.default.port,
            secure: true,
            auth: {
                user: keys.email.default.email,
                pass: keys.email.default.password,
            }
        });

        transporter.sendMail({
            from: '"The Open Data Map " <noreply@theopendatamap.com>',
            to: data.to,
            subject: data.subject,
            html: `
                <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <html xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                <head>
                <meta name="viewport" content="width=device-width" />
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                <title>Actionable emails e.g. reset password</title>


                <style type="text/css">
                img {
                max-width: 100%;
                }
                body {
                -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important; height: 100%; line-height: 1.6em;
                }
                body {
                background-color: #f6f6f6;
                }
                @media only screen and (max-width: 640px) {
                  body {
                    padding: 0 !important;
                  }
                  h1 {
                    font-weight: 800 !important; margin: 20px 0 5px !important;
                  }
                  h2 {
                    font-weight: 800 !important; margin: 20px 0 5px !important;
                  }
                  h3 {
                    font-weight: 800 !important; margin: 20px 0 5px !important;
                  }
                  h4 {
                    font-weight: 800 !important; margin: 20px 0 5px !important;
                  }
                  h1 {
                    font-size: 22px !important;
                  }
                  h2 {
                    font-size: 18px !important;
                  }
                  h3 {
                    font-size: 16px !important;
                  }
                  .container {
                    padding: 0 !important; width: 100% !important;
                  }
                  .content {
                    padding: 0 !important;
                  }
                  .content-wrap {
                    padding: 10px !important;
                  }
                  .invoice {
                    width: 100% !important;
                  }
                }
                </style>
                </head>

                <body itemscope itemtype="http://schema.org/EmailMessage" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important; height: 100%; line-height: 1.6em; background-color: #f6f6f6; margin: 0;" bgcolor="#f6f6f6">
                    <table class="body-wrap" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; background-color: #f6f6f6; margin: 0;" bgcolor="#f6f6f6">
                        <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                            <td style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;" valign="top"></td>
                        		<td class="container" width="600" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; display: block !important; max-width: 600px !important; clear: both !important; margin: 0 auto;" valign="top">
                        			<div class="content" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; max-width: 600px; display: block; margin: 0 auto; padding: 20px;">
                        				<table class="main" width="100%" cellpadding="0" cellspacing="0" itemprop="action" itemscope itemtype="http://schema.org/ConfirmAction" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; border-radius: 3px; background-color: #fff; margin: 0; border: 1px solid #e9e9e9;" bgcolor="#fff">
                                            <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                                <td class="content-wrap" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 20px;" valign="top">
                        							<meta itemprop="name" content=${data.subject} style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
                                                    <table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                                        <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                                            <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                                                                <img src="https://theopendatamap.com/logo-purple.png" border="0" width="160" style="border:0;display:block;line-height:100%;outline:none;text-decoration:none;max-width:600px;margin-top:0px;" alt="The Open Data Map">
                                                            </td>
                                                        </tr>
                                                        <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                                            <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                        										${data.content}
                        									</td>
						                                </tr>
                                                        ${ (data.actionButton) ?
                                                            `
                                                        <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                                            <td class="content-block" itemprop="handler" itemscope itemtype="http://schema.org/HttpActionHandler" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                                                                <a href=${data.actionButton.link} class="btn-primary" itemprop="url" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; color: #FFF; text-decoration: none; line-height: 2em; font-weight: bold; text-align: center; cursor: pointer; display: inline-block; border-radius: 5px; text-transform: capitalize; background-color: #5F6CAF; margin: 0; border-color: #5F6CAF; border-style: solid; border-width: 10px 20px;">${data.actionButton.title}</a>
                                                            </td>
                                                        </tr>
                                                            `
                                                            :
                                                            ""
                                                        }
                                                    </table>
                                                </td>
                    					    </tr>
                                        </table>
                                        <div class="footer" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; clear: both; color: #999; margin: 0; padding: 20px;">
                    					    <table width="100%" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                                <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                                    <td class="aligncenter content-block">
                                                        <a href="${keys.domainName}">The Open Data Map</a> | <a href="${keys.domainName}legal">Legal</a>
                                                    </td>
    						                    </tr>
                                            </table>
                                        </div>
                                    </div>
                		        </td>
                    		<td style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;" valign="top"></td>
                    	</tr>
                    </table>
                </body>
                </html>
            `
        }, function(error, info){
            if (error) console.error(error);
            console.log(info)
            // callback(error, info);
        });

    }

}

module.exports = EmailModel;
