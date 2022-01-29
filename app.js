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
  authenticate(() => console.log("HI"));
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
            type: "header",
            text: {
              type: "plain_text",
              text: "Welcome",
              emoji: true,
            },
          },
          {
            type: "divider",
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
              {
                "type": "button",
                "text": {
                  "type": "plain_text",
                  "text": "Create Doc",
                  "emoji": true
                },
                "value": "click_me_123",
                "action_id": "actionId-0"
              }
            ],
          },
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "Upcoming Meetings :calendar:",
              emoji: true,
            },
          },
          {
            type: "divider",
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "`11/20-11/22` *Beet the Competition*",
            },
            accessory: {
              type: "button",
              text: {
                type: "plain_text",
                text: "Join Meeting",
                emoji: true,
              },
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "`12/01` *Daily Standup*",
            },
            accessory: {
              type: "button",
              text: {
                type: "plain_text",
                text: "Join Meeting",
                emoji: true,
              },
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "`11/13` *Business Exec Meeting*",
            },
            accessory: {
              type: "button",
              text: {
                type: "plain_text",
                text: "Join Meeting",
                emoji: true,
              },
            },
          },
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "Past Meetings :calendar:",
              emoji: true,
            },
          },
          {
            type: "divider",
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "`10/21` *Conference Room Meeting*",
            },
            accessory: {
              type: "button",
              text: {
                type: "plain_text",
                text: "View Notes",
                emoji: true,
              },
            },
          },
          {
            type: "divider",
          },
          {
            type: "image",
            image_url:
              "https://media.istockphoto.com/vectors/creative-writing-and-storytelling-concept-illustration-copywriting-vector-id998352216?b=1&k=20&m=998352216&s=170667a&w=0&h=c2U3iK9JdEG8c5blChppXEMKHSkprWlCAgQj4skLack=",
            alt_text: "inspiration",
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
        title: {
          type: "plain_text",
          text: "Create A New Meeting",
          emoji: true,
        },
        submit: {
          type: "plain_text",
          text: "Submit",
          emoji: true,
        },
        type: "modal",
        callback_id: "create_meeting_modal",
        close: {
          type: "plain_text",
          text: "Cancel",
          emoji: true,
        },
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "Select a Conversation to Post Meeting Notes In: ",
              emoji: true,
            },
          },
          {
            type: "actions",
            block_id: "block_conversation",
            elements: [
              {
                type: "conversations_select",
                placeholder: {
                  type: "plain_text",
                  text: "Select a conversation",
                  emoji: true,
                },
                "filter": {
                  "include": [
                    "mpim",
                    "im",
                    "public"
                  ],
                  "exclude_bot_users": true
                },
                action_id: "action_block",
              },
            ],
          },
          {
            type: "divider",
          },
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "Meeting Info: ",
              emoji: true,
            },
          },
          {
            type: "input",
            block_id: "block_title",
            element: {
              type: "plain_text_input",
              placeholder: {
                type: "plain_text",
                text: "Title of Google Doc",
                emoji: true,
              },
              action_id: "plain_text_input-action",
            },
            label: {
              type: "plain_text",
              text: "Title: ",
              emoji: true,
            },
          },
          {
            type: "input",
            block_id: "block_time",
            element: {
              type: "timepicker",
              placeholder: {
                type: "plain_text",
                text: "Select time",
                emoji: true,
              },
              action_id: "timepicker-action",
            },
            label: {
              type: "plain_text",
              text: "Select a Time: ",
              emoji: true,
            },
          },
          {
            type: "input",
            block_id: "block_date",
            element: {
              type: "datepicker",
              placeholder: {
                type: "plain_text",
                text: "Select a date",
                emoji: true,
              },
              action_id: "datepicker-action",
            },
            label: {
              type: "plain_text",
              text: "Select a Date: ",
              emoji: true,
            },
          },
          {
            type: "divider",
          },
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "Optional:",
              emoji: true,
            },
          },
          {
            type: "section",
            block_id: "block_sub",
            text: {
              type: "mrkdwn",
              text: "Sub-Folder: ",
            },
            accessory: {
              type: "multi_conversations_select",
              placeholder: {
                type: "plain_text",
                text: "Select conversations",
                emoji: true,
              },
              action_id: "multi_conversations_select-action",
            },
          },
          {
            type: "input",
            block_id: "block_url",
            optional: true,
            element: {
              type: "plain_text_input",
              placeholder: {
                type: "plain_text",
                text: "Link to meeting URL",
                emoji: true,
              },
              action_id: "plain_text_input-action",
            },
            label: {
              type: "plain_text",
              text: "Input Meeting URL: ",
              emoji: true,
            },
          },
          {
            type: "divider",
          },
          {
            type: "context",
            elements: [
              {
                type: "image",
                image_url:
                  "https://api.slack.com/img/blocks/bkb_template_images/placeholder.png",
                alt_text: "placeholder",
              },
            ],
          },
        ],
      },
    });
    console.log(result);
  } catch (error) {
    console.error(error);
  }
});

// Handle a view_submission request
app.view(
  "create_meeting_modal",
  async ({ ack, body, view, client, logger }) => {
    // Acknowledge the view_submission request
    await ack();

    // Do whatever you want with the input data - here we're saving it to a DB then sending the user a verifcation of their submission

    const values = view.state.values;
    console.log(values);

    await createFile(
      values["block_title"]["plain_text_input-action"].value,
      async function (url) {
        let elementsToAdd = []
        console.log('value', values["block_url"]["plain_text_input-action".value])
        if (values["block_url"]["plain_text_input-action".value] !== undefined) {
          elementsToAdd = [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Join Video Call",
                emoji: true,
              },
              url: values["block_url"]["plain_text_input-action"].value,
              value: "join",
            },
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Meeting Notes",
                emoji: true,
              },
              url: url,
              value: "join",
            },
          ];
        } else {
          elementsToAdd = [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Meeting Notes",
                emoji: true,
              },
              url: url,
              value: "join",
            },
          ];
        }

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
                  text: values["block_title"]["plain_text_input-action"].value,
                  emoji: true,
                },
              },
              {
                type: "section",
                text: {
                  type: "plain_text",
                  text: values["block_time"]["timepicker-action"].selected_time,
                  emoji: true,
                },
              },
              {
                type: "actions",
                elements: elementsToAdd,
              },
            ],
          });

          console.log(result);
        } catch (error) {
          console.error(error);
        }
      }
    );
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
async function createFile(name, callback) {
  // return function () {
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
        drive.permissions.create(
          {
            resource: {
              type: "anyone",
              role: "writer",
            },
            fileId: file.data.id,
            fields: "id",
          },
          function (err, res) {
            if (err) {
              // Handle error
              console.log(err);
            } else {
              console.log(
                `https://docs.google.com/document/d/${file.data.id}/edit`
              );
              console.log("Permission ID: ", res.id);
              callback(
                `https://docs.google.com/document/d/${file.data.id}/edit`
              );
            }
          }
        );
      }
    }
  );
  // };
}


function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

// ISSUES

// Deployment -> choosing server and how login works
// Authorize opens server everytime -> need to refresh tokens and only open if need https://developers.google.com/drive/api/v3/quickstart/nodejs
// figure out refresh tokens and understand storing them
// Figure out how to put authentication in separate file
// dictionary ->
