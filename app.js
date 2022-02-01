/**
 * dnotes: be on the same page
 * December 2021 - February 2022
 * @file app.js
 * @author Asma Khan and Nikhil Goel
 * @contact (akhan9pink@gmail.com), (goepnik@gmail.com)
 * @brief
 * @version 0.1
 * @date 2022-02-01
 *
 * @copyright Copyright (c) 2022
 *
 */

const { App } = require("@slack/bolt");
require("dotenv").config();
const axios = require("axios");
const { google } = require("googleapis");
const http = require("http");
const url = require("url");
const opn = require("open");
const destroyer = require("server-destroy");
const fs = require("fs");

// Initializes the app with the bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// AUTHENTICATION -> Sets up the oauth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,

  //  This is where Google redirects the user after they
  //  give permission to the dnotes application
  "http://localhost:3001/oauth2callback"
);

const scopes = ["https://www.googleapis.com/auth/drive"];
const TOKEN_PATH = "token.json";
let outerFolder = "";

// Google Drive setup
const drive = google.drive({
  version: "v3",
  auth: oauth2Client,
});

(async () => {
  // Start the app
  await app.start(process.env.PORT || 3000);

  fs.readFile("googleDrive", (err, file) => {
    if (err) {
    } else {
      outerFolder = JSON.parse(file);
    }
  });

  authenticate(() => console.log("⚡️ Bolt app is running!"));
})();


/**
 * @brief
 * Listen to the app_home_opened Events API event to hear when a user opens the app from the sidebar
 * listens to an Event API after it has been subscribed to it in our app configuration.
 * This allows the app to take action when an event occurs in Slack.
 *
 * @param payload - attempts to infer the team_id based on this incoming payload
 * @param client - provided to the app's listener using the WebClient
 */
app.event("app_home_opened", async ({ payload, client }) => {
  const userId = payload.user;
  const scheduledMessages = [];

  fs.readFile("googleDrive", async (err, name) => {
    try {
      // Call the chat.postMessage method using the WebClient
      const result = await client.team.info({});

      if (err) {
        var fileMetadata = {
          name: result.team.name,
          mimeType: "application/vnd.google-apps.folder",
        };
        drive.files.create(
          {
            resource: fileMetadata,
            fields: "id",
          },
          async function (err, file) {
            if (err) {
              // Handle error
              console.error(err);
            } else {

              fs.writeFile(
                "googleDrive",
                JSON.stringify(file.data.id),
                (err) => {
                  outerFolder = file.data.id;
                  if (err) return console.error(err);
                }
              );

              try {
                // Call the chat.postMessage method using the WebClient
                const result = await client.conversations.list({});

                const channelIDArray = result.channels.map((channel) => [
                  channel.id,
                  channel.name,
                ]);

          

                for (const channel of channelIDArray) {
                  drive.files.create(
                    {
                      requestBody: {
                        "name": channel[1],
                        "appProperties": {
                          "channelID": channel[0]
                        },
                        "mimeType": "application/vnd.google-apps.folder",
                        "parents": [
                          outerFolder
                        ]
                      }
                    },
                    function (err, file) {
                      if (err) {
                        // Handle error
                        console.error(err);
                      } else {
                        console.log(file)
                      }
                    }
                  );
                }
              } catch (error) {
                console.error(error);
              }
            }
          }
        );
      } else {
        outerFolder = JSON.parse(name);
      }
    } catch (error) {
      console.error(error);
    }

    console.log(outerFolder);
  });

  try {

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
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "Create Doc",
                    emoji: true,
                  },
                  //"value": "click_me_123",
                  action_id: "create_note",
                },
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
  } catch (error) {
    console.error(error);
  }
});

/**
 * @brief
 * Listens to a user action. The use of ack() tells Slack that a request was received and then updates the
 * Slack user interface accordingly.
 *
 * @param ack - acknowledges that a request received from Slack (ack: AckFn<void> | AckFn<string | SayArguments> | AckFn<DialogValidation>)
 */
app.action("action_block", async ({ ack }) => {
  await ack();
});

/**
 * @brief
 * Listens to a user action of clicking the "join call" button. The use of ack() tells Slack that a request was received and then updates the
 * Slack user interface accordingly.
 *
 * @param ack - acknowledges that a request received from Slack (ack: AckFn<void> | AckFn<string | SayArguments> | AckFn<DialogValidation>)
 */
app.action("join_call", async ({ ack }) => {
  await ack();
});

