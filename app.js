const { App } = require("@slack/bolt");
require("dotenv").config();
const axios = require("axios");
const { google } = require("googleapis");
const http = require("http");
const url = require("url");
const opn = require("open");
const destroyer = require("server-destroy");
const fs = require("fs");


// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// AUTHENTICATION -> Settuping up oauth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  /*
   * This is where Google will redirect the user after they
   * give permission to your application
   */
  "http://localhost:3000/oauth2callback"
);

const scopes = ["https://www.googleapis.com/auth/drive.file"];
const TOKEN_PATH = "token.json";

// google drive setup
const drive = google.drive({
  version: "v3",
  auth: oauth2Client,
});


(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();

// Listen to the app_home_opened Events API event to hear when a user opens your app from the sidebar
app.event("app_home_opened", async ({ payload, client }) => {
  const userId = payload.user;

  try {
    // Call the views.publish method using the WebClient passed to listeners
    const result = await client.views.publish({
      user_id: userId,
      view: {
        // Home tabs must be enabled in your app configuration page under "App Home"
        type: "home",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "*Welcome to Doxx, <@" + userId + "> :house:*",
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  emoji: true,
                  text: "Create Meeting",
                },
                action_id: "create_meeting",
              },
            ],
          },
          {
            type: "divider",
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: "Doxx",
              },
              {
                type: "mrkdwn",
                text: "goepnik@gmail.com",
              },
            ],
          },
        ],
      },
    });
  } catch (error) {
    console.error(error);
  }
});

