import express from 'express';
import open from 'open';
import inquirer from 'inquirer';
import clipboardy from 'clipboardy';

const app = express();
const port = 3000;

// Replace with your Discord bot's client ID and client secret
let clientId: string;
let clientToken: string;
let clientSecret: string;

app.get('/callback', async (req, res) => {
  try {
    const code = req.query.code as string;
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `http://localhost:${port}/callback`
      })
    });

    const data = await tokenResponse.json();
    if (data.error) throw new Error(data.error);

    console.log('Access Token Response:', data);

    // something 1% fancier could be cool for no reason.
    // shouldn't be very hard to beat plain text
    res.send('You can now close this page.');
    process.exit();
  } catch (error) {
    console.error('Error exchanging code for token', error);
    res.status(500).send('An error occurred');
  }
});

inquirer.prompt([
  // from the OAuth2 section of the Discord Developer Portal
  {
    type: 'input',
    name: 'clientId',
    message: 'Enter your Discord bot\'s client ID:'
  },
  {
    type: 'input',
    name: 'clientSecret',
    message: 'Enter your Discord bot\'s client secret:'
  },
  // from the Bot section of the Discord Developer Portal
  {
    type: 'input',
    name: 'clientToken',
    message: 'Enter your Discord bot\'s token:'
  }
]).then(answers => {
  clientId = answers.clientId;
  clientToken = answers.clientToken;
  clientSecret = answers.clientSecret;

  const redirectURI = `http://localhost:${port}/callback`;
  const applicationPage = `https://discord.com/developers/applications/${clientId}/oauth2/general`;
  clipboardy.writeSync(redirectURI);

  inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `A URL has been copied to your clipboard.\nWe are about to open a link for you.\nWhen it opens, paste the URL into the "Redirects" section of your Discord bot's application page.\nBe sure to click outside of the text box and press Save Changes afterwards.\n\nConfirm when you are ready.`
    }
  ]).then(answers => {
    if (!answers.confirm) {
      console.log('Aborting.');
      process.exit();
    }

    open(applicationPage);

    inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Opening ${applicationPage}..\n\nConfirm when you are finished.`
      }
    ]).then(answers => {
      if (!answers.confirm) {
        console.log('Aborting.');
        process.exit();
      }

      const oauthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=http%3A%2F%2Flocalhost%3A${port}%2Fcallback&response_type=code&scope=identify`;

      console.log(`Opening ${oauthUrl}..\n\nComplete the OAuth flow to continue..`);

      app.listen(port, () => {
        // console.log(`Listening on http://localhost:${port}`);
        open(oauthUrl);
      });
    });
  });
});