/**
 * @brief
 * Listens to a user action of clicking the "meeting notes" button. The use of ack() tells Slack that a request was received and then updates the
 * Slack user interface accordingly.
 *
 * @param ack - acknowledges that a request received from Slack (ack: AckFn<void> | AckFn<string | SayArguments> | AckFn<DialogValidation>)
 */
app.action("meeting_notes", async ({ ack }) => {
  await ack();
});

/**
 * @brief
 * Create meeting modal is a focused surface that allows to collect user data and display dynamic information.
 * Listens to a user action of clicking the "create meeting" button. Using ack() tells Slack that a request
 * was received and then updates the Slack user interface accordingly. This function opens a modal
 * that confirms the action the user is taking. Passes the view_id, views the payload, views the identifier.
 * @param body - event body
 * @param ack - acknowledges that a request received from Slack (ack: AckFn<void> | AckFn<string | SayArguments> | AckFn<DialogValidation>)
 * @param client - request payload
 */
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
                filter: {
                  include: ["mpim", "im", "public"],
                  exclude_bot_users: true,
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
          // {
          //   type: "section",
          //   block_id: "block_sub",
          //   text: {
          //     type: "mrkdwn",
          //     text: "Sub-Folder: ",
          //   },
          //   accessory: {
          //     type: "multi_conversations_select",
          //     placeholder: {
          //       type: "plain_text",
          //       text: "Select conversations",
          //       emoji: true,
          //     },
          //     action_id: "multi_conversations_select-action",
          //   },
          // },
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
  } catch (error) {
    console.error(error);
  }
});

/**
 * @brief
 * Create note modal is a focused surface that allows to collect user data and display dynamic information.
 * Listens to a user action of clicking the "create note" button. Using ack() tells Slack that a request
 * was received and then updates the Slack user interface accordingly. This function opens a modal
 * that confirms the action the user is taking. Passes the view_id, views the payload, views the identifier.
 * @param body - event body
 * @param ack - acknowledges that a request received from Slack (ack: AckFn<void> | AckFn<string | SayArguments> | AckFn<DialogValidation>)
 * @param client - request payload
 */
app.action("create_note", async ({ body, ack, client }) => {
  // Acknowledge shortcut request
  ack();

  try {
    // Call the views.open method using the WebClient passed to listeners
    const result = await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: "modal",
        callback_id: "create_note_modal",
        title: {
          type: "plain_text",
          text: "Create Notes",
          emoji: true,
        },
        submit: {
          type: "plain_text",
          text: "Submit",
          emoji: true,
        },
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
              text: "Select a Conversation to Post Notes In: ",
              emoji: true,
            },
          },
          {
            type: "actions",
            block_id: "note_channel",
            elements: [
              {
                type: "conversations_select",
                placeholder: {
                  type: "plain_text",
                  text: "Select a conversation",
                  emoji: true,
                },
                filter: {
                  include: ["mpim", "im", "public"],
                  exclude_bot_users: true,
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
              text: "Notes Info: ",
              emoji: true,
            },
          },
          {
            type: "input",
            block_id: "note_header",
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
          // {
          //   type: "divider",
          // },
          // {
          //   type: "header",
          //   text: {
          //     type: "plain_text",
          //     text: "Optional:",
          //     emoji: true,
          //   },
          // },
          // {
          //   type: "section",
          //   text: {
          //     type: "mrkdwn",
          //     text: "Sub-Folder: ",
          //   },
          //   accessory: {
          //     type: "multi_conversations_select",
          //     placeholder: {
          //       type: "plain_text",
          //       text: "Select conversations",
          //       emoji: true,
          //     },
          //     filter: {
          //       include: ["mpim", "im", "public"],
          //       exclude_bot_users: true,
          //     },
          //     action_id: "multi_conversations_select-action",
          //   },
          // },
        ],
      },
    });
  } catch (error) {
    console.error(error);
  }
});

/**
 * @brief
 * Handle a view_submission request for "create meeting" from modal. Passes the view_id, views the payload, views the identifier.
 * @param ack - acknowledges that a request received from Slack (ack: AckFn<void> | AckFn<string | SayArguments> | AckFn<DialogValidation>)
 * @param body - event body
 * @param view - get the value from the input block
 * @param client - request payload
 * @param logger - logging functionality for the application
 */