// Listens to create meeting button in app home
app.action("create_meeting", async ({ body, ack, client }) => {
  // Acknowledge shortcut request
  ack();

  try {
    // Call the views.open method using the WebClient passed to listeners
    const result = await client.views.open({
      trigger_id: body.trigger_id,
      view: {
          "title": {
            "type": "plain_text",
            "text": "Create A New Meeting",
            "emoji": true
          },
          "submit": {
            "type": "plain_text",
            "text": "Submit",
            "emoji": true
          },
          "type": "modal",
          "callback_id": 'create_meeting_modal',
          "close": {
            "type": "plain_text",
            "text": "Cancel",
            "emoji": true
          },
          "blocks": [
            {
              "type": "header",
              "text": {
                "type": "plain_text",
                "text": "Select a Conversation to Post Meeting Notes In: ",
                "emoji": true
              }
            },
            {
              "type": "actions",
              "block_id": 'block_conversation',
              "elements": [
                {
                  "type": "conversations_select",
                  "placeholder": {
                    "type": "plain_text",
                    "text": "Select a conversation",
                    "emoji": true
                  },
                  "action_id": "action_block"
                }
              ]
            },
            {
              "type": "divider"
            },
            {
              "type": "header",
              "text": {
                "type": "plain_text",
                "text": "Meeting Info: ",
                "emoji": true
              }
            },
            {
              "type": "input",
              "block_id": 'block_title',
              "element": {
                "type": "plain_text_input",
                "placeholder": {
                  "type": "plain_text",
                  "text": "Title of Google Doc",
                  "emoji": true
                },
                "action_id": "plain_text_input-action"
              },
              "label": {
                "type": "plain_text",
                "text": "Title: ",
                "emoji": true
              }
            },
            {
              "type": "input",
              "block_id": 'block_time',
              "element": {
                "type": "timepicker",
                "placeholder": {
                  "type": "plain_text",
                  "text": "Select time",
                  "emoji": true
                },
                "action_id": "timepicker-action"
              },
              "label": {
                "type": "plain_text",
                "text": "Select a Time: ",
                "emoji": true
              }
            },
            {
              "type": "input",
              "block_id": 'block_date',
              "element": {
                "type": "datepicker",
                "placeholder": {
                  "type": "plain_text",
                  "text": "Select a date",
                  "emoji": true
                },
                "action_id": "datepicker-action"
              },
              "label": {
                "type": "plain_text",
                "text": "Select a Date: ",
                "emoji": true
              }
            },
            {
              "type": "divider"
            },
            {
              "type": "header",
              "text": {
                "type": "plain_text",
                "text": "Optional:",
                "emoji": true
              }
            },
            {
              "type": "section",
              "block_id": 'block_sub',
              "text": {
                "type": "mrkdwn",
                "text": "Sub-Folder: "
              },
              "accessory": {
                "type": "multi_conversations_select",
                "placeholder": {
                  "type": "plain_text",
                  "text": "Select conversations",
                  "emoji": true
                },
                "action_id": "multi_conversations_select-action"
              }
            },
              {
                "type": "input",
                "block_id": 'block_url',
                "optional": true,
                "element": {
                  "type": "plain_text_input",
                  "placeholder": {
                    "type": "plain_text",
                    "text": "Link to meeting URL",
                    "emoji": true
                  },
                  "action_id": "plain_text_input-action"
                },
                "label": {
                  "type": "plain_text",
                  "text": "Input Meeting URL: ",
                  "emoji": true
                }
              },
            {
              "type": "divider"
            },
            {
              "type": "context",
              "elements": [
                {
                  "type": "image",
                  "image_url": "https://api.slack.com/img/blocks/bkb_template_images/placeholder.png",
                  "alt_text": "placeholder"
                }
              ]
            },
            {
              "type": "context",
              "elements": [
                {
                  "type": "mrkdwn",
                  "text": "Past events"
                }
              ]
            },
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "*Marketing team breakfast*\n8:30am — 9:30am  |  SF500 · 7F · Saturn (5)"
              }
            },
            {
              "type": "divider"
            },
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "*Coffee chat w/ candidate*\n10:30am — 11:00am  |  SF500 · 10F · Cafe"
              }
            }
          ]
        }
    //     "title": {
    //       "type": "plain_text",
    //       "text": "Create A New Meeting",
    //       "emoji": true
    //     },
    //     "submit": {
    //       "type": "plain_text",
    //       "text": "Submit",
    //       "emoji": true
    //     },
    //     "type": "modal",
    //     "callback_id": 'create_meeting_modal',
    //     "close": {
    //       "type": "plain_text",
    //       "text": "Cancel",
    //       "emoji": true
    //     },
    //     "blocks": [
    //       {
    //         "type": "header",
    //         "text": {
    //           "type": "plain_text",
    //           "text": "Select a Conversation to Post Meeting Notes In: ",
    //           "emoji": true
    //         }
    //       },
    //       {
    //         "type": "actions",
    //         "block_id": 'block_conversation',
    //         "elements": [
    //           {
    //             "type": "conversations_select",
    //             "placeholder": {
    //               "type": "plain_text",
    //               "text": "Select a conversation",
    //               "emoji": true
    //             },
    //             "action_id": "action_block"
    //           }
    //         ]
    //       },
    //       {
    //         "type": "divider"
    //       },
    //       {
    //         "type": "header",
    //         "text": {
    //           "type": "plain_text",
    //           "text": "Meeting Time: ",
    //           "emoji": true
    //         }
    //       },
    //       {
    //         "type": "section",
    //         "text": {
    //           "type": "mrkdwn",
    //           "text": "*Today, 5 January*"
    //         },
    //         "accessory": {
    //           "type": "button",
    //           "text": {
    //             "type": "plain_text",
    //             "text": "Manage App Settings",
    //             "emoji": true
    //           },
    //           "value": "settings"
    //         }
    //       },
    //       {
    //         "type": "input",
    //         "block_id": 'block_time',
    //         "element": {
    //           "type": "timepicker",
    //           "placeholder": {
    //             "type": "plain_text",
    //             "text": "Select time",
    //             "emoji": true
    //           },
    //           "action_id": "timepicker-action"
    //         },
    //         "label": {
    //           "type": "plain_text",
    //           "text": "Select a Time: ",
    //           "emoji": true
    //         }
    //       },
    //       {
    //         "type": "input",
    //         "block_id": 'block_date',
    //         "element": {
    //           "type": "datepicker",
    //           "placeholder": {
    //             "type": "plain_text",
    //             "text": "Select a date",
    //             "emoji": true
    //           },
    //           "action_id": "datepicker-action"
    //         },
    //         "label": {
    //           "type": "plain_text",
    //           "text": "Select a Date: ",
    //           "emoji": true
    //         }
    //       },
    //       {
    //         "type": "divider"
    //       },
    //       {
    //         "type": "header",
    //         "text": {
    //           "type": "plain_text",
    //           "text": "Optional:",
    //           "emoji": true
    //         }
    //       },
    //       {
    //         "type": "section",
    //         "block_id": 'block_sub',
    //         "text": {
    //           "type": "mrkdwn",
    //           "text": "Sub-Folder: "
    //         },
    //         "accessory": {
    //           "type": "multi_conversations_select",
    //           "placeholder": {
    //             "type": "plain_text",
    //             "text": "Select conversations",
    //             "emoji": true
    //           },
    //           "action_id": "multi_conversations_select-action"
    //         }
    //       },
    //       {
    //         "type": "section",
    //         "text": {
    //           "type": "mrkdwn",
    //           "text": "Send a Reminder to the Following Conversation(s):"
    //         },
    //         "accessory": {
    //           "type": "multi_conversations_select",
    //           "placeholder": {
    //             "type": "plain_text",
    //             "text": "Select conversations",
    //             "emoji": true
    //           },
    //           "action_id": "multi_conversations_select-action"
    //         }
    //       },
    //       {
    //         "type": "divider"
    //       },
    //       {
    //         "type": "section",
    //         "text": {
    //           "type": "mrkdwn",
    //           "text": "*<fakelink.toUrl.com|Marketing weekly sync>*\n11:30am — 12:30pm  |  SF500 · 7F · Saturn (5)\nStatus: ✅ Going"
    //         },
    //         "accessory": {
    //           "type": "overflow",
    //           "options": [
    //             {
    //               "text": {
    //                 "type": "plain_text",
    //                 "text": "View Event Details",
    //                 "emoji": true
    //               },
    //               "value": "view_event_details"
    //             },
    //             {
    //               "text": {
    //                 "type": "plain_text",
    //                 "text": "Change Response",
    //                 "emoji": true
    //               },
    //               "value": "change_response"
    //             }
    //           ]
    //         }
    //       },
    //       {
    //         "type": "actions",
    //         "elements": [
    //           {
    //             "type": "button",
    //             "text": {
    //               "type": "plain_text",
    //               "text": "Join Video Call",
    //               "emoji": true
    //             },
    //             "style": "primary",
    //             "value": "join"
    //           }
    //         ]
    //       },
    //       {
    //         "type": "actions",
    //         "elements": [
    //           {
    //             "type": "static_select",
    //             "placeholder": {
    //               "type": "plain_text",
    //               "text": "Going?",
    //               "emoji": true
    //             },
    //             "options": [
    //               {
    //                 "text": {
    //                   "type": "plain_text",
    //                   "text": "Going",
    //                   "emoji": true
    //                 },
    //                 "value": "going"
    //               },
    //               {
    //                 "text": {
    //                   "type": "plain_text",
    //                   "text": "Maybe",
    //                   "emoji": true
    //                 },
    //                 "value": "maybe"
    //               },
    //               {
    //                 "text": {
    //                   "type": "plain_text",
    //                   "text": "Not going",
    //                   "emoji": true
    //                 },
    //                 "value": "decline"
    //               }
    //             ]
    //           }
    //         ]
    //       },
    //       {
    //         "type": "divider"
    //       },
    //       {
    //         "type": "context",
    //         "elements": [
    //           {
    //             "type": "image",
    //             "image_url": "https://api.slack.com/img/blocks/bkb_template_images/placeholder.png",
    //             "alt_text": "placeholder"
    //           }
    //         ]
    //       },
    //       {
    //         "type": "context",
    //         "elements": [
    //           {
    //             "type": "mrkdwn",
    //             "text": "Past events"
    //           }
    //         ]
    //       },
    //       {
    //         "type": "section",
    //         "text": {
    //           "type": "mrkdwn",
    //           "text": "*Marketing team breakfast*\n8:30am — 9:30am  |  SF500 · 7F · Saturn (5)"
    //         }
    //       },
    //       {
    //         "type": "divider"
    //       },
    //       {
    //         "type": "section",
    //         "text": {
    //           "type": "mrkdwn",
    //           "text": "*Coffee chat w/ candidate*\n10:30am — 11:00am  |  SF500 · 10F · Cafe"
    });
    console.log(result);
  } catch (error) {
    console.error(error);
  }
});

