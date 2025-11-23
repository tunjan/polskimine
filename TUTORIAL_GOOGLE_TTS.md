# How to Set Up Google Text-to-Speech (TTS)

This tutorial will guide you through the process of getting a Google Cloud API key to use high-quality voices in the application.

## Step 1: Create a Google Cloud Project

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Sign in with your Google account.
3.  Click on the project dropdown at the top of the page (it might say "Select a project").
4.  Click **"New Project"**.
5.  Give your project a name (e.g., "My Language App TTS") and click **"Create"**.
6.  Wait for the project to be created, then select it from the notifications or the project dropdown.

## Step 2: Enable the Text-to-Speech API

1.  In the Google Cloud Console, make sure your new project is selected.
2.  In the search bar at the top, type **"Cloud Text-to-Speech API"** and select it from the results.
3.  Click the **"Enable"** button.
4.  You may be asked to enable billing. Google Cloud offers a free tier that is usually sufficient for personal use, but you will need to provide a credit card to verify your identity.

## Step 3: Create an API Key

1.  After enabling the API, go to the **"Credentials"** page (you can find it in the left sidebar under "APIs & Services" > "Credentials").
2.  Click **"+ CREATE CREDENTIALS"** at the top.
3.  Select **"API key"**.
4.  A popup will appear with your new API key. **Copy this key**.

## Step 4: Configure the Application

1.  Open the application.
2.  Go to **Settings**.
3.  Navigate to the **Audio** or **TTS** section.
4.  Change the **TTS Provider** to **"Google Cloud"**.
5.  Paste your API key into the **"API Key"** field.
6.  (Optional) Click "Test" to make sure it works.
7.  Select a **Voice Model** from the list (e.g., a "Neural2" or "Wavenet" voice for better quality).

## Troubleshooting

*   **"Quota Exceeded"**: This means you have used up your free tier or daily limit. You can check your usage in the Google Cloud Console.
*   **"API Key Invalid"**: Double-check that you copied the key correctly and that the "Cloud Text-to-Speech API" is enabled for the project associated with that key.
*   **No Voices Listed**: If you select "Google Cloud" but the voice list is empty, your API key might not be working correctly yet. It can take a few minutes for a new key to become active.

## Security Note (Optional but Recommended)

To prevent others from using your API key if they find it, you can restrict it:

1.  Go back to the **"Credentials"** page in Google Cloud Console.
2.  Click on the name of your API key to edit it.
3.  Under **"API restrictions"**, select **"Restrict key"**.
4.  In the dropdown, select **"Cloud Text-to-Speech API"**.
5.  Click **"Save"**.

Now your key can only be used for Text-to-Speech, which is safer!