app.view(
  "create_meeting_modal",
  async ({ ack, body, view, client, logger }) => {
    // Acknowledge the view_submission request
    await ack();

    // Do whatever you want with the input data - here we're saving it to a DB then sending the user a verifcation of their submission

    const values = view.state.values;

    const hoursBefore = 1;

    // unix time stamp
    const time = values["block_time"]["timepicker-action"].selected_time;
    const date = values["block_date"]["datepicker-action"].selected_date;
    const combined = date.concat(" ", time);
    let unixTimeStamp =
      new Date(combined).getTime() / 1000 - 3600 * hoursBefore;
    const currentTime = (Date.now() / 1000) | 0;

    if (currentTime > unixTimeStamp) {
      unixTimeStamp = currentTime + 15;
    }

    var date2 = new Date(unixTimeStamp * 1000);
    // Hours part from the timestamp
    var hours = date2.getHours();
    // Minutes part from the timestamp
    var minutes = "0" + date2.getMinutes();
    // Seconds part from the timestamp
    var seconds = "0" + date2.getSeconds();

    // Will display time in 10:30:23 format
    var formattedTime =
      hours + ":" + minutes.substr(-2) + ":" + seconds.substr(-2);

    await createFile(
      values["block_title"]["plain_text_input-action"].value,
      values["block_conversation"]["action_block"].selected_conversation,
      async function (url) {
        let elementsToAdd = [];
        if (
          isValidHttpUrl(values["block_url"]["plain_text_input-action"].value)
        ) {
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
              action_id: "join_call",
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
              action_id: "meeting_notes",
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
              action_id: "meeting_notes",
            },
          ];
        }

        try {
          const fileId = getFileID(url);
          getUsersFromChannel(
            values["block_conversation"]["action_block"].selected_conversation,
            client,
            createUsers,
            "writer",
            fileId
          );

          // Call the chat.postMessage method using the WebClient
          const result = await client.chat.scheduleMessage({
            channel:
              values["block_conversation"]["action_block"]
                .selected_conversation,
            text: `Meeting at ${values["block_date"]["datepicker-action"].selected_date} ${values["block_time"]["timepicker-action"].selected_time}. ${url} to join meeting!`,
            post_at: unixTimeStamp,
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
              {
                type: "divider",
              },
              {
                type: "actions",
                elements: [
                  {
                    type: "checkboxes",
                    options: [
                      {
                        text: {
                          type: "plain_text",
                          text: "Is the Meeting Complete?",
                          emoji: true,
                        },
                        description: {
                          type: "plain_text",
                          text: "Check the box to indicate a completed meeting",
                          emoji: true,
                        },
                        value: url,
                      },
                    ],
                    action_id: "actionId-1",
                  },
                ],
              },
            ],
          });

          // console.log(result);
        } catch (error) {
          console.error(error);
        }
      }
    );
  }
);

/**
 * @brief
 * Handle a view_submission request for "create note" from modal. Passes the view_id, views the payload, views the identifier.
 * @param ack - acknowledges that a request received from Slack (ack: AckFn<void> | AckFn<string | SayArguments> | AckFn<DialogValidation>)
 * @param body - event body
 * @param view - get the value from the input block
 * @param client - request payload
 * @param logger - logging functionality for the application
 */
app.view("create_note_modal", async ({ ack, body, view, client, logger }) => {
  // Acknowledge the view_submission request
  await ack();

  // Do whatever you want with the input data - here we're saving it to a DB then sending the user a verifcation of their submission

  const values = view.state.values;

  await createFile(
    values["note_header"]["plain_text_input-action"].value,
    values["note_channel"]["action_block"].selected_conversation,
    async function (url) {
      try {
        // Call the chat.postMessage method using the WebClient
        const result = await client.chat.postMessage({
          channel: values["note_channel"]["action_block"].selected_conversation,
          text: `Google doc created in ${values["note_channel"]["action_block"].selected_conversation} channel. Click ${url} to see!`,
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: values["note_header"]["plain_text_input-action"].value,
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
                    text: "Notes",
                    emoji: true,
                  },
                  url: url,
                  value: "join",
                  action_id: "meeting_notes",
                },
              ],
            },
          ],
        });

        // console.log(result);
      } catch (error) {
        console.error(error);
      }
    }
  );
});

/**
 * @brief
 * Creates...
 * @param url - event body
 */
function getFileID(url) {
  return url.split("/d/").pop().split("/edit")[0];
}

/**
 * @brief
 * Action handler for a check box action for message preview type.
 * @param body - event body
 * @param ack - acknowledges that a request received from Slack (ack: AckFn<void> | AckFn<string | SayArguments> | AckFn<DialogValidation>)
 * @param client - request payload
 */
app.action("actionId-1", async ({ ack, body, view, client, logger }) => {
  await ack();

  const isChecked =
    Array.isArray(body.actions[0].selected_options) &&
    body.actions[0].selected_options.length;
  const fileId = getFileID(body.message.text.match(/\<(.*?)\>/)[0]);

  drive.permissions.list(
    {
      fileId: fileId,
    },
    function (err, res) {
      if (err) {
        // Handle error
        console.log(err);
      } else {
        const permissions = res.data.permissions;
        for (const permission of permissions) {
          if (permission.role !== "owner") {
            role = isChecked ? "reader" : "writer";
            drive.permissions.update(
              {
                fileId: fileId,
                permissionId: permission.id,
                resource: {
                  role: role,
                },
              },
              function (err, res) {
                if (err) {
                  // Handle error
                  console.log(err);
                } else {
                  // console.log(res);
                }
              }
            );
          }
        }
      }
    }
  );

  if (isChecked) {
    // have to do this new -> permissions.list and then permissions.update
    // getUsersFromChannel(body.channel.id, client, createUsers, "reader", fileId);
  } else {
    // getUsersFromChannel(body.channel.id, client, createUsers, "writer", fileId);
  }
});

/**
 * @brief
 * Creates...
 * @param users -
 * @param role -
 * @param fileID -
 */
function createUsers(users, role, fileId) {
  var filteredUsers = users.filter((x) => x !== undefined);

  for (const user of filteredUsers) {
    drive.permissions.create(
      {
        resource: {
          type: "user",
          role: role,
          emailAddress: user,
        },
        fileId: fileId,
        fields: "id",
      },
      function (err, res) {
        if (err) {
          // Handle error
          console.log(err);
        } else {
          // console.log("DONE (writer)!")
        }
      }
    );
  }
}

/**
 * @brief
 * Creates...
 * @param channelId -
 * @param client -
 * @param callback -
 * @param role -
 * @param fileID-
 */
async function getUsersFromChannel(channelId, client, callback, role, fileId) {
  let users = [];
  try {
    // Call the users.info method using the WebClient
    const result = await client.conversations.members({
      channel: channelId,
    });
    const members = result.members;
    for (const member of members) {
      try {
        // Call the users.info method using the WebClient
        const result = await client.users.info({
          user: member,
        });

        // console.log(result);
        users.push(result.user.profile.email);
      } catch (error) {
        console.error(error);
      }
    }
    callback(users, role, fileId);
  } catch (error) {
    console.error(error);
  }
}

/**
 * @brief Reading from file to see if already have token
 * @param callback -
 * @returns -
 */
async function authenticate(callback) {
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(callback);
    oauth2Client.setCredentials(JSON.parse(token));
    callback();
  });
}

/**
 * @brief Open an http server to accept the oauth callback.
 *
 * @param callback -
 * @returns -
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
            const qs = new url.URL(req.url, "http://localhost:3001")
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
      .listen(3001, () => {
        // open the browser to the authorize url to start the workflow
        opn(authorizeUrl, { wait: false }).then((cp) => cp.unref());
      });
    destroyer(server);
  });
}

/**
 * @brief
 * Creates a file in google drive
 * ATTENTION: NEED TO FIGURE OUT PARENT THING TO PUT IN CORRECT FODLDER (pass in parents array)
 *
 * @param {String} name - name of file you want created
 * @param callback -
 * @returns - url of file
 */
async function createFile(name, channel, callback) {
  drive.files.list(
    {
      q: `'${outerFolder}' in parents and mimeType='application/vnd.google-apps.folder'`,
      fields: "*",
    },
    function (err, folder) {
      if (err) {
        // Handle error
        console.error(err);
      } else {
        let id = "";
        for (const fold of folder.data.files) {
          
          if (fold.appProperties.channelID === channel) {
            id = fold.id;
          }
        }

        drive.files.create(
          {
            requestBody: {
              mimeType: "application/vnd.google-apps.document",
              name: name,
              parents: [id], //"14W6W_jCUxuFI56ZJKYdIPjkeGUtWC65I",
            },
          },
          function (err, file) {
            if (err) {
              // Handle error
              console.error(err);
            } else {
              callback(
                `https://docs.google.com/document/d/${file.data.id}/edit`
              );
            }
          }
        );
      }
    }
  );
  // return function () {

  // };
}

/**
 * @brief
 * Creates...
 *
 * @param {String} name - name of file you want created
 * @returns - url of file
 */
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

// TODO:
// - on add channel/delete channel add appropriate folder
// - add permissions to google drive folders
// - make it look prettier (MESSAGE & HOME PAGE)
// - remove subfolders
// - recurring meetings
// - upcoming & past meetings
// - shortcuts & slash commands


// - review app
// - create video
// - edit submission
// - 