let urlTemp = "";

// Handle a view_submission request
app.view(
  "create_meeting_modal",
  async ({ ack, body, view, client, logger }) => {
    // Acknowledge the view_submission request
    await ack();

    // Do whatever you want with the input data - here we're saving it to a DB then sending the user a verifcation of their submission

    // console.log(body);
    // console.log('\n');
    // console.log(view['state']['values']);
    // console.log(view['state']['values']['block_conversation']['action_block'].selected_conversation);
    // console.log(view.state.values['block_conversation']['action_block'].selected_conversation);
    // console.log(view.state.values['block_conversation']);


    const values = view.state.values;
    console.log(values['block_title']['plain_text_input-action'].value);
    console.log(values['block_time']['timepicker-action'].selected_time);
    console.log(values['block_url']['plain_text_input-action'].value);
    await authenticate(createFile(values['block_title']['plain_text_input-action'].value))

    try {
      // Call the chat.postMessage method using the WebClient
      const result = await client.chat.postMessage({
        channel:
          values["block_conversation"]["action_block"]
            .selected_conversation,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: values['block_title']['plain_text_input-action'].value,
              emoji: true,
            },
          },
          {
            type: "section",
            text: {
              type: "plain_text",
              text: values['block_time']['timepicker-action'].selected_time,
              emoji: true,
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Join Video Call",
                  emoji: true,
                },
                url: values['block_url']['plain_text_input-action'].value,
                value: "join",
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Meeting Notes",
                  emoji: true,
                },
                url: urlTemp,
                value: "join",
              },
            ],
          },
        ],
      });

      console.log(result);
    } catch (error) {
      console.error(error);
    }

    // // Assume there's an input block with `block_1` as the block_id and `input_a`
    // const val = view['state']['values']['block_1']['input_a'];
    // const user = body['user']['id'];

    // // Message to send user
    // let msg = '';
    // // Save to DB
    // const results = await db.set(user.input, val);

    // if (results) {
    //   // DB save was successful
    //   msg = 'Your submission was successful';
    // } else {
    //   msg = 'There was an error with your submission';
    // }

    // // Message the user
    // try {
    //   await client.chat.postMessage({
    //     channel: user,
    //     text: msg
    //   });
    // }
    // catch (error) {
    //   logger.error(error);
    // }
  }
);

// reading from file to see if already have token
async function authenticate(callback) {
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(callback);
    oauth2Client.setCredentials(JSON.parse(token));
    callback();
  });
}

/**
 * Open an http server to accept the oauth callback. In this simple example, the only request to our webserver is to /callback?code=<code>
 */
async function getAccessToken(callback) {
  return new Promise((resolve, reject) => {
    // grab the url that will be used for authorization
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
    });
    const server = http
      .createServer(async (req, res) => {
        try {
          if (req.url.indexOf("/oauth2callback") > -1) {
            const qs = new url.URL(req.url, "http://localhost:3050")
              .searchParams;
            res.end("Authentication successful! Please return to the console.");
            server.destroy();
            const { tokens } = await oauth2Client.getToken(qs.get("code"));
            oauth2Client.credentials = tokens; // eslint-disable-line require-atomic-updates
            callback();
            fs.writeFile(TOKEN_PATH, JSON.stringify(tokens), (err) => {
              if (err) return console.error(err);
            });
            resolve(oauth2Client);
          }
        } catch (e) {
          reject(e);
        }
      })
      .listen(3000, () => {
        // open the browser to the authorize url to start the workflow
        opn(authorizeUrl, { wait: false }).then((cp) => cp.unref());
      });
    destroyer(server);
  });
}

/**
 * Creates a file in google drive
 * ATTENTION: NEED TO FIGURE OUT PARENT THING TO PUT IN CORRECT FODLDER (pass in parents array)
 *
 * @param {String} name name of file you want created
 * @returns url of file
 */
function createFile(name) {
  return function () {
    console.log("CREATING FILE");
    drive.files.create(
      {
        requestBody: {
          mimeType: "application/vnd.google-apps.document",
          name: name,
          parents: ["14W6W_jCUxuFI56ZJKYdIPjkeGUtWC65I"],
        },
      },
      function (err, file) {
        if (err) {
          // Handle error
          console.error(err);
        } else {
          console.log(
            `https://docs.google.com/document/d/${file.data.id}/edit`
          );
          urlTemp = `https://docs.google.com/document/d/${file.data.id}/edit`;
          // return `https://docs.google.com/document/d/${file.data.id}/edit`;
        }
      }
    );
  };
}

// ISSUES

// Deployment -> choosing server and how login works
// Authorize opens server everytime -> need to refresh tokens and only open if need https://developers.google.com/drive/api/v3/quickstart/nodejs
// figure out refresh tokens and understand storing them
// Figure out how to put authentication in separate file
// dictionary -